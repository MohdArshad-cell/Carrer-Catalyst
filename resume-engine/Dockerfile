# 1. Use the modern, slim Python base image
FROM python:3.11-slim

# 2. Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Set the working directory
WORKDIR /app

# 4. Install a STATICALLY LINKED Tectonic (musl) to bypass ALL C-library crashes!
# This script auto-detects if you are on a Mac (aarch64) or Render (x86_64)
# and downloads the standalone version that doesn't need external libssl or fontconfig.
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    fontconfig \
    --no-install-recommends \
    && ARCH=$(uname -m) \
    && if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then \
         TARGET="aarch64-unknown-linux-musl"; \
       else \
         TARGET="x86_64-unknown-linux-musl"; \
       fi \
    && curl -sL "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-${TARGET}.tar.gz" | tar -xz -C /usr/local/bin \
    && apt-get remove -y curl \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Pre-cache ALL heavy Tectonic packages used by templates to prevent runtime downloads
RUN printf '%s\n' '\documentclass{article}\usepackage{fontawesome5}\usepackage{hyperref}\usepackage{titlesec}\usepackage{enumitem}\usepackage{geometry}\usepackage{tabularx}\usepackage{color}\usepackage{latexsym}\begin{document}\faGithub Hello\end{document}' > dummy.tex \
    && tectonic dummy.tex \
    && rm dummy.tex dummy.pdf

# 5. Copy and install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


# 6. Copy your application code
COPY ./app ./app

# 7. Create a non-root user for security
RUN useradd -m appuser && chown -R appuser:appuser /app

# FIX: Copy the Tectonic package cache from root to appuser so it doesn't redownload on every run!
RUN mkdir -p /home/appuser/.cache && \
    cp -r /root/.cache/Tectonic /home/appuser/.cache/Tectonic && \
    chown -R appuser:appuser /home/appuser/.cache

USER appuser

# 8. Expose the port your app runs on
EXPOSE 10000

# 9. Command to run your application
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"