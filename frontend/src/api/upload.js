export async function uploadPDF(file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch("http://127.0.0.1:8000/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("PDF upload failed");
  }

  return await response.json();
}