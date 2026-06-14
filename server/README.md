# Backend yt-dlp cho TảiVideo

API tối giản gói `yt-dlp` để site Lovable của bạn gọi tới.
Server tự dò `yt-dlp.exe` trong PATH (hoặc theo biến `YTDLP_BIN`).

---

## A. Triển khai trên VPS Windows

### 1) Cài Node.js LTS

Tải tại https://nodejs.org (chọn LTS, bản Windows Installer).
Sau khi cài, mở **PowerShell** và kiểm tra:

```powershell
node -v
npm -v
```

### 2) Cài yt-dlp và ffmpeg

Cách nhanh nhất là dùng **winget** (có sẵn trên Windows 10/11/Server 2022):

```powershell
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```

Sau khi cài, **mở PowerShell mới** rồi xác nhận:

```powershell
yt-dlp --version
ffmpeg -version
```

> Nếu `winget` không có, tải tay:
> - yt-dlp.exe: https://github.com/yt-dlp/yt-dlp/releases/latest → đặt vào `C:\yt-dlp\yt-dlp.exe` rồi thêm `C:\yt-dlp` vào PATH.
> - ffmpeg: https://www.gyan.dev/ffmpeg/builds/ → giải nén, thêm thư mục `bin` vào PATH.

### 3) Copy thư mục `server/` lên VPS và chạy

Giả sử bạn để ở `C:\ytdlp-api`:

```powershell
cd C:\ytdlp-api
npm install

# Đổi domain Lovable của bạn vào ALLOWED_ORIGINS
$env:ALLOWED_ORIGINS = "https://your-site.lovable.app"
$env:PORT = "8080"
# (tuỳ chọn) chỉ định đường dẫn nếu không có trong PATH
# $env:YTDLP_BIN = "C:\yt-dlp\yt-dlp.exe"
# $env:FFMPEG_LOCATION = "C:\ffmpeg\bin"

node index.js
```

Kiểm tra: mở trình duyệt vào `http://localhost:8080/healthz` → thấy `ok`.

### 4) Chạy nền như Windows Service (khuyên dùng)

Dùng [NSSM](https://nssm.cc/download) để biến Node app thành service tự khởi động:

```powershell
# Sau khi tải NSSM và giải nén
nssm install YtdlpApi "C:\Program Files\nodejs\node.exe" "C:\ytdlp-api\index.js"
nssm set YtdlpApi AppDirectory "C:\ytdlp-api"
nssm set YtdlpApi AppEnvironmentExtra ^
  "PORT=8080" ^
  "ALLOWED_ORIGINS=https://your-site.lovable.app"
nssm start YtdlpApi
```

### 5) Mở port 8080 trên Windows Firewall

```powershell
New-NetFirewallRule -DisplayName "ytdlp-api" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

### 6) (Khuyên dùng) Đặt HTTPS bằng Caddy cho Windows

Tải Caddy: https://caddyserver.com/download → đặt `caddy.exe` và file `Caddyfile`:

```
ytdlp.yourdomain.com {
  reverse_proxy 127.0.0.1:8080
}
```

Chạy: `caddy run` (hoặc cài dạng service tương tự NSSM).

### 7) Khai báo URL cho site Lovable

Vào Lovable → **Project Settings → Secrets**, đặt:

```
YTDLP_API_URL = https://ytdlp.yourdomain.com
```

---

## B. (Tuỳ chọn) Triển khai bằng Docker trên Linux

Nếu sau này bạn chuyển sang Linux, file `Dockerfile` + `docker-compose.yml` đã có sẵn:

```bash
docker compose up -d --build
```

---

## Endpoint

- `POST /api/info` body `{ "url": "..." }` → thông tin + danh sách format
- `GET  /api/download?url=...&format_id=...` → stream file MP4/MP3
- `GET  /healthz`

## Biến môi trường

| Tên | Bắt buộc | Mô tả |
|-----|----------|-------|
| `PORT` | không | Cổng HTTP (mặc định 8080) |
| `ALLOWED_ORIGINS` | nên | Danh sách domain được CORS, cách nhau bằng dấu phẩy |
| `YTDLP_BIN` | không | Đường dẫn đầy đủ tới `yt-dlp.exe` nếu không có trong PATH |
| `FFMPEG_LOCATION` | không | Thư mục chứa `ffmpeg.exe` (cần khi merge video+audio) |
| `YTDLP_COOKIES_FILE` | không | File `cookies.txt` cho video login-required |

## Cookies (tuỳ chọn)

Một số nền tảng (YouTube tuổi giới hạn, Instagram private, Facebook…) cần
cookies. Xuất `cookies.txt` từ trình duyệt (extension "Get cookies.txt"),
đặt vào VPS rồi set `YTDLP_COOKIES_FILE=C:\path\to\cookies.txt`.

## Cập nhật yt-dlp (Windows)

```powershell
yt-dlp -U
# hoặc: winget upgrade yt-dlp.yt-dlp
```