import Link from "next/link";
import "./globals.css";
import Providers from "./providers";
import { Inter } from "next/font/google";
import { Roboto } from "next/font/google";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // Membuat variabel CSS agar bisa dibaca Tailwind
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"], // Wajib ditentukan untuk font non-variable
  variable: "--font-roboto",            // Ubah nama variabel CSS
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`dark ${inter.className} ${inter.variable}`}>
      <body className="font-sans bg-dark-elegant min-h-screen flex flex-col">
        <Navbar />

        {/* Konten Halaman */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          <Providers>
            {children}
          </Providers>
        </main>
      </body>
    </html>
  );
}