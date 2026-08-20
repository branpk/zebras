import http.server
import json
from pathlib import Path
import random
import string
from typing import Any, Literal, TypedDict

from PIL import Image


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


class ImageInfo(TypedDict):
    key: str
    original_path: str
    dims: list[int]
    ops: list[ImageOp]


def generate_image_key() -> str:
    return "".join(
        [random.choice(string.ascii_letters + string.digits) for _ in range(8)]
    )


def save_images_info(images_info: list[ImageInfo]) -> None:
    with open(Path("images/info.json"), "w") as f:
        json.dump(images_info, f, indent=2)


def get_images_info() -> list[ImageInfo]:
    file = Path("images/info.json")
    if file.exists():
        with open(file, "r") as f:
            images_info = json.load(f)
    else:
        images_info = []

    found_images = {info["original_path"] for info in images_info}
    for image_path in Path("images/originals").glob("*"):
        if str(image_path) not in found_images:
            key = generate_image_key()
            images_info.append(
                ImageInfo(
                    key=key,
                    original_path=str(image_path),
                    dims=list(Image.open(image_path).size),
                    ops=[],
                )
            )

    images_info.sort(key=lambda info: info["key"])
    save_images_info(images_info)
    return images_info


def update_image_info(image_info: ImageInfo) -> Any:
    images_info = get_images_info()
    for i in range(len(images_info)):
        if images_info[i]["key"] == image_info["key"]:
            images_info[i] = image_info
    save_images_info(images_info)
    return None


def get_image_status(key: str) -> Any:
    for image_info in get_images_info():
        if image_info["key"] == key:
            break
    return {
        "status": "processing",
        "path": image_info["original_path"],
    }


def handle_request(body: Any) -> Any:
    fn = body["fn"]
    if fn == "get_images_info":
        return get_images_info()
    elif fn == "update_image_info":
        return update_image_info(body["image_info"])
    elif fn == "get_image_status":
        return get_image_status(body["key"])
    raise Exception("unhandled request: ", json.dumps(body, indent=2))


class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self) -> None:
        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length)

        body = json.loads(body_bytes.decode("utf-8"))
        response = handle_request(body)
        response_bytes = json.dumps(response).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(response_bytes)


if __name__ == "__main__":
    server = http.server.HTTPServer(("localhost", 8000), RequestHandler)
    server.serve_forever()
