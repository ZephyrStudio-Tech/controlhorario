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

# Create non-root user
RUN addgroup --system app && adduser --system --ingroup app app
RUN chown -R app:app /app /storage
USER app

EXPOSE 8000

CMD ["gunicorn", "app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--forwarded-allow-ips", "*", \
     "--proxy-allow-from", "*", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
