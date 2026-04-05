import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import tensorflow as tf

from config import BATCH_SIZE, CATEGORIES, DATASET_PATH, IMG_SIZE, MODEL_PATH


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def save_bar_chart(values, labels, title, ylabel, out_path: Path) -> None:
    plt.figure(figsize=(10, 5))
    x = np.arange(len(labels))
    plt.bar(x, values)
    plt.xticks(x, [label.replace("_", " ") for label in labels], rotation=30, ha="right")
    plt.title(title)
    plt.ylabel(ylabel)
    plt.tight_layout()
    plt.savefig(out_path, dpi=160)
    plt.close()


def save_confusion_matrix(cm, labels, out_path: Path) -> None:
    plt.figure(figsize=(8, 7))
    plt.imshow(cm, interpolation="nearest", cmap="Blues")
    plt.title("Confusion Matrix")
    plt.colorbar()
    tick_marks = np.arange(len(labels))
    plt.xticks(tick_marks, [label.replace("_", " ") for label in labels], rotation=45, ha="right")
    plt.yticks(tick_marks, [label.replace("_", " ") for label in labels])

    thresh = cm.max() / 2.0 if cm.size else 0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], "d"), ha="center", va="center",
                     color="white" if cm[i, j] > thresh else "black")

    plt.ylabel("True label")
    plt.xlabel("Predicted label")
    plt.tight_layout()
    plt.savefig(out_path, dpi=160)
    plt.close()


def evaluate(model_path: Path, dataset_path: Path, output_dir: Path) -> None:
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset path not found: {dataset_path}")
    if not model_path.exists():
        raise FileNotFoundError(f"Model path not found: {model_path}")

    ensure_dir(output_dir)

    datagen = ImageDataGenerator(rescale=1.0 / 255.0)
    data = datagen.flow_from_directory(
        dataset_path,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        shuffle=False
    )

    model = tf.keras.models.load_model(model_path)
    preds = model.predict(data, verbose=1)
    y_pred = np.argmax(preds, axis=1)
    y_true = data.classes

    labels = list(data.class_indices.keys())

    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(labels))))
    report = classification_report(
        y_true,
        y_pred,
        target_names=labels,
        digits=4,
        zero_division=0
    )

    # Overall accuracy
    accuracy = float(np.mean(y_true == y_pred)) if len(y_true) else 0.0

    # Per-class accuracy
    per_class_total = cm.sum(axis=1)
    per_class_correct = np.diag(cm)
    per_class_accuracy = np.divide(
        per_class_correct,
        np.maximum(per_class_total, 1),
    )

    # Dataset distribution
    class_counts = per_class_total

    # Save outputs
    (output_dir / "classification_report.txt").write_text(report, encoding="utf-8")
    (output_dir / "metrics_summary.txt").write_text(
        f"overall_accuracy: {accuracy:.4f}\n",
        encoding="utf-8"
    )

    save_confusion_matrix(cm, labels, output_dir / "confusion_matrix.png")
    save_bar_chart(per_class_accuracy, labels, "Per-Class Accuracy", "Accuracy", output_dir / "per_class_accuracy.png")
    save_bar_chart(class_counts, labels, "Dataset Distribution", "Image Count", output_dir / "dataset_distribution.png")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate model accuracy charts and reports.")
    parser.add_argument("--model", type=str, default=MODEL_PATH, help="Path to trained model (.h5)")
    parser.add_argument("--dataset", type=str, default=DATASET_PATH, help="Path to dataset directory")
    parser.add_argument("--out", type=str, default="static/model_reports", help="Output directory for charts")
    args = parser.parse_args()

    evaluate(Path(args.model), Path(args.dataset), Path(args.out))
    print(f"Reports saved to: {Path(args.out).resolve()}")


if __name__ == "__main__":
    main()
