# AcademiaRAG — Academic Question Answering System

A full-stack **Retrieval-Augmented Generation (RAG)** application that helps students find answers from academic PDFs and study materials. AcademiaRAG combines keyword-based and semantic retrieval to identify relevant passages, generates answers using a locally running Large Language Model (LLM), and provides document and page citations.

## Overview

Students often need to search through lengthy lecture notes and academic documents to find specific information. AcademiaRAG simplifies this process by allowing users to upload PDFs and ask questions in natural language.

The application processes uploaded documents, indexes their content, retrieves relevant passages using a hybrid retrieval pipeline, and passes the retrieved context to an LLM to generate answers.

## Features

- **PDF upload:** Add academic PDF documents through the web interface.
- **Text extraction:** Extract text and page information from uploaded PDFs.
- **Document indexing:** Process document content for retrieval.
- **Hybrid retrieval:** Combine BM25 keyword retrieval with semantic vector search.
- **Reranking:** Reorder retrieved passages before answer generation.
- **Context-based answers:** Generate responses using retrieved academic content.
- **Source citations:** Display source filenames and page numbers with answers.
- **Conversation history:** View previously asked questions and their answers.
- **User feedback:** Mark answers as helpful or needing improvement.
- **Knowledge Base:** View uploaded documents and their extracted page counts.
- **Local LLM integration:** Use Ollama to run a language model locally.

## How It Works

```text
Academic PDF
     |
     v
Upload and Text Extraction
     |
     v
Document Chunking and Embeddings
     |
     v
Index in ChromaDB
     |
     v
User Question
     |
     +---------------------------+
     |                           |
     v                           v
BM25 Keyword Search       Semantic Vector Search
     |                           |
     +-------------+-------------+
                   |
                   v
            Hybrid Retrieval
                   |
                   v
               Reranking
                   |
                   v
       Relevant Context and Question
                   |
                   v
             Ollama LLM
                   |
                   v
        Answer with Source Citations
```

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| API communication | HTTP and REST endpoints |
| Retrieval | BM25 keyword retrieval and semantic search |
| Vector database | ChromaDB |
| Language model | Ollama with the configured local model |
| Relational database | Oracle database integration |
| Document processing | PDF text extraction |
| Version control | Git and GitHub |

## Hybrid RAG Architecture

### 1. PDF Processing

The application accepts PDF files, stores uploaded documents, extracts their text, and prepares the content for indexing.

### 2. Embedding Generation

Text content is converted into numerical vector representations. These embeddings support semantic similarity search, which can retrieve relevant content even when a question uses different wording from the source.

### 3. BM25 Keyword Retrieval

BM25 identifies passages that match important terms in the user's question. This helps retrieve documents containing relevant keywords and technical terminology.

### 4. Semantic Retrieval

Semantic retrieval searches the vector database for passages related to the meaning of the question.

### 5. Hybrid Retrieval and Reranking

Results from keyword and semantic retrieval are combined and reranked to identify useful passages for answer generation.

### 6. Answer Generation

The retrieved context and user question are provided to the configured local LLM through Ollama. The application returns the generated answer along with available source filenames and page numbers.

### 7. History and Feedback

Questions and answers can be recorded in conversation history, and users can submit feedback on generated answers.

## Project Structure

```text
HCL_project/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   └── database.py
│   │   ├── rag/
│   │   │   ├── extraction.py
│   │   │   ├── chunking.py
│   │   │   ├── embeddings.py
│   │   │   ├── bm25_retriever.py
│   │   │   ├── semantic_retriever.py
│   │   │   ├── hybrid_retriever.py
│   │   │   ├── reranker.py
│   │   │   └── generator.py
│   │   └── services/
│   │       ├── indexing_service.py
│   │       └── chat_service.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── upload.js
│   │   │   ├── extract.js
│   │   │   └── index.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── index.html
├── data/
│   ├── uploads/
│   └── chroma/
├── .gitignore
└── README.md
```

