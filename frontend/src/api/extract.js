export async function extractPDF(filename) {
  const response = await fetch(
    `http://127.0.0.1:8000/extract/${encodeURIComponent(filename)}`
  );

  if (!response.ok) {
    throw new Error("PDF extraction failed");
  }

  return await response.json();
}