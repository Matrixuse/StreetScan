ML scaffolding for STREET SCAN
=============================

This folder contains scripts to train a pothole classifier (image-level) and
guidance to create segmentation annotations for size estimation.

Quick steps (recommended order)
1. Train a classifier now (fast):

   - Install Python requirements for ML (see `requirements.txt`). For GPU, install a matching `torch` wheel for your CUDA version.

   - Run training (example, on your machine):

```powershell
python backend\ml\train_classifier.py --data_dir "C:\dev\STREET SCAN\dataset\train" --epochs 8 --batch 32
```

This will save weights to `backend/ml/weights/classifier.pth`.

2. Inference endpoint

After training, you can POST an image to the backend inference endpoint:

```bash
curl -F "image=@/path/to/image.jpg" http://127.0.0.1:5000/api/infer
```

3. Annotation & segmentation (to estimate size)

- If you want pixel-accurate size estimates, annotate potholes with pixel masks using LabelMe, CVAT, or Roboflow. Export to COCO or YOLOv8 segmentation format.
- Use Ultralytics YOLOv8-seg (recommended) to train a segmentation model. See https://docs.ultralytics.com/ for YOLOv8 training steps.

Conversion helpers
- `convert_annotations.py` (not provided) should convert your annotations to the target format (YOLOv8-seg or COCO). I can add a helper if you pick an annotation tool.
