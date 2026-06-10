import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import FaviconManager from "@/components/FaviconManager";

export const metadata = {
  title: "Managed Wi-Fi BOM Calculator",
  description:
    "Generate itemized hardware BOMs, cnMaestro subscriptions, and professional services quotes for managed Wi-Fi deployments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f6f7f9] text-slate-900">
        <FaviconManager />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
