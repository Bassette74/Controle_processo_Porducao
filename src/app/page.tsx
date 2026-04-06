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
  PieChart,
  Pie,
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle2,
  FileDown,
  FileUp,
  RotateCcw,
  CalendarDays,
  BarChart3,
  Columns3,
  Layers,
  Upload,
  Settings,
  Search,
  MoreHorizontal,
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

type StatusType = 'Nao Iniciada' | 'Dentro do Prazo' | 'Quase Atraso' | 'Atraso' | 'Finalizado';
type ViewType = 'table' | 'gantt' | 'chart';

// ============================================================
// Style System
// ============================================================

const ST = {
  colors: {
    dentro: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', solid: '#22c55e' },
    quase: { bg: '#fffbeb', border: '#fde68a', text: '#b45309', solid: '#f59e0b' },
    atraso: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', solid: '#ef4444' },
    nao: { bg: '#f9fafb', border: '#e5e7eb', text: '#6b7280', solid: '#9ca3af' },
    final: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', solid: '#3b82f6' },
  },
  status: (s: string) => {
    if (s === 'Dentro do Prazo') return ST.colors.dentro;
    if (s === 'Quase Atraso') return ST.colors.quase;
    if (s === 'Atraso') return ST.colors.atraso;
    if (s === 'Finalizado') return ST.colors.final;
    return ST.colors.nao;
  },
};

const STATUS_ORDER: StatusType[] = ['Nao Iniciada', 'Dentro do Prazo', 'Quase Atraso', 'Atraso', 'Finalizado'];

// ============================================================
// Utilities
// ============================================================

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function calcStatus(f: Fase, ref: string): StatusType {
  if (f.Status === 'Finalizado') return 'Finalizado';
  const inicio = new Date(f.Data_Inicio + 'T00:00:00');
  const fim = new Date(f.Data_Fim + 'T00:00:00');
  const hoje = new Date(ref + 'T00:00:00');
  if (hoje < inicio) return 'Nao Iniciada';
  if (hoje > fim) return 'Atraso';
  const diff = Math.floor((fim.getTime() - hoje.getTime()) / 86400000);
  if (diff <= 2 && diff >= 0) return 'Quase Atraso';
  return 'Dentro do Prazo';
}

// ============================================================
// Gantt Chart
// ============================================================

