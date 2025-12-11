"""Small test script that runs the Predictor on a sample image from the dataset.

Usage:
    python test_infer.py --image "d:/STREET SCAN/dataset/train/Potholes/pothole_image_1.jpg"

This helps quickly validate the saved weights and Predictors.
"""
import argparse
import os
from ml.infer_classifier import Predictor

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=False, help='Path to an image to run inference on')
    parser.add_argument('--weights', required=False, help='Optional path to weights file')
    args = parser.parse_args()

    img = args.image or os.path.join(os.path.dirname(__file__), '..', 'dataset', 'train', 'Potholes')
    # if path is a directory, pick first image
    if os.path.isdir(img):
        files = [f for f in os.listdir(img) if f.lower().endswith(('.jpg','.jpeg','.png'))]
        if not files:
            raise SystemExit('No image found in ' + img)
        img = os.path.join(img, files[0])

    with open(img, 'rb') as f:
        data = f.read()

    p = Predictor(weights_path=args.weights) if args.weights else Predictor()
    res = p.predict_image(data)
    print('Inference result:')
    print(res)
