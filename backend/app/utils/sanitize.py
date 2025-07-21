import bleach
from html import escape
from markdown import markdown

def sanitize_html(html_content):
    """Sanitize HTML content to prevent XSS attacks."""
    if not html_content:
        return ""
        
    # Allowed HTML tags and attributes
    allowed_tags = [
        'p', 'br', 'b', 'i', 'u', 'em', 'strong', 'a', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
        'hr', 'sub', 'sup', 'span', 'div', 'table', 'thead', 'tbody',
        'tr', 'th', 'td', 'img'
    ]
    
    allowed_attributes = {
        'a': ['href', 'title', 'target', 'rel'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        'p': ['class'],
        'span': ['class', 'style'],
        'div': ['class', 'style']
    }
    
    # Clean the HTML content
    cleaned = bleach.clean(
        html_content,
        tags=allowed_tags,
        attributes=allowed_attributes,
        strip=True
    )
    
    # Add rel="noopener noreferrer" to external links
    cleaned = bleach.linkify(cleaned, callbacks=[
        bleach.callbacks.nofollow,
        bleach.callbacks.target_blank
    ])
    
    return cleaned

def sanitize_text(text_content):
    """Sanitize plain text content by escaping HTML special characters."""
    if not text_content:
        return ""
    return escape(str(text_content))

def markdown_to_safe_html(markdown_content):
    """Convert markdown to HTML and sanitize it."""
    if not markdown_content:
        return ""
        
    # Convert markdown to HTML
    html = markdown(markdown_content)
    
    # Sanitize the HTML
    return sanitize_html(html)
