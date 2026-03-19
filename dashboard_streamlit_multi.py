import streamlit as st
import pandas as pd
import plotly.figure_factory as ff
from datetime import datetime

st.set_page_config(page_title="Dashboard Multi-Projeto", layout="wide")
st.title("Dashboard Interativa Multi-Projeto - Status e Finalização")

# Dados de exemplo com projetos e subfases
fases_exemplo = [
    {"Projeto": "Projeto 1", "Etapa": "Início", "Dia_Inicio": 1, "Dia_Fim": 1, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Compras de Componentes 1", "Dia_Inicio": 2, "Dia_Fim": 3, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Compras de Componentes 2", "Dia_Inicio": 4, "Dia_Fim": 5, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Compras de Componentes 3", "Dia_Inicio": 6, "Dia_Fim": 7, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Chegada Produtos", "Dia_Inicio": 8, "Dia_Fim": 15, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Montagem", "Dia_Inicio": 16, "Dia_Fim": 30, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Teste", "Dia_Inicio": 31, "Dia_Fim": 33, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Faturamento", "Dia_Inicio": 34, "Dia_Fim": 35, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 2", "Etapa": "Início", "Dia_Inicio": 1, "Dia_Fim": 2, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 2", "Etapa": "Compras de Componentes 1", "Dia_Inicio": 3, "Dia_Fim": 4, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 2", "Etapa": "Chegada Produtos", "Dia_Inicio": 5, "Dia_Fim": 10, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 2", "Etapa": "Montagem", "Dia_Inicio": 11, "Dia_Fim": 20, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 2", "Etapa": "Teste", "Dia_Inicio": 21, "Dia_Fim": 25, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 2", "Etapa": "Faturamento", "Dia_Inicio": 26, "Dia_Fim": 28, "Status": "Não Iniciada"},
]

df = pd.DataFrame(fases_exemplo)

# Seleção de projeto
projetos = df["Projeto"].unique().tolist()
projeto_selecionado = st.selectbox("Selecione o projeto para visualizar/editar:", projetos)
df_proj = df[df["Projeto"] == projeto_selecionado].reset_index(drop=True)

st.subheader(f"Edite os dias e finalize fases do {projeto_selecionado}:")
hoje = st.slider("Selecione o dia atual do projeto", 1, 40, 10)

for i, row in df_proj.iterrows():
    col1, col2, col3, col4, col5 = st.columns([2,1,1,1,2])
    with col1:
        st.text(row["Etapa"])
    with col2:
        df_proj.at[i, "Dia_Inicio"] = st.number_input(f"Início - {row['Etapa']}", min_value=1, max_value=40, value=int(row["Dia_Inicio"]), key=f"inicio_{projeto_selecionado}_{i}")
    with col3:
        df_proj.at[i, "Dia_Fim"] = st.number_input(f"Fim - {row['Etapa']}", min_value=1, max_value=40, value=int(row["Dia_Fim"]), key=f"fim_{projeto_selecionado}_{i}")
    with col4:
        finalizado = st.button(f"Finalizar {row['Etapa']}", key=f"finalizar_{projeto_selecionado}_{i}")
        if finalizado:
            df_proj.at[i, "Status"] = "Finalizado"
    with col5:
        st.text(df_proj.at[i, "Status"])

# Função para calcular status automático

def calcular_status(row):
    if row["Status"] == "Finalizado":
        return "Finalizado"
    if hoje < row["Dia_Inicio"]:
        return "Não Iniciada"
    elif hoje > row["Dia_Fim"]:
        return "Atraso"
    elif row["Dia_Fim"] - hoje <= 2:
        return "Quase Atraso"
    else:
        return "Dentro do Prazo"

df_proj["Status"] = df_proj.apply(calcular_status, axis=1)

st.subheader(f"Tabela do {projeto_selecionado} com Status:")

st.dataframe(df_proj)

# Botão para exportar para Excel
import io
buffer = io.BytesIO()
if st.button("Exportar tabela para Excel"):
    df_proj.to_excel(buffer, index=False)
    buffer.seek(0)
    st.download_button(
        label="Baixar Excel atualizado",
        data=buffer,
        file_name=f"{projeto_selecionado}_atualizado.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

# Cores para o Gantt
cores = {"Dentro do Prazo": "#4CAF50", "Quase Atraso": "#FFC107", "Atraso": "#F44336", "Não Iniciada": "#90A4AE", "Finalizado": "#2196F3"}

tarefas = []
for idx, row in df_proj.iterrows():
    tarefas.append(dict(
        Task=row['Etapa'],
        Start=row['Dia_Inicio'],
        Finish=row['Dia_Fim'],
        Resource=row['Status']
    ))

fig = ff.create_gantt(
    tarefas,
    index_col='Resource',
    title=f'Cronograma do {projeto_selecionado} com Status',
    show_colorbar=True,
    group_tasks=True,
    showgrid_x=True,
    showgrid_y=True,
    height=600,
    colors=[cores.get(status, '#607D8B') for status in df_proj["Status"].unique()]
)
st.plotly_chart(fig, use_container_width=True)
