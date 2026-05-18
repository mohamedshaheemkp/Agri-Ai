import os
import sys
import types
import warnings
import json
import numpy as np
import cv2
import torch
from collections import deque, Counter

warnings.filterwarnings('ignore')

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: Shim pkg_resources BEFORE importing anything from yolov9
# utils/general.py does:  import pkg_resources as pkg
#     then uses:  pkg.parse_version, pkg.require, pkg.VersionConflict,
#                 pkg.DistributionNotFound, pkg.parse_requirements
# ─────────────────────────────────────────────────────────────────────────────
try:
    import pkg_resources
    # Make sure parse_version exists (older setuptools may miss it)
    pkg_resources.parse_version  # will raise AttributeError if missing
except Exception:
    # Build a minimal shim using `packaging` (always available with pip)
    try:
        from packaging.version import Version as _Version
        _parse_version = _Version
    except ImportError:
        _parse_version = lambda v: tuple(int(x) for x in str(v).split(".")[:3])  # noqa

    class _FakeDistributionNotFound(Exception):
        pass

    class _FakeVersionConflict(Exception):
        pass

    _pkg_shim = types.ModuleType("pkg_resources")
    _pkg_shim.parse_version = _parse_version
    _pkg_shim.require = lambda *a, **k: None
    _pkg_shim.parse_requirements = lambda txt: []
    _pkg_shim.DistributionNotFound = _FakeDistributionNotFound
    _pkg_shim.VersionConflict = _FakeVersionConflict
    sys.modules["pkg_resources"] = _pkg_shim
    print("[LOADER] pkg_resources shimmed successfully")

try:
    import IPython
except ImportError:
    import sys
    import types
    _ipython = types.ModuleType("IPython")
    _ipython_display = types.ModuleType("IPython.display")
    _ipython_display.display = lambda *a, **k: None
    _ipython.display = _ipython_display
    sys.modules["IPython"] = _ipython
    sys.modules["IPython.display"] = _ipython_display
    print("[LOADER] IPython shimmed successfully")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: Add yolov9 repo to sys.path so torch.load can unpickle model classes
# ─────────────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YOLOV9_DIR = os.path.join(BASE_DIR, "yolov9")
if YOLOV9_DIR not in sys.path:
    sys.path.insert(0, YOLOV9_DIR)
    print(f"[LOADER] Added yolov9 to sys.path: {YOLOV9_DIR}")


class DetectionSmoother:
    def __init__(self, buffer_size=10, min_votes=6):
        self.buffer = deque(maxlen=buffer_size)
        self.min_votes = min_votes
    
    def add(self, detections):
        self.buffer.append(detections)
    
    def get_stable(self):
        all_labels = [label for frame in self.buffer for label in frame]
        counts = Counter(all_labels)
        return [label for label, count in counts.items() if count >= self.min_votes]

def preprocess_frame(frame):
    # 1. Resize to match training input size (usually 640x640 for YOLOv9)
    frame = cv2.resize(frame, (640, 640))
    
    # 2. Improve contrast and brightness (helps in poor lighting)
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    l = clahe.apply(l)
    frame = cv2.merge((l, a, b))
    frame = cv2.cvtColor(frame, cv2.COLOR_LAB2BGR)
    
    return frame

