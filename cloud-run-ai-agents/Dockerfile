# Use official Python runtime as base image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Python agents application
COPY python_agents/ ./python_agents/

# Set Python path
ENV PYTHONPATH=/app

# Expose port for FastAPI
EXPOSE 8080

# Health check
# Use PORT environment variable for Cloud Run compatibility
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request, os; urllib.request.urlopen(f'http://localhost:{os.getenv(\"PORT\", \"8080\")}/health').read()"

# Make startup script executable
RUN chmod +x python_agents/start_server.py

# Start the FastAPI application
# Uses dedicated startup script for better error handling
CMD ["python", "python_agents/start_server.py"]
