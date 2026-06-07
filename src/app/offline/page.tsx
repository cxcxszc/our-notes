export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4" style={{ background: "#0F0F0F" }}>
      <div className="text-center">
        <div className="text-5xl mb-4">💔</div>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "24px", color: "#F5F0F2", marginBottom: "8px" }}>You're Offline</h1>
        <p style={{ color: "#6B5F64", fontSize: "14px" }}>Check your connection and try again.</p>
      </div>
    </div>
  );
}
