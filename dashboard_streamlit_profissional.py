import streamlit as st
import pandas as pd
import plotly.figure_factory as ff
import plotly.graph_objects as go
from datetime import date, timedelta
import io
import sqlite3

st.set_page_config(page_title="Dashboard Multi-Projeto Profissional", layout="wide")
st.markdown("""
    <style>
    .main {background-color: #f5f7fa;}
    .stButton>button {background-color: #1976D2; color: white;}
    .stDownloadButton>button {background-color: #388E3C; color: white;}
    .stDataFrame {background-color: #fff;}
    </style>
""", unsafe_allow_html=True)

# ============================================================
# BANCO DE DADOS SQLITE
# ============================================================

DB_PATH = "projeto.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS fases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            Projeto TEXT NOT NULL,
            Etapa TEXT NOT NULL,
            Data_Inicio TEXT NOT NULL,
            Data_Fim TEXT NOT NULL,
            Status TEXT NOT NULL DEFAULT 'Nao Iniciada'
        )
    """)
    conn.commit()
    conn.close()

def load_db():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT id, Projeto, Etapa, Data_Inicio, Data_Fim, Status FROM fases", conn)
    # Converter strings de data para date
    if not df.empty:
        df["Data_Inicio"] = pd.to_datetime(df["Data_Inicio"]).dt.date
        df["Data_Fim"] = pd.to_datetime(df["Data_Fim"]).dt.date
    conn.close()
    return df

def save_db(df):
    conn = sqlite3.connect(DB_PATH)
    df_save = df.copy()
    df_save["Data_Inicio"] = df_save["Data_Inicio"].apply(
        lambda x: x.isoformat() if hasattr(x, 'isoformat') else str(x))
    df_save["Data_Fim"] = df_save["Data_Fim"].apply(
        lambda x: x.isoformat() if hasattr(x, 'isoformat') else str(x))
    # Se tem coluna 'id', usamos replace
    if "id" in df_save.columns:
        df_save.to_sql("fases", conn, if_exists="replace", index=False)
    else:
        df_save.to_sql("fases", conn, if_exists="replace", index=False)
    conn.close()

def update_fase_status(projeto, etapa, status):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "UPDATE fases SET Status = ? WHERE Projeto = ? AND Etapa = ?",
        (status, projeto, etapa)
    )
    conn.commit()
    conn.close()

def update_fase_dates(projeto, etapa, data_inicio, data_fim):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "UPDATE fases SET Data_Inicio = ?, Data_Fim = ? WHERE Projeto = ? AND Etapa = ?",
        (data_inicio.isoformat(), data_fim.isoformat(), projeto, etapa)
    )
    conn.commit()
    conn.close()

def delete_fase(projeto, etapa):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM fases WHERE Projeto = ? AND Etapa = ?", (projeto, etapa))
    conn.commit()
    conn.close()

def insert_fase(projeto, etapa, data_inicio, data_fim, status="Nao Iniciada"):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "INSERT INTO fases (Projeto, Etapa, Data_Inicio, Data_Fim, Status) VALUES (?, ?, ?, ?, ?)",
        (projeto, etapa, data_inicio.isoformat(), data_fim.isoformat(), status)
    )
    conn.commit()
    conn.close()

def seed_example_data():
    hoje = date.today()
    fases_exemplo = [
        {"Projeto": "Projeto 1", "Etapa": "Início", "Data_Inicio": hoje, "Data_Fim": hoje, "Status": "Nao Iniciada"},
        {"Projeto": "Projeto 1", "Etapa": "Compras de Componentes 1", "Data_Inicio": hoje+timedelta(days=1), "Data_Fim": hoje+timedelta(days=2), "Status": "Nao Iniciada"},
        {"Projeto": "Projeto 1", "Etapa": "Compras de Componentes 2", "Data_Inicio": hoje+timedelta(days=3), "Data_Fim": hoje+timedelta(days=4), "Status": "Nao Iniciada"},
        {"Projeto": "Projeto 1", "Etapa": "Compras de Componentes 3", "Data_Inicio": hoje+timedelta(days=5), "Data_Fim": hoje+timedelta(days=6), "Status": "Nao Iniciada"},
        {"Projeto": "Projeto 1", "Etapa": "Chegada Produtos", "Data_Inicio": hoje+timedelta(days=7), "Data_Fim": hoje+timedelta(days=14), "Status": "Nao Iniciada"},
        {"Projeto": "Projeto 1", "Etapa": "Montagem", "Data_Inicio": hoje+timedelta(days=15), "Data_Fim": hoje+timedelta(days=29), "Status": "Nao Iniciada"},
        {"Projeto": "Projeto 1", "Etapa": "Teste", "Data_Inicio": hoje+timedelta(days=30), "Data_Fim": hoje+timedelta(days=32), "Status": "Nao Iniciada"},
        {"Projeto": "Projeto 1", "Etapa": "Faturamento", "Data_Inicio": hoje+timedelta(days=33), "Data_Fim": hoje+timedelta(days=34), "Status": "Nao Iniciada"},
        {"Projeto": "Projeto 2", "Etapa": "Início", "Data_Inicio": hoje, "Data_Fim": hoje+timedelta(days=1), "Status": "Nao Iniciada"},
        {"Projeto": "Projeto 2", "Etapa": "Compras de Componentes 1", "Data_Inicio": hoje+timedelta(days=2), "Data_Fim": hoje+timedelta(days=3), "Status": "Nao Iniciada"},
        {"Projeto": "Projeto 2", "Etapa": "Chegada Produtos", "Data_Inicio": hoje+timedelta(days=4), "Data_Fim": hoje+timedelta(days=9), "Status": "Nao Iniciada"},
        {"Projeto": "Projeto 2", "Etapa": "Montagem", "Data_Inicio": hoje+timedelta(days=10), "Data_Fim": hoje+timedelta(days=19), "Status": "Nao Iniciada"},
        {"Projeto": "Projeto 2", "Etapa": "Teste", "Data_Inicio": hoje+timedelta(days=20), "Data_Fim": hoje+timedelta(days=24), "Status": "Nao Iniciada"},
        {"Projeto": "Projeto 2", "Etapa": "Faturamento", "Data_Inicio": hoje+timedelta(days=25), "Data_Fim": hoje+timedelta(days=27), "Status": "Nao Iniciada"},
    ]
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    for f in fases_exemplo:
        c.execute(
            "INSERT INTO fases (Projeto, Etapa, Data_Inicio, Data_Fim, Status) VALUES (?, ?, ?, ?, ?)",
            (f["Projeto"], f["Etapa"], f["Data_Inicio"].isoformat(), f["Data_Fim"].isoformat(), f["Status"])
        )
    conn.commit()
    conn.close()

# Inicializa DB
init_db()

# Se DB vazio, carrega dados de exemplo
df_from_db = load_db()
if df_from_db.empty:
    seed_example_data()
    df_from_db = load_db()

st.title("Dashboard Multi-Projeto - Visual Profissional")

# --- BARRA LATERAL ---
st.sidebar.header("Importar / Exportar")

# Upload CSV
uploaded_file = st.sidebar.file_uploader("Importar planilha CSV", type=["csv"])

# Upload Excel
uploaded_file_xlsx = st.sidebar.file_uploader("Importar planilha Excel", type=["xlsx"])

# Download modelo CSV
modelo_csv = pd.DataFrame({
    "Projeto": ["Projeto 1", "Projeto 1"],
    "Etapa": ["Exemplo Fase 1", "Exemplo Fase 2"],
    "Data_Inicio": [date.today().isoformat(), date.today().isoformat()],
    "Data_Fim": [date.today().isoformat(), date.today().isoformat()],
    "Status": ["Nao Iniciada", "Nao Iniciada"]
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

# Download modelo Excel
modelo_xlsx = pd.DataFrame({
    "Projeto": ["Projeto 1", "Projeto 1"],
    "Etapa": ["Exemplo Fase 1", "Exemplo Fase 2"],
    "Data_Inicio": [date.today(), date.today()],
    "Data_Fim": [date.today(), date.today()],
    "Status": ["Nao Iniciada", "Nao Iniciada"]
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

# Botao para resetar dados
if st.sidebar.button("Resetar para dados de exemplo"):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM fases")
    conn.commit()
    conn.close()
    seed_example_data()
    st.sidebar.success("Dados resetados com sucesso!")
    st.rerun()

# Importar CSV
if uploaded_file is not None:
    df_import = pd.read_csv(uploaded_file, sep=";", encoding="utf-8")
    if df_import.columns.tolist() != ["Projeto", "Etapa", "Data_Inicio", "Data_Fim", "Status"]:
        df_import = pd.read_csv(uploaded_file, sep=",", encoding="utf-8")
    for col in ["Data_Inicio", "Data_Fim"]:
        if col in df_import.columns:
            df_import[col] = pd.to_datetime(df_import[col]).dt.date
    save_db(df_import)
    st.sidebar.success("Planilha CSV importada e salva no banco!")
    st.rerun()

# Importar Excel
if uploaded_file_xlsx is not None:
    df_import = pd.read_excel(uploaded_file_xlsx)
    for col in ["Data_Inicio", "Data_Fim"]:
        if col in df_import.columns:
            df_import[col] = pd.to_datetime(df_import[col]).dt.date
    save_db(df_import)
    st.sidebar.success("Planilha Excel importada e salva no banco!")
    st.rerun()

# Carrega dados do DB
df = load_db()

# Seleção de projeto
projetos = df["Projeto"].unique().tolist()
projeto_selecionado = st.selectbox("Selecione o projeto para visualizar/editar:", projetos)
df_proj = df[df["Projeto"] == projeto_selecionado].reset_index(drop=True)

st.subheader(f"Edite as datas e finalize fases do {projeto_selecionado}:")

# --- STATUS LABELS (com acentos para exibicao) ---
STATUS_MAP = {
    "Nao Iniciada": "Nao Iniciada",
    "Dentro do Prazo": "Dentro do Prazo",
    "Quase Atraso": "Quase Atraso",
    "Atraso": "Atraso",
    "Finalizado": "Finalizado"
}

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
    with col3:
        data_fim = st.date_input(f"Data Fim - {row['Etapa']}", value=row["Data_Fim"], key=f"datafim_{projeto_selecionado}_{i}")
    with col4:
        finalizado = st.button(f"Finalizar {row['Etapa']}", key=f"finalizar_{projeto_selecionado}_{i}")
        if finalizado:
            update_fase_status(projeto_selecionado, row["Etapa"], "Finalizado")
            st.rerun()
    with col5:
        st.text(STATUS_MAP.get(row["Status"], row["Status"]))

    # Salvar datas alteradas no DB
    if data_inicio != row["Data_Inicio"] or data_fim != row["Data_Fim"]:
        update_fase_dates(projeto_selecionado, row["Etapa"], data_inicio, data_fim)

# Checagem de sobreposição
sobrepos, etapa1, etapa2 = datas_sobrepostas(df_proj)
if sobrepos:
    st.error(f"As datas das etapas '{etapa1}' e '{etapa2}' estão sobrepostas! Corrija para continuar.")

# Função para calcular status automático
hoje_slider = st.date_input("Selecione a data atual do projeto", value=date.today())

def calcular_status(row):
    if row["Status"] == "Finalizado":
        return "Finalizado"
    if hoje_slider < row["Data_Inicio"]:
        return "Nao Iniciada"
    elif hoje_slider > row["Data_Fim"]:
        return "Atraso"
    elif (row["Data_Fim"] - hoje_slider).days <= 2 and (row["Data_Fim"] - hoje_slider).days >= 0:
        return "Quase Atraso"
    else:
        return "Dentro do Prazo"

df_proj["Status"] = df_proj.apply(calcular_status, axis=1)

st.subheader(f"Tabela do {projeto_selecionado} com Status:")
st.dataframe(df_proj)

# --- GRÁFICOS ---

# Cores para os gráficos
cores = {
    "Dentro do Prazo": "#4CAF50",
    "Quase Atraso": "#FFC107",
    "Atraso": "#F44336",
    "Nao Iniciada": "#90A4AE",
    "Finalizado": "#2196F3"
}

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
st.subheader("Distribuicao dos Status das Fases")
status_order = ["Nao Iniciada", "Dentro do Prazo", "Quase Atraso", "Atraso", "Finalizado"]
status_counts = df_proj["Status"].value_counts().reindex(status_order, fill_value=0)
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
