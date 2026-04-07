import os

IMG_SIZE = int(os.environ.get("IMG_SIZE", "224"))
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "32"))

EPOCHS_STAGE1 = int(os.environ.get("EPOCHS_STAGE1", "10"))
EPOCHS_STAGE2 = int(os.environ.get("EPOCHS_STAGE2", "15"))

LEARNING_RATE_STAGE1 = float(os.environ.get("LEARNING_RATE_STAGE1", "1e-4"))
LEARNING_RATE_STAGE2 = float(os.environ.get("LEARNING_RATE_STAGE2", "3e-5"))

DATASET_PATH = os.environ.get("DATASET_PATH", "dataset")
MODEL_PATH = os.environ.get("MODEL_PATH", "civic_issue_model.h5")

CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.60"))

CATEGORIES = [
    "dead_animals",
    "garbage",
    "illegal_dumping",
    "pothole",
    "sewer",
    "streetlight",
    "waterlogging",
]
