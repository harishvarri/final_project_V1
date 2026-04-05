import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from sklearn.utils import class_weight
import numpy as np
import os

from config import *

print("🚀 PRODUCTION TRAINING STARTED")

# ==============================
# DATA
# ==============================
datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2,
    rotation_range=20,
    zoom_range=0.2,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    brightness_range=[0.6, 1.4]
)

train_data = datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    subset="training"
)

val_data = datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    subset="validation"
)

# ==============================
# CLASS WEIGHTS
# ==============================
class_weights = class_weight.compute_class_weight(
    'balanced',
    classes=np.unique(train_data.classes),
    y=train_data.classes
)
class_weight_dict = dict(enumerate(class_weights))

# ==============================
# MODEL
# ==============================
base_model = MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(IMG_SIZE, IMG_SIZE, 3)
)

base_model.trainable = False  # 🔥 FIX

x = base_model.output
x = GlobalAveragePooling2D()(x)

x = Dense(256, activation="relu")(x)
x = BatchNormalization()(x)
x = Dropout(0.5)(x)

outputs = Dense(len(CATEGORIES), activation="softmax")(x)

model = Model(inputs=base_model.input, outputs=outputs)

# ==============================
# STAGE 1
# ==============================
model.compile(
    optimizer=Adam(learning_rate=LEARNING_RATE_STAGE1),
    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
    metrics=["accuracy"]
)

callbacks = [
    EarlyStopping(patience=5, restore_best_weights=True),
    ReduceLROnPlateau(patience=3),
    ModelCheckpoint(MODEL_PATH, save_best_only=True)
]

model.fit(
    train_data,
    validation_data=val_data,
    epochs=EPOCHS_STAGE1,
    class_weight=class_weight_dict,
    callbacks=callbacks
)

# ==============================
# STAGE 2 (FINE TUNE)
# ==============================
for layer in base_model.layers[-80:]:
    layer.trainable = True

model.compile(
    optimizer=Adam(learning_rate=LEARNING_RATE_STAGE2),
    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
    metrics=["accuracy"]
)

model.fit(
    train_data,
    validation_data=val_data,
    epochs=EPOCHS_STAGE2,
    class_weight=class_weight_dict,
    callbacks=callbacks
)

model.save(MODEL_PATH)

print("✅ TRAINING COMPLETE")