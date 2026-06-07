export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "#0F0F0F" }}>
      <div className="ambient-bg" />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
