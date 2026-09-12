"""Classical (non-deep-learning) image-processing heuristics for retinal
vascular biomarker estimation.

IMPORTANT — SCOPE AND LIMITATIONS:
These are deterministic, rule-based approximations built with OpenCV only
(no trained neural network, no learned weights). They exist so the AI
microservice can produce genuine output and genuine wall-clock timing
(for measuring NFR-1) instead of mocked/hard-coded values, while no
validated diagnostic model is available in this repository.

They are NOT a clinically validated vessel/disc/cup segmentation model.
Do not present the biomarkers or disease "predictions" derived from these
heuristics as a diagnostic result for real patients.
"""
import cv2
import numpy as np


def fov_mask(enhanced_rgb: np.ndarray, tol: int = 15) -> np.ndarray:
    """Approximate field-of-view (retinal disc area vs. black border)."""
    gray = cv2.cvtColor(enhanced_rgb, cv2.COLOR_RGB2GRAY)
    _, mask = cv2.threshold(gray, tol, 255, cv2.THRESH_BINARY)
    return mask


def segment_vessels(enhanced_rgb: np.ndarray) -> np.ndarray:
    """Binary vessel mask via top-hat filtering on the green channel, which
    carries the strongest vessel/background contrast in fundus photography."""
    green = enhanced_rgb[:, :, 1]
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    blackhat = cv2.morphologyEx(green, cv2.MORPH_BLACKHAT, kernel)
    blackhat = cv2.normalize(blackhat, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    blurred = cv2.GaussianBlur(blackhat, (5, 5), 0)
    _, mask = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    mask = cv2.morphologyEx(
        mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    )
    return mask


def vessel_density_percent(vessel_mask: np.ndarray, field_mask: np.ndarray) -> float:
    field_px = max(int(np.count_nonzero(field_mask)), 1)
    vessel_px = int(np.count_nonzero((vessel_mask > 0) & (field_mask > 0)))
    return round(100.0 * vessel_px / field_px, 2)


def _skeletonize(binary_img: np.ndarray) -> np.ndarray:
    """Classic morphological skeletonization (iterative erode/open/subtract)."""
    img = (binary_img > 0).astype(np.uint8) * 255
    skel = np.zeros(img.shape, np.uint8)
    element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
    for _ in range(200):  # hard cap so a pathological mask can't loop forever
        eroded = cv2.erode(img, element)
        opened = cv2.dilate(eroded, element)
        temp = cv2.subtract(img, opened)
        skel = cv2.bitwise_or(skel, temp)
        img = eroded
        if cv2.countNonZero(img) == 0:
            break
    return skel


def tortuosity_index(vessel_mask: np.ndarray, top_n: int = 15, max_pts: int = 200) -> float:
    """Arc/chord ratio averaged over the longest skeleton segments.
    ~1.0 = straight, higher = more tortuous. Clipped to a plausible range."""
    skel = _skeletonize(vessel_mask)
    contours, _ = cv2.findContours(skel, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    contours = [c for c in contours if len(c) >= 8]
    contours.sort(key=len, reverse=True)

    ratios = []
    for c in contours[:top_n]:
        pts = c.reshape(-1, 2).astype(np.float32)
        arc = len(pts)
        if len(pts) > max_pts:
            idx = np.linspace(0, len(pts) - 1, max_pts).astype(int)
            pts = pts[idx]
        d = np.linalg.norm(pts[:, None, :] - pts[None, :, :], axis=-1)
        chord = float(d.max()) if d.size else 0.0
        if chord > 3:
            ratios.append(arc / chord)

    if not ratios:
        return 1.05
    val = float(np.mean(ratios))
    return round(min(max(val, 1.0), 2.5), 3)


def av_ratio_estimate(enhanced_rgb: np.ndarray, vessel_mask: np.ndarray) -> float:
    """Rough colour-based arteriole/venule proxy: brighter vessel pixels are
    treated as arteriole-like, darker ones as venule-like, and the sqrt of
    their pixel-area ratio stands in for an average diameter ratio.
    This is NOT a validated arteriole/venule classifier."""
    ycrcb = cv2.cvtColor(enhanced_rgb, cv2.COLOR_RGB2YCrCb)
    y = ycrcb[:, :, 0]
    vessel_vals = y[vessel_mask > 0]
    if vessel_vals.size < 20:
        return 0.66  # fallback: typical normal midpoint
    median = np.median(vessel_vals)
    arteriole_px = int(np.count_nonzero(vessel_vals >= median))
    venule_px = int(np.count_nonzero(vessel_vals < median))
    if venule_px == 0:
        return 0.9
    ratio = float(np.sqrt(arteriole_px / venule_px))
    return round(min(max(ratio, 0.3), 1.2), 3)


def cdr_estimate(enhanced_rgb: np.ndarray) -> float:
    """Rough optic-disc / cup proxy using red-channel brightness percentiles.
    NOT a validated disc/cup segmentation model."""
    red = enhanced_rgb[:, :, 0]
    thresh_disc = np.percentile(red, 99)
    disc_mask = (red >= thresh_disc).astype(np.uint8) * 255
    disc_mask = cv2.morphologyEx(disc_mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    contours, _ = cv2.findContours(disc_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 0.45
    disc_c = max(contours, key=cv2.contourArea)
    _, disc_r = cv2.minEnclosingCircle(disc_c)
    if disc_r < 3:
        return 0.45

    x0, y0, w, h = cv2.boundingRect(disc_c)
    roi = red[y0:y0 + h, x0:x0 + w]
    if roi.size == 0:
        return 0.45
    thresh_cup = np.percentile(roi, 99.5)
    cup_mask = (roi >= thresh_cup).astype(np.uint8) * 255
    contours2, _ = cv2.findContours(cup_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours2:
        return 0.4
    cup_c = max(contours2, key=cv2.contourArea)
    _, cup_r = cv2.minEnclosingCircle(cup_c)

    cdr = cup_r / disc_r
    return round(min(max(cdr, 0.1), 0.9), 3)


def build_heatmap_overlay(enhanced_rgb: np.ndarray, vessel_mask: np.ndarray) -> np.ndarray:
    """Heuristic vessel-emphasis heatmap overlay (JET colormap on the vessel
    mask, blended over the enhanced fundus image). This is a visualization of
    the classical segmentation above — NOT a Grad-CAM saliency map, since
    Grad-CAM specifically requires backpropagated gradients from a trained
    CNN, which this service does not have."""
    heat = cv2.applyColorMap(vessel_mask, cv2.COLORMAP_JET)
    heat_rgb = cv2.cvtColor(heat, cv2.COLOR_BGR2RGB)
    overlay = cv2.addWeighted(enhanced_rgb, 0.65, heat_rgb, 0.35, 0)
    return overlay
