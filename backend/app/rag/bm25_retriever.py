from rank_bm25 import BM25Okapi
import re


def tokenize(text):
    return re.findall(r"\b\w+\b", text.lower())


def create_bm25_index(documents):
    tokenized_documents = [
        tokenize(document)
        for document in documents
    ]

    return BM25Okapi(tokenized_documents)


def search_bm25(bm25, query, documents, metadata, top_k=3):
    tokenized_query = tokenize(query)

    scores = bm25.get_scores(tokenized_query)

    ranked_indexes = sorted(
        range(len(scores)),
        key=lambda i: scores[i],
        reverse=True
    )[:top_k]

    return [
        {
            "text": documents[i],
            "score": float(scores[i]),
            "filename": metadata[i].get("filename"),
            "page": metadata[i].get("page")
        }
        for i in ranked_indexes
    ]