"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "#f3f5f1",
            color: "#17231b",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 520 }}>
            <p style={{ color: "#235c43", fontWeight: 800 }}>Courtly</p>
            <h1>We couldn&apos;t load this page.</h1>
            <p style={{ color: "#718076", lineHeight: 1.6 }}>
              Please try again. Your booking is not changed by refreshing this
              page.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 16,
                border: 0,
                borderRadius: 12,
                padding: "14px 20px",
                background: "#235c43",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
