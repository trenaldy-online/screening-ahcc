import React, { useState, useEffect } from 'react';
import { Activity, ChevronRight, ShieldCheck, AlertTriangle, RefreshCcw, Info, HeartPulse, Stethoscope, User, Mail, Phone, Share2, CheckSquare, Square, History, Calendar, ChevronDown, ChevronUp, ArrowLeft, Lock, Download, Trash2, Database, KeyRound, LogOut } from 'lucide-react';
import { CANCER_TYPES, getQuestionsForCancer, INFO_SOURCES, DISCLAIMER_TEXT } from './constants';
import { AppStep, UserResponse, AnalysisResult, CancerType, UserData, Question, HistoryItem, AdminSubmission } from './types';
import { analyzeScreeningData } from './services/geminiService';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.WELCOME);
  
  // Selection State
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [selectedCancer, setSelectedCancer] = useState<CancerType | null>(null);
  
  // Quiz State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [textInput, setTextInput] = useState('');
  
  // Multi-select temporary state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Lead Form State
  const [userData, setUserData] = useState<UserData>({
    name: '',
    whatsapp: '',
    email: '',
    infoSource: '',
    marketingOptIn: true
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserData, string>>>({});

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Admin State
  const [adminPassword, setAdminPassword] = useState('');
  const [adminData, setAdminData] = useState<AdminSubmission[]>([]);

  // Limit State
  const [userIp, setUserIp] = useState<string>('');
  const [isLimitReached, setIsLimitReached] = useState<boolean>(false);
  const MAX_ATTEMPTS = 2;

  // Load history & Check IP Limit on mount
  useEffect(() => {
    // 1. Load User History
    const savedHistory = localStorage.getItem('oncoscreen_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to parse history from localStorage', error);
      }
    }

    // 2. Check IP Limit
    const checkIpLimit = async () => {
      try {
        // Fetch public IP
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const currentIp = data.ip;
        setUserIp(currentIp);

        // Check Local Storage
        const limitDataStr = localStorage.getItem('oncoscreen_limit');
        if (limitDataStr) {
          const limitData = JSON.parse(limitDataStr);
          // If IP matches and count >= MAX, block
          if (limitData.ip === currentIp && limitData.count >= MAX_ATTEMPTS) {
            setIsLimitReached(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch IP or check limit", error);
      }
    };

    checkIpLimit();
  }, []);

  // Reset temp states when question changes
  useEffect(() => {
    setTextInput('');
    setSelectedOptions([]);
  }, [questionIndex]);

  // --- Handlers ---

  const handleStart = () => {
    if (isLimitReached) return;
    setCurrentStep(AppStep.CANCER_SELECTION);
  };

  const handleViewHistory = () => {
    setCurrentStep(AppStep.HISTORY);
  };

  const handleAdminAccess = () => {
    setAdminPassword('');
    setCurrentStep(AppStep.ADMIN_LOGIN);
  };

  const handleCancerSelect = (cancer: CancerType) => {
    setSelectedCancer(cancer);
    const specificQuestions = getQuestionsForCancer(cancer.id);
    setQuestions(specificQuestions);
    setQuestionIndex(0);
    setResponses([]);
    setCurrentStep(AppStep.QUIZ);
  };

  // Handle clicking an option (Logic split for Single vs Multi)
  const handleOptionClick = (value: string, type: 'single' | 'multi' | 'text') => {
    if (type === 'single') {
      submitAnswer(value);
    } else if (type === 'multi') {
      setSelectedOptions(prev => {
        if (prev.includes(value)) {
          return prev.filter(item => item !== value);
        } else {
          return [...prev, value];
        }
      });
    }
  };

  // Core logic to submit answer and calculate next questions
  const submitAnswer = (answer: string | string[]) => {
    const currentQuestion = questions[questionIndex];
    
    // 1. Record Response
    const newResponse: UserResponse = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      answer: answer
    };

    // 2. Determine Follow Up Injection
    let updatedQuestions = [...questions];
    let nextIndex = questionIndex + 1;
    let shouldTriggerFollowUp = false;

    if (currentQuestion.followUp) {
      const triggerValues = currentQuestion.followUp.triggerValues;
      
      // Check logic: If answer matches trigger (for arrays, if ANY selected option triggers)
      if (Array.isArray(answer)) {
        shouldTriggerFollowUp = answer.some(a => triggerValues.includes(a));
      } else {
        shouldTriggerFollowUp = triggerValues.includes(answer);
      }

      if (shouldTriggerFollowUp) {
        // Inject follow-up questions immediately after current question
        // splice(start, deleteCount, ...items)
        updatedQuestions.splice(nextIndex, 0, ...currentQuestion.followUp.questions);
      }
    }

    // 3. Update State & Advance
    setQuestions(updatedQuestions);
    setResponses([...responses, newResponse]);
    advanceQuiz(updatedQuestions);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    submitAnswer(textInput);
  };

  const handleMultiSubmit = () => {
    if (selectedOptions.length === 0) return;
    submitAnswer(selectedOptions);
  };

  const advanceQuiz = (currentQuestionsList: Question[]) => {
    if (questionIndex < currentQuestionsList.length - 1) {
      setQuestionIndex(prev => prev + 1);
    } else {
      setCurrentStep(AppStep.LEAD_FORM);
    }
  };

  const saveToHistory = (result: AnalysisResult, cancer: CancerType) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      cancerLabel: cancer.label,
      riskLevel: result.riskLevel,
      summary: result.summary,
      recommendations: result.recommendations
    };
    
    // 1. Save to User History (Personal)
    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('oncoscreen_history', JSON.stringify(updatedHistory));

    // 2. Save to Admin DB (Global for this device)
    const adminItem: AdminSubmission = {
        id: newItem.id,
        timestamp: newItem.timestamp,
        userData: userData,
        cancerType: cancer.label,
        riskLevel: result.riskLevel,
        summary: result.summary
    };

    const savedAdminData = localStorage.getItem('oncoscreen_admin_db');
    let currentAdminData: AdminSubmission[] = [];
    if (savedAdminData) {
        try {
            currentAdminData = JSON.parse(savedAdminData);
        } catch (e) {
            console.error("Error parsing admin db", e);
        }
    }
    const newAdminData = [adminItem, ...currentAdminData];
    localStorage.setItem('oncoscreen_admin_db', JSON.stringify(newAdminData));
  };

  const incrementLimitCount = () => {
    if (!userIp) return; // Can't track if IP fetch failed

    const limitDataStr = localStorage.getItem('oncoscreen_limit');
    let newCount = 1;

    if (limitDataStr) {
      const limitData = JSON.parse(limitDataStr);
      if (limitData.ip === userIp) {
        newCount = limitData.count + 1;
      }
    }

    const newData = { ip: userIp, count: newCount };
    localStorage.setItem('oncoscreen_limit', JSON.stringify(newData));

    if (newCount >= MAX_ATTEMPTS) {
      setIsLimitReached(true);
    }
  };

  const validateLeadForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserData, string>> = {};
    let isValid = true;

    // Validate Name
    if (!userData.name.trim()) {
      newErrors.name = "Nama lengkap wajib diisi";
      isValid = false;
    }

    // Validate WhatsApp (Simple Indonesia logic: starts with 08, 628, +628)
    const phoneClean = userData.whatsapp.replace(/[\s-]/g, '');
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;
    if (!userData.whatsapp.trim()) {
      newErrors.whatsapp = "Nomor WhatsApp wajib diisi";
      isValid = false;
    } else if (!phoneRegex.test(phoneClean)) {
      newErrors.whatsapp = "Format nomor tidak valid (contoh: 08123456789)";
      isValid = false;
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email.trim()) {
      newErrors.email = "Email wajib diisi";
      isValid = false;
    } else if (!emailRegex.test(userData.email)) {
      newErrors.email = "Format email tidak valid";
      isValid = false;
    }

    // Validate Info Source
    if (!userData.infoSource) {
      newErrors.infoSource = "Wajib dipilih";
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLeadForm()) {
      return;
    }

    setCurrentStep(AppStep.ANALYZING);
    try {
      if (!selectedCancer) throw new Error("No cancer selected");
      const result = await analyzeScreeningData(responses, userData, selectedCancer);
      setAnalysisResult(result);
      saveToHistory(result, selectedCancer);
      incrementLimitCount(); // Increment usage count
      setCurrentStep(AppStep.RESULT);
    } catch (error) {
      console.error(error);
      alert("Gagal melakukan analisis. Periksa koneksi internet.");
      setCurrentStep(AppStep.WELCOME);
    }
  };

  const handleRestart = () => {
    if (isLimitReached) {
      setCurrentStep(AppStep.WELCOME);
      return;
    }
    setAnalysisResult(null);
    setResponses([]);
    setQuestionIndex(0);
    setSelectedGender(null);
    setSelectedCancer(null);
    setUserData({ name: '', whatsapp: '', email: '', infoSource: '', marketingOptIn: true });
    setFormErrors({});
    setCurrentStep(AppStep.WELCOME);
  };

  const toggleHistoryItem = (id: string) => {
    setExpandedHistoryId(prev => prev === id ? null : id);
  };

  // --- Admin Logic ---

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
        const savedData = localStorage.getItem('oncoscreen_admin_db');
        if (savedData) {
            setAdminData(JSON.parse(savedData));
        }
        setCurrentStep(AppStep.ADMIN_DASHBOARD);
    } else {
        alert("Password salah!");
    }
  };

  const downloadCSV = () => {
    if (adminData.length === 0) {
        alert("Tidak ada data untuk diunduh.");
        return;
    }

    // Header CSV
    const headers = ["Tanggal", "Jam", "Nama", "WhatsApp", "Email", "Jenis Kanker", "Tingkat Risiko", "Sumber Info"];
    
    // Rows
    const rows = adminData.map(item => {
        const dateObj = new Date(item.timestamp);
        return [
            dateObj.toLocaleDateString('id-ID'),
            dateObj.toLocaleTimeString('id-ID'),
            `"${item.userData.name}"`, // Quote strings to handle commas
            `'${item.userData.whatsapp}`, // Force string for phone
            item.userData.email,
            item.cancerType,
            item.riskLevel,
            item.userData.infoSource
        ];
    });

    // Combine
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
    ].join("\n");

    // Create Blob and Link
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Screening_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAdminData = () => {
      if (window.confirm("Yakin ingin menghapus SEMUA data pasien? Data tidak bisa dikembalikan.")) {
          localStorage.removeItem('oncoscreen_admin_db');
          setAdminData([]);
      }
  };

  // --- Render Steps ---

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center max-w-2xl mx-auto animate-fade-in relative">
      <div className="bg-teal-50 p-4 rounded-full mb-6">
        <HeartPulse className="w-16 h-16 text-teal-600" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
        AHCC Screening Tool
      </h1>
      <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
        Lakukan screening risiko kanker spesifik organ (Paru, Payudara, dll) menggunakan AI.
      </p>

      {/* Limit Warning */}
      {isLimitReached && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-8 max-w-md mx-auto flex items-start text-left">
          <Lock className="w-5 h-5 text-rose-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-rose-700 text-sm">Batas Screening Tercapai</h3>
            <p className="text-xs text-rose-600 mt-1">
              Anda telah mencapai batas maksimum 2 kali screening dari IP Address ini. Silakan hubungi admin jika ingin melakukan screening lebih lanjut.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button 
          onClick={handleStart} 
          disabled={isLimitReached}
          className="text-lg px-8 py-4 shadow-xl shadow-teal-200"
        >
          {isLimitReached ? "Akses Dibatasi" : "Pilih Screening"} 
          {!isLimitReached && <ChevronRight className="w-5 h-5" />}
        </Button>
        <Button onClick={handleViewHistory} variant="secondary" className="px-6 py-3">
          <History className="w-5 h-5" /> Riwayat Screening
        </Button>
      </div>

      {/* Secret Admin Button */}
      <button 
        onClick={handleAdminAccess}
        className="absolute bottom-4 right-4 text-slate-300 hover:text-slate-500 transition-colors p-2"
        title="Admin Access"
      >
        <KeyRound className="w-5 h-5" />
      </button>
    </div>
  );

  const renderAdminLogin = () => (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex justify-center mb-6">
                  <div className="bg-slate-800 p-3 rounded-full text-white">
                      <Lock className="w-8 h-8" />
                  </div>
              </div>
              <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Admin Login</h2>
              <form onSubmit={handleAdminLogin}>
                  <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-600 mb-2">Password</label>
                      <input 
                        type="password" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-500 outline-none"
                        placeholder="Masukkan password admin"
                        autoFocus
                      />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button type="submit" fullWidth className="bg-slate-800 hover:bg-slate-900 shadow-slate-400">
                        Masuk Dashboard
                    </Button>
                    <button 
                        type="button" 
                        onClick={() => setCurrentStep(AppStep.WELCOME)}
                        className="text-slate-500 hover:text-slate-700 text-sm py-2"
                    >
                        Kembali ke Halaman Utama
                    </button>
                  </div>
              </form>
          </div>
      </div>
  );

  const renderAdminDashboard = () => (
      <div className="min-h-screen bg-slate-100 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                      <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                          <Database className="w-8 h-8 text-teal-600" />
                          Dashboard Data Pasien
                      </h1>
                      <p className="text-slate-500 mt-1">Total {adminData.length} data tersimpan di perangkat ini.</p>
                  </div>
                  <div className="flex gap-3">
                      <Button onClick={downloadCSV} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">
                          <Download className="w-4 h-4" /> Export CSV
                      </Button>
                      <button 
                        onClick={() => setCurrentStep(AppStep.WELCOME)}
                        className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-semibold text-slate-700"
                      >
                          <LogOut className="w-4 h-4" /> Keluar
                      </button>
                  </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                                  <th className="p-4 font-bold">Tanggal</th>
                                  <th className="p-4 font-bold">Nama</th>
                                  <th className="p-4 font-bold">Kontak</th>
                                  <th className="p-4 font-bold">Jenis Screening</th>
                                  <th className="p-4 font-bold">Risiko</th>
                                  <th className="p-4 font-bold">Sumber Info</th>
                              </tr>
                          </thead>
                          <tbody className="text-sm">
                              {adminData.length === 0 ? (
                                  <tr>
                                      <td colSpan={6} className="p-8 text-center text-slate-400">
                                          Belum ada data yang tersimpan.
                                      </td>
                                  </tr>
                              ) : (
                                  adminData.map((item) => {
                                    const riskColor = {
                                        'Rendah': 'bg-emerald-100 text-emerald-800',
                                        'Sedang': 'bg-amber-100 text-amber-800',
                                        'Tinggi': 'bg-rose-100 text-rose-800'
                                    }[item.riskLevel] || 'bg-slate-100';

                                    return (
                                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                          <td className="p-4 text-slate-500 whitespace-nowrap">
                                              {new Date(item.timestamp).toLocaleDateString('id-ID')} <br/>
                                              <span className="text-xs">{new Date(item.timestamp).toLocaleTimeString('id-ID')}</span>
                                          </td>
                                          <td className="p-4 font-medium text-slate-800">{item.userData.name}</td>
                                          <td className="p-4 text-slate-600">
                                              <div className="flex flex-col">
                                                <span>{item.userData.whatsapp}</span>
                                                <span className="text-xs text-slate-400">{item.userData.email}</span>
                                              </div>
                                          </td>
                                          <td className="p-4 text-slate-700">{item.cancerType}</td>
                                          <td className="p-4">
                                              <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${riskColor}`}>
                                                  {item.riskLevel}
                                              </span>
                                          </td>
                                          <td className="p-4 text-slate-600">{item.userData.infoSource}</td>
                                      </tr>
                                    );
                                  })
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              <div className="mt-8 flex justify-end">
                  <button 
                    onClick={clearAdminData}
                    className="flex items-center gap-2 text-rose-500 hover:text-rose-700 text-sm px-4 py-2 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                      <Trash2 className="w-4 h-4" /> Reset Database (Hapus Semua Data)
                  </button>
              </div>
          </div>
      </div>
  );

  const renderHistory = () => (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={handleRestart} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h2 className="text-2xl font-bold text-slate-800">Riwayat Screening</h2>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Belum ada riwayat screening.</p>
            <Button onClick={handleRestart} className="mt-6 mx-auto" disabled={isLimitReached}>
              {isLimitReached ? "Batas Tercapai" : "Mulai Screening"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const date = new Date(item.timestamp).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              });
              
              const riskColor = {
                'Rendah': 'text-emerald-600 bg-emerald-50 border-emerald-100',
                'Sedang': 'text-amber-600 bg-amber-50 border-amber-100',
                'Tinggi': 'text-rose-600 bg-rose-50 border-rose-100'
              }[item.riskLevel];

              const isExpanded = expandedHistoryId === item.id;

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all">
                  <div 
                    onClick={() => toggleHistoryItem(item.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border ${riskColor}`}>
                          Risiko {item.riskLevel}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {date}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800">{item.cancerLabel}</h3>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 animate-fade-in border-t border-slate-100 mt-2">
                      <div className="pt-4 space-y-4">
                        <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg leading-relaxed whitespace-pre-line">
                           {item.summary.split('\n').map((paragraph, index) => {
                            const trimmed = paragraph.trim();
                            if (!trimmed) return null;
                            return (
                              <p key={index} className="mb-2 last:mb-0">
                                {trimmed}
                              </p>
                            );
                          })}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 mb-2">Rekomendasi:</h4>
                          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                            {item.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Disclaimer in History */}
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                          <div className="flex items-start">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                               <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Disclaimer Medis</h4>
                               <p className="text-xs text-amber-700 leading-relaxed">
                                 {DISCLAIMER_TEXT}
                               </p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderCancerSelection = () => (
    <div className="min-h-screen p-6 bg-slate-50 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <h2 className="text-2xl font-bold text-center mb-8 text-slate-800">Pilih Jenis Screening Kanker</h2>
        
        {/* Gender Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
            <button
              onClick={() => setSelectedGender('male')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedGender === 'male' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Laki-laki
            </button>
            <button
              onClick={() => setSelectedGender('female')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedGender === 'female' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Perempuan
            </button>
          </div>
        </div>

        {/* Cancer Grid */}
        {!selectedGender ? (
          <p className="text-center text-slate-500">Silakan pilih jenis kelamin terlebih dahulu.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {CANCER_TYPES.filter(c => c.gender === selectedGender).map(cancer => (
              <button
                key={cancer.id}
                onClick={() => handleCancerSelect(cancer)}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-500 transition-all text-left group"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700 group-hover:text-teal-700">{cancer.label}</span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderQuiz = () => {
    const question = questions[questionIndex];
    const progress = ((questionIndex + 1) / questions.length) * 100;

    // Helper to check if option is selected in multi mode
    const isSelected = (val: string) => selectedOptions.includes(val);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-slate-50">
        <div className="w-full max-w-xl">
          <div className="w-full bg-slate-200 h-2 rounded-full mb-8 overflow-hidden">
            <div className="bg-teal-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-slate-100 min-h-[400px] flex flex-col justify-between animate-fade-in">
            <div>
              <span className="text-teal-600 font-bold text-sm tracking-wider uppercase mb-2 block">
                Screening {selectedCancer?.label}
              </span>
              <h2 className="text-2xl font-bold text-slate-800 mb-8 leading-snug">{question.text}</h2>

              <div className="space-y-3">
                {/* SINGLE CHOICE */}
                {question.type === 'single' && question.options?.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option.value, 'single')}
                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 transition-all group flex justify-between items-center"
                  >
                    <span className="font-medium text-slate-700 group-hover:text-teal-900">{option.label}</span>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}

                {/* MULTI CHOICE */}
                {question.type === 'multi' && (
                  <div className="flex flex-col gap-3">
                    {question.options?.map(option => (
                      <button
                        key={option.id}
                        onClick={() => handleOptionClick(option.value, 'multi')}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                          isSelected(option.value) 
                            ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' 
                            : 'border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        <span className={`font-medium ${isSelected(option.value) ? 'text-teal-900' : 'text-slate-700'}`}>
                          {option.label}
                        </span>
                        {isSelected(option.value) 
                          ? <CheckSquare className="w-6 h-6 text-teal-600" />
                          : <Square className="w-6 h-6 text-slate-300" />
                        }
                      </button>
                    ))}
                    <div className="mt-4">
                      <Button onClick={handleMultiSubmit} disabled={selectedOptions.length === 0} fullWidth>
                        Lanjut <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* TEXT INPUT */}
                {question.type === 'text' && (
                  <form onSubmit={handleTextSubmit} className="flex flex-col gap-4">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={question.placeholder}
                      className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 min-h-[150px] resize-none"
                    />
                    <Button type="submit" disabled={!textInput.trim()} fullWidth>
                      Lanjut <ChevronRight className="w-4 h-4" />
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {question.type === 'multi' && (
              <div className="mt-6 text-center text-slate-400 text-sm">
                Boleh memilih lebih dari satu jawaban
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLeadForm = () => (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full animate-fade-in">
        <div className="text-center mb-6">
          <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Analisis Selesai</h2>
          <p className="text-slate-600 mt-2">Isi data berikut untuk melihat hasil screening Anda.</p>
        </div>

        <form onSubmit={handleLeadSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
            <div className="relative">
              <User className={`absolute left-3 top-3 w-5 h-5 ${formErrors.name ? 'text-rose-500' : 'text-slate-400'}`} />
              <input
                type="text"
                className={`w-full pl-10 p-3 rounded-lg border ${formErrors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-teal-500'} focus:ring-2 outline-none transition-all`}
                placeholder="Nama Anda"
                value={userData.name}
                onChange={e => {
                  setUserData({...userData, name: e.target.value});
                  if (formErrors.name) setFormErrors({...formErrors, name: ''});
                }}
              />
            </div>
            {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp</label>
            <div className="relative">
              <Phone className={`absolute left-3 top-3 w-5 h-5 ${formErrors.whatsapp ? 'text-rose-500' : 'text-slate-400'}`} />
              <input
                type="tel"
                className={`w-full pl-10 p-3 rounded-lg border ${formErrors.whatsapp ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-teal-500'} focus:ring-2 outline-none transition-all`}
                placeholder="0812..."
                value={userData.whatsapp}
                onChange={e => {
                  setUserData({...userData, whatsapp: e.target.value});
                  if (formErrors.whatsapp) setFormErrors({...formErrors, whatsapp: ''});
                }}
              />
            </div>
            {formErrors.whatsapp && <p className="text-xs text-rose-500 mt-1">{formErrors.whatsapp}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Email</label>
            <div className="relative">
              <Mail className={`absolute left-3 top-3 w-5 h-5 ${formErrors.email ? 'text-rose-500' : 'text-slate-400'}`} />
              <input
                type="email"
                className={`w-full pl-10 p-3 rounded-lg border ${formErrors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-teal-500'} focus:ring-2 outline-none transition-all`}
                placeholder="nama@email.com"
                value={userData.email}
                onChange={e => {
                  setUserData({...userData, email: e.target.value});
                  if (formErrors.email) setFormErrors({...formErrors, email: ''});
                }}
              />
            </div>
            {formErrors.email && <p className="text-xs text-rose-500 mt-1">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tahu Kami Dari Mana?</label>
            <div className="relative">
              <Share2 className={`absolute left-3 top-3 w-5 h-5 ${formErrors.infoSource ? 'text-rose-500' : 'text-slate-400'}`} />
              <select
                className={`w-full pl-10 p-3 rounded-lg border ${formErrors.infoSource ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-teal-500'} focus:ring-2 outline-none transition-all bg-white`}
                value={userData.infoSource}
                onChange={e => {
                  setUserData({...userData, infoSource: e.target.value});
                  if (formErrors.infoSource) setFormErrors({...formErrors, infoSource: ''});
                }}
              >
                <option value="">Pilih Sumber Informasi</option>
                {INFO_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {formErrors.infoSource && <p className="text-xs text-rose-500 mt-1">{formErrors.infoSource}</p>}
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="marketing"
              checked={userData.marketingOptIn}
              onChange={e => setUserData({...userData, marketingOptIn: e.target.checked})}
              className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="marketing" className="text-sm text-slate-600">
              Saya bersedia menerima tips kesehatan dan penawaran pemeriksaan via WhatsApp/Email.
            </label>
          </div>

          <Button type="submit" fullWidth className="mt-4">
            Lihat Hasil Analisis
          </Button>
        </form>
      </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-t-4 border-teal-500 rounded-full animate-spin"></div>
      </div>
      <h2 className="text-2xl font-bold text-slate-800">Menganalisis Jawaban {userData.name}...</h2>
    </div>
  );

  const renderResult = () => {
    if (!analysisResult) return null;
    const riskColor = {
      'Rendah': 'text-emerald-600 bg-emerald-50 border-emerald-200',
      'Sedang': 'text-amber-600 bg-amber-50 border-amber-200',
      'Tinggi': 'text-rose-600 bg-rose-50 border-rose-200'
    }[analysisResult.riskLevel];

    // Calculate position for visualizer
    const visualizerPosition = {
      'Rendah': '15%',
      'Sedang': '50%',
      'Tinggi': '85%'
    }[analysisResult.riskLevel];

    return (
      <div className="min-h-screen py-12 px-4 md:px-8 bg-slate-50">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
            <h2 className="text-slate-500 font-medium mb-4 uppercase tracking-widest text-sm">
              Hasil Screening {selectedCancer?.label}
            </h2>
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border ${riskColor} mb-8`}>
              <Activity className="w-8 h-8" />
              <span className="text-2xl font-bold">Risiko {analysisResult.riskLevel}</span>
            </div>
            
            {/* Split Summary into paragraphs for better readability */}
            <div className="text-left bg-slate-50/50 p-6 md:p-8 rounded-2xl border border-slate-100 mb-8">
              {analysisResult.summary.split('\n').map((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;
                return (
                  <p key={index} className="text-lg text-slate-800 leading-8 mb-4 last:mb-0 font-normal">
                    {trimmed}
                  </p>
                );
              })}
            </div>

            {/* Risk Visualizer */}
            <div className="w-full max-w-md mx-auto mt-8 mb-4">
              <div className="flex justify-between text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">
                <span>Rendah</span>
                <span>Sedang</span>
                <span>Tinggi</span>
              </div>
              <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div className="w-1/3 h-full bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
                <div className="w-1/3 h-full bg-gradient-to-r from-amber-400 to-amber-500"></div>
                <div className="w-1/3 h-full bg-gradient-to-r from-rose-400 to-rose-500"></div>
                
                {/* Marker Indicator */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-slate-800 z-10"
                  style={{ left: visualizerPosition, transform: 'translateX(-50%)' }}
                ></div>
                <div 
                  className="absolute -top-1 w-4 h-6 bg-slate-800 rounded shadow-lg border-2 border-white z-20"
                   style={{ left: visualizerPosition, transform: 'translateX(-50%)' }}
                ></div>
              </div>
              <p className="text-xs text-center text-slate-500 mt-3">
                Grafik estimasi tingkat risiko Anda
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-600" />
              Rekomendasi Medis
            </h3>
            <ul className="space-y-4">
              {analysisResult.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl transition-colors hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center flex-shrink-0 border border-teal-200">{idx + 1}</div>
                  <p className="text-slate-700 mt-1 leading-relaxed">{rec}</p>
                </li>
              ))}
            </ul>

            {/* Disclaimer Section */}
            <div className="mt-8 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                   <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-1">Disclaimer Medis</h4>
                   <p className="text-sm text-amber-700 leading-relaxed">
                     {analysisResult.medicalDisclaimer || DISCLAIMER_TEXT}
                   </p>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-center pt-8 pb-12">
            <Button onClick={handleRestart} variant="secondary">
              <RefreshCcw className="w-5 h-5" />
              Screening Kanker Lain
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {currentStep === AppStep.WELCOME && renderWelcome()}
      {currentStep === AppStep.CANCER_SELECTION && renderCancerSelection()}
      {currentStep === AppStep.QUIZ && renderQuiz()}
      {currentStep === AppStep.LEAD_FORM && renderLeadForm()}
      {currentStep === AppStep.ANALYZING && renderAnalyzing()}
      {currentStep === AppStep.RESULT && renderResult()}
      {currentStep === AppStep.HISTORY && renderHistory()}
      {currentStep === AppStep.ADMIN_LOGIN && renderAdminLogin()}
      {currentStep === AppStep.ADMIN_DASHBOARD && renderAdminDashboard()}
    </>
  );
};

export default App;