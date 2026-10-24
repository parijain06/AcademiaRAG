def hybrid_search(
    bm25_results,
    semantic_results,
    top_k=3
):
    combined = {}

    # Add BM25 results
    for result in bm25_results:
        text = result["text"]

        combined[text] = {
            "text": text,
            "bm25_score": result["score"],
            "semantic_score": 0,
            "filename": result.get("filename"),
            "page": result.get("page")
        }

    # Add semantic results
    for text, score, metadata in zip(
        semantic_results["documents"][0],
        semantic_results["distances"][0],
        semantic_results["metadatas"][0]
    ):
        if text not in combined:
            combined[text] = {
                "text": text,
                "bm25_score": 0,
                "semantic_score": 0,
                "filename": metadata.get("filename"),
                "page": metadata.get("page")
            }

        combined[text]["semantic_score"] = float(score)

        combined[text]["filename"] = metadata.get("filename")
        combined[text]["page"] = metadata.get("page")

    # Calculate hybrid score
    results = []

    for result in combined.values():

        result["hybrid_score"] = (
            result["bm25_score"]
            + result["semantic_score"]
        )

        results.append(result)

    # Sort by hybrid score
    results.sort(
        key=lambda x: x["hybrid_score"],
        reverse=True
    )

    return results[:top_k]