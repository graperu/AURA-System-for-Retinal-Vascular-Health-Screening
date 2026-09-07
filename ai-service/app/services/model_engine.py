import numpy as np


class RetinalAIModelEngine:
    """Inference boundary for a validated retinal model package.

    This repository currently contains no model weights. Failing closed prevents test
    constants from being presented as patient findings.
    """

    VERSION = None

    @classmethod
    def analyze_fundus_image(cls, image_np: np.ndarray, eye: str = "OD"):
        raise RuntimeError(
            "No validated retinal model weights are configured; inference is disabled."
        )
