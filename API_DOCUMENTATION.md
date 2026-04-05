# Civic Issue Classification API - Documentation

## Overview
This is a Flask-based REST API for classifying civic issues (potholes, garbage, illegal dumping, etc.) using a TensorFlow/Keras deep learning model.

---

## Supabase Configuration
Create a `.env` file next to `supabase_client.py` (project root) with:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```
After restarting the Flask server, `GET /api/health` should return `"supabase_configured": true`.

---

## Fixed Issues

### Route Mismatch (404 Error)
**Problem:** The original app defined route `/predict` but you were calling `/api/upload`

**Solution:** Updated Flask app to:
- Primary endpoint: `/api/upload` ✅
- Backward compatibility: `/api/predict` (delegates to `/api/upload`)
- Health check: `/api/health`

---

## API Endpoints

### 1. **Upload & Classify Image** 
**Endpoint:** `POST /api/upload`

**Request:**
```bash
curl -X POST http://127.0.0.1:5000/api/upload \
  -F "image=@path/to/image.jpg"
```

**Request Format:**
- **Content-Type:** `multipart/form-data`
- **Form Field:** `image` (required) - Image file (JPG, PNG, WebP, etc.)

**Success Response (200):**
```json
{
  "category": "pothole",
  "confidence": 0.9823,
  "status": "success"
}
```

**Error Responses:**

*No image provided (400):*
```json
{
  "error": "Missing 'image' file in request",
  "status": "error"
}
```

*Invalid image file (400):*
```json
{
  "error": "Invalid image file. Please upload a valid image (JPG, PNG, etc.)",
  "status": "error"
}
```

*Model not available (503):*
```json
{
  "error": "Model not available",
  "status": "error"
}
```

---

### 2. **Health Check**
**Endpoint:** `GET /api/health`

**Use Case:** Load balancers, monitoring systems

**Response (200):**
```json
{
  "status": "ok",
  "model_loaded": true
}
```

---

### 3. **Backward Compatibility**
**Endpoint:** `POST /api/predict`

**Note:** This endpoint still works but delegates to `/api/upload`. Use `/api/upload` for new code.

---

## Production Improvements Made

### 1. **Error Handling**
- ✅ Validates image file presence
- ✅ Checks file validity before processing
- ✅ Returns appropriate HTTP status codes
- ✅ Graceful model loading with fallback

### 2. **Logging**
- ✅ Structured logging for debugging
- ✅ Logs predictions and errors with proper context
- ✅ Stack traces for unexpected errors

### 3. **CORS Support**
- ✅ Enabled CORS for cross-origin requests (frontend compatibility)
- ✅ Configurable for production environment

### 4. **API Conventions**
- ✅ Consistent JSON response format with `status` field
- ✅ Meaningful HTTP status codes (200, 400, 503, 500, 404, 405)
- ✅ RESTful endpoint naming (`/api/...`)

### 5. **Robustness**
- ✅ Model loading error handling
- ✅ File validation
- ✅ Image format conversion (→ RGB)
- ✅ Confidence rounding for precision

---

## Testing the API

### Using Python `requests`
```python
import requests
from pathlib import Path

# Upload and classify
image_path = "test_image.jpg"
with open(image_path, "rb") as f:
    response = requests.post(
        "http://127.0.0.1:5000/api/upload",
        files={"image": f}
    )

print(response.json())
# Output: {"category": "pothole", "confidence": 0.9823, "status": "success"}
```

### Using cURL
```bash
curl -X POST http://127.0.0.1:5000/api/upload \
  -F "image=@demo_image.jpg"
```

### Using JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append("image", imageFile); // HTMLInputElement with type="file"

fetch("http://127.0.0.1:5000/api/upload", {
  method: "POST",
  body: formData
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

---

## Prediction Confidence & Thresholds

### Confidence Interpretation
- **High Confidence (> 0.60):** Returns specific category
- **Low Confidence (≤ 0.60):** Returns `"needs_manual_review"`

**Adjustable via `config.py`:**
```python
CONFIDENCE_THRESHOLD = 0.60  # Adjust as needed for your use case
```

### Categories
You can classify civic issues into 7 categories:
1. `dead_animals`
2. `garbage`
3. `illegal_dumping`
4. `pothole`
5. `sewer`
6. `streetlight`
7. `waterlogging`

---

## Deployment Checklist

### Development (Current)
```bash
python app.py
# Runs on http://127.0.0.1:5000 with debug=True
```

### Production
1. **Disable Debug Mode**
   ```python
   app.run(debug=False)  # In app.py
   ```

2. **Use Production WSGI Server**
   ```bash
   gunicorn --workers 4 --bind 0.0.0.0:5000 app:app
   ```

3. **Environment Variables**
   ```bash
   export FLASK_ENV=production
   export TENSORFLOW_CPP_MIN_LOG_LEVEL=2  # Suppress TF warnings
   ```

4. **Monitor Logs**
   ```bash
   gunicorn --workers 4 --bind 0.0.0.0:5000 \
     --access-logfile logs/access.log \
     --error-logfile logs/error.log \
     app:app
   ```

---

## Common Issues & Solutions

### 404 Error on `/api/upload`
**Cause:** Route was original `/predict`  
**Solution:** Already fixed! Use `/api/upload` ✅

### Image Processing Fails
**Check:**
- Image file is valid (JPG, PNG, etc.)
- Image is not corrupted
- Sufficient disk space for model inference

### Confidence Always Low
**Check:**
- Model is properly trained on your dataset
- Input images match training data format/quality
- Image preprocessing matches training preprocessing

### Slow Predictions
**Solutions:**
- Use GPU: Ensure TensorFlow uses CUDA
- Batch requests if possible
- Optimize model size (pruning, quantization)
- Use image preprocessing cache if available

---

## Next Steps

1. ✅ **Test the API:** Use provided curl/Python examples
2. ✅ **Monitor logs:** Check Flask debug output for errors
3. ✅ **Frontend integration:** Update your React frontend to POST to `/api/upload`
4. ✅ **Production deployment:** Follow deployment checklist above

---

## Questions?

Check app logs for detailed error messages:
```python
# Logs are printed to console
# Format: [LEVEL] Module: Message
```

Good luck! 🚀
