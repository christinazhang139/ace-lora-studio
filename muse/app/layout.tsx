import type { Metadata } from "next";
import { Navbar } from "./components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACE Muse",
  description: "AI music continuation tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 font-sans antialiased">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
