import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from services.detection_service import detection_service

if detection_service.model is not None:
    print("✅ Model loaded successfully!")
    print(f"   Classes: {len(detection_service.names)}")
    print(f"   Sample:  {list(detection_service.names.values())[:5]}")
else:
    print("❌ Model is None — loading failed, check errors above")
