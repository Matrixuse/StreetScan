import os
from collections import defaultdict
root = r"d:\STREET SCAN\dataset\train"
counts = defaultdict(int)
total = 0
for dirpath, dirnames, filenames in os.walk(root):
    # only count files in subdirectories (class folders)
    rel = os.path.relpath(dirpath, root)
    if rel == '.':
        continue
    cls = rel.split(os.sep)[0]
    for f in filenames:
        if f.lower().endswith(('.jpg','.jpeg','.png','.bmp','.gif')):
            counts[cls] += 1
            total += 1
print('per-class counts:')
for k,v in counts.items():
    print(f'  {k}: {v}')
print('total images:', total)
