import multiprocessing

# Production Gunicorn WSGI Configuration
bind = "0.0.0.0:8000"
workers = 2
worker_class = "sync"
timeout = 120
keepalive = 5
errorlog = "-"
accesslog = "-"
loglevel = "info"
