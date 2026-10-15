import { ImageResponse } from "next/og";

export const alt = "Courtly — court booking without the back-and-forth";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "72px",
        background: "#173f2c",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
          fontSize: 34,
          fontWeight: 800,
        }}
      >
        <div
          style={{
            width: 58,
            height: 58,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 16,
            background: "#cbe86b",
            color: "#173f2c",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              border: "5px solid #173f2c",
              borderRadius: "50%",
              display: "flex",
            }}
          />
        </div>
        courtly
      </div>
      <div
        style={{
          marginTop: 58,
          maxWidth: 940,
          fontSize: 76,
          lineHeight: 1.06,
          fontWeight: 900,
          letterSpacing: "-3px",
        }}
      >
        Court booking without the back-and-forth.
      </div>
      <div style={{ marginTop: 34, fontSize: 28, color: "#dce6de" }}>
        Faster bookings. Flexible payments. No double bookings.
      </div>
    </div>,
    size,
  );
}
