import base64
import json
import logging
import mimetypes
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image
from flask import Flask, jsonify, request
from flask_cors import CORS

from complaints_api import register_complaints_api
from config import CATEGORIES, CONFIDENCE_THRESHOLD, IMG_SIZE, MODEL_PATH
from storage_utils import upload_filestorage_to_supabase
from supabase_client import (
    get_supabase_client,
    get_supabase_dependency_error,
    get_supabase_unavailable_reason,
    is_supabase_configured,
)

try:
    import tensorflow as tf
except Exception as e:
    tf = None
    _tensorflow_import_error = str(e)
else:
    _tensorflow_import_error = ""

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
supabase = get_supabase_client()
model = None
model_load_error = None
gradio_client_error = None

# Register complaints API endpoints
register_complaints_api(app)

# Category to Department mapping
CATEGORY_TO_DEPARTMENT = {
    "dead_animals": "Sanitation Department",
    "garbage": "Sanitation Department",
    "illegal_dumping": "Sanitation Department",
    "pothole": "Road Department",
    "sewer": "Water Supply Department",
    "streetlight": "Electrical Department",
    "waterlogging": "Drainage Department"
}

CATEGORY_ALIASES = {
    "dead_animal": "dead_animals",
    "deadanimals": "dead_animals",
    "illegaldumping": "illegal_dumping",
    "illegal_dump": "illegal_dumping",
    "illegal_dumps": "illegal_dumping",
    "sewage": "sewer",
    "sewage_issue": "sewer",
    "sewage_issues": "sewer",
    "sewerage": "sewer",
    "street_light": "streetlight",
    "street_lights": "streetlight",
    "streetlight_problem": "streetlight",
    "streetlight_problems": "streetlight",
    "water_logging": "waterlogging",
    "water_logged": "waterlogging",
}

MODEL_BACKEND = os.environ.get("MODEL_BACKEND", "auto").strip().lower()
GRADIO_MODEL_API_URL = os.environ.get("GRADIO_MODEL_API_URL", "https://4dcf97b9438c1f4ced.gradio.live/").strip()


def predict(img):
    """Predict civic issue category from an image."""
    model_instance = get_model()
    if model_instance is None:
        raise RuntimeError(model_load_error or "Model not available")

    img = img.resize((IMG_SIZE, IMG_SIZE))
    img = np.array(img) / 255.0
    img = np.expand_dims(img, axis=0)

    pred = model_instance.predict(img, verbose=0)[0]
    
    predictions = []
    for idx, score in enumerate(pred):
        predictions.append({
            "category": CATEGORIES[idx],
            "confidence": float(score)
        })
    
    predictions.sort(key=lambda x: x["confidence"], reverse=True)
    
    top_pred = predictions[0]["category"]
    top_conf = float(predictions[0]["confidence"])

    return predictions, top_pred, top_conf


def get_department_from_category(category):
    return CATEGORY_TO_DEPARTMENT.get(category, "General Department")


def normalize_category_key(category):
    if not category:
        return None

    normalized = re.sub(r"[^a-z0-9]+", "_", str(category).strip().lower()).strip("_")
    if not normalized:
        return None

    if normalized in CATEGORIES:
        return normalized

    collapsed = normalized.replace("_", "")
    for candidate in CATEGORIES:
        if candidate.replace("_", "") == collapsed:
            return candidate

    return CATEGORY_ALIASES.get(normalized)


def coerce_confidence(value, default=0.0):
    if value in (None, ""):
        return default

    try:
        confidence = float(value)
    except (TypeError, ValueError):
        return default

    if confidence > 1 and confidence <= 100:
        confidence /= 100

    return max(0.0, min(confidence, 1.0))


def normalize_prediction_rows(rows):
    normalized_rows = []
    seen_categories = set()

    for row in rows or []:
        if not isinstance(row, dict):
            continue

        category = normalize_category_key(row.get("category") or row.get("label"))
        if not category or category in seen_categories:
            continue

        confidence = coerce_confidence(row.get("confidence"), default=0.0)
        normalized_rows.append({
            "category": category,
            "confidence": confidence,
        })
        seen_categories.add(category)

    normalized_rows.sort(key=lambda item: item["confidence"], reverse=True)
    return normalized_rows


