import streamlit as st
import pandas as pd
import plotly.figure_factory as ff
from datetime import date, timedelta
import io

st.set_page_config(page_title="Dashboard Multi-Projeto - Edição Dinâmica", layout="wide")
st.title("Dashboard Multi-Projeto - Adição e Exclusão de Fases")

# Sessão para manter dados entre interações
if "df" not in st.session_state:
    st.session_state.df = pd.DataFrame(columns=["Projeto", "Etapa", "Data_Inicio", "Data_Fim", "Status"])

# --- NOVO: Download modelo Excel ---
st.sidebar.header("Importação de Planilha")
modelo = pd.DataFrame({
    "Projeto": ["Projeto 1", "Projeto 1"],
    "Etapa": ["Exemplo Fase 1", "Exemplo Fase 2"],
    "Data_Inicio": [date.today(), date.today()],
    "Data_Fim": [date.today(), date.today()],
    "Status": ["Não Iniciada", "Não Iniciada"]
})
buffer_modelo = io.BytesIO()
modelo.to_excel(buffer_modelo, index=False)
buffer_modelo.seek(0)

st.sidebar.download_button(
    label="Baixar modelo Excel",
    data=buffer_modelo,
    file_name="modelo_projeto.xlsx",
    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)

# Opção para permitir sobreposição de datas
permitir_sobreposicao = st.sidebar.checkbox("Permitir sobreposição de datas entre fases?", value=False)

uploaded_file = st.sidebar.file_uploader("Importar planilha preenchida", type=["xlsx"])
if uploaded_file:
    df_import = pd.read_excel(uploaded_file)
    # Converter datas se necessário
    for col in ["Data_Inicio", "Data_Fim"]:
        if col in df_import.columns:
            df_import[col] = pd.to_datetime(df_import[col]).dt.date
    st.session_state.df = df_import
    st.success("Planilha importada com sucesso!")
    st.rerun()

# --- NOVO: Atalhos para gráficos ---
st.sidebar.markdown("""
---
**Atalhos para Gráficos:**
- [Ir para o Gantt](#grafico-gantt)
- [Ir para o Gráfico de Barras](#grafico-de-barras)
""", unsafe_allow_html=True)

df = st.session_state.df

# Adicionar nova fase
st.subheader("Adicionar nova fase ao projeto")
col1, col2, col3, col4 = st.columns(4)
with col1:
    novo_projeto = st.text_input("Projeto", value="Projeto 1")
with col2:
    nova_etapa = st.text_input("Nome da Fase", value="Nova Fase")
with col3:
    nova_data_inicio = st.date_input("Data Início", value=date.today(), key="add_inicio")
with col4:
    nova_data_fim = st.date_input("Data Fim", value=date.today(), key="add_fim")

if st.button("Adicionar Fase"):
    if nova_data_fim < nova_data_inicio:
        st.error("Data de fim não pode ser anterior à data de início.")
    else:
        nova_linha = {"Projeto": novo_projeto, "Etapa": nova_etapa, "Data_Inicio": nova_data_inicio, "Data_Fim": nova_data_fim, "Status": "Não Iniciada"}
        st.session_state.df = pd.concat([st.session_state.df, pd.DataFrame([nova_linha])], ignore_index=True)
        st.success(f"Fase '{nova_etapa}' adicionada ao projeto '{novo_projeto}'!")
        st.rerun()

# Seleção de projeto
projetos = st.session_state.df["Projeto"].unique().tolist()
projeto_selecionado = st.selectbox("Selecione o projeto para visualizar/editar:", projetos)
df_proj = st.session_state.df[st.session_state.df["Projeto"] == projeto_selecionado].reset_index(drop=True)

st.subheader(f"Fases do {projeto_selecionado} (edite datas, finalize ou exclua):")
hoje_slider = st.date_input("Selecione a data atual do projeto", value=date.today(), key="hoje_slider")

indices_para_excluir = []
for i, row in df_proj.iterrows():
    col1, col2, col3, col4, col5, col6 = st.columns([2,2,2,1,2,1])
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
            st.session_state.df.loc[(st.session_state.df["Projeto"] == projeto_selecionado) & (st.session_state.df["Etapa"] == row["Etapa"]), "Status"] = "Finalizado"
            st.rerun()
    with col5:
        st.text(df_proj.at[i, "Status"])
    with col6:
        if st.button(f"Excluir", key=f"excluir_{projeto_selecionado}_{i}"):
            indices_para_excluir.append(i)

# Excluir fases selecionadas
if indices_para_excluir:
    for idx in sorted(indices_para_excluir, reverse=True):
        etapa_excluir = df_proj.at[idx, "Etapa"]
        st.session_state.df = st.session_state.df.drop(st.session_state.df[(st.session_state.df["Projeto"] == projeto_selecionado) & (st.session_state.df["Etapa"] == etapa_excluir)].index)
    st.success("Fase(s) excluída(s)!")
    st.rerun()

for i, row in df_proj.iterrows():
    mask = (st.session_state.df["Projeto"] == projeto_selecionado) & (st.session_state.df["Etapa"] == row["Etapa"])
    st.session_state.df.loc[mask, "Data_Inicio"] = row["Data_Inicio"]
    st.session_state.df.loc[mask, "Data_Fim"] = row["Data_Fim"]


# Checagem de sobreposição (só se não permitir)
def datas_sobrepostas(df):
    for i in range(len(df)):
        for j in range(i+1, len(df)):
            if (df.loc[i, "Data_Inicio"] <= df.loc[j, "Data_Fim"]) and (df.loc[j, "Data_Inicio"] <= df.loc[i, "Data_Fim"]):
                if df.loc[i, "Etapa"] != df.loc[j, "Etapa"]:
                    return True, df.loc[i, "Etapa"], df.loc[j, "Etapa"]
    return False, None, None

if not permitir_sobreposicao:
    sobrepos, etapa1, etapa2 = datas_sobrepostas(df_proj)
    if sobrepos:
        st.error(f"As datas das etapas '{etapa1}' e '{etapa2}' estão sobrepostas! Corrija para continuar ou marque a opção de permitir sobreposição na barra lateral.")

# Âncoras para navegação
st.markdown('<a name="grafico-gantt"></a>', unsafe_allow_html=True)

# Função para calcular status automático
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

# Âncora para gráfico de barras
st.markdown('<a name="grafico-de-barras"></a>', unsafe_allow_html=True)

# Gráfico de barras de status
import plotly.graph_objects as go
st.subheader("Distribuição dos Status das Fases")
status_counts = df_proj["Status"].value_counts().reindex(["Não Iniciada", "Dentro do Prazo", "Quase Atraso", "Atraso", "Finalizado"], fill_value=0)
cores = {"Dentro do Prazo": "#4CAF50", "Quase Atraso": "#FFC107", "Atraso": "#F44336", "Não Iniciada": "#90A4AE", "Finalizado": "#2196F3"}
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
