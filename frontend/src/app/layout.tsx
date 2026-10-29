import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "QA Platform AI - Tự động hóa Kiểm thử & Báo cáo",
  description:
    "Nền tảng tự động hóa kiểm thử QA với Gemini 2.5, Playwright, Cloudinary và xuất báo cáo chuẩn Excel/PDF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
