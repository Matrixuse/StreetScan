import glob
from collections import Counter
import os
p = r"d:\STREET SCAN\dataset\train\labels\*.txt"
ctr = Counter()
files = glob.glob(p)
for f in files:
    with open(f, 'r', encoding='utf-8', errors='ignore') as fh:
        for line in fh:
            line=line.strip()
            if not line: continue
            parts=line.split()
            try:
                cid=int(parts[0])
                ctr[cid]+=1
            except Exception:
                continue
print('files:', len(files))
print('class counts:', ctr)
