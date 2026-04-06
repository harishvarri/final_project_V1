import logging
import os
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import BatchNormalization, Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.models import Model

from config import CATEGORIES, CONFIDENCE_THRESHOLD, DATASET_PATH, IMG_SIZE, MODEL_PATH


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


ROUTING_MAP = {
    "dead_animals": "Sanitation Department",
    "garbage": "Sanitation Department",
    "illegal_dumping": "Sanitation Department",
    "pothole": "Road Department",
    "sewer": "Water Supply Department",
    "streetlight": "Electrical Department",
    "waterlogging": "Drainage Department",
    "needs_manual_review": "Manual Review Queue",
}


class FixedDepthwiseConv2D(tf.keras.layers.DepthwiseConv2D):
    def __init__(self, **kwargs):
        kwargs.pop("groups", None)
        super().__init__(**kwargs)


def build_training_architecture() -> Model:
    base_model = MobileNetV2(
        weights="imagenet",
        include_top=False,
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
    )
    base_model.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(256, activation="relu")(x)
    x = BatchNormalization()(x)
    x = Dropout(0.5)(x)
    outputs = Dense(len(CATEGORIES), activation="softmax")(x)

    return Model(inputs=base_model.input, outputs=outputs)


def load_model() -> Model:
    model_path = Path(MODEL_PATH).resolve()
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    try:
        model = tf.keras.models.load_model(
            model_path,
            custom_objects={"DepthwiseConv2D": FixedDepthwiseConv2D},
            compile=False,
        )
        logger.info("Loaded full model from %s", model_path)
    except Exception as load_error:
        logger.warning("Full model load failed: %s", load_error)
        logger.info("Falling back to training architecture + load_weights()")
        model = build_training_architecture()
        model.load_weights(model_path)
        logger.info("Loaded weights into reconstructed architecture from %s", model_path)

    model.predict(np.zeros((1, IMG_SIZE, IMG_SIZE, 3), dtype=np.float32), verbose=0)
    return model


MODEL = load_model()


def predict_image(img_path, true_label=None):
    try:
        img = Image.open(img_path).convert("RGB")
        img = img.resize((IMG_SIZE, IMG_SIZE), Image.Resampling.BILINEAR)

        img_array = np.asarray(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        prediction = MODEL.predict(img_array, verbose=0)[0]

        max_idx = int(np.argmax(prediction))
        confidence = float(np.max(prediction))
        is_confident = confidence >= CONFIDENCE_THRESHOLD
        predicted_category = CATEGORIES[max_idx] if is_confident else "needs_manual_review"
        top3_idx = np.argsort(prediction)[-3:][::-1]

        print(f"\nImage: {os.path.basename(img_path)}")
        if true_label:
            print(f"  True Label: {true_label}")
        print(f"  Predicted: {predicted_category}")
        print(f"  Confidence: {confidence:.4f}")
        print(f"  Department: {ROUTING_MAP[predicted_category]}")
        print("  Top-3 Predictions:")
        for rank, idx in enumerate(top3_idx, start=1):
            print(f"    {rank}. {CATEGORIES[idx]} ({prediction[idx]:.4f})")

        return predicted_category, confidence, is_confident
    except Exception as error:
        logger.error("Prediction error for %s: %s", img_path, error)
        return None, 0.0, False


def main():
    dataset_root = Path(DATASET_PATH)
    total = 0
    correct = 0
    confident = 0

    print("=" * 80)
    print("MODEL PREDICTION TESTING")
    print("=" * 80)
    print(f"Model path: {Path(MODEL_PATH).resolve()}")
    print(f"Image size: {IMG_SIZE}x{IMG_SIZE}")
    print(f"Confidence threshold: {CONFIDENCE_THRESHOLD:.2f}")

    for category in CATEGORIES:
        category_path = dataset_root / category
        if not category_path.exists():
            continue

        images = [
            item for item in category_path.iterdir()
            if item.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
        ]

        for image_path in images[:3]:
            pred, _, is_conf = predict_image(str(image_path), true_label=category)
            total += 1
            if is_conf:
                confident += 1
            if pred == category:
                correct += 1

    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)

    if total == 0:
        print("No images found in dataset.")
        return

    accuracy = correct / total
    confident_rate = confident / total

    print(f"Total Samples: {total}")
    print(f"Accuracy: {accuracy:.2%}")
    print(f"Confident Predictions: {confident_rate:.2%}")
    print(f"Manual Review Needed: {(total - confident) / total:.2%}")

    print("\nRecommendations")
    if accuracy < 0.85:
        print("- Accuracy is below target. Improve dataset quality or retrain.")
    if confident_rate < 0.70:
        print("- Too many low-confidence predictions. Consider retraining or calibrating threshold.")
    if accuracy >= 0.85 and confident_rate >= 0.70:
        print("- Prediction pipeline looks healthy.")


if __name__ == "__main__":
    main()
