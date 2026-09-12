#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Powerhub Assistant - Folder Inspector
Tac gia: Microsoft Copilot for Nguyen Thi Ai / VAS
Muc dich: Quet D:/Powerhub_assistant va xuat Word report de Copilot doc.
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from pathlib import Path

# --- Auto-install python-docx if missing ---
try:
    from docx import Document
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
except ImportError:
    print("Installing python-docx...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-docx", "-q"])
    from docx import Document
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

# ===================================================
#  CONFIG - edit if needed
# ===================================================
TARGET_FOLDER = r"D:\Powerhub_assistant"
OUTPUT_FILE   = r"D:\Powerhub_assistant\INSPECTION_REPORT.docx"

TEXT_EXTENSIONS = {
    '.js', '.css', '.html', '.json', '.md',
    '.txt', '.ts', '.jsx', '.tsx', '.py',
    '.yaml', '.yml', '.sh', '.bat'
}

MAX_CONTENT_CHARS = 8000  # chars per file

COLOR_PRIMARY   = RGBColor(0x7B, 0x1C, 0x2A)  # maroon
COLOR_SECONDARY = RGBColor(0x1B, 0x3A, 0x6B)  # navy
COLOR_GREY      = RGBColor(0x66, 0x66, 0x66)  # grey

# ===================================================
#  HELPER FUNCTIONS
# ===================================================

def apply_shading(paragraph, fill_hex="F5F5F5"):
    pPr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  fill_hex)
    pPr.append(shd)


def add_horizontal_rule(doc):
    p = doc.add_paragraph()
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'),   'single')
    bottom.set(qn('w:sz'),    '4')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), 'CCCCCC')
    pBdr.append(bottom)
    pPr.append(pBdr)
    return p


def get_folder_tree(folder_path, prefix="", depth=0, max_depth=6):
    if depth > max_depth:
        return [prefix + "    .... (max depth)"]
    lines = []
    try:
        items = sorted(
            Path(folder_path).iterdir(),
            key=lambda x: (x.is_file(), x.name.lower())
        )
        for i, item in enumerate(items):
            is_last   = (i == len(items) - 1)
            connector = "└── " if is_last else "├── "
            child_pfx = prefix + ("    " if is_last else "│   ")
            if item.is_dir():
                lines.append(prefix + connector + "[DIR]  " + item.name + "/")
                lines.extend(get_folder_tree(item, child_pfx, depth + 1, max_depth))
            else:
                sz = item.stat().st_size
                sz_str = "{:.1f} KB".format(sz / 1024) if sz >= 1024 else "{} B".format(sz)
                lines.append(prefix + connector + item.name + "  (" + sz_str + ")")
    except PermissionError:
        lines.append(prefix + "    [Access Denied]")
    return lines


def collect_files(folder_path):
    files = []
    for root, dirs, filenames in os.walk(folder_path):
        dirs[:] = sorted([d for d in dirs if not d.startswith('.')])
        for fn in sorted(filenames):
            if fn.startswith('.'):
                continue
            fp = Path(root) / fn
            try:
                st  = fp.stat()
                rel = fp.relative_to(folder_path)
                sz  = st.st_size
                files.append({
                    'name'     : fn,
                    'rel_path' : str(rel),
                    'full_path': str(fp),
                    'ext'      : fp.suffix.lower(),
                    'size_b'   : sz,
                    'size_str' : "{:.1f} KB".format(sz / 1024) if sz >= 1024 else "{} B".format(sz),
                    'modified' : datetime.fromtimestamp(st.st_mtime).strftime('%Y-%m-%d %H:%M'),
                })
            except (PermissionError, OSError):
                pass
    return files


def read_file_safe(filepath, max_chars=MAX_CONTENT_CHARS):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read(max_chars + 1)
        if len(content) > max_chars:
            content = content[:max_chars]
            content += "\n\n... [TRUNCATED - file exceeds {} chars]".format(max_chars)
        return content
    except Exception as e:
        return "[Could not read: {}]".format(e)


