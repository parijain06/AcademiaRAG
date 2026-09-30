def rerank_results(results, top_k=3):
    sorted_results = sorted(
        results,
        key=lambda x: x["hybrid_score"],
        reverse=True
    )

    return sorted_results[:top_k]