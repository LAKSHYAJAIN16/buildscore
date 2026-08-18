import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2b2019",
          borderRadius: "50%",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fbf7f2">
          <rect x="3.5" y="12" width="4.5" height="8" rx="2.25" />
          <rect x="9.75" y="7" width="4.5" height="13" rx="2.25" />
          <rect x="16" y="2" width="4.5" height="18" rx="2.25" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
