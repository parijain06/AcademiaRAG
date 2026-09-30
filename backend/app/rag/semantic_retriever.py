import chromadb

client = chromadb.PersistentClient(path="../data/chroma")

collection = client.get_or_create_collection(
    name="academic_documents"
)


def add_document(chunk_id, text, embedding):
    collection.add(
        ids=[str(chunk_id)],
        documents=[text],
        embeddings=[embedding]
    )
def search_semantic(query_embedding, top_k=3):
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )

    return results