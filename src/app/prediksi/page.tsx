"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL;


const fetchDashboardData = async () => {
    // Ambil data produk dan transaksi
    const [resProd, resTrans] = await Promise.all([
        fetch(`${API_URL}/api/products`),
        fetch(`${API_URL}/api/transactions`)
    ]);

    const dataProd = await resProd.json();
    const dataTrans = await resTrans.json();
    const products = dataProd.data || [];
    const transactions = dataTrans.data || [];

    // Ambil data prediksi & inventory untuk setiap produk secara paralel
    const predictionPromises = products.map((p: any) =>
        fetch(`${API_URL}/api/predict-stock?product_id=${p.product_id}`)
            .then(r => r.json())
            .catch(() => null) // Abaikan jika model belum di-training
    );

    const predictionsRaw = await Promise.all(predictionPromises);
    const predictions = predictionsRaw.filter(p => p && p.status === "success");
    console.log("Predictions fetched:", predictions); // Debugging: log hasil prediksi

    return { products, transactions, predictions };
};



export default function PrediksiPage() {
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["prediksiData"],
        queryFn: fetchDashboardData,
    });


    const { chart1Data, chart2Data, tableData, colors } = useMemo(() => {
        if (!data) return { chart1Data: [], chart2Data: [], tableData: [], colors: {} };

        // Warna dinamis neon untuk garis grafik
        const palette = ["#22d3ee", "#3b82f6", "#a855f7", "#ec4899", "#10b981", "#f59e0b"];
        const colorsMap: Record<string, string> = {};
        data.products.forEach((p: any, i: number) => {
            colorsMap[p.product_id] = palette[i % palette.length];
        });

        // --- DATA CHART 1: Tren Historis Keseluruhan ---
        // Mengelompokkan transaksi per tanggal, lalu per produk
        const groupedByDate: Record<string, any> = {};
        data.transactions.forEach((t: any) => {
            // Jika tanggal belum ada di dictionary, buat baru
            if (!groupedByDate[t.tanggal]) {
                groupedByDate[t.tanggal] = { tanggal: t.tanggal };

                // KUNCI PERBAIKAN 1: Inisialisasi SEMUA produk dengan angka 0 di hari tersebut
                data.products.forEach((p: any) => {
                    groupedByDate[t.tanggal][p.product_id] = 0;
                });
            }
            // Tambahkan qty ke produk yang laku
            groupedByDate[t.tanggal][t.product_id] += t.qty;
        });
        // Urutkan berdasarkan tanggal (asumsi format YYYY-MM-DD)
        const processedChart1 = Object.values(groupedByDate).sort((a: any, b: any) =>
            new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
        );

        // --- DATA CHART 2: Lag 7 Hari + Prediksi ---
        // Mensimulasikan deret waktu singkat untuk Chart 2 (H-7 s/d Forecast)
        // Di skenario nyata riwayat H-7 didapat dari backend, di sini kita format representasinya
        const uniqueDates = [...new Set(data.transactions.map((t: any) => t.tanggal))].sort();
        const last7Dates = uniqueDates.slice(-7); // Ambil 7 hari terakhir saja
        const processedChart2: any[] = [];
        last7Dates.forEach((dateStr, index) => {
            // Hitung nama hari dari H-7 s/d H-1 (menyesuaikan jumlah data yang ada)
            const countdown = last7Dates.length - index;
            const dayLabel = `H-${countdown-1}`;
            // Simpan tanggal asli untuk dimunculkan di Tooltip nanti (opsional tapi bagus)
            const dayData: any = { day: dayLabel, tanggalAsli: dateStr as string };

            // Inisialisasi 0 untuk semua produk
            data.products.forEach((p: any) => {
                dayData[p.product_id] = 0;
            });

            // Isi dengan data qty riil pada tanggal tersebut
            data.transactions.forEach((t: any) => {
                if (t.tanggal === dateStr) {
                    dayData[t.product_id] += t.qty;
                }
            });

            processedChart2.push(dayData);
        });

        // Menambahkan titik Prediksi (Minggu Depan) dari data Flask
        // const forecastData: any = { day: "Prediksi" };
        // data.predictions.forEach((pred: any) => {
        //     forecastData[pred.product_id] = pred.forecast_permintaan_minggu_depan;
        // });
        // processedChart2.push(forecastData);

        for (let i = 0; i < 7; i++) {
            const futureDayData: any = {
                day: `H+${i+1}`,
                tanggalAsli: `Prediksi Hari ke-${i+1}`
            };

            data.products.forEach((p: any) => {
                // Cari hasil prediksi untuk produk yang bersangkutan
                const predInfo = data.predictions.find((pred: any) => pred.product_id === p.product_id);

                // Ekstrak indeks array sesuai hari ke-(i)
                if (predInfo && predInfo.forecast_harian_minggu_depan) {
                    futureDayData[p.product_id] = predInfo.forecast_harian_minggu_depan[i];
                } else {
                    futureDayData[p.product_id] = 0;
                }
            });

            processedChart2.push(futureDayData);
        }

        // --- DATA TABEL INVENTORY ---
        const processedTable = data.predictions.map((pred: any) => {
            const prodInfo = data.products.find((p: any) => p.product_id === pred.product_id);
            return {
                id: pred.product_id,
                nama: prodInfo?.nama_produk || pred.product_id,
                // Cari total terjual dari transaksi
                total_terjual: data.transactions
                    .filter((t: any) => t.product_id === pred.product_id)
                    .reduce((sum: number, t: any) => sum + t.qty, 0),
                safety_stock: pred.rekomendasi_reseller["stok_minimum_aman (safety_stock)"],
                reorder_point: pred.rekomendasi_reseller["titik_pesan_ulang (reorder_point)"],
                forecast_total: pred.forecast_total_minggu_depan
            };
        });

        return {
            chart1Data: processedChart1,
            chart2Data: processedChart2,
            tableData: processedTable,
            colors: colorsMap
        };
    }, [data]);


    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-cyan-400 gap-4">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="neon-text-gradient font-semibold animate-pulse">Menghitung model prediktif & membaca data historis...</p>
            </div>
        );
    }

    if (isError) return <div className="text-red-500 font-bold p-6">Gagal memuat data prediksi. Pastikan server Flask berjalan.</div>;

    return (
        <div className="space-y-8 pb-12">
            {/* HEADER & FILTER BUTTONS */}
            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold neon-text-gradient tracking-tight">Demand Forecasting & Inventory</h2>

                {/* Deretan Tombol Filter Produk */}
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant={selectedProduct === null ? "default" : "outline"}
                        className={selectedProduct === null ? "bg-cyan-600 hover:bg-cyan-500 text-white" : "border-zinc-700 text-zinc-400 hover:text-cyan-400"}
                        onClick={() => setSelectedProduct(null)}
                    >
                        Semua Produk
                    </Button>
                    {data?.products.map((prod: any) => (
                        <Button
                            key={prod.product_id}
                            variant={selectedProduct === prod.product_id ? "default" : "outline"}
                            className={selectedProduct === prod.product_id
                                ? "bg-zinc-800 text-white border border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                                : "border-zinc-700 text-zinc-400 hover:text-cyan-400 hover:border-cyan-900"}
                            onClick={() => setSelectedProduct(prod.product_id)}
                        >
                            {prod.nama_produk}
                        </Button>
                    ))}
                </div>
            </div>

            {/* GRAFIK 1: TREN HISTORIS KESELURUHAN */}
            <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-zinc-200">Tren Penjualan Historis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chart1Data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                {/* <XAxis dataKey="tanggal" stroke="#71717a" fontSize={12} tickMargin={10} /> */}
                                <XAxis
                                    dataKey="tanggal"
                                    stroke="#71717a"
                                    fontSize={12}
                                    tickMargin={10}
                                    tickFormatter={(val) => {
                                        // Mengubah '2025-08-17' menjadi '17 Ags 2025' agar muat di layar
                                        const date = new Date(val);
                                        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                                    }}
                                />
                                <YAxis stroke="#71717a" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f1f5f9', borderRadius: '8px' }}
                                    itemStyle={{ color: '#22d3ee' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                {data?.products.map((prod: any) => (
                                    <Line
                                        key={prod.product_id}
                                        type="monotone"
                                        dataKey={prod.product_id}
                                        name={prod.nama_produk}
                                        stroke={colors[prod.product_id]}
                                        strokeWidth={selectedProduct === prod.product_id ? 4 : 2}
                                        // Logika Opacity: Redupkan garis lain jika ada produk yang di-klik
                                        strokeOpacity={selectedProduct === null || selectedProduct === prod.product_id ? 1 : 0.15}
                                        dot={false}
                                        activeDot={{ r: 6, fill: colors[prod.product_id] }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* GRAFIK 2: FOKUS PREDIKSI (LAG 7 HARI + 1 PEKAN DEPAN) */}
            <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-zinc-200">Proyeksi Stock 7 Hari</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chart2Data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickMargin={10} />
                                <YAxis stroke="#71717a" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                />
                                {data?.products.map((prod: any) => (
                                    <Line
                                        key={`pred-${prod.product_id}`}
                                        type="monotone"
                                        dataKey={prod.product_id}
                                        name={prod.nama_produk}
                                        stroke={colors[prod.product_id]}
                                        strokeWidth={selectedProduct === prod.product_id ? 4 : 2}
                                        strokeOpacity={selectedProduct === null || selectedProduct === prod.product_id ? 1 : 0.15}
                                        // Mengubah bentuk garis menjadi putus-putus untuk menandakan ini data "Lag & Proyeksi"
                                        strokeDasharray={selectedProduct === null || selectedProduct === prod.product_id ? "5 5" : "0"}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* TABEL INVENTORY & REORDER POINT */}
            <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-zinc-200">Rekomendasi Operasional Reseller</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-950/50">
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                <TableHead className="text-zinc-400 w-[300px]">Nama Produk</TableHead>
                                <TableHead className="text-zinc-400 text-center">Total Terjual (Historis)</TableHead>
                                <TableHead className="text-cyan-400 text-center font-semibold">Safety Stock (Min)</TableHead>
                                <TableHead className="text-blue-400 text-center font-semibold">Reorder Point (ROP)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tableData.map((row: any) => (
                                <TableRow
                                    key={row.id}
                                    className={`border-zinc-800 transition-colors ${selectedProduct === row.id ? 'bg-cyan-950/20' : 'hover:bg-zinc-800/50'}`}
                                >
                                    <TableCell className="font-medium text-zinc-200">
                                        {row.nama}
                                        <div className="text-xs text-zinc-500 font-mono mt-1">{row.id}</div>
                                    </TableCell>
                                    <TableCell className="text-center text-zinc-300">{row.total_terjual} unit</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="border-cyan-500/50 text-cyan-300 bg-cyan-950/30">
                                            {row.safety_stock} unit
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="border-blue-500/50 text-blue-300 bg-blue-950/30">
                                            {row.reorder_point} unit
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}