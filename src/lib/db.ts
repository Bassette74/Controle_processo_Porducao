import fs from 'fs';
import path from 'path';

// better-sqlite3 is ONLY available server-side in Next.js
let Database: any;
try {
  Database = require('better-sqlite3');
} catch {
  // Running on client somehow — should never happen with proper server-only usage
  Database = () => ({ prepare: () => ({ all: () => [], run: () => {} }) });
}

const DB_PATH = path.join(process.cwd(), 'projeto.db');

function getDb(): any {
  if (!fs.existsSync(DB_PATH)) {
    seedDatabase();
  }
  return new Database(DB_PATH);
}

// Initialize DB schema
function initDb(): void {
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS fases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Projeto TEXT NOT NULL,
      Etapa TEXT NOT NULL,
      Data_Inicio TEXT NOT NULL,
      Data_Fim TEXT NOT NULL,
      Status TEXT NOT NULL DEFAULT 'Nao Iniciada'
    )
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
    "INSERT INTO fases (Projeto, Etapa, Data_Inicio, Data_Fim, Status) VALUES (?, ?, ?, ?, 'Nao Iniciada')"
  );
  const insertMany = db.transaction((rows: any[]) => {
    for (const r of rows) {
      stmt.run(r.Projeto, r.Etapa, addDays(hoje, r.dStart), addDays(hoje, r.dEnd));
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

// Ensure DB exists on startup
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
}

export function getAllFases(): Fase[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM fases').all();
  db.close();
  return rows;
}

export function getFasesByProject(projeto: string): Fase[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM fases WHERE Projeto = ?').all(projeto);
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
  db.prepare('UPDATE fases SET Data_Inicio = ?, Data_Fim = ? WHERE id = ?').run(dataInicio, dataFim, id);
  db.close();
}

export function updateFaseStatus(id: number, status: string): void {
  const db = getDb();
  db.prepare('UPDATE fases SET Status = ? WHERE id = ?').run(status, id);
  db.close();
}

export function insertFase(projeto: string, etapa: string, dataInicio: string, dataFim: string, status = 'Nao Iniciada'): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO fases (Projeto, Etapa, Data_Inicio, Data_Fim, Status) VALUES (?, ?, ?, ?, ?)'
  ).run(projeto, etapa, dataInicio, dataFim, status);
  db.close();
}

export function deleteFase(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM fases WHERE id = ?').run(id);
  db.close();
}

export function seedReset(): void {
  const db = getDb();
  db.prepare('DELETE FROM fases').run();
  seedExampleData(db);
  db.close();
}

export function importFases(fases: Omit<Fase, 'id'>[]): void {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO fases (Projeto, Etapa, Data_Inicio, Data_Fim, Status) VALUES (?, ?, ?, ?, ?)'
  );
  const insertMany = db.transaction((rows: any[]) => {
    for (const r of rows) {
      stmt.run(r.Projeto, r.Etapa, r.Data_Inicio, r.Data_Fim, r.Status);
    }
  });
  // Clear existing and insert imported
  db.prepare('DELETE FROM fases').run();
  insertMany(fases);
  db.close();
}

// ============================================================
// Email alert for "Quase Atraso"
// ============================================================

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
