import sys
import os
import torch
import cv2

# Ensure YOLOv9 module can be discovered
sys.path.append(os.path.abspath("yolov9"))
MODEL_PATH = "models/agri_model.pt"

model = torch.hub.load(
    'yolov9',
    'custom',
    path=MODEL_PATH,
    source='local'
)

# Set lower confidence threshold for live camera stream
model.conf = 0.25

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    raise RuntimeError("Failed to open camera")

while True:

    ret, frame = cap.read()
    if not ret or frame is None:
        print("Failed to read frame, exiting...")
        break

    # Convert BGR (OpenCV format) to RGB (YOLO default format)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    results = model(rgb_frame)

    # results.render() modifies and returns the RGB frame
    rendered_frame = results.render()[0]
    
    # Convert back to BGR for OpenCV display
    bgr_frame = cv2.cvtColor(rendered_frame, cv2.COLOR_RGB2BGR)

    cv2.imshow("Agri Bot Detection", bgr_frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()