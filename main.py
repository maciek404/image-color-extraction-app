from typing import Optional
import base64
import httpx
from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
import io
import numpy as np

from color_analyzer import get_top_colors

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(request, "index.html", {})

@app.post("/api/analyze")
async def analyze_image(
        file: Optional[UploadFile] = File(None),
        image_url: Optional[str] = Form(None),
        bucket_size: int = Form(32),
        top_n: int = Form(10),
):

    if not file and not image_url:
        return JSONResponse(
            status_code=400,
            content={"error": "Upload a file or provide an image URL."}
        )
    if file and image_url:
        return JSONResponse(
            status_code=400,
            content={"error": "Provide only one source: a file OR a URL, not both."}
        )

    if file:
        if not file.content_type or not file.content_type.startswith("image/"):
            return JSONResponse(
                status_code=400,
                content={"error": f"The uploaded file ({file.content_type or 'unknown type'}) is not supported."}
            )
        contents = await file.read()
        content_type = file.content_type
    else:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(image_url, timeout=10.0, follow_redirects=True)
                response.raise_for_status()
        except httpx.HTTPError:
            return JSONResponse(
                status_code=400,
                content={"error": "Failed to fetch the image from the provided URL."}
            )
        content_type = response.headers.get("content-type", "")
        if not content_type.startswith("image/"):
            return JSONResponse(
                status_code=400,
                content={"error": f"The content at this URL ({content_type or 'unknown type'}) is not supported."}
            )
        contents = response.content

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        pixels = np.array(image).reshape(-1, 3)
        top_colors = get_top_colors(pixels, top_n=top_n, bucket_size=bucket_size)
    except UnidentifiedImageError:
        return JSONResponse(
            status_code=400,
            content={"error": "Could not recognize the file as an image. Please try a different file (JPG, PNG, etc.)."}
        )

    colors_json = [
        {
            "hex": "#{:02x}{:02x}{:02x}".format(*color),
            "rgb": list(color),
            "percentage": percentage,
        }
        for color, percentage in top_colors
    ]

    image_base64 = base64.b64encode(contents).decode("utf-8")

    return {
        "colors": colors_json,
        "image_data": f"data:{content_type};base64,{image_base64}",
    }
