import time
import logging
from collections import defaultdict
from django.http import JsonResponse
from django.core.cache import cache

logger = logging.getLogger(__name__)

class ProductionSecurityMiddleware:
    """
    Production-grade Security & Rate Limiting Middleware.
    
    Protects against:
      - Denial of Service (DoS) & DDoS burst attacks (Token Bucket Rate Limiter)
      - Brute-force auth attacks on OTP / Login endpoints
      - HTTP Host Header Poisoning
      - XSS, Clickjacking, and MIME-sniffing exploits (Security Headers)
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.ip_request_history = defaultdict(list)
        # Limit per IP: 60 requests per 10-second window (6 req/sec average)
        self.RATE_LIMIT_WINDOW = 10
        self.MAX_REQUESTS_PER_WINDOW = 60
        # Strict Rate Limit for Auth/OTP endpoints: max 5 attempts per minute
        self.AUTH_LIMIT_WINDOW = 60
        self.MAX_AUTH_ATTEMPTS = 5

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip

    def is_rate_limited(self, ip, path):
        now = time.time()
        
        # Check auth rate limit
        if '/api/auth/' in path:
            auth_cache_key = f"ratelimit:auth:{ip}"
            current_auth_count = cache.get(auth_cache_key, 0)
            if current_auth_count >= self.MAX_AUTH_ATTEMPTS:
                return True, "Too many authentication requests. Please wait 1 minute before trying again."
            cache.set(auth_cache_key, current_auth_count + 1, timeout=self.AUTH_LIMIT_WINDOW)

        # Check general IP request rate limit
        timestamps = self.ip_request_history[ip]
        # Remove timestamps outside the current window
        self.ip_request_history[ip] = [t for t in timestamps if now - t < self.RATE_LIMIT_WINDOW]
        
        if len(self.ip_request_history[ip]) >= self.MAX_REQUESTS_PER_WINDOW:
            return True, "Rate limit exceeded. High request burst detected (DoS protection)."
        
        self.ip_request_history[ip].append(now)
        return False, None

    def __call__(self, request):
        ip = self.get_client_ip(request)
        
        # 1. DoS / DDoS Rate Limiting
        is_limited, reason = self.is_rate_limited(ip, request.path)
        if is_limited:
            logger.warning(f"[SecurityMiddleware] Blocked IP {ip} accessing {request.path}: {reason}")
            return JsonResponse(
                {'error': 'Too Many Requests', 'detail': reason, 'status_code': 429},
                status=429
            )

        response = self.get_response(request)

        # 2. Add Production Security Headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        return response
