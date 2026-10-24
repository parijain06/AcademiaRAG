import { useEffect, useMemo, useState } from "react";
import { uploadPDF } from "./api/upload";
import { extractPDF } from "./api/extract";
import { indexPDF } from "./api/index";

const API = "http://127.0.0.1:8000";
const DOCS_KEY = "academia-rag-documents";

const SUGGESTIONS = [
  "What are the key points covered in the uploaded material?",
  "How does the text define its main terms?",
  "Which topics are discussed in more than one document?",
];

const VIEWS = {
  ask: {
    title: "Ask a question",
    lede: "Ask in plain language. Answers come only from the documents you have added, with the document and page cited beneath.",
  },
  library: {
    title: "Knowledge Base",
    lede: "Add course PDFs so their contents can be searched and cited in answers.",
  },
  history: {
    title: "Conversation History",
    lede: "Every question asked so far, newest first.",
  },
};

function Icon({ name, size = 16, className = "" }) {
  const icons = {
    ask: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.6-2.4 2.1-2.4 3.5" />
        <path d="M12 17h.01" />
      </>
    ),
    library: (
      <>
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z" />
        <path d="M4 4.5v15A2.5 2.5 0 0 1 6.5 17H20" />
      </>
    ),
    history: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5" />
        <path d="M9 13h6M9 17h6" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="11" height="11" rx="1.5" />
        <path d="M5 15V5a1 1 0 0 1 1-1h10" />
      </>
    ),
    thumb: (
      <path d="M7 10v10H4V10zm0 0 4-8c1.2 1 1.8 2.5 1.3 4L12 10h6.5a2 2 0 0 1 2 2l-1.2 6.5a2 2 0 0 1-2 1.5H7" />
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadStoredDocuments() {
  try {
    const raw = window.localStorage.getItem(DOCS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed.filter((doc) => doc && typeof doc.filename === "string")
      : [];
  } catch {
    return [];
  }
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`ar-nav-item${active ? " is-active" : ""}`}
    >
      <Icon name={icon} size={16} />
      <span>{label}</span>
    </button>
  );
}

function SourceItem({ citation, index }) {
  const [open, setOpen] = useState(false);

  const excerpt =
    citation.excerpt ??
    citation.text ??
    citation.snippet ??
    citation.content ??
    null;

  const isLong = typeof excerpt === "string" && excerpt.length > 260;

  return (
    <li className="ar-source">
      <span className="ar-source-n">[{index + 1}]</span>

      <div>
        <div className="ar-source-file">
          <Icon name="file" size={15} />
          <span>{citation.filename}</span>
        </div>

        {excerpt && (
          <>
            <blockquote
              className={`ar-source-quote${
                isLong && !open ? " is-clamped" : ""
              }`}
            >
              {excerpt}
            </blockquote>

            {isLong && (
              <button
                type="button"
                className="ar-link ar-source-toggle"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
              >
                {open ? "Show less" : "Show full passage"}
              </button>
            )}
          </>
        )}
      </div>

      <div className="ar-page" aria-label={`Page ${citation.page ?? "unknown"}`}>
        <span className="ar-page-label">Page</span>
        <span className="ar-page-num">{citation.page ?? "—"}</span>
      </div>
    </li>
  );
}

function HistoryRow({ chat, onReuse }) {
  const [open, setOpen] = useState(false);

  const hasAnswer =
    typeof chat.answer === "string" && chat.answer.trim() !== "";

  return (
    <>
      <tr className="ar-row">
        <td className="ar-num">#{chat.id}</td>

        <td className="ar-q-cell">
          <div>{chat.question}</div>

          {hasAnswer && (
            <button
              type="button"
              className="ar-link"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? "Hide answer" : "Show answer"}
            </button>
          )}
        </td>

        <td className="ar-muted">{formatDate(chat.created_at)}</td>

        <td className="ar-right">
          <button
            type="button"
            className="ar-link"
            onClick={() => onReuse(chat.question)}
          >
            Ask again
          </button>
        </td>
      </tr>

      {hasAnswer && open && (
        <tr className="ar-detail">
          <td />
          <td colSpan={3}>
            <p className="ar-prior-answer">{chat.answer}</p>
          </td>
        </tr>
      )}
    </>
  );
}

