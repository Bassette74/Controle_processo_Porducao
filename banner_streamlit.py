import streamlit as st

st.title('Banner App')

banner_text = st.text_input('Digite o texto do banner:')

if banner_text:
    st.markdown(f'<h1 style="color:blue;">{banner_text}</h1>', unsafe_allow_html=True)
    st.success('Banner exibido com sucesso!')
else:
    st.info('Digite um texto para exibir o banner.')
