'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  Table,
  BarChart3,
  CalendarDays,
  AlertCircle,
  Clock,
  Zap,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface Fase {
  id: number;
  Projeto: string;
  Etapa: string;
  Data_Inicio: string;
  Data_Fim: string;
  Status: string;
}

type StatusType =
  | 'Nao Iniciada'
  | 'Dentro do Prazo'
  | 'Quase Atraso'
  | 'Atraso'
  | 'Finalizado';

// ============================================================
// Theme
// ============================================================

const STATUS_COLORS: Record<string, string> = {
  'Dentro do Prazo': '#22c55e',
  'Quase Atraso': '#f59e0b',
  'Atraso': '#ef4444',
  'Nao Iniciada': '#94a3b8',
  'Finalizado': '#3b82f6',
};

const STATUS_LIGHT_BG: Record<string, string> = {
  'Dentro do Prazo': '#dcfce7',
  'Quase Atraso': '#fef3c7',
  'Atraso': '#fee2e2',
  'Nao Iniciada': '#f1f5f9',
  'Finalizado': '#dbeafe',
};

const STATUS_TEXT: Record<string, string> = {
  'Dentro do Prazo': '#15803d',
  'Quase Atraso': '#b45309',
  'Atraso': '#dc2626',
  'Nao Iniciada': '#475569',
  'Finalizado': '#1d4ed8',
};

const STATUS_ORDER: StatusType[] = [
  'Nao Iniciada',
  'Dentro do Prazo',
  'Quase Atraso',
  'Atraso',
  'Finalizado',
];

// ============================================================
// Helpers
// ============================================================

function formatDate(d: string): string {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function calcularStatus(
  statusOriginal: string,
  dataInicio: string,
  dataFim: string,
  hojeRef: string
): StatusType {
  if (statusOriginal === 'Finalizado') return 'Finalizado';
  const inicio = new Date(dataInicio + 'T00:00:00');
  const fim = new Date(dataFim + 'T00:00:00');
  const hoje = new Date(hojeRef + 'T00:00:00');

  if (hoje < inicio) return 'Nao Iniciada';
  if (hoje > fim) return 'Atraso';
  const diff = Math.floor((fim.getTime() - hoje.getTime()) / 86400000);
  if (diff <= 2 && diff >= 0) return 'Quase Atraso';
  return 'Dentro do Prazo';
}

// ============================================================
// Gantt Chart Component
// ============================================================

function GanttChart({ fases }: { fases: Fase[] }) {
  if (fases.length === 0) return (
    <div className="flex items-center justify-center py-16 text-gray-400">
      <CalendarDays className="w-8 h-8 mr-2" />
      Nenhuma fase para exibir
    </div>
  );

  const allDates = fases.flatMap((f) => [
    new Date(f.Data_Inicio + 'T00:00:00').getTime(),
    new Date(f.Data_Fim + 'T00:00:00').getTime(),
  ]);
  const minDate = new Date(Math.min(...allDates));
  const totalDays = Math.ceil(Math.max(...allDates) - Math.min(...allDates)) / 86400000 + 1;

  const barHeight = 28;
  const rowGap = 8;
  const chartHeight = fases.length * (barHeight + rowGap) + 40;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width="100%"
        height={chartHeight}
        viewBox={`0 0 1000 ${chartHeight}`}
        className="min-w-[600px]"
      >
        {/* Date axis */}
        {[...Array(Math.ceil(totalDays / 3) + 1)].map((_, i) => {
          const x = (i * 3 / totalDays) * 780 + 210;
          const dayDate = new Date(minDate.getTime() + i * 3 * 86400000);
          return (
            <g key={i}>
              <line x1={x} y1={4} x2={x} y2={chartHeight - 16} stroke="#f1f5f9" strokeWidth={1} />
              <text x={x} y={chartHeight - 2} fontSize={9} fill="#94a3b8" textAnchor="middle">
                {dayDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {fases.map((fase, i) => {
          const start = new Date(fase.Data_Inicio + 'T00:00:00').getTime();
          const end = new Date(fase.Data_Fim + 'T00:00:00').getTime();
          const duration = Math.max((end - start) / 86400000 + 1, 1);
          const dayOffset = (start - minDate.getTime()) / 86400000;
          const x = (dayOffset / totalDays) * 750 + 220;
          const w = Math.max((duration / totalDays) * 750, 6);
          const y = i * (barHeight + rowGap) + 14;
          const color = STATUS_COLORS[fase.Status] || '#607D8B';
          const lightBg = STATUS_LIGHT_BG[fase.Status] || '#e5e7eb';

          return (
            <g key={fase.id}>
              {/* Label */}
              <text x={208} y={y + barHeight / 2 + 4} fontSize={10.5} fill="#475569" textAnchor="end" fontFamily="system-ui">
                {fase.Etapa.length > 24 ? fase.Etapa.slice(0, 22) + '...' : fase.Etapa}
              </text>
              {/* Background track */}
              <rect x={220} y={y} width={750} height={barHeight} rx={6} fill={lightBg} opacity={0.4} />
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={w}
                height={barHeight}
                rx={6}
                fill={color}
                opacity={0.9}
              />
              {/* Status text inside bar */}
              {w > 60 && (
                <text x={x + w / 2} y={y + barHeight / 2 + 3.5} fontSize={9} fill="white" textAnchor="middle" fontWeight="600" fontFamily="system-ui">
                  {fase.Status}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// Status Bar Chart
// ============================================================

function StatusBarChart({ fases }: { fases: Fase[] }) {
  const counts: Record<string, number> = {};
  STATUS_ORDER.forEach((s) => (counts[s] = 0));
  fases.forEach((f) => {
    if (counts[f.Status] !== undefined) counts[f.Status]++;
  });

  const data = STATUS_ORDER.map((s) => ({
    name: s,
    count: counts[s],
    fill: STATUS_COLORS[s],
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'system-ui' }}
          axisLine={false}
          tickLine={false}
          angle={-20}
          textAnchor="end"
          height={70}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            fontFamily: 'system-ui',
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value} fase(s)`, 'Quantidade']}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={56}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Status Summary Cards
// ============================================================

const STATUS_META: Record<string, { icon: any; label: string }> = {
  'Dentro do Prazo': { icon: CheckCircle, label: 'No prazo' },
  'Quase Atraso': { icon: Clock, label: 'Quase atraso' },
  'Atraso': { icon: AlertCircle, label: 'Atrasados' },
  'Finalizado': { icon: Zap, label: 'Finalizados' },
};

function StatusSummaryCards({ fases }: { fases: Fase[] }) {
  const counts: Record<string, number> = {};
  fases.forEach((f) => {
    counts[f.Status] = (counts[f.Status] || 0) + 1;
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATUS_ORDER.filter(s => s !== 'Nao Iniciada').map((status) => {
        const Meta = STATUS_META[status];
        if (!Meta) return null;
        const Icon = Meta.icon;
        const count = counts[status] || 0;
        return (
          <div
            key={status}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: STATUS_LIGHT_BG[status] }}>
                <Icon className="w-5 h-5" style={{ color: STATUS_TEXT[status] }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <p className="text-sm text-gray-500 mt-0.5">{Meta.label}</p>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Main Dashboard
// ============================================================

export default function Dashboard() {
  const [fases, setFases] = useState<Fase[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [hojeRef, setHojeRef] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDates, setEditDates] = useState({ inicio: '', fim: '' });
  const [showNewPhase, setShowNewPhase] = useState(false);
  const [newPhase, setNewPhase] = useState({ Etapa: '', Data_Inicio: '', Data_Fim: '' });
  const [activeTab, setActiveTab] = useState<'table' | 'gantt' | 'chart'>('table');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFases = useCallback(async () => {
    try {
      const res = await fetch('/api/fases');
      if (res.ok) {
        const data = await res.json();
        setFases(data);
        const projs = [...new Set(data.map((f: Fase) => f.Projeto))];
        setProjects(projs);
        if (projs.length > 0 && !selectedProject) {
          setSelectedProject(projs[0]);
        }
      }
    } catch {
      console.error('Erro ao carregar fases');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchFases();
  }, [fetchFases]);

  const projetoFases = fases
    .filter((f) => f.Projeto === selectedProject)
    .map((f) => ({
      ...f,
      Status: calcularStatus(f.Status, f.Data_Inicio, f.Data_Fim, hojeRef),
    }));

  // Actions
  const handleSaveDates = async (id: number, inicio: string, fim: string) => {
    await fetch(`/api/fases?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, Data_Inicio: inicio, Data_Fim: fim }),
    });
    setEditingId(null);
    fetchFases();
  };

  const handleFinalize = async (id: number) => {
    await fetch('/api/fases', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, Status: 'Finalizado' }),
    });
    fetchFases();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/fases?id=${id}`, { method: 'DELETE' });
    fetchFases();
  };

  const handleAddPhase = async () => {
    if (!newPhase.Etapa || !newPhase.Data_Inicio || !newPhase.Data_Fim) return;
    await fetch('/api/fases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newPhase, Projeto: selectedProject }),
    });
    setNewPhase({ Etapa: '', Data_Inicio: '', Data_Fim: '' });
    setShowNewPhase(false);
    fetchFases();
  };

  const handleReset = async () => {
    await fetch('/api/fases?action=seed', { method: 'POST' });
    fetchFases();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        let fasesImport: any[];
        if (file.name.endsWith('.csv')) {
          const text = ev.target?.result as string;
          const rows = text.split('\n').map((r) => r.split(/[;,]/));
          const headers = rows[0].map((h) => h.trim());
          fasesImport = rows.slice(1).map((row: string[]) => {
            const obj: any = {};
            headers.forEach((h, i) => (obj[h] = row[i]?.trim()));
            return obj;
          }).filter((r: any) => r.Projeto);
        } else {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          fasesImport = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        }
        fasesImport = fasesImport.map((f: any) => ({
          Projeto: f.Projeto || 'Projeto 1',
          Etapa: f.Etapa || '',
          Data_Inicio: f.Data_Inicio
            ? new Date(f.Data_Inicio).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          Data_Fim: f.Data_Fim
            ? new Date(f.Data_Fim).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          Status: f.Status || 'Nao Iniciada',
        }));
        await fetch('/api/fases?action=import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fases: fasesImport }),
        });
        fetchFases();
      } catch {
        console.error('Erro ao importar');
      }
    };
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const exportCSV = () => {
    const headers = ['Projeto,Etapa,Data_Inicio,Data_Fim,Status'];
    const rows = projetoFases.map(
      (f) => `${f.Projeto},${f.Etapa},${f.Data_Inicio},${f.Data_Fim},${f.Status}`
    );
    const csv = headers.concat(rows).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProject}_atualizado.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(projetoFases);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedProject);
    XLSX.writeFile(wb, `${selectedProject}_atualizado.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #fdf2f8 100%)' }}>
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-gray-100">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Controle de Producao</h1>
              <p className="text-xs text-gray-400">Dashboard Multi-Projeto</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2 shadow-sm">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">Ref:</span>
              <input
                type="date"
                value={hojeRef}
                onChange={(e) => setHojeRef(e.target.value)}
                className="text-sm text-gray-700 bg-transparent outline-none font-medium"
              />
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="relative w-9 h-9 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:border-gray-200 transition-colors"
            >
              <Upload className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6 items-start">
        {/* ===== SIDEBAR ===== */}
        <aside
          className={`w-64 flex-shrink-0 transition-all duration-300 ${
            sidebarOpen ? 'block' : 'hidden xl:block'
          }`}
        >
          <div className="sticky top-20 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Importar
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-sm font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                CSV ou Excel
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Exportar
              </h3>
              <button
                onClick={exportCSV}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-600 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Baixar CSV
              </button>
              <button
                onClick={exportExcel}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-600 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Baixar Excel
              </button>
            </div>

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Resetar Dados
            </button>

            {/* Mobile date */}
            <div className="sm:hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="text-xs text-gray-400 mb-1 block">Data de Referencia</label>
              <input
                type="date"
                value={hojeRef}
                onChange={(e) => setHojeRef(e.target.value)}
                className="w-full text-sm outline-none"
              />
            </div>
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Project header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Projeto Atual</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="text-lg font-bold text-gray-900 bg-transparent outline-none cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowNewPhase(!showNewPhase)}
                className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <Plus className="w-4 h-4" />
                Nova Fase
              </button>
            </div>

            {/* New phase form */}
            {showNewPhase && (
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    placeholder="Nome da Fase"
                    value={newPhase.Etapa}
                    onChange={(e) => setNewPhase({ ...newPhase, Etapa: e.target.value })}
                    className="col-span-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                  />
                  <input
                    type="date"
                    value={newPhase.Data_Inicio}
                    onChange={(e) => setNewPhase({ ...newPhase, Data_Inicio: e.target.value })}
                    className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                  />
                  <input
                    type="date"
                    value={newPhase.Data_Fim}
                    onChange={(e) => setNewPhase({ ...newPhase, Data_Fim: e.target.value })}
                    className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleAddPhase}
                    className="px-5 py-2 text-white rounded-xl text-sm font-semibold transition-colors"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setShowNewPhase(false)}
                    className="px-5 py-2 bg-white hover:bg-gray-50 border border-gray-100 text-gray-500 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status Summary Cards */}
          <StatusSummaryCards fases={projetoFases} />

          {/* Tab navigation */}
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1 w-fit">
            {[
              { key: 'table' as const, icon: Table, label: 'Tabela' },
              { key: 'gantt' as const, icon: CalendarDays, label: 'Gantt' },
              { key: 'chart' as const, icon: BarChart3, label: 'Grafico' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={activeTab === tab.key ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ===== TABLE TAB ===== */}
          {activeTab === 'table' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Etapa</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Inicio</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fim</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {projetoFases.map((fase) => {
                      const isEditing = editingId === fase.id;
                      return (
                        <tr key={fase.id} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="px-6 py-3.5 font-semibold text-gray-900 text-sm">
                            {fase.Etapa}
                          </td>
                          <td className="px-6 py-3.5 text-sm">
                            {isEditing ? (
                              <input
                                type="date"
                                value={editDates.inicio}
                                onChange={(e) => setEditDates({ ...editDates, inicio: e.target.value })}
                                className="border border-gray-200 rounded-lg px-2.5 py-1 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                              />
                            ) : (
                              <span className="text-gray-600">{formatDate(fase.Data_Inicio)}</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-sm">
                            {isEditing ? (
                              <input
                                type="date"
                                value={editDates.fim}
                                onChange={(e) => setEditDates({ ...editDates, fim: e.target.value })}
                                className="border border-gray-200 rounded-lg px-2.5 py-1 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                              />
                            ) : (
                              <span className="text-gray-600">{formatDate(fase.Data_Fim)}</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5">
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold"
                              style={{
                                backgroundColor: STATUS_LIGHT_BG[fase.Status] || '#f1f5f9',
                                color: STATUS_TEXT[fase.Status] || '#475569',
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[fase.Status] || '#607D8B' }} />
                              {fase.Status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!isEditing ? (
                                <button
                                  onClick={() => {
                                    setEditingId(fase.id);
                                    setEditDates({ inicio: fase.Data_Inicio, fim: fase.Data_Fim });
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleSaveDates(fase.id, editDates.inicio, editDates.fim)}
                                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-300 hover:text-emerald-500 transition-colors"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </>
                              )}
                              {fase.Status !== 'Finalizado' && (
                                <button
                                  onClick={() => handleFinalize(fase.id)}
                                  className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-300 hover:text-violet-500 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(fase.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {projetoFases.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                          Nenhuma fase encontrada para este projeto.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== GANTT TAB ===== */}
          {activeTab === 'gantt' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: STATUS_LIGHT_BG['Finalizado'] }}>
                  <CalendarDays className="w-4 h-4" style={{ color: STATUS_TEXT['Finalizado'] }} />
                </div>
                Cronograma do Projeto
              </h3>
              <GanttChart fases={projetoFases} />

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
                {STATUS_ORDER.map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                    <span className="text-xs text-gray-500 font-medium">{status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== CHART TAB ===== */}
          {activeTab === 'chart' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: STATUS_LIGHT_BG['Dentro do Prazo'] }}>
                  <BarChart3 className="w-4 h-4" style={{ color: STATUS_TEXT['Dentro do Prazo'] }} />
                </div>
                Distribuicao dos Status
              </h3>
              <p className="text-sm text-gray-400 mb-4">Quantidade de fases por status</p>
              <StatusBarChart fases={projetoFases} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
        <p className="text-xs text-gray-300">Controle de Processo de Producao</p>
      </footer>
    </div>
  );
}