def normalize_gradio_prediction_result(result):
    if result is None:
        raise ValueError("Gradio API returned no prediction data")

    if isinstance(result, list) and result:
        if len(result) >= 4 and isinstance(result[0], str):
            category = normalize_category_key(result[0])
            confidence = coerce_confidence(result[2], default=0.0)
            top_rows = []

            for line in str(result[3] or "").splitlines():
                if ":" not in line:
                    continue
                label_part, score_part = line.split(":", 1)
                parsed_category = normalize_category_key(label_part)
                parsed_confidence = coerce_confidence(score_part, default=None)
                if parsed_category and parsed_confidence is not None:
                    top_rows.append({
                        "category": parsed_category,
                        "confidence": parsed_confidence,
                    })

            if not top_rows and category:
                top_rows = [{"category": category, "confidence": confidence}]
            if not top_rows:
                raise ValueError("Gradio response did not contain valid category confidences")

            top_rows.sort(key=lambda item: item["confidence"], reverse=True)
            top_prediction = top_rows[0]
            return top_rows, top_prediction["category"], top_prediction["confidence"]

        return normalize_gradio_prediction_result(result[0])

    if isinstance(result, dict):
        if isinstance(result.get("label"), str):
            label = normalize_category_key(result.get("label"))
            confidences = normalize_prediction_rows(result.get("confidences"))
            if not confidences and label:
                confidences = [{"category": label, "confidence": 0.0}]
            if not confidences:
                raise ValueError("Gradio response did not contain valid category confidences")
            top_prediction = confidences[0]
            return confidences, top_prediction["category"], top_prediction["confidence"]

        numeric_entries = []
        for key, value in result.items():
            category = normalize_category_key(key)
            if category is None:
                continue
            try:
                confidence = float(value)
            except (TypeError, ValueError):
                continue
            numeric_entries.append({
                "category": category,
                "confidence": coerce_confidence(confidence, default=0.0),
            })

        if numeric_entries:
            numeric_entries.sort(key=lambda item: item["confidence"], reverse=True)
            top_prediction = numeric_entries[0]
            return numeric_entries, top_prediction["category"], top_prediction["confidence"]

    if isinstance(result, str):
        category = normalize_category_key(result)
        if category:
            return [{"category": category, "confidence": 0.0}], category, 0.0

    raise ValueError(f"Unsupported Gradio response format: {type(result).__name__}")


def get_gradio_base_url():
    if not GRADIO_MODEL_API_URL:
        return ""
    return GRADIO_MODEL_API_URL.rstrip("/")


def predict_with_gradio_backend(file_storage):
    try:
        global gradio_client_error

        gradio_base_url = get_gradio_base_url()
        if not gradio_base_url:
            gradio_client_error = "GRADIO_MODEL_API_URL is not configured"
            raise RuntimeError(gradio_client_error)

        filename = file_storage.filename or "upload.jpg"
        mime_type = file_storage.mimetype or mimetypes.guess_type(filename)[0] or "image/jpeg"

        try:
            file_storage.stream.seek(0)
        except Exception:
            pass

        file_bytes = file_storage.read()
        if not file_bytes:
            raise ValueError("Uploaded image file was empty")

        boundary = f"----gradio-upload-{int(time.time() * 1000)}"
        multipart_body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="files"; filename="{filename}"\r\n'
            f"Content-Type: {mime_type}\r\n\r\n"
        ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

        upload_request = urllib.request.Request(
            f"{gradio_base_url}/upload",
            data=multipart_body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST",
        )

        with urllib.request.urlopen(upload_request, timeout=45) as response:
            upload_response_body = response.read().decode("utf-8")

        uploaded_paths = json.loads(upload_response_body)
        if not isinstance(uploaded_paths, list) or not uploaded_paths:
            raise RuntimeError("Gradio upload did not return a server file path")

        request_body = json.dumps({
            "data": [{"path": uploaded_paths[0]}]
        }).encode("utf-8")

        predict_request = urllib.request.Request(
            f"{gradio_base_url}/call/predict",
            data=request_body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(predict_request, timeout=45) as response:
            predict_response_body = response.read().decode("utf-8")

        predict_payload = json.loads(predict_response_body)
        event_id = predict_payload.get("event_id")
        if not event_id:
            raise RuntimeError("Gradio predict call did not return an event id")

        with urllib.request.urlopen(f"{gradio_base_url}/call/predict/{event_id}", timeout=60) as response:
            event_response_body = response.read().decode("utf-8")

        data_line = next(
            (line for line in event_response_body.splitlines() if line.startswith("data: ")),
            None,
        )
        if not data_line:
            raise RuntimeError("Gradio event stream did not include prediction data")

        result = json.loads(data_line[6:])

        normalized = normalize_gradio_prediction_result(result)
        gradio_client_error = None
        return normalized
    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="ignore")
        gradio_client_error = f"Gradio API HTTP {error.code}: {error_body[:300] or error.reason}"
        raise RuntimeError(gradio_client_error) from error
    except Exception as error:
        gradio_client_error = str(error)
        raise RuntimeError(gradio_client_error) from error
    finally:
        try:
            file_storage.stream.seek(0)
        except Exception:
            pass


