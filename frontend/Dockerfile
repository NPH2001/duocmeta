FROM node:20-alpine

WORKDIR /app

COPY infra/docker/frontend/start.sh /usr/local/bin/frontend-start

RUN chmod +x /usr/local/bin/frontend-start

EXPOSE 3000

CMD ["frontend-start"]
