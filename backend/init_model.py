import os
import json
import numpy as np

def init_plant_model():
    model_dir = os.path.join(os.path.dirname(__file__), "model")
    os.makedirs(model_dir, exist_ok=True)
    
    keras_path = os.path.join(model_dir, "plant_model.keras")
    labels_path = os.path.join(model_dir, "labels.json")

    labels = {
        "0": {"plant": "Tomato", "disease": "Tomato Late Blight", "status": "Diseased"},
        "1": {"plant": "Tomato", "disease": "Tomato Early Blight", "status": "Diseased"},
        "2": {"plant": "Tomato", "disease": "Healthy Leaf", "status": "Healthy"},
        "3": {"plant": "Potato", "disease": "Potato Early Blight", "status": "Diseased"},
        "4": {"plant": "Potato", "disease": "Potato Late Blight", "status": "Diseased"},
        "5": {"plant": "Potato", "disease": "Healthy Leaf", "status": "Healthy"},
        "6": {"plant": "Apple", "disease": "Apple Scab", "status": "Diseased"},
        "7": {"plant": "Apple", "disease": "Apple Black Rot", "status": "Diseased"},
        "8": {"plant": "Apple", "disease": "Healthy Leaf", "status": "Healthy"},
        "9": {"plant": "Corn", "disease": "Corn Common Rust", "status": "Diseased"},
        "10": {"plant": "Corn", "disease": "Healthy Leaf", "status": "Healthy"},
        "11": {"plant": "Grape", "disease": "Grape Black Rot", "status": "Diseased"},
        "12": {"plant": "Grape", "disease": "Healthy Leaf", "status": "Healthy"},
        "13": {"plant": "Pepper", "disease": "Pepper Bacterial Spot", "status": "Diseased"},
        "14": {"plant": "Pepper", "disease": "Healthy Leaf", "status": "Healthy"},
        "15": {"plant": "Citrus", "disease": "Citrus Canker", "status": "Diseased"},
        "16": {"plant": "Citrus", "disease": "Citrus Greening (HLB)", "status": "Diseased"},
        "17": {"plant": "Citrus", "disease": "Citrus Black Spot", "status": "Diseased"},
        "18": {"plant": "Citrus", "disease": "Healthy Leaf", "status": "Healthy"},
        "19": {"plant": "Rice", "disease": "Rice Blast", "status": "Diseased"},
        "20": {"plant": "Rice", "disease": "Healthy Leaf", "status": "Healthy"}
    }

    with open(labels_path, "w") as f:
        json.dump(labels, f, indent=2)
    print(f"[PlantBot AI] Saved labels.json to {labels_path}")

    # Build Keras MobileNetV2 architecture if model file doesn't exist
    if not os.path.exists(keras_path):
        try:
            import tensorflow as tf
            from tensorflow.keras import layers, models
            
            print("[PlantBot AI] Constructing Keras MobileNetV2 architecture...")
            base_model = tf.keras.applications.MobileNetV2(
                input_shape=(224, 224, 3),
                include_top=False,
                weights='imagenet'
            )
            base_model.trainable = False

            model = models.Sequential([
                base_model,
                layers.GlobalAveragePooling2D(),
                layers.Dropout(0.2),
                layers.Dense(len(labels), activation='softmax')
            ])

            model.compile(
                optimizer='adam',
                loss='sparse_categorical_crossentropy',
                metrics=['accuracy']
            )

            model.save(keras_path)
            print(f"[PlantBot AI] Successfully saved MobileNetV2 model to {keras_path}")
        except Exception as e:
            print(f"[PlantBot AI] Note on Keras model initialization: {e}")

if __name__ == "__main__":
    init_plant_model()
