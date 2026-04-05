import logging
import re
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image
from flask import Flask, jsonify, request
from flask_cors import CORS

from complaints_api import register_complaints_api
from config import CATEGORIES, CONFIDENCE_THRESHOLD, IMG_SIZE, MODEL_PATH
from storage_utils import upload_filestorage_to_supabase
from supabase_client import get_supabase_client, is_supabase_configured

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
        "model_loaded": model is not None,
        "tensorflow_available": tf is not None,
        "model_file_present": model_path.exists(),
        "model_path": str(model_path),
        "model_load_error": model_load_error,
        "supabase_configured": is_supabase_configured(),
        "confidence_threshold": CONFIDENCE_THRESHOLD
    }), 200


@app.route("/api/upload", methods=["POST"])
def upload_image():
    """Upload complaint with image + optional voice and classify it."""
    try:
        if get_model() is None:
            logger.error("Model not loaded")
            return jsonify({
                "error": "Model not available",
                "details": model_load_error,
                "status": "error"
            }), 503

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
                "error": "Supabase is not configured. Complaint uploads require database and storage access.",
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

        predictions, top_category, top_confidence = predict(img)

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

        logger.info(f"Prediction: {top_category} ({top_confidence:.2f}) | Department: {department} | Status: {status}")

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
            "message": "Complaint submitted successfully" if status == "submitted" else "Requires manual review"
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
