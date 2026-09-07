import os
import json
import subprocess
import uuid
import re
import tempfile
from jinja2 import Environment, FileSystemLoader

from app.services.latex_validator import validate_and_fix_latex


# ==========================================
# LATEX ESCAPING — SINGLE PASS (FIXES DOUBLE-ESCAPING BUG)
# ==========================================
# Pre-computed translation table for O(1) per-character escaping
_LATEX_ESCAPE_TABLE = str.maketrans({
    '&': r'\&',
    '%': r'\%',
    '$': r'\$',
    '#': r'\#',
    '_': r'\_',
    '{': r'\{',
    '}': r'\}',
    '~': r'\textasciitilde{}',
    '^': r'\textasciicircum{}',
})

# Unicode normalization map
_UNICODE_NORMALIZE = {
    '\u201c': '``',     # Left double quote
    '\u201d': "''",     # Right double quote
    '\u2018': "`",      # Left single quote
    '\u2019': "'",      # Right single quote
    '\u2014': '---',    # Em dash
    '\u2013': '--',     # En dash
    '\u2022': '-',      # Bullet
    '\u2026': '...',    # Ellipsis
}


def escape_latex(text):
    """
    Single-pass LaTeX escaping that also converts **bold** markers to \\textbf{}.
    This is the ONLY place escaping should happen — data should arrive as clean plaintext.
    """
    if not isinstance(text, str):
        return text
    
    # 0. Strip None/null/n/a literals
    if text.strip().lower() in ['none', 'n/a', 'null', '']:
        return ''

    # 1. Normalize Unicode characters first
    for char, replacement in _UNICODE_NORMALIZE.items():
        text = text.replace(char, replacement)

    # 2. Convert **bold** markers to \textbf{} BEFORE escaping
    #    Split on **...** to separate bold from non-bold parts
    parts = re.split(r'\*\*(.*?)\*\*', text)
    escaped_parts = []
    for i, part in enumerate(parts):
        if i % 2 == 1:
            # Bold content — escape it, then wrap in \textbf{}
            escaped = _escape_chars(part)
            escaped_parts.append(f'\\textbf{{{escaped}}}')
        else:
            # Normal content — just escape
            escaped_parts.append(_escape_chars(part))
    
    return ''.join(escaped_parts)


def _escape_chars(text: str) -> str:
    """Escape LaTeX special characters. Pure character replacement, no bold handling."""
    # Protect existing LaTeX commands (e.g., \textbf already in text)
    # This handles the edge case where pre-existing \textbf{} comes through
    placeholder = "XYZBOLDMASKXYZ"
    text = text.replace(r'\textbf{', placeholder)
    
    # Escape backslashes first (before other replacements add backslashes)
    text = text.replace('\\', r'\textbackslash{}')
    # Restore the placeholder (which was before backslash escaping)
    text = text.replace('XYZTEXTBACKSLASHMASKXYZ', r'\textbackslash{}')

    # Apply the fast translation table for single-char escapes
    text = text.translate(_LATEX_ESCAPE_TABLE)
    
    # Restore protected \textbf commands
    text = text.replace(placeholder, r'\textbf{')
    
    return text


# Alias for backward compatibility — templates use both filter names
safe_latex = escape_latex


class ResumeGenerator:
    def __init__(self, template_dir="app/templates"):
        self.template_dir = template_dir
        self.env = Environment(
            loader=FileSystemLoader(self.template_dir),
            block_start_string='\\BLOCK{',
            block_end_string='}',
            variable_start_string='\\VAR{',
            variable_end_string='}',
            comment_start_string='\\#{',
            comment_end_string='}',
            trim_blocks=True,
            autoescape=False,
        )
        self.env.filters['escape_tex'] = escape_latex
        self.env.filters['safe_tex'] = safe_latex

        self.temp_dir = os.path.join(tempfile.gettempdir(), "resume_generator")
        os.makedirs(self.temp_dir, exist_ok=True)

        # Using Tectonic which must be installed in the system PATH
        self.compiler_cmd = "tectonic"

    def generate(self, template_name: str, data: dict):
        session_id = str(uuid.uuid4())
        output_dir = os.path.join(self.temp_dir, session_id)
        os.makedirs(output_dir, exist_ok=True)

        # 1. Compile the TeX string in memory
        main_tex_filename = f"{template_name}.tex"
        template = self.env.get_template(f"{template_name}/{main_tex_filename}")
        latex_source = template.render(resume_data=data)

        # 2. PRE-COMPILATION VALIDATION — catch errors before Tectonic
        latex_source = validate_and_fix_latex(latex_source)

        # 3. Write ONLY the .tex file required for the compiler
        tex_filepath = os.path.join(output_dir, "resume.tex")
        with open(tex_filepath, 'w', encoding='utf-8') as f:
            f.write(latex_source)

        # 4. Run Tectonic
        cmd = [self.compiler_cmd, "resume.tex"]
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True, cwd=output_dir)
        except subprocess.CalledProcessError as e:
            print("--- ❌ LATEX COMPILATION FAILED ---")
            print("STDOUT:", e.stdout)
            print("STDERR:", e.stderr)
            raise RuntimeError(f"LaTeX Error: {e.stderr or e.stdout}")
        except FileNotFoundError:
            raise RuntimeError("Tectonic is not installed or not in system PATH.")

        pdf_filepath = os.path.join(output_dir, "resume.pdf")
        if not os.path.exists(pdf_filepath):
            raise FileNotFoundError("PDF generation failed, file not found.")

        # 5. Return ONLY what FastAPI needs to serve the file and nuke the folder
        return {
            "pdf_path": pdf_filepath,
            "session_dir": output_dir
        }