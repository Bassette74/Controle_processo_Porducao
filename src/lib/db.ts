import fs from 'fs';
import path from 'path';

let Database: any;
try {
  Database = require('better-sqlite3');
} catch {
  Database = () => ({ prepare: () => ({ all: () => [], run: () => {} }) });
}

const DB_PATH = path.join(process.cwd(), 'projeto.db');

function getDb(): any {
  if (!fs.existsSync(DB_PATH)) {
    seedDatabase();
  }
  return new Database(DB_PATH);
}

// Initialize DB schema with ALL new tables
function initDb(): void {
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS fases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Projeto TEXT NOT NULL,
      Etapa TEXT NOT NULL,
      Data_Inicio TEXT NOT NULL,
      Data_Fim TEXT NOT NULL,
      Status TEXT NOT NULL DEFAULT 'Nao Iniciada',
      Dependencia_Id INTEGER,
      FOREIGN KEY (Dependencia_Id) REFERENCES fases(id)
    );

    CREATE TABLE IF NOT EXISTS alteracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fase_id INTEGER NOT NULL,
      campo TEXT NOT NULL,
      valor_antigo TEXT NOT NULL,
      valor_novo TEXT NOT NULL,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (fase_id) REFERENCES fases(id)
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT NOT NULL,
      dados TEXT NOT NULL
    );
  `);
  db.close();
}

function seedExampleData(db: any): void {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r.toISOString().split('T')[0];
  };

  const fases = [
    { Projeto: 'Projeto 1', Etapa: 'Inicio', dStart: 0, dEnd: 0 },
    { Projeto: 'Projeto 1', Etapa: 'Compras de Comp. 1', dStart: 1, dEnd: 2 },
    { Projeto: 'Projeto 1', Etapa: 'Compras de Comp. 2', dStart: 3, dEnd: 4 },
    { Projeto: 'Projeto 1', Etapa: 'Compras de Comp. 3', dStart: 5, dEnd: 6 },
    { Projeto: 'Projeto 1', Etapa: 'Chegada Produtos', dStart: 7, dEnd: 14 },
    { Projeto: 'Projeto 1', Etapa: 'Montagem', dStart: 15, dEnd: 29 },
    { Projeto: 'Projeto 1', Etapa: 'Teste', dStart: 30, dEnd: 32 },
    { Projeto: 'Projeto 1', Etapa: 'Faturamento', dStart: 33, dEnd: 34 },
    { Projeto: 'Projeto 2', Etapa: 'Inicio', dStart: 0, dEnd: 1 },
    { Projeto: 'Projeto 2', Etapa: 'Compras de Comp. 1', dStart: 2, dEnd: 3 },
    { Projeto: 'Projeto 2', Etapa: 'Chegada Produtos', dStart: 4, dEnd: 9 },
    { Projeto: 'Projeto 2', Etapa: 'Montagem', dStart: 10, dEnd: 19 },
    { Projeto: 'Projeto 2', Etapa: 'Teste', dStart: 20, dEnd: 24 },
    { Projeto: 'Projeto 2', Etapa: 'Faturamento', dStart: 25, dEnd: 27 },
  ];

  const stmt = db.prepare(
    "INSERT INTO fases (Projeto, Etapa, Data_Inicio, Data_Fim, Status, Dependencia_Id) VALUES (?, ?, ?, ?, 'Nao Iniciada', ?)"
  );
  db.exec("DELETE FROM alteracoes");

  // For phase order dependencies within each project
  // Set dependencia to the previous phase
  const insertMany = db.transaction((rows: any[]) => {
    const projectOrder: Record<string, number[]> = {};
    const ids: number[][] = [];

    for (const r of rows) {
      const result = stmt.run(r.Projeto, r.Etapa, addDays(hoje, r.dStart), addDays(hoje, r.dEnd), null);
      if (!projectOrder[r.Projeto]) projectOrder[r.Projeto] = [];
      projectOrder[r.Projeto].push(result.lastInsertRowid);
    }

    // Set dependencies: phase 2 depends on phase 1, etc.
    for (const ids of Object.values(projectOrder)) {
      for (let i = 1; i < ids.length; i++) {
        db.prepare('UPDATE fases SET Dependencia_Id = ? WHERE id = ?').run(ids[i - 1], ids[i]);
      }
    }
  });
  insertMany(fases);
}

function seedDatabase(): void {
  initDb();
  const db = new Database(DB_PATH);
  const count = db.prepare('SELECT COUNT(*) as c FROM fases').get();
  if (count.c === 0) {
    seedExampleData(db);
  }
  db.close();
}

if (typeof window === 'undefined') {
  initDb();
  seedDatabase();
}

// ============================================================
// Public API
// ============================================================

export interface Fase {
  id: number;
  Projeto: string;
  Etapa: string;
  Data_Inicio: string;
  Data_Fim: string;
  Status: string;
  Dependencia_Id: number | null;
}

export interface Alteracao {
  id: number;
  fase_id: number;
  campo: string;
  valor_antigo: string;
  valor_novo: string;
  criado_em: string;
}

export interface Template {
  id: number;
  nome: string;
  descricao: string;
  dados: string;
}

export function getAllFases(): Fase[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM fases').all();
  db.close();
  return rows;
}

export function getProjects(): string[] {
  const db = getDb();
  const rows = db.prepare('SELECT DISTINCT Projeto FROM fases ORDER BY Projeto').all();
  db.close();
  return rows.map((r: any) => r.Projeto);
}

export function updateFaseDates(id: number, dataInicio: string, dataFim: string): void {
  const db = getDb();
  const fase = db.prepare('SELECT * FROM fases WHERE id = ?').get(id);
  db.prepare('UPDATE fases SET Data_Inicio = ?, Data_Fim = ? WHERE id = ?').run(dataInicio, dataFim, id);
  if (fase && fase.Data_Inicio !== dataInicio) {
    db.prepare('INSERT INTO alteracoes (fase_id, campo, valor_antigo, valor_novo) VALUES (?, ?, ?, ?)').run(id, 'Data_Inicio', fase.Data_Inicio, dataInicio);
  }
  if (fase && fase.Data_Fim !== dataFim) {
    db.prepare('INSERT INTO alteracoes (fase_id, campo, valor_antigo, valor_novo) VALUES (?, ?, ?, ?)').run(id, 'Data_Fim', fase.Data_Fim, dataFim);
  }
  db.close();
}

export function updateFaseStatus(id: number, status: string): void {
  const db = getDb();
  const fase = db.prepare('SELECT * FROM fases WHERE id = ?').get(id);
  db.prepare('UPDATE fases SET Status = ? WHERE id = ?').run(status, id);
  if (fase && fase.Status !== status) {
    db.prepare('INSERT INTO alteracoes (fase_id, campo, valor_antigo, valor_novo) VALUES (?, ?, ?, ?)').run(id, 'Status', fase.Status, status);
  }
  db.close();
}

export function setDependencia(id: number, dependenciaId: number | null): void {
  const db = getDb();
  db.prepare('UPDATE fases SET Dependencia_Id = ? WHERE id = ?').run(dependenciaId || null, id);
  db.close();
}

export function insertFase(projeto: string, etapa: string, dataInicio: string, dataFim: string, status = 'Nao Iniciada', dependenciaId: number | null = null): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO fases (Projeto, Etapa, Data_Inicio, Data_Fim, Status, Dependencia_Id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(projeto, etapa, dataInicio, dataFim, status, dependenciaId || null);
  db.close();
}

export function deleteFase(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM fases WHERE id = ?').run(id);
  db.prepare('DELETE FROM alteracoes WHERE fase_id = ?').run(id);
  db.close();
}

export function seedReset(): void {
  const db = getDb();
  db.prepare('DELETE FROM fases').run();
  db.prepare('DELETE FROM alteracoes').run();
  seedExampleData(db);
  db.close();
}

export function importFases(fases: Omit<Fase, 'id'>[]): void {
  const db = getDb();
  db.prepare('DELETE FROM fases').run();
  db.prepare('DELETE FROM alteracoes').run();
  const stmt = db.prepare(
    'INSERT INTO fases (Projeto, Etapa, Data_Inicio, Data_Fim, Status, Dependencia_Id) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertMany = db.transaction((rows: any[]) => {
    for (const r of rows) {
      stmt.run(r.Projeto, r.Etapa, r.Data_Inicio, r.Data_Fim, r.Status, r.Dependencia_Id || null);
    }
  });
  insertMany(fases);
  db.close();
}

export function getQuaseAtrasoFases(refDate: string): Fase[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM fases').all();
  db.close();
  const hoje = new Date(refDate + 'T00:00:00');
  return (rows as Fase[]).filter(f => {
    if (f.Status === 'Finalizado') return false;
    const inicio = new Date(f.Data_Inicio + 'T00:00:00');
    const fim = new Date(f.Data_Fim + 'T00:00:00');
    if (hoje < inicio || hoje > fim) return false;
    const diff = Math.floor((fim.getTime() - hoje.getTime()) / 86400000);
    return diff >= 0 && diff <= 2;
  });
}

// ============================================================
// History / Alteracoes
// ============================================================

export function getAlteracoes(limit = 100): Alteracao[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM alteracoes ORDER BY criado_em DESC LIMIT ?').all(limit);
  db.close();
  return rows;
}

// ============================================================
// Bottleneck / Gargalo Detection
// ============================================================

export interface Gargalo {
  etapa: string;
  atrasoCount: number;
  impactoCount: number;
  projeto: string;
}

export function detectGargalos(): Gargalo[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM fases').all();
  const altRows = db.prepare('SELECT * FROM alteracoes WHERE campo = "Data_Fim"').all();
  db.close();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Count how many times each etapa has "Atraso" status
  const atrasoMap: Record<string, { count: number; projeto: string }> = {};
  for (const f of rows) {
    if (f.Status === 'Atraso') {
      if (!atrasoMap[f.Etapa]) atrasoMap[f.Etapa] = { count: 0, projeto: f.Projeto };
      atrasoMap[f.Etapa].count++;
    }
  }

  // Count how many times each etapa had its date changed
  const impactoMap: Record<string, number> = {};
  for (const a of altRows) {
    impactoMap[a.fase_id] = (impactoMap[a.fase_id] || 0) + 1;
  }

  // Get phase names from IDs
  const faseNames: Record<number, { etapa: string; projeto: string }> = {};
  for (const f of rows) {
    faseNames[f.id] = { etapa: f.Etapa, projeto: f.Projeto };
  }

  // Combine: sort by atraso + remap
  const gargalos = Object.entries(atrasoMap).map(([etapa, info]) => ({
    etapa,
    atrasoCount: info.count,
    impactoCount: Object.values(impactoMap).reduce((a, b) => a + b, 0),
    projeto: info.projeto,
  })).sort((a, b) => b.atrasoCount - a.atrasoCount);

  return gargalos;
}

// ============================================================
// Templates
// ============================================================

export function getTemplates(): Template[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM templates').all();
  db.close();
  return rows;
}

export function saveTemplate(nome: string, descricao: string, fases: Fase[]): void {
  const db = getDb();
  db.prepare('INSERT INTO templates (nome, descricao, dados) VALUES (?, ?, ?)').run(
    nome, descricao, JSON.stringify(fases.map(f => ({ Projeto: f.Projeto, Etapa: f.Etapa, Data_Inicio: f.Data_Inicio, Data_Fim: f.Data_Fim, Status: f.Status })))
  );
  db.close();
}

export function deleteTemplate(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM templates WHERE id = ?').run(id);
  db.close();
}

export function applyTemplate(id: number): void {
  const db = getDb();
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
  if (!template) { db.close(); return; }
  const phases: any[] = JSON.parse(template.dados);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r.toISOString().split('T')[0];
  };
  db.prepare('DELETE FROM fases').run();
  db.prepare('DELETE FROM alteracoes').run();
  const insertMany = db.transaction((p: any[]) => {
    let offset = 0;
    for (const ph of p) {
      db.prepare(
        'INSERT INTO fases (Projeto, Etapa, Data_Inicio, Data_Fim, Status) VALUES (?, ?, ?, ?, ?)'
      ).run(ph.Projeto, ph.Etapa, addDays(hoje, offset), addDays(hoje, offset + (ph.duracao || 1)), ph.Status);
      offset += (ph.duracao || 1);
    }
  });
  insertMany(phases);
  db.close();
}

export function saveCurrentAsTemplate(): void {
  const db = getDb();
  const phases = db.prepare('SELECT * FROM fases').all();
  if (phases.length === 0) { db.close(); return; }
  db.prepare('INSERT INTO templates (nome, descricao, dados) VALUES (?, ?, ?)').run(
    'Meu Projeto', 'Template do projeto atual', JSON.stringify(phases.map((f: any) => ({ Projeto: f.Projeto, Etapa: f.Etapa, Data_Inicio: f.Data_Inicio, Data_Fim: f.Data_Fim, Status: f.Status })))
  );
  db.close();
}
