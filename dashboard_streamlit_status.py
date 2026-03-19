import streamlit as st
import pandas as pd
import plotly.figure_factory as ff
from datetime import datetime

st.set_page_config(page_title="Dashboard Projeto com Status", layout="wide")
st.title("Dashboard Interativa do Projeto - Status")

# Dados de exemplo
fases_exemplo = [
    {"Etapa": "Início", "Dia_Inicio": 1, "Dia_Fim": 1},
    {"Etapa": "Compra", "Dia_Inicio": 2, "Dia_Fim": 7},
    {"Etapa": "Chegada Produtos", "Dia_Inicio": 8, "Dia_Fim": 15},
    {"Etapa": "Montagem", "Dia_Inicio": 16, "Dia_Fim": 30},
    {"Etapa": "Teste", "Dia_Inicio": 31, "Dia_Fim": 33},
    {"Etapa": "Faturamento", "Dia_Inicio": 34, "Dia_Fim": 35},
]

df = pd.DataFrame(fases_exemplo)

st.subheader("Edite os dias de cada fase do projeto:")
for i, row in df.iterrows():
    col1, col2, col3 = st.columns([2,1,1])
    with col1:
        st.text(row["Etapa"])
    with col2:
        df.at[i, "Dia_Inicio"] = st.number_input(f"Início - {row['Etapa']}", min_value=1, max_value=35, value=int(row["Dia_Inicio"]), key=f"inicio_{i}")
    with col3:
        df.at[i, "Dia_Fim"] = st.number_input(f"Fim - {row['Etapa']}", min_value=1, max_value=35, value=int(row["Dia_Fim"]), key=f"fim_{i}")

# Função para calcular status
hoje = st.slider("Selecione o dia atual do projeto", 1, 40, 10)
def calcular_status(row):
    if hoje < row["Dia_Inicio"]:
        return "Não Iniciada"
    elif hoje > row["Dia_Fim"]:
        return "Atraso"
    elif row["Dia_Fim"] - hoje <= 2:
        return "Quase Atraso"
    else:
        return "Dentro do Prazo"

df["Status"] = df.apply(calcular_status, axis=1)

st.subheader("Tabela do Projeto com Status:")
st.dataframe(df)

# Cores para o Gantt
cores = {"Dentro do Prazo": "#4CAF50", "Quase Atraso": "#FFC107", "Atraso": "#F44336", "Não Iniciada": "#90A4AE"}

tarefas = []
for idx, row in df.iterrows():
    tarefas.append(dict(
        Task=row['Etapa'],
        Start=row['Dia_Inicio'],
        Finish=row['Dia_Fim'],
        Resource=row['Status']
    ))

fig = ff.create_gantt(
    tarefas,
    index_col='Resource',
    title='Cronograma do Projeto com Status',
    show_colorbar=True,
    group_tasks=True,
    showgrid_x=True,
    showgrid_y=True,
    height=600,
    colors=[cores.get(status, '#607D8B') for status in df["Status"].unique()]
)
st.plotly_chart(fig, use_container_width=True)
