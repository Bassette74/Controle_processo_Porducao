
# Controle de Processo de Produção

Este repositório contém um conjunto completo de dashboards desenvolvidos em **Python + Streamlit** para gerenciamento visual de múltiplos projetos, etapas produtivas e acompanhamento de cronogramas. O objetivo é disponibilizar ferramentas modernas e simples que permitam às equipes de produção, engenharia e PCP controlar suas atividades de forma eficiente.

## 🚀 Funcionalidades Principais
- Gerenciamento visual de múltiplos projetos
- Adicionar, editar, excluir e finalizar fases da produção
- Importação e exportação de planilhas Excel
- Cálculo automático de status das fases
- Detecção de sobreposição de datas
- Gráficos Gantt profissionais com Plotly
- Gráficos de barras indicando distribuição dos status
- Interface moderna e interativa usando Streamlit

## 📂 Arquivos Presentes
- **dashboard_profissional.py**: Versão visualmente aprimorada, ideal para uso corporativo.
- **dashboard_crud.py**: Dashboard completo com adição, edição e exclusão de fases.
- **dashboard_datas.py**: Versão com datas reais e verificação de sobreposição.
- **dashboard_dias.py**: Versão mais simples baseada em dias (1 a 40).
- **dashboard_excel.py**: Versão minimalista usando upload de planilha.
- **banner_streamlit.py**: Exemplo básico de banner visual com Streamlit.
- **banner.py**: Gantt simples baseado em arquivo Excel.

## 🧠 Como Executar
### 1️⃣ Instalar dependências
Você pode instalar tudo com:
```bash
pip install streamlit pandas plotly openpyxl
```

Ou usando um arquivo `requirements.txt`, caso exista:
```bash
pip install -r requirements.txt
```

### 2️⃣ Executar qualquer arquivo Streamlit
```bash
streamlit run dashboard_profissional.py
```
Ou substitua pelo arquivo desejado:
```bash
streamlit run dashboard_crud.py
```

### 3️⃣ Acessar no navegador
O Streamlit abrirá automaticamente em:
```
http://localhost:8501
```

## 📦 Bibliotecas Necessárias
- **streamlit** – Interface web
- **pandas** – Manipulação de dados
- **plotly** – Gráficos Gantt e barras
- **openpyxl** – Leitura/escrita de Excel
- **datetime** – Manipulação de datas
- **io** – Exportação e buffers de memória

## 🎯 Público-Alvo
Este projeto é ideal para:
- Equipes de Produção
- Engenharia
- PCP / PCM
- Logística
- PMO e Gestão de Projetos

## 📌 Objetivo
Proporcionar uma solução simples, interativa e poderosa para controle visual do processo produtivo e acompanhamento de cronogramas.

---
Este README serve como documentação oficial do repositório.
