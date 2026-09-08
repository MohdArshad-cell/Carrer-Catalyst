"""
PDF Text Extraction Service — Career Catalyst.
Extracts clean, structured text from uploaded PDF resumes using PyMuPDF (fitz).
Handles multi-page PDFs and preserves section structure.
"""
import re
import fitz  # PyMuPDF


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract text from PDF bytes, preserving layout structure.
    
    Args:
        pdf_bytes: Raw bytes of the uploaded PDF file.
    
    Returns:
        Clean text string extracted from all pages.
    
    Raises:
        ValueError: If the PDF contains no extractable text (likely image-based/scanned).
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise ValueError(f"Failed to open PDF: {str(e)}")

    if doc.page_count == 0:
        raise ValueError("PDF has no pages.")

    full_text = []
    for page_num in range(doc.page_count):
        page = doc[page_num]
        # Use "text" mode for clean extraction preserving line breaks
        page_text = page.get_text("text")
        if page_text.strip():
            full_text.append(page_text.strip())

    doc.close()

    combined_text = "\n\n".join(full_text).strip()

    if not combined_text:
        raise ValueError(
            "No text could be extracted from this PDF. "
            "It may be a scanned/image-based document. "
            "Please paste your resume text manually instead."
        )

    # Basic cleanup: remove excessive blank lines
    combined_text = re.sub(r'\n{3,}', '\n\n', combined_text)

    return combined_text
