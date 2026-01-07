// Mobile pages should NOT use the dashboard layout
export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

