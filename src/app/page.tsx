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
  FileSpreadsheet,
  BarChart3,
  CalendarDays,
  AlertTriangle,
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
// Constants
// ============================================================

const STATUS_COLORS: Record<string, string> = {
  'Dentro do Prazo': '#4CAF50',
  'Quase Atraso': '#FFC107',
  'Atraso': '#F44336',
  'Nao Iniciada': '#90A4AE',
  'Finalizado': '#2196F3',
};

const STATUS_BADGE: Record<string, string> = {
  'Dentro do Prazo': 'bg-emerald-100 text-emerald-800',
  'Quase Atraso': 'bg-yellow-100 text-yellow-800',
  'Atraso': 'bg-red-100 text-red-800',
  'Nao Iniciada': 'bg-gray-200 text-gray-600',
  'Finalizado': 'bg-blue-100 text-blue-800',
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
  return date.toLocaleDateString('pt-BR');
}

function toDateInputVal(d: string): string {
  return d;
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
// Gantt Chart Component (pure CSS/SVG)
// ============================================================

function GanttChart({ fases }: { fases: Fase[] }) {
  if (fases.length === 0) return null;

  // Calculate date range
  const allDates = fases.flatMap((f) => [
    new Date(f.Data_Inicio + 'T00:00:00').getTime(),
    new Date(f.Data_Fim + 'T00:00:00').getTime(),
  ]);
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  const totalDays = Math.ceil(Math.max(...allDates) - Math.min(...allDates)) / 86400000 + 1;

  const barHeight = 32;
  const rowGap = 6;
  const chartWidth = '100%';
  const chartHeight = fases.length * (barHeight + rowGap) + 20;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} viewBox={`0 0 1000 ${chartHeight}`} className="min-w-[700px]">
        {/* Grid lines */}
        {[...Array(Math.ceil(totalDays / 5) + 1)].map((_, i) => {
          const x = (i * 5 / totalDays) * 900 + 50;
          const dayDate = new Date(minDate.getTime() + i * 5 * 86400000);
          return (
            <g key={i}>
              <line x1={x} y1={0} x2={x} y2={chartHeight} stroke="#e5e7eb" strokeWidth={1} />
              <text x={x} y={chartHeight - 2} fontSize={10} fill="#6b7280" textAnchor="middle">
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
          const x = (dayOffset / totalDays) * 820 + 170;
          const width = Math.max((duration / totalDays) * 820, 8);
          const y = i * (barHeight + rowGap) + 10;
          const color = STATUS_COLORS[fase.Status] || '#607D8B';

          return (
            <g key={fase.id}>
              <text x={160} y={y + barHeight / 2 + 4} fontSize={11} fill="#374151" textAnchor="end">
                {fase.Etapa.length > 28 ? fase.Etapa.slice(0, 26) + '...' : fase.Etapa}
              </text>
              <rect
                x={x}
                y={y}
                width={width}
                height={barHeight}
                rx={6}
                fill={color}
                opacity={0.85}
              />
              {width > 50 && (
                <text x={x + width / 2} y={y + barHeight / 2 + 4} fontSize={10} fill="white" textAnchor="middle" fontWeight={500}>
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
    color: STATUS_COLORS[s],
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number) => [`${value} fase(s)`, 'Quantidade']}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={60}>
          {data.map((entry, index) => (
            <cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
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
  const [newPhase, setNewPhase] = useState({ Projeto: '', Etapa: '', Data_Inicio: '', Data_Fim: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch fases
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
    } catch (err) {
      console.error('Erro ao carregar fases:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchFases();
  }, [fetchFases]);

  // Computed
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
    setNewPhase({ Projeto: '', Etapa: '', Data_Inicio: '', Data_Fim: '' });
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
          fasesImport = rows.slice(1).map((row) => {
            const obj: any = {};
            headers.forEach((h, i) => (obj[h] = row[i]?.trim()));
            return obj;
          }).filter((r) => r.Projeto);
        } else {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          fasesImport = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        }

        // Convert dates to ISO
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
      } catch (err) {
        console.error('Erro ao importar:', err);
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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Dashboard Multi-Projeto</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Referencia:</span>
              <input
                type="date"
                value={hojeRef}
                onChange={(e) => setHojeRef(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Upload className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Sidebar */}
        <aside
          className={`w-72 flex-shrink-0 transition-all duration-300 ${
            sidebarOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24 space-y-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Importar / Exportar
            </h2>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importar CSV / Excel
            </button>

            <button
              onClick={exportCSV}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>

            <button
              onClick={exportExcel}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </button>

            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Resetar Dados
              </button>
            </div>

            {/* Mobile date picker */}
            <div className="sm:hidden border-t border-gray-200 pt-4">
              <label className="text-sm text-gray-500 mb-1 block">Data de Referencia</label>
              <input
                type="date"
                value={hojeRef}
                onChange={(e) => setHojeRef(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Project selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Projeto</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-w-[200px]"
                >
                  {projects.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowNewPhase(!showNewPhase)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors self-start"
              >
                <Plus className="w-4 h-4" />
                Nova Fase
              </button>
            </div>

            {/* New phase form */}
            {showNewPhase && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Nome da Fase"
                    value={newPhase.Etapa}
                    onChange={(e) => setNewPhase({ ...newPhase, Etapa: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newPhase.Data_Inicio}
                      onChange={(e) => setNewPhase({ ...newPhase, Data_Inicio: e.target.value })}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Inicio"
                    />
                    <input
                      type="date"
                      value={newPhase.Data_Fim}
                      onChange={(e) => setNewPhase({ ...newPhase, Data_Fim: e.target.value })}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Fim"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddPhase}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setShowNewPhase(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Phases table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">
                Fases do {selectedProject}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Etapa</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Inicio</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Fim</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projetoFases.map((fase) => {
                    const isEditing = editingId === fase.id;

                    return (
                      <tr key={fase.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900">
                          {fase.Etapa}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editDates.inicio}
                              onChange={(e) => setEditDates({ ...editDates, inicio: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          ) : (
                            formatDate(fase.Data_Inicio)
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editDates.fim}
                              onChange={(e) => setEditDates({ ...editDates, fim: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          ) : (
                            formatDate(fase.Data_Fim)
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[fase.Status] || 'bg-gray-100 text-gray-600'}`}>
                            {fase.Status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isEditing ? (
                              <button
                                onClick={() => {
                                  setEditingId(fase.id);
                                  setEditDates({ inicio: fase.Data_Inicio, fim: fase.Data_Fim });
                                }}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Editar datas"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleSaveDates(fase.id, editDates.inicio, editDates.fim)}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
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
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                title="Finalizar"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(fase.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6">
            {/* Gantt */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Cronograma (Gantt)
              </h2>
              <GanttChart fases={projetoFases} />
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Distribuicao dos Status
              </h2>
              <StatusBarChart fases={projetoFases} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
