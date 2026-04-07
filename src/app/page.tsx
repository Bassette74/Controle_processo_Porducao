'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  Plus, Trash2, CheckCircle2, FileDown, RotateCcw, CalendarDays, BarChart3,
  Columns3, Layers, Upload, Search, FileSpreadsheet, Bell, TrendingUp, AlertTriangle,
  Calendar, FileText, BookOpen, Clock, ChevronDown, ChevronUp, Info, BarChartIcon, Gauge,
} from 'lucide-react';

// ============================================================
// Dracula Colors
// ============================================================

const DRACULA = {
  bg: '#282a36', bgElev: '#2c2e3e', bgSubtle: '#343746',
  currentLine: '#44475a', border: '#3d3f52', borderStrong: '#6272a4',
  fg: '#f8f8f2', fgDim: '#a0a1b3', comment: '#6272a4',
  cyan: '#8be9fd', green: '#50fa7b', orange: '#ffb86c',
  pink: '#ff79c6', purple: '#bd93f9', red: '#ff5555', yellow: '#f1fa8c',
};

const ST: Record<string, { bg: string; border: string; text: string; solid: string }> = {
  'Dentro do Prazo': { bg: '#0d2614', border: '#50fa7b40', text: '#50fa7b', solid: '#50fa7b' },
  'Quase Atraso':  { bg: '#2d1f00', border: '#ffb86c40', text: '#ffb86c', solid: '#ffb86c' },
  'Atraso':        { bg: '#2d0f0f', border: '#ff555540', text: '#ff5555', solid: '#ff5555' },
  'Nao Iniciada':  { bg: '#343746', border: '#6272a440', text: '#a0a1b3', solid: '#6272a4' },
  'Finalizado':    { bg: '#0d1a2d', border: '#8be9fd40', text: '#8be9fd', solid: '#8be9fd' },
};

const STATUS_ORDER: StatusType[] = ['Nao Iniciada', 'Dentro do Prazo', 'Quase Atraso', 'Atraso', 'Finalizado'];

