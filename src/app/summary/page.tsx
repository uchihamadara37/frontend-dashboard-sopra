"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, TrendingUp, Users, Package, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ============================================================================
// FUNGSI FETCHER: Menggabungkan 3 Endpoint Sekaligus
// ============================================================================
const fetchSummaryData = async () => {
    const [segmentsRes, recsRes] = await Promise.all([
        fetch(`${API_URL}/api/segments`),
        fetch(`${API_URL}/api/best-product`)
    ]);

    const segmentsData = await segmentsRes.json();
    const recsData = await recsRes.json();

    // Ambil data prediksi stok HANYA untuk 5 produk terlaris agar loading sangat cepat
    const topProducts = recsData.best_sellers || [];
    const stockPromises = topProducts.map((p: any) =>
        fetch(`${API_URL}/api/predict-stock?product_id=${p.product_id}`).then(r => r.json()).catch(() => null)
    );
    const stockDataRaw = await Promise.all(stockPromises);
    const stockData = stockDataRaw.filter(s => s && s.status === "success");

    return { segmentsData, recsData, stockData };
};

// ============================================================================
// KOMPONEN UTAMA
// ============================================================================
export default function SummaryPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["executiveSummary"],
        queryFn: fetchSummaryData,
    });

    // Pemrosesan Data untuk UI
    const { pieData, topProduct, vipCount, actionTable } = useMemo(() => {
        if (!data) return { pieData: [], topProduct: null, vipCount: 0, actionTable: [] };

        // 1. Data Segmen untuk Donut Chart
        const ringkasan = data.segmentsData.ringkasan_populasi || {};
        const pieColors = ["#22d3ee", "#3b82f6", "#ec4899", "#f59e0b"]; // Cyan, Blue, Pink, Amber
        const pieFormatted = Object.keys(ringkasan).map((key, index) => ({
            name: key,
            value: ringkasan[key],
            color: pieColors[index % pieColors.length]
        })).filter(item => item.value > 0);

        const countVIP = ringkasan["Pelanggan VIP"] || 0;

        // 2. Produk Bintang (Peringkat 1)
        const bestSeller = data.recsData.best_sellers?.[0] || null;

        // 3. Gabungan Tabel Aksi (Produk + Rekomendasi Stok)
        const tableFormatted = data.recsData.best_sellers?.map((prod: any) => {
            const stockInfo = data.stockData.find((s: any) => s.product_id === prod.product_id);

            // Simulasi sisa stok fisik (Di dunia nyata, ini diambil dari database gudang Anda)
            // Di sini kita asumsikan stok gudang saat ini adalah Prediksi + 50 untuk simulasi UI
            const simulatedCurrentStock = stockInfo ? stockInfo.forecast_permintaan_minggu_depan + 50 : 0;
            const rop = stockInfo?.rekomendasi_reseller["titik_pesan_ulang (reorder_point)"] || 0;

            const isCritical = simulatedCurrentStock <= rop;

            return {
                ...prod,
                forecast: stockInfo?.forecast_permintaan_minggu_depan || "N/A",
                rop: rop,
                currentStock: simulatedCurrentStock,
                status: isCritical ? "Kritis" : "Aman"
            };
        }) || [];

        return { pieData: pieFormatted, topProduct: bestSeller, vipCount: countVIP, actionTable: tableFormatted };
    }, [data]);

    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-cyan-400 gap-4">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="neon-text-gradient font-semibold animate-pulse">Menyusun Executive Summary...</p>
            </div>
        );
    }

    if (isError) return <div className="text-red-500 font-bold p-6">Gagal memuat ringkasan.</div>;

    return (
        <div className="space-y-8 pb-12">
            {/* HEADER */}
            <div>
                <h2 className="text-3xl font-bold neon-text-gradient tracking-tight flex items-center gap-2">
                    <Zap className="w-8 h-8 text-cyan-400" />
                    Executive Insight
                </h2>
                <p className="text-zinc-500 mt-1">Ringkasan performa penjualan, loyalitas, dan status inventaris SOPRA.</p>
            </div>

            {/* HIGHLIGHT CARDS (3 KOLOM) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-20 h-20 text-cyan-400" /></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Produk Unggulan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-100">{topProduct?.nama_produk || "-"}</div>
                        <p className="text-sm text-cyan-400 mt-1 font-mono">{topProduct?.total_terjual} unit terjual</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Users className="w-20 h-20 text-blue-400" /></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Potensi Segmen VIP</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-100">{vipCount} <span className="text-lg text-zinc-500 font-normal">Klien</span></div>
                        <p className="text-sm text-blue-400 mt-1">Siap untuk di-upsell prioritas</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 relative overflow-hidden neon-border-cyan">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Package className="w-20 h-20 text-pink-400" /></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Status Inventaris</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-100">
                            {actionTable.filter((item: { status: string }) => item.status === "Kritis").length} <span className="text-lg text-zinc-500 font-normal">Butuh Restock</span>
                        </div>
                        <p className="text-sm text-pink-400 mt-1">Pada 5 produk top tier</p>
                    </CardContent>
                </Card>
            </div>

            {/* GRID VISUAL & TABEL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* KIRI: DONUT CHART SEGMEN PELANGGAN (1 Kolom di Desktop) */}
                <Card className="bg-zinc-900/60 border-zinc-800 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-zinc-200">Demografi Pelanggan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f1f5f9', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* KANAN: TABEL AKSI REKOMENDASI STOK (2 Kolom di Desktop) */}
                <Card className="bg-zinc-900/60 border-zinc-800 lg:col-span-2 overflow-hidden flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-zinc-200">Action Plan: Top 5 Produk</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <Table>
                            <TableHeader className="bg-zinc-950/80">
                                <TableRow className="border-zinc-800 hover:bg-transparent">
                                    <TableHead className="text-zinc-400">Produk</TableHead>
                                    <TableHead className="text-center text-zinc-400">Pekan Depan</TableHead>
                                    <TableHead className="text-center text-zinc-400">Batas ROP</TableHead>
                                    <TableHead className="text-right text-zinc-400 pr-6">Status Rekomendasi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {actionTable.map((row: any) => (
                                    <TableRow key={row.product_id} className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                        <TableCell className="font-medium text-zinc-200">
                                            {row.nama_produk}
                                            <div className="text-xs text-zinc-600 font-mono mt-0.5">{row.product_id}</div>
                                        </TableCell>
                                        <TableCell className="text-center text-zinc-300">{row.forecast} unit</TableCell>
                                        <TableCell className="text-center text-zinc-500">{row.rop} unit</TableCell>
                                        <TableCell className="text-right pr-6">
                                            {row.status === "Aman" ? (
                                                <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-950/30 gap-1.5 py-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Aman
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-rose-500/50 text-rose-400 bg-rose-950/30 gap-1.5 py-1">
                                                    <AlertTriangle className="w-3 h-3 animate-pulse" /> Segera Restock
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}