# Controle de Processo de Produção

Dashboard interativo em **Python + Streamlit** para gerenciamento visual de múltiplos projetos, etapas produtivas e acompanhamento de cronogramas com persistência de dados em **SQLite**.

## Funcionalidades

- Gerenciamento visual de múltiplos projetos
- Adicionar, editar, excluir e finalizar fases da produção
- Importação de planilhas CSV e Excel
- Exportação dos dados atualizados para CSV e Excel
- Persistência automática em banco SQLite (`projeto.db`)
- Cálculo automático de status das fases (Atraso, Dentro do Prazo, Quase Atraso, etc.)
- Detecção de sobreposição de datas
- Gráficos Gantt profissionais com Plotly (cores corretas por status)
- Gráfico de barras com distribuição dos status
- Interface moderna e interativa usando Streamlit

## Execução

```bash
pip install streamlit pandas plotly openpyxl
streamlit run dashboard_streamlit_profissional.py
```

Acesse em: http://localhost:8501

## Estrutura de Arquivos

| Arquivo | Descrição |
|---|---|
| `dashboard_streamlit_profissional.py` | Dashboard principal com SQLite, gráficos e importação/exportação |
| `dashboard_streamlit_editavel.py` | Dashboard com adição e exclusão de fases |
| `dashboard_streamlit_datas.py` | Dashboard com datas reais e verificação de sobreposição |
| `dashboard_streamlit_multi.py` | Dashboard baseado em dias (1 a 40) com múltiplos projetos |
| `dashboard_streamlit_status.py` | Dashboard simples com status por dia |
| `dashboard_streamlit.py` | Dashboard básico com upload de planilha |
| `banner_streamlit.py` | Exemplo básico de banner com Streamlit |
| `banner.py` | Gantt simples baseado em arquivo Excel |
| `projeto.db` | Banco de dados SQLite (criado automaticamente) |

## Histórico de Atualizações

### v1.0 — Commit inicial
- Criação dos dashboards Streamlit com dados de exemplo
- Gráfico Gantt com Plotly
- Cálculo automático de status

### v1.1 — Correção das cores do Gantt (`fix: corrigir cores do gráfico Gantt`)
- Bug: cores do gráfico Gantt estavam trocadas entre os status (Atraso, Dentro do Prazo, etc.)
- Causa: parâmetro `colors` do `ff.create_gantt` recebia uma lista (mapped por índice) em vez de um dicionário
- Correção: passado o dicionário `cores` diretamente, mapeando nome do status à cor correta
- Arquivos corrigidos: `profissional`, `editavel`, `datas`, `multi`, `status`

### v1.2 — Importação CSV/Excel, barra lateral e reordenação de gráficos
- Adicionada barra lateral com upload de planilha CSV e Excel
- Adicionados botões para baixar modelos CSV e Excel na barra lateral
- Gráfico de Gantt movido para cima, gráfico de barras movido para baixo
- Adicionados botões de exportar CSV e Excel no rodapé
- Renomeada branch de `master` para `main`

### v1.3 — Banco de dados SQLite para persistência
- Integrado SQLite (`projeto.db`) para persistir alterações de forma permanente
- Dados salvos automaticamente ao editar datas, finalizar fases ou importar planilhas
- Carregamento automático do banco ao abrir o dashboard
- Dados de exemplo inseridos automaticamente se o banco estiver vazio
- Botão "Resetar para dados de exemplo" na barra lateral
