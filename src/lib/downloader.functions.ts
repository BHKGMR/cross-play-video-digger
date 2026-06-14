import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const urlSchema = z.object({ url: z.string().url().max(2048) });

export type VideoFormat = {
  format_id: string;
  ext: string;
  quality: string;
  filesize?: number | null;
  resolution?: string | null;
  vcodec?: string | null;
  acodec?: string | null;
  type: "video" | "audio" | "merged";
};

export type VideoInfo = {
  title: string;
  thumbnail?: string | null;
  duration?: number | null;
  uploader?: string | null;
  webpage_url: string;
  extractor: string;
  formats: VideoFormat[];
};

function getBase(): string {
  const base = process.env.YTDLP_API_URL;
  if (!base) {
    throw new Error(
      "Backend yt-dlp chưa được cấu hình. Vui lòng đặt biến môi trường YTDLP_API_URL trỏ tới VPS của bạn (ví dụ: https://ytdlp.example.com).",
    );
  }
  return base.replace(/\/$/, "");
}

export const getVideoInfo = createServerFn({ method: "POST" })
  .inputValidator(urlSchema)
  .handler(async ({ data }): Promise<VideoInfo> => {
    const base = getBase();
    const res = await fetch(`${base}/api/info`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: data.url }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Backend lỗi (${res.status}): ${text.slice(0, 200) || "không rõ"}`);
    }
    return (await res.json()) as VideoInfo;
  });

export const getDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ url: z.string().url().max(2048), format_id: z.string().min(1).max(64) }),
  )
  .handler(async ({ data }) => {
    const base = getBase();
    // Backend trả về link stream tải về (proxied) — site chỉ trả về URL,
    // client mở trực tiếp để trình duyệt download.
    const u = new URL(`${base}/api/download`);
    u.searchParams.set("url", data.url);
    u.searchParams.set("format_id", data.format_id);
    return { downloadUrl: u.toString() };
  });