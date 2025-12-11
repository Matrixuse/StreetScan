import io
import os
from typing import Dict

from PIL import Image

import torch
import torchvision.transforms as T
import torchvision.models as models


class Predictor:
    """Simple classifier predictor.

    Expects a PyTorch state dict at `weights_path` with a model matching
    resnet18(num_classes=2). If weights are missing, raises FileNotFoundError.
    """

    def __init__(self, weights_path: str = None, device: str = None):
        base = os.path.dirname(__file__)
        self.weights_path = weights_path or os.path.join(base, 'weights', 'classifier.pth')
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None

    def _load_model(self):
        if not os.path.exists(self.weights_path):
            raise FileNotFoundError(f"Classifier weights not found at {self.weights_path}")

        model = models.resnet18(pretrained=False)
        # replace final layer
        model.fc = torch.nn.Linear(model.fc.in_features, 2)
        state = torch.load(self.weights_path, map_location=self.device)
        model.load_state_dict(state)
        model.to(self.device)
        model.eval()
        self.model = model

    def predict_image(self, image_bytes: bytes) -> Dict:
        if self.model is None:
            self._load_model()

        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        transform = T.Compose([
            T.Resize((224, 224)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        x = transform(img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            out = self.model(x)
            probs = torch.softmax(out, dim=1).cpu().numpy()[0]

        # class mapping: 0 -> NonPothole, 1 -> Pothole
        result = {
            'classes': ['NonPothole', 'Pothole'],
            'pothole_confidence': float(probs[1]),
            'nonpothole_confidence': float(probs[0]),
            'pothole_present': bool(probs[1] > 0.5),
        }
        return result


if __name__ == '__main__':
    # quick local smoke test (requires a weights file)
    p = Predictor()
    try:
        print('Loaded predictor, device:', p.device)
    except FileNotFoundError as e:
        print(e)
