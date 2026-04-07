import { NextRequest, NextResponse } from 'next/server';
import {
  getAllFases,
  getProjects,
  updateFaseDates,
  updateFaseStatus,
  insertFase,
  deleteFase,
  seedReset,
  importFases,
  getQuaseAtrasoFases,
  setDependencia,
  getAlteracoes,
  detectGargalos,
  getTemplates,
  saveTemplate,
  deleteTemplate,
  applyTemplate,
  saveCurrentAsTemplate,
  type Fase,
} from '@/src/lib/db';
import { sendAlerts, type EmailConfig } from '@/src/lib/email';

export async function GET(request: NextRequest) {
  const projeto = request.nextUrl.searchParams.get('projeto');
  const action = request.nextUrl.searchParams.get('action');
  const ref = request.nextUrl.searchParams.get('ref') || new Date().toISOString().split('T')[0];

  if (action === 'projects') return NextResponse.json(getProjects());
  if (action === 'history') return NextResponse.json(getAlteracoes(parseInt(request.nextUrl.searchParams.get('limit') || '100')));
  if (action === 'gargalos') return NextResponse.json(detectGargalos());
  if (action === 'templates') return NextResponse.json(getTemplates());
  if (action === 'alert') {
    return NextResponse.json({ error: 'Nao usado via GET' });
  }

  const fases = getAllFases();
  if (projeto) return NextResponse.json(fases.filter((f) => f.Projeto === projeto));
  return NextResponse.json(fases);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = request.nextUrl.searchParams.get('action');

  if (action === 'seed') { seedReset(); return NextResponse.json({ success: true }); }
  if (action === 'import') { importFases(body.fases as Omit<Fase, 'id'>[]); return NextResponse.json({ success: true }); }
  if (action === 'template-save') { saveTemplate(body.nome || 'Template', body.desc || '', getAllFases()); return NextResponse.json({ success: true }, { status: 201 }); }
  if (action === 'template-apply') { applyTemplate(body.id); return NextResponse.json({ success: true }); }
  if (action === 'template-current') { saveCurrentAsTemplate(); return NextResponse.json({ success: true }, { status: 201 }); }

  const { Projeto, Etapa, Data_Inicio, Data_Fim, Status, Dependencia_Id } = body;
  if (!Projeto || !Etapa || !Data_Inicio || !Data_Fim) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  insertFase(Projeto, Etapa, Data_Inicio, Data_Fim, Status || 'Nao Iniciada', Dependencia_Id || null);
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, Data_Inicio, Data_Fim, Status, Dependencia_Id } = body;

  if (!id) return NextResponse.json({ error: 'ID necessario' }, { status: 400 });

  if (Data_Inicio !== undefined && Data_Fim !== undefined) updateFaseDates(id, Data_Inicio, Data_Fim);
  if (Status !== undefined) updateFaseStatus(id, Status);
  if (Dependencia_Id !== undefined) setDependencia(id, Dependencia_Id);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  const action = searchParams.get('action');

  if (action === 'template') {
    deleteTemplate(parseInt(searchParams.get('template_id') || '0'));
    return NextResponse.json({ success: true });
  }

  if (!id) return NextResponse.json({ error: 'ID necessario' }, { status: 400 });
  deleteFase(Number(id));
  return NextResponse.json({ success: true });
}

// PATCH: alerts
export async function PATCH(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');
  const body = await request.json().catch(() => ({}));
  const ref = request.nextUrl.searchParams.get('ref') || new Date().toISOString().split('T')[0];

  if (action === 'alert') {
    const { user, appPassword, recipient } = (body.emailConfig || {}) as EmailConfig;
    if (!user || !appPassword || !recipient) {
      return NextResponse.json({ error: 'Configuracao de email necessaria', alertsSent: 0 });
    }
    const alertFases = getQuaseAtrasoFases(ref);
    const emailFases = alertFases.map(f => ({ projeto: f.Projeto, etapa: f.Etapa, dataFim: f.Data_Fim }));
    const { sent } = await sendAlerts({ user, appPassword, recipient }, emailFases);
    return NextResponse.json({ success: true, alertsSent: sent });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
