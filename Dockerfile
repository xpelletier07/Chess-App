FROM node:22-alpine

WORKDIR /app

COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN cd client && npm install \
	&& cd ../server && npm install

COPY client ./client
COPY server ./server

EXPOSE 3000 5000

CMD ["sh", "-c", "cd /app/server && npm start & cd /app/client && npm start"]
