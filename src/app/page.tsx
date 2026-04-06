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
  Plus,
  Trash2,
  CheckCircle2,
  FileDown,
  RotateCcw,
  CalendarDays,
  BarChart3,
  Columns3,
  Layers,
  Upload,
  Search,
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
// Status Theme
// ============================================================

const ST: Record<string, { bg: string; border: string; text: string; solid: string }> = {
  'Dentro do Prazo': { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', solid: '#22c55e' },
  'Quase Atraso':  { bg: '#fffbeb', border: '#fde68a', text: '#b45309', solid: '#f59e0b' },
  'Atraso':        { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', solid: '#ef4444' },
  'Nao Iniciada':  { bg: '#f9fafb', border: '#e5e7eb', text: '#6b7280', solid: '#9ca3af' },
  'Finalizado':    { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', solid: '#3b82f6' },
};

const STATUS_ORDER: StatusType[] = ['Nao Iniciada', 'Dentro do Prazo', 'Quase Atraso', 'Atraso', 'Finalizado'];

// ============================================================
// Helpers
// ============================================================

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
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
// Gantt
// ============================================================

function GanttChart({ fases }: { fases: (Fase & { Status: StatusType })[] }) {
  if (!fases.length) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
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
  const bh = 32;
  const gap = 8;
  const h = fases.length * (bh + gap) + 40;

  return (
    <div className="overflow-x-auto">
      <svg width="100%" height={h} viewBox={`0 0 1000 ${h}`} className="min-w-[700px]">
        {[...Array(Math.ceil(totalDays / 3) + 1)].map((_, i) => {
          const x = (i * 3 / totalDays) * 760 + 230;
          const dt = new Date(minT + i * 3 * 86400000);
          return (
            <g key={i}>
              <line x1={x} y1={2} x2={x} y2={h - 20} stroke="#f5f5f5" strokeWidth={1} />
              <text x={x} y={h - 4} fontSize={9} fill="#a3a3a3" textAnchor="middle">
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
          const w = Math.max((dur / totalDays) * 740, 8);
          const y = i * (bh + gap) + 10;
          const c = ST[f.Status] || ST['Nao Iniciada'];
          return (
            <g key={f.id}>
              <text x={228} y={y + bh / 2 + 4} fontSize={10.5} fill="#262626" textAnchor="end" fontWeight="500">
                {f.Etapa.length > 26 ? f.Etapa.slice(0, 24) + '..' : f.Etapa}
              </text>
              <rect x={x} y={y} width={w} height={bh} rx={7} fill={c.solid} />
              {w > 60 && (
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
    fill: ST[s].solid,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#737373' }}
          axisLine={false}
          tickLine={false}
          angle={-20}
          textAnchor="end"
          height={70}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: '#fafafa' }}
          contentStyle={{
            borderRadius: 8, border: '1px solid #e5e5e5',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontFamily: 'inherit', fontSize: 13, padding: '8px 12px',
          }}
          formatter={(v: number) => [`${v} fase(s)`, 'Quantidade']}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={56}>
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
        setProject(prev => prev || (p[0] || ''));
      }
    } catch {}
    setLoading(false);
  }, []);

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
      setEditId(null); refresh();
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
      setForm({ etapa: '', ini: '', fim: '' }); setShowForm(false); refresh();
    },
    reset: async () => {
      await fetch('/api/fases?action=seed', { method: 'POST' }); refresh();
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
          await fetch('/api/fases?action=import', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fases: mapped }),
          });
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
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `${project}.csv`; a.click();
    },
    exportXlsx: () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(list), project);
      XLSX.writeFile(wb, `${project}.xlsx`);
    },
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-3 text-xs text-neutral-400">Carregando dashboard...</p>
      </div>
    </div>
  );

  const STATS: { key: string; label: string }[] = [
    { key: 'Dentro do Prazo', label: 'No prazo' },
    { key: 'Quase Atraso', label: 'Quase atraso' },
    { key: 'Atraso', label: 'Atrasados' },
    { key: 'Finalizado', label: 'Finalizados' },
  ];

  return (
    <div className="flex min-h-screen bg-white">

      {/* ============================================================ */}
      {/* SIDEBAR */}
      {/* ============================================================ */}
      <aside className="w-64 bg-neutral-50 border-r border-neutral-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-sm">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold text-neutral-900 tracking-tight leading-tight block">Producao</span>
              <span className="text-[10px] text-neutral-400 font-medium">Controle de processo</span>
            </div>
          </div>
        </div>

        {/* Project selector */}
        {projects.length > 0 && (
          <div className="px-4 pt-5">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-1 mb-1.5 block">Projeto Ativo</label>
            <select
              value={project}
              onChange={e => setProject(e.target.value)}
              className="w-full text-sm bg-white border border-neutral-200 rounded-lg px-3 py-2.5 text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow"
            >
              {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 pt-6 space-y-6">
          {/* Import */}
          <div>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-1 mb-2">Importar</p>
            <input ref={fileRef} type="file" accept=".csv,.xlsx" onChange={e => e.target.files?.[0] && actions.import(e.target.files[0])} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-600 rounded-lg hover:bg-white hover:text-neutral-900 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                <Upload className="w-4 h-4 text-violet-500" />
              </div>
              <div className="text-left">
                <span className="block font-medium">Upload arquivo</span>
                <span className="text-xs text-neutral-400">CSV ou Excel</span>
              </div>
            </button>
          </div>

          {/* Export */}
          <div>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-1 mb-2">Exportar</p>
            <div className="space-y-1">
              <button
                onClick={actions.exportCsv}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-600 rounded-lg hover:bg-white hover:text-neutral-900 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-left">
                  <span className="block font-medium">Baixar CSV</span>
                  <span className="text-xs text-neutral-400">Planilha simples</span>
                </div>
                <FileDown className="w-3.5 h-3.5 ml-auto text-neutral-300 group-hover:translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={actions.exportXlsx}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-600 rounded-lg hover:bg-white hover:text-neutral-900 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-left">
                  <span className="block font-medium">Baixar Excel</span>
                  <span className="text-xs text-neutral-400">Formato XLSX</span>
                </div>
                <FileDown className="w-3.5 h-3.5 ml-auto text-neutral-300 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Reset */}
          <div className="pt-2 border-t border-neutral-200">
            <button
              onClick={actions.reset}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-600 rounded-lg hover:bg-white hover:text-neutral-900 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <RotateCcw className="w-4 h-4 text-amber-500 group-hover:-rotate-180 transition-transform duration-500" />
              </div>
              <span className="font-medium">Resetar Dados</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-200">
          <p className="text-[10px] text-neutral-400">v2.0 — Next.js Dashboard</p>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN AREA */}
      {/* ============================================================ */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Top Bar */}
        <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-8 shrink-0">
          {/* Left: View tabs */}
          <div className="flex items-center gap-6">
            <h2 className="text-base font-semibold text-neutral-900">
              {project || 'Selecione um projeto'}
            </h2>
            <div className="h-4 w-px bg-neutral-200" />
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
              {[
                { key: 'table' as ViewType, icon: Columns3, label: 'Tabela' },
                { key: 'gantt' as ViewType, icon: CalendarDays, label: 'Gantt' },
                { key: 'chart' as ViewType, icon: BarChart3, label: 'Grafico' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setView(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    view === t.key
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/50'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Search + Date + Add */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar fase..."
                className="w-52 text-sm bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 focus:bg-white transition-all duration-200"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
              <CalendarDays className="w-3.5 h-3.5 text-neutral-400" />
              <span>Ref:</span>
              <input
                type="date"
                value={ref}
                onChange={e => setRef(e.target.value)}
                className="bg-transparent focus:outline-none text-neutral-700 font-medium"
              />
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary"
            >
              <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
              Nova Fase
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="px-8 py-6 max-w-[1400px] mx-auto space-y-6">

            {/* Add phase form */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showForm ? 'max-h-40 opacity-100 mb-0' : 'max-h-0 opacity-0 pointer-events-none'
            }`}>
              <form onSubmit={e => { e.preventDefault(); actions.add(); }} className="flex items-end gap-3 p-5 bg-violet-50 border border-violet-100 rounded-xl">
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">Nome da Etapa</label>
                  <input value={form.etapa} onChange={e => setForm({ ...form, etapa: e.target.value })} placeholder="Ex: Montagem" className="w-full text-sm bg-white border border-neutral-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">Data Inicio</label>
                  <input type="date" value={form.ini} onChange={e => setForm({ ...form, ini: e.target.value })} className="text-sm bg-white border border-neutral-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">Data Fim</label>
                  <input type="date" value={form.fim} onChange={e => setForm({ ...form, fim: e.target.value })} className="text-sm bg-white border border-neutral-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <button type="submit" className="btn-primary">Adicionar</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
              </form>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
              {STATS.map(({ key, label }) => {
                const c = ST[key] || ST['Nao Iniciada'];
                const count = counts[key] || 0;
                return (
                  <div key={key} className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{label}</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.solid }} />
                    </div>
                    <div>
                      <span className="text-3xl font-bold tabular-nums" style={{ color: c.text }}>{count}</span>
                      <span className="text-xs text-neutral-400 ml-1.5">fase{count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table View */}
            {view === 'table' && (
              <div className="card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="text-left px-6 py-3.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Etapa</th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider w-40">Inicio</th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider w-40">Fim</th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
                      <th className="text-right px-6 py-3.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider w-32">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {list.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-20 text-center text-neutral-400 text-sm">
                        Nenhuma fase encontrada
                      </td></tr>
                    )}
                    {list.map((f) => {
                      const ed = editId === f.id;
                      const s = ST[f.Status] || ST['Nao Iniciada'];
                      return (
                        <tr key={f.id} className="group transition-colors duration-150 hover:bg-violet-50/40">
                          <td className="px-6 py-4 font-medium text-neutral-900">{f.Etapa}</td>
                          <td className="px-6 py-4 text-neutral-500">
                            {ed ? (
                              <input type="date" value={editD.i} onChange={e => setEditD({ ...editD, i: e.target.value })} className="text-xs border border-neutral-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            ) : <span className="font-medium">{fmtDate(f.Data_Inicio)}</span>}
                          </td>
                          <td className="px-6 py-4 text-neutral-500">
                            {ed ? (
                              <input type="date" value={editD.f} onChange={e => setEditD({ ...editD, f: e.target.value })} className="text-xs border border-neutral-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            ) : <span className="font-medium">{fmtDate(f.Data_Fim)}</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                              style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.solid }} />
                              {f.Status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!ed ? (
                                <button onClick={() => { setEditId(f.id); setEditD({ i: f.Data_Inicio, f: f.Data_Fim }); }} className="p-1.5 rounded-md hover:bg-blue-50 text-neutral-300 hover:text-blue-600 transition-all duration-150 hover:scale-110" title="Editar">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              ) : (
                                <>
                                  <button onClick={() => actions.save(f.id)} className="p-1.5 rounded-md hover:bg-green-50 text-neutral-300 hover:text-green-600 transition-all duration-150 hover:scale-110">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setEditId(null)} className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-300 hover:text-neutral-500 transition-all duration-150 hover:scale-110">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </>
                              )}
                              {f.Status !== 'Finalizado' && (
                                <button onClick={() => actions.done(f.id)} className="p-1.5 rounded-md hover:bg-violet-50 text-neutral-300 hover:text-violet-600 transition-all duration-150 hover:scale-110" title="Finalizar">
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => actions.del(f.id)} className="p-1.5 rounded-md hover:bg-red-50 text-neutral-300 hover:text-red-500 transition-all duration-150 hover:scale-110" title="Excluir">
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
            )}

            {/* Gantt View */}
            {view === 'gantt' && (
              <div className="card px-8 py-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ST['Finalizado'].bg }}>
                    <CalendarDays className="w-4 h-4" style={{ color: ST['Finalizado'].text }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Cronograma</h3>
                    <p className="text-xs text-neutral-400">Visualizacao temporal das fases</p>
                  </div>
                </div>
                <GanttChart fases={list} />
                <div className="flex flex-wrap gap-5 mt-6 pt-4 border-t border-neutral-100">
                  {STATUS_ORDER.map(s => (
                    <span key={s} className="flex items-center gap-2.5 text-xs text-neutral-500 font-medium">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ST[s].solid }} />
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Chart View */}
            {view === 'chart' && (
              <div className="card px-8 py-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ST['Dentro do Prazo'].bg }}>
                    <BarChart3 className="w-4 h-4" style={{ color: ST['Dentro do Prazo'].text }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Distribuicao dos Status</h3>
                    <p className="text-xs text-neutral-400">{list.length} fase(s) no total</p>
                  </div>
                </div>
                <StatusBarChart fases={list} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
