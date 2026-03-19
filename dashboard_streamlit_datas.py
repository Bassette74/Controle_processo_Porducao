import streamlit as st
import pandas as pd
import plotly.figure_factory as ff
from datetime import date, timedelta

st.set_page_config(page_title="Dashboard Multi-Projeto com Datas", layout="wide")
st.title("Dashboard Multi-Projeto - Datas com Calendário e Sem Sobreposição")

# Dados de exemplo com datas reais
hoje = date.today()
fases_exemplo = [
    {"Projeto": "Projeto 1", "Etapa": "Início", "Data_Inicio": hoje, "Data_Fim": hoje, "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Compras de Componentes 1", "Data_Inicio": hoje+timedelta(days=1), "Data_Fim": hoje+timedelta(days=2), "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Compras de Componentes 2", "Data_Inicio": hoje+timedelta(days=3), "Data_Fim": hoje+timedelta(days=4), "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Compras de Componentes 3", "Data_Inicio": hoje+timedelta(days=5), "Data_Fim": hoje+timedelta(days=6), "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Chegada Produtos", "Data_Inicio": hoje+timedelta(days=7), "Data_Fim": hoje+timedelta(days=14), "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Montagem", "Data_Inicio": hoje+timedelta(days=15), "Data_Fim": hoje+timedelta(days=29), "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Teste", "Data_Inicio": hoje+timedelta(days=30), "Data_Fim": hoje+timedelta(days=32), "Status": "Não Iniciada"},
    {"Projeto": "Projeto 1", "Etapa": "Faturamento", "Data_Inicio": hoje+timedelta(days=33), "Data_Fim": hoje+timedelta(days=34), "Status": "Não Iniciada"},
    {"Projeto": "Projeto 2", "Etapa": "Início", "Data_Inicio": hoje, "Data_Fim": hoje+timedelta(days=1), "Status": "Não Iniciada"},
    {"Projeto": "Projeto 2", "Etapa": "Compras de Componentes 1", "Data_Inicio": hoje+timedelta(days=2), "Data_Fim": hoje+timedelta(days=3), "Status": "Não Iniciada"},
    {"Projeto": "Projeto 2", "Etapa": "Chegada Produtos", "Data_Inicio": hoje+timedelta(days=4), "Data_Fim": hoje+timedelta(days=9), "Status": "Não Iniciada"},
    {"Projeto": "Projeto 2", "Etapa": "Montagem", "Data_Inicio": hoje+timedelta(days=10), "Data_Fim": hoje+timedelta(days=19), "Status": "Não Iniciada"},
    {"Projeto": "Projeto 2", "Etapa": "Teste", "Data_Inicio": hoje+timedelta(days=20), "Data_Fim": hoje+timedelta(days=24), "Status": "Não Iniciada"},
    {"Projeto": "Projeto 2", "Etapa": "Faturamento", "Data_Inicio": hoje+timedelta(days=25), "Data_Fim": hoje+timedelta(days=27), "Status": "Não Iniciada"},
]

df = pd.DataFrame(fases_exemplo)

# Seleção de projeto
projetos = df["Projeto"].unique().tolist()
projeto_selecionado = st.selectbox("Selecione o projeto para visualizar/editar:", projetos)
df_proj = df[df["Projeto"] == projeto_selecionado].reset_index(drop=True)

st.subheader(f"Edite as datas e finalize fases do {projeto_selecionado}:")

# Função para verificar sobreposição

def datas_sobrepostas(df):
    for i in range(len(df)):
        for j in range(i+1, len(df)):
            if (df.loc[i, "Data_Inicio"] <= df.loc[j, "Data_Fim"]) and (df.loc[j, "Data_Inicio"] <= df.loc[i, "Data_Fim"]):
                if df.loc[i, "Etapa"] != df.loc[j, "Etapa"]:
                    return True, df.loc[i, "Etapa"], df.loc[j, "Etapa"]
    return False, None, None

for i, row in df_proj.iterrows():
    col1, col2, col3, col4, col5 = st.columns([2,2,2,1,2])
    with col1:
        st.text(row["Etapa"])
    with col2:
        data_inicio = st.date_input(f"Data Início - {row['Etapa']}", value=row["Data_Inicio"], key=f"datainicio_{projeto_selecionado}_{i}")
        df_proj.at[i, "Data_Inicio"] = data_inicio
    with col3:
        data_fim = st.date_input(f"Data Fim - {row['Etapa']}", value=row["Data_Fim"], key=f"datafim_{projeto_selecionado}_{i}")
        df_proj.at[i, "Data_Fim"] = data_fim
    with col4:
        finalizado = st.button(f"Finalizar {row['Etapa']}", key=f"finalizar_{projeto_selecionado}_{i}")
        if finalizado:
            df_proj.at[i, "Status"] = "Finalizado"
    with col5:
        st.text(df_proj.at[i, "Status"])

# Checagem de sobreposição
sobrepos, etapa1, etapa2 = datas_sobrepostas(df_proj)
if sobrepos:
    st.error(f"As datas das etapas '{etapa1}' e '{etapa2}' estão sobrepostas! Corrija para continuar.")

# Função para calcular status automático
hoje_slider = st.date_input("Selecione a data atual do projeto", value=hoje)
def calcular_status(row):
    if row["Status"] == "Finalizado":
        return "Finalizado"
    if hoje_slider < row["Data_Inicio"]:
        return "Não Iniciada"
    elif hoje_slider > row["Data_Fim"]:
        return "Atraso"
    elif (row["Data_Fim"] - hoje_slider).days <= 2 and (row["Data_Fim"] - hoje_slider).days >= 0:
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
        Start=row['Data_Inicio'],
        Finish=row['Data_Fim'],
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
