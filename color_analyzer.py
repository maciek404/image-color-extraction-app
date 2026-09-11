from PIL import Image
import numpy as np


def load_image_as_array(image_path: str) -> np.ndarray:
    """Loads an image and returns a pixel array with shape (N, 3)."""
    image = Image.open(image_path)
    image = image.convert("RGB")
    pixels = np.array(image)
    pixels = pixels.reshape(-1, 3)
    return pixels


def get_top_colors(pixels: np.ndarray, top_n: int = 10, bucket_size: int = 32) -> list[tuple[int, int, int]]:
    """Returns the top_n most common colors (after quantization) as a list of RGB tuples."""
    quantized = (np.round(pixels / bucket_size) * bucket_size).astype(int)
    colors, counts = np.unique(quantized, axis=0, return_counts=True)
    top_indices = np.argsort(counts)[::-1][:top_n]
    top_colors = colors[top_indices]
    result = []
    for color in top_colors:
        r, g, b = color
        result.append((int(r), int(g), int(b)))
    return result
    # list comprehension
    # return [tuple(int(value) for value in color) for color in top_colors]

