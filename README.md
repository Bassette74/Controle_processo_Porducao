# Controle de Processo de Produção

Dashboard interativo para gerenciamento visual de múltiplos projetos, etapas produtivas e acompanhamento de cronogramas.

**Stack:** Next.js 15 (App Router) + Tailwind CSS + shadcn/ui + Recharts + SQLite

## Funcionalidades

- Gerenciamento visual de múltiplos projetos
- Adicionar, editar, excluir e finalizar fases da produção
- Importação de planilhas CSV e Excel
- Exportação dos dados atualizados para CSV e Excel
- Persistência automática em banco SQLite (`projeto.db`)
- Cálculo automático de status das fases (Atraso, Dentro do Prazo, Quase Atraso, etc.)
- Detecção de sobreposição de datas
- Gráfico Gantt interativo com cores por status
- Gráfico de barras com distribuição dos status
- Interface responsiva e profissional com Tailwind CSS
- Tema Dracula (cores #282a36, #8be9fd, #50fa7b, #bd93f9, etc.)
- Upload de logo da empresa na sidebar com persistência via localStorage
- Banco de dados SQLite reutilizável do projeto Python anterior

## Instalação

```bash
npm install
```

## Execução

```bash
npm run dev
```

Acesse em: http://localhost:3000

## Estrutura de Arquivos

```
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Layout global
│   │   ├── page.tsx             # Dashboard principal
│   │   └── api/fases/
│   │       └── route.ts         # API REST (CRUD completo)
│   └── lib/
│       └── db.ts                # Camada SQLite (better-sqlite3)
├── components/
│   └── ui/                      # shadcn/ui components
├── lib/
│   └── utils.ts                 # Utilitários (cn helper)
├── projeto.db                   # Banco SQLite (criado automaticamente)
└── .gitignore
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/fases` | Retorna todas as fases |
| GET | `/api/fases?projeto=X` | Retorna fases do projeto X |
| GET | `/api/fases?action=projects` | Retorna lista de projetos |
| POST | `/api/fases` | Cria nova fase |
| PUT | `/api/fases` | Atualiza datas ou status |
| DELETE | `/api/fases?id=X` | Deleta fase pelo ID |
| POST | `/api/fases?action=seed` | Resetar dados de exemplo |
| POST | `/api/fases?action=import` | Importar planilha |

## Histórico de Atualizações

### v2.0 — Migração para Next.js (Atual)
- Projeto migrado de Streamlit (Python) para Next.js 15 (React/TypeScript)
- Interface totalmente reformulada com Tailwind CSS e componentes modernos
- Gráfico Gantt implementado em SVG responsivo
- Gráfico de barras com Recharts
- API REST com CRUD completo para fases e projetos
- Banco SQLite (better-sqlite3) reutilizado com o mesmo `projeto.db`
- Importação CSV/Excel, exportação, reset de dados
- Botões de ação inline (editar, finalizar, excluir)
- Dados de exemplo inseridos automaticamente se o DB estiver vazio

### v1.3 — Banco de dados SQLite
- Integrado SQLite (`projeto.db`) para persistência automática
- Dados salvos ao editar datas, finalizar fases ou importar planilhas
- Botão "Resetar para dados de exemplo"

### v1.2 — Importação CSV/Excel e reordenação de gráficos
- Barra lateral com upload e download de modelos
- Gráfico de Gantt antes, barras depois
- Botões de exportar CSV e Excel

### v1.1 — Correção das cores do Gantt
- Cores do gráfico associadas corretamente ao nome do status (não ao índice)

### v1.0 — Criação dos dashboards Streamlit
- Dashboards iniciais com gráficos Gantt e barras
