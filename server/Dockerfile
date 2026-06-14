FROM node:20-alpine

RUN apk add --no-cache python3 py3-pip ffmpeg ca-certificates curl \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.js ./

ENV PORT=8080
EXPOSE 8080
CMD ["node", "index.js"]