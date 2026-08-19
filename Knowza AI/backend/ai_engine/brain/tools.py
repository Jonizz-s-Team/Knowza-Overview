import logging
import uuid
import os
import markdown
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER

logger = logging.getLogger(__name__)

def search_web(query: str, max_results: int = 5) -> list:
    """
    Search the web using DuckDuckGo.
    Returns a list of dicts: [{'title': ..., 'href': ..., 'body': ...}]
    """
    try:
        from ddgs import DDGS
    except ImportError:
        logger.error("ddgs is not installed.")
        return []

    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            return results
    except Exception as e:
        logger.error(f"Web search error: {str(e)}")
        return []

def generate_pdf(text_content: str, filename: str = None) -> str:
    """
    Generates a PDF from markdown text and returns the file path.
    Saves in the Django MEDIA_ROOT / generated_pdfs.
    """
    if not filename:
        filename = f"knowza_article_{uuid.uuid4().hex[:8]}.pdf"
    
    # Ensure directory exists
    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'generated_pdfs')
    os.makedirs(pdf_dir, exist_ok=True)
    
    filepath = os.path.join(pdf_dir, filename)
    
    # Convert markdown to basic HTML then strip (ReportLab handles basic HTML)
    html_text = markdown.markdown(text_content)
    # Just a very basic conversion. Real production would use a proper HTML to PDF engine.
    # For now, we just pass the text and let reportlab handle paragraph breaks.
    
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Add some custom styles to handle standard text better
    styles.add(ParagraphStyle(
        name='KnowzaNormal',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        alignment=TA_JUSTIFY,
        spaceAfter=10
    ))
    
    styles.add(ParagraphStyle(
        name='KnowzaHeading1',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        alignment=TA_CENTER,
        spaceAfter=15
    ))

    import re
    import html
    
    # Split by newlines and create paragraphs
    story = []
    
    lines = text_content.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line == '---':
            continue
            
        # Normalize quotes and apostrophes for ReportLab's default font
        line = line.replace('ʻ', "'").replace('’', "'").replace('‘', "'")
        line = line.replace('“', '"').replace('”', '"')
            
        style = styles['KnowzaNormal']
        if line.startswith('#'):
            hashes = len(line) - len(line.lstrip('#'))
            line = line.lstrip('#').strip()
            if hashes == 1:
                style = styles['KnowzaHeading1']
            elif hashes == 2:
                style = styles['Heading2']
            else:
                style = styles['Heading3']
            
        # Convert markdown bullet points to literal bullets
        line = re.sub(r'^[-*]\s+', '• ', line)
            
        # Escape HTML chars to avoid ReportLab XML parsing errors
        line = html.escape(line)
        
        # Replace Markdown bold and italic with ReportLab tags
        line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
        line = re.sub(r'__(.*?)__', r'<b>\1</b>', line)
        line = re.sub(r'\*(.*?)\*', r'<i>\1</i>', line)
        line = re.sub(r'_(.*?)_', r'<i>\1</i>', line)
        
        # Replace Markdown links with ReportLab supported links
        line = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2" color="blue">\1</a>', line)
        
        # ReportLab also doesn't like ampersands inside hrefs sometimes, but escaping should handle most text issues.
        # Ensure we don't have empty paragraphs causing issues
        if line.strip():
            story.append(Paragraph(line, style))
            
    try:
        doc.build(story)
        return filepath
    except Exception as e:
        logger.error(f"PDF generation error: {str(e)}")
        return ""
