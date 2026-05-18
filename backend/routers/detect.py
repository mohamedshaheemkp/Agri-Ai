import json
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.detection_service import detection_service

router = APIRouter()

# Pre-load remedies database for model classes (21 classes)
REMEDIES_DB = {}
try:
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "remedies.json")
    with open(db_path, "r") as f:
        REMEDIES_DB = json.load(f)
    print("[INIT] Loaded remedies database with", len(REMEDIES_DB), "disease/pest entries")
except Exception as e:
    print(f"Warning: Could not load remedies database: {e}")

@router.post("/detect")
async def detect_image(file: UploadFile = File(...)):
    """
    Endpoint that accepts an image via multipart form upload,
    sends it to the detection service running YOLOv9,
    compares findings with agricultural treatments Database,
    and returns a structured JSON list of detected objects with treatment advice.
    """
    try:
        print(f"\n[API] /detect endpoint called - file: {file.filename}")
        
        if detection_service.model is None:
            print("[API] ERROR: Model is None")
            raise HTTPException(
                status_code=503, 
                detail="AI Model is not loaded. Check backend logs for details."
            )
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            print(f"[API] ERROR: Invalid file type: {file.content_type}")
            raise HTTPException(status_code=400, detail="File must be an image (JPG, PNG, etc)")
        
        # Limit file size to 10MB
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            print(f"[API] ERROR: File too large: {len(contents)} bytes")
            raise HTTPException(status_code=413, detail="File too large. Maximum 10MB allowed.")
        
        print(f"[API] File size: {len(contents)} bytes, type: {file.content_type}")
        
        # Pass bytes to detection logic
        detections = detection_service.detect(contents)
        print(f"[API] Got {len(detections)} detections from model")
        
        # Augment AI inference with Remedies knowledgebase
        for det in detections:
            class_key = det["class_name"]
            
            # Direct match lookup in remedies database
            if class_key in REMEDIES_DB:
                remedies = REMEDIES_DB[class_key]
                det["treatment"] = remedies.get("treatment", [])
                det["preventive_measures"] = remedies.get("preventive_measures", [])
                det["severity"] = remedies.get("severity", "Unknown")
                det["crop"] = remedies.get("crop", "Unknown")
                det["type"] = remedies.get("type", "Unknown")
                det["scientific_name"] = remedies.get("scientific_name", "")
                det["impact"] = remedies.get("impact", "")
            else:
                # Fallback if class not in database
                det["treatment"] = []
                det["preventive_measures"] = []
                det["severity"] = "Unknown"
                det["crop"] = "Unknown"
                det["type"] = "Unknown"
                det["scientific_name"] = ""
                det["impact"] = ""
        
        print(f"[API] Augmented detections with remedies data")
        print(f"[API] Returning response with {len(detections)} detections")
        return {"status": "success", "detections": detections}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API] Error during detection: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@router.get("/detect-test")
async def detect_test():
    """
    DEBUG ENDPOINT: Returns mock detections for testing canvas rendering
    """
    print("\n[API] /detect-test called - returning mock detections")
    
    mock_detections = [
        {
            "class_name": "Cotton bollworm",
            "confidence": 0.85,
            "bbox": [100, 150, 250, 320],
            "treatment": ["Spray Bt (Bacillus thuringiensis)"],
            "preventive_measures": ["Monitor crops weekly"]
        },
        {
            "class_name": "Green peach aphid", 
            "confidence": 0.72,
            "bbox": [300, 200, 450, 280],
            "treatment": ["Use insecticidal soap"],
            "preventive_measures": ["Remove affected leaves"]
        },
        {
            "class_name": "Beet armyworm",
            "confidence": 0.91,
            "bbox": [50, 50, 180, 150],
            "treatment": ["Spray pyrethrin"],
            "preventive_measures": ["Plant resistant varieties"]
        }
    ]
    
    print(f"[API] Returning {len(mock_detections)} mock detections")
    return {"status": "success", "detections": mock_detections}
