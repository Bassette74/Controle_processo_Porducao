import pandas as pd
from datetime import datetime
import openpyxl

import plotly.figure_factory as ff
import plotly.graph_objects as go

# Ler dados do Excel
def carregar_dados_excel(caminho_arquivo):
    """Carrega dados da planilha Excel"""
    df = pd.read_excel(caminho_arquivo)
    return df

# Criar dashboard Gantt
def criar_dashboard(df):
    """Cria dashboard interativa com gráfico de Gantt"""
    
    # Preparar dados para Gantt
    tarefas = []
    for idx, row in df.iterrows():
        tarefas.append(dict(
            Task=row['Etapa'],
            Start=row['Dia_Inicio'],
            Finish=row['Dia_Fim'],
            Resource='Etapa'
        ))
    
    # Criar gráfico Gantt
    fig = ff.create_gantt(
        tarefas,
        index_col='Resource',
        title='Dashboard de Projeto',
        showgrid_x=True,
        showgrid_y=True,
        height=600
    )
    
    fig.update_xaxes(type='date')
    fig.show()

# Exemplo de uso
if __name__ == "__main__":
    # Caminho do arquivo Excel
    arquivo_excel = "projeto.xlsx"
    
    # Carregar dados
    df = carregar_dados_excel(arquivo_excel)
    
    # Exibir dados
    print(df)
    
    # Criar dashboard
    criar_dashboard(df)