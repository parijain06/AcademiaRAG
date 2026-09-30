from ollama import chat


def generate_answer(question, context):
    prompt = f"""
You are an academic question answering assistant.

Answer the question using only the provided context.

If the answer cannot be found in the context, say:
"I could not find the answer in the provided academic material."

Context:
{context}

Question:
{question}

Answer:
"""

    response = chat(
        model="llama3.2:3b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response["message"]["content"]