class DetectionService:
    IMG_SIZE = 640       # YOLOv9 standard input size
    
    # 1. CONFIDENCE THRESHOLD FIX
    DEBUG_MODE = False
    BASE_CONF_THRES = 0.55
    
    IOU_THRES = 0.45     # NMS IoU threshold

    # Adaptive Thresholding: 
    CLASS_THRESHOLDS = {
        'healthy': 0.70,
        'background': 0.99, 
        'strawberry_leaf_spot': 0.65, 
        'default': BASE_CONF_THRES 
    }

    def __init__(self):
        self.model_path = os.path.join(BASE_DIR, "models", "agri_model.pt")
        self.model = None
        self.names = {}   # {int: str}  class id → class name
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.remedies = {}
        self.smoother = DetectionSmoother(buffer_size=10, min_votes=6)
        self._load_remedies()
        self._load_model()

    def _load_remedies(self):
        remedy_path = os.path.join(BASE_DIR, "remedies.json")
        try:
            with open(remedy_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Lowercase keys for robust matching
                for k, v in data.items():
                    self.remedies[k.lower()] = v
        except Exception as e:
            print(f"[REMEDY] Failed to load remedies.json: {e}")

    # ─────────────────────────────────────────────────────────────────────────
    def _load_model(self):
        """Load the custom YOLOv9 checkpoint via torch.load."""
        if not os.path.exists(self.model_path):
            print(f"[ERROR] Model file not found: {self.model_path}")
            return

        print(f"[LOADING] YOLOv9 model from: {self.model_path}")
        print(f"[LOADING] Device: {self.device}")

        try:
            ckpt = torch.load(self.model_path, map_location=self.device, weights_only=False)
            print(f"[LOADING] Checkpoint type: {type(ckpt)}")

            # ── Extract the inner model from checkpoint dict ──────────────────
            if isinstance(ckpt, dict):
                print(f"[LOADING] Checkpoint keys: {list(ckpt.keys())}")
                inner = ckpt.get("model") or ckpt.get("ema") or ckpt.get("net")
                if inner is None:
                    raise RuntimeError(f"Cannot find model in checkpoint keys: {list(ckpt.keys())}")

                # NOTE:
                # Do NOT unwrap `inner.model` here.
                # For YOLO checkpoints, `inner` is usually the full Model wrapper
                # that contains metadata (`names`, strides, detect head behavior).
                # Replacing it with `inner.model` often downgrades it to a plain
                # Sequential module, which breaks post-processing and can cause
                # backend 500 errors during NMS.

                # Handle DataParallel / DistributedDataParallel wrappers safely.
                if hasattr(inner, "module"):
                    inner = inner.module

                # Class names stored in checkpoint
                raw_names = ckpt.get("names") or getattr(inner, "names", {})
            else:
                # Already a model object
                inner = ckpt
                raw_names = getattr(inner, "names", {})

            # ── Move to device, set precision and eval mode ─────────────────────
            self.model = inner.to(self.device)
            if hasattr(self.model, "float"):
                self.model = self.model.float()
            self.model.eval()
            # Note: fuse() skipped — alters output tensor layout causing 500 errors


            # ── Extract class names ────────────────────────────────────────────
            if isinstance(raw_names, dict):
                self.names = {int(k): str(v) for k, v in raw_names.items()}
            elif isinstance(raw_names, (list, tuple)):
                self.names = {i: str(n) for i, n in enumerate(raw_names)}
            else:
                self.names = {}

            # Fallback: get names from model attribute
            if not self.names and hasattr(self.model, "names"):
                n = self.model.names
                if isinstance(n, dict):
                    self.names = {int(k): str(v) for k, v in n.items()}
                elif isinstance(n, (list, tuple)):
                    self.names = {i: str(v) for i, v in enumerate(n)}

            print(f"[SUCCESS] Model loaded! Classes ({len(self.names)}): {list(self.names.values())[:5]}...")

        except Exception as e:
            print(f"[FAILED] Model loading failed: {e}")
            import traceback
            traceback.print_exc()
            self.model = None

    # ─────────────────────────────────────────────────────────────────────────
    def _letterbox(self, img, new_shape=(640, 640), color=(114, 114, 114)):
        shape = img.shape[:2]  # h, w
        r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])
        new_unpad = int(round(shape[1] * r)), int(round(shape[0] * r))
        
        dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]  # wh padding
        dw /= 2  # divide padding into 2 sides
        dh /= 2

        if shape[::-1] != new_unpad:  # resize
            img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)
        top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
        left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
        img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)
        return img, r, (dw, dh)

    def _preprocess(self, image_bytes: bytes):
        """Decode image bytes → normalised [1,3,640,640] float tensor."""
        nparr = np.frombuffer(image_bytes, np.uint8)
        bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if bgr is None:
            raise ValueError("Corrupted or invalid image data.")

        orig_h, orig_w = bgr.shape[:2]
        bgr = preprocess_frame(bgr)
        crop_obj = {"x_offset": 0, "y_offset": 0, "orig_w": orig_w, "orig_h": orig_h, "used_custom_resize": True}
        ratio = 1.0
        dw, dh = 0, 0

        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

        # HWC → CHW, normalise to [0,1]
        tensor = torch.from_numpy(rgb).permute(2, 0, 1).float() / 255.0
        tensor = tensor.unsqueeze(0).to(self.device)   # [1, 3, 640, 640]
        return tensor, ratio, dw, dh, crop_obj

    # ─────────────────────────────────────────────────────────────────────────
    def _nms(self, raw_pred, ratio, dw, dh, crop_obj):
        """Apply NMS and scale boxes back to original image size."""
        try:
            from utils.general import non_max_suppression
            # Use ultra low base config to let everything through down to 0.01
            results = non_max_suppression(raw_pred, self.BASE_CONF_THRES, self.IOU_THRES)
        except Exception as e:
            print(f"[NMS] Built-in NMS failed: {e}. Using fallback mode.")
            # Fallback: manual NMS using torchvision
            return self._manual_nms(raw_pred, ratio, dw, dh, crop_obj)

        detections = []
        if results and len(results[0]):
            preds = results[0].cpu().numpy()   # [x1, y1, x2, y2, conf, cls]
            for *box, conf, cls in preds:
                cls_id = int(cls)
                class_name = self.names.get(cls_id, f"Class_{cls_id}")
                
                # Check dynamic threshold
                required_conf = self.CLASS_THRESHOLDS.get(class_name.lower(), self.CLASS_THRESHOLDS['default'])
                if float(conf) < required_conf:
                    # DEBUG OUTPUT: Log raw detections before filtering
                    if self.DEBUG_MODE or float(conf) > 0.05:
                        print(f"   [FILTERED] Dropped {class_name} (Conf: {float(conf):.3f}) -> Needed {required_conf}")
                    continue

                if crop_obj.get("used_custom_resize"):
                    x1 = float(box[0]) * (crop_obj["orig_w"] / 640.0)
                    y1 = float(box[1]) * (crop_obj["orig_h"] / 640.0)
                    x2 = float(box[2]) * (crop_obj["orig_w"] / 640.0)
                    y2 = float(box[3]) * (crop_obj["orig_h"] / 640.0)
                else:
                    x1 = ((float(box[0]) - dw) / ratio) + crop_obj["x_offset"]
                    y1 = ((float(box[1]) - dh) / ratio) + crop_obj["y_offset"]
                    x2 = ((float(box[2]) - dw) / ratio) + crop_obj["x_offset"]
                    y2 = ((float(box[3]) - dh) / ratio) + crop_obj["y_offset"]
                
                detections.append({
                    "class_id": cls_id,
                    "class_name": class_name,
                    "confidence": float(conf),
                    "bbox": [x1, y1, x2, y2],
                })
        return detections

    def _manual_nms(self, raw_pred, ratio, dw, dh, crop_obj):
        """Fallback NMS without yolov9's utils.general."""
        from torchvision.ops import nms as tv_nms
        detections = []
        try:
            # raw_pred shape: [1, num_preds, 5+nc]  or list of tensors
            pred = raw_pred[0] if isinstance(raw_pred, (list, tuple)) else raw_pred
            if pred.ndim == 3:
                pred = pred[0]
            
            # Often YOLOv8/9 outputs [channels, anchors], e.g. [84, 8400]
            # We need it transposed to [anchors, channels], e.g. [8400, 84]
            if pred.shape[0] < pred.shape[1]:
                pred = pred.transpose(0, 1)

            if pred.shape[-1] < 6:
                return detections

            pred = pred.cpu()
            
            # YOLO output is usually [cx, cy, w, h] not [x1, y1, x2, y2]
            boxes_raw = pred[:, :4]
            x1 = boxes_raw[:, 0] - boxes_raw[:, 2] / 2
            y1 = boxes_raw[:, 1] - boxes_raw[:, 3] / 2
            x2 = boxes_raw[:, 0] + boxes_raw[:, 2] / 2
            y2 = boxes_raw[:, 1] + boxes_raw[:, 3] / 2
            boxes_xyxy = torch.stack((x1, y1, x2, y2), dim=1)

            scores_all = pred[:, 4:]
            conf_scores, cls_ids = scores_all.max(dim=1)
            keep_mask = conf_scores >= self.BASE_CONF_THRES
            
            boxes_xyxy = boxes_xyxy[keep_mask]
            conf_scores = conf_scores[keep_mask]
            cls_ids = cls_ids[keep_mask]

            if len(boxes_xyxy) == 0:
                return detections

            keep = tv_nms(boxes_xyxy, conf_scores, self.IOU_THRES)

            for idx in keep:
                cls_id = int(cls_ids[idx])
                class_name = self.names.get(cls_id, f"Class_{cls_id}")
                confidence = float(conf_scores[idx])

                # Check dynamic threshold
                required_conf = self.CLASS_THRESHOLDS.get(class_name.lower(), self.CLASS_THRESHOLDS['default'])
                if confidence < required_conf:
                    # DEBUG OUTPUT: Log raw detections before filtering
                    if self.DEBUG_MODE or confidence > 0.05:
                        print(f"   [FILTERED] Dropped {class_name} (Conf: {confidence:.3f}) -> Needed {required_conf}")
                    continue

                px1, py1, px2, py2 = boxes_xyxy[idx].tolist()
                if crop_obj.get("used_custom_resize"):
                    rx1 = px1 * (crop_obj["orig_w"] / 640.0)
                    ry1 = py1 * (crop_obj["orig_h"] / 640.0)
                    rx2 = px2 * (crop_obj["orig_w"] / 640.0)
                    ry2 = py2 * (crop_obj["orig_h"] / 640.0)
                else:
                    rx1 = ((px1 - dw) / ratio) + crop_obj["x_offset"]
                    ry1 = ((py1 - dh) / ratio) + crop_obj["y_offset"]
                    rx2 = ((px2 - dw) / ratio) + crop_obj["x_offset"]
                    ry2 = ((py2 - dh) / ratio) + crop_obj["y_offset"]

                detections.append({
                    "class_id": cls_id,
                    "class_name": class_name,
                    "confidence": confidence,
                    "bbox": [rx1, ry1, rx2, ry2],
                })
        except Exception as e:
            print(f"[NMS] Manual NMS error: {e}")
            import traceback
            traceback.print_exc()
        return detections

    # ─────────────────────────────────────────────────────────────────────────
    def detect(self, image_bytes: bytes):
        """Full pipeline: bytes → tensor → inference → NMS → list of dicts."""
        if self.model is None:
            raise RuntimeError("Model is not loaded. Check backend startup logs.")

        tensor, ratio, dw, dh, crop_obj = self._preprocess(image_bytes)
        print(f"[DETECT] Input tensor: {tensor.shape}, device: {tensor.device}")

        with torch.no_grad():
            raw_pred = self.model(tensor)

        # Handle dual-head or multiple-output YOLOv9 output
        print(f"[DETECT] raw_pred type: {type(raw_pred)}")
        if isinstance(raw_pred, (tuple, list)):
            print(f"[DETECT] raw_pred is {type(raw_pred)} of length {len(raw_pred)}")
            for i, item in enumerate(raw_pred):
                print(f"   [{i}] type: {type(item)}, shape: {getattr(item, 'shape', 'no shape')}")
            
            # Usually the first element is the inference output tensor [1, num_anchors, 5+nc]
            # But sometimes it's nested or different.
            if isinstance(raw_pred[0], torch.Tensor):
                raw_pred = raw_pred[0]
            elif isinstance(raw_pred[0], (list, tuple)) and len(raw_pred[0]) > 0:
                # Sometimes it's a list of tensors from different heads
                print(f"[DETECT] first element is {type(raw_pred[0])}, taking first sub-element")
                raw_pred = raw_pred[0][0]

        print(f"[DETECT] Final raw_pred shape: {getattr(raw_pred, 'shape', 'NO SHAPE')}")

        try:
            detections = self._nms(raw_pred, ratio, dw, dh, crop_obj)
        except Exception as e:
            print(f"❌ NMS Exception: {e}")
            import traceback
            traceback.print_exc()
            raise RuntimeError(f"NMS failed: {e}")

        # Apply Temporal Smoothing
        self.smoother.add([d['class_name'] for d in detections])
        stable_labels = self.smoother.get_stable()
        detections = [d for d in detections if d['class_name'] in stable_labels]

        # Attach remedies from remedies.json explicitly
        for det in detections:
            c_name = det.get('class_name', '').lower()
            # Handle potential mismatch between underscores and spaces
            remedy = self.remedies.get(c_name) or self.remedies.get(c_name.replace('_', ' ')) or self.remedies.get(c_name.replace(' ', '_'))
            if remedy:
                det['remedy'] = remedy

        # Debug print - before returning to frontend
        print(f"[DETECT] Returning {len(detections)} detections:")
        for det in detections:
            has_remedy = "Yes" if 'remedy' in det else "No"
            print(f"   Raw index: {det.get('class_id')}, Mapped: {det.get('class_name')}, Conf: {det.get('confidence'):.3f}, Remedy: {has_remedy}")

        return detections


# ─── Singleton ────────────────────────────────────────────────────────────────
detection_service = None
try:
    detection_service = DetectionService()
except Exception as e:
    print(f"\n⚠️  Detection service init failed: {e}")

    class _StubDetector:
        model = None
        names = {}
        def detect(self, *a, **k):
            raise RuntimeError("Model not loaded")

    detection_service = _StubDetector()
