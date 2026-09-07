"""
LaTeX Pre-Compilation Validator for Career Catalyst.
Catches and fixes common LaTeX errors BEFORE running Tectonic,
avoiding wasted compilation time on broken .tex files.
"""
import re


def validate_and_fix_latex(tex_source: str) -> str:
    """
    Run all validation checks and fixes on a rendered LaTeX string.
    Returns the cleaned/fixed LaTeX source.
    """
    tex_source = fix_null_literals(tex_source)
    tex_source = fix_unicode_chars(tex_source)
    tex_source = fix_unmatched_braces(tex_source)
    tex_source = fix_orphaned_textbf(tex_source)
    tex_source = fix_empty_sections(tex_source)
    return tex_source


def fix_null_literals(tex: str) -> str:
    """Replace Python None/null literals that leaked into LaTeX."""
    # Replace standalone "None" that appears as content (not inside commands)
    tex = re.sub(r'(?<!\w)None(?!\w)', '', tex)
    tex = re.sub(r'(?<!\w)null(?!\w)', '', tex, flags=re.IGNORECASE)
    tex = re.sub(r'(?<!\w)N/A(?!\w)', '', tex, flags=re.IGNORECASE)
    return tex


def fix_unicode_chars(tex: str) -> str:
    """Replace problematic Unicode characters with LaTeX-safe equivalents."""
    replacements = {
        '\u2018': "'",       # Left single quote
        '\u2019': "'",       # Right single quote
        '\u201c': "``",      # Left double quote
        '\u201d': "''",      # Right double quote
        '\u2013': "--",      # En dash
        '\u2014': "---",     # Em dash
        '\u2022': "-",       # Bullet
        '\u2026': "...",     # Ellipsis
        '\u00a0': " ",       # Non-breaking space
        '\u200b': "",        # Zero-width space
        '\u00b7': "-",       # Middle dot
        '\ufeff': "",        # BOM
    }
    for char, replacement in replacements.items():
        tex = tex.replace(char, replacement)
    return tex


def fix_unmatched_braces(tex: str) -> str:
    """
    Fix unmatched braces by adding missing closing braces or removing orphan openers.
    Only fixes braces that are clearly broken (within a single line context).
    """
    lines = tex.split('\n')
    fixed_lines = []
    
    for line in lines:
        # Skip comment lines
        if line.strip().startswith('%'):
            fixed_lines.append(line)
            continue
            
        # Count unescaped braces
        open_count = 0
        for i, char in enumerate(line):
            if char == '{' and (i == 0 or line[i-1] != '\\'):
                open_count += 1
            elif char == '}' and (i == 0 or line[i-1] != '\\'):
                open_count -= 1
        
        # If more opens than closes on this line, append closing braces
        if open_count > 0:
            line = line + ('}' * open_count)
        # If more closes than opens, this is trickier — remove trailing extras
        elif open_count < 0:
            excess = abs(open_count)
            # Remove excess closing braces from the end
            while excess > 0 and line.rstrip().endswith('}'):
                line = line.rstrip()
                line = line[:-1]
                excess -= 1
                
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)


def fix_orphaned_textbf(tex: str) -> str:
    """
    Fix \\textbf{ without a matching closing brace.
    Also fix malformed bold markers that weren't properly converted.
    """
    # Fix leftover markdown bold markers that weren't converted
    # e.g., **text** that survived into the LaTeX
    tex = re.sub(r'\*\*([^*]+)\*\*', r'\\textbf{\1}', tex)
    
    # Fix \\textbf{text without closing brace (check each occurrence)
    # This finds \textbf{ followed by content but no } before end of meaningful content
    def fix_textbf_match(match):
        content = match.group(1)
        # If there's already a closing brace, leave it
        if '}' in content:
            return match.group(0)
        # Add closing brace
        return f'\\textbf{{{content}}}'
    
    tex = re.sub(r'\\textbf\{([^}]{1,200}?)(?=\\\\|\\item|\n|$)', fix_textbf_match, tex)
    
    return tex


def fix_empty_sections(tex: str) -> str:
    """Remove completely empty itemize environments that cause warnings."""
    # Remove empty itemize blocks
    tex = re.sub(
        r'\\begin\{itemize\}[^\n]*\n\s*\\end\{itemize\}',
        '',
        tex
    )
    return tex
