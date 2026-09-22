from pypdf import PdfReader


def extract_pdf_text(file_path: str) -> list[dict]:
    reader = PdfReader(file_path)

    pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text()

        if text and text.strip():
            pages.append(
                {
                    "page": page_number,
                    "content": text.strip()
                }
            )

    return pages