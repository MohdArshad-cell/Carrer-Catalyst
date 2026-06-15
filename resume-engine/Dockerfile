# 1. Use a modern, slim Python base image for better performance
FROM python:3.11-slim

# 2. Set environment variables to prevent Python from writing .pyc files & buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Set the working directory
WORKDIR /app

# 4. Install Tectonic and its minimal dependencies (Goodbye 2GB TexLive bloat)
# We use the official install script to automatically detect your CPU architecture (x86_64 vs arm64)
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    libfontconfig1 \
    libgraphite2-3 \
    libharfbuzz0b \
    --no-install-recommends \
    && curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh \
    && mv tectonic /usr/local/bin/ \
    && apt-get remove -y curl \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Pre-cache Tectonic packages to speed up the first generation
# This creates a dummy document and compiles it so Tectonic downloads necessary LaTeX packages during the build.
# Pre-cache Tectonic packages to speed up the first generation
# Pre-cache ALL heavy Tectonic packages used by templates to prevent runtime crashes
RUN printf '%s\n' '\documentclass{article}\usepackage{fontawesome5}\usepackage{hyperref}\usepackage{titlesec}\usepackage{enumitem}\usepackage{geometry}\usepackage{tabularx}\usepackage{color}\usepackage{latexsym}\begin{document}\faGithub Hello\end{document}' > dummy.tex \
    && tectonic dummy.tex \
    && rm dummy.tex dummy.pdf

# 5. Copy and install Python requirements first (leverage Docker caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 6. Copy your application code
COPY ./app ./app

# 7. Create a non-root user for Enterprise Security
# Cloud providers (like AWS/GCP/Render) will flag containers running as root.
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# 8. Expose the port your app runs on
EXPOSE 10000

# 9. Command to run your application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]