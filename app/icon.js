import { ImageResponse } from "next/og";
import { getLogoDataUrl } from "@/lib/server/logoDataUrl";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
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
          <img src={dataUrl} width={28} height={28} alt="" />
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
          alignItems: "center",
          justifyContent: "center",
          background: "#ff6600",
          borderRadius: 6,
        }}
      >
        <span style={{ color: "#0a0a0a", fontSize: 17, fontWeight: 800, letterSpacing: -0.5 }}>
          CM
        </span>
      </div>
    ),
    { ...size }
  );
}
