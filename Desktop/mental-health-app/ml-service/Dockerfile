# ml-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install only essential system dependencies (no gcc/g++ needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install dependencies with increased timeout and retries
RUN pip install --no-cache-dir --default-timeout=1000 --retries=5 \
    numpy==1.24.3 \
    pandas==2.0.3 \
    scikit-learn==1.3.0 \
    fastapi==0.104.1 \
    uvicorn==0.24.0 \
    pydantic==2.4.2 \
    python-multipart==0.0.6 \
    joblib==1.3.2 \
    python-dotenv==1.0.0 \
    requests==2.31.0 \
    pymongo==4.5.0

# Note: PyTorch and torch-geometric are heavy and causing timeouts
# For now, we'll use a fallback recommendation system without them
# Copy the application code (with fallback)

COPY . .

# Expose port
EXPOSE 8001

# Start the ML service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]