function App() {
  const [status, setStatus] = useState("Checking");
  const [view, setView] = useState("ask");

  const [file, setFile] = useState(null);
  const [inputKey, setInputKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("");
  const [documents, setDocuments] = useState(loadStoredDocuments);
  const [documentFilter, setDocumentFilter] = useState("");

  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [askError, setAskError] = useState(false);
  const [citations, setCitations] = useState([]);
  const [messageId, setMessageId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackValue, setFeedbackValue] = useState(null);
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState("");

  useEffect(() => {
    checkBackend();
    loadHistory();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(DOCS_KEY, JSON.stringify(documents));
    } catch {
      /* storage unavailable — the list simply will not persist */
    }
  }, [documents]);

  const checkBackend = async () => {
    setStatus("Checking");

    try {
      const response = await fetch(`${API}/health`);

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();
      setStatus(data.status === "ok" ? "Operational" : "Offline");
    } catch {
      setStatus("Offline");
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API}/history`);

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch {
      console.log("Could not load history");
    }
  };

  
const handleUpload = async () => {
  if (!file) {
    setMessageTone("bad");
    setMessage("Select a PDF before uploading.");
    return;
  }

  try {
    setUploading(true);
    setMessageTone("");
    setMessage("Uploading document…");

    const result = await uploadPDF(file);

    setMessage("Extracting PDF text…");
    const extractedData = await extractPDF(result.filename);
    const pages = extractedData.pages.length;

    setMessage("Indexing document for question answering…");
    await indexPDF(result.filename);

    setMessageTone("ok");
    setMessage(`${result.filename} • ${pages} pages extracted and indexed`);

    setDocuments((previous) => [
      {
        filename: result.filename,
        pages,
        addedAt: new Date().toISOString(),
      },
      ...previous.filter((doc) => doc.filename !== result.filename),
    ]);

    setFile(null);
    setInputKey((key) => key + 1);
  } catch (error) {
    console.error("Document processing failed:", error);
    setMessageTone("bad");
    setMessage(
      error.message || "Document processing failed. Check the backend terminal."
    );
  } finally {
    setUploading(false);
  }
};

  const askQuestion = async () => {
    const asked = question.trim();

    if (!asked || loading) {
      return;
    }

    try {
      setLoading(true);
      setAnswer("");
      setAnswered(false);
      setAskError(false);
      setCitations([]);
      setMessageId(null);
      setFeedbackMessage("");
      setFeedbackValue(null);
      setCopied(false);
      setLastQuestion(asked);

      const response = await fetch(
        `${API}/ask?question=${encodeURIComponent(asked)}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();

      setAnswer(data.answer);
      setAnswered(true);
      setCitations(data.citations || []);
      setMessageId(data.message_id);

      await loadHistory();
    } catch {
      setAskError(true);
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (helpful) => {
    if (!messageId) {
      return;
    }

    try {
      const comment =
        helpful === 1 ? "Helpful answer" : "Answer needs improvement";

      const response = await fetch(
        `${API}/feedback?message_id=${messageId}&helpful=${helpful}&feedback_comment=${encodeURIComponent(
          comment
        )}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      setFeedbackValue(helpful);
      setFeedbackMessage("Feedback recorded");
    } catch {
      setFeedbackMessage("Could not save feedback");
    }
  };

  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const reuseQuestion = (text) => {
    setQuestion(text);
    setView("ask");
  };

  const sortedHistory = useMemo(
    () =>
      [...history].sort((a, b) => {
        const timeA = Date.parse(a.created_at);
        const timeB = Date.parse(b.created_at);

        if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
          return timeB - timeA;
        }

        return (Number(b.id) || 0) - (Number(a.id) || 0);
      }),
    [history]
  );

  const filteredHistory = useMemo(() => {
    const needle = historySearch.trim().toLowerCase();

    return sortedHistory.filter((chat) =>
      (chat.question || "").toLowerCase().includes(needle)
    );
  }, [sortedHistory, historySearch]);

  const filteredDocuments = useMemo(() => {
    const needle = documentFilter.trim().toLowerCase();

    return documents.filter((doc) =>
      doc.filename.toLowerCase().includes(needle)
    );
  }, [documents, documentFilter]);

  const totalPages = useMemo(
    () => documents.reduce((sum, doc) => sum + (Number(doc.pages) || 0), 0),
    [documents]
  );

  const citedSummary = useMemo(() => {
    const byDocument = new Map();

    citations.forEach((citation) => {
      const name = citation.filename ?? "Unknown document";
      const pages = byDocument.get(name) || [];

      if (citation.page != null && !pages.includes(citation.page)) {
        pages.push(citation.page);
      }

      byDocument.set(name, pages);
    });

    return Array.from(byDocument.entries()).map(([filename, pages]) => ({
      filename,
      pages: [...pages].sort((a, b) => Number(a) - Number(b)),
    }));
  }, [citations]);

  const meta = VIEWS[view];
  const online = status === "Operational";
  const offline = status === "Offline";

  return (
    <div className="ar-app">
      <aside className="ar-side">
        <div className="ar-brand">
          <div className="ar-brand-name">AcademiaRAG</div>
          <div className="ar-brand-sub">
            Answers from your course documents
          </div>
        </div>

        <nav className="ar-nav" aria-label="Main">
          <NavItem
            icon="ask"
            label="Ask"
            active={view === "ask"}
            onClick={() => setView("ask")}
          />
          <NavItem
            icon="library"
            label="Knowledge Base"
            active={view === "library"}
            onClick={() => setView("library")}
          />
          <NavItem
            icon="history"
            label="Conversation History"
            active={view === "history"}
            onClick={() => setView("history")}
          />
        </nav>

        <dl className="ar-side-facts">
          <div>
            <dt>Questions asked</dt>
            <dd>{history.length}</dd>
          </div>
          <div>
            <dt>Documents added</dt>
            <dd>{documents.length}</dd>
          </div>
        </dl>
      </aside>

      <div className="ar-body">
        <header className="ar-head">
          <div>
            <h1 className="ar-title">{meta.title}</h1>
            <p className="ar-lede">{meta.lede}</p>
          </div>

          <div className="ar-status" role="status">
            <span
              className={`ar-dot${online ? " is-ok" : offline ? " is-bad" : ""}`}
            />
            <span>
              {online
                ? "Backend connected"
                : offline
                ? "Backend offline"
                : "Checking backend…"}
            </span>
            {offline && (
              <button type="button" className="ar-link" onClick={checkBackend}>
                Retry
              </button>
            )}
          </div>
        </header>

        <main className="ar-main">
          {/* ASK */}
          {view === "ask" && (
            <div className="ar-ask">
              <div className="ar-ask-main">
                <section aria-labelledby="ar-question-label">
                  <div className="ar-sechead">
                    <h2 className="ar-label" id="ar-question-label">
                      Your question
                    </h2>
                  </div>

                  <div className="ar-compose">
                    <textarea
                      className="ar-textarea"
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          (event.ctrlKey || event.metaKey)
                        ) {
                          askQuestion();
                        }
                      }}
                      rows={3}
                      aria-labelledby="ar-question-label"
                      placeholder="Type a question about your documents…"
                    />

                    <div className="ar-compose-foot">
                      <span className="ar-hint">Ctrl + Enter to submit</span>

                      <button
                        type="button"
                        className="ar-btn ar-btn-primary"
                        onClick={askQuestion}
                        disabled={loading || !question.trim()}
                      >
                        {loading ? "Searching…" : "Ask"}
                      </button>
                    </div>
                  </div>

                  {!answered && !loading && !askError && (
                    <div className="ar-suggest">
                      <span className="ar-hint">Not sure where to start?</span>
                      <ul>
                        {SUGGESTIONS.map((suggestion) => (
                          <li key={suggestion}>
                            <button
                              type="button"
                              className="ar-link"
                              onClick={() => setQuestion(suggestion)}
                            >
                              {suggestion}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>

                {loading && (
                  <section aria-live="polite" aria-busy="true">
                    <div className="ar-sechead">
                      <h2 className="ar-label">Answer</h2>
                    </div>
                    <div className="ar-loading">
                      <div className="ar-loading-line">
                        <span className="ar-spin" />
                        Searching your documents for relevant passages…
                      </div>
                      <div className="ar-skeleton" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </section>
                )}

                {askError && !loading && (
                  <section aria-live="polite">
                    <div className="ar-sechead">
                      <h2 className="ar-label">Answer</h2>
                    </div>
                    <p className="ar-note is-error">
                      <Icon name="alert" size={16} />
                      <span>
                        The system could not process this request. Check that
                        the backend is running, then try again.
                      </span>
                    </p>
                  </section>
                )}

                {answered && !loading && (
                  <>
                    <section aria-live="polite">
                      <div className="ar-sechead">
                        <h2 className="ar-label">Answer</h2>
                        {messageId && (
                          <span className="ar-secnote">
                            Record #{messageId}
                          </span>
                        )}
                      </div>

                      <article className="ar-answer">
                        <p className="ar-answer-q">
                          <b>Q.</b>
                          {lastQuestion}
                        </p>
                        <p className="ar-answer-text">{answer}</p>
                      </article>

                      <div className="ar-actions">
                        <button
                          type="button"
                          className="ar-btn ar-btn-sm"
                          onClick={copyAnswer}
                        >
                          <Icon name={copied ? "check" : "copy"} size={14} />
                          {copied ? "Copied" : "Copy answer"}
                        </button>

                        {messageId && (
                          <>
                            <span className="ar-actions-sep" />
                            <span>Was this answer useful?</span>

                            <button
                              type="button"
                              className={`ar-btn ar-btn-sm${
                                feedbackValue === 1 ? " is-ok" : ""
                              }`}
                              onClick={() => sendFeedback(1)}
                              disabled={feedbackValue !== null}
                            >
                              <Icon name="thumb" size={14} />
                              Helpful
                            </button>

                            <button
                              type="button"
                              className={`ar-btn ar-btn-sm${
                                feedbackValue === 0 ? " is-bad" : ""
                              }`}
                              onClick={() => sendFeedback(0)}
                              disabled={feedbackValue !== null}
                            >
                              <Icon name="thumb" size={14} className="ar-flip" />
                              Needs improvement
                            </button>

                            {feedbackMessage && <span>{feedbackMessage}</span>}
                          </>
                        )}
                      </div>
                    </section>

                    <section>
                      <div className="ar-sechead">
                        <h2 className="ar-label">Sources</h2>
                        {citations.length > 0 && (
                          <span className="ar-secnote">
                            {citations.length} reference
                            {citations.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {citations.length > 0 ? (
                        <>
                          <div className="ar-cited">
                            {citedSummary.map((item) => (
                              <p key={item.filename}>
                                <strong>{item.filename}</strong>
                                {item.pages.length > 0 && (
                                  <>
                                    {" "}
                                    — page{item.pages.length !== 1 ? "s" : ""}{" "}
                                    <code>{item.pages.join(", ")}</code>
                                  </>
                                )}
                              </p>
                            ))}
                          </div>

                          <ol className="ar-sources">
                            {citations.map((citation, index) => (
                              <SourceItem
                                key={index}
                                citation={citation}
                                index={index}
                              />
                            ))}
                          </ol>
                        </>
                      ) : (
                        <p className="ar-note">
                          <Icon name="alert" size={16} />
                          <span>
                            No passages from your documents were cited for this
                            answer. If you expected one, check that the relevant
                            PDF has been added in the Knowledge Base.
                          </span>
                        </p>
                      )}
                    </section>
                  </>
                )}
              </div>

              <aside className="ar-rail" aria-label="Recent questions">
                <div className="ar-sechead">
                  <h2 className="ar-label">Recent questions</h2>
                </div>

                {sortedHistory.length === 0 ? (
                  <p className="ar-rail-empty">No questions asked yet.</p>
                ) : (
                  <ul className="ar-rail-list">
                    {sortedHistory.slice(0, 6).map((chat) => (
                      <li key={chat.id}>
                        <button
                          type="button"
                          className="ar-rail-item"
                          onClick={() => reuseQuestion(chat.question)}
                        >
                          <span className="ar-rail-q">{chat.question}</span>
                          <span className="ar-rail-d">
                            {formatDate(chat.created_at)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {sortedHistory.length > 6 && (
                  <button
                    type="button"
                    className="ar-link ar-rail-more"
                    onClick={() => setView("history")}
                  >
                    View all {sortedHistory.length} questions
                  </button>
                )}
              </aside>
            </div>
          )}

          {/* KNOWLEDGE BASE */}
          {view === "library" && (
            <div className="ar-stack">
              <section>
                <div className="ar-sechead">
                  <h2 className="ar-label">Add a document</h2>
                  <span className="ar-secnote">PDF files only</span>
                </div>

                <div className="ar-addrow">
                  <label className="ar-btn ar-filebtn">
                    <Icon name="file" size={14} />
                    Choose PDF
                    <input
                      key={inputKey}
                      type="file"
                      accept=".pdf"
                      className="ar-hidden-input"
                      onChange={(event) =>
                        setFile(event.target.files[0] || null)
                      }
                    />
                  </label>

                  <span
                    className={`ar-filename${file ? " has-file" : ""}`}
                    title={file ? file.name : undefined}
                  >
                    {file ? file.name : "No file selected"}
                  </span>

                  <button
                    type="button"
                    className="ar-btn ar-btn-primary"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    <Icon name="upload" size={14} />
                    {uploading ? "Processing…" : "Add to Knowledge Base"}
                  </button>
                </div>

                {message && (
                  <p
                    className={`ar-msg${
                      messageTone ? ` is-${messageTone}` : ""
                    }`}
                    role="status"
                  >
                    {message}
                  </p>
                )}
              </section>

              <section>
                <div className="ar-sechead">
                  <h2 className="ar-label">Documents</h2>
                  <span className="ar-secnote">
                    Uploaded from this browser
                  </span>
                </div>

                <div className="ar-toolbar">
                  {documents.length > 0 ? (
                    <input
                      className="ar-field"
                      value={documentFilter}
                      onChange={(event) => setDocumentFilter(event.target.value)}
                      placeholder="Filter by file name…"
                      aria-label="Filter documents by file name"
                    />
                  ) : (
                    <span />
                  )}

                  <span className="ar-hint">
                    {documents.length} document
                    {documents.length !== 1 ? "s" : ""}
                    {documents.length > 0 && ` · ${totalPages} pages`}
                  </span>
                </div>

                <div className="ar-tablewrap">
                  <table className="ar-table">
                    <thead>
                      <tr>
                        <th scope="col">Document</th>
                        <th scope="col">Pages</th>
                        <th scope="col">Status</th>
                        <th scope="col">Added</th>
                      </tr>
                    </thead>

                    <tbody>
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="ar-empty-cell">
                            No documents added yet. Choose a PDF above to begin.
                          </td>
                        </tr>
                      ) : filteredDocuments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="ar-empty-cell">
                            No documents match “{documentFilter}”.
                          </td>
                        </tr>
                      ) : (
                        filteredDocuments.map((doc) => (
                          <tr
                            key={`${doc.filename}-${doc.addedAt}`}
                            className="ar-row"
                          >
                            <td>
                              <span className="ar-doc-name">
                                <Icon name="file" size={15} />
                                <span>{doc.filename}</span>
                              </span>
                            </td>
                            <td className="ar-num">{doc.pages}</td>
                            <td>
                              <span className="ar-status-ok">
                                <Icon name="check" size={14} />
                                Extracted
                              </span>
                            </td>
                            <td className="ar-muted">
                              {formatDate(doc.addedAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* HISTORY */}
          {view === "history" && (
            <section>
              <div className="ar-toolbar">
                <input
                  className="ar-field"
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Filter questions…"
                  aria-label="Filter questions"
                />

                <span className="ar-hint">
                  {filteredHistory.length} of {history.length} question
                  {history.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="ar-tablewrap">
                <table className="ar-table">
                  <thead>
                    <tr>
                      <th scope="col">Record</th>
                      <th scope="col">Question</th>
                      <th scope="col">Asked</th>
                      <th scope="col">
                        <span className="ar-sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="ar-empty-cell">
                          No questions have been asked yet.
                        </td>
                      </tr>
                    ) : filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="ar-empty-cell">
                          No questions match “{historySearch}”.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((chat) => (
                        <HistoryRow
                          key={chat.id}
                          chat={chat}
                          onReuse={reuseQuestion}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
