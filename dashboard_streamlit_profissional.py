import streamlit as st
import pandas as pd
import plotly.figure_factory as ff
import plotly.graph_objects as go
from datetime import date, timedelta
import io

st.set_page_config(page_title="Dashboard Multi-Projeto Profissional", layout="wide")
st.markdown("""
    <style>
    .main {background-color: #f5f7fa;}
    .stButton>button {background-color: #1976D2; color: white;}
    .stDownloadButton>button {background-color: #388E3C; color: white;}
    .stDataFrame {background-color: #fff;}
    </style>
""", unsafe_allow_html=True)

st.title("📊 Dashboard Multi-Projeto - Visual Profissional")

# --- BARRA LATERAL ---
st.sidebar.header("Importar / Exportar")

# Download modelo CSV
modelo_csv = pd.DataFrame({
    "Projeto": ["Projeto 1", "Projeto 1"],
    "Etapa": ["Exemplo Fase 1", "Exemplo Fase 2"],
    "Data_Inicio": [date.today().isoformat(), date.today().isoformat()],
    "Data_Fim": [date.today().isoformat(), date.today().isoformat()],
    "Status": ["Não Iniciada", "Não Iniciada"]
})
buffer_modelo = io.BytesIO()
modelo_csv.to_csv(buffer_modelo, index=False, encoding="utf-8-sig")
buffer_modelo.seek(0)

st.sidebar.download_button(
    label="Baixar modelo CSV",
    data=buffer_modelo,
    file_name="modelo_projeto.csv",
    mime="text/csv"
)

# Upload CSV
uploaded_file = st.sidebar.file_uploader("Importar planilha CSV", type=["csv"])

# Download modelo Excel
modelo_xlsx = pd.DataFrame({
    "Projeto": ["Projeto 1", "Projeto 1"],
    "Etapa": ["Exemplo Fase 1", "Exemplo Fase 2"],
    "Data_Inicio": [date.today(), date.today()],
    "Data_Fim": [date.today(), date.today()],
    "Status": ["Não Iniciada", "Não Iniciada"]
})
buffer_modelo_xlsx = io.BytesIO()
modelo_xlsx.to_excel(buffer_modelo_xlsx, index=False)
buffer_modelo_xlsx.seek(0)

st.sidebar.download_button(
    label="Baixar modelo Excel",
    data=buffer_modelo_xlsx,
    file_name="modelo_projeto.xlsx",
    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)

# Upload Excel
uploaded_file_xlsx = st.sidebar.file_uploader("Importar planilha Excel", type=["xlsx"])

# --- Dados de exemplo com datas reais ---
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

# Importar CSV
if uploaded_file is not None:
    df_import = pd.read_csv(uploaded_file, sep=";", encoding="utf-8")
    if df_import.columns.tolist() != ["Projeto", "Etapa", "Data_Inicio", "Data_Fim", "Status"]:
        df_import = pd.read_csv(uploaded_file, sep=",", encoding="utf-8")
    for col in ["Data_Inicio", "Data_Fim"]:
        if col in df_import.columns:
            df_import[col] = pd.to_datetime(df_import[col]).dt.date
    df = df_import
    st.sidebar.success("Planilha CSV importada com sucesso!")

# Importar Excel
if uploaded_file_xlsx is not None:
    df_import = pd.read_excel(uploaded_file_xlsx)
    for col in ["Data_Inicio", "Data_Fim"]:
        if col in df_import.columns:
            df_import[col] = pd.to_datetime(df_import[col]).dt.date
    df = df_import
    st.sidebar.success("Planilha Excel importada com sucesso!")

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

# Cores para os gráficos
cores = {"Dentro do Prazo": "#4CAF50", "Quase Atraso": "#FFC107", "Atraso": "#F44336", "Não Iniciada": "#90A4AE", "Finalizado": "#2196F3"}

# --- GRÁFICOS ---

# Gráfico de Gantt
st.subheader("Cronograma do Projeto (Gantt)")
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
    colors=cores
)
st.plotly_chart(fig, use_container_width=True)

# Gráfico de barras de status (abaixo do Gantt)
st.subheader("Distribuição dos Status das Fases")
status_counts = df_proj["Status"].value_counts().reindex(["Não Iniciada", "Dentro do Prazo", "Quase Atraso", "Atraso", "Finalizado"], fill_value=0)
bar_colors = [cores.get(status, "#607D8B") for status in status_counts.index]
fig_bar = go.Figure(data=[go.Bar(
    x=status_counts.index,
    y=status_counts.values,
    marker_color=bar_colors
)])
fig_bar.update_layout(
    xaxis_title="Status",
    yaxis_title="Quantidade de Fases",
    plot_bgcolor="#f5f7fa",
    paper_bgcolor="#f5f7fa",
    font=dict(size=14)
)
st.plotly_chart(fig_bar, use_container_width=True)

# Exportar CSV
buffer_csv = io.BytesIO()
df_proj.to_csv(buffer_csv, index=False, encoding="utf-8-sig")
buffer_csv.seek(0)

col_exp1, col_exp2, col_exp3 = st.columns(3)
with col_exp1:
    st.download_button(
        label="Baixar CSV",
        data=buffer_csv,
        file_name=f"{projeto_selecionado}_atualizado.csv",
        mime="text/csv"
    )
with col_exp2:
    buffer_xlsx = io.BytesIO()
    df_proj.to_excel(buffer_xlsx, index=False)
    buffer_xlsx.seek(0)
    st.download_button(
        label="Baixar Excel",
        data=buffer_xlsx,
        file_name=f"{projeto_selecionado}_atualizado.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

st.markdown("---")
st.caption("Dashboard Multi-Projeto - Controle de Processo de Produção")
