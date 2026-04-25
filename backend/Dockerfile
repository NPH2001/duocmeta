FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY infra/docker/backend/start.sh /usr/local/bin/backend-start

RUN chmod +x /usr/local/bin/backend-start

EXPOSE 8000

CMD ["backend-start"]