def extract_external_prediction():
    category = normalize_category_key(request.form.get("prediction_category"))
    confidence = coerce_confidence(request.form.get("prediction_confidence"), default=None)

    if not category or confidence is None:
        return None

    top_predictions = []
    raw_top_predictions = request.form.get("prediction_top3")
    if raw_top_predictions:
        try:
            parsed_top_predictions = json.loads(raw_top_predictions)
        except json.JSONDecodeError:
            parsed_top_predictions = []
        top_predictions = normalize_prediction_rows(parsed_top_predictions)

    if not top_predictions:
        top_predictions = [{"category": category, "confidence": confidence}]
    elif top_predictions[0]["category"] != category:
        top_predictions = [{"category": category, "confidence": confidence}] + [
            item for item in top_predictions if item["category"] != category
        ]

    return top_predictions, category, confidence


def get_model_path():
    path = Path(MODEL_PATH)
    if not path.is_absolute():
        path = Path(__file__).resolve().parent / path
    return path


def get_model():
    global model, model_load_error
    if model is not None:
        return model
    if tf is None:
        model_load_error = f"TensorFlow is unavailable: {_tensorflow_import_error or 'import failed'}"
        logger.warning(model_load_error)
        return None

    model_path = get_model_path()
    if not model_path.exists():
        model_load_error = f"Model file not found at {model_path}"
        logger.warning(model_load_error)
        return None

    try:
        model = tf.keras.models.load_model(model_path)
        model_load_error = None
        logger.info("Model loaded successfully from %s", model_path)
        return model
    except Exception as e:
        model_load_error = str(e)
        logger.error("Failed to load model: %s", e)
        return None


def parse_float_field(name, default=0.0):
    raw_value = request.form.get(name)
    if raw_value in (None, "", "0"):
        return default
    try:
        return float(raw_value)
    except (TypeError, ValueError):
        raise ValueError(f"Invalid numeric value for '{name}'")


@app.route("/api/health", methods=["GET"])
def health_check():
    model_path = get_model_path()
    return jsonify({
        "status": "ok",
        "model_backend": MODEL_BACKEND,
        "gradio_api_url": GRADIO_MODEL_API_URL or None,
        "gradio_predict_url": get_gradio_predict_url() or None,
        "gradio_transport": "http_json",
        "gradio_client_available": bool(GRADIO_MODEL_API_URL),
        "gradio_client_error": gradio_client_error,
        "python_executable": sys.executable,
        "python_version": sys.version.split()[0],
        "model_loaded": model is not None,
        "tensorflow_available": tf is not None,
        "model_file_present": model_path.exists(),
        "model_path": str(model_path),
        "model_load_error": model_load_error,
        "supabase_configured": is_supabase_configured(),
        "supabase_dependency_error": get_supabase_dependency_error(),
        "supabase_unavailable_reason": get_supabase_unavailable_reason(),
        "confidence_threshold": CONFIDENCE_THRESHOLD
    }), 200


