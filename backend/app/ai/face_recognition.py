from __future__ import annotations

from typing import TYPE_CHECKING

import cv2
import numpy as np

from app.ai.face_service import get_face_analyzer

if TYPE_CHECKING:
    from app.models.face_encoding import FaceEncoding

SIMILARITY_THRESHOLD = 0.5


def recognize_face(
    image_bytes: bytes, encodings: list[FaceEncoding]
) -> tuple[int, float] | None:
    analyzer = get_face_analyzer()

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return None

    faces = analyzer.get(img)
    if not faces:
        return None

    query_emb = faces[0].embedding.astype(np.float32)
    query_emb /= np.linalg.norm(query_emb)

    best_student_id = None
    best_score = 0.0

    for enc in encodings:
        stored_emb = np.frombuffer(enc.embedding, dtype=np.float32).copy()
        stored_norm = np.linalg.norm(stored_emb)
        if stored_norm > 0:
            stored_emb /= stored_norm

        score = float(np.dot(query_emb, stored_emb))

        if score > best_score:
            best_score = score
            best_student_id = enc.student_id

    if best_student_id is None or best_score < SIMILARITY_THRESHOLD:
        return None

    return best_student_id, round(best_score, 4), query_emb
