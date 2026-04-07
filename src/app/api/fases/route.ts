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
  type Fase,
} from '@/src/lib/db';
import { sendAlertEmail } from '@/src/lib/email';

export async function GET(request: NextRequest) {
  const projeto = request.nextUrl.searchParams.get('projeto');
  const action = request.nextUrl.searchParams.get('action');

  if (action === 'projects') {
    return NextResponse.json(getProjects());
  }

  const fases = getAllFases();

  if (projeto) {
    const filtered = fases.filter((f) => f.Projeto === projeto);
    return NextResponse.json(filtered);
  }

  return NextResponse.json(fases);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = request.nextUrl.searchParams.get('action');

  if (action === 'seed') {
    seedReset();
    return NextResponse.json({ success: true });
  }

  if (action === 'import') {
    importFases(body.fases as Omit<Fase, 'id'>[]);
    return NextResponse.json({ success: true });
  }

  const { Projeto, Etapa, Data_Inicio, Data_Fim, Status } = body;
  if (!Projeto || !Etapa || !Data_Inicio || !Data_Fim) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  insertFase(Projeto, Etapa, Data_Inicio, Data_Fim, Status || 'Nao Iniciada');
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, Data_Inicio, Data_Fim, Status } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID necessario' }, { status: 400 });
  }

  if (Data_Inicio !== undefined && Data_Fim !== undefined) {
    updateFaseDates(id, Data_Inicio, Data_Fim);
  }

  if (Status !== undefined) {
    updateFaseStatus(id, Status);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID necessario' }, { status: 400 });
  }

  deleteFase(Number(id));
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');

  if (action === 'alert') {
    const ref = request.nextUrl.searchParams.get('ref') || new Date().toISOString().split('T')[0];
    const alertFases = getQuaseAtrasoFases(ref);
    const results: Array<{ projeto: string; etapa: string; sent: boolean }> = [];
    for (const f of alertFases) {
      const sent = await sendAlertEmail({ projeto: f.Projeto, etapa: f.Etapa, dataFim: f.Data_Fim });
      results.push({ projeto: f.Projeto, etapa: f.Etapa, sent });
    }
    return NextResponse.json({ success: true, alertsSent: alertFases.length, results });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
