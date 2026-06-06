# 1. Use a modern, slim Python base image for better performance
FROM python:3.11-slim

# 2. Set environment variables to prevent Python from writing .pyc files & buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Set the working directory
WORKDIR /app

# 4. Install Tectonic and its minimal dependencies (Goodbye 2GB TexLive bloat)
# We install curl to download the binary, extract it to /usr/local/bin, then uninstall curl to save space.
RUN apt-get update && apt-get install -y \
    curl \
    libfontconfig1 \
    libgraphite2-3 \
    libharfbuzz0b \
    --no-install-recommends \
    && curl -sL https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz | tar -xz -C /usr/local/bin \
    && apt-get remove -y curl \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 5. Copy and install Python requirements first (leverage Docker caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 6. Copy your application code
COPY ./app ./app

# 7. Create a non-root user for Enterprise Security
# Cloud providers (like AWS/GCP) will flag containers running as root.
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# 8. Expose the port your app runs on
EXPOSE 10000

# 9. Command to run your application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]