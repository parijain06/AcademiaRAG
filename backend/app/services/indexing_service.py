from pathlib import Path

from app.rag.extraction import extract_text_from_pdf
from app.rag.chunking import chunk_page
from app.rag.embeddings import generate_embedding
from app.rag.semantic_retriever import add_document


UPLOAD_DIR = Path("../data/uploads")


def index_pdf(filename):
    file_path = UPLOAD_DIR / filename

    pages = extract_text_from_pdf(file_path)

    total_chunks = 0

    for page in pages:

        page_chunks = chunk_page(
            page["text"],
            page["page"]
        )

        for chunk in page_chunks:

            embedding = generate_embedding(
                chunk["text"]
            )

            chunk_id = f"{filename}_{chunk['page']}_{total_chunks}"

            add_document(
                chunk_id,
                chunk["text"],
                embedding,
                page=chunk["page"],
                filename=filename
            )

            total_chunks += 1

    return {
        "filename": filename,
        "pages": len(pages),
        "chunks": total_chunks
    }