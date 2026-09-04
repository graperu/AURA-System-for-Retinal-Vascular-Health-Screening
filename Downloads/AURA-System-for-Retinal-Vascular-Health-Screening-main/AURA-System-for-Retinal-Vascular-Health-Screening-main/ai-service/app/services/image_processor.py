import cv2
import numpy as np
from PIL import Image
import io
import base64


class RetinalImageProcessor:
    @staticmethod
    def decode_base64_image(base64_str: str) -> np.ndarray:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_bytes = base64.b64decode(base64_str)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        return np.array(img)

    @staticmethod
    def encode_image_to_base64(img_array: np.ndarray) -> str:
        pil_img = Image.fromarray(img_array)
        buffered = io.BytesIO()
        pil_img.save(buffered, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")

    @staticmethod
    def crop_retinal_fundus(image: np.ndarray, tol: int = 7) -> np.ndarray:
        """Loại bỏ viền đen xung quanh ảnh chụp đáy mắt."""
        if image.ndim == 2:
            mask = image > tol
            return image[np.ix_(mask.any(1), mask.any(0))]
        elif image.ndim == 3:
            gray_img = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            mask = gray_img > tol
            check_shape = image[:, :, 0][np.ix_(mask.any(1), mask.any(0))].shape[0]
            if check_shape == 0:
                return image
            else:
                img1 = image[:, :, 0][np.ix_(mask.any(1), mask.any(0))]
                img2 = image[:, :, 1][np.ix_(mask.any(1), mask.any(0))]
                img3 = image[:, :, 2][np.ix_(mask.any(1), mask.any(0))]
                return np.stack([img1, img2, img3], axis=-1)

    @staticmethod
    def apply_clahe(image: np.ndarray, clip_limit: float = 2.5) -> np.ndarray:
        """Áp dụng cân bằng độ tương phản thích ứng cục bộ CLAHE trên kênh xanh lá."""
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)
        return enhanced

    @classmethod
    def prepare_fundus_tensor(cls, image_np: np.ndarray, target_size: int = 512):
        cropped = cls.crop_retinal_fundus(image_np)
        resized = cv2.resize(cropped, (target_size, target_size))
        enhanced = cls.apply_clahe(resized)
        normalized = enhanced.astype(np.float32) / 255.0
        # Mean & Std normalization
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        normalized = (normalized - mean) / std
        tensor = np.transpose(normalized, (2, 0, 1))
        return tensor, enhanced
