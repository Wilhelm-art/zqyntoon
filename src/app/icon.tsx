import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};
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
          backgroundColor: "#07080B",
          borderRadius: "128px",
        }}
      >
        <div
          style={{
            width: "360px",
            height: "360px",
            borderRadius: "90px",
            background: "linear-gradient(135deg, #F27D26 0%, #FFA24D 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 60px rgba(242, 125, 38, 0.4)",
          }}
        >
          <span
            style={{
              fontSize: "240px",
              fontWeight: 900,
              color: "#07080B",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Z
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
