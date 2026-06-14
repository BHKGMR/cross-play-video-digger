import { createFileRoute } from "@tanstack/react-router";
import { Downloader } from "@/components/Downloader";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TảiVideo — Tải video TikTok, YouTube, Instagram miễn phí" },
      {
        name: "description",
        content:
          "Công cụ tải video đa nền tảng: TikTok không watermark, YouTube MP4/MP3, Instagram Reels, Facebook, Twitter/X. Nhanh, miễn phí, không cần cài đặt.",
      },
      { property: "og:title", content: "TảiVideo — Tải video đa nền tảng" },
      {
        property: "og:description",
        content: "Dán link, chọn chất lượng, tải về trong vài giây.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <img
        src={heroBg}
        alt=""
        aria-hidden
        width={1920}
        height={1280}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative z-10">
        <Downloader />
      </div>
    </main>
  );
}
