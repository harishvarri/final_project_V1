import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Model
import numpy as np
from PIL import Image
import os
import logging

# ==============================
# LOGGING
# ==============================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==============================
# CONFIG
# ==============================
MODEL_PATH = "civic_issue_model.h5"
TEST_IMAGE_FOLDER = "dataset"
IMG_SIZE = 512   # ✅ FIXED
CONFIDENCE_THRESHOLD = 0.60

CATEGORIES = [
    "dead_animals",
    "garbage",
    "illegal_dumping",
    "pothole",
    "sewer",
    "streetlight",
    "waterlogging"
]

ROUTING_MAP = {
    "dead_animals": "Health & Sanitation Department",
    "garbage": "Sanitation Department",
    "illegal_dumping": "Environmental Enforcement",
    "pothole": "Road Department",
    "sewer": "Water & Sewage Department",
    "streetlight": "Electrical Department",
    "waterlogging": "Drainage Department",
    "needs_manual_review": "Manual Review Queue"
}

print("=" * 80)
print("🚀 MODEL PREDICTION TESTING (UPDATED)")
print("=" * 80)

# ==============================
# LOAD MODEL (MATCH TRAINING)
# ==============================
def load_model():
    try:
        base_model = MobileNetV2(
            weights="imagenet",   # ✅ FIXED
            include_top=False,
            input_shape=(IMG_SIZE, IMG_SIZE, 3)
        )

        x = base_model.output
        x = GlobalAveragePooling2D()(x)

        x = Dense(512, activation="relu")(x)
        x = BatchNormalization()(x)
        x = Dropout(0.3)(x)

        x = Dense(256, activation="relu")(x)
        x = BatchNormalization()(x)
        x = Dropout(0.2)(x)

        outputs = Dense(len(CATEGORIES), activation="softmax")(x)

        model = Model(inputs=base_model.input, outputs=outputs)
        model.load_weights(MODEL_PATH)

        # ✅ Warm-up
        model.predict(np.zeros((1, IMG_SIZE, IMG_SIZE, 3)))

        print("✅ Model loaded successfully")
        return model

    except Exception as e:
        logger.error(f"Model loading failed: {e}")
        exit(1)


model = load_model()

# ==============================
# PREDICTION FUNCTION
# ==============================
def predict_image(img_path, true_label=None):
    try:
        img = Image.open(img_path).convert("RGB")
        img = img.resize((IMG_SIZE, IMG_SIZE))

        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        prediction = model.predict(img_array, verbose=0)[0]

        max_idx = np.argmax(prediction)
        confidence = float(np.max(prediction))

        is_confident = confidence >= CONFIDENCE_THRESHOLD
        predicted_category = CATEGORIES[max_idx] if is_confident else "needs_manual_review"

        # Top-3
        top3_idx = np.argsort(prediction)[-3:][::-1]

        print(f"\n📷 {os.path.basename(img_path)}")
        if true_label:
            print(f"   True Label: {true_label}")

        print(f"   Predicted: {predicted_category}")
        print(f"   Confidence: {confidence:.4f}")
        print(f"   Department: {ROUTING_MAP[predicted_category]}")

        print("   🔝 Top-3 Predictions:")
        for i, idx in enumerate(top3_idx, 1):
            print(f"      {i}. {CATEGORIES[idx]} ({prediction[idx]:.4f})")

        return predicted_category, confidence, is_confident

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return None, 0.0, False


# ==============================
# TEST LOOP
# ==============================
print("\n" + "=" * 80)
print("🧪 TESTING SAMPLE IMAGES")
print("=" * 80)

total = 0
correct = 0
confident = 0

for category in CATEGORIES:
    category_path = os.path.join(TEST_IMAGE_FOLDER, category)

    if not os.path.exists(category_path):
        continue

    images = [f for f in os.listdir(category_path)
              if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

    for img_file in images[:3]:
        img_path = os.path.join(category_path, img_file)

        pred, conf, is_conf = predict_image(img_path, true_label=category)

        total += 1
        if is_conf:
            confident += 1
        if pred == category:
            correct += 1


# ==============================
# SUMMARY
# ==============================
print("\n" + "=" * 80)
print("📊 TEST SUMMARY")
print("=" * 80)

if total > 0:
    print(f"Total Samples: {total}")
    print(f"Accuracy: {correct/total:.2%}")
    print(f"Confident Predictions: {confident/total:.2%}")
    print(f"Manual Review Needed: {(total-confident)/total:.2%}")
else:
    print("No images found")

# ==============================
# RECOMMENDATIONS
# ==============================
print("\n💡 RECOMMENDATIONS")

if correct / total < 0.85:
    print("⚠️ Accuracy low → Improve dataset")

if confident / total < 0.7:
    print("⚠️ Too many low-confidence → Train more")

print("\n✅ Testing complete")