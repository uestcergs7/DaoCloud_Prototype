import fitz
import sys

def extract_text(pdf_path, out_file):
    out_file.write(f"--- Extracting {pdf_path} ---\n")
    doc = fitz.open(pdf_path)
    for i, page in enumerate(doc):
        out_file.write(f"Page {i+1}:\n")
        out_file.write(page.get_text() + "\n")
    out_file.write(f"--- End of {pdf_path} ---\n\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open("pdf_content.txt", "w", encoding="utf-8") as f:
            for p in sys.argv[1:]:
                extract_text(p, f)
