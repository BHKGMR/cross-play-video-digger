// Minimal yt-dlp HTTP wrapper.
// POST /api/info  { url } -> { title, thumbnail, duration, formats: [...] }
// GET  /api/download?url=...&format_id=...  -> streams the file as attachment
//
// Yêu cầu: yt-dlp + ffmpeg đã cài (Dockerfile đã lo).

import express from "express";
import cors from "cors";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

const IS_WIN = process.platform === "win32";

function resolveYtdlp() {
  // 1) Ưu tiên biến môi trường YTDLP_BIN nếu set
  if (process.env.YTDLP_BIN && existsSync(process.env.YTDLP_BIN)) {
    return process.env.YTDLP_BIN;
  }
  // 2) Tìm trong PATH (where trên Windows, which trên Linux/macOS)
  try {
    const cmd = IS_WIN ? "where yt-dlp" : "which yt-dlp";
    const found = execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)[0];
    if (found) return found;
  } catch {
    /* ignore */
  }
  // 3) Vị trí mặc định phổ biến
  const candidates = IS_WIN
    ? [
        "C:\\\\yt-dlp\\\\yt-dlp.exe",
        "C:\\\\Program Files\\\\yt-dlp\\\\yt-dlp.exe",
        `${process.env.USERPROFILE || ""}\\\\yt-dlp.exe`,
      ]
    : ["/usr/local/bin/yt-dlp", "/usr/bin/yt-dlp"];
  for (const p of candidates) if (p && existsSync(p)) return p;
  // Fallback: để spawn tự gọi (sẽ lỗi nếu thiếu)
  return IS_WIN ? "yt-dlp.exe" : "yt-dlp";
}

const YTDLP = resolveYtdlp();
console.log(`[ytdlp-api] yt-dlp binary: ${YTDLP}`);

// (Tuỳ chọn) chỉ định ffmpeg để yt-dlp merge video+audio.
// Đặt FFMPEG_LOCATION trong .env nếu ffmpeg không nằm trong PATH.
const FFMPEG_LOCATION = process.env.FFMPEG_LOCATION;

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: (process.env.ALLOWED_ORIGINS ?? "*").split(",").map((s) => s.trim()),
  }),
);

const PORT = Number(process.env.PORT || 8080);
const COOKIES = process.env.YTDLP_COOKIES_FILE; // optional path to cookies.txt

function ytdlpArgs(extra) {
  const base = ["--no-warnings", "--no-playlist"];
  if (COOKIES) base.push("--cookies", COOKIES);
  if (FFMPEG_LOCATION) base.push("--ffmpeg-location", FFMPEG_LOCATION);
  return [...base, ...extra];
}

function runYtdlpJson(url) {
  return new Promise((resolve, reject) => {
    const proc = spawn(YTDLP, ytdlpArgs(["-J", url]), { windowsHide: true });
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => (out += d));
    proc.stderr.on("data", (d) => (err += d));
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(err || `yt-dlp exit ${code}`));
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function pickFormats(info) {
  const all = Array.isArray(info.formats) ? info.formats : [];
  const out = [];
  const seen = new Set();

  for (const f of all) {
    if (!f.format_id) continue;
    if (f.protocol && f.protocol.startsWith("mhtml")) continue;
    const hasV = f.vcodec && f.vcodec !== "none";
    const hasA = f.acodec && f.acodec !== "none";

    let type;
    let quality;
    if (hasV && hasA) {
      type = "video";
      quality = `${f.height || f.format_note || "?"}p`;
    } else if (hasV && !hasA) {
      // video-only -> sẽ merge với audio tốt nhất qua format_id "<v>+ba"
      type = "merged";
      quality = `${f.height || "?"}p`;
    } else if (!hasV && hasA) {
      type = "audio";
      quality = `${Math.round(f.abr || 0) || "?"}kbps`;
    } else continue;

    const key = `${type}-${quality}-${f.ext}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      format_id: type === "merged" ? `${f.format_id}+ba` : f.format_id,
      ext: type === "merged" ? "mp4" : f.ext,
      quality,
      filesize: f.filesize || f.filesize_approx || null,
      resolution: f.resolution || null,
      vcodec: f.vcodec || null,
      acodec: f.acodec || null,
      type,
    });
  }

  // Sort: video first by resolution desc, then audio by bitrate desc
  out.sort((a, b) => {
    if (a.type === "audio" && b.type !== "audio") return 1;
    if (b.type === "audio" && a.type !== "audio") return -1;
    return (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0);
  });
  return out.slice(0, 20);
}

app.post("/api/info", async (req, res) => {
  const url = req.body?.url;
  if (!url || typeof url !== "string") return res.status(400).json({ error: "url required" });
  try {
    const info = await runYtdlpJson(url);
    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      uploader: info.uploader || info.channel,
      webpage_url: info.webpage_url || url,
      extractor: info.extractor_key || info.extractor || "unknown",
      formats: pickFormats(info),
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get("/api/download", async (req, res) => {
  const { url, format_id } = req.query;
  if (!url || !format_id) return res.status(400).send("url & format_id required");

  try {
    // Lấy tiêu đề trước để đặt tên file
    const info = await runYtdlpJson(String(url));
    const isAudio = String(format_id).includes("bestaudio") || /^ba$|^[0-9]+$/.test("");
    const safeName = String(info.title || "video").replace(/[^\p{L}\p{N}\-_. ]/gu, "_").slice(0, 120);
    const ext = String(format_id).includes("+") ? "mp4" : "m4a";
    const filename = `${safeName}.${isAudio ? "mp3" : ext}`;

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );

    const args = ytdlpArgs([
      "-f",
      String(format_id),
      "--merge-output-format",
      "mp4",
      "-o",
      "-",
      String(url),
    ]);
    const proc = spawn(YTDLP, args, { windowsHide: true });
    proc.stdout.pipe(res);
    proc.stderr.on("data", (d) => process.stderr.write(d));
    proc.on("close", (code) => {
      if (code !== 0 && !res.headersSent) res.status(500).end();
    });
    req.on("close", () => proc.kill("SIGTERM"));
  } catch (e) {
    if (!res.headersSent) res.status(500).send(String(e.message || e));
  }
});

app.get("/healthz", (_, res) => res.send("ok"));

app.listen(PORT, () => console.log(`yt-dlp api on :${PORT}`));