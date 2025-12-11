r"""Train a ResNet18 classifier on an ImageFolder dataset with validation,
class balancing and mixed-precision support.

This script adds:
 - optional validation split (--val_split)
 - balanced training sampler to reduce class imbalance (--balanced)
 - mixed precision (automatic if device is CUDA)
 - checkpointing of best model by validation accuracy

Usage example:
    python train_classifier.py --data_dir "d:/STREET SCAN/dataset/train" --epochs 15 --batch 32 --pretrained --balanced --val_split 0.1

Saves best weights to `backend/ml/weights/classifier.pth` by default.
"""

import argparse
import os
from pathlib import Path
import math

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset, WeightedRandomSampler
import torchvision.transforms as T
import torchvision.datasets as datasets
import torchvision.models as models
from tqdm import tqdm


def make_transforms(train=True):
    if train:
        return T.Compose([
            T.Resize((256, 256)),
            T.RandomResizedCrop(224),
            T.RandomHorizontalFlip(),
            T.ColorJitter(0.2, 0.2, 0.2, 0.05),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    else:
        return T.Compose([
            T.Resize((224, 224)),
            T.CenterCrop(224),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])


def create_sampler(dataset):
    # dataset.targets exist for ImageFolder
    targets = [s[1] for s in dataset.samples]
    class_sample_count = torch.tensor([(targets == i).sum() if isinstance(targets, torch.Tensor) else sum(1 for t in targets if t == i) for i in range(len(dataset.classes))], dtype=torch.float)
    # avoid division by zero
    class_sample_count[class_sample_count == 0] = 1.0
    weight = 1.0 / class_sample_count
    samples_weight = [weight[t] for t in targets]
    sampler = WeightedRandomSampler(weights=samples_weight, num_samples=len(samples_weight), replacement=True)
    return sampler


def train(data_dir, epochs=5, batch_size=32, lr=1e-4, out_dir=None, device=None, num_workers=0, use_pretrained=False, val_split=0.1, balanced=False):
    device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
    use_amp = (device == 'cuda')

    out_dir = Path(out_dir or Path(__file__).parent / 'weights')
    out_dir.mkdir(parents=True, exist_ok=True)
    weights_path = out_dir / 'classifier.pth'

    # full dataset (transforms will be applied per-split)
    full_dataset = datasets.ImageFolder(data_dir, transform=None)
    num_samples = len(full_dataset)
    classes = full_dataset.classes
    print(f"Found {num_samples} images across {len(classes)} classes: {classes}")

    # validation split
    if val_split and val_split > 0.0:
        val_count = int(math.floor(num_samples * val_split))
        train_count = num_samples - val_count
        train_ds, val_ds = torch.utils.data.random_split(full_dataset, [train_count, val_count])
        # set proper transforms on subsets
        train_ds.dataset.transform = make_transforms(train=True)
        val_ds.dataset.transform = make_transforms(train=False)
    else:
        train_ds = full_dataset
        train_ds.transform = make_transforms(train=True)
        val_ds = None

    print(f"Using device: {device} | num_workers: {num_workers} | batch_size: {batch_size} | val_split: {val_split} | balanced: {balanced}")

    if balanced:
        # sampler expects a dataset with .samples attribute (ImageFolder) so only works when no random_split was used
        if isinstance(train_ds, Subset):
            # build a subset-aware sampler using indices
            # map subset indices back to original dataset samples
            indices = train_ds.indices
            targets = [full_dataset.samples[i][1] for i in indices]
            counts = torch.tensor([sum(1 for t in targets if t == i) for i in range(len(classes))], dtype=torch.float)
            counts[counts == 0] = 1.0
            weight_per_class = 1.0 / counts
            samples_weight = [weight_per_class[t] for t in targets]
            sampler = WeightedRandomSampler(samples_weight, num_samples=len(samples_weight), replacement=True)
            train_loader = DataLoader(train_ds, batch_size=batch_size, sampler=sampler, num_workers=num_workers)
        else:
            sampler = create_sampler(train_ds)
            train_loader = DataLoader(train_ds, batch_size=batch_size, sampler=sampler, num_workers=num_workers)
    else:
        train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers)

    val_loader = None
    if val_ds is not None:
        val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)

    # model
    model = models.resnet18(pretrained=use_pretrained)
    model.fc = nn.Linear(model.fc.in_features, len(classes))
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    scaler = torch.cuda.amp.GradScaler(enabled=use_amp)

    best_val_acc = 0.0

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        running_correct = 0
        running_total = 0
        print(f"Starting epoch {epoch}/{epochs}...")
        try:
            loop = tqdm(train_loader, desc=f"Epoch {epoch}/{epochs}")
            for imgs, labels in loop:
                imgs = imgs.to(device)
                labels = labels.to(device)
                optimizer.zero_grad()
                with torch.cuda.amp.autocast(enabled=use_amp):
                    outputs = model(imgs)
                    loss = criterion(outputs, labels)
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()

                running_loss += loss.item() * imgs.size(0)
                _, predicted = outputs.max(1)
                running_correct += (predicted == labels).sum().item()
                running_total += labels.size(0)
                loop.set_postfix(loss=running_loss / running_total, acc=running_correct / running_total)
        except KeyboardInterrupt:
            torch.save(model.state_dict(), weights_path)
            print('\nTraining interrupted. Partial weights saved to', weights_path)
            raise

        epoch_loss = running_loss / running_total if running_total else 0.0
        epoch_acc = running_correct / running_total if running_total else 0.0
        print(f"Train {epoch}/{epochs} - loss: {epoch_loss:.4f} - acc: {epoch_acc:.4f}")

        # validation
        if val_loader is not None:
            model.eval()
            val_loss = 0.0
            val_correct = 0
            val_total = 0
            with torch.no_grad():
                for imgs, labels in val_loader:
                    imgs = imgs.to(device)
                    labels = labels.to(device)
                    with torch.cuda.amp.autocast(enabled=use_amp):
                        outputs = model(imgs)
                        loss = criterion(outputs, labels)
                    val_loss += loss.item() * imgs.size(0)
                    _, predicted = outputs.max(1)
                    val_correct += (predicted == labels).sum().item()
                    val_total += labels.size(0)
            val_loss = val_loss / val_total if val_total else 0.0
            val_acc = val_correct / val_total if val_total else 0.0
            print(f"Val   {epoch}/{epochs} - loss: {val_loss:.4f} - acc: {val_acc:.4f}")
            # save best
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                torch.save(model.state_dict(), weights_path)
                print(f"New best val acc {best_val_acc:.4f} - saved weights to {weights_path}")
        else:
            # save every epoch if no val split
            torch.save(model.state_dict(), weights_path)

    print('Training finished, best val acc:', best_val_acc)
    print('Weights saved to', weights_path)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data_dir', required=True, help='Path to ImageFolder-style dataset (two class subfolders)')
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--batch', type=int, default=32)
    parser.add_argument('--lr', type=float, default=1e-4)
    parser.add_argument('--num_workers', type=int, default=4, help='DataLoader num_workers')
    parser.add_argument('--pretrained', action='store_true', help='Use torchvision pretrained weights (may download)')
    parser.add_argument('--out_dir', default=None)
    parser.add_argument('--device', default=None, help='cuda or cpu')
    parser.add_argument('--val_split', type=float, default=0.1, help='Fraction of dataset to use for validation (0.0 to disable)')
    parser.add_argument('--balanced', action='store_true', help='Use a weighted sampler to balance classes during training')
    args = parser.parse_args()
    train(args.data_dir, epochs=args.epochs, batch_size=args.batch, lr=args.lr, out_dir=args.out_dir, device=args.device, num_workers=args.num_workers, use_pretrained=args.pretrained, val_split=args.val_split, balanced=args.balanced)
