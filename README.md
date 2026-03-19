Controle de Processo de Produção
Este repositório contém um conjunto completo de dashboards desenvolvidos em Python + Streamlit para gerenciamento visual deFuncionalidades Principais:
- Gerenciamento visual de múltiplos projetos
- Adicionar, editar, excluir e finalizar fases da produção
- Importação e exportação de planilhas Excel
- Cálculo automático de status das fases
- Detecção de sobreposição de datas
- Gráficos Gantt profissionais com Plotly
- Gráficos de barras indicando distribuição dos status
- Interface moderna e interativa usando Streamlit
Arquivos Presentes:
- dashboard_profissional.py: Versão visualmente aprimorada.
- dashboard_crud.py: Dashboard completo com CRUD.
- dashboard_datas.py: Versão com datas reais.
- dashboard_dias.py: Versão simples.
- dashboard_excel.py: Upload + Gantt.
- banner_streamlit.py: Banner simples.
- banner.py: Gantt baseado em Excel.
Como Executar:
1. Instale dependências: pip install streamlit pandas plotly openpyxl
2. Execute: streamlit run dashboard_profissional.py
3. Acesse: http://localhost:8501
Bibliotecas Necessárias:
- streamlit
- pandas
- plotly
- openpyxl
- datetime
- io
Público-Alvo:
Equipes de Produção, Engenharia, PCP, Logística e PMO.
Objetivo:
Fornecer uma solução clara, interativa e eficiente para controle visual do processo produtivo e acompanhamento de cronograma
