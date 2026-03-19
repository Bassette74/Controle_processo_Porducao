import streamlit as st
import pandas as pd
import plotly.figure_factory as ff

st.set_page_config(page_title="Dashboard Projeto", layout="wide")
st.title("Dashboard Interativa do Projeto")

# Upload do arquivo Excel
df = None
arquivo = st.file_uploader("Selecione o arquivo Excel com as etapas do projeto", type=["xlsx"])

if arquivo:
    df = pd.read_excel(arquivo)
    st.subheader("Dados da Planilha:")
    st.dataframe(df)
    
    # Preparar dados para o Gantt
    tarefas = []
    for idx, row in df.iterrows():
        tarefas.append(dict(
            Task=row['Etapa'],
            Start=row['Dia_Inicio'],
            Finish=row['Dia_Fim'],
            Resource='Etapa'
        ))
    
    fig = ff.create_gantt(
        tarefas,
        index_col='Resource',
        title='Cronograma do Projeto',
        showgrid_x=True,
        showgrid_y=True,
        height=600
    )
    st.plotly_chart(fig, use_container_width=True)
else:
    st.info("Faça upload de um arquivo Excel para visualizar o dashboard.")
