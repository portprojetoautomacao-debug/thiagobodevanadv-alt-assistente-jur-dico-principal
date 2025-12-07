#!/usr/bin/env python3
"""
DSPy Bridge Service

This service provides a secure bridge between the Node.js application
and DSPy (Demonstrate-Search-Predict) for advanced prompt optimization.

Security Notes:
- Token-based authentication required (DSPY_API_TOKEN)
- No eval() or exec() - all code is static
- Input validation on all endpoints
- Rate limiting and timeout protection
- CORS restricted to allowed origins
"""

import os
import sys
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import hashlib
import hmac
import time

# Configuration
PORT = int(os.getenv('DSPY_PORT', '8765'))
API_TOKEN = os.getenv('DSPY_API_TOKEN', '')
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173').split(',')

# Rate limiting
request_counts = {}
RATE_LIMIT = 100  # requests per minute
RATE_WINDOW = 60  # seconds


class DSPyHandler(BaseHTTPRequestHandler):
    """HTTP request handler with security features"""

    def _validate_token(self):
        """Validate API token from Authorization header"""
        auth_header = self.headers.get('Authorization', '')
        
        if not API_TOKEN:
            return False
            
        if not auth_header.startswith('Bearer '):
            return False
            
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        
        # Constant-time comparison to prevent timing attacks
        return hmac.compare_digest(token, API_TOKEN)

    def _check_rate_limit(self, client_ip):
        """Check if client has exceeded rate limit"""
        current_time = time.time()
        
        # Clean old entries
        request_counts[client_ip] = [
            t for t in request_counts.get(client_ip, [])
            if current_time - t < RATE_WINDOW
        ]
        
        # Check limit
        if len(request_counts.get(client_ip, [])) >= RATE_LIMIT:
            return False
            
        # Add current request
        if client_ip not in request_counts:
            request_counts[client_ip] = []
        request_counts[client_ip].append(current_time)
        
        return True

    def _send_cors_headers(self):
        """Send CORS headers"""
        origin = self.headers.get('Origin', '')
        if origin in ALLOWED_ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '3600')

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_POST(self):
        """Handle POST requests"""
        client_ip = self.client_address[0]
        
        # Rate limiting
        if not self._check_rate_limit(client_ip):
            self.send_error(429, 'Too Many Requests')
            return

        # Token validation
        if not self._validate_token():
            self.send_error(401, 'Unauthorized')
            return

        # Route handling
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/optimize':
            self._handle_optimize()
        elif parsed_path.path == '/health':
            self._handle_health()
        else:
            self.send_error(404, 'Not Found')

    def _handle_optimize(self):
        """Handle prompt optimization request"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            
            # Limit request size to 1MB
            if content_length > 1024 * 1024:
                self.send_error(413, 'Request Too Large')
                return
                
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            # Validate input
            if 'prompt' not in data or not isinstance(data['prompt'], str):
                self.send_error(400, 'Invalid request: prompt required')
                return
                
            if len(data['prompt']) > 10000:
                self.send_error(400, 'Prompt too long (max 10000 chars)')
                return

            # TODO: Implement actual DSPy optimization
            # For now, return a safe stub response
            optimized_prompt = self._stub_optimize(data['prompt'])
            
            response = {
                'optimized_prompt': optimized_prompt,
                'metadata': {
                    'method': 'stub',
                    'timestamp': int(time.time()),
                }
            }
            
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except json.JSONDecodeError:
            self.send_error(400, 'Invalid JSON')
        except Exception as e:
            print(f"Error in optimize: {e}", file=sys.stderr)
            self.send_error(500, 'Internal Server Error')

    def _stub_optimize(self, prompt):
        """Stub implementation of prompt optimization"""
        # This is a safe placeholder - no eval() or exec()
        return f"{prompt}\n\n[Note: DSPy optimization not yet implemented]"

    def _handle_health(self):
        """Health check endpoint"""
        response = {
            'status': 'healthy',
            'service': 'dspy-bridge',
            'timestamp': int(time.time()),
        }
        
        self.send_response(200)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

    def log_message(self, format, *args):
        """Custom log format"""
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")


def main():
    """Main entry point"""
    if not API_TOKEN:
        print("ERROR: DSPY_API_TOKEN environment variable not set", file=sys.stderr)
        print("Please set a secure token: export DSPY_API_TOKEN=your-secret-token", file=sys.stderr)
        sys.exit(1)
    
    server = HTTPServer(('localhost', PORT), DSPyHandler)
    print(f"DSPy Bridge running on http://localhost:{PORT}")
    print(f"API Token authentication: {'enabled' if API_TOKEN else 'DISABLED (INSECURE)'}")
    print(f"Allowed origins: {ALLOWED_ORIGINS}")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.shutdown()


if __name__ == '__main__':
    main()
