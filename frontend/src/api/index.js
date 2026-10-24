
const API = "http://127.0.0.1:8000";

export async function indexPDF(filename) {
  const response = await fetch(
    `${API}/index/${encodeURIComponent(filename)}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "PDF indexing failed.");
  }

  return response.json();
}
