import os
from pathlib import Path
p = Path(r"d:\STREET SCAN\dataset\train")
print('exists:', p.exists())
print('is_dir:', p.is_dir())
try:
    entries = sorted([e.name for e in p.iterdir()])
    print('subdirs (first 20):', entries[:20])
    for sub in entries[:5]:
        subp = p / sub
        files = [f.name for f in subp.iterdir() if f.is_file()]
        total = sum(1 for f in subp.iterdir() if f.is_file())
        sample = files[:5]
        print(f"class {sub} -> count: {total}, samples: {sample}")
except Exception as e:
    print('error listing:', e)
