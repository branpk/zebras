from pathlib import Path
from typing import Literal, TypedDict

import numpy as np
import requests
import torch
from tqdm import tqdm
from sam2.build_sam import build_sam2
from sam2.automatic_mask_generator import SAM2ImagePredictor
from scipy.ndimage import gaussian_filter


class PositiveOp(TypedDict):
    type: Literal["positive"]
    enabled: bool
    box: list[float]
    relative_sigma: float
    chroma_strength: float


class NegativeOp(TypedDict):
    type: Literal["negative"]
    enabled: bool
    box: list[float]


type ImageOp = PositiveOp | NegativeOp


class ImageProcessor:
    def __init__(self) -> None:
        checkpoint_path = Path("checkpoints/sam2.1_hiera_base_plus.pt")

        if not checkpoint_path.exists():
            response = requests.get(
                "https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_base_plus.pt",
                stream=True,
            )
            total = int(response.headers.get("content-length", 0))
            checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
            with (
                open(checkpoint_path, "wb") as f,
                tqdm(
                    total=total,
                    unit="iB",
                    unit_scale=True,
                    unit_divisor=1024,
                ) as progress,
            ):
                for chunk in response.iter_content(chunk_size=1024):
                    progress.update(f.write(chunk))

        if torch.cuda.is_available():
            device = torch.device("cuda")
        elif torch.mps.is_available():
            device = torch.device("mps")
        else:
            device = torch.device("cpu")
        print(f"Device: {device}")

        model = build_sam2(
            "configs/sam2.1/sam2.1_hiera_b+.yaml",
            checkpoint_path,
            device=str(device),
        )
        self.predictor = SAM2ImagePredictor(model)

    def find_mask(self, image: np.ndarray, box: list[float]) -> np.ndarray:
        self.predictor.set_image(image)
        masks, scores, _ = self.predictor.predict(
            box=np.array(box),
            multimask_output=True,
        )
        mask = masks[np.argmax(scores)]
        assert np.count_nonzero(((0 < mask) & (mask < 1))) == 0
        mask = mask != 0
        return mask

    def invert_mask(
        self,
        image: np.ndarray,
        mask: np.ndarray,
        sigma=15,
        chroma_strength=0.25,
    ) -> np.ndarray:
        x = image.astype(np.float32) / 255

        L = 0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2]
        m = mask.astype(np.float32)

        numerator = gaussian_filter(L * m, sigma=sigma)
        denominator = gaussian_filter(m, sigma=sigma)
        local_L = numerator / np.maximum(denominator, 1e-6)

        new_L = 2.0 * local_L - L
        new_L = np.clip(new_L, 0.0, 1.0)

        chroma = x - L[..., None]

        transformed = new_L[..., None] + chroma_strength * chroma
        transformed = np.clip(transformed, 0.0, 1.0)

        y = x.copy()
        y[mask] = transformed[mask]
        return (y * 255).astype(np.uint8)

    def apply_ops(self, original: np.ndarray, ops: list[ImageOp]) -> np.ndarray:
        result = original

        for op in [op for op in ops if op["type"] == "positive"]:
            if not op["enabled"]:
                continue
            box = op["box"]
            if min(box[2] - box[0], box[3] - box[1]) < 5:
                continue
            mask = self.find_mask(original, box)
            result = self.invert_mask(
                result,
                mask,
                sigma=op["relative_sigma"] * result.shape[0] / 1780,
                chroma_strength=op["chroma_strength"],
            )

        result = result.copy()
        for op in [op for op in ops if op["type"] == "negative"]:
            if not op["enabled"]:
                continue
            box = op["box"]
            if min(box[2] - box[0], box[3] - box[1]) < 5:
                continue
            mask = self.find_mask(original, box)
            mask = self.find_mask(original, op["box"])
            result[mask] = original[mask]

        return result
