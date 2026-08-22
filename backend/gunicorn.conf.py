import os
import multiprocessing

# Production Gunicorn WSGI Configuration reading dynamic PORT from environment
port = os.environ.get("PORT", "8000")
bind = f"0.0.0.0:{port}"
workers = 2
worker_class = "sync"
timeout = 120
keepalive = 5
errorlog = "-"
accesslog = "-"
loglevel = "info"
