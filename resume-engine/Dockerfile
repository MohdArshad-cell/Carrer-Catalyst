# Use a lightweight Python base image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Change the cache directory to something inside the app folder, NOT /tmp
# /tmp gets cleared. /app/tectonic_cache will be baked into the image.
ENV TECTONIC_CACHE_DIR=/app/tectonic_cache

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    fontconfig \
    libfontconfig1 \
    && rm -rf /var/lib/apt/lists/*

# Create cache directory and give it full read/write permissions
RUN mkdir -p /app/tectonic_cache && chmod 777 /app/tectonic_cache

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- CRITICAL ADDITION: PRE-WARM TECTONIC CACHE ---
# We create a dummy LaTeX file and compile it. 
# This forces Tectonic to download the core bundles DURING the Docker build, 
# so users don't have to wait for downloads at runtime.
RUN echo "\\documentclass{article}\\begin{document}Hello\\end{document}" > dummy.tex \
    && tectonic dummy.tex \
    && rm dummy.tex dummy.pdf

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 8000

# Command to run
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]