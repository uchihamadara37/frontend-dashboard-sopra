// components/Navbar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react"; // Import icon baru

export default function Navbar() {
    const pathname = usePathname();
    // State untuk melacak apakah sidebar mobile sedang terbuka
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { name: "AI Chat", href: "/chat" },
        { name: "Rekomendasi & Segmen", href: "/rekomendasi" },
        { name: "Prediksi Stock", href: "/prediksi" },
        { name: "Summary Insight", href: "/summary" },
    ];

    // useEffect(() => {
    //     // Tutup sidebar saat rute berubah
    //     alert("Rute berubah, menutup sidebar...");
    // }, [isOpen]);

    return (
        <>
            {/* NAVBAR UTAMA */}
            <nav className="relative top-0 z-10 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between" >
                    <h1 className="text-xl font-bold neon-text-gradient tracking-wider">
                        SOPRA Dashboard
                    </h1>

                    {/* MENU DESKTOP: Otomatis sembunyi di layar kecil (hidden) dan muncul di layar md ke atas (md:flex) */}
                    <div className="hidden md:flex gap-6 text-sm font-medium">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;

                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`relative py-1 transition-colors duration-300 group ${isActive
                                        ? "text-cyan-400 font-semibold drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                                        : "text-zinc-400 hover:text-cyan-300"
                                        }`}
                                >
                                    {link.name}
                                    <span
                                        className={`absolute -bottom-1 left-0 w-full h-[2px] bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.8)] transition-transform duration-300 origin-center ${isActive ? "scale-x-80" : "scale-x-0 group-hover:scale-x-50"
                                            }`}
                                    />
                                </Link>
                            );
                        })}
                    </div>

                    {/* TOMBOL BURGER MOBILE: Hanya muncul di layar kecil (block) dan sembunyi di layar md ke atas (md:hidden) */}
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            alert("Tombol menu diklik!");
                            e.preventDefault();
                            setIsOpen(true);
                        }}
                        aria-label="Open Menu"
                        className="block z-[70] md:hidden text-zinc-400 hover:text-cyan-400 transition-colors p-1 cursor-pointer"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </nav>



            {/* SIDEBAR MOBILE (Membuka dari Kanan)
                - right-0: Menempel di sisi kanan layar
                - translate-x-full: Sembunyi di luar layar kanan saat false
                - translate-x-0: Meluncur masuk ke dalam layar saat true
            */}
            {/* BACKGROUND OVERLAY (Gelap Transparan saat Sidebar Terbuka) */}
            {isOpen && (
                <>
                    {/* <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
                        onClick={() => setIsOpen(false)} // Klik di luar area untuk menutup
                    /> */}



                    <div
                        className={`fixed top-0 right-0 h-full w-72 bg-zinc-950/95 backdrop-blur-md border-l border-zinc-800 p-6 z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isOpen ? "translate-x-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]" : "translate-x-full"
                            }`}
                    >
                        {/* TOMBOL CLOSE (X) */}
                        <div className="flex justify-end mb-8">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-zinc-400 hover:text-cyan-400 transition-colors p-1"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* MENU VERTIKAL MOBILE */}
                        <div className="flex flex-col gap-5 text-base font-medium">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;

                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        onClick={() => setIsOpen(false)} // Otomatis tutup sidebar setelah menu diklik
                                        className={`transition-colors duration-300 py-2 border-b border-zinc-900/50 block ${isActive
                                            ? "text-cyan-400 font-semibold drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                                            : "text-zinc-400 hover:text-cyan-300"
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}