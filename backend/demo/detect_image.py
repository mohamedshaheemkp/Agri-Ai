import torch
import sys

MODEL_PATH = "models/agri_model.pt"

# load model
model = torch.hub.load(
    'yolov9',
    'custom',
    path=MODEL_PATH,
    source='local'
)

# Default to horses.jpg if no argument is provided
image_path = sys.argv[1] if len(sys.argv) > 1 else "yolov9/data/images/horses.jpg"

# Run inference
results = model(image_path)

# Show results in terminal
results.print()

# Display the image window
results.show()

# Save the predicted image to disk (creates a 'runs' folder)
results.save()