function GanttChart({ fases }: { fases: (Fase & { Status: StatusType })[] }) {
  if (!fases.length) return (
    <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
      <CalendarDays className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm">Nenhuma fase neste projeto</p>
    </div>
  );

  const allTimes = fases.flatMap(f => [
    new Date(f.Data_Inicio + 'T00:00:00').getTime(),
    new Date(f.Data_Fim + 'T00:00:00').getTime(),
  ]);
  const minT = Math.min(...allTimes);
  const totalDays = Math.ceil((Math.max(...allTimes) - minT) / 86400000) + 1;
  const bh = 30;
  const gap = 6;
  const h = fases.length * (bh + gap) + 36;

  return (
    <div className="overflow-x-auto">
      <svg width="100%" height={h} viewBox={`0 0 1000 ${h}`} className="min-w-[650px]">
        {[...Array(Math.ceil(totalDays / 3) + 1)].map((_, i) => {
          const x = (i * 3 / totalDays) * 760 + 230;
          const dt = new Date(minT + i * 3 * 86400000);
          return (
            <g key={i}>
              <line x1={x} y1={2} x2={x} y2={h - 16} stroke="#f5f5f5" strokeWidth={1} />
              <text x={x} y={h - 2} fontSize={9} fill="#a3a3a3" textAnchor="middle">
                {dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </text>
            </g>
          );
        })}
        {fases.map((f, i) => {
          const s = new Date(f.Data_Inicio + 'T00:00:00').getTime();
          const e = new Date(f.Data_Fim + 'T00:00:00').getTime();
          const dur = Math.max((e - s) / 86400000 + 1, 1);
          const off = (s - minT) / 86400000;
          const x = (off / totalDays) * 740 + 240;
          const w = Math.max((dur / totalDays) * 740, 6);
          const y = i * (bh + gap) + 10;
          const c = ST.status(f.Status);
          return (
            <g key={f.id}>
              <text x={226} y={y + bh / 2 + 3.5} fontSize={10.5} fill="#262626" textAnchor="end" fontWeight="500">
                {f.Etapa.length > 26 ? f.Etapa.slice(0, 24) + '..' : f.Etapa}
              </text>
              <rect x={x} y={y} width={w} height={bh} rx={6} fill={c.solid} />
              {w > 55 && (
                <text x={x + w / 2} y={y + bh / 2 + 3.5} fontSize={8.5} fill="white" textAnchor="middle" fontWeight="600">
                  {f.Status}
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
// Bar Chart
// ============================================================

function StatusBarChart({ fases }: { fases: (Fase & { Status: StatusType })[] }) {
  const cnt: Record<string, number> = {};
  STATUS_ORDER.forEach(s => cnt[s] = 0);
  fases.forEach(f => { if (cnt[f.Status] !== undefined) cnt[f.Status]++; });

  const data = STATUS_ORDER.map(s => ({
    name: s,
    value: cnt[s],
    fill: ST.status(s).solid,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={65} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: '#fafafa' }}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', fontFamily: 'inherit', fontSize: 12 }}
          formatter={(v: number) => [`${v} fase(s)`, 'Quantidade']}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={52}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Dashboard
// ============================================================

export default function Dashboard() {
  const [fases, setFases] = useState<Fase[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [project, setProject] = useState('');
  const [ref, setRef] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editD, setEditD] = useState({ i: '', f: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ etapa: '', ini: '', fim: '' });
  const [view, setView] = useState<ViewType>('table');
  const [search, setSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/fases');
      if (r.ok) {
        const d = await r.json();
        setFases(d);
        const p = [...new Set(d.map((f: Fase) => f.Projeto))];
        setProjects(p);
        if (p.length && !project) setProject(p[0]);
      }
    } catch {}
    setLoading(false);
  }, [project]);

  useEffect(() => { refresh(); }, [refresh]);

  const list = fases
    .filter(f => f.Projeto === project)
    .filter(f => search === '' || f.Etapa.toLowerCase().includes(search.toLowerCase()))
    .map(f => ({ ...f, Status: calcStatus(f, ref) }));

  const counts: Record<string, number> = {};
  list.forEach(f => { counts[f.Status] = (counts[f.Status] || 0) + 1; });

  const actions = {
    save: async (id: number) => {
      await fetch(`/api/fases?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, Data_Inicio: editD.i, Data_Fim: editD.f }) });
      setEditId(null);
      refresh();
    },
    done: async (id: number) => {
      await fetch('/api/fases', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, Status: 'Finalizado' }) });
      refresh();
    },
    del: async (id: number) => {
      await fetch(`/api/fases?id=${id}`, { method: 'DELETE' });
      refresh();
    },
    add: async () => {
      if (!form.etapa || !form.ini || !form.fim) return;
      await fetch('/api/fases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ Projeto: project, Etapa: form.etapa, Data_Inicio: form.ini, Data_Fim: form.fim }) });
      setForm({ etapa: '', ini: '', fim: '' });
      setShowForm(false);
      refresh();
    },
    reset: async () => {
      await fetch('/api/fases?action=seed', { method: 'POST' });
      refresh();
    },
    import: async (file: File) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          let data: any[];
          if (file.name.endsWith('.csv')) {
            const txt = ev.target?.result as string;
            const rows = txt.split('\n').map(r => r.split(/[;,]/));
            const hdr = rows[0].map(h => h.trim());
            data = rows.slice(1).filter(Boolean).map(row => {
              const o: any = {};
              hdr.forEach((h, i) => o[h] = row[i]?.trim());
              return o;
            });
          } else {
            const wb = XLSX.read(new Uint8Array(ev.target?.result as ArrayBuffer), { type: 'array' });
            data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
          }
          const mapped = data.map((d: any) => ({
            Projeto: d.Projeto || 'Projeto 1',
            Etapa: d.Etapa || '',
            Data_Inicio: d.Data_Inicio ? new Date(d.Data_Inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            Data_Fim: d.Data_Fim ? new Date(d.Data_Fim).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            Status: d.Status || 'Nao Iniciada',
          }));
          await fetch('/api/fases?action=import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fases: mapped }) });
          refresh();
        } catch {}
      };
      file.name.endsWith('.csv') ? reader.readAsText(file) : reader.readAsArrayBuffer(file);
      if (fileRef.current) fileRef.current.value = '';
    },
    exportCsv: () => {
      const hdr = 'Projeto,Etapa,Data_Inicio,Data_Fim,Status';
      const rows = list.map(f => `${f.Projeto},${f.Etapa},${f.Data_Inicio},${f.Data_Fim},${f.Status}`);
      const blob = new Blob(['\ufeff' + [hdr, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${project}.csv`; a.click();
    },
    exportXlsx: () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(list), project);
      XLSX.writeFile(wb, `${project}.xlsx`);
    },
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-3 text-xs text-neutral-400">Carregando...</p>
      </div>
    </div>
  );

  const TABS: { key: ViewType; icon: any; label: string }[] = [
    { key: 'table', icon: Columns3, label: 'Tabela' },
    { key: 'gantt', icon: CalendarDays, label: 'Gantt' },
    { key: 'chart', icon: BarChart3, label: 'Grafico' },
  ];

  const STATS: { key: string; label: string }[] = [
    { key: 'Dentro do Prazo', label: 'No prazo' },
    { key: 'Quase Atraso', label: 'Quase atraso' },
    { key: 'Atraso', label: 'Atrasados' },
    { key: 'Finalizado', label: 'Finalizados' },
  ];

  return (
    <div className="flex h-screen bg-white">

      {/* ============ SIDEBAR ============ */}
      <aside className="w-60 bg-neutral-50 border-r border-neutral-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-neutral-900 tracking-tight">Producao</span>
          </div>
        </div>

        {/* Project selector */}
        {projects.length > 0 && (
          <div className="px-3 mt-4">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 mb-1.5 block">Projeto</label>
            <select
              value={project}
              onChange={e => setProject(e.target.value)}
              className="w-full text-sm bg-white border border-neutral-200 rounded-md px-3 py-2 text-neutral-700 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            >
              {projects.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        )}

        {/* Nav section */}
        <div className="flex-1 overflow-y-auto px-3 mt-3 space-y-1">
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 mb-1.5">Importar</p>
          <input ref={fileRef} type="file" accept=".csv,.xlsx" onChange={e => e.target.files?.[0] && actions.import(e.target.files[0])} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-3 px-2.5 py-2 text-sm text-neutral-600 rounded-md hover:bg-white hover:shadow-sm hover:border hover:border-neutral-200 transition-[all] duration-200 border border-transparent">
            <Upload className="w-4 h-4 text-neutral-400" />
            <span>Upload CSV / Excel</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto text-neutral-300" />
          </button>

          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 mb-1.5 mt-5">Exportar</p>
          <button onClick={actions.exportCsv} className="w-full flex items-center gap-3 px-2.5 py-2 text-sm text-neutral-600 rounded-md hover:bg-white hover:shadow-sm hover:border hover:border-neutral-200 transition-[all] duration-200 border border-transparent group">
            <FileSpreadsheet className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform duration-200" />
            <span>Baixar CSV</span>
            <FileDown className="w-3.5 h-3.5 ml-auto text-neutral-300 group-hover:translate-y-0.5 transition-transform duration-200" />
          </button>
          <button onClick={actions.exportXlsx} className="w-full flex items-center gap-3 px-2.5 py-2 text-sm text-neutral-600 rounded-md hover:bg-white hover:shadow-sm hover:border hover:border-neutral-200 transition-[all] duration-200 border border-transparent group">
            <FileSpreadsheet className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform duration-200" />
            <span>Baixar Excel</span>
            <FileDown className="w-3.5 h-3.5 ml-auto text-neutral-300 group-hover:translate-y-0.5 transition-transform duration-200" />
          </button>

          <div className="border-t border-neutral-200 mx-2 mt-5" />

          <button onClick={actions.reset} className="w-full flex items-center gap-3 px-2.5 py-2 text-sm text-neutral-600 rounded-md hover:bg-white hover:shadow-sm hover:border hover:border-neutral-200 transition-[all] duration-200 border border-transparent group">
            <RotateCcw className="w-4 h-4 text-amber-500 group-hover:-rotate-180 transition-transform duration-500" />
            <span>Resetar Dados</span>
          </button>
        </div>

        {/* Bottom */}
        <div className="px-4 py-3 border-t border-neutral-200">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Settings className="w-3.5 h-3.5 animate-spin-slow" />
            <span>v2.0</span>
          </div>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Top bar */}
        <header className="h-14 border-b border-neutral-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setView(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-[all] duration-200 ${
                    view === t.key
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar fase..."
                className="w-48 text-sm bg-neutral-50 border border-neutral-200 rounded-md pl-8 pr-3 py-1.5 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white transition-[all] duration-200"
              />
            </div>

            {/* Date ref */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <CalendarDays className="w-3.5 h-3.5 text-neutral-400" />
              <input
                type="date"
                value={ref}
                onChange={e => setRef(e.target.value)}
                className="bg-transparent focus:outline-none text-neutral-600 font-medium"
              />
            </div>

            {/* Add phase */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary group"
            >
              <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
              Nova Fase
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto space-y-5">

            {/* Add phase form */}
            <div
              className={`overflow-hidden transition-[max-height,opacity,padding] duration-300 ease-in-out ${
                showForm ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              }`}
            >
              <form onSubmit={e => { e.preventDefault(); actions.add(); }} className="flex items-end gap-3 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Etapa</label>
                  <input value={form.etapa} onChange={e => setForm({ ...form, etapa: e.target.value })} placeholder="Nome da fase" className="w-full text-sm bg-white border border-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Inicio</label>
                  <input type="date" value={form.ini} onChange={e => setForm({ ...form, ini: e.target.value })} className="text-sm bg-white border border-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Fim</label>
                  <input type="date" value={form.fim} onChange={e => setForm({ ...form, fim: e.target.value })} className="text-sm bg-white border border-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
                <button type="submit" className="btn-primary">Adicionar</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
              </form>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-3">
              {STATS.map(({ key, label }) => {
                const c = ST.status(key);
                const count = counts[key] || 0;
                return (
                  <div key={key} className="stat-card group cursor-default hover:shadow-sm transition-[all] duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium text-neutral-500">{label}</span>
                      <span className="w-2 h-2 rounded-full transition-transform duration-200 group-hover:scale-150" style={{ backgroundColor: c.solid }} />
                    </div>
                    <span className="text-2xl font-bold tabular-nums" style={{ color: c.text }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* ============ TABLE ============ */}
            {view === 'table' && (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Etapa</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Inicio</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Fim</th>
                      <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
                      <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {list.map((f) => {
                      const ed = editId === f.id;
                      const s = ST.status(f.Status);
                      return (
                        <tr key={f.id} className="group hover:bg-purple-50/40 transition-colors duration-150">
                          <td className="px-5 py-3 font-medium text-neutral-800">{f.Etapa}</td>
                          <td className="px-5 py-3 text-neutral-500">
                            {ed ? (
                              <input type="date" value={editD.i} onChange={e => setEditD({ ...editD, i: e.target.value })} className="text-xs border border-neutral-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                            ) : fmtDate(f.Data_Inicio)}
                          </td>
                          <td className="px-5 py-3 text-neutral-500">
                            {ed ? (
                              <input type="date" value={editD.f} onChange={e => setEditD({ ...editD, f: e.target.value })} className="text-xs border border-neutral-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                            ) : fmtDate(f.Data_Fim)}
                          </td>
                          <td className="px-5 py-3">
                            <span className="badge" style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.solid }} />
                              {f.Status}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {!ed ? (
                                <button onClick={() => { setEditId(f.id); setEditD({ i: f.Data_Inicio, f: f.Data_Fim }); }} className="p-1.5 rounded-md hover:bg-blue-50 text-neutral-300 hover:text-blue-600 transition-colors duration-150" title="Editar">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              ) : (
                                <>
                                  <button onClick={() => actions.save(f.id)} className="p-1.5 rounded-md hover:bg-green-50 text-neutral-300 hover:text-green-600 transition-colors duration-150">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setEditId(null)} className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-300 hover:text-neutral-500 transition-colors duration-150">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </>
                              )}
                              {f.Status !== 'Finalizado' && (
                                <button onClick={() => actions.done(f.id)} className="p-1.5 rounded-md hover:bg-purple-50 text-neutral-300 hover:text-purple-600 transition-colors duration-150" title="Finalizar">
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => actions.del(f.id)} className="p-1.5 rounded-md hover:bg-red-50 text-neutral-300 hover:text-red-500 transition-colors duration-150" title="Excluir">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!list.length && (
                      <tr><td colSpan={5} className="px-5 py-16 text-center text-neutral-400 text-sm">Nenhuma fase encontrada</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ============ GANTT ============ */}
            {view === 'gantt' && (
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-neutral-800 mb-5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: ST.colors.final.bg }}>
                    <CalendarDays className="w-3.5 h-3.5" style={{ color: ST.colors.final.text }} />
                  </div>
                  Cronograma
                </h3>
                <GanttChart fases={list} />
                <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-neutral-100">
                  {STATUS_ORDER.map(s => (
                    <span key={s} className="flex items-center gap-2 text-xs text-neutral-500">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ST.status(s).solid }} />
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ============ CHART ============ */}
            {view === 'chart' && (
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-neutral-800 mb-1 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: ST.colors.dentro.bg }}>
                    <BarChart3 className="w-3.5 h-3.5" style={{ color: ST.colors.dentro.text }} />
                  </div>
                  Distribuicao dos Status
                </h3>
                <p className="text-xs text-neutral-400 mb-4 ml-9">
                  {list.length} fase(s) no projeto {project}
                </p>
                <StatusBarChart fases={list} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
