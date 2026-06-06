import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitness CRM",
  description: "Система управления фитнес-клубом",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body>{children}</body>
    </html>
  );
}
