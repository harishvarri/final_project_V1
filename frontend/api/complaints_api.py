"""
Complaints API endpoints with Supabase integration.
"""
import logging
import re
from datetime import datetime, timezone
from urllib.parse import urljoin

from flask import jsonify, request

from storage_utils import upload_filestorage_to_supabase
from supabase_client import get_supabase_client, get_supabase_unavailable_reason, is_supabase_configured

logger = logging.getLogger(__name__)

VALID_STATUSES = ['submitted', 'assigned', 'in_progress', 'waiting_approval', 'resolved', 'closed', 'reopened', 'in_review', 'rejected']
VALID_DEPARTMENTS = [
    'Road Department',
    'Sanitation Department',
    'Drainage Department',
    'Electrical Department',
    'Water Supply Department',
    'Infrastructure Department',
    'Urban Planning Department'
]
VALID_ROLES = ['citizen', 'officer', 'worker', 'admin']
FEEDBACK_TO_STATUS = {
    'solved': 'closed',
    'partially_solved': 'in_review',
    'not_solved': 'reopened',
}
WORKER_ROLE_HINT = (
    "The Supabase users.role constraint still looks outdated. "
    "Run supabase_users_role_fix.sql in the Supabase SQL Editor, then try again."
)


def register_complaints_api(app):
    """Register complaints API routes."""

    def utc_now():
        return datetime.now(timezone.utc).isoformat()

    def supabase_or_error():
        if not is_supabase_configured():
            return None, (
                jsonify({"error": get_supabase_unavailable_reason()}),
                503,
            )
        return get_supabase_client(), None

    def normalize_media_url(value):
        if not value:
            return ""
        if isinstance(value, str) and (
            value.startswith("http://")
            or value.startswith("https://")
            or value.startswith("data:")
            or value.startswith("blob:")
        ):
            return value
        return urljoin(request.host_url, value.lstrip("/"))

    def serialize_complaint(complaint):
        complaint = dict(complaint)
        for key in ("image_url", "proof_url", "citizen_voice_url", "worker_voice_url"):
            complaint[key] = normalize_media_url(complaint.get(key))
        return complaint

    def normalize_role_assignment_error(error):
        message = str(error or "")
        lowered = message.lower()
        if "role" in lowered and "check" in lowered:
            return WORKER_ROLE_HINT
        if "violates check constraint" in lowered:
            return WORKER_ROLE_HINT
        return message

    def extract_missing_column(error_obj):
        message = ""
        if isinstance(error_obj, dict):
            message = error_obj.get("message") or ""
        else:
            message = str(error_obj or "")
        match = re.search(r"Could not find the '([^']+)' column", message)
        return match.group(1) if match else None

    def update_complaint_with_retry(supabase, complaint_id, update_data, optional_fields=None):
        payload = dict(update_data)
        optional_fields = set(optional_fields or [])
        removed_fields = []

        for _ in range(len(optional_fields) + 1):
            response = None
            error = None
            try:
                response = supabase.from_('complaints').update(payload).eq('id', complaint_id).execute()
                error = getattr(response, "error", None)
            except Exception as exc:
                error = exc

            if error:
                missing_field = extract_missing_column(error)
                if missing_field and missing_field in payload and missing_field in optional_fields:
                    removed_fields.append(missing_field)
                    payload.pop(missing_field, None)
                    continue
                return None, error

            if response and response.data:
                return response.data[0], removed_fields

            return None, "Complaint not found"

        return None, f"Update failed after removing optional fields: {removed_fields}"

    @app.route("/api/complaints", methods=["GET"])
    def get_complaints():
        try:
            supabase, error_response = supabase_or_error()
            if error_response:
                return error_response

            user_email = request.args.get('user_email')
            user_role = request.args.get('user_role')
            user_dept = request.args.get('user_dept')

            if not user_role:
                return jsonify({"error": "Missing user role"}), 400
            if user_role not in VALID_ROLES:
                return jsonify({"error": "Invalid role"}), 400

            query = supabase.from_('complaints').select('*').order('created_at', desc=True)

            if user_role == 'admin':
                pass
            elif user_role == 'officer':
                if user_dept:
                    query = query.ilike('department', f'%{user_dept}%')
            elif user_role == 'worker':
                if not user_email:
                    return jsonify({"error": "Missing user email"}), 400
                query = query.eq('worker_id', user_email)
            else:
                if not user_email:
                    return jsonify({"error": "Missing user email"}), 400
                query = query.eq('user_email', user_email)

            response = query.execute()
            complaints = [serialize_complaint(row) for row in (response.data or [])]
            return jsonify(complaints), 200

        except Exception as e:
            logger.error("Error fetching complaints: %s", e)
            return jsonify({"error": "Failed to fetch complaints"}), 500

    @app.route("/api/complaints/<complaint_id>", methods=["PATCH"])
    def update_complaint(complaint_id):
        try:
            supabase, error_response = supabase_or_error()
            if error_response:
                return error_response

            user_email = request.args.get('user_email')
            user_role = request.args.get('user_role')
            data = request.get_json(silent=True) or {}

            if not user_role:
                return jsonify({"error": "Missing user role"}), 400
            if user_role not in ['admin', 'officer', 'worker']:
                return jsonify({"error": "Unauthorized"}), 403

            existing = supabase.from_('complaints').select('*').eq('id', complaint_id).limit(1).execute()
            if not existing.data:
                return jsonify({"error": "Complaint not found"}), 404
            complaint = existing.data[0]

            new_status = data.get('status')
            if new_status and new_status not in VALID_STATUSES:
                return jsonify({"error": f"Invalid status. Must be one of {VALID_STATUSES}"}), 400

            new_dept = data.get('department')
            if new_dept and new_dept not in VALID_DEPARTMENTS:
                return jsonify({"error": "Invalid department"}), 400

            if user_role == 'worker':
                if complaint.get('worker_id') != user_email:
                    return jsonify({"error": "Workers can only update their own assigned complaints"}), 403
                if new_status != 'in_progress':
                    return jsonify({"error": "Workers can only mark assigned complaints as in_progress"}), 403
                blocked_fields = {'department', 'worker_id', 'rejection_reason', 'proof_url'}
                if any(field in data for field in blocked_fields):
                    return jsonify({"error": "Workers cannot modify assignment or review fields"}), 403

            update_data = {}
            if new_status:
                update_data['status'] = new_status
            if new_dept:
                update_data['department'] = new_dept
            if 'worker_id' in data:
                update_data['worker_id'] = data.get('worker_id')
            if 'notes' in data:
                update_data['notes'] = data.get('notes')
            if 'rejection_reason' in data:
                update_data['rejection_reason'] = data.get('rejection_reason')
            if 'proof_url' in data:
                update_data['proof_url'] = data.get('proof_url')
            if 'updated_at' not in update_data:
                update_data['updated_at'] = utc_now()

            if not update_data:
                return jsonify({"error": "No valid fields to update"}), 400

            if update_data.get('worker_id') and 'status' not in update_data:
                update_data['status'] = 'assigned'
            if update_data.get('status') == 'resolved':
                update_data['rejection_reason'] = None
                update_data['citizen_feedback'] = None
                update_data['feedback_comment'] = None
                update_data['feedback_submitted_at'] = None

            response = supabase.from_('complaints').update(update_data).eq('id', complaint_id).execute()

            if not response.data:
                return jsonify({"error": "Complaint not found"}), 404

            logger.info("Updated complaint %s: %s", complaint_id, update_data)
            return jsonify(serialize_complaint(response.data[0])), 200

        except Exception as e:
            logger.error("Error updating complaint: %s", e)
            return jsonify({"error": "Failed to update complaint"}), 500

    @app.route("/api/complaints/<complaint_id>/feedback", methods=["POST"])
    def submit_citizen_feedback(complaint_id):
        try:
            supabase, error_response = supabase_or_error()
            if error_response:
                return error_response

            user_email = (request.args.get('user_email') or '').strip().lower()
            if not user_email:
                return jsonify({"error": "Missing user email"}), 400

            data = request.get_json(silent=True) or {}
            feedback = (data.get('feedback') or '').strip().lower()
            comment = (data.get('comment') or '').strip() or None

            if feedback not in FEEDBACK_TO_STATUS:
                return jsonify({
                    "error": f"Invalid feedback. Must be one of {list(FEEDBACK_TO_STATUS.keys())}"
                }), 400

            existing = supabase.from_('complaints').select('*').eq('id', complaint_id).limit(1).execute()
            if not existing.data:
                return jsonify({"error": "Complaint not found"}), 404

            complaint = existing.data[0]
            complaint_owner = (complaint.get('user_email') or '').strip().lower()
            if complaint_owner != user_email:
                return jsonify({"error": "You can only submit feedback for your own complaints"}), 403

            if complaint.get('status') != 'resolved':
                return jsonify({
                    "error": "Feedback can only be submitted after the officer marks the issue as resolved."
                }), 400

            update_data = {
                "citizen_feedback": feedback,
                "feedback_comment": comment,
                "feedback_submitted_at": utc_now(),
                "status": FEEDBACK_TO_STATUS[feedback],
                "updated_at": utc_now(),
            }

            response = supabase.from_('complaints').update(update_data).eq('id', complaint_id).execute()
            if not response.data:
                return jsonify({"error": "Complaint not found"}), 404

            logger.info("Citizen feedback submitted for complaint %s: %s", complaint_id, feedback)
            return jsonify({
                "success": True,
                "message": "Feedback submitted successfully",
                "complaint": serialize_complaint(response.data[0]),
            }), 200

        except Exception as e:
            logger.error("Error submitting citizen feedback: %s", e)
            return jsonify({"error": "Failed to submit feedback", "details": str(e)}), 500

    @app.route("/api/complaints/<complaint_id>/proof", methods=["POST"])
    def upload_proof(complaint_id):
        try:
            supabase, error_response = supabase_or_error()
            if error_response:
                return error_response

            if "image" not in request.files:
                return jsonify({"error": "Missing proof image"}), 400

            image_file = request.files["image"]
            voice_file = request.files.get("voice")

            if image_file.filename == "":
                return jsonify({"error": "No proof image selected"}), 400

            try:
                proof_url = upload_filestorage_to_supabase(
                    image_file,
                    bucket_name="complaints",
                    path_prefix="proof",
                    default_extension=".jpg",
                )
            except Exception as e:
                logger.error("Proof image upload failed: %s", e)
                return jsonify({"error": f"Failed to upload proof image: {str(e)}"}), 500

            voice_url = None
            if voice_file and voice_file.filename != "":
                try:
                    try:
                        voice_file.stream.seek(0)
                    except Exception:
                        pass
                    voice_url = upload_filestorage_to_supabase(
                        voice_file,
                        bucket_name="complaints",
                        path_prefix="voice/worker",
                        default_extension=".webm",
                    )
                except Exception as e:
                    logger.warning("Worker voice upload failed: %s", e)

            update_data = {
                "proof_url": proof_url,
                "status": "waiting_approval",
                "updated_at": utc_now(),
            }
            if voice_url:
                update_data["worker_voice_url"] = voice_url

            updated_row, update_result = update_complaint_with_retry(
                supabase,
                complaint_id,
                update_data,
                optional_fields={"worker_voice_url", "updated_at"},
            )

            if not updated_row:
                if str(update_result) == "Complaint not found":
                    return jsonify({"error": "Complaint not found"}), 404
                return jsonify({
                    "error": "Failed to update complaint after proof upload",
                    "details": str(update_result),
                }), 500

            logger.info("Proof uploaded for complaint %s", complaint_id)
            return jsonify({
                "success": True,
                "message": "Proof uploaded and sent to officer for approval",
                "complaint": serialize_complaint(updated_row),
                "ignored_optional_fields": update_result,
            }), 200

        except Exception as e:
            logger.error("Error uploading proof: %s", e)
            return jsonify({"error": "Failed to upload proof", "details": str(e)}), 500

    @app.route("/api/analytics", methods=["GET"])
    def get_analytics():
        try:
            supabase, error_response = supabase_or_error()
            if error_response:
                return error_response

            response = supabase.from_('complaints').select('*').execute()
            complaints = response.data or []

            total = len(complaints)
            resolved = len([c for c in complaints if c.get('status') == 'closed'])
            pending = len([
                c for c in complaints
                if c.get('status') in ['submitted', 'assigned', 'in_progress', 'waiting_approval', 'resolved', 'reopened', 'in_review']
            ])

            categories = {}
            departments = {}
            statuses = {}
            for complaint in complaints:
                category = complaint.get('category', 'unknown')
                department = complaint.get('department', 'Unknown')
                status = complaint.get('status', 'unknown')
                categories[category] = categories.get(category, 0) + 1
                departments[department] = departments.get(department, 0) + 1
                statuses[status] = statuses.get(status, 0) + 1

            return jsonify({
                "total": total,
                "resolved": resolved,
                "pending": pending,
                "categories": categories,
                "departments": departments,
                "statuses": statuses
            }), 200

        except Exception as e:
            logger.error("Error fetching analytics: %s", e)
            return jsonify({"error": "Failed to fetch analytics"}), 500

    @app.route("/api/user-complaints", methods=["GET"])
    def get_user_complaints():
        try:
            supabase, error_response = supabase_or_error()
            if error_response:
                return error_response

            user_email = request.args.get('user_email')
            if not user_email:
                return jsonify({"error": "Missing user email"}), 400

            response = (
                supabase
                .from_('complaints')
                .select('*')
                .eq('user_email', user_email)
                .order('created_at', desc=True)
                .execute()
            )

            complaints = [serialize_complaint(row) for row in (response.data or [])]
            return jsonify(complaints), 200

        except Exception as e:
            logger.error("Error fetching user complaints: %s", e)
            return jsonify({"error": "Failed to fetch complaints"}), 500

    @app.route("/api/admin/users", methods=["GET"])
    def get_all_users():
        try:
            supabase, error_response = supabase_or_error()
            if error_response:
                return error_response

            admin_role = request.args.get('admin_role')
            if admin_role != 'admin':
                return jsonify({"error": "Unauthorized - Admin access required"}), 403

            response = supabase.from_('users').select('*').execute()
            return jsonify(response.data or []), 200

        except Exception as e:
            logger.error("Error fetching users: %s", e)
            return jsonify({"error": "Failed to fetch users"}), 500

    @app.route("/api/admin/users/assign-role", methods=["POST"])
    def assign_user_role():
        try:
            supabase, error_response = supabase_or_error()
            if error_response:
                return error_response

            admin_role = request.args.get('admin_role')
            if admin_role != 'admin':
                return jsonify({"error": "Unauthorized - Admin access required"}), 403

            data = request.get_json(silent=True) or {}
            target_email = (data.get('email') or '').strip().lower()
            new_role = (data.get('role') or 'citizen').strip().lower()
            department = data.get('department')

            if not target_email:
                return jsonify({"error": "Missing email"}), 400

            valid_roles = ['citizen', 'officer', 'worker', 'admin']
            if new_role not in valid_roles:
                return jsonify({"error": f"Invalid role. Must be one of {valid_roles}"}), 400

            check_response = supabase.from_('users').select('*').eq('email', target_email).execute()
            check_error = getattr(check_response, "error", None)
            if check_error:
                logger.error("User lookup failed: %s", check_error)
                return jsonify({"error": "Failed to lookup user", "details": str(check_error)}), 500

            if check_response.data:
                update_data = {'role': new_role, 'department': department or None}
                response = supabase.from_('users').update(update_data).eq('email', target_email).execute()
                error = getattr(response, "error", None)

                if error:
                    logger.error("User role update failed: %s", error)
                    return jsonify({
                        "error": normalize_role_assignment_error(error),
                        "details": str(error)
                    }), 400
                if response.data:
                    logger.info("Updated user %s: role=%s, dept=%s", target_email, new_role, department)
                    return jsonify({
                        "success": True,
                        "message": f"User {target_email} role updated to {new_role}",
                        "user": response.data[0]
                    }), 200

                verify_response = supabase.from_('users').select('*').eq('email', target_email).limit(1).execute()
                if verify_response.data:
                    logger.info("Updated user %s after empty update response: role=%s, dept=%s", target_email, new_role, department)
                    return jsonify({
                        "success": True,
                        "message": f"User {target_email} role updated to {new_role}",
                        "user": verify_response.data[0]
                    }), 200
                return jsonify({"error": "Failed to update user"}), 500

            new_user = {
                'email': target_email,
                'role': new_role,
                'department': department or None
            }

            response = supabase.from_('users').insert([new_user]).execute()
            error = getattr(response, "error", None)

            if error:
                logger.error("User create failed: %s", error)
                return jsonify({
                    "error": normalize_role_assignment_error(error),
                    "details": str(error)
                }), 400
            if response.data:
                logger.info("Created new user: %s, role=%s", target_email, new_role)
                return jsonify({
                    "success": True,
                    "message": f"New user {target_email} created with role {new_role}",
                    "user": response.data[0]
                }), 201

            verify_response = supabase.from_('users').select('*').eq('email', target_email).limit(1).execute()
            if verify_response.data:
                logger.info("Created user %s after empty insert response: role=%s", target_email, new_role)
                return jsonify({
                    "success": True,
                    "message": f"New user {target_email} created with role {new_role}",
                    "user": verify_response.data[0]
                }), 201
            return jsonify({"error": "Failed to create user"}), 500

        except Exception as e:
            logger.error("Error assigning user role: %s", e)
            return jsonify({
                "error": normalize_role_assignment_error(e) or "Failed to assign role",
                "details": str(e)
            }), 500
