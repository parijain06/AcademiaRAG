def hybrid_search(
    bm25_results,
    semantic_results,
    top_k=3
):
    combined = []

    for result in bm25_results:
        combined.append({
            "text": result["text"],
            "bm25_score": result["score"],
            "semantic_score": 0
        })

    for result in semantic_results:
        combined.append({
            "text": result["text"],
            "bm25_score": 0,
            "semantic_score": result["score"]
        })

    for result in combined:
        result["hybrid_score"] = (
            result["bm25_score"] +
            result["semantic_score"]
        )

    combined.sort(
        key=lambda x: x["hybrid_score"],
        reverse=True
    )

    return combined[:top_k]