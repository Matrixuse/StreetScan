import os
root=r"d:\STREET SCAN\dataset\train"
exts = {'.jpg':0,'.jpeg':0,'.png':0,'.bmp':0,'.ppm':0,'.pgm':0,'.tif':0,'.tiff':0,'.webp':0}
files=0
for dirpath,dirnames,filenames in os.walk(root):
    for f in filenames:
        files+=1
        ext=os.path.splitext(f)[1].lower()
        if ext in exts:
            exts[ext]+=1
print('total files found by os.walk:', files)
print('counts by ext (supported):')
for k,v in exts.items():
    print(k,v)
# print a few sample files
sample=[]
for dirpath,dirnames,filenames in os.walk(root):
    for f in filenames:
        if os.path.splitext(f)[1].lower() in exts:
            sample.append(os.path.join(dirpath,f))
            if len(sample)>=10:
                break
    if len(sample)>=10:
        break
print('samples:')
for s in sample:
    print(s)
