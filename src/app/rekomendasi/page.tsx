"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";


// fungsi fetcher
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const fetchSegments = async () => {
    const res = await fetch(`${API_URL}/api/segments`);
    if (!res.ok) throw new Error("Gagal mengambil data segmen");
    const data = await res.json();
    console.log("hasil ok", data); // Debugging: log hasil response
    return data;
};
const fetchBestProduct = async (threshold?: number) => {
    const url = threshold
        ? `${API_URL}/api/best-product?threshold=${threshold}`
        : `${API_URL}/api/best-product`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal mengambil data rekomendasi");

    const data = await res.json();
    console.log("hasil", data); // Debugging: log hasil response
    return data;
};
const fetchRecommendations = async (targetProduct?: string) => {
    const url = targetProduct
        ? `${API_URL}/api/recomendations?target_product=${targetProduct}`
        : `${API_URL}/api/recomendations`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal mengambil data rekomendasi");
    const data = await res.json();
    console.log("hasil rekom", data); // Debugging: log hasil response
    return data;
}


export default function RekomendasiPage() {
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const { data: segmentData, isLoading, isError } = useQuery({
        queryKey: ["segments"],
        queryFn: fetchSegments,
    });

    const { data: bestProductsData, isLoading: loadProducts } = useQuery({
        queryKey: ["bestProducts"],
        queryFn: () => fetchBestProduct(),
    });

    const { data: crossSellData, isLoading: loadCrossSell } = useQuery({
        queryKey: ["crossSell", selectedProduct],
        queryFn: () => fetchRecommendations(selectedProduct!),
        enabled: !!selectedProduct,
    });

    if (isLoading) {
        return <p className="text-cyan-400 animate-pulse">Memuat data segmentasi pelanggan...</p>;
    }

    return (
        <div className="space-y-8">
            {/* BAGIAN 1: REKOMENDASI PRODUK HORIZONTAL */}
            <section>
                <h2 className="text-xl font-bold mb-4 neon-text-gradient">5 Produk Terlaris</h2>

                {loadProducts && <p className="text-cyan-400 animate-pulse">Memuat produk terlaris...</p>}

                <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-thumb-only">
                    {bestProductsData?.best_sellers?.map((product: any) => (
                        <Card
                            key={product.product_id}
                            className="min-w-[280px] flex flex-col justify-between cursor-pointer hover:neon-border-cyan transition-all bg-zinc-900 border-zinc-800"

                            // LOGIKA HOVER & MOUSE FOLLOW
                            onMouseEnter={() => setSelectedProduct(product.product_id)}
                            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setSelectedProduct(null)}
                        >
                            <CardHeader>
                                <CardTitle className="text-lg text-zinc-200">{product.nama_produk}</CardTitle>
                                <p className="text-xs text-zinc-500 font-mono">{product.product_id}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-end">
                                    <p className="text-zinc-400 text-sm">Terjual: <span className="text-cyan-400 font-bold">{product.total_terjual}</span> unit</p>
                                    <p className="text-zinc-500 text-xs">Rp {(product.harga_satuan * product.total_terjual).toLocaleString('id-ID')}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* CUSTOM FLOATING TOOLTIP (Menggantikan DialogContent) */}
                {selectedProduct && (
                    <div
                        className="fixed z-10 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 text-slate-200 p-4 rounded-xl shadow-2xl w-[350px] pointer-events-none transition-opacity duration-200"
                        style={{
                            // Menambahkan offset +15px agar tooltip tidak menutupi kursor mouse itu sendiri
                            left: typeof window !== "undefined" && mousePos.x + 350 + 20 > window.innerWidth
                                ? `${mousePos.x - 350 - 15}px` // Jika ya, geser kotak ke sebelah KIRI mouse
                                : `${mousePos.x + 15}px`,      // Jika tidak, biarkan di KANAN mouse

                            // LOGIKA SMART POSITIONING (Y-Axis) - Bonus agar tidak terpotong di bawah layar
                            top: typeof window !== "undefined" && mousePos.y + 150 > window.innerHeight
                                ? `${mousePos.y - 150}px` // Geser ke ATAS mouse jika terlalu mepet bawah
                                : `${mousePos.y + 15}px`,
                        }}
                    >
                        <h3 className="font-semibold text-lg neon-text-gradient mb-3">
                            Sering Dibeli Bersamaan {selectedProduct}
                        </h3>

                        <div className="space-y-3">
                            {loadCrossSell ? (
                                <p className="text-zinc-500 animate-pulse text-sm">Menganalisis pola keranjang...</p>
                            ) : crossSellData?.bought_together?.length > 0 ? (
                                crossSellData.bought_together.map((crossItem: any, idx: number) => 
                                    // (selectedProduct === crossItem.produk_1) &&
                                        
                                    (
                                    <div key={idx} className="p-3 rounded-md bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-zinc-200 text-sm">
                                                {crossItem.nama_produk|| crossItem.produk_2 }
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-1">Frekuensi bersamaan: {crossItem.frekuensi_hari_bersamaan} kali</p>
                                        </div>
                                        <Badge variant="outline" className="text-cyan-400 border-cyan-400/50 text-[10px]">Cross-Sell</Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-zinc-500 italic text-sm">Belum ada pola pembelian bersamaan yang kuat untuk produk ini.</p>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* BAGIAN 2: LIST SEGMENTASI PELANGGAN */}
            <section>
                <h2 className="text-xl font-bold mb-4 neon-text-gradient">Segmentasi Pelanggan</h2>

                {/* Handle Loading State */}
                {isLoading && <p className="text-cyan-400 animate-pulse">Mengambil data pelanggan...</p>}

                {/* Handle Error State */}
                {isError && <p className="text-red-500">Terjadi kesalahan saat memuat data.</p>}

                {/* Render Data jika sukses */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segmentData?.data?.map((user: any) => (
                        <Dialog key={user.customer_id}>
                            <DialogTrigger asChild>
                                <Card className="cursor-pointer hover:bg-zinc-800/50 transition-colors bg-zinc-900 border-zinc-800">
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-zinc-200">{user.nama_pelanggan}</p>
                                            <p className="text-sm text-zinc-500">{user.customer_id}</p>
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            (user.segmen == "Pelanggan VIP") ? "text-cyan-400 border-cyan-400/50" :
                                                (user.segmen == "Pelanggan Aktif") ? "text-green-400 border-green-400" :
                                                    (user.segmen == "Berisiko Hilang") ? "text-orange-400 border-orange-400" :
                                                        "text-red-400 border-red-400/50"
                                        )}>
                                            {user.segmen}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            </DialogTrigger>

                            <DialogContent className="bg-zinc-950 border-zinc-800 text-slate-200">
                                <DialogHeader>
                                    <DialogTitle>Strategi Promosi: {user.nama_pelanggan}</DialogTitle>
                                    <p className="text-sm text-zinc-500">Terakhir belanja: {user.terakhir_beli}</p>
                                </DialogHeader>
                                <div className="mt-4 space-y-3">
                                    {user.strategi_promosi.map((strategi: string, index: number) => (
                                        <div key={index} className="p-3 rounded-md bg-zinc-900 border border-zinc-800">
                                            <span className="text-cyan-400 mr-2">✦</span> {strategi}
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            </section>
        </div>
    );
}