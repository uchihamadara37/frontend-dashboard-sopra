"use client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

interface Message {
    id: string;
    role: "user" | "ai";
    content: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const sendChatMessage = async (message: string) => {
    const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
    });

    if (!res.ok) {
        throw new Error("Gagal mendapatkan respons dari AI");
    }

    return res.json();
};

export default function ChatPage() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "ai",
            content: "Halo! Saya asisten virtual SOPRA Solusi-Pack. Ada yang bisa saya bantu hari ini?",
        },
    ]);

    // Ref untuk fitur auto-scroll ke bawah saat ada pesan baru
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Inisialisasi Mutasi dari React Query
    const chatMutation = useMutation({
        mutationFn: sendChatMessage,
        onSuccess: (data) => {
            // Tambahkan balasan dari AI ke dalam riwayat chat
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: "ai",
                    content: data.reply,
                },
            ]);
        },
        onError: (error: any) => {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: "ai",
                    content: `⚠️ Error: ${error.message}. Gagal terhubung ke server Flask.`,
                },
            ]);
        },
    });

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || chatMutation.isPending) return;

        const userMessage = input.trim();
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                role: "user",
                content: userMessage,
            },
        ]);

        setInput("");
        chatMutation.mutate(userMessage);
    };

    return (
        <div className="h-[85vh] flex flex-col relative">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold neon-text-gradient">SOPRA Assistant</h2>
                <p className="text-zinc-500 mt-2">Tanyakan apa saja seputar data dan produk SOPRA</p>
            </div>

            {/* Area Tampilan Chat */}
            <Card className="flex-1 bg-zinc-800/40 border-zinc-800 backdrop-blur-sm py-4 pl-4 pr-1 overflow-hidden mb-16 lg:mb-24 flex flex-col">
                <ScrollArea className="h-full w-full pr-4">
                    <div className="space-y-4 flex flex-col">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "self-end flex-row-reverse" : "self-start"
                                    }`}
                            >
                                {/* Avatar Icon */}
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${msg.role === "user"
                                        ? "bg-zinc-800 border-zinc-700 text-cyan-400"
                                        : "bg-cyan-950/50 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                                        }`}
                                >
                                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>

                                {/* Bubble Chat */}
                                <div
                                    className={`p-3.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-200 border border-zinc-700/50 rounded-tr-none"
                                        : "bg-zinc-950/60 border border-zinc-800/80 text-zinc-300 rounded-tl-none"
                                        }`}
                                >
                                    {msg.role === "user" ? (
                                        // Teks user dibiarkan mentah biasa
                                        msg.content
                                    ) : (
                                        // Teks AI dibungkus dengan ReactMarkdown
                                        <ReactMarkdown
                                            components={{
                                                // Styling kustom khusus untuk mengembalikan gaya bawaan HTML 
                                                // yang biasanya di-reset oleh Tailwind
                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-semibold text-cyan-300" {...props} />,
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Indikator Loading saat AI Sedang Berpikir */}
                        {chatMutation.isPending && (
                            <div className="flex gap-3 self-start max-w-[80%] animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                                <div className="p-3.5 rounded-2xl text-sm bg-zinc-950/40 border border-zinc-800 text-zinc-500 italic rounded-tl-none">
                                    SOPRA AI sedang merumuskan jawaban...
                                </div>
                            </div>
                        )}

                        {/* Titik bantu untuk auto-scroll */}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </Card>

            {/* Kotak Input Floating */}
            <div className="absolute bottom-0 w-full px-4 md:px-0 left-1/2 -translate-x-1/2">
                <form onSubmit={handleSendMessage} className="flex gap-2 p-2 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-full neon-border-cyan max-w-3xl mx-auto">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={chatMutation.isPending}
                        className="flex-1 bg-transparent border-none focus-visible:ring-0 text-zinc-200 placeholder-zinc-500 pl-4 rounded-2xl"
                        placeholder="Tanyakan mengenai produk dan layanan SOPRA di sini..."
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || chatMutation.isPending}
                        className="rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white shrink-0 transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}