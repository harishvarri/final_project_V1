import os
import hashlib
import cv2
from PIL import Image

DATASET_PATH = "dataset"
BLUR_THRESHOLD = 80

def get_hash(path):
    with open(path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

def is_blurry(path):
    img = cv2.imread(path, 0)
    if img is None:
        return True
    return cv2.Laplacian(img, cv2.CV_64F).var() < BLUR_THRESHOLD

seen = {}
removed = 0

for root, _, files in os.walk(DATASET_PATH):
    for file in files:
        if not file.lower().endswith(('jpg','jpeg','png')):
            continue

        path = os.path.join(root, file)

        try:
            Image.open(path)
        except:
            os.remove(path)
            removed += 1
            continue

        h = get_hash(path)
        if h in seen:
            os.remove(path)
            removed += 1
            continue
        seen[h] = path

        if is_blurry(path):
            os.remove(path)
            removed += 1

print(f"✅ Removed {removed} bad images")