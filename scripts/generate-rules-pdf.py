"""Generate the CCI Legion Wars public copyright and ruleset PDF.

Copyright (c) 2026 CCI Volunteer Legion and ATLNO.exe.
"""

from __future__ import annotations

from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "COPYRIGHT_AND_RULESET.md"
OUT_DIR = ROOT / "output" / "pdf"
OUTPUT = OUT_DIR / "cci-legion-wars-copyright-ruleset.pdf"


def clean_inline(text: str) -> str:
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    text = text.replace("&", "&amp;")
    text = text.replace("<font name='Courier'>", "<font name='Courier'>")
    text = text.replace("</font>", "</font>")
    return text


def build_story(markdown: str):
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "DocTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#111827"),
        spaceAfter=12,
    )
    heading = ParagraphStyle(
        "Heading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12.5,
        leading=15,
        textColor=colors.HexColor("#ef3f32"),
        spaceBefore=10,
        spaceAfter=6,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#1f2937"),
        spaceAfter=6,
    )
    bullet = ParagraphStyle(
        "Bullet",
        parent=body,
        leftIndent=10,
        firstLineIndent=-7,
        bulletIndent=0,
    )
    code = ParagraphStyle(
        "Code",
        parent=body,
        fontName="Courier",
        fontSize=8.3,
        leading=10.5,
        backColor=colors.HexColor("#f3f4f6"),
        borderColor=colors.HexColor("#d1d5db"),
        borderWidth=0.4,
        borderPadding=5,
        spaceBefore=4,
        spaceAfter=8,
    )

    story = []
    in_code = False
    code_lines = []

    for raw_line in markdown.splitlines():
        line = raw_line.rstrip()

        if line.startswith("```"):
            if in_code:
                story.append(Paragraph("<br/>".join(code_lines), code))
                code_lines = []
                in_code = False
            else:
                in_code = True
            continue

        if in_code:
            code_lines.append(line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
            continue

        if not line:
            story.append(Spacer(1, 2.5 * mm))
            continue

        if line.startswith("# "):
            story.append(Paragraph(clean_inline(line[2:]), title))
        elif line.startswith("## "):
            story.append(Paragraph(clean_inline(line[3:]), heading))
        elif line.startswith("- "):
            story.append(Paragraph(clean_inline(line[2:]), bullet, bulletText="-"))
        else:
            story.append(Paragraph(clean_inline(line), body))

    return story


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#6b7280"))
    canvas.drawString(18 * mm, 12 * mm, "CCI Volunteer Legion Wars - Public Copyright and Tournament Ruleset")
    canvas.drawRightString(192 * mm, 12 * mm, f"Page {doc.page}")
    canvas.restoreState()


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    markdown = SOURCE.read_text(encoding="utf-8")
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=17 * mm,
        bottomMargin=18 * mm,
        title="CCI Legion Wars Copyright and Ruleset",
        author="CCI Volunteer Legion",
    )
    doc.build(build_story(markdown), onFirstPage=footer, onLaterPages=footer)
    print(OUTPUT)


if __name__ == "__main__":
    main()
