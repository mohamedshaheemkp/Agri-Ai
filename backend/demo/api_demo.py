import sys
import os
import torch
from fastapi import FastAPI, UploadFile, File
import numpy as np
import cv2

app = FastAPI()
# add yolov9 to path
sys.path.append(os.path.abspath("yolov9"))

# load model
model = torch.hub.load(
    'yolov9',
    'custom',
    path='models/agri_model.pt',
    source='local'
)

model.conf = 0.25
@app.post("/detect")

async def detect(file: UploadFile = File(...)):

    contents = await file.read()

    nparr = np.frombuffer(contents, np.uint8)

    # cv2.imdecode reads as BGR
    bgr_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Convert to RGB since YOLOv9 expects RGB
    rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)

    results = model(rgb_image)

    detections = []
    
    for *box, conf, cls in results.xyxy[0]:
        x1, y1, x2, y2 = map(float, box)
        
        detections.append({
            "class": model.names[int(cls)],
            "confidence": float(conf),
            "bbox": [x1, y1, x2, y2]
        })

    return {"detections": detections}