type Fase = { id: number; Projeto: string; Etapa: string; Data_Inicio: string; Data_Fim: string; Status: string; Dependencia_Id: number | null };
type StatusType = 'Nao Iniciada' | 'Dentro do Prazo' | 'Quase Atraso' | 'Atraso' | 'Finalizado';
type ViewType = 'table' | 'gantt' | 'chart' | 'calendar';
type HistoryEntry = { id: number; fase_id: number; campo: string; valor_antigo: string; valor_novo: string; criado_em: string };
type Gargalo = { etapa: string; atrasoCount: number; impactoCount: number; projeto: string };
type Template = { id: number; nome: string; descricao: string; dados: string };

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
    <div className="flex flex-col items-center justify-center py-20" style={{ color: DRACULA.comment }}>
      <CalendarDays className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm">Nenhuma fase neste projeto</p>
    </div>
  );

  const allTimes = fases.flatMap(f => [new Date(f.Data_Inicio + 'T00:00:00').getTime(), new Date(f.Data_Fim + 'T00:00:00').getTime()]);
  const minT = Math.min(...allTimes);
  const totalDays = Math.ceil((Math.max(...allTimes) - minT) / 86400000) + 1;
  const bh = 32; const gap = 8;
  const h = fases.length * (bh + gap) + 40;

  return (
    <div className="overflow-x-auto">
      <svg width="100%" height={h} viewBox={`0 0 1000 ${h}`} className="min-w-[700px]">
        {[...Array(Math.ceil(totalDays / 3) + 1)].map((_, i) => {
          const x = (i * 3 / totalDays) * 760 + 230;
          const dt = new Date(minT + i * 3 * 86400000);
          return (
            <g key={i}>
              <line x1={x} y1={2} x2={x} y2={h - 20} stroke={DRACULA.border} strokeWidth={1} />
              <text x={x} y={h - 4} fontSize={9} fill={DRACULA.comment} textAnchor="middle">
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
              <text x={228} y={y + bh / 2 + 4} fontSize={10.5} fill={DRACULA.fgDim} textAnchor="end" fontWeight="500">
                {f.Etapa.length > 26 ? f.Etapa.slice(0, 24) + '..' : f.Etapa}
              </text>
              <rect x={x} y={y} width={w} height={bh} rx={7} fill={c.solid} opacity={0.9} />
              {w > 60 && (
                <text x={x + w / 2} y={y + bh / 2 + 3.5} fontSize={8.5} fill={DRACULA.bg} textAnchor="middle" fontWeight="600">{f.Status}</text>
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
  const data = STATUS_ORDER.map(s => ({ name: s, value: cnt[s], fill: ST[s].solid }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={DRACULA.border} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: DRACULA.fgDim }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={70} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: DRACULA.fgDim }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: DRACULA.bgSubtle }}
          contentStyle={{ borderRadius: 8, border: `1px solid ${DRACULA.border}`, backgroundColor: DRACULA.bgElev, color: DRACULA.fg, fontFamily: 'inherit', fontSize: 13, padding: '8px 12px' }}
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
// Calendar View
// ============================================================

function CalendarView({ fases }: { fases: (Fase & { Status: StatusType })[] }) {
  if (!fases.length) return (
    <div className="flex flex-col items-center justify-center py-20" style={{ color: DRACULA.comment }}>
      <Calendar className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm">Nenhuma fase neste projeto</p>
    </div>
  );

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const hojeStr = today.toISOString().split('T')[0];
  const faseMap: Record<string, Array<{ etapa: string; status: StatusType }>> = {};
  fases.forEach(f => {
    let d = new Date(f.Data_Inicio + 'T00:00:00');
    const end = new Date(f.Data_Fim + 'T00:00:00');
    while (d <= end) {
      const k = d.toISOString().split('T')[0];
      if (!faseMap[k]) faseMap[k] = [];
      faseMap[k].push({ etapa: f.Etapa, status: f.Status });
      d.setDate(d.getDate() + 1);
    }
  });

  const cells: number[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(0);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const monthName = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="text-center text-sm font-semibold mb-4" style={{ color: DRACULA.fg }}>{monthName}</div>
      <div className="grid grid-cols-7 gap-px" style={{ backgroundColor: DRACULA.border }}>
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
          <div key={d} className="text-center py-2 text-[10px] font-semibold" style={{ backgroundColor: DRACULA.bgElev, color: DRACULA.comment }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="p-1 min-h-[60px]" style={{ backgroundColor: DRACULA.bg }} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === hojeStr;
          const events = faseMap[dateStr] || [];
          return (
            <div key={dateStr} className="p-1 min-h-[60px] relative" style={{ backgroundColor: isToday ? DRACULA.bgSubtle : DRACULA.bg, border: isToday ? `1px solid ${DRACULA.purple}` : 'none' }}>
              <div className="text-xs font-medium mb-0.5" style={{ color: isToday ? DRACULA.purple : DRACULA.fgDim }}>{day}</div>
              {events.slice(0, 2).map((ev, j) => {
                const c = ST[ev.status] || ST['Nao Iniciada'];
                return <div key={j} className="text-[9px] px-1 py-0.5 rounded truncate mb-0.5" style={{ backgroundColor: c.solid + '30', color: c.text }}>{ev.etapa}</div>;
              })}
              {events.length > 2 && <div className="text-[9px]" style={{ color: DRACULA.comment }}>+{events.length - 2} mais</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Notifications Panel
// ============================================================

function NotificationsPanel({ fases, isOpen, onClose }: { fases: (Fase & { Status: StatusType })[]; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  const alerts = fases.filter(f => f.Status === 'Quase Atraso');
  const atrasos = fases.filter(f => f.Status === 'Atraso');

  return (
    <div className="absolute top-10 right-6 w-80 rounded-xl shadow-2xl z-50 animate-fade-in" style={{ backgroundColor: DRACULA.bgElev, border: `1px solid ${DRACULA.border}`, maxHeight: '80vh', overflow: 'auto' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${DRACULA.border}` }}>
        <span className="text-sm font-semibold" style={{ color: DRACULA.fg }}>Alertas</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: DRACULA.fgDim }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-3 space-y-2">
        {atrasos.length === 0 && alerts.length === 0 && (
          <div className="text-center py-6" style={{ color: DRACULA.comment }}>
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Nenhum alerta</p>
          </div>
        )}
        {atrasos.map(f => (
          <div key={f.id} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ backgroundColor: `${DRACULA.red}15` }}>
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: DRACULA.red }} />
            <div className="text-xs">
              <div className="font-semibold" style={{ color: DRACULA.red }}>{f.Etapa}</div>
              <div style={{ color: DRACULA.fgDim }}>{f.Projeto} — Venc: {fmtDate(f.Data_Fim)}</div>
            </div>
          </div>
        ))}
        {alerts.map(f => (
          <div key={f.id} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ backgroundColor: `${DRACULA.orange}15` }}>
            <Info className="w-4 h-4 shrink-0" style={{ color: DRACULA.orange }} />
            <div className="text-xs">
              <div className="font-semibold" style={{ color: DRACULA.orange }}>{f.Etapa}</div>
              <div style={{ color: DRACULA.fgDim }}>{f.Projeto} — Venc: {fmtDate(f.Data_Fim)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// PDF Export
// ============================================================

function exportPDF(fases: (Fase & { Status: StatusType })[], project: string) {
  const today = new Date().toLocaleDateString('pt-BR');
  const cnt: Record<string, number> = {};
  STATUS_ORDER.forEach(s => cnt[s] = 0);
  fases.forEach(f => cnt[f.Status]++);

  const completed = fases.filter(f => f.Status === 'Finalizado').length;
  const progress = fases.length > 0 ? Math.round((completed / fases.length) * 100) : 0;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatorio - ${project}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{color:#6c5ce7;border-bottom:2px solid #6c5ce7;padding-bottom:8px}h2{color:#555;margin-top:30px}
table{width:100%;border-collapse:collapse;margin-top:10px}th,td{padding:8px 10px;border:1px solid #ddd;text-align:left;font-size:13px}th{background:#6c5ce7;color:#fff}
.bar{height:20px;border-radius:4px;background:#ddd;margin:10px 0}.fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#6c5ce7,#a29bfe);transition:width 0.3s}
.meta{display:flex;gap:20px;margin-top:10px}.meta div{background:#f0f0f0;padding:10px 16px;border-radius:6px;text-align:center;min-width:80px}.meta .num{font-size:24px;font-weight:bold;color:#6c5ce7}.label{font-size:11px;color:#888}@media print{body{padding:20px}}</style></head><body>
<h1>Relatorio de Projeto - ${project}</h1>
<p>Gerado em: ${today}</p>
<h2>Progresso</h2>
<div class="bar"><div class="fill" style="width:${progress}%"></div></div>
<p><strong>${progress}%</strong> concluido (${completed}/${fases.length} fases)</p>
<h2>Resumo</h2>
<div class="meta">${STATUS_ORDER.map(s => `<div><div class="num">${cnt[s]}</div><div class="label">${s}</div></div>`).join('')}</div>
<h2>Fases</h2><table><tr><th>Etapa</th><th>Inicio</th><th>Fim</th><th>Status</th></tr>
${fases.map(f => `<tr><td>${f.Etapa}</td><td>${f.Data_Inicio}</td><td>${f.Data_Fim}</td><td>${f.Status}</td></tr>`).join('')}
</table></body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

// ============================================================
// Bottleneck Panel
// ============================================================

function BottleneckPanel({ gargalos }: { gargalos: Gargalo[] }) {
  if (!gargalos.length) return (
    <div className="text-center py-8" style={{ color: DRACULA.comment }}><TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">Sem gargalos detectados</p></div>
  );
  return (
    <div className="space-y-2">
      {gargalos.map((g, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: i === 0 ? `${DRACULA.red}15` : DRACULA.bgSubtle, border: i === 0 ? `1px solid ${DRACULA.red}30` : `1px solid ${DRACULA.border}` }}>
          <span className="text-sm font-bold shrink-0" style={{ color: i === 0 ? DRACULA.red : DRACULA.orange }}>#{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: DRACULA.fg }}>{g.etapa}</div>
            <div className="text-xs" style={{ color: DRACULA.comment }}>{g.projeto}</div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-semibold" style={{ color: i === 0 ? DRACULA.red : DRACULA.fgDim }}>{g.atrasoCount} atraso{g.atrasoCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// History Log
// ============================================================

function HistoryLog({ history, fases }: { history: HistoryEntry[]; fases: Fase[] }) {
  if (!history.length) return <div className="text-center py-8" style={{ color: DRACULA.comment }}><Clock className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">Nenhuma alteracao registrada</p></div>;
  const faseName = (id: number) => { const f = fases.find(f => f.id === id); return f ? f.Etapa : `#${id}`; };
  return (
    <div className="space-y-1">
      {history.map(h => (
        <div key={h.id} className="flex items-start gap-3 p-2.5 rounded-md transition-colors hover:bg-white/5" style={{ backgroundColor: DRACULA.bgSubtle }}>
          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: DRACULA.comment }} />
          <div className="text-xs min-w-0">
            <span className="font-medium" style={{ color: DRACULA.fg }}>{faseName(h.fase_id)}</span>
            <span style={{ color: DRACULA.fgDim }}> — {h.campo}: </span>
            <span style={{ color: DRACULA.red, textDecoration: 'line-through' }}>{h.valor_antigo}</span>
            <span style={{ color: DRACULA.comment }}> → </span>
            <span style={{ color: DRACULA.green }}>{h.valor_novo}</span>
            <div className="text-[10px] mt-0.5" style={{ color: DRACULA.comment }}>{new Date(h.criado_em + 'Z').toLocaleString('pt-BR')}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Templates Panel
// ============================================================

function TemplatesPanel({ templates, onSave, onDelete, onApply, onCurrent }: {
  templates: Template[]; onSave: () => void; onDelete: (id: number) => void; onApply: (id: number) => void; onCurrent: () => void;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      <button onClick={onCurrent} className="w-full text-center text-xs px-4 py-2 rounded-lg font-medium transition-all hover:shadow-sm" style={{ backgroundColor: DRACULA.purple, color: DRACULA.bg }}>
        Salvar projeto atual como template
      </button>
      <button onClick={() => setShowForm(!showForm)} className="w-full text-center text-xs px-4 py-2 rounded-lg transition-all hover:shadow-sm" style={{ color: DRACULA.fgDim }}>
        {showForm ? 'Cancelar' : 'Criar template manual'}
      </button>
      {showForm && (
        <div className="space-y-2 animate-fade-in">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do template" className="w-full text-xs rounded-md px-2.5 py-2 focus:outline-none" style={{ backgroundColor: DRACULA.currentLine, color: DRACULA.fg, border: `1px solid ${DRACULA.border}` }} />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descricao" className="w-full text-xs rounded-md px-2.5 py-2 focus:outline-none" style={{ backgroundColor: DRACULA.currentLine, color: DRACULA.fg, border: `1px solid ${DRACULA.border}` }} />
          <button onClick={() => { onSave(); setShowForm(false); setName(''); setDesc(''); }} className="text-xs px-4 py-1.5 rounded-md font-medium" style={{ backgroundColor: DRACULA.green, color: DRACULA.bg }}>Criar</button>
        </div>
      )}
      {templates.map(t => {
        const fases = JSON.parse(t.dados);
        return (
          <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: DRACULA.bgSubtle, border: `1px solid ${DRACULA.border}` }}>
            <BookOpen className="w-4 h-4 shrink-0" style={{ color: DRACULA.purple }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: DRACULA.fg }}>{t.nome}</div>
              <div className="text-[11px]" style={{ color: DRACULA.comment }}>{t.descricao} — {fases.length} fase(s)</div>
            </div>
            <button onClick={() => onApply(t.id)} className="text-xs px-2.5 py-1 rounded-md font-medium" style={{ backgroundColor: DRACULA.purple, color: DRACULA.bg }}>Aplicar</button>
            <button onClick={() => onDelete(t.id)} className="p-1.5 rounded-md transition-colors hover:bg-red-500/20" style={{ color: DRACULA.red }}><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        );
      })}
    </div>
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
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [logo, setLogo] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [emailConfig, setEmailConfig] = useState({ user: '', appPassword: '', recipient: '' });
  const [alertStatus, setAlertStatus] = useState<string>('');
  const [alreadyAlerted, setAlreadyAlerted] = useState<Set<number>>(new Set());

  // Panels state
  const [showNotif, setShowNotif] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showGargalos, setShowGargalos] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [gargalos, setGargalos] = useState<Gargalo[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Advanced filters
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterSearch, setFilterSearch] = useState('');
  const [depMap, setDepMap] = useState<Record<number, number | null>>({});

  // Load from localStorage
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('company-logo') : null;
    if (saved) setLogo(saved);
    const ec = typeof window !== 'undefined' ? localStorage.getItem('email-config') : null;
    if (ec) { try { setEmailConfig(JSON.parse(ec)); } catch {} }
  }, []);

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

  // Load history and gargalos
  useEffect(() => {
    fetch('/api/fases?action=history').then(r => r.json()).then(d => setHistory(d)).catch(() => {});
    fetch('/api/fases?action=gargalos').then(r => r.json()).then(d => setGargalos(d)).catch(() => {});
    fetch('/api/fases?action=templates').then(r => r.json()).then(d => setTemplates(d)).catch(() => {});
  }, [loading]);

  // Auto-send alert
  useEffect(() => {
    if (!loading && fases.length > 0 && emailConfig.user && emailConfig.recipient && emailConfig.appPassword) {
      const list2 = fases.map(f => ({ ...f, Status: calcStatus(f, ref), dbStatus: f.Status }));
      const newAlerts = list2.filter((f: any) => f.Status === 'Quase Atraso' && !alreadyAlerted.has(f.id));
      if (newAlerts.length > 0) {
        const ids = new Set([...alreadyAlerted]);
        newAlerts.forEach((f: any) => ids.add((f as any).id));
        setAlreadyAlerted(ids);
        fetch('/api/fases?action=alert&ref=' + ref, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailConfig }),
        }).catch(() => {});
      }
    }
  }, [loading]);

  // Process list with filters
  const list = fases
    .filter(f => f.Projeto === project)
    .filter(f => filterSearch === '' || f.Etapa.toLowerCase().includes(filterSearch.toLowerCase()))
    .filter(f => search === '' || f.Etapa.toLowerCase().includes(search.toLowerCase()))
    .filter(f => filterStatus === 'Todos' || calcStatus(f, ref) === filterStatus)
    .map(f => ({ ...f, Status: calcStatus(f, ref), dbStatus: f.Status }));

  const counts: Record<string, number> = {};
  list.forEach(f => { counts[f.Status] = (counts[f.Status] || 0) + 1; });

  const completed = list.filter(f => f.Status === 'Finalizado').length;
  const progress = list.length > 0 ? Math.round((completed / list.length) * 100) : 0;

  const actions = {
    setLogo: (file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setLogo(dataUrl); localStorage.setItem('company-logo', dataUrl);
      };
      reader.readAsDataURL(file);
      if (logoRef.current) logoRef.current.value = '';
    },
    removeLogo: () => { setLogo(null); localStorage.removeItem('company-logo'); },
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
    dep: async (id: number, depId: number | null) => {
      await fetch('/api/fases', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, Dependencia_Id: depId }) });
      refresh();
    },
    delSelected: async () => {
      await Promise.all([...selected].map(id => fetch(`/api/fases?id=${id}`, { method: 'DELETE' })));
      setSelected(new Set()); refresh();
    },
    add: async () => {
      if (!form.etapa || !form.ini || !form.fim) return;
      await fetch('/api/fases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ Projeto: project, Etapa: form.etapa, Data_Inicio: form.ini, Data_Fim: form.fim }) });
      setForm({ etapa: '', ini: '', fim: '' }); setShowForm(false); refresh();
    },
    reset: async () => {
      await fetch('/api/fases?action=seed', { method: 'POST' }); refresh();
    },
    saveEmailConfig: () => {
      localStorage.setItem('email-config', JSON.stringify(emailConfig));
      setAlertStatus('Configuracao salva!'); setTimeout(() => setAlertStatus(''), 2000);
    },
    sendAlerts: async () => {
      const ec = localStorage.getItem('email-config');
      if (!ec) { alert('Configure o email nas configuracoes (engrenagem) primeiro.'); return; }
      const r = await fetch(`/api/fases?action=alert&ref=${ref}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailConfig }),
      });
      const d = await r.json();
      if (d.alertsSent > 0) alert(d.alertsSent + ' alerta(s) enviado(s)!');
      else alert('Nenhuma fase em "Quase Atraso".');
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
              const o: any = {}; hdr.forEach((h, i) => o[h] = row[i]?.trim()); return o;
            });
          } else {
            const wb = XLSX.read(new Uint8Array(ev.target?.result as ArrayBuffer), { type: 'array', cellDates: true });
            data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
          }
          const toIso = (v: any) => {
            if (!v) return new Date().toISOString().split('T')[0];
            if (v instanceof Date) return v.toISOString().split('T')[0];
            const d = new Date(v); return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
          };
          await fetch('/api/fases?action=import', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fases: data.map((d: any) => ({ Projeto: d.Projeto || 'Projeto 1', Etapa: d.Etapa || '', Data_Inicio: toIso(d.Data_Inicio), Data_Fim: toIso(d.Data_Fim), Status: d.Status || 'Nao Iniciada' })) }),
          });
          refresh();
        } catch {}
      };
      file.name.endsWith('.csv') ? reader.readAsText(file) : reader.readAsArrayBuffer(file);
      if (fileRef.current) fileRef.current.value = '';
    },
    exportCsv: () => {
      const blob = new Blob(['\ufeffProjeto,Etapa,Data_Inicio,Data_Fim,Status\n' + list.map(f => `${f.Projeto},${f.Etapa},${f.Data_Inicio},${f.Data_Fim},${f.Status}`).join('\n')], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${project}.csv`; a.click();
    },
    exportXlsx: () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(list), project);
      XLSX.writeFile(wb, `${project}.xlsx`);
    },
    exportPdf: () => { exportPDF(list, project); },
    templateSave: async () => {
      await fetch('/api/fases?action=template-current', { method: 'POST' });
    },
    templateApply: async (id: number) => {
      await fetch('/api/fases?action=template-apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      refresh();
    },
    templateDelete: async (id: number) => {
      await fetch(`/api/fases?action=template&template_id=${id}`, { method: 'DELETE' });
      fetch('/api/fases?action=templates').then(r => r.json()).then(d => setTemplates(d));
    },
    templateCurrent: async () => {
      await fetch('/api/fases?action=template-current', { method: 'POST' });
      fetch('/api/fases?action=templates').then(r => r.json()).then(d => setTemplates(d));
    },
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: DRACULA.bg }}>
      <div className="text-center">
        <div className="w-6 h-6 border-2" style={{ borderColor: `${DRACULA.purple} transparent transparent transparent`, borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }} />
        <p className="mt-3 text-sm" style={{ color: DRACULA.comment }}>Carregando dashboard...</p>
      </div>
    </div>
  );

  const STATS = [
    { key: 'Dentro do Prazo', label: 'No prazo' },
    { key: 'Quase Atraso', label: 'Quase atraso' },
    { key: 'Atraso', label: 'Atrasados' },
    { key: 'Finalizado', label: 'Finalizados' },
  ];

  const TABS = [
    { key: 'table' as ViewType, icon: Columns3, label: 'Tabela' },
    { key: 'gantt' as ViewType, icon: CalendarDays, label: 'Gantt' },
    { key: 'chart' as ViewType, icon: BarChart3, label: 'Grafico' },
  ];

  const alertCount = list.filter((f: any) => f.Status === 'Atraso' || f.Status === 'Quase Atraso').length;

  return (
    <div className="flex min-h-screen relative" style={{ backgroundColor: DRACULA.bg, color: DRACULA.fg }}>
      {/* Notifications bell */}
      <NotificationsPanel fases={list as any} isOpen={showNotif} onClose={() => setShowNotif(false)} />

      {/* ============================================================ */}
      {/* SIDEBAR */}
      {/* ============================================================ */}
      <aside className="w-64 flex flex-col shrink-0" style={{ backgroundColor: DRACULA.bgElev, borderRight: `1px solid ${DRACULA.border}` }}>
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${DRACULA.border}` }}>
          <input ref={logoRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && actions.setLogo(e.target.files[0])} className="hidden" />
          {logo ? (
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <img src={logo} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />
                <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => logoRef.current?.click()}>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </div>
                <button onClick={actions.removeLogo} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <span className="text-xs font-semibold tracking-tight" style={{ color: DRACULA.fg }}>Producao</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => logoRef.current?.click()} className="w-16 h-16 rounded-xl flex flex-col items-center justify-center border-2 border-dashed hover:border-purple-400 transition-all duration-200 group" style={{ borderColor: DRACULA.border }}>
                <Layers className="w-5 h-5 mb-1 transition-colors group-hover:text-violet-400" />
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </button>
              <span className="text-xs" style={{ color: DRACULA.comment }}>Adicionar logo</span>
            </div>
          )}
        </div>

        {/* Project selector */}
        {projects.length > 0 && (
          <div className="px-4 pt-5">
            <label className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-1.5 block" style={{ color: DRACULA.comment }}>Projeto Ativo</label>
            <select value={project} onChange={e => setProject(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2.5 font-medium focus:outline-none transition-shadow" style={{ backgroundColor: DRACULA.bgSubtle, color: DRACULA.fg, border: `1px solid ${DRACULA.border}`, borderColor: DRACULA.currentLine }} onFocus={e => e.target.style.borderColor = DRACULA.purple} onBlur={e => e.target.style.borderColor = DRACULA.currentLine}>
              {projects.map(p => <option key={p} value={p} style={{ backgroundColor: DRACULA.bgElev }}>{p}</option>)}
            </select>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 pt-6 space-y-6">
          {/* Panels */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-2" style={{ color: DRACULA.comment }}>Paineis</p>
            <div className="space-y-1">
              <button onClick={() => { setShowHistory(!showHistory); setShowGargalos(false); setShowTemplates(false); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg transition-colors" style={{ backgroundColor: showHistory ? DRACULA.bgSubtle : 'transparent', color: showHistory ? DRACULA.purple : DRACULA.fgDim }}>
                <Clock className="w-3.5 h-3.5" /> Historico
              </button>
              <button onClick={() => { setShowGargalos(!showGargalos); setShowHistory(false); setShowTemplates(false); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg transition-colors" style={{ backgroundColor: showGargalos ? DRACULA.bgSubtle : 'transparent', color: showGargalos ? DRACULA.orange : DRACULA.fgDim }}>
                <AlertTriangle className="w-3.5 h-3.5" /> Gargalos
              </button>
              <button onClick={() => { setShowTemplates(!showTemplates); setShowHistory(false); setShowGargalos(false); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg transition-colors" style={{ backgroundColor: showTemplates ? DRACULA.bgSubtle : 'transparent', color: showTemplates ? DRACULA.green : DRACULA.fgDim }}>
                <BookOpen className="w-3.5 h-3.5" /> Templates
              </button>
            </div>
          </div>

          {/* Import */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-2" style={{ color: DRACULA.comment }}>Importar</p>
            <input ref={fileRef} type="file" accept=".csv,.xlsx" onChange={e => e.target.files?.[0] && actions.import(e.target.files[0])} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm group" style={{ color: DRACULA.fgDim }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: `${DRACULA.purple}15` }}>
                <Upload className="w-4 h-4" style={{ color: DRACULA.purple }} />
              </div>
              <div className="text-left">
                <span className="block font-medium">Upload arquivo</span>
                <span className="text-xs" style={{ color: DRACULA.comment }}>CSV ou Excel</span>
              </div>
            </button>
          </div>

          {/* Export */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-2" style={{ color: DRACULA.comment }}>Exportar</p>
            <div className="space-y-1">
              <button onClick={actions.exportCsv} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm group" style={{ color: DRACULA.fgDim }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: `${DRACULA.green}15` }}>
                  <FileSpreadsheet className="w-4 h-4" style={{ color: DRACULA.green }} />
                </div>
                <span className="block font-medium">Baixar CSV</span>
              </button>
              <button onClick={actions.exportXlsx} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm group" style={{ color: DRACULA.fgDim }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: `${DRACULA.cyan}15` }}>
                  <FileSpreadsheet className="w-4 h-4" style={{ color: DRACULA.cyan }} />
                </div>
                <span className="block font-medium">Baixar Excel</span>
              </button>
              <button onClick={actions.exportPdf} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 hover:shadow-sm group" style={{ color: DRACULA.fgDim }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: `${DRACULA.yellow}15` }}>
                  <FileText className="w-4 h-4" style={{ color: DRACULA.yellow }} />
                </div>
                <span className="block font-medium">Exportar PDF</span>
              </button>
            </div>
          </div>

          {/* Delete selected */}
          {selected.size > 0 && (
            <div className="animate-fade-in">
              <button onClick={actions.delSelected} className="w-full flex items-center gap-3 px-3 py-3 text-sm rounded-lg transition-all duration-200 group" style={{ backgroundColor: `${DRACULA.red}15`, border: `1px solid ${DRACULA.red}30`, color: DRACULA.red }}>
                <Trash2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                <div className="text-left">
                  <span className="block font-semibold">Excluir Selecionados</span>
                  <span className="text-xs" style={{ color: `${DRACULA.red}cc` }}>{selected.size} fase(s)</span>
                </div>
              </button>
            </div>
          )}

          {/* Reset */}
          <div className="pt-2" style={{ borderTop: `1px solid ${DRACULA.border}` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-2" style={{ color: DRACULA.comment }}>Notificacoes</p>
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs" style={{ color: DRACULA.fgDim }}>Alertas</span>
              <button onClick={() => setShowSettings(!showSettings)} className="p-1 rounded transition-colors group" style={{ color: DRACULA.fgDim }} title="Configuracoes">
                <svg className="w-3.5 h-3.5 group-hover:text-yellow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            {showSettings && (
              <div className="mb-3 p-3 rounded-lg space-y-2 animate-fade-in" style={{ backgroundColor: DRACULA.bgSubtle, border: `1px solid ${DRACULA.border}` }}>
                <input value={emailConfig.user} onChange={e => setEmailConfig({ ...emailConfig, user: e.target.value })} placeholder="Email (Gmail)" className="w-full text-xs rounded-md px-2.5 py-2 focus:outline-none" style={{ backgroundColor: DRACULA.currentLine, color: DRACULA.fg, border: `1px solid ${DRACULA.border}` }} />
                <input value={emailConfig.appPassword} onChange={e => setEmailConfig({ ...emailConfig, appPassword: e.target.value })} placeholder="App Password" type="password" className="w-full text-xs rounded-md px-2.5 py-2 focus:outline-none" style={{ backgroundColor: DRACULA.currentLine, color: DRACULA.fg, border: `1px solid ${DRACULA.border}` }} />
                <input value={emailConfig.recipient} onChange={e => setEmailConfig({ ...emailConfig, recipient: e.target.value })} placeholder="Destinatario" className="w-full text-xs rounded-md px-2.5 py-2 focus:outline-none" style={{ backgroundColor: DRACULA.currentLine, color: DRACULA.fg, border: `1px solid ${DRACULA.border}` }} />
                <div className="flex items-center gap-2">
                  <button onClick={actions.saveEmailConfig} className="text-xs px-3 py-1.5 rounded-md font-medium" style={{ backgroundColor: DRACULA.yellow, color: DRACULA.bg }}>Salvar</button>
                  <button onClick={actions.sendAlerts} className="text-xs px-3 py-1.5 rounded-md font-medium" style={{ backgroundColor: DRACULA.orange, color: DRACULA.bg }}>Enviar agora</button>
                </div>
                {alertStatus && <p className="text-[11px]" style={{ color: DRACULA.green }}>{alertStatus}</p>}
              </div>
            )}
            {emailConfig.user && !showSettings && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded" style={{ backgroundColor: `${DRACULA.green}08` }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DRACULA.green }} />
                <span className="text-[11px]" style={{ color: DRACULA.fgDim }}>Alertas auto. ativados</span>
              </div>
            )}
          </div>

          <div className="pt-2" style={{ borderTop: `1px solid ${DRACULA.border}` }}>
            <button onClick={actions.reset} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 group" style={{ color: DRACULA.fgDim }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: `${DRACULA.orange}15` }}>
                <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" style={{ color: DRACULA.orange }} />
              </div>
              <span className="font-medium">Resetar Dados</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4" style={{ borderTop: `1px solid ${DRACULA.border}` }}>
          <p className="text-[10px]" style={{ color: DRACULA.comment }}>v3.0 - Dashboard Pro</p>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN AREA */}
      {/* ============================================================ */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-8 shrink-0 relative" style={{ borderBottom: `1px solid ${DRACULA.border}`, backgroundColor: DRACULA.bg }}>
          <div className="flex items-center gap-6">
            <h2 className="text-base font-semibold" style={{ color: DRACULA.fg }}>{project || 'Selecione um projeto'}</h2>
            <div className="h-4 w-px" style={{ backgroundColor: DRACULA.border }} />
            <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: DRACULA.bgSubtle }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setView(t.key)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200" style={view === t.key ? { backgroundColor: DRACULA.currentLine, color: DRACULA.fg, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' } : { color: DRACULA.comment }}>
                  <t.icon className="w-3.5 h-3.5" />{t.label}
                </button>
              ))}
              <button onClick={() => setView('calendar')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200" style={view === 'calendar' ? { backgroundColor: DRACULA.currentLine, color: DRACULA.fg, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' } : { color: DRACULA.comment }}>
                <Calendar className="w-3.5 h-3.5" />Calendario
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: DRACULA.comment }} />
              <input value={filterSearch} onChange={e => setFilterSearch(e.target.value)} placeholder="Buscar fase..." className="w-48 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none transition-all duration-200" style={{ backgroundColor: DRACULA.bgSubtle, color: DRACULA.fg, border: `1px solid ${DRACULA.currentLine}` }} onFocus={e => e.target.style.borderColor = DRACULA.purple} onBlur={e => e.target.style.borderColor = DRACULA.currentLine} />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs rounded-lg px-2.5 py-2 focus:outline-none" style={{ backgroundColor: DRACULA.bgSubtle, color: DRACULA.fgDim, border: `1px solid ${DRACULA.border}` }}>
              <option value="Todos" style={{ backgroundColor: DRACULA.bgElev }}>Todos os status</option>
              {STATUS_ORDER.map(s => <option key={s} value={s} style={{ backgroundColor: DRACULA.bgElev }}>{s}</option>)}
            </select>

            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: DRACULA.bgSubtle, border: `1px solid ${DRACULA.border}`, color: DRACULA.fgDim }}>
              <CalendarDays className="w-3.5 h-3.5" style={{ color: DRACULA.comment }} />
              <span>Ref:</span>
              <input type="date" value={ref} onChange={e => setRef(e.target.value)} className="bg-transparent focus:outline-none font-medium" style={{ color: DRACULA.fg }} />
            </div>

            {/* Notifications bell */}
            <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-lg transition-colors hover:bg-white/10" style={{ color: DRACULA.fgDim }}>
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: DRACULA.red, color: '#fff' }}>{alertCount}</span>
              )}
            </button>

            <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ backgroundColor: DRACULA.purple, color: DRACULA.bg }}>
              <Plus className="w-3.5 h-3.5" /> Nova Fase
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: DRACULA.bg }}>
          <div className="px-8 py-6 max-w-[1400px] mx-auto space-y-6">

            {/* Add phase form */}
            {showForm && (
              <div className="animate-fade-in">
                <form onSubmit={e => { e.preventDefault(); actions.add(); }} className="flex items-end gap-3 p-5 rounded-xl" style={{ backgroundColor: `${DRACULA.purple}12`, border: `1px solid ${DRACULA.purple}30` }}>
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: DRACULA.comment }}>Nome da Etapa</label>
                    <input value={form.etapa} onChange={e => setForm({ ...form, etapa: e.target.value })} className="w-full text-sm rounded-lg px-3.5 py-2.5 focus:outline-none" style={{ backgroundColor: DRACULA.bgSubtle, color: DRACULA.fg, border: `1px solid ${DRACULA.currentLine}` }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: DRACULA.comment }}>Data Inicio</label>
                    <input type="date" value={form.ini} onChange={e => setForm({ ...form, ini: e.target.value })} className="text-sm rounded-lg px-3.5 py-2.5 focus:outline-none" style={{ backgroundColor: DRACULA.bgSubtle, color: DRACULA.fg, border: `1px solid ${DRACULA.currentLine}` }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: DRACULA.comment }}>Data Fim</label>
                    <input type="date" value={form.fim} onChange={e => setForm({ ...form, fim: e.target.value })} className="text-sm rounded-lg px-3.5 py-2.5 focus:outline-none" style={{ backgroundColor: DRACULA.bgSubtle, color: DRACULA.fg, border: `1px solid ${DRACULA.currentLine}` }} />
                  </div>
                  <button type="submit" className="btn-primary" style={{ backgroundColor: DRACULA.purple, color: DRACULA.bg }}>Adicionar</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ color: DRACULA.fgDim, borderColor: DRACULA.currentLine }}>Cancelar</button>
                </form>
              </div>
            )}

            {/* Panels (collapsible side sections) */}
            {showHistory && (
              <div className="animate-fade-in rounded-xl p-5" style={{ backgroundColor: DRACULA.bgElev, border: `1px solid ${DRACULA.border}` }}>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4" style={{ color: DRACULA.purple }} />
                  <h3 className="text-sm font-semibold" style={{ color: DRACULA.fg }}>Historico de Alteracoes</h3>
                  <button onClick={() => setShowHistory(false)} className="ml-auto p-1 rounded hover:bg-white/10" style={{ color: DRACULA.fgDim }}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <HistoryLog history={history} fases={fases} />
              </div>
            )}

            {showGargalos && (
              <div className="animate-fade-in rounded-xl p-5" style={{ backgroundColor: DRACULA.bgElev, border: `1px solid ${DRACULA.border}` }}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4" style={{ color: DRACULA.orange }} />
                  <h3 className="text-sm font-semibold" style={{ color: DRACULA.fg }}>Deteccao de Gargalos</h3>
                  <button onClick={() => setShowGargalos(false)} className="ml-auto p-1 rounded hover:bg-white/10" style={{ color: DRACULA.fgDim }}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <BottleneckPanel gargalos={gargalos} />
              </div>
            )}

            {showTemplates && (
              <div className="animate-fade-in rounded-xl p-5" style={{ backgroundColor: DRACULA.bgElev, border: `1px solid ${DRACULA.border}` }}>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-4 h-4" style={{ color: DRACULA.green }} />
                  <h3 className="text-sm font-semibold" style={{ color: DRACULA.fg }}>Templates de Projeto</h3>
                  <button onClick={() => setShowTemplates(false)} className="ml-auto p-1 rounded hover:bg-white/10" style={{ color: DRACULA.fgDim }}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <TemplatesPanel templates={templates} onSave={actions.templateSave} onDelete={actions.templateDelete} onApply={actions.templateApply} onCurrent={actions.templateCurrent} />
              </div>
            )}

            {/* Progress bar */}
            <div className="rounded-xl p-4" style={{ backgroundColor: DRACULA.bgElev, border: `1px solid ${DRACULA.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4" style={{ color: DRACULA.purple }} />
                  <span className="text-sm font-semibold" style={{ color: DRACULA.fg }}>Progresso do Projeto</span>
                </div>
                <span className="text-sm font-bold" style={{ color: progress >= 100 ? DRACULA.green : DRACULA.purple }}>{progress}%</span>
              </div>
              <div className="h-2.5 rounded-full" style={{ backgroundColor: DRACULA.bgSubtle }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: progress + '%', backgroundColor: progress >= 100 ? DRACULA.green : DRACULA.purple }} />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px]" style={{ color: DRACULA.comment }}>{completed} de {list.length} fases concluidas</span>
                <span className="text-[11px]" style={{ color: DRACULA.comment }}>{list.length - completed} restantes</span>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
              {STATS.map(({ key, label }) => {
                const c = ST[key] || ST['Nao Iniciada'];
                const count = counts[key] || 0;
                return (
                  <div key={key} className="stat-card" style={{ backgroundColor: DRACULA.bgElev, borderColor: DRACULA.border }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: DRACULA.comment }}>{label}</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.solid }} />
                    </div>
                    <span className="text-3xl font-bold tabular-nums" style={{ color: c.text }}>{count}</span>
                    <span className="text-xs ml-1.5" style={{ color: DRACULA.comment }}>fase{count !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>

            {/* Table View */}
            {view === 'table' && (
              <div className="card" style={{ backgroundColor: DRACULA.bgElev, borderColor: DRACULA.border }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${DRACULA.border}` }}>
                      <th className="px-4 py-3.5 w-10">
                        <label className="relative flex items-center justify-center">
                          <input type="checkbox" checked={list.length > 0 && selected.size === list.length} onChange={e => setSelected(e.target.checked ? new Set(list.map(f => f.id)) : new Set())} className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: DRACULA.red }} />
                        </label>
                      </th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: DRACULA.comment }}>Depend.</th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: DRACULA.comment }}>Etapa</th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider w-40" style={{ color: DRACULA.comment }}>Inicio</th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider w-40" style={{ color: DRACULA.comment }}>Fim</th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: DRACULA.comment }}>Status</th>
                      <th className="text-right px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider w-32" style={{ color: DRACULA.comment }}>Acoes</th>
                    </tr>
                  </thead>
                  <tbody style={{ borderColor: DRACULA.currentLine }}>
                    {list.length === 0 && (
                      <tr><td colSpan={7} className="px-6 py-20 text-center" style={{ color: DRACULA.comment }}>Nenhuma fase encontrada</td></tr>
                    )}
                    {list.map((f) => {
                      const ed = editId === f.id;
                      const s = ST[f.Status] || ST['Nao Iniciada'];
                      const depName = f.Dependencia_Id ? list.find(l => l.id === f.Dependencia_Id)?.Etapa : null;
                      return (
                        <tr key={f.id} className="group transition-colors duration-150" style={{ backgroundColor: selected.has(f.id) ? `${DRACULA.red}12` : 'transparent', borderBottom: `1px solid ${DRACULA.currentLine}` }}>
                          <td className="px-4">
                            <label className="flex items-center justify-center py-4 cursor-pointer">
                              <input type="checkbox" checked={selected.has(f.id)} onChange={e => { const next = new Set(selected); e.target.checked ? next.add(f.id) : next.delete(f.id); setSelected(next); }} className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: DRACULA.red }} />
                            </label>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={f.Dependencia_Id || ''}
                              onChange={e => actions.dep(f.id, e.target.value ? Number(e.target.value) : null)}
                              className="text-[11px] rounded px-1 py-1 focus:outline-none"
                              style={{ backgroundColor: DRACULA.bgSubtle, color: DRACULA.fgDim, border: `1px solid ${DRACULA.border}` }}
                            >
                              <option value="" style={{ backgroundColor: DRACULA.bgElev }}>Nenhuma</option>
                              {list.filter(l => l.id !== f.id).map(l => (
                                <option key={l.id} value={l.id} style={{ backgroundColor: DRACULA.bgElev }}>{l.Etapa.slice(0, 15)}...</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 font-medium" style={{ color: DRACULA.fg }}>{f.Etapa}</td>
                          <td className="px-6 py-4" style={{ color: DRACULA.fgDim }}>
                            {ed ? <input type="date" value={editD.i} onChange={e => setEditD({ ...editD, i: e.target.value })} className="text-xs rounded-md px-2.5 py-1.5 focus:outline-none" style={{ backgroundColor: DRACULA.bgSubtle, color: DRACULA.fg, border: `1px solid ${DRACULA.currentLine}` }} /> : <span className="font-medium">{fmtDate(f.Data_Inicio)}</span>}
                          </td>
                          <td className="px-6 py-4" style={{ color: DRACULA.fgDim }}>
                            {ed ? <input type="date" value={editD.f} onChange={e => setEditD({ ...editD, f: e.target.value })} className="text-xs rounded-md px-2.5 py-1.5 focus:outline-none" style={{ backgroundColor: DRACULA.bgSubtle, color: DRACULA.fg, border: `1px solid ${DRACULA.currentLine}` }} /> : <span className="font-medium">{fmtDate(f.Data_Fim)}</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.solid }} />{f.Status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!ed ? (
                                <button onClick={() => { setEditId(f.id); setEditD({ i: f.Data_Inicio, f: f.Data_Fim }); }} className="p-1.5 rounded-md transition-all duration-150 hover:scale-110" style={{ color: DRACULA.fgDim }} title="Editar">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                              ) : (
                                <>
                                  <button onClick={() => actions.save(f.id)} className="p-1.5 rounded-md transition-all duration-150 hover:scale-110" style={{ color: DRACULA.green }}><CheckCircle2 className="w-4 h-4" /></button>
                                  <button onClick={() => setEditId(null)} className="p-1.5 rounded-md transition-all duration-150 hover:scale-110" style={{ color: DRACULA.comment }}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </>
                              )}
                              {f.dbStatus !== 'Finalizado' && f.Status !== 'Finalizado' && (
                                <button onClick={() => actions.done(f.id)} className="p-1.5 rounded-md transition-all duration-150 hover:scale-110" style={{ color: DRACULA.purple }} title="Finalizar"><CheckCircle2 className="w-4 h-4" /></button>
                              )}
                              <button onClick={() => actions.del(f.id)} className="p-1.5 rounded-md transition-all duration-150 hover:scale-110" style={{ color: DRACULA.red }} title="Excluir"><Trash2 className="w-4 h-4" /></button>
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
              <div className="card px-8 py-6" style={{ backgroundColor: DRACULA.bgElev, borderColor: DRACULA.border }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ST['Finalizado'].bg }}>
                    <CalendarDays className="w-4 h-4" style={{ color: ST['Finalizado'].text }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: DRACULA.fg }}>Cronograma</h3>
                    <p className="text-xs" style={{ color: DRACULA.comment }}>Visualizacao temporal das fases</p>
                  </div>
                </div>
                <GanttChart fases={list} />
                <div className="flex flex-wrap gap-5 mt-6 pt-4" style={{ borderTop: `1px solid ${DRACULA.border}` }}>
                  {STATUS_ORDER.map(s => (<span key={s} className="flex items-center gap-2.5 text-xs font-medium" style={{ color: DRACULA.fgDim }}><span className="w-3 h-3 rounded-full" style={{ backgroundColor: ST[s].solid }} />{s}</span>))}
                </div>
              </div>
            )}

            {/* Chart View */}
            {view === 'chart' && (
              <div className="card px-8 py-6" style={{ backgroundColor: DRACULA.bgElev, borderColor: DRACULA.border }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ST['Dentro do Prazo'].bg }}>
                    <BarChart3 className="w-4 h-4" style={{ color: ST['Dentro do Prazo'].text }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: DRACULA.fg }}>Distribuicao dos Status</h3>
                    <p className="text-xs" style={{ color: DRACULA.comment }}>{list.length} fase(s) no total</p>
                  </div>
                </div>
                <StatusBarChart fases={list} />
              </div>
            )}

            {/* Calendar View - new tab */}
            {(view === 'calendar') && (
              <div className="card px-8 py-6" style={{ backgroundColor: DRACULA.bgElev, borderColor: DRACULA.border }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ST['Quase Atraso'].bg }}>
                    <Calendar className="w-4 h-4" style={{ color: ST['Quase Atraso'].text }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: DRACULA.fg }}>Calendario</h3>
                    <p className="text-xs" style={{ color: DRACULA.comment }}>Visualizacao mensal das fases</p>
                  </div>
                </div>
                <CalendarView fases={list} />
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}