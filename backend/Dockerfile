FROM python:3.11-slim

WORKDIR /app/backend

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/backend

EXPOSE 3000

CMD ["python", "server.py"]
