import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  FileText, 
  CheckCircle2, 
  Circle, 
  Send, 
  FileJson, 
  Menu,
  X,
  Share2,
  Sparkles,
  RefreshCw,
  Video,
  Image as ImageIcon,
  MessageCircle,
  BarChart3,
  Globe,
  TrendingUp,
  Award,
  Check,
  Zap,
  Crown,
  Star,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  ImageRun, 
  AlignmentType
} from 'docx';

// Services
import { loadData, saveData, clearData } from './services/storageService';
import { generateMonthlyObservation } from './services/geminiService';
import { MonthData, WeeklyData, ViewState, DashboardStats, PlanType, PlanConfig } from './types';

// --- Configuration ---

const PLANS: Record<PlanType, PlanConfig> = {
  BASIC: {
    id: 'BASIC',
    name: 'Presencia Digital',
    price: 99,
    totalPosts: 8,
    postsPerWeek: 2,
    totalReels: 0,
    features: ['8 Diseños Pro (2 x semana)', 'Redacción de textos (Copy)', 'Programación de posts']
  },
  GROWTH: {
    id: 'GROWTH',
    name: 'Crecimiento de Marca',
    price: 250,
    totalPosts: 12,
    postsPerWeek: 3,
    totalReels: 2,
    features: ['12 Publicaciones (3 x semana)', '2 Reels (Videos cortos)', 'Historias de interacción', 'Respuesta a comentarios']
  },
  AUTHORITY: {
    id: 'AUTHORITY',
    name: 'Dominio de Mercado',
    price: 450,
    totalPosts: 15,
    postsPerWeek: 4, // Max allowed per week in UI
    totalReels: 4,
    features: ['15 Publicaciones Mixtas', '4 Reels (Edición Pro)', 'Gestión de Ads', 'Reunión Mensual']
  }
};

// --- Subcomponents ---

// 1. Signature Pad Component
const SignaturePad: React.FC<{ onSave: (dataUrl: string) => void; onClear: () => void }> = ({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
    const ctx = canvas?.getContext('2d');
    if(ctx) ctx.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
       x = e.touches[0].clientX - rect.left;
       y = e.touches[0].clientY - rect.top;
    } else {
       x = (e as React.MouseEvent).clientX - rect.left;
       y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onClear();
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white p-2 hover:border-indigo-400 transition-colors">
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="w-full h-40 touch-none cursor-crosshair bg-gray-50 rounded"
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onTouchStart={startDrawing}
        onTouchEnd={stopDrawing}
        onTouchMove={draw}
      />
      <div className="flex justify-end mt-2">
        <button 
            onClick={handleClear}
            className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1"
        >
            Borrar Firma
        </button>
      </div>
    </div>
  );
};

// 2. Chart Export Template
const ChartExportTemplate = React.forwardRef<HTMLDivElement, { data: MonthData, stats: DashboardStats }>(({ data, stats }, ref) => {
  const chartData = useMemo(() => {
    return data.weeks.map(week => ({
        ...week,
        postsCount: week.posts.filter(p => p).length
    }));
  }, [data.weeks]);

  return (
    <div ref={ref} className="w-[600px] bg-white p-8 font-['Montserrat']">
        <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    Progreso Mensual
                </h3>
                <span className={`px-4 py-1 rounded-full text-sm font-bold ${stats.progressPercentage === 100 ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {stats.progressPercentage}% Completado
                </span>
            </div>
            <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden mb-8 border border-slate-200">
                <div 
                    className="h-full bg-indigo-600"
                    style={{ width: `${stats.progressPercentage}%` }}
                />
            </div>
        </div>
        <div className="h-80 w-full border border-slate-100 rounded-xl p-4">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                        dataKey="id" 
                        tickFormatter={(val) => `Sem ${val}`} 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 14 }}
                        dy={10}
                    />
                    <YAxis hide />
                    <Bar dataKey="postsCount" name="Publicaciones" fill="#6366f1" stackId="a" radius={[0,0,4,4]} isAnimationActive={false} />
                    <Bar dataKey="storiesCount" name="Historias" fill="#f472b6" stackId="a" radius={[0,0,0,0]} isAnimationActive={false} />
                    <Bar dataKey="commentsCount" name="Respuestas" fill="#fbbf24" stackId="a" radius={[4,4,0,0]} isAnimationActive={false} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
});

// 3. Print Template Component
const PrintTemplate = React.forwardRef<HTMLDivElement, { data: MonthData, stats: DashboardStats }>(({ data, stats }, ref) => {
  const currentPlan = data.selectedPlan ? PLANS[data.selectedPlan] : PLANS.GROWTH;

  return (
    <div ref={ref} className="w-[794px] h-[1123px] bg-white relative overflow-hidden text-slate-800 flex-shrink-0 shadow-2xl" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#4c1d95 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>
      <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-b from-orange-400 to-orange-600"></div>
      <div className="absolute left-8 top-0 w-6 h-full bg-[#e9d5ff]"></div>
      
      <div className="absolute top-0 right-0 p-12 text-right z-20">
        <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 tracking-[0.2em] mb-1 uppercase font-['Montserrat']">ADYROM</h3>
            <div className="flex flex-col items-end">
                <h1 className="text-7xl font-bold text-[#6B21A8] tracking-tight leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                    saftelmah
                </h1>
                <p className="text-xl italic text-[#6B21A8] mt-2 font-['Playfair_Display'] font-light">por zambtechnology</p>
            </div>
        </div>
      </div>

      <div className="absolute top-52 left-24 right-16 bottom-64 z-10">
        <div className="border-b-4 border-orange-500 mb-8 pb-4 inline-block pr-12">
            <h2 className="text-5xl font-bold text-[#6B21A8]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Reporte Mensual
            </h2>
        </div>
        
        <div className="flex justify-between items-end mb-12 bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-sm">
            <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">Periodo Evaluado</p>
                <p className="text-3xl font-bold text-slate-800 capitalize font-['Playfair_Display']">{data.monthName}</p>
                <p className="text-sm text-indigo-600 font-medium mt-1 uppercase tracking-wide">Plan: {currentPlan.name}</p>
            </div>
            <div className="text-right">
                <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">Cumplimiento Global</p>
                <div className="flex items-center gap-2 justify-end">
                    <Award className="text-orange-500" size={32} />
                    <p className="text-5xl font-bold text-orange-500">{stats.progressPercentage}%</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-12">
           <div className="bg-white p-6 rounded-2xl border-l-4 border-blue-500 shadow-md flex items-center gap-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-5 -mr-4 -mt-4"><ImageIcon size={100}/></div>
              <div className="p-4 bg-blue-50 text-blue-600 rounded-full shadow-inner"><ImageIcon size={28}/></div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Publicaciones</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.postsCompleted} <span className="text-lg text-slate-400 font-normal">/ {stats.totalPosts}</span></p>
              </div>
           </div>
           {currentPlan.totalReels > 0 && (
             <div className="bg-white p-6 rounded-2xl border-l-4 border-purple-500 shadow-md flex items-center gap-5 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-5 -mr-4 -mt-4"><Video size={100}/></div>
                <div className="p-4 bg-purple-50 text-purple-600 rounded-full shadow-inner"><Video size={28}/></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Reels</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{stats.reelsCompleted} <span className="text-lg text-slate-400 font-normal">/ {stats.totalReels}</span></p>
                </div>
             </div>
           )}
           <div className="bg-white p-6 rounded-2xl border-l-4 border-pink-500 shadow-md flex items-center gap-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-5 -mr-4 -mt-4"><Share2 size={100}/></div>
              <div className="p-4 bg-pink-50 text-pink-600 rounded-full shadow-inner"><Share2 size={28}/></div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Historias</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.storiesTotal}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-2xl border-l-4 border-amber-500 shadow-md flex items-center gap-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-5 -mr-4 -mt-4"><MessageCircle size={100}/></div>
              <div className="p-4 bg-amber-50 text-amber-600 rounded-full shadow-inner"><MessageCircle size={28}/></div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Respuestas</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.commentsTotal}</p>
              </div>
           </div>
        </div>

        <div className="mb-12">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
             <Sparkles size={20} className="text-[#6B21A8]"/> Observaciones Estratégicas
           </h3>
           <div className="p-8 bg-gradient-to-r from-purple-50 to-white rounded-xl border border-purple-100 text-slate-700 leading-relaxed text-justify shadow-sm relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#6B21A8] rounded-l-xl"></div>
              <p className="font-medium font-['Montserrat'] text-lg text-slate-800 italic">
                "{data.aiObservation || "Sin observaciones registradas para este periodo."}"
              </p>
           </div>
        </div>

        {data.clientSignature && (
            <div className="mt-8 flex justify-end">
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Conformidad del Cliente</p>
                    <div className="relative inline-block px-8 py-2 border-b-2 border-slate-800">
                         <img src={data.clientSignature} alt="Firma" className="h-20 object-contain" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 font-mono">
                        <p>FIRMADO DIGITALMENTE</p>
                        <p>{new Date(data.signatureDate!).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="absolute bottom-0 right-0 w-[500px] h-[350px] pointer-events-none">
          <div className="absolute bottom-0 right-0 w-full h-[280px] bg-[#4a2c7a] rounded-tl-[140px] pl-24 pr-12 py-10 text-white shadow-2xl flex flex-col justify-center">
             <div className="text-right space-y-2 mt-8 z-20 font-['Montserrat']">
                <p className="font-bold text-orange-400 text-2xl tracking-wider mb-2">099 127 6796</p>
                <p className="text-sm border-b border-white/20 inline-block pb-1 mb-2 tracking-wide">ventas@saftelmah.com.ec</p>
                <p className="font-bold text-orange-400 text-sm mt-4 flex items-center justify-end gap-2 tracking-wider">
                    www.saf-telma.com <Globe size={14}/>
                </p>
             </div>
          </div>
           <div className="absolute bottom-10 left-[-80px] bg-black text-white pl-8 pr-6 py-3 rounded-r-full flex items-center gap-3 shadow-xl z-30">
              <div className="bg-white text-black w-8 h-8 flex items-center justify-center rounded text-sm font-serif font-bold border border-gray-400 shadow-sm">Z</div>
              <span className="font-medium text-base tracking-wide">Zettana</span>
           </div>
           <div className="absolute bottom-0 left-[40px] w-40 h-20 bg-orange-500 rounded-tr-full z-10 opacity-90"></div>
      </div>
    </div>
  );
});

// --- Main App Component ---

const App: React.FC = () => {
  // Use lazy initialization for data to avoid parsing localStorage on every render
  const [data, setData] = useState<MonthData>(() => loadData());
  
  // Initialize view based on whether a plan is selected.
  const [currentView, setCurrentView] = useState<ViewState>(() => {
     const savedData = loadData();
     return savedData.selectedPlan ? ViewState.DASHBOARD : ViewState.PLAN_SELECTION;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false); // New state for modal
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'IDLE' | 'SENDING' | 'SENT'>('IDLE');
  
  const printRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Monitor plan changes. If plan becomes null, force view to selection.
  useEffect(() => {
    if (!data.selectedPlan) {
        setCurrentView(ViewState.PLAN_SELECTION);
    }
  }, [data.selectedPlan]);

  // Calculate Stats
  const stats: DashboardStats = useMemo(() => {
    if (!data.selectedPlan) return { 
        postsCompleted: 0, totalPosts: 0, reelsCompleted: 0, totalReels: 0, 
        storiesTotal: 0, commentsTotal: 0, progressPercentage: 0 
    };

    const plan = PLANS[data.selectedPlan];
    const totalPosts = plan.totalPosts;
    const totalReels = plan.totalReels;
    
    let postsCompleted = 0;
    let storiesTotal = 0;
    let commentsTotal = 0;

    data.weeks.forEach(week => {
      postsCompleted += week.posts.filter(p => p).length;
      storiesTotal += week.storiesCount;
      commentsTotal += week.commentsCount;
    });

    postsCompleted = Math.min(postsCompleted, totalPosts);
    const reelsCompleted = data.reels.slice(0, totalReels).filter(r => r).length;
    
    let postWeight = 0.6;
    let reelWeight = 0.2;
    let engagementWeight = 0.2;

    if (totalReels === 0) {
        postWeight = 0.8;
        reelWeight = 0;
        engagementWeight = 0.2;
    }

    const postProgress = (postsCompleted / totalPosts) * (postWeight * 100);
    const reelProgress = totalReels > 0 ? (reelsCompleted / totalReels) * (reelWeight * 100) : 0;
    const engagementProgress = (storiesTotal > 0 || commentsTotal > 0) ? (engagementWeight * 100) : 0;

    const progressPercentage = Math.min(100, Math.round(postProgress + reelProgress + engagementProgress));

    return {
      postsCompleted,
      totalPosts,
      reelsCompleted,
      totalReels,
      storiesTotal,
      commentsTotal,
      progressPercentage
    };
  }, [data]);

  // Save data on change
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Handlers
  const handleSelectPlan = (planId: PlanType) => {
      setData(prev => ({ ...prev, selectedPlan: planId }));
      setCurrentView(ViewState.DASHBOARD);
  };

  const togglePost = (weekId: number, postIndex: number) => {
    const newWeeks = data.weeks.map(week => {
      if (week.id === weekId) {
        const newPosts = [...week.posts];
        newPosts[postIndex] = !newPosts[postIndex];
        return { ...week, posts: newPosts };
      }
      return week;
    });
    setData({ ...data, weeks: newWeeks });
  };

  const updateCount = (weekId: number, field: 'storiesCount' | 'commentsCount', value: number) => {
    const newWeeks = data.weeks.map(week => {
      if (week.id === weekId) {
        return { ...week, [field]: Math.max(0, value) };
      }
      return week;
    });
    setData({ ...data, weeks: newWeeks });
  };

  const toggleReel = (index: number) => {
    const newReels = [...data.reels];
    newReels[index] = !newReels[index];
    setData({ ...data, reels: newReels });
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    const observation = await generateMonthlyObservation(stats, data.monthName);
    setData(prev => ({ ...prev, aiObservation: observation }));
    setIsGeneratingAI(false);
  };

  const handleSign = (dataUrl: string) => {
    setData(prev => ({
        ...prev,
        clientSignature: dataUrl,
        signatureDate: new Date().toISOString()
    }));
  };

  const handleClearSignature = () => {
      setData(prev => ({
          ...prev,
          clientSignature: null,
          signatureDate: null
      }));
  }

  // --- REPLACED: New Reset Logic with Modal ---
  const handleResetClick = () => {
    setIsResetModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleConfirmReset = () => {
    // 1. Get the pristine default data
    const cleanData = clearData();
    
    // 2. Update React State immediately (triggers re-render)
    setData(cleanData);
    
    // 3. Force the view to Plan Selection immediately
    setCurrentView(ViewState.PLAN_SELECTION);
    
    // 4. Close modal
    setIsResetModalOpen(false);
  };

  const simulateEmailSend = () => {
    if (!data.clientSignature) {
        alert("El cliente debe firmar el reporte antes de enviarlo.");
        return;
    }
    setEmailStatus('SENDING');
    setTimeout(() => {
        setEmailStatus('SENT');
        setTimeout(() => setEmailStatus('IDLE'), 3000);
    }, 2000);
  };

  const exportPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPDF(true);
    try {
        const element = printRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Reporte_SocialTrack_${data.monthName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
        console.error("Error generating PDF", error);
        alert("Hubo un error al generar el PDF.");
    } finally {
        setIsGeneratingPDF(false);
    }
  };

  const exportWord = async () => {
    setIsGeneratingWord(true);
    try {
        const plan = data.selectedPlan ? PLANS[data.selectedPlan] : PLANS.GROWTH;

        let signatureImageRun = new TextRun("");
        if (data.clientSignature) {
            try {
                const response = await fetch(data.clientSignature);
                const arrayBuffer = await response.arrayBuffer();
                signatureImageRun = new ImageRun({
                    data: arrayBuffer,
                    transformation: { width: 150, height: 75 },
                    type: 'png'
                });
            } catch (e) {
                console.error("Error loading signature for Word", e);
            }
        }

        let chartImageRun = new Paragraph("");
        if (chartRef.current) {
            try {
                const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
                const chartData = canvas.toDataURL('image/png');
                const response = await fetch(chartData);
                const buffer = await response.arrayBuffer();
                chartImageRun = new Paragraph({
                    children: [
                        new ImageRun({
                            data: buffer,
                            transformation: { width: 500, height: 300 },
                            type: 'png'
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                });
            } catch (e) { console.error("Error capturing chart", e); }
        }

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({ text: "ADYROM", font: "Montserrat", size: 20, bold: true, color: "000000" }),
                            ],
                            alignment: AlignmentType.RIGHT,
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "saftelmah", font: "Playfair Display", size: 64, bold: true, color: "6B21A8" }),
                            ],
                            alignment: AlignmentType.RIGHT,
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "por zambtechnology", font: "Playfair Display", size: 24, italics: true, color: "6B21A8" }),
                            ],
                            alignment: AlignmentType.RIGHT,
                            spacing: { after: 400 }
                        }),
                        new Paragraph({
                            text: "REPORTE MENSUAL",
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.LEFT,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Periodo: ", bold: true }),
                                new TextRun({ text: data.monthName.toUpperCase(), color: "6B21A8" }),
                                new TextRun({ text: "\t\tPlan: ", bold: true }),
                                new TextRun({ text: plan.name, color: "000000" }),
                                new TextRun({ text: "\t\tCumplimiento: ", bold: true }),
                                new TextRun({ text: `${stats.progressPercentage}%`, color: "F97316", bold: true }),
                            ],
                            heading: HeadingLevel.HEADING_2,
                            spacing: { after: 300 }
                        }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ text: "ACTIVIDAD", bold: true })] }),
                                        new TableCell({ children: [new Paragraph({ text: "META", bold: true, alignment: AlignmentType.CENTER })] }),
                                        new TableCell({ children: [new Paragraph({ text: "REALIZADO", bold: true, alignment: AlignmentType.CENTER })] }),
                                        new TableCell({ children: [new Paragraph({ text: "ESTADO", bold: true, alignment: AlignmentType.CENTER })] }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Publicaciones")] }),
                                        new TableCell({ children: [new Paragraph({ text: plan.totalPosts.toString(), alignment: AlignmentType.CENTER })] }),
                                        new TableCell({ children: [new Paragraph({ text: stats.postsCompleted.toString(), alignment: AlignmentType.CENTER })] }),
                                        new TableCell({ children: [new Paragraph({ text: stats.postsCompleted >= plan.totalPosts ? "Completado" : "Pendiente", alignment: AlignmentType.CENTER })] }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Reels")] }),
                                        new TableCell({ children: [new Paragraph({ text: plan.totalReels.toString(), alignment: AlignmentType.CENTER })] }),
                                        new TableCell({ children: [new Paragraph({ text: stats.reelsCompleted.toString(), alignment: AlignmentType.CENTER })] }),
                                        new TableCell({ children: [new Paragraph({ text: stats.reelsCompleted >= plan.totalReels ? "Completado" : "Pendiente", alignment: AlignmentType.CENTER })] }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Historias")] }),
                                        new TableCell({ children: [new Paragraph({ text: "-", alignment: AlignmentType.CENTER })] }),
                                        new TableCell({ children: [new Paragraph({ text: stats.storiesTotal.toString(), alignment: AlignmentType.CENTER })] }),
                                        new TableCell({ children: [new Paragraph({ text: "-", alignment: AlignmentType.CENTER })] }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Respuestas")] }),
                                        new TableCell({ children: [new Paragraph({ text: "-", alignment: AlignmentType.CENTER })] }),
                                        new TableCell({ children: [new Paragraph({ text: stats.commentsTotal.toString(), alignment: AlignmentType.CENTER })] }),
                                        new TableCell({ children: [new Paragraph({ text: "-", alignment: AlignmentType.CENTER })] }),
                                    ],
                                }),
                            ],
                        }),
                        new Paragraph({ text: "", spacing: { after: 300 } }),
                        new Paragraph({
                            text: "GRÁFICA DE PROGRESO Y ACTIVIDAD",
                            heading: HeadingLevel.HEADING_3,
                            spacing: { after: 100 }
                        }),
                        chartImageRun,
                        new Paragraph({
                            text: "OBSERVACIONES ESTRATÉGICAS",
                            heading: HeadingLevel.HEADING_3,
                            spacing: { after: 100 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: data.aiObservation || "Sin observaciones.", italics: true })
                            ],
                            spacing: { after: 400 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Conformidad del Cliente", bold: true, size: 24 }),
                            ],
                            alignment: AlignmentType.RIGHT,
                            spacing: { after: 100 }
                        }),
                        new Paragraph({
                            children: [
                                data.clientSignature ? signatureImageRun : new TextRun(""),
                            ],
                            alignment: AlignmentType.RIGHT,
                        }),
                         new Paragraph({
                            children: [
                                new TextRun({ text: "FIRMADO DIGITALMENTE", size: 16, color: "888888" }),
                            ],
                            alignment: AlignmentType.RIGHT,
                        }),
                         new Paragraph({
                            children: [
                                new TextRun({ text: data.signatureDate ? new Date(data.signatureDate).toLocaleString() : "", size: 16, color: "888888" }),
                            ],
                            alignment: AlignmentType.RIGHT,
                        }),
                    ],
                },
            ],
        });
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_${data.monthName.replace(/\s+/g, '_')}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Error generating Word doc:", e);
        alert("Hubo un error generando el archivo Word.");
    } finally {
        setIsGeneratingWord(false);
    }
  };

  // --- Views ---

  const renderPlanSelection = () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
             <div className="flex items-center justify-center gap-3 text-indigo-600 mb-4">
                <LayoutDashboard size={48} />
                <span className="font-bold text-3xl font-['Montserrat']">SocialTrack</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 font-['Playfair_Display'] mb-3">Selecciona tu Plan</h1>
            <p className="text-slate-500 font-['Montserrat']">Elige el plan de gestión para comenzar a registrar actividades</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
            {/* Presencia Digital */}
            <div 
                className="bg-white rounded-2xl shadow-xl border-t-4 border-slate-300 p-8 flex flex-col relative hover:-translate-y-3 hover:shadow-2xl hover:border-slate-400 transition-all duration-300 animate-in slide-in-from-bottom-8 fade-in fill-mode-forwards"
                style={{ animationDelay: '100ms' }}
            >
                <h3 className="text-xl font-bold text-slate-800 font-['Montserrat']">Presencia Digital</h3>
                <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold text-slate-900">$99</span>
                    <span className="text-slate-500">/mes</span>
                </div>
                <div className="flex-1 space-y-4 mb-8">
                    {PLANS.BASIC.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                            <Check className="text-indigo-500 flex-shrink-0" size={18} />
                            <span>{feature}</span>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => handleSelectPlan('BASIC')}
                    className="w-full py-3 rounded-xl border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-900 hover:text-white transition-all uppercase tracking-wide text-sm"
                >
                    Solicitar
                </button>
            </div>

            {/* Growth */}
            <div 
                className="bg-white rounded-2xl shadow-2xl border-t-4 border-indigo-500 p-8 flex flex-col relative transform md:-translate-y-4 hover:-translate-y-6 hover:shadow-indigo-200 transition-all duration-300 animate-in slide-in-from-bottom-8 fade-in fill-mode-forwards"
                style={{ animationDelay: '200ms' }}
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                    Recomendado
                </div>
                <h3 className="text-xl font-bold text-indigo-600 font-['Montserrat'] flex items-center gap-2">
                    <Zap size={20} className="fill-current"/> Crecimiento
                </h3>
                <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold text-slate-900">$250</span>
                    <span className="text-slate-500">/mes</span>
                </div>
                <div className="flex-1 space-y-4 mb-8">
                    {PLANS.GROWTH.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                            <Check className="text-indigo-500 flex-shrink-0" size={18} />
                            <span>{feature}</span>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => handleSelectPlan('GROWTH')}
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all uppercase tracking-wide text-sm"
                >
                    Impulsar Marca
                </button>
            </div>

            {/* Authority */}
            <div 
                className="bg-white rounded-2xl shadow-xl border-t-4 border-orange-500 p-8 flex flex-col relative hover:-translate-y-3 hover:shadow-2xl hover:border-orange-400 transition-all duration-300 animate-in slide-in-from-bottom-8 fade-in fill-mode-forwards"
                style={{ animationDelay: '300ms' }}
            >
                 <h3 className="text-xl font-bold text-orange-600 font-['Montserrat'] flex items-center gap-2">
                    <Crown size={20} className="fill-current"/> Dominio
                </h3>
                <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold text-slate-900">$450</span>
                    <span className="text-slate-500">/mes</span>
                </div>
                <div className="flex-1 space-y-4 mb-8">
                     {PLANS.AUTHORITY.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                            <Star className="text-orange-500 flex-shrink-0 fill-orange-500" size={14} />
                            <span>{feature}</span>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => handleSelectPlan('AUTHORITY')}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:shadow-lg transition-all uppercase tracking-wide text-sm"
                >
                    Dominar
                </button>
            </div>
        </div>
    </div>
  );

  const renderDashboard = () => {
    // Transform data for chart
    const chartData = data.weeks.map(week => ({
        ...week,
        postsCount: week.posts.filter(p => p).length
    }));

    return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow group">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <ImageIcon size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium font-['Montserrat']">Publicaciones</p>
            <div className="flex items-baseline space-x-1">
                <h3 className="text-2xl font-bold text-slate-800">{stats.postsCompleted}</h3>
                <span className="text-xs text-slate-400">/ {stats.totalPosts}</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow group">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Video size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium font-['Montserrat']">Reels</p>
            <div className="flex items-baseline space-x-1">
                <h3 className="text-2xl font-bold text-slate-800">{stats.reelsCompleted}</h3>
                <span className="text-xs text-slate-400">/ {stats.totalReels}</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow group">
          <div className="p-3 bg-pink-50 text-pink-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Share2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium font-['Montserrat']">Historias</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.storiesTotal}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow group">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <MessageCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium font-['Montserrat']">Respuestas</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.commentsTotal}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 font-['Montserrat'] flex items-center gap-2">
                    <TrendingUp size={20} className="text-indigo-500"/> Progreso Mensual
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold transition-colors duration-500 ${stats.progressPercentage === 100 ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {stats.progressPercentage}% Completado
                </span>
            </div>
            
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-8 shadow-inner">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out relative"
                    style={{ width: `${stats.progressPercentage}%` }}
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-white opacity-20 animate-pulse"></div>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="id" 
                            tickFormatter={(val) => `Sem ${val}`} 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Montserrat' }}
                            dy={10}
                        />
                        <YAxis hide />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'Montserrat' }}
                        />
                        <Bar dataKey="postsCount" name="Publicaciones" fill="#6366f1" stackId="a" radius={[0,0,4,4]} animationDuration={1500} />
                        <Bar dataKey="storiesCount" name="Historias" fill="#f472b6" stackId="a" radius={[0,0,0,0]} animationDuration={1500} />
                        <Bar dataKey="commentsCount" name="Respuestas" fill="#fbbf24" stackId="a" radius={[4,4,0,0]} animationDuration={1500} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2 font-['Montserrat']">Actividad e Interacción por Semana</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 font-['Montserrat']">Estado del Servicio</h3>
                <div className="space-y-4">
                     <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                        <span className="text-sm font-medium text-slate-600">Plan Actual</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800 capitalize font-['Montserrat']">
                                 {data.selectedPlan ? PLANS[data.selectedPlan].name : 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-indigo-50 transition-colors">
                        <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Mes Actual</span>
                        <span className="text-sm font-bold text-indigo-600 capitalize font-['Montserrat']">{data.monthName}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-orange-50 transition-colors">
                        <span className="text-sm font-medium text-slate-600 group-hover:text-orange-600 transition-colors">Reels Pendientes</span>
                        <span className="text-sm font-bold text-slate-800">{stats.totalReels - stats.reelsCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-blue-50 transition-colors">
                        <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Posts Pendientes</span>
                        <span className="text-sm font-bold text-slate-800">{stats.totalPosts - stats.postsCompleted}</span>
                    </div>
                </div>
            </div>
            
            <div className="space-y-3 mt-6">
                <button 
                    onClick={() => setCurrentView(ViewState.TRACKER)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 shadow-lg shadow-indigo-200"
                >
                    <CalendarCheck size={18} />
                    <span>Actualizar Actividades</span>
                </button>
                <button 
                    onClick={handleResetClick}
                    className="w-full bg-white border-2 border-slate-200 text-slate-600 font-semibold py-3 px-4 rounded-xl transition-all hover:border-red-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center space-x-2"
                >
                    <LogOut size={18} />
                    <span>Cambiar Plan / Salir</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
  };

  const renderTracker = () => {
    const currentPlan = data.selectedPlan ? PLANS[data.selectedPlan] : PLANS.GROWTH;
    
    return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 font-['Montserrat']">Registro Semanal</h2>
            <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-medium border border-indigo-100">
                {stats.postsCompleted} / {stats.totalPosts} Posts
            </div>
        </div>

        {/* Reels Section - Only show if plan has reels */}
        {currentPlan.totalReels > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-md font-semibold text-slate-700 mb-4 flex items-center space-x-2 font-['Montserrat']">
                    <Video size={20} className="text-purple-500" />
                    <span>Reels Mensuales ({currentPlan.totalReels})</span>
                </h3>
                <div className="flex space-x-4 overflow-x-auto pb-2">
                    {data.reels.slice(0, currentPlan.totalReels).map((isDone, idx) => (
                        <button
                            key={`reel-${idx}`}
                            onClick={() => toggleReel(idx)}
                            className={`
                                min-w-[120px] flex-1 h-20 rounded-xl border-2 flex items-center justify-center space-x-2 transition-all duration-300
                                ${isDone 
                                    ? 'bg-purple-50 border-purple-500 text-purple-700 scale-[1.02] shadow-sm' 
                                    : 'bg-slate-50 border-dashed border-slate-300 text-slate-400 hover:bg-slate-100 hover:border-slate-400'}
                            `}
                        >
                            {isDone ? <CheckCircle2 size={28} className="animate-in zoom-in spin-in-90 duration-300" /> : <Circle size={28} />}
                            <span className="font-medium text-lg">Reel {idx + 1}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Weekly Tabs/Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.weeks.map((week, i) => {
                // Determine how many posts to show for this week based on plan config
                const postsToShow = currentPlan.postsPerWeek;
                
                return (
                <div key={week.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
                        <span className="text-slate-900 font-bold font-['Montserrat']">Semana {week.id}</span>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${week.posts.slice(0, postsToShow).every(Boolean) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {week.posts.slice(0, postsToShow).filter(Boolean).length}/{postsToShow} Posts
                        </span>
                    </div>

                    {/* Posts Checkboxes */}
                    <div className="mb-6 space-y-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-['Montserrat']">Publicaciones</p>
                        {week.posts.slice(0, postsToShow).map((isDone, idx) => (
                            <div 
                                key={`week-${week.id}-post-${idx}`} 
                                onClick={() => togglePost(week.id, idx)}
                                className={`
                                    flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border
                                    ${isDone ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}
                                `}
                            >
                                <div className={`mr-3 transition-colors ${isDone ? 'text-indigo-600' : 'text-slate-300'}`}>
                                    {isDone ? <CheckCircle2 size={20} className="animate-in zoom-in" /> : <Circle size={20} />}
                                </div>
                                <span className={`text-sm ${isDone ? 'text-indigo-900 font-medium' : 'text-slate-600'}`}>
                                    Post {idx + 1}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Counters */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 font-['Montserrat']">Historias</label>
                            <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
                                <button 
                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white rounded shadow-sm disabled:opacity-50 transition-colors"
                                    onClick={() => updateCount(week.id, 'storiesCount', week.storiesCount - 1)}
                                    disabled={week.storiesCount <= 0}
                                >-</button>
                                <input 
                                    type="number" 
                                    readOnly 
                                    className="w-full text-center bg-transparent font-bold text-slate-700 text-sm focus:outline-none" 
                                    value={week.storiesCount} 
                                />
                                <button 
                                    className="w-8 h-8 flex items-center justify-center text-indigo-600 hover:bg-white rounded shadow-sm transition-colors hover:text-indigo-800"
                                    onClick={() => updateCount(week.id, 'storiesCount', week.storiesCount + 1)}
                                >+</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 font-['Montserrat']">Respuestas</label>
                            <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
                                <button 
                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white rounded shadow-sm disabled:opacity-50 transition-colors"
                                    onClick={() => updateCount(week.id, 'commentsCount', week.commentsCount - 1)}
                                    disabled={week.commentsCount <= 0}
                                >-</button>
                                <input 
                                    type="number" 
                                    readOnly 
                                    className="w-full text-center bg-transparent font-bold text-slate-700 text-sm focus:outline-none" 
                                    value={week.commentsCount} 
                                />
                                <button 
                                    className="w-8 h-8 flex items-center justify-center text-indigo-600 hover:bg-white rounded shadow-sm transition-colors hover:text-indigo-800"
                                    onClick={() => updateCount(week.id, 'commentsCount', week.commentsCount + 1)}
                                >+</button>
                            </div>
                        </div>
                    </div>
                </div>
            )})}
        </div>
    </div>
  );
  };

  const renderReport = () => (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Report Header */}
            <div className="bg-slate-900 text-white p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-16 -mt-16 animate-pulse"></div>
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold font-['Playfair_Display']">Reporte Mensual</h1>
                        <p className="text-indigo-200 mt-1 font-['Montserrat'] tracking-wide">Gestión de Redes Sociales</p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold text-indigo-400">{stats.progressPercentage}%</div>
                        <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Cumplimiento</div>
                    </div>
                </div>
                <div className="mt-8 flex gap-8 text-sm relative z-10">
                    <div>
                        <span className="block text-slate-500 text-xs uppercase tracking-wide">Periodo</span>
                        <span className="font-semibold capitalize text-lg">{data.monthName}</span>
                    </div>
                    <div>
                        <span className="block text-slate-500 text-xs uppercase tracking-wide">Plan</span>
                        <span className="font-semibold capitalize text-lg">{data.selectedPlan ? PLANS[data.selectedPlan].name : 'N/A'}</span>
                    </div>
                    <div>
                        <span className="block text-slate-500 text-xs uppercase tracking-wide">Fecha Emisión</span>
                        <span className="font-semibold text-lg">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Summary Table */}
            <div className="p-8">
                <h3 className="text-slate-800 font-bold mb-4 font-['Montserrat']">Resumen de Actividades</h3>
                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium font-['Montserrat']">
                            <tr>
                                <th className="px-6 py-5">Actividad</th>
                                <th className="px-6 py-5 text-center">Meta</th>
                                <th className="px-6 py-5 text-center">Realizado</th>
                                <th className="px-6 py-5 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-100 even:bg-slate-50 transition-colors">
                                <td className="px-6 py-5 font-medium text-slate-800">Publicaciones (Feed)</td>
                                <td className="px-6 py-5 text-center text-slate-500">{stats.totalPosts}</td>
                                <td className="px-6 py-5 text-center font-bold text-slate-700">{stats.postsCompleted}</td>
                                <td className="px-6 py-5 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${stats.postsCompleted >= stats.totalPosts ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {stats.postsCompleted >= stats.totalPosts ? 'Completado' : 'En Progreso'}
                                    </span>
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-100 even:bg-slate-50 transition-colors">
                                <td className="px-6 py-5 font-medium text-slate-800">Reels (Video)</td>
                                <td className="px-6 py-5 text-center text-slate-500">{stats.totalReels}</td>
                                <td className="px-6 py-5 text-center font-bold text-slate-700">{stats.reelsCompleted}</td>
                                <td className="px-6 py-5 text-center">
                                     {stats.totalReels > 0 ? (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${stats.reelsCompleted >= stats.totalReels ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {stats.reelsCompleted >= stats.totalReels ? 'Completado' : 'En Progreso'}
                                        </span>
                                     ) : (
                                        <span className="text-xs text-slate-400">N/A</span>
                                     )}
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-100 even:bg-slate-50 transition-colors">
                                <td className="px-6 py-5 font-medium text-slate-800">Historias</td>
                                <td className="px-6 py-5 text-center text-slate-400">-</td>
                                <td className="px-6 py-5 text-center font-bold text-slate-700">{stats.storiesTotal}</td>
                                <td className="px-6 py-5 text-center text-slate-400">-</td>
                            </tr>
                            <tr className="hover:bg-slate-100 even:bg-slate-50 transition-colors">
                                <td className="px-6 py-5 font-medium text-slate-800">Respuestas</td>
                                <td className="px-6 py-5 text-center text-slate-400">-</td>
                                <td className="px-6 py-5 text-center font-bold text-slate-700">{stats.commentsTotal}</td>
                                <td className="px-6 py-5 text-center text-slate-400">-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* AI Observations */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-slate-800 font-bold flex items-center gap-2 font-['Montserrat']">
                            <Sparkles size={18} className="text-indigo-500"/>
                            Observaciones Finales
                        </h3>
                        <button 
                            onClick={handleGenerateAI}
                            disabled={isGeneratingAI}
                            className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 transition-colors"
                        >
                            {isGeneratingAI ? <RefreshCw className="animate-spin" size={14}/> : <Sparkles size={14} />}
                            {data.aiObservation ? 'Regenerar con IA' : 'Generar con IA'}
                        </button>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 text-indigo-900 text-sm leading-relaxed shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
                        {data.aiObservation ? (
                            <p className="relative z-10">{data.aiObservation}</p>
                        ) : (
                            <p className="text-indigo-400 italic relative z-10">Haz clic en "Generar con IA" para obtener un análisis estratégico automático de este mes...</p>
                        )}
                    </div>
                </div>

                {/* Signature Area */}
                <div className="mt-8 border-t border-slate-100 pt-8">
                    <h3 className="text-slate-800 font-bold mb-4 font-['Montserrat']">Aprobación del Cliente</h3>
                    {data.clientSignature ? (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block relative group transition-all hover:shadow-md">
                            <img src={data.clientSignature} alt="Firma cliente" className="h-24 opacity-80" />
                            <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-500 font-mono">
                                Firmado digitalmente: {new Date(data.signatureDate!).toLocaleString()}
                            </div>
                            <button 
                                onClick={handleClearSignature}
                                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                title="Borrar firma"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-slate-500 mb-2">Por favor, firme en el recuadro para validar este reporte.</p>
                            <div className="max-w-md">
                                <SignaturePad onSave={handleSign} onClear={handleClearSignature} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions Footer */}
            <div className="bg-slate-50 p-6 border-t border-slate-200 flex flex-col md:flex-row gap-4 justify-end">
                <div className="flex gap-2">
                    <button 
                        onClick={exportWord}
                        disabled={isGeneratingWord}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                         {isGeneratingWord ? <RefreshCw className="animate-spin" size={16} /> : <FileText size={16} />} 
                         {isGeneratingWord ? 'Generando...' : 'Word'}
                    </button>
                    <button 
                        onClick={exportPDF}
                        disabled={isGeneratingPDF}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {isGeneratingPDF ? <RefreshCw className="animate-spin" size={16} /> : <FileJson size={16} />} 
                        {isGeneratingPDF ? 'Generando...' : 'PDF (Diseño Pro)'}
                    </button>
                </div>
                <button 
                    onClick={simulateEmailSend}
                    disabled={emailStatus !== 'IDLE' || !data.clientSignature}
                    className={`
                        flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-all shadow-lg shadow-indigo-200 active:scale-95
                        ${!data.clientSignature ? 'bg-slate-300 cursor-not-allowed shadow-none' : 
                          emailStatus === 'SENT' ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}
                    `}
                >
                    {emailStatus === 'SENDING' ? (
                        <>Enviando...</>
                    ) : emailStatus === 'SENT' ? (
                        <><CheckCircle2 size={18} /> Enviado</>
                    ) : (
                        <><Send size={18} /> Enviar Reporte</>
                    )}
                </button>
            </div>
        </div>
    </div>
  );

  // --- Layout ---

  if (currentView === ViewState.PLAN_SELECTION) {
      return renderPlanSelection();
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-0 font-['Inter']">
      
      {/* Hidden Print Template - Positioned off-screen for html2canvas */}
      <div className="fixed top-0 left-[-9999px] z-[-1]">
        <PrintTemplate ref={printRef} data={data} stats={stats} />
      </div>

       {/* Hidden Chart Template - Positioned off-screen for html2canvas */}
       <div className="fixed top-0 left-[-9999px] z-[-1]">
        <ChartExportTemplate ref={chartRef} data={data} stats={stats} />
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen fixed top-0 left-0 z-10">
        <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2 text-indigo-600">
                <LayoutDashboard size={28} />
                <span className="font-bold text-xl tracking-tight text-slate-900 font-['Montserrat']">SocialTrack</span>
            </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <button 
                title="Dashboard"
                onClick={() => setCurrentView(ViewState.DASHBOARD)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${currentView === ViewState.DASHBOARD ? 'bg-indigo-50 text-indigo-700 translate-x-1' : 'text-slate-600 hover:bg-slate-50 hover:translate-x-1'}`}
            >
                <BarChart3 size={20} />
                <span>Dashboard</span>
            </button>
            <button 
                title="Actividades"
                onClick={() => setCurrentView(ViewState.TRACKER)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${currentView === ViewState.TRACKER ? 'bg-indigo-50 text-indigo-700 translate-x-1' : 'text-slate-600 hover:bg-slate-50 hover:translate-x-1'}`}
            >
                <CalendarCheck size={20} />
                <span>Actividades</span>
            </button>
            <button 
                title="Reportes"
                onClick={() => setCurrentView(ViewState.REPORT)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${currentView === ViewState.REPORT ? 'bg-indigo-50 text-indigo-700 translate-x-1' : 'text-slate-600 hover:bg-slate-50 hover:translate-x-1'}`}
            >
                <FileText size={20} />
                <span>Reportes</span>
            </button>
        </nav>
        <div className="p-4 border-t border-slate-100">
            <button 
                title="Cambiar Plan / Reiniciar"
                onClick={handleResetClick}
                className="w-full flex items-center justify-center space-x-2 text-xs text-red-500 hover:bg-red-50 py-3 rounded-lg transition-colors border border-transparent hover:border-red-100"
            >
                <LogOut size={16} />
                <span className="font-medium">Cambiar Plan</span>
            </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 fixed top-0 w-full z-20 flex justify-between items-center">
        <div className="flex items-center gap-2 text-indigo-600">
            <LayoutDashboard size={24} />
            <span className="font-bold text-lg text-slate-900 font-['Montserrat']">SocialTrack</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
            {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-10 md:hidden animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute top-16 left-0 w-full bg-white border-b border-slate-200 p-4 space-y-2 shadow-xl animate-in slide-in-from-top-5" onClick={e => e.stopPropagation()}>
                <button 
                    title="Dashboard"
                    onClick={() => { setCurrentView(ViewState.DASHBOARD); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 font-medium hover:bg-slate-50 rounded-lg"
                >
                    <BarChart3 size={20} /> Dashboard
                </button>
                <button 
                    title="Actividades"
                    onClick={() => { setCurrentView(ViewState.TRACKER); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 font-medium hover:bg-slate-50 rounded-lg"
                >
                    <CalendarCheck size={20} /> Actividades
                </button>
                <button 
                    title="Reportes"
                    onClick={() => { setCurrentView(ViewState.REPORT); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 font-medium hover:bg-slate-50 rounded-lg"
                >
                    <FileText size={20} /> Reportes
                </button>
                <div className="h-px bg-slate-100 my-2"></div>
                 <button 
                    title="Cambiar Plan / Reiniciar"
                    onClick={handleResetClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-lg"
                >
                    <LogOut size={20} /> Cambiar Plan / Salir
                </button>
            </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="pt-20 md:pt-8 md:pl-72 pr-4 md:pr-8 pl-4 min-h-screen">
        <div className="max-w-5xl mx-auto">
            {currentView === ViewState.DASHBOARD && renderDashboard()}
            {currentView === ViewState.TRACKER && renderTracker()}
            {currentView === ViewState.REPORT && renderReport()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 z-20 safe-area-pb">
        <button 
            title="Inicio"
            onClick={() => setCurrentView(ViewState.DASHBOARD)}
            className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${currentView === ViewState.DASHBOARD ? 'text-indigo-600' : 'text-slate-400'}`}
        >
            <BarChart3 size={24} />
            <span>Inicio</span>
        </button>
        <button 
            title="Tracker"
            onClick={() => setCurrentView(ViewState.TRACKER)}
            className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${currentView === ViewState.TRACKER ? 'text-indigo-600' : 'text-slate-400'}`}
        >
            <CalendarCheck size={24} />
            <span>Tracker</span>
        </button>
        <button 
            title="Reporte"
            onClick={() => setCurrentView(ViewState.REPORT)}
            className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${currentView === ViewState.REPORT ? 'text-indigo-600' : 'text-slate-400'}`}
        >
            <FileText size={24} />
            <span>Reporte</span>
        </button>
      </nav>

      {/* --- RESET CONFIRMATION MODAL --- */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 scale-100 border border-slate-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 font-['Montserrat']">¿Cambiar de Plan?</h3>
                    <p className="text-slate-600 mb-8 text-sm leading-relaxed">
                        Estás a punto de volver al inicio. <br/>
                        <span className="font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">Esta acción borrará todos los datos</span><br/>
                        del mes actual permanentemente.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setIsResetModalOpen(false)}
                            className="flex-1 py-3.5 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleConfirmReset}
                            className="flex-1 py-3.5 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 hover:shadow-red-300 transition-all transform active:scale-95"
                        >
                            Sí, Reiniciar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;