#!/usr/bin/env python3
"""Debug detection to see raw model output"""
import sys
import cv2
import numpy as np
import torch

# Add paths
BASE_DIR = '.'
YOLOV9_DIR = 'yolov9'
if YOLOV9_DIR not in sys.path:
    sys.path.insert(0, YOLOV9_DIR)

# Load model directly
print('Loading model directly...')
model = torch.hub.load(
    YOLOV9_DIR,
    'custom',
    path='models/agri_model.pt',
    source='local',
    force_reload=False,
    trust_repo=True,
    skip_validation=True
)

print(f'Model loaded. Available methods: {dir(model)}')
print(f'Model conf attribute: {hasattr(model, "conf")}')
if hasattr(model, 'conf'):
    print(f'Current conf: {model.conf}')

# Test image
img = cv2.imread('yolov9/data/images/horses.jpg')
print(f'Image shape: {img.shape}')

# Test 1: Default confidence
print('\n=== Test 1: Default confidence ===')
model.conf = 0.15
results = model(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
print(f'Results type: {type(results)}')
print(f'Has xyxy: {hasattr(results, "xyxy")}')
if hasattr(results, 'xyxy'):
    print(f'xyxy shape: {results.xyxy[0].shape if len(results.xyxy) > 0 else "empty"}')
    if len(results.xyxy[0]) > 0:
        print(f'First detection: {results.xyxy[0][0]}')

# Test 2: With 20% confidence
print('\n=== Test 2: With 20% confidence ===')
model.conf = 0.20
results = model(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
if hasattr(results, 'xyxy'):
    print(f'Detections: {len(results.xyxy[0])}')
    for i, det in enumerate(results.xyxy[0]):
        print(f'  {i}: {det}')

# Test 3: Raw model call without conf set
print('\n=== Test 3: Without confidence limit ===')
results = model(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
if hasattr(results, 'xyxy'):
    print(f'Total detections: {len(results.xyxy[0])}')
    for i, (*box, conf, cls) in enumerate(results.xyxy[0][:5]):
        print(f'  {i}: conf={conf:.4f}, cls={int(cls)}')