*Note: The tree highlights the main application files. Some generated data directories may be created when the application runs, and additional project files may exist.*

## Getting Started

### Prerequisites

Install the following before running the application:

- Python 3.10 or a compatible version for the project's dependencies
- Node.js and npm
- Git
- Ollama
- Access to the configured Oracle database, if using database-backed history and feedback

### 1. Clone the Repository

```bash
git clone https://github.com/parijain06/HCL_project.git
cd HCL_project
```

### 2. Set Up the Backend

Open a terminal in the project root and run:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install the Python packages listed in `backend/requirements.txt`. Ensure that this file contains all dependencies required by the application before running:

```powershell
python -m pip install -r requirements.txt
```

Configure the required environment variables using the project's environment configuration. Do not commit credentials, database passwords, or other secrets.

Start the FastAPI server:

```powershell
python -m uvicorn app.main:app --reload
```

The backend should be available at:

- API: `http://127.0.0.1:8000`
- Health check: `http://127.0.0.1:8000/health`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

The health endpoint should return:

```json
{
  "status": "ok"
}
```

### 3. Configure Ollama

Install and start Ollama. Pull the model configured for the project. For example, if using `llama3.2:3b`:

```powershell
ollama pull llama3.2:3b
```

Make sure the model name in the backend configuration matches the model available in Ollama.

### 4. Set Up the Frontend

Open a second terminal in the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal. Vite may select a port other than `5173` if that port is already occupied.

Keep both the backend and frontend servers running while using the application.

### 5. Database Configuration

Configure the Oracle database connection using the environment variables expected by the backend. Ensure the required tables are created before using database-backed conversation history and feedback.

Database credentials should be stored locally and must not be published to GitHub.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check backend availability |
| POST | `/upload` | Upload a PDF |
| GET | `/extract/{filename}` | Extract PDF text |
| POST | `/index/{filename}` | Index a document |
| POST | `/ask?question=...` | Ask a question about indexed content |
| GET | `/history` | Retrieve conversation history |
| POST | `/feedback` | Submit answer feedback |

The interactive FastAPI documentation at `/docs` can be used to inspect and test the available endpoints.

## Usage

1. Start the backend and frontend servers.
2. Open the AcademiaRAG web interface.
3. Navigate to **Knowledge Base**.
4. Choose a PDF and add it to the Knowledge Base.
5. Wait for document extraction and indexing to complete.
6. Navigate to **Ask** and enter a question about the uploaded material.
7. Review the answer and its source citations.
8. Open **Conversation History** to view previous questions.
9. Submit feedback on an answer when appropriate.

For best results, use PDFs containing extractable text. Scanned PDFs may require OCR support, which is not guaranteed by the current extraction workflow.

## Security and Data Handling

- Keep `.env` files, database credentials, and API secrets out of version control.
- Do not upload confidential academic or personal documents to a public repository.
- Review the configured CORS origins before deploying the application outside local development.
- Treat generated answers as AI-assisted responses and verify important information against the cited source material.

## Current Project Status

**Status: Working local prototype**

The following workflows have been tested in the local development environment:

- Backend health check and frontend connectivity
- PDF upload and text extraction
- Document indexing
- Question answering with source citations
- Conversation history
- Answer feedback

The application is intended as an academic prototype. Retrieval quality, answer correctness, deployment configuration, and compatibility with a fresh environment should be validated further before production use.

## Future Improvements

- Add automated unit and integration tests.
- Evaluate retrieval quality and answer faithfulness on a representative dataset.
- Improve handling of scanned PDFs through OCR.
- Add document deletion and re-indexing support.
- Improve duplicate-document handling and document management.
- Add subject-wise organization and filtering.
- Improve error handling, logging, and API validation.
- Provide deployment instructions and production configuration.
- Improve citation verification and answer-confidence assessment.

## Author

**Pari Jain**  
B.Tech, Artificial Intelligence and Machine Learning  
ABES Engineering College

## License

No license has been specified yet. Add a `LICENSE` file if you intend to publish the project under an open-source license.
