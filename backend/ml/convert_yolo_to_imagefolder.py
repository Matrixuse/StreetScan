"""Convert YOLO-style dataset (images/, labels/) into ImageFolder layout
Creates: d:/STREET SCAN/dataset/imagefolder_train/Potholes and /NonPotholes
Mapping: class id 1 is considered Pothole (per your confirmation)."""
import os
from pathlib import Path
import shutil

ROOT = Path(r"d:/STREET SCAN/dataset")
SRC_IMAGES = ROOT / 'train' / 'images'
SRC_LABELS = ROOT / 'train' / 'labels'
OUT = ROOT / 'imagefolder_train'
PO = OUT / 'Potholes'
NP = OUT / 'NonPotholes'

PO.mkdir(parents=True, exist_ok=True)
NP.mkdir(parents=True, exist_ok=True)

count_po = 0
count_np = 0
copied = 0

for img_path in SRC_IMAGES.iterdir():
    if not img_path.is_file():
        continue
    name = img_path.stem
    lbl = SRC_LABELS / f"{name}.txt"
    is_pothole = False
    if lbl.exists():
        try:
            with open(lbl, 'r', encoding='utf-8', errors='ignore') as fh:
                for line in fh:
                    line = line.strip()
                    if not line:
                        continue
                    parts = line.split()
                    # YOLO label format: class x y w h ... (we only need first token)
                    try:
                        cid = int(float(parts[0]))
                    except Exception:
                        continue
                    if cid == 1:
                        is_pothole = True
                        break
        except Exception:
            # if label read fails, treat as nonpothole
            is_pothole = False
    else:
        # no label file -> treat as NonPothole
        is_pothole = False

    dest = PO if is_pothole else NP
    shutil.copy2(img_path, dest / img_path.name)
    copied += 1
    if is_pothole:
        count_po += 1
    else:
        count_np += 1

print(f"Copied {copied} images -> Potholes: {count_po}, NonPotholes: {count_np}")
print(f"ImageFolder dataset available at: {OUT}")
