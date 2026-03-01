FROM python:3.12-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY . .

# Storage directory
RUN mkdir -p /storage/documents

# (Mantén todo igual hasta el USER app)
COPY entrypoint.sh /entrypoint.sh
# Necesitamos ser root un segundo para dar permisos de ejecución
USER root
RUN chmod +x /entrypoint.sh
USER app

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--forwarded-allow-ips", "*", \
     "--proxy-allow-from", "*", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]