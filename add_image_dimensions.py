from pathlib import Path
import json

from PIL import Image

JSON_PATH = Path("images.json")
IMAGE_ROOT = Path(".")  # assumes paths like "./images/22.09_1.webp"


def add_image_dimensions_to_json(json_path: Path, image_root: Path) -> None:
    with json_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("Expected images.json to contain a top-level array of objects.")

    updated = 0
    skipped = 0

    for item in data:
        if not isinstance(item, dict):
            skipped += 1
            continue

        image_path = item.get("image")
        if not image_path:
            skipped += 1
            continue

        full_path = (image_root / image_path).resolve()

        if not full_path.exists():
            print(f"[skip] missing file: {full_path}")
            skipped += 1
            continue

        try:
            with Image.open(full_path) as img:
                width, height = img.size

            item["width"] = width
            item["height"] = height
            item["aspectRatio"] = round(width / height, 6)
            updated += 1

        except Exception as e:
            print(f"[skip] could not read {full_path}: {e}")
            skipped += 1

    with json_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Done. Updated {updated} items, skipped {skipped}.")


if __name__ == "__main__":
    add_image_dimensions_to_json(JSON_PATH, IMAGE_ROOT)