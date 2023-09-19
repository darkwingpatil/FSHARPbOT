FROM node:20.6.1-alpine

WORKDIR /app

COPY package.json .

RUN apk update && \
    apk add python3 && \
    apk add py3-pip && \
    apk add build-base && \
    apk add python3-dev && \
    pip install --upgrade pip

RUN npm install

COPY . .

#EXPOSE 8080

CMD ["npm","run","start"]