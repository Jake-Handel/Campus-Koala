from flask import request, current_app
from functools import wraps

def add_security_headers(response):
    """Add security headers to all responses."""
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'
    
    # Enable XSS protection (not really needed with good CSP, but doesn't hurt)
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    # Content Security Policy
    # Note: Adjust these directives based on your application's needs
    csp = """
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: https:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://*.googleapis.com;
        frame-ancestors 'none';
    """
    
    # Remove extra whitespace and newlines
    csp = ' '.join(line.strip() for line in csp.splitlines() if line.strip())
    
    response.headers['Content-Security-Policy'] = csp
    
    # Prevent caching of sensitive pages
    if request.path.startswith('/api'):
        response.headers['Cache-Control'] = 'no-store, max-age=0'
    
    return response

def security_headers(app):
    """Register the security headers middleware."""
    app.after_request(add_security_headers)
    return app
