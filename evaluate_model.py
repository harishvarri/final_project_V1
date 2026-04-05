import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
from sklearn.metrics import classification_report
from config import *

datagen = ImageDataGenerator(rescale=1./255)

val_data = datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    shuffle=False
)

model = tf.keras.models.load_model(MODEL_PATH)

y_pred = np.argmax(model.predict(val_data), axis=1)

print(classification_report(val_data.classes, y_pred, target_names=CATEGORIES))