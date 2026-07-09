from pathlib import Path

import cv2
import numpy as np

from app.core.config import settings

_face_analyzer = None


def get_face_analyzer():
    global _face_analyzer
    if _face_analyzer is None:
        from insightface.app import FaceAnalysis

        _face_analyzer = FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"],
        )
        _face_analyzer.prepare(ctx_id=0, det_size=(640, 640))
    return _face_analyzer


def get_upload_dir(student_id: int) -> Path:
    path = Path(settings.UPLOAD_DIR) / "faces" / str(student_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def detect_and_embed(image_bytes: bytes, student_id: int, pose: str = "front") -> tuple | None:
    analyzer = get_face_analyzer()

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return None

    faces = analyzer.get(img)
    if not faces:
        return None

    face = faces[0]
    embedding = face.embedding.astype(np.float32).tobytes()
    quality = float(face.det_score)

    upload_dir = get_upload_dir(student_id)
    count = len(list(upload_dir.glob("*.jpg")))
    filename = f"{pose}_{count + 1}.jpg"
    filepath = upload_dir / filename
    cv2.imwrite(str(filepath), img)

    return embedding, str(filepath), quality
