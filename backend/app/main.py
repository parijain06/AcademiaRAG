from fastapi import FastAPI, UploadFile, File
from pathlib import Path
from app.rag.extraction import extract_text_from_pdf

app = FastAPI()

UPLOAD_DIR = Path("../data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    return {
        "message": "PDF uploaded successfully",
        "filename": file.filename
    }
@app.get("/extract/{filename}")
def extract_pdf(filename: str):

    file_path = UPLOAD_DIR / filename

    pages = extract_text_from_pdf(file_path)

    return {
        "filename": filename,
        "pages": pages
    }