from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
import io
import numpy as np
import base64

from color_analyzer import get_top_colors

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(request, "index.html", {})

@app.post("/upload", response_class=HTMLResponse)
async def upload_image(request: Request, file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        return templates.TemplateResponse(
            request,
            "index.html",
            {"error": f"The uploaded file ({file.content_type or 'unknown type'}) is not supported."}
        )

    contents = await file.read()

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        pixels = np.array(image).reshape(-1, 3)
        top_colors = get_top_colors(pixels, top_n=10)
    except UnidentifiedImageError:
        return templates.TemplateResponse(
            request,
            "index.html",
            {"error": "Could not recognize the file as an image. Please try a different file (JPG, PNG, etc.)."}
        )

    image_base64 = base64.b64encode(contents).decode("utf-8")

    return templates.TemplateResponse(
        request,"index.html",
        {
            "colors": top_colors,
            "image_data": image_base64,
            "image_content_type": file.content_type,
        }
    )