def pretty_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        result = json.dumps(data, indent=2, ensure_ascii=False)
        if len(result) > MAX_CONTENT_CHARS:
            result = result[:MAX_CONTENT_CHARS] + "\n... [TRUNCATED]"
        return result
    except Exception:
        return None


def add_code_block(doc, code_text, max_lines=120):
    lines = code_text.split('\n')
    if len(lines) > max_lines:
        extra = len(lines) - max_lines
        lines = lines[:max_lines]
        lines.append("... [{} more lines truncated]".format(extra))
    for line in lines:
        p   = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after  = Pt(0)
        run = p.add_run(line if line else " ")
        run.font.name = 'Courier New'
        run.font.size = Pt(8)
        apply_shading(p, "F4F4F4")


def set_cell_bg(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd  = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  fill_hex)
    tcPr.append(shd)


def styled_run(paragraph, text, bold=False, size=10, color=None, mono=False):
    run = paragraph.add_run(text)
    run.bold      = bold
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = color
    if mono:
        run.font.name = 'Courier New'
    return run


# ===================================================
#  MAIN REPORT BUILDER
# ===================================================

def build_report(target_folder, output_file):
    print("\nInspecting: " + target_folder)
    print("-" * 50)

    if not os.path.exists(target_folder):
        print("ERROR: Folder not found: " + target_folder)
        return False

    doc     = Document()
    section = doc.sections[0]
    section.top_margin    = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin   = Inches(1.0)
    section.right_margin  = Inches(1.0)

    now_str = datetime.now().strftime('%d %B %Y - %H:%M')

    # --------------------------------------------------
    # COVER
    # --------------------------------------------------
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    styled_run(p, "POWERHUB ASSISTANT", bold=True, size=24, color=COLOR_PRIMARY)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    styled_run(p, "Folder Inspection Report - for Copilot Analysis", size=13, color=COLOR_SECONDARY)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    styled_run(p, "Generated: {}   |   Source: {}".format(now_str, target_folder),
               size=9, color=COLOR_GREY)

    add_horizontal_rule(doc)
    doc.add_paragraph()

    # --------------------------------------------------
    # SECTION 1: PURPOSE
    # --------------------------------------------------
    h = doc.add_heading("1. Purpose and How to Use This Report", level=1)
    h.runs[0].font.color.rgb = COLOR_PRIMARY

    purpose_lines = [
        "This document is a machine-readable inspection report of the Powerhub_assistant",
        "browser extension project. It was auto-generated so that Microsoft Copilot can",
        "read and analyse the full project structure and source code without direct file access.",
        "",
        "HOW TO USE THIS DOCUMENT:",
        "  1. Upload this .docx file to Microsoft Copilot (or paste its content).",
        "  2. Ask Copilot questions such as:",
        "     - Analyse manifest.json and list all extension permissions.",
        "     - Review content.js and explain what it injects into PowerSchool.",
        "     - What does popup.js do? Suggest improvements.",
        "     - Find bugs or improvements in styles.css.",
        "     - What is the difference between the root folder and pilot-v1.9.0?",
        "     - Write a clear README.md for this project.",
    ]
    for line in purpose_lines:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after  = Pt(1)
        styled_run(p, line, size=10)

    # --------------------------------------------------
    # SECTION 2: FOLDER STRUCTURE
    # --------------------------------------------------
    add_horizontal_rule(doc)
    h = doc.add_heading("2. Folder Structure", level=1)
    h.runs[0].font.color.rgb = COLOR_PRIMARY

    p = doc.add_paragraph()
    styled_run(p, target_folder + "/", bold=True, size=9, color=COLOR_SECONDARY, mono=True)

    tree_lines = get_folder_tree(target_folder)
    for line in tree_lines:
        p   = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after  = Pt(0)
        run = p.add_run(line)
        run.font.name = 'Courier New'
        run.font.size = Pt(9)
        if '[DIR]' in line:
            run.bold = True
            run.font.color.rgb = COLOR_SECONDARY

    doc.add_paragraph()

    # --------------------------------------------------
    # SECTION 3: FILE INVENTORY TABLE
    # --------------------------------------------------
    add_horizontal_rule(doc)
    h = doc.add_heading("3. File Inventory", level=1)
    h.runs[0].font.color.rgb = COLOR_PRIMARY

    files      = collect_files(target_folder)
    total_size = sum(f['size_b'] for f in files)

    p = doc.add_paragraph()
    styled_run(p,
               "Total: {} files   |   Total size: {:.1f} KB   |   Scanned: {}".format(
                   len(files), total_size / 1024, now_str),
               size=9)

    doc.add_paragraph()

    table = doc.add_table(rows=1, cols=4)
    table.style = 'Table Grid'

    hdr_cells = table.rows[0].cells
    for cell, txt in zip(hdr_cells, ['File Path', 'Type', 'Size', 'Modified']):
        cell.text = txt
        set_cell_bg(cell, "7B1C2A")
        run = cell.paragraphs[0].runs[0]
        run.bold = True
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    for idx, f in enumerate(files):
        row    = table.add_row()
        fill   = "F9F9F9" if idx % 2 == 0 else "FFFFFF"
        values = [f['rel_path'], f['ext'] or '-', f['size_str'], f['modified']]
        for i, (cell, val) in enumerate(zip(row.cells, values)):
            cell.text = val
            set_cell_bg(cell, fill)
            for run in cell.paragraphs[0].runs:
                run.font.size = Pt(8)
                if i == 0:
                    run.font.name = 'Courier New'

    doc.add_paragraph()

    # --------------------------------------------------
    # SECTION 4: FILE CONTENTS
    # --------------------------------------------------
    add_horizontal_rule(doc)
    h = doc.add_heading("4. Source File Contents (for Copilot Analysis)", level=1)
    h.runs[0].font.color.rgb = COLOR_PRIMARY

    p = doc.add_paragraph()
    styled_run(p,
               "Full content of all readable text files is included below. "
               "Large files are truncated at {:,} characters.".format(MAX_CONTENT_CHARS),
               size=10)
    doc.add_paragraph()

    text_files = [f for f in files if f['ext'] in TEXT_EXTENSIONS]
    print("  {} text files will be included in the report.".format(len(text_files)))

    for idx, f in enumerate(text_files):
        print("  [{}/{}] {}".format(idx + 1, len(text_files), f['rel_path']))

        h2 = doc.add_heading(
            "4.{}  {}".format(idx + 1, f['name']), level=2)
        h2.runs[0].font.color.rgb = COLOR_SECONDARY

        p = doc.add_paragraph()
        styled_run(p,
                   "Path: {}   |   Size: {}   |   Modified: {}".format(
                       f['rel_path'], f['size_str'], f['modified']),
                   size=8, color=COLOR_GREY)

        if f['ext'] == '.json':
            content = pretty_json(f['full_path']) or read_file_safe(f['full_path'])
        else:
            content = read_file_safe(f['full_path'])

        if not content.strip():
            p = doc.add_paragraph()
            r = p.add_run("[File is empty]")
            r.italic = True
            r.font.size = Pt(9)
        else:
            add_code_block(doc, content)

        doc.add_paragraph()

    # --------------------------------------------------
    # SECTION 5: PROJECT SUMMARY
    # --------------------------------------------------
    add_horizontal_rule(doc)
    h = doc.add_heading("5. Auto-Analysis Summary", level=1)
    h.runs[0].font.color.rgb = COLOR_PRIMARY

    # 5.1 File types
    doc.add_heading("5.1  File Type Breakdown", level=2)
    ext_counts = {}
    for f in files:
        k = f['ext'] if f['ext'] else '(no ext)'
        ext_counts[k] = ext_counts.get(k, 0) + 1

    tbl2 = doc.add_table(rows=1, cols=2)
    tbl2.style = 'Table Grid'
    for cell, txt in zip(tbl2.rows[0].cells, ['Extension', 'Count']):
        cell.text = txt
        set_cell_bg(cell, "1B3A6B")
        run = cell.paragraphs[0].runs[0]
        run.bold = True
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for ext, cnt in sorted(ext_counts.items()):
        row = tbl2.add_row()
        row.cells[0].text = ext
        row.cells[1].text = str(cnt)
        for cell in row.cells:
            cell.paragraphs[0].runs[0].font.size = Pt(9)

    doc.add_paragraph()

    # 5.2 Detected characteristics
    doc.add_heading("5.2  Detected Project Characteristics", level=2)
    all_names = {f['name'].lower() for f in files}
    all_rels  = {f['rel_path'].lower() for f in files}
    flags = []

    if 'manifest.json' in all_names:
        flags.append("[CHECK] manifest.json found  -> Chrome/Edge browser extension project.")
    if any('popup' in n for n in all_names):
        flags.append("[CHECK] Popup UI detected    -> Extension has a browser-action popup (popup.html / popup.js / popup.css).")
    if 'content.js' in all_names:
        flags.append("[CHECK] content.js found     -> Extension injects scripts into web pages.")
    if 'background.js' in all_names:
        flags.append("[CHECK] background.js found  -> Extension uses a background/service-worker script.")
    if 'styles.css' in all_names:
        flags.append("[CHECK] styles.css found     -> Extension injects custom CSS into host pages.")
    if 'readme.md' in all_names:
        flags.append("[CHECK] README.md found      -> Project has documentation.")
    if any('pilot' in r for r in all_rels):
        flags.append("[CHECK] pilot-v1.9.0/ found  -> A versioned pilot build exists alongside main source.")
    if any('docs' in r for r in all_rels):
        flags.append("[CHECK] docs/ folder found   -> Separate documentation/assets folder exists.")
    if not flags:
        flags.append("[INFO]  No special project characteristics auto-detected.")

    for note in flags:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after  = Pt(2)
        styled_run(p, note, size=10)

    doc.add_paragraph()

    # 5.3 Suggested Copilot prompts
    doc.add_heading("5.3  Suggested Copilot Prompts", level=2)
    prompts = [
        "Summarise this extension: what does it do, who is it for, and how does it work?",
        "Read manifest.json. List all permissions and flag any that seem risky.",
        "Analyse content.js: what does it inject, when, and on which pages?",
        "Review popup.js and popup.html: describe the UI flow and suggest improvements.",
        "Are there any bugs, console errors, or security issues in the JavaScript files?",
        "How can I migrate this extension from Manifest V2 to Manifest V3?",
        "Write a complete README.md based on the source files in this report.",
        "What is different between the main root folder and pilot-v1.9.0/?",
    ]
    for i, prompt in enumerate(prompts, 1):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after  = Pt(2)
        r = p.add_run("  {}. {}".format(i, prompt))
        r.font.size  = Pt(9)
        r.italic     = True

    # Footer
    doc.add_paragraph()
    add_horizontal_rule(doc)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    styled_run(p,
               "Report by: inspect_powerhub.py   |   VAS Powerhub Assistant   |   " + now_str,
               size=8, color=COLOR_GREY)

    # --------------------------------------------------
    # SAVE
    # --------------------------------------------------
    try:
        doc.save(output_file)
        print("\nReport saved: " + output_file)
        return True
    except PermissionError:
        alt = output_file.replace("INSPECTION_REPORT", "INSPECTION_REPORT_new")
        doc.save(alt)
        print("\nFile busy - saved as: " + alt)
        return True
    except Exception as e:
        print("\nSave ERROR: " + str(e))
        return False


# ===================================================
#  ENTRY POINT
# ===================================================
if __name__ == "__main__":
    print("=" * 60)
    print("  Powerhub Assistant - Folder Inspector v1.0")
    print("  For: Nguyen Thi Ai / VAS")
    print("=" * 60)

    success = build_report(TARGET_FOLDER, OUTPUT_FILE)

    if success:
        print("\nNext steps:")
        print("  1. Open INSPECTION_REPORT.docx")
        print("  2. Upload to Copilot chat")
        print("  3. Ask questions about the project!\n")
    else:
        print("\nReport could not be created. See errors above.\n")

    input("Press Enter to close...")
