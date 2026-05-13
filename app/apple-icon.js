import { ImageResponse } from "next/og";
import { getLogoDataUrl } from "@/lib/server/logoDataUrl";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const dataUrl = await getLogoDataUrl();
  if (dataUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse runtime */}
          <img src={dataUrl} width={160} height={160} alt="" />
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg,#ff6600,#ff8f40)",
        }}
      >
        <span style={{ color: "#0a0a0a", fontSize: 72, fontWeight: 800 }}>CM</span>
        <span style={{ color: "#1a1a1a", fontSize: 18, fontWeight: 700, marginTop: 8 }}>Chacha</span>
      </div>
    ),
    { ...size }
  );
}
