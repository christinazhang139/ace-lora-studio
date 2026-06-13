import type { Metadata } from "next";
import { Sidebar } from "./components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACE LoRA Christina Studio",
  description: "LoRA training workspace for ACE-Step 1.5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 font-sans antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
