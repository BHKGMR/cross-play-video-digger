import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Download,
  Loader2,
  Link2,
  Clipboard,
  Music2,
  Film,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  getVideoInfo,
  getDownloadUrl,
  type VideoInfo,
  type VideoFormat,
} from "@/lib/downloader.functions";

const PLATFORMS = [
  "TikTok",
  "YouTube",
  "Instagram",
  "Facebook",
  "Twitter / X",
  "Reddit",
  "Vimeo",
  "Twitch",
];

function formatBytes(n?: number | null) {
  if (!n) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${units[i]}`;
}

function formatDuration(sec?: number | null) {
  if (!sec) return "";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${m}:${String(r).padStart(2, "0")}`;
}

export function Downloader() {
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const fetchInfo = useServerFn(getVideoInfo);
  const fetchDownload = useServerFn(getDownloadUrl);

  const infoMutation = useMutation({
    mutationFn: async (u: string) => fetchInfo({ data: { url: u } }),
    onSuccess: (data) => setInfo(data),
    onError: (e: Error) => {
      setInfo(null);
      toast.error("Không lấy được video", { description: e.message });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (vars: { url: string; format_id: string }) =>
      fetchDownload({ data: vars }),
    onSuccess: ({ downloadUrl }) => {
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    },
    onError: (e: Error) => toast.error("Lỗi tải", { description: e.message }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = url.trim();
    if (!v) return;
    infoMutation.mutate(v);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        infoMutation.mutate(text);
      }
    } catch {
      toast.error("Không truy cập được clipboard");
    }
  };

  return (
    <>
      <Toaster richColors position="top-center" />
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div
            className="grid h-9 w-9 place-items-center rounded-xl"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">TảiVideo</span>
        </div>
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          <a href="#platforms" className="hover:text-foreground transition-colors">
            Nền tảng
          </a>
          <a href="#how" className="hover:text-foreground transition-colors">
            Hướng dẫn
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
        </nav>
      </header>

      <section className="container mx-auto px-6 pb-16 pt-10 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-6 border-primary/30 bg-primary/10 text-primary-glow"
          >
            <Sparkles className="mr-1 h-3 w-3" /> Hỗ trợ 1000+ trang web
          </Badge>
          <h1 className="bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-6xl"
              style={{ backgroundImage: "var(--gradient-primary)" }}>
            Tải video đa nền tảng,<br/>nhanh và miễn phí
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            TikTok không watermark · YouTube MP4/MP3 · Instagram · Facebook · Twitter/X.
            Chỉ cần dán liên kết.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mx-auto mt-10 max-w-2xl">
          <Card
            className="flex flex-col gap-3 border-white/10 bg-card/70 p-3 backdrop-blur-xl md:flex-row md:items-center md:p-2.5"
            style={{ boxShadow: "var(--shadow-elegant)" }}
          >
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-background/40 px-3">
              <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Dán liên kết video tại đây…"
                className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
                type="url"
                inputMode="url"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={pasteFromClipboard}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Clipboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dán</span>
              </Button>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={infoMutation.isPending || !url.trim()}
              className="h-12 px-6 font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              {infoMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Tải về
            </Button>
          </Card>

          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            {PLATFORMS.map((p) => (
              <span
                key={p}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
              >
                {p}
              </span>
            ))}
          </div>
        </form>

        {info && (
          <ResultCard
            info={info}
            onPick={(f) =>
              downloadMutation.mutate({ url: info.webpage_url, format_id: f.format_id })
            }
            downloading={downloadMutation.isPending}
          />
        )}
      </section>

      <section id="how" className="container mx-auto px-6 py-16">
        <h2 className="text-center text-3xl font-bold">Cách dùng trong 3 bước</h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3">
          {[
            { n: "01", t: "Sao chép liên kết", d: "Copy URL video từ TikTok, YouTube, Instagram, FB…" },
            { n: "02", t: "Dán vào ô trên", d: "Hệ thống tự lấy thông tin và các chất lượng có sẵn." },
            { n: "03", t: "Chọn & tải về", d: "Chọn MP4 hoặc MP3, file lưu trực tiếp về máy bạn." },
          ].map((s) => (
            <Card key={s.n} className="border-white/10 bg-card/60 p-6 backdrop-blur">
              <div
                className="text-3xl font-black text-transparent bg-clip-text"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                {s.n}
              </div>
              <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto grid gap-4 px-6 pb-20 md:grid-cols-3">
        {[
          { Icon: Zap, t: "Tốc độ cao", d: "Lấy trực tiếp từ CDN gốc, không qua trung gian chậm." },
          { Icon: ShieldCheck, t: "Không watermark", d: "Hỗ trợ TikTok HD không logo nguồn." },
          { Icon: Music2, t: "Tách MP3", d: "Chuyển nhanh sang âm thanh chất lượng cao." },
        ].map(({ Icon, t, d }) => (
          <Card key={t} className="border-white/10 bg-card/60 p-6 backdrop-blur">
            <Icon className="h-6 w-6 text-primary-glow" />
            <h3 className="mt-3 font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </Card>
        ))}
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} TảiVideo · Chỉ tải nội dung bạn có quyền sử dụng.
      </footer>
    </>
  );
}

function ResultCard({
  info,
  onPick,
  downloading,
}: {
  info: VideoInfo;
  onPick: (f: VideoFormat) => void;
  downloading: boolean;
}) {
  const video = info.formats.filter((f) => f.type !== "audio");
  const audio = info.formats.filter((f) => f.type === "audio");

  return (
    <Card
      className="mx-auto mt-8 max-w-3xl overflow-hidden border-white/10 bg-card/70 p-0 backdrop-blur-xl"
      style={{ boxShadow: "var(--shadow-elegant)" }}
    >
      <div className="flex flex-col gap-5 p-5 md:flex-row">
        {info.thumbnail && (
          <img
            src={info.thumbnail}
            alt={info.title}
            loading="lazy"
            className="aspect-video w-full rounded-lg object-cover md:w-72"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="capitalize">
              {info.extractor}
            </Badge>
            {info.duration ? <span>{formatDuration(info.duration)}</span> : null}
          </div>
          <h3 className="mt-2 line-clamp-2 text-lg font-semibold">{info.title}</h3>
          {info.uploader && (
            <p className="mt-1 text-sm text-muted-foreground">{info.uploader}</p>
          )}
        </div>
      </div>

      {video.length > 0 && (
        <FormatGroup
          icon={<Film className="h-4 w-4" />}
          label="Video"
          formats={video}
          onPick={onPick}
          downloading={downloading}
        />
      )}
      {audio.length > 0 && (
        <FormatGroup
          icon={<Music2 className="h-4 w-4" />}
          label="Âm thanh"
          formats={audio}
          onPick={onPick}
          downloading={downloading}
        />
      )}
    </Card>
  );
}

function FormatGroup({
  icon,
  label,
  formats,
  onPick,
  downloading,
}: {
  icon: React.ReactNode;
  label: string;
  formats: VideoFormat[];
  onPick: (f: VideoFormat) => void;
  downloading: boolean;
}) {
  return (
    <div className="border-t border-white/5 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {formats.map((f) => (
          <button
            key={f.format_id}
            type="button"
            onClick={() => onPick(f)}
            disabled={downloading}
            className="group flex items-center justify-between rounded-lg border border-white/10 bg-background/30 px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-primary/10 disabled:opacity-50"
          >
            <div className="min-w-0">
              <div className="font-medium">{f.quality}</div>
              <div className="text-xs text-muted-foreground">
                {f.ext.toUpperCase()} {f.filesize ? `· ${formatBytes(f.filesize)}` : ""}
              </div>
            </div>
            <Download className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary-glow" />
          </button>
        ))}
      </div>
    </div>
  );
}