# Backend yt-dlp cho TảiVideo

API tối giản gói `yt-dlp` để site Lovable của bạn gọi tới.

## Triển khai trên VPS (1 phút)

Yêu cầu: VPS Linux có Docker + Docker Compose.

```bash
# 1) Copy thư mục server/ này lên VPS
scp -r server/ user@your-vps:/opt/ytdlp-api

# 2) Vào thư mục và chỉnh ALLOWED_ORIGINS trong docker-compose.yml
ssh user@your-vps
cd /opt/ytdlp-api
nano docker-compose.yml   # đổi ALLOWED_ORIGINS sang domain Lovable của bạn

# 3) Khởi động
docker compose up -d --build

# 4) Kiểm tra
curl http://localhost:8080/healthz
```

## Đặt HTTPS (khuyên dùng Caddy)

`/etc/caddy/Caddyfile`:

```
ytdlp.yourdomain.com {
  reverse_proxy 127.0.0.1:8080
}
```

Sau đó vào Lovable → Project Settings → Secrets, đặt:

```
YTDLP_API_URL = https://ytdlp.yourdomain.com
```

## Endpoint

- `POST /api/info` body `{ "url": "..." }` → thông tin + danh sách format
- `GET  /api/download?url=...&format_id=...` → stream file MP4/MP3
- `GET  /healthz`

## Cookies (tuỳ chọn)

Một số nền tảng (YouTube tuổi giới hạn, Instagram private, Facebook…) cần
cookies. Xuất `cookies.txt` từ trình duyệt (extension "Get cookies.txt"),
đặt vào `./cookies/cookies.txt`, bỏ comment 2 dòng `volumes:` và
`YTDLP_COOKIES_FILE` trong `docker-compose.yml`.

## Cập nhật yt-dlp

```bash
docker compose build --no-cache && docker compose up -d
```