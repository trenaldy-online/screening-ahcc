import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import { MessageSquare, Send, User, Bot, Activity, Phone, ArrowRight, ShieldCheck, AlertCircle, Brain, Camera, XCircle, Download, QrCode, Sparkles, Clock } from "lucide-react";
// @ts-ignore
import html2pdf from "html2pdf.js";
import QRCode from "react-qr-code";
import { AppStep, UserData, ChatMessage } from "./types";
import { Button } from "./components/Button";

// =====================================================================
// COLOR PALETTE IDENTITY (AHCC) - Diterapkan menggunakan Arbitrary Values
// Primary:   #2B8E45 (Hijau Hutan - Tombol, Header)
// Secondary: #54595F (Abu Tua - Teks Judul)
// Text:      #7A7A7A (Abu Sedang - Teks Body)
// Accent:    #61CE70 (Hijau Muda Cerah - Sorotan, Ikon Aktif)
// =====================================================================

// ==========================================
// KOMPONEN 1: HALAMAN HASIL / REPORT DINAMIS
// ==========================================
const ReportPage: React.FC = () => {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // URL Dinamis Saat Ini
  const reportUrl = window.location.origin + `/report/${id}`;

  useEffect(() => {
    fetch(`https://dashboardhana.rumahsakitkankersurabaya.com/api/report/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setReport(data.report_data);
          setUser(data.user_data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleDownloadPDF = () => {
    const element = document.getElementById('pdf-content');
    const opt = {
      margin: 0.5,
      filename: `Resume_Medis_${user?.name || 'AHCC'}.pdf`,
      image: { type: 'jpeg' as 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in' as 'in', format: 'a4' as 'a4', orientation: 'portrait' as 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#7A7A7A]">Memuat Laporan Medis...</div>;
  if (!report || !user) return <div className="min-h-screen flex items-center justify-center text-rose-500 font-bold">Laporan Tidak Ditemukan atau Link Kadaluarsa.</div>;

  const isHigh = report.risk_level === "Tinggi";
  const isMedium = report.risk_level === "Sedang";

  const ageNum = parseInt(user.age) || 0;
  let sebutan = "";
  if (ageNum < 18) { sebutan = "Adik"; } 
  else if (ageNum >= 18 && ageNum <= 30) { sebutan = "Kakak"; } 
  else { sebutan = user.gender === "Perempuan" ? "Ibu" : "Bapak"; }

  const waText = `Halo Anggi (Patient Advisor AHCC), \n\nSaya ${sebutan} *${user.name}*, usia *${user.age} tahun*. Saya baru saja melakukan skrining awal dengan *"tanya H.A.N.A"*.\n\nBerikut adalah hasil skrining saya:\n\n*SUMMARY KONDISI:*\n${report.summary}\n\n*ANALISA KLINIS AI:*\n${report.anamnesis_reasoning}\n\n*SUSPEK (KECURIGAAN AI):*\n${report.suspected_conditions?.join(", ") || "-"}\n\n*LINK REKAM MEDIS:*\n${reportUrl}\n\nBerdasarkan hasil analisa dari AI tersebut, mohon saran dan arahannya ya. Langkah medis apa yang sebaiknya saya lakukan selanjutnya?\n\nTerima kasih banyak.`;
  const encodedWa = encodeURIComponent(waText);

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-24 font-sans pt-8">
      <div className="max-w-md mx-auto p-4 space-y-4">
        
        <div className="flex justify-end mb-4">
          <button onClick={handleDownloadPDF} className="bg-[#54595F] hover:bg-[#43474d] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all">
            <Download className="w-4 h-4" /> Simpan PDF
          </button>
        </div>

        <div id="pdf-content" className="space-y-4 pb-4 bg-[#F7F8FA] p-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-[#2B8E45]/10 p-3 rounded-full text-[#2B8E45]"><User className="w-8 h-8"/></div>
            <div>
              <h2 className="font-bold text-[#54595F] text-lg leading-tight">{user.name}</h2>
              <p className="text-sm text-[#7A7A7A]">{user.age} Tahun • {user.gender}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${isHigh ? "bg-rose-500" : isMedium ? "bg-amber-500" : "bg-[#61CE70]"}`}></div>
            <p className="text-[#7A7A7A] text-sm font-medium mb-4">Indeks Risiko Klinis</p>
            <div className={`w-32 h-32 mx-auto rounded-full border-8 flex items-center justify-center shadow-inner ${isHigh ? "border-rose-200 bg-rose-50 text-rose-600" : isMedium ? "border-amber-200 bg-amber-50 text-amber-500" : "border-[#61CE70]/30 bg-[#61CE70]/10 text-[#2B8E45]"}`}>
              <span className="text-5xl font-black leading-none text-center pb-1">{report.risk_score}</span>
            </div>
            <p className="mt-6 text-[#7A7A7A] text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">{report.summary}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
            <Brain className="absolute -right-4 -top-4 w-24 h-24 text-slate-100 opacity-50" />
            <h3 className="font-bold mb-3 flex items-center gap-2 relative z-10 text-[#54595F]"><Brain className="w-5 h-5 text-[#2B8E45]" /> Analisis Klinis AI</h3>
            <div className="text-sm text-[#7A7A7A] text-justify bg-slate-50 p-4 rounded-xl border border-slate-100 relative z-10 whitespace-pre-line leading-relaxed">
              {report.anamnesis_reasoning}
            </div>
          </div>

          {report.suspected_conditions && report.suspected_conditions.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 relative overflow-hidden">
              <Activity className="absolute -right-4 -top-4 w-24 h-24 text-rose-50 opacity-50" />
              <h3 className="font-bold mb-3 flex items-center gap-2 relative z-10 text-rose-700">
                <Activity className="w-5 h-5 text-rose-500" /> Kecurigaan Diagnosa (Suspek)
              </h3>
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 relative z-10">
                <ul className="list-disc list-inside text-sm text-rose-700 font-semibold space-y-1">
                  {report.suspected_conditions.map((suspek: string, idx: number) => (
                    <li key={idx}>{suspek}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {report.recommendations && report.recommendations.length > 0 && (
            <div className="bg-[#2B8E45]/5 rounded-2xl p-5 border border-[#2B8E45]/20 shadow-sm relative overflow-hidden">
              <h3 className="font-bold text-[#2B8E45] mb-3 flex items-center gap-2 relative z-10">
                <svg className="w-5 h-5 text-[#61CE70]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Saran & Tindak Lanjut Medis
              </h3>
              <ul className="space-y-2 relative z-10">
                {report.recommendations.map((saran: string, index: number) => (
                  <li key={index} className="flex items-start text-[#54595F] text-sm md:text-base font-medium">
                    <span className="mr-2 mt-0.5 font-bold text-[#61CE70]">•</span>
                    <span className="leading-relaxed">{saran}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center">
            <h3 className="font-bold text-[#54595F] mb-2 flex items-center gap-2"><QrCode className="w-5 h-5 text-[#7A7A7A]"/> Akses Laporan Online</h3>
            <p className="text-xs text-[#7A7A7A] mb-4 max-w-xs mx-auto">Scan QR Code ini untuk membuka dokumen rekam medis digital ini kapan saja.</p>
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 inline-block">
              <QRCode value={reportUrl} size={140} fgColor="#2B8E45" />
            </div>
            <p className="text-[10px] text-[#2B8E45] mt-3 break-all font-mono bg-[#2B8E45]/10 px-2 py-1 rounded inline-block">{reportUrl}</p>
          </div>

          <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm flex items-start text-left">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm text-amber-800 leading-relaxed text-justify">
              <strong>Disclaimer:</strong> Analisis ini dihasilkan oleh kecerdasan buatan (AI) dan tidak menggantikan diagnosis medis profesional. Pemeriksaan fisik dan penunjang oleh dokter spesialis mutlak diperlukan.
            </p>
          </div>
        </div>

        <div className="mt-8 bg-[#2B8E45] p-8 rounded-2xl shadow-xl text-center text-white relative overflow-hidden">
          <ShieldCheck className="absolute -right-6 -bottom-6 w-32 h-32 text-[#1a5c2e] opacity-30" />
          <h3 className="text-xl md:text-2xl font-bold mb-3 relative z-10">
            Jangan Ambil Risiko dengan Kesehatan Anda
          </h3>
          <p className="text-white/90 text-sm mb-8 relative z-10 max-w-md mx-auto leading-relaxed">
            Konsultasikan keluhan Anda bersama ahlinya. Patient Advisor kami siap membantu mengatur jadwal telekonsultasi Anda hari ini juga.
          </p>
          <button 
            onClick={() => window.open(`https://wa.me/62822296600?text=${encodedWa}`, "_blank")}
            className="relative z-10 w-full md:w-auto bg-transparent border-2 border-[#61CE70] hover:bg-[#61CE70] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 mx-auto group"
          >
            <Phone className="w-5 h-5 text-[#61CE70] group-hover:text-white transition-colors" />
            Kirim Resume ke Patient Advisor (Anggi)
          </button>
          <p className="text-[10px] text-white/70 mt-5 relative z-10 opacity-80">
            *Klik tombol di atas untuk terhubung langsung ke WhatsApp Resmi AHCC
          </p>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// KOMPONEN 2: ALUR CHAT & SCREENING AWAL
// ==========================================
const ChatFlow: React.FC = () => {
  const navigate = useNavigate(); 
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.WELCOME);
  const [userData, setUserData] = useState<UserData>({ name: "", age: "", gender: "", whatsapp: "", email: "", chiefComplaint: "" });
  const [isHumanVerified, setIsHumanVerified] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [rejectReason, setRejectReason] = useState("");
  const MAX_TURNS = 7;
  const [isLocked, setIsLocked] = useState(false);
  
  // --- STATE BARU UNTUK FITUR DYNAMIC FORM ---
  const [formMode, setFormMode] = useState<'strict' | 'relaxed'>('strict');
  const [showHookForm, setShowHookForm] = useState(false);
  const [hookData, setHookData] = useState({ whatsapp: "", email: "" });
  const [pendingMessage, setPendingMessage] = useState<{text: string, images: string[]} | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); 

  // --- MENGAMBIL MODE FORM DARI LARAVEL SAAT WEB DIBUKA ---
  useEffect(() => {
    fetch("https://dashboardhana.rumahsakitkankersurabaya.com/api/settings/form-mode")
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.mode) {
          setFormMode(data.mode);
        }
      })
      .catch(err => console.error("Gagal mengambil mode setting:", err));
  }, []);

  useEffect(() => {
    const lockTime = localStorage.getItem('ahcc_screening_lock');
    if (lockTime) {
      const lockDate = new Date(lockTime);
      const now = new Date();
      const diffHours = Math.abs(now.getTime() - lockDate.getTime()) / 36e5;
      if (diffHours < 48) { setIsLocked(true); } else { localStorage.removeItem('ahcc_screening_lock'); }
    }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  useEffect(() => {
    if (!isLoading && currentStep === AppStep.CHAT) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isLoading, currentStep]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX_SIZE = 800;
          if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } 
          else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (selectedImages.length + files.length > 3) { alert("Maksimal 3 gambar."); return; }
    const compressedImages = await Promise.all(files.map(compressImage));
    setSelectedImages(prev => [...prev, ...compressedImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- MENGIRIM PESAN KE LARAVEL (Ditambah overrideUserData) ---
  const sendChatToLaravel = async (messageText: string, imagesArray: string[] = [], isInitial: boolean = false, overrideUserData?: UserData) => {
    setIsLoading(true);
    const currentTurn = isInitial ? 1 : turnCount + 1;
    setTurnCount(currentTurn);
    const historyToSend = chatHistory.map(chat => ({ role: chat.role, text: chat.text, images: chat.images }));
    historyToSend.push({ role: 'user', text: messageText, images: imagesArray.length > 0 ? imagesArray : undefined });

    const activeUserData = overrideUserData || userData;

    try {
      const response = await fetch("https://dashboardhana.rumahsakitkankersurabaya.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ userData: activeUserData, chatHistory: historyToSend, isFinalTurn: currentTurn >= MAX_TURNS }),
      });

      if (response.status === 429) {
        const errData = await response.json();
        alert(errData.message || "Sesi dibatasi.");
        localStorage.setItem('ahcc_screening_lock', new Date().toISOString());
        setIsLocked(true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) throw new Error("Gagal terhubung ke server");
      const result = await response.json();

      if (result.status === "success" && result.data) {
        const aiData = result.data;
        if (aiData.type === "rejected") {
          setRejectReason(aiData.message); setCurrentStep(AppStep.REJECTED); return;
        }
        if (aiData.type === "ask_image" || aiData.type === "chat") {
          setChatHistory(prev => [...prev, { id: Date.now().toString(), role: "ai", text: aiData.message }]);
        }
        if (aiData.type === "final_report" && result.report_id) {
          localStorage.setItem('ahcc_screening_lock', new Date().toISOString());
          setTimeout(() => navigate(`/report/${result.report_id}`), 1500);
        }
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { id: Date.now().toString(), role: "ai", text: "Terjadi gangguan jaringan." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // --- LOGIKA CEGATAN (HOOK) SAAT MENEKAN TOMBOL SEND ---
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && selectedImages.length === 0) || isLoading) return;
    
    const userText = inputText; 
    const userImages = [...selectedImages];
    const nextTurn = turnCount + 1;
    
    // THE HOOK: Jika mode santai, WA belum ada, dan ini adalah Giliran ke-4
    if (formMode === 'relaxed' && nextTurn === 4 && (!userData.whatsapp || !userData.email)) {
        setPendingMessage({ text: userText, images: userImages });
        setShowHookForm(true);
        return; 
    }

    setInputText(""); setSelectedImages([]); 
    if (textareaRef.current) textareaRef.current.style.height = '50px';
    setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText, images: userImages.length > 0 ? userImages : undefined }]);
    
    await sendChatToLaravel(userText, userImages, false);
  };

  // --- KETIKA PASIEN MENSUBMIT FORM POP-UP DI TENGAH CHAT ---
  const handleHookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const waRegex = /^(08|628|\+628)[0-9]{7,12}$/;
    if (!waRegex.test(hookData.whatsapp)) { alert("⚠️ Nomor WhatsApp tidak valid."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(hookData.email)) { alert("⚠️ Format alamat email tidak valid."); return; }
    
    const updatedUserData = { ...userData, whatsapp: hookData.whatsapp, email: hookData.email };
    setUserData(updatedUserData);
    setShowHookForm(false);
    
    if (pendingMessage) {
        setInputText(""); setSelectedImages([]); 
        if (textareaRef.current) textareaRef.current.style.height = '50px';
        setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'user', text: pendingMessage.text, images: pendingMessage.images.length > 0 ? pendingMessage.images : undefined }]);
        
        await sendChatToLaravel(pendingMessage.text, pendingMessage.images, false, updatedUserData);
        setPendingMessage(null);
    }
  };

  // --- LOGIKA VALIDASI AWAL (DINAMIS) ---
  const handleValidationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameRegex = /^[a-zA-Z\s\.\'\-]{3,}$/;
    if (!nameRegex.test(userData.name)) { alert("⚠️ Nama tidak valid (minimal 3 huruf)."); return; }
    
    if (formMode === 'strict') {
      const waRegex = /^(08|628|\+628)[0-9]{7,12}$/;
      if (!waRegex.test(userData.whatsapp)) { alert("⚠️ Nomor WhatsApp tidak valid."); return; }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) { alert("⚠️ Format alamat email tidak valid."); return; }
    }

    if (!isHumanVerified) { alert("⚠️ Mohon centang verifikasi keamanan."); return; }
    setCurrentStep(AppStep.CHAT);
    await sendChatToLaravel("Keluhan awal saya: " + userData.chiefComplaint, [], true);
  };

  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
        <div className="bg-white p-8 sm:p-10 flex flex-col items-center justify-center text-center rounded-[2rem] shadow-xl max-w-md border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#2B8E45]"></div>
          <div className="bg-[#2B8E45]/10 p-4 rounded-full mb-6"><ShieldCheck className="w-16 h-16 text-[#2B8E45]" /></div>
          <h2 className="text-2xl font-black text-[#54595F] mb-3 tracking-tight">Sesi Dibatasi</h2>
          <p className="text-[#7A7A7A] leading-relaxed mb-8 text-sm sm:text-base">
            Terima kasih! Hasil skrining Anda sebelumnya sedang dalam tinjauan sistem kami. Anda dapat menggunakan AI ini kembali dalam <strong>48 jam</strong> ke depan.
          </p>
          <div className="bg-slate-50 border border-slate-200 text-[#54595F] p-5 rounded-2xl w-full text-sm font-medium">
            <p className="mb-3">Butuh bantuan darurat atau informasi lebih lanjut?</p>
            <a href="https://wa.me/62822296600?text=Halo%20AHCC,%20saya%20membutuhkan%20bantuan%20segera%20terkait%20skrining." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 px-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              <MessageSquare className="w-5 h-5" /> Chat WhatsApp AHCC
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentStep === AppStep.WELCOME && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gradient-to-b from-[#2B8E45]/10 to-slate-50 font-sans">
          
          <div className="flex flex-col items-center justify-center mb-6 mt-4 text-center">
            <svg className="w-16 h-16 mb-2 drop-shadow-md hover:scale-105 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="#2B8E45"/>
              <path d="M12 5.5L13.1 8.9L16.5 10L13.1 11.1L12 14.5L10.9 11.1L7.5 10L10.9 8.9L12 5.5Z" fill="white"/>
            </svg>
            <span className="text-[1.35rem] font-bold text-[#2B8E45] tracking-wide leading-tight">Tanya H.A.N.A</span>
            <span className="text-xs font-medium text-[#7A7A7A] mt-1 tracking-wide">(Health Assessment & Navigation AHCC)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#54595F] mb-3 tracking-tight">Punya Keluhan Kesehatan?</h1>
          <p className="text-[#7A7A7A] text-sm sm:text-base mb-8 max-w-[300px] leading-relaxed">
            Jangan abaikan gejala Anda. H.A.N.A siap mendengarkan dan memberikan <strong className="text-[#2B8E45] font-bold">analisis awal</strong> dalam hitungan detik.
          </p>

          <div className="w-full max-w-sm space-y-3 mb-8 text-left">
            <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 hover:border-[#61CE70]/50 transition-colors">
              <div className="bg-[#61CE70]/10 p-2.5 rounded-lg text-[#2B8E45] shrink-0"><Clock className="w-5 h-5"/></div>
              <div>
                <p className="text-sm font-bold text-[#54595F]">Respon AI Instan 24/7</p>
                <p className="text-xs text-[#7A7A7A] mt-0.5">Tidak perlu antre menunggu jawaban</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 hover:border-[#61CE70]/50 transition-colors">
              <div className="bg-[#2B8E45]/10 p-2.5 rounded-lg text-[#2B8E45] shrink-0"><ShieldCheck className="w-5 h-5"/></div>
              <div>
                <p className="text-sm font-bold text-[#54595F]">100% Rahasia & Aman</p>
                <p className="text-xs text-[#7A7A7A] mt-0.5">Data keluhan Anda dilindungi</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 hover:border-[#61CE70]/50 transition-colors">
              <div className="bg-rose-100 p-2.5 rounded-lg text-rose-600 shrink-0"><Activity className="w-5 h-5"/></div>
              <div>
                <p className="text-sm font-bold text-[#54595F]">Rekomendasi Terarah</p>
                <p className="text-xs text-[#7A7A7A] mt-0.5">Evaluasi berdasarkan standar klinis</p>
              </div>
            </div>
          </div>

          <Button onClick={() => setCurrentStep(AppStep.VALIDATION_FORM)} className="w-full max-w-sm text-lg py-4 shadow-lg shadow-[#2B8E45]/30 bg-[#2B8E45] hover:bg-[#237a3a] text-white hover:-translate-y-1 transition-all flex justify-center items-center gap-2 group">
            Cek Gejala Sekarang <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="mt-6 text-[11px] text-[#7A7A7A] max-w-xs leading-relaxed">
            Layanan gratis ini dikembangkan & didukung oleh tim spesialis <strong className="font-semibold text-[#54595F]">Adi Husada Cancer Center (AHCC)</strong>.
          </p>
        </div>
      )}

      {currentStep === AppStep.VALIDATION_FORM && (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-slate-100">
            <h2 className="text-2xl font-bold mb-6 text-[#54595F]">Profil & Keluhan Awal</h2>
            <form onSubmit={handleValidationSubmit} className="space-y-4">
              <input type="text" required placeholder="Nama Lengkap" value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#61CE70] focus:border-[#61CE70] transition-all text-[#54595F]" />
              
              <div className="flex gap-4">
                <input type="number" required placeholder="Usia" value={userData.age} onChange={e => setUserData({ ...userData, age: e.target.value })} className="w-1/3 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#61CE70] focus:border-[#61CE70] transition-all text-[#54595F]" />
                <div className="w-2/3 relative">
                  <select required value={userData.gender} onChange={e => setUserData({ ...userData, gender: e.target.value as any })} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#61CE70] focus:border-[#61CE70] transition-all bg-white appearance-none cursor-pointer text-[#54595F]">
                    <option value="" disabled hidden>Jenis Kelamin...</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#7A7A7A]">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                  </div>
                </div>
              </div>

              {formMode === 'strict' && (
                <>
                  <input type="tel" required placeholder="No WhatsApp" value={userData.whatsapp} onChange={e => setUserData({ ...userData, whatsapp: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#61CE70] focus:border-[#61CE70] transition-all text-[#54595F]" />
                  <input type="email" required placeholder="Alamat Email Valid" value={userData.email} onChange={e => setUserData({ ...userData, email: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#61CE70] focus:border-[#61CE70] transition-all text-[#54595F]" />
                </>
              )}

              <textarea required placeholder="Keluhan utama..." value={userData.chiefComplaint} onChange={e => setUserData({ ...userData, chiefComplaint: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#61CE70] focus:border-[#61CE70] transition-all h-24 resize-none text-[#54595F]" />
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between mt-6">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={isHumanVerified} onChange={e => setIsHumanVerified(e.target.checked)} className="w-5 h-5 accent-[#2B8E45] cursor-pointer"/>
                  <span className="text-[#54595F] font-medium cursor-pointer" onClick={() => setIsHumanVerified(!isHumanVerified)}>Saya manusia asli</span>
                </div>
                <ShieldCheck className="w-6 h-6 text-[#2B8E45]" />
              </div>
              
              <Button type="submit" fullWidth disabled={!isHumanVerified} className="bg-[#2B8E45] hover:bg-[#237a3a] text-white">Lanjut ke Chat Bot</Button>
            </form>
          </div>
        </div>
      )}

      {currentStep === AppStep.CHAT && (
        <div className="h-[100dvh] bg-slate-100 flex flex-col items-center justify-center sm:py-6 sm:px-4 relative">
          
          {/* THE HOOK FORM (POP-UP CEGATAN MINTA WA) */}
          {showHookForm && (
            <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in border border-slate-100 text-center">
                <div className="bg-[#2B8E45]/10 p-4 rounded-full w-fit mx-auto mb-4">
                   <ShieldCheck className="w-10 h-10 text-[#2B8E45]" />
                </div>
                <h3 className="text-xl font-bold text-[#54595F] mb-2">Satu Langkah Lagi!</h3>
                <p className="text-sm text-[#7A7A7A] mb-6 leading-relaxed">
                  H.A.N.A akan segera merangkum hasil analisis Anda. Masukkan kontak WhatsApp dan Email untuk menyimpan resume medis ini secara aman.
                </p>
                <form onSubmit={handleHookSubmit} className="space-y-4">
                   <input type="tel" required placeholder="No WhatsApp Valid" value={hookData.whatsapp} onChange={e => setHookData({...hookData, whatsapp: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#61CE70] transition-all text-left text-[#54595F]" />
                   <input type="email" required placeholder="Alamat Email Valid" value={hookData.email} onChange={e => setHookData({...hookData, email: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#61CE70] transition-all text-left text-[#54595F]" />
                   <Button type="submit" fullWidth className="bg-[#2B8E45] hover:bg-[#237a3a] text-white py-3.5 mt-2">Dapatkan Hasil Analisis</Button>
                </form>
              </div>
            </div>
          )}

          <div className="w-full max-w-2xl bg-white sm:rounded-2xl shadow-xl flex flex-col h-full overflow-hidden border-0 sm:border border-slate-200">
            <div className="bg-[#2B8E45] p-4 flex items-center justify-between text-white z-10">
              <div className="flex items-center gap-3"><Bot className="w-8 h-8 bg-white/20 p-1 rounded-full" /><div><h3 className="font-bold">H.A.N.A <span className="text-xs font-normal opacity-75 ml-1">(Asisten Medis Virtual)</span></h3></div></div>
              <div className="text-xs bg-[#237a3a] px-3 py-1 rounded-full">Sesi: {turnCount}/{MAX_TURNS}</div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {chatHistory.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === "user" ? "bg-[#2B8E45] text-white rounded-tr-none" : "bg-white border border-slate-100 text-[#54595F] rounded-tl-none"}`}>
                    {msg.text && <div className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</div>}
                    {msg.images?.map((img, i) => <img key={i} src={img} className="mt-3 rounded-lg max-h-48" alt="Upload"/>)}
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-[#2B8E45] font-medium text-sm p-4 animate-pulse">HANA sedang menganalisis...</div>}
              <div ref={chatEndRef} />
            </div>
            
            {selectedImages.length > 0 && (
              <div className="flex gap-3 p-3 bg-[#2B8E45]/10 overflow-x-auto">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative"><img src={img} className="h-16 w-16 object-cover rounded-xl" alt="Preview"/><button onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-rose-500 rounded-full text-white"><XCircle className="w-5 h-5"/></button></div>
                ))}
              </div>
            )}

            <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageSelect} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 mb-1 bg-slate-100 hover:bg-slate-200 text-[#2B8E45] rounded-xl transition-colors relative flex-shrink-0">
                  <Camera className="w-6 h-6" />
                  {selectedImages.length > 0 && <span className="absolute -top-2 -right-2 bg-[#61CE70] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">{selectedImages.length}/3</span>}
                </button>
                <textarea ref={textareaRef} value={inputText} onChange={handleInput} placeholder={turnCount >= MAX_TURNS ? "Sesi selesai..." : "Ketik balasan Anda di sini..."} className="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-[#61CE70] focus:ring-1 focus:ring-[#61CE70] resize-none min-h-[50px] max-h-[120px] overflow-y-auto leading-relaxed transition-all duration-200 text-[#54595F] placeholder-[#7A7A7A]" rows={1} disabled={isLoading || turnCount >= MAX_TURNS} />
                <button type="submit" disabled={(!inputText.trim() && selectedImages.length === 0) || isLoading || turnCount >= MAX_TURNS} className="bg-[#2B8E45] hover:bg-[#237a3a] text-white p-3 mb-1 rounded-xl disabled:opacity-50 disabled:bg-slate-300 flex-shrink-0 transition-colors shadow-sm">
                  <Send className="w-6 h-6 ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {currentStep === AppStep.REJECTED && (
        <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="bg-white p-8 rounded-2xl text-center border border-slate-100"><XCircle className="w-20 h-20 text-rose-500 mx-auto mb-6"/><h2 className="text-2xl font-bold mb-2 text-[#54595F]">Sesi Dihentikan</h2><p className="mb-6 text-[#7A7A7A]">{rejectReason}</p><Button onClick={() => window.location.reload()} className="bg-[#2B8E45] hover:bg-[#237a3a] text-white">Mulai Baru</Button></div></div>
      )}
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatFlow />} />
        <Route path="/report/:id" element={<ReportPage />} />
      </Routes>
    </BrowserRouter>
  );
}