import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import FaviconManager from "@/components/FaviconManager";

export const metadata = {
  title: "FSG OS",
  description:
    "FSG Operating System — modular business software for Technology Solutions Providers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f6f7f9] text-slate-900">
        <SessionProvider>
          <FaviconManager />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
