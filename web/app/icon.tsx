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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="9" width="9" height="9" rx="2.5" stroke="#fbf7f2" strokeWidth="2" />
          <rect x="12" y="3" width="10" height="10" rx="2.75" fill="#fbf7f2" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
