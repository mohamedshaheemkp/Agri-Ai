#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Test detection with real image"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import cv2
from services.detection_service import detection_service

print("=" * 60)
print("Testing YOLOv9 Detection - Direct Model Test")
print("=" * 60)

# Test with the horses image from YOLO data
test_img_path = "yolov9/data/images/horses.jpg"

try:
    print(f"\n1. Testing with local image: {test_img_path}")
    img = cv2.imread(test_img_path)
    
    if img is None:
        print(f"   ERROR: Could not load image")
        exit(1)
    
    print(f"   Image shape: {img.shape}")
    
    # Convert to bytes (JPEG)
    success, buffer = cv2.imencode('.jpg', img)
    if not success:
        print("   ERROR: Failed to encode image")
        exit(1)
    
    img_bytes = buffer.tobytes()
    print(f"   Image size: {len(img_bytes)} bytes")
    
    # Test direct model detection (bypass API)
    print(f"\n2. Testing direct model inference...")
    detections = detection_service.detect(img_bytes)
    print(f"\n   Result: Found {len(detections)} objects")
    
    if detections:
        print(f"\n   Detections:")
        for i, det in enumerate(detections):
            print(f"     [{i+1}] {det.get('class_name', 'Unknown')}")
            print(f"         Confidence: {det.get('confidence', 0):.2%}")
            print(f"         BBox: {det.get('bbox', [])}")
    else:
        print("   (No objects detected - this is normal for non-agricultural image)")
    
    # Now test via API
    print(f"\n3. Testing via API endpoint...")
    files = {'file': ('test.jpg', img_bytes, 'image/jpeg')}
    response = requests.post('http://localhost:8000/api/detect', files=files, timeout=10)
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   API Response: {len(data.get('detections', []))} detections")
        
        api_detections = data.get('detections', [])
        if api_detections:
            print(f"\n   API Detections:")
            for i, det in enumerate(api_detections):
                print(f"     [{i+1}] {det.get('class_name', 'Unknown')}")
                print(f"         Confidence: {det.get('confidence', 0):.2%}")
    else:
        print(f"   ERROR: {response.text}")
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
