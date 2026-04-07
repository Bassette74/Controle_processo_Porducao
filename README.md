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
- Alertas por email para fases em "Quase Atraso" (via Gmail / SMTP)
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

## Configuração de Alertas por Email

Para receber alertas quando uma fase entrar em "Quase Atraso" (a ≤2 dias do vencimento):

1. Crie uma **App Password** na sua conta Gmail: `Google Account > Security > App passwords`
2. Copie `.env.local.example` para `.env.local` e preencha os campos:
   - `EMAIL_USER` — seu email Gmail
   - `EMAIL_APP_PASSWORD` — a senha de aplicativo gerada
   - `EMAIL_RECIPIENT` — email que receberá os alertas
3. Clique no botão **"Enviar Alertas"** na sidebar

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
| PATCH | `/api/fases?action=alert` | Enviar alertas de "Quase Atraso" por email |

## Histórico de Atualizações

### v2.0 — Migração para Next.js (Inicial)
- Projeto migrado de Streamlit (Python) para Next.js 15 (React/TypeScript)
- Interface totalmente reformulada com Tailwind CSS e componentes modernos
- Gráfico Gantt implementado em SVG responsivo
- Gráfico de barras com Recharts
- API REST com CRUD completo para fases e projetos
- Banco SQLite (better-sqlite3) reutilizado com o mesmo `projeto.db`
- Importação CSV/Excel, exportação, reset de dados
- Botões de ação inline (editar, finalizar, excluir)
- Dados de exemplo inseridos automaticamente se o DB estiver vazio

### v2.1 — Checkboxes e exclusão em bloco
- Checkboxes na tabela de fases
- Botão de excluir selecionados na sidebar lateral

### v2.2 — Importacao XLSX corrigida
- Corrigido parsing de datas no import Excel (serial numbers → Date objects)
- Corrigido botão "Finalizar" que sobrepunha status original

### v2.3 — CSS/Tailwind corrigido
- Adicionado postcss.config.mjs (faltava, impedindo compilação do Tailwind)
- Interface agora renderiza com estilos corretamente

### v2.4 — Bugfix de re-render
- Corrigido loop infinito de re-renders no carregamento do dashboard

### v2.5 — UI Profissional + Barra Lateral
- Layout estilo SaaS com sidebar de importação/exportação
- Botões de importar CSV/Excel, exportar para CSV e XLSX
- Gráficos reordenados (Gantt em cima, barras embaixo)

### v2.6 — Tema Dracula
- Tema Dracula aplicado em toda a interface
- Cores correspondentes ao VSCode Dracula (#282a36, #bd93f9, #50fa7b, #ffb86c, etc.)

### v2.7 — Logo da Empresa
- Upload de logo da empresa na sidebar
- Preview com opcoes de editar/remover no hover
- Persistencia via localStorage (base64)

### v2.8 — Alertas por Email
- Botão "Enviar Alertas" na sidebar
- Envia email por fase em "Quase Atraso" (≤2 dias do vencimento)
- Configurado via nodemailer + Gmail SMTP
- Arquivo .env.local com: EMAIL_USER, EMAIL_APP_PASSWORD, EMAIL_RECIPIENT

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