@app.route("/api/upload", methods=["POST"])
def upload_image():
    """Upload complaint with image + optional voice and classify it."""
    try:
        external_prediction = extract_external_prediction()

        if "image" not in request.files:
            logger.warning("No image file in request")
            return jsonify({
                "error": "Missing 'image' file in request",
                "status": "error"
            }), 400

        file = request.files["image"]
        voice_file = request.files.get("voice")

        if file.filename == "":
            logger.warning("Empty filename")
            return jsonify({
                "error": "No file selected",
                "status": "error"
            }), 400

        if not is_supabase_configured():
            return jsonify({
                "error": get_supabase_unavailable_reason(),
                "status": "error"
            }), 503

        try:
            img = Image.open(file).convert("RGB")
        except Exception as e:
            logger.error(f"Image processing failed: {e}")
            return jsonify({
                "error": "Invalid image file. Please upload a valid image (JPG, PNG, etc.)",
                "status": "error"
            }), 400

        prediction_source = None
        gradio_backend_error = None

        if external_prediction is not None:
            predictions, top_category, top_confidence = external_prediction
            prediction_source = "gradio"
        else:
            should_try_gradio_backend = MODEL_BACKEND in {"auto", "gradio"} and bool(GRADIO_MODEL_API_URL)

            if should_try_gradio_backend:
                try:
                    predictions, top_category, top_confidence = predict_with_gradio_backend(file)
                    prediction_source = "gradio_backend"
                except Exception as gradio_error:
                    gradio_backend_error = str(gradio_error)
                    logger.warning("Gradio backend prediction failed: %s", gradio_error)
                    try:
                        file.stream.seek(0)
                    except Exception:
                        pass

            if prediction_source is None:
                if get_model() is None:
                    error_details = gradio_backend_error or model_load_error
                    logger.error("No prediction backend available")
                    return jsonify({
                        "error": "Model backend not available",
                        "details": error_details,
                        "status": "error"
                    }), 503

                predictions, top_category, top_confidence = predict(img)
                prediction_source = "local_model"

        try:
            file.stream.seek(0)
        except Exception:
            pass

        priority = request.form.get("priority", "Medium")
        user_email = request.form.get("user_email", "anonymous@civic.local")
        location_name = (request.form.get("location_name") or "").strip() or None
        try:
            latitude = parse_float_field("latitude")
            longitude = parse_float_field("longitude")
        except ValueError as exc:
            return jsonify({
                "error": str(exc),
                "status": "error"
            }), 400

        if priority not in ["Low", "Medium", "High", "Urgent"]:
            priority = "Medium"

        department = get_department_from_category(top_category)

        if top_confidence >= CONFIDENCE_THRESHOLD:
            status = "submitted"
            stored_status = "submitted"
            top3_predictions = None
        else:
            status = "needs_manual_review"
            stored_status = "submitted"
            top3_predictions = predictions[:3]

        logger.info(
            "Prediction (%s): %s (%.2f) | Department: %s | Status: %s",
            prediction_source,
            top_category,
            top_confidence,
            department,
            status,
        )

        try:
            image_url = upload_filestorage_to_supabase(
                file,
                bucket_name="complaints",
                path_prefix="complaints",
                default_extension=".jpg",
            )
        except Exception as storage_error:
            logger.error("Complaint image upload failed: %s", storage_error)
            return jsonify({
                "error": "Failed to upload the complaint image to Supabase Storage.",
                "details": str(storage_error),
                "status": "error"
            }), 500

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
                    path_prefix="voice/citizen",
                    default_extension=".webm",
                )
            except Exception as voice_error:
                logger.warning("Citizen voice upload failed: %s", voice_error)

        response_data = {
            "category": top_category,
            "confidence": round(top_confidence, 4),
            "department": department,
            "status": status,
            "message": "Complaint submitted successfully" if status == "submitted" else "Requires manual review",
            "prediction_source": prediction_source,
        }
        if top3_predictions:
            response_data["top3"] = [
                {"category": p["category"], "confidence": round(p["confidence"], 4)}
                for p in top3_predictions
            ]

        def extract_missing_column(error_obj):
            message = ""
            if isinstance(error_obj, dict):
                message = error_obj.get("message") or ""
            else:
                message = str(error_obj)
            match = re.search(r"Could not find the '([^']+)' column", message)
            return match.group(1) if match else None

        def insert_with_retry(payload):
            payload = dict(payload)
            removed = []
            for _ in range(5):
                response = None
                error = None
                try:
                    response = supabase.from_("complaints").insert([payload]).execute()
                    error = getattr(response, "error", None)
                except Exception as exc:
                    error = exc
                if error:
                    missing = extract_missing_column(error)
                    if missing and missing in payload:
                        removed.append(missing)
                        payload.pop(missing, None)
                        continue
                    logger.error("Supabase insert failed: %s", error)
                    return None, error
                if not response or not response.data:
                    return None, "Insert returned no data"
                return response.data[0], None
            return None, f"Insert failed after removing columns: {removed}"

        try:
            now = datetime.now(timezone.utc).isoformat()
            complaint_data = {
                "category": top_category,
                "confidence": round(top_confidence, 4),
                "department": department,
                "priority": priority,
                "latitude": latitude,
                "longitude": longitude,
                "location_name": location_name,
                "user_email": user_email,
                "status": stored_status,
                "image_url": image_url,
                "is_confident": top_confidence >= CONFIDENCE_THRESHOLD,
                "citizen_voice_url": voice_url,
                "created_at": now,
                "updated_at": now,
            }

            row, error = insert_with_retry(complaint_data)
            if row:
                response_data["complaint_id"] = row.get("id")
                return jsonify(response_data), 200

            return jsonify({
                "error": "Failed to save complaint",
                "details": str(error),
                "status": "error"
            }), 500

        except Exception as supabase_err:
            logger.error("Supabase insert error: %s", supabase_err)
            return jsonify({
                "error": "Failed to save complaint",
                "details": str(supabase_err),
                "status": "error"
            }), 500
    
    except Exception as e:
        logger.error(f"Unexpected error in upload_image: {e}", exc_info=True)
        return jsonify({
            "error": "Internal server error",
            "status": "error"
        }), 500


@app.route("/api/predict", methods=["POST"])
def predict_api():
    return upload_image()


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found",
        "status": "error",
        "available_endpoints": [
            "/api/upload",
            "/api/predict",
            "/api/health",
            "/api/complaints",
            "/api/analytics",
            "/api/user-complaints",
            "/api/admin/users"
        ]
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "error": "Method not allowed",
        "status": "error"
    }), 405


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
