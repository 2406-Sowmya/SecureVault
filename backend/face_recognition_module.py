"""
face_recognition_module.py
--------------------------
Face recognition helpers adapted for the REST API.
All functions accept raw bytes (from multipart uploads)
instead of live OpenCV captures.
"""

import cv2
import json
import logging
import numpy as np
from datetime import datetime
from pathlib import Path

import face_recognition as fr

logger        = logging.getLogger(__name__)
INTRUDER_DIR  = Path(__file__).parent / "intruder_images"
TOLERANCE     = 0.50


def _bytes_to_frame(image_bytes: bytes) -> np.ndarray | None:
    """Decode raw JPEG/PNG bytes into a BGR numpy array."""
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame
    except Exception as exc:
        logger.error("_bytes_to_frame error: %s", exc)
        return None


def get_face_encoding_from_bytes(image_bytes: bytes) -> list | None:
    """
    Accept raw image bytes, return 128-float face encoding or None.
    Works for both registration and live login.
    """
    try:
        frame = _bytes_to_frame(image_bytes)
        if frame is None:
            return None
        rgb       = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        locations = fr.face_locations(rgb, model="hog")
        if not locations:
            return None
        encodings = fr.face_encodings(rgb, locations)
        return encodings[0].tolist() if encodings else None
    except Exception as exc:
        logger.error("get_face_encoding_from_bytes error: %s", exc)
        return None


def match_face(live_encoding: list, stored_encoding_json: str) -> bool:
    """
    Compare a live encoding against a stored JSON encoding.
    Returns True if they match within TOLERANCE.
    """
    try:
        stored     = json.loads(stored_encoding_json)
        live_arr   = np.array(live_encoding)
        stored_arr = np.array(stored)
        results    = fr.compare_faces([stored_arr], live_arr, tolerance=TOLERANCE)
        return bool(results[0])
    except Exception as exc:
        logger.error("match_face error: %s", exc)
        return False


def save_intruder_image_from_bytes(image_bytes: bytes, username: str) -> str:
    """Save intruder image bytes to disk and return the file path."""
    INTRUDER_DIR.mkdir(parents=True, exist_ok=True)
    ts       = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = INTRUDER_DIR / f"intruder_{username}_{ts}.jpg"
    frame    = _bytes_to_frame(image_bytes)
    if frame is not None:
        cv2.imwrite(str(filename), frame)
    logger.info("Intruder image saved: %s", filename)
    return str(filename)


def draw_face_boxes_on_bytes(image_bytes: bytes) -> bytes:
    """
    Detect faces, draw green boxes, return JPEG bytes.
    Used by the live preview endpoint if desired.
    """
    try:
        frame  = _bytes_to_frame(image_bytes)
        rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        locs   = fr.face_locations(rgb, model="hog")
        for top, right, bottom, left in locs:
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 220, 0), 2)
        _, buf = cv2.imencode(".jpg", frame)
        return buf.tobytes()
    except Exception as exc:
        logger.error("draw_face_boxes_on_bytes error: %s", exc)
        return image_bytes
