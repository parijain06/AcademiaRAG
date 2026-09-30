def chunk_text(text, chunk_size=500, overlap=50):
    words = text.split()

    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size

        chunk = " ".join(words[start:end])
        chunks.append(chunk)

        start = end - overlap

    return chunks
def chunk_page(text, page_number, chunk_size=500, overlap=50):
    chunks = chunk_text(
        text,
        chunk_size,
        overlap
    )

    return [
        {
            "page": page_number,
            "text": chunk
        }
        for chunk in chunks
    ]