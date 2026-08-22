import os

# Production Gunicorn Configuration optimized for 512MB RAM Cloud Instances
port = os.environ.get("PORT", "8000")
bind = f"0.0.0.0:{port}"
workers = 1
threads = 4
worker_class = "gthread"
timeout = 120
keepalive = 5
errorlog = "-"
accesslog = "-"
loglevel = "info"
