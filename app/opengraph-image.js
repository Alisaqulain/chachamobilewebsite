import { ImageResponse } from "next/og";
import { getLogoDataUrl } from "@/lib/server/logoDataUrl";
import { SITE_NAME } from "@/lib/site-config";

export const runtime = "nodejs";
export const alt = `${SITE_NAME} — mobile spare parts in Uttar Pradesh`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const dataUrl = await getLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 56,
          background: "linear-gradient(125deg,#09090b 0%,#18181b 45%,#27272a 100%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 720, gap: 18 }}>
          <span
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#ff6600",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Uttar Pradesh · India
          </span>
          <span style={{ fontSize: 64, fontWeight: 800, color: "#fafafa", lineHeight: 1.05 }}>
            {SITE_NAME}
          </span>
          <span style={{ fontSize: 32, fontWeight: 600, color: "#a1a1aa", lineHeight: 1.25 }}>
            Mobile spare parts · Displays · Batteries · Wholesale for repair shops
          </span>
          <span style={{ fontSize: 26, color: "#d4d4d8", marginTop: 8 }}>
            Muzaffarnagar · Meerut · Shamli · Order on WhatsApp
          </span>
        </div>
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: 36,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 24px 80px rgba(255,102,0,0.35)",
          }}
        >
          {dataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- ImageResponse runtime */
            <img src={dataUrl} width={180} height={180} alt="" />
          ) : (
            <span style={{ fontSize: 72, fontWeight: 800, color: "#ff6600" }}>CM</span>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
