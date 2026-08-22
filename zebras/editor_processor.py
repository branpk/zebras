import json
from pathlib import Path
import time

from PIL import Image
import filelock
import numpy as np

from zebras.editor_server import ImageInfo
from zebras.inversion import ImageProcessor


def pick_queued() -> str | None:
    with open("images/status.json") as f:
        statuses = json.load(f)

    for key, value in statuses.items():
        if value["status"] == "queued":
            return key


def get_image_info(image_key: str) -> ImageInfo:
    with open("images/info.json") as f:
        image_infos = json.load(f)
    for image_info in image_infos:
        if image_info["key"] == image_key:
            return image_info
    assert False, image_key


def was_updated(image_info: ImageInfo) -> bool:
    return get_image_info(image_info["key"]) != image_info


def set_complete(image_key: str, new_path: str) -> None:
    with open("images/status.json") as f:
        statuses = json.load(f)
    statuses[image_key] = {
        "status": "complete",
        "latest_path": new_path,
    }
    with open("images/status.json", "w") as f:
        json.dump(statuses, f, indent=2)


processor = ImageProcessor()

while True:
    print("Waiting for queued images...")

    while True:
        time.sleep(0.3)
        with filelock.FileLock("images/.lock"):
            image_key = pick_queued()
            if not image_key:
                continue
            image_info = get_image_info(image_key)
        break

    print(f"Processing {image_key}")

    original = np.array(Image.open(image_info["original_path"]).convert("RGB"))

    result = processor.apply_ops(original, image_info["ops"])

    with filelock.FileLock("images/.lock"):
        if was_updated(image_info):
            print(f"Interrupted by update to {image_key}")
            continue

        images = [
            (f"public/zebras/light/{image_key}.jpg", original),
            (f"public/zebras/dark/{image_key}.jpg", result),
        ]
        for path, img in images:
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            Image.fromarray(img).save(path)

        set_complete(image_key, images[1][0])

    print(f"Completed processing of {image_key}")
