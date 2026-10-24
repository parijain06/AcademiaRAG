
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.rag.extraction import extract_text_from_pdf
from app.services.indexing_service import index_pdf
from app.services.chat_service import save_chat, save_feedback

from app.rag.embeddings import generate_embedding
from app.rag.semantic_retriever import search_semantic, get_all_documents
from app.rag.bm25_retriever import create_bm25_index, search_bm25
from app.rag.hybrid_retriever import hybrid_search
from app.rag.reranker import rerank_results
from app.rag.generator import generate_answer


app = FastAPI(title="Academic Question Answering System via RAG")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        "filename": file.filename,
    }


@app.get("/extract/{filename}")
def extract_pdf(filename: str):
    file_path = UPLOAD_DIR / filename
    pages = extract_text_from_pdf(file_path)

    return {
        "filename": filename,
        "pages": pages,
    }


@app.post("/index/{filename}")
def index_document(filename: str):
    result = index_pdf(filename)

    return {
        "message": "PDF indexed successfully",
        **result,
    }


@app.post("/ask")
def ask_question(question: str):
    # 1. Create question embedding
    query_embedding = generate_embedding(question)

    # 2. Semantic retrieval
    semantic_results = search_semantic(
        query_embedding,
        top_k=3,
    )

    # 3. Get all indexed documents
    all_documents = get_all_documents()
    documents = all_documents["documents"]
    metadata = all_documents["metadatas"]

    # 4. BM25 retrieval
    bm25 = create_bm25_index(documents)

    bm25_results = search_bm25(
        bm25,
        question,
        documents,
        metadata,
        top_k=3,
    )

    # 5. Hybrid retrieval
    hybrid_results = hybrid_search(
        bm25_results,
        semantic_results,
        top_k=3,
    )

    # 6. Reranking
    reranked_results = rerank_results(
        hybrid_results,
        top_k=3,
    )

    # 7. No-answer safeguard
    if (
        not reranked_results
        or reranked_results[0]["hybrid_score"] < 2.5
    ):
        return {
            "question": question,
            "answer": (
                "I could not find the answer in the provided "
                "academic material."
            ),
            "citations": [],
            "retrieved_chunks": [],
            "message_id": None,
        }

    # 8. Create context
    context = "\n\n".join(
        result["text"] for result in reranked_results
    )

    # 9. Generate answer
    answer = generate_answer(question, context)

    # 10. Create citations
    citations = [
        {
            "filename": result.get("filename"),
            "page": result.get("page"),
        }
        for result in reranked_results
    ]

    # 11. Save chat
    message_id = save_chat(
        subject_id=1,
        question=question,
        answer=answer,
        citations_json=str(citations),
    )

    # 12. Return response
    return {
        "question": question,
        "answer": answer,
        "citations": citations,
        "retrieved_chunks": reranked_results,
        "message_id": message_id,
    }


@app.post("/feedback")
def submit_feedback(
    message_id: int,
    helpful: int,
    feedback_comment: str = None,
):
    save_feedback(
        message_id=message_id,
        helpful=helpful,
        feedback_comment=feedback_comment,
    )

    return {"message": "Feedback saved successfully"}


@app.get("/history")
def get_history():
    from app.core.database import get_connection

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT
                id,
                subject_id,
                question,
                answer,
                citations_json,
                confidence,
                created_at
            FROM chats_messages
            ORDER BY created_at DESC
            """
        )

        rows = cursor.fetchall()
        history = []

        for row in rows:
            question = row[2]
            answer = row[3]
            citations = row[4]

            if hasattr(question, "read"):
                question = question.read()

            if hasattr(answer, "read"):
                answer = answer.read()

            if hasattr(citations, "read"):
                citations = citations.read()

            history.append(
                {
                    "id": row[0],
                    "subject_id": row[1],
                    "question": question,
                    "answer": answer,
                    "citations": citations,
                    "confidence": row[5],
                    "created_at": str(row[6]),
                }
            )

        return {"history": history}

    finally:
        cursor.close()
        connection.close()
