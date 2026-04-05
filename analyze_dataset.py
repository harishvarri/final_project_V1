"""
🚀 ADVANCED DATASET ANALYSIS SCRIPT
Checks:
✔ Class balance
✔ Image quality (blur detection)
✔ Corrupted files
✔ Duplicate images
✔ Image sizes
✔ Training recommendations
"""

import os
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
import hashlib
import cv2

# ==============================
# CONFIG
# ==============================
DATASET_PATH = "dataset"
TARGET_SIZE = 512  # ✅ Updated from 224 → 512

CATEGORIES = [
    "dead_animals",
    "garbage",
    "illegal_dumping",
    "pothole",
    "sewer",
    "streetlight",
    "waterlogging"
]

print("=" * 80)
print("🚀 ADVANCED DATASET ANALYSIS")
print("=" * 80)

class_counts = {}
image_sizes = []
corrupted_files = []
duplicate_hashes = {}
duplicate_files = []
blurry_images = []

# ==============================
# UTIL FUNCTIONS
# ==============================
def get_image_hash(image_path):
    """Generate hash to detect duplicates"""
    with open(image_path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

def is_blurry(image_path, threshold=100):
    """Detect blur using Laplacian variance"""
    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        variance = cv2.Laplacian(img, cv2.CV_64F).var()
        return variance < threshold
    except:
        return False

# ==============================
# ANALYSIS LOOP
# ==============================
print("\n🔍 Scanning dataset...")

for category in CATEGORIES:
    category_path = os.path.join(DATASET_PATH, category)

    if not os.path.exists(category_path):
        print(f"❌ Missing folder: {category}")
        class_counts[category] = 0
        continue

    images = [f for f in os.listdir(category_path)
              if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

    class_counts[category] = len(images)

    for img_file in images:
        img_path = os.path.join(category_path, img_file)

        try:
            # Open image
            img = Image.open(img_path)
            image_sizes.append(img.size)

            # Check duplicates
            img_hash = get_image_hash(img_path)
            if img_hash in duplicate_hashes:
                duplicate_files.append(img_path)
            else:
                duplicate_hashes[img_hash] = img_path

            # Blur detection
            if is_blurry(img_path):
                blurry_images.append(img_path)

        except Exception as e:
            corrupted_files.append((img_path, str(e)))

# ==============================
# CLASS DISTRIBUTION
# ==============================
print("\n" + "=" * 80)
print("📊 CLASS DISTRIBUTION")
print("=" * 80)

total_images = sum(class_counts.values())

print(f"{'Category':20} {'Count':>10} {'Percentage':>15}")
print("-" * 60)

for category, count in sorted(class_counts.items(), key=lambda x: x[1], reverse=True):
    percentage = (count / total_images * 100) if total_images > 0 else 0
    print(f"{category:20} {count:>10} {percentage:>14.2f}%")

print("-" * 60)
print(f"{'TOTAL':20} {total_images:>10} {100.0:>14.2f}%")

# ==============================
# IMBALANCE CHECK
# ==============================
if total_images > 0:
    max_count = max(class_counts.values())
    min_count = min([c for c in class_counts.values() if c > 0])

    imbalance_ratio = max_count / min_count

    print(f"\n⚖️ Class Imbalance Ratio: {imbalance_ratio:.2f}:1")

    if imbalance_ratio > 3:
        print("⚠️ HIGH imbalance detected → Use class_weight (already done 👍)")
    else:
        print("✅ Balanced dataset")

# ==============================
# IMAGE STATS
# ==============================
if image_sizes:
    widths = [s[0] for s in image_sizes]
    heights = [s[1] for s in image_sizes]

    print("\n" + "=" * 80)
    print("🖼 IMAGE STATISTICS")
    print("=" * 80)

    print(f"Total images checked: {len(image_sizes)}")

    print(f"\nWidth  → Min: {min(widths)}, Max: {max(widths)}, Avg: {int(np.mean(widths))}")
    print(f"Height → Min: {min(heights)}, Max: {max(heights)}, Avg: {int(np.mean(heights))}")

    resize_needed = sum(1 for w, h in image_sizes if w != TARGET_SIZE or h != TARGET_SIZE)

    print(f"\nImages needing resize to {TARGET_SIZE}x{TARGET_SIZE}: {resize_needed} ({resize_needed/len(image_sizes)*100:.1f}%)")

# ==============================
# QUALITY CHECKS
# ==============================
print("\n" + "=" * 80)
print("🧪 DATA QUALITY CHECK")
print("=" * 80)

print(f"❌ Corrupted images: {len(corrupted_files)}")
print(f"🔁 Duplicate images: {len(duplicate_files)}")
print(f"🌫 Blurry images: {len(blurry_images)}")

# Optional: print few samples
if corrupted_files[:3]:
    print("\nSample corrupted files:")
    for f, e in corrupted_files[:3]:
        print(f" - {f}")

if duplicate_files[:3]:
    print("\nSample duplicate files:")
    for f in duplicate_files[:3]:
        print(f" - {f}")

if blurry_images[:3]:
    print("\nSample blurry images:")
    for f in blurry_images[:3]:
        print(f" - {f}")

# ==============================
# VISUALIZATION
# ==============================
print("\n📊 Generating chart...")

plt.figure(figsize=(12, 6))
names = list(class_counts.keys())
counts = list(class_counts.values())

plt.bar(names, counts)
plt.xticks(rotation=45)
plt.title("Dataset Distribution")
plt.ylabel("Images")

plt.tight_layout()
plt.savefig("dataset_distribution.png")
print("✅ Saved → dataset_distribution.png")

# ==============================
# FINAL RECOMMENDATIONS
# ==============================
print("\n" + "=" * 80)
print("💡 RECOMMENDATIONS")
print("=" * 80)

if len(corrupted_files) > 0:
    print("👉 Remove corrupted images")

if len(duplicate_files) > 0:
    print("👉 Remove duplicate images")

if len(blurry_images) > 0:
    print("👉 Remove or review blurry images")

if imbalance_ratio > 3:
    print("👉 Add more images to smaller classes")

print("\n✅ Dataset ready for training (after cleanup)")
print("=" * 80)