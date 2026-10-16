# MANUAL DO USUÁRIO
## Sistema de Triagem Clínica, Captação de Doadoras e Gestão de Rotas de Coleta
### Banco de Leite Humano (BLH) — Maternidade Escola Santa Mônica (MESM / UNCISAL)

---

## 1. APRESENTAÇÃO INSTITUCIONAL

O **Sistema do Banco de Leite Humano da Maternidade Escola Santa Mônica (MESM)** é uma plataforma integrada desenvolvida para a **Universidade Estadual de Ciências da Saúde de Alagoas (UNCISAL)**, em consonância com as diretrizes da **Rede Global de Bancos de Leite Humano (rBLH / Fiocruz)**, a **Resolução ANVISA RDC nº 171/2006**, a **Portaria MS nº 1.018/2005 (SUS)** e a **Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)**.

A Maternidade Escola Santa Mônica é a maternidade de referência terciária em Alagoas para gestações de alto risco e prematuridade extrema. O leite materno doado é vital para a sobrevida dos recém-nascidos internados na **Unidade de Terapia Intensiva Neonatal (UTIN)** e na **Unidade de Cuidados Intermediários (UCIN)**.

### Módulos Principais do Sistema:
1. **Chatbot Celular com a Dra. Mônica:** Interface interativa de atendimento e triagem clínica rBLH via simulação de smartphone para doadoras.
2. **Painel Hospitalar MESM (Corpo Clínico & Enfermagem):** Gestão de cadastros (CRM), validação de sorologias, emissão de pareceres médicos e auditoria clínica.
3. **Módulo de Rotas da Van (Coletadores):** Aplicação ultraleve com suporte offline (PWA) para equipes das vans realizarem coletas domiciliares e registro sanitário em campo.
4. **Consulta Pública de Protocolo:** Acompanhamento do status de cadastro e datas de coleta pela doadora através do código `BLH-2026-XXXX`.
5. **Guia Sanitário Fiocruz:** Consulta interativa às normas de assepsia, paramentação, higienização, pasteurização e cadeia de frio.
6. **Logs de Atividade & Rastreabilidade ANVISA:** Auditoria completa e inviolável de todas as ações hospitalares e interações com carimbo de tempo e hash SHA-256.

---

## 2. GUIA PARA MÃES DOADORAS

### 2.1 Quem Pode Ser Doadora de Leite Humano?
Conforme as normas sanitárias da rBLH/Fiocruz e ANVISA:
- Mulheres em fase de amamentação ou ordenha com produção de leite excedente à necessidade de seu próprio filho;
- Mulheres saudáveis, sem doenças infectocontagiosas ativas;
- Não usuárias de medicamentos contraindicados para a lactação;
- Exames de pré-natal ou puerpério recentes e negativos para: **HIV 1 e 2**, **Sífilis (VDRL)**, **Hepatite B (HBsAg)**, **Hepatite C (Anti-HCV)** e **HTLV I e II**;
- Não fumantes ou que fumem menos de 10 cigarros/dia (com orientações específicas de horário de ordenha);
- Sem consumo abusivo de álcool e sem uso de drogas ilícitas;
- Sem transfusão sanguínea, tatuagem ou piercing realizados nos últimos 12 meses.

---

### 2.2 Passo a Passo da Doação no Chatbot da Dra. Mônica

O atendimento é realizado diretamente pelo simulador de celular da maternidade:

1. **Início da Conversa:**
   - Acesse o sistema e selecione **"Chatbot Celular (Doar)"** no menu superior.
   - O chatbot se apresentará como a **Dra. Mônica, assistente virtual da Maternidade Escola Santa Mônica**.
   - Clique em **"Quero Doar Leite"** para iniciar a triagem.

2. **Identificação da Mãe e do Bebê:**
   - Informe seu **Nome Completo**, **Telefone com DDD (WhatsApp)** e **Data de Nascimento**;
   - Informe o **Nome do Bebê** e a **Data de Nascimento do Bebê** (o sistema calculará automaticamente os dias pós-parto e classificará o leite como *Colostro*, *Transição* ou *Maduro*).

3. **Questionário de Triagem Clínica (11 Perguntas Oficiais rBLH):**
   - **P1:** Doenças crônicas ou autoimunes;
   - **P2 a P5:** Resultados dos exames de pré-natal (HIV, Sífilis, Hepatite B, Hepatite C, HTLV);
   - **P6:** Hábitos de fumo/tabagismo;
   - **P7:** Consumo de bebidas alcoólicas ou substâncias ilícitas;
   - **P8:** Transfusão sanguínea nos últimos 12 meses;
   - **P9:** Tatuagem, micropigmentação ou piercing nos últimos 12 meses;
   - **P10:** Uso de medicamentos de uso contínuo ou recente;
   - **P11:** Sintomas gripais/febris atuais ou fissuras/mastite com secreção nas mamas.

4. **Resultado da Triagem Clínica:**
   - **Apta Preliminar:** Parabéns! Você cumpre os requisitos preliminares.
   - **Em Análise Médica:** Caso utilize algum medicamento permitido sob avaliação médica ou haja necessidade de conferência da caderneta de vacinação/sorologia.
   - **Inapta Temporária:** Em caso de febre recente, uso temporário de antibióticos ou procedimentos estéticos recentes (o sistema informará a data de retorno).

5. **Envio do Comprovante de Exames (Caderneta da Gestante):**
   - É possível tirar uma foto da folha de exames de sangue da Caderneta de Pré-Natal ou anexar laudo digital em PDF.
   - A equipe de enfermagem da Santa Mônica fará a checagem das sorologias.

6. **Agendamento da Coleta Domiciliar Gratuita:**
   - Digite seu endereço em Maceió (bairro, logradouro, número, complemento e ponto de referência);
   - Escolha a data de coleta e o turno de preferência (**Manhã: 08h às 12h** ou **Tarde: 13h às 17h**);
   - Selecione a necessidade: **Buscar Frascos Cheios**, **Receber Frascos Estéreis Vazios** ou **Ambos**.

7. **Geração do Protocolo:**
   - O sistema gera um código no formato `BLH-2026-XXXX`.
   - Guarde este código para consultar o andamento da sua solicitação.

---

### 2.3 Como Consultar o seu Protocolo
1. No menu principal, clique em **"Consultar Protocolo"**;
2. Digite seu código `BLH-2026-XXXX` (ou pesquise pelo número de telefone cadastrado);
3. Visualize instantaneamente:
   - Status da triagem (*Apta*, *Em Análise Médica*, *Coleta Agendada*, *Coletado*);
   - Parecer médico emitido pelo pediatra da Santa Mônica;
   - Data e turno da visita da van coletadora;
   - Nome do motorista/coletador responsável pela rota do seu bairro.

---

## 3. MANUAL DE BOAS PRÁTICAS SANITÁRIAS (FIOCRUZ / ANVISA)

Para que o leite materno preserve suas propriedades imunológicas e chegue seguro aos prematuros da UTIN, siga rigorosamente as orientações:

### 3.1 Preparo do Frasco Coletor
- Utilize **exclusivamente frascos de vidro com tampa plástica de rosca** (tipo café solúvel ou maionese), ou os frascos esterilizados fornecidos gratuitamente pelo Banco de Leite da Santa Mônica.
- **Higienização do frasco em casa:**
  1. Retire o papelão/adesivo interno da tampa plástica;
  2. Lave o vidro e a tampa com água corrente e sabão neutro;
  3. Ferva o vidro e a tampa em uma panela com água cobrindo completamente por **15 minutos** cronometrados a partir do início da fervura;
  4. Escorra e deixe secar naturalmente sobre um pano de prato limpo virado para baixo. Não seque com pano de prato por dentro.

### 3.2 Higiene e Paramentação da Mãe
- Prenda os cabelos com touca ou lenço limpo;
- Use máscara ou amarre uma fralda de tecido limpa sobre a boca e o nariz;
- Lave as mãos e os antebraços com água e sabão até os cotovelos, secando em toalha limpa;
- Lave as mamas **apenas com água corrente** (não passe sabonete ou pomadas na aréola antes de ordenhar);
- Despreze os primeiros jatos de leite (cerca de 1 mL) antes de iniciar a coleta no frasco.

### 3.3 Ordenha e Armazenamento
- A ordenha pode ser manual ou com bomba de sucção devidamente esterilizada;
- Deixe um espaço de **dois dedos (cerca de 2 cm) entre o leite e a borda da tampa**, pois o leite expande de volume ao congelar;
- Rotule o frasco com fita crepe contendo seu **Nome**, **Data da Primeira Coleta** e **Hora**;
- Leve imediatamente ao **congelador ou freezer** doméstico ($\le -3^\circ\text{C}$). Não guarde na porta da geladeira;
- **Prazo de validade do leite congelado cru:** até **15 dias** antes da pasteurização no Banco de Leite;
- Se for acrescentar novo leite em um frasco já iniciado, congele o leite novo em outro recipiente e adicione-o sobre o leite já congelado, respeitando a data do primeiro leite.

---

## 4. GUIA PARA A EQUIPE DE ENFERMAGEM DO BLH

A equipe de enfermagem atua na triagem técnica e no acolhimento clínico no **Painel Hospitalar MESM**:

### 4.1 Acesso ao Painel Hospitalar
1. Acesse o menu superior e clique em **"Painel Hospitalar MESM"**;
2. Faça login com sua credencial de enfermagem (ex: Matrícula ou E-mail institucional e PIN de segurança);
3. Localize as doadoras na sub-aba **"CRM Doadoras"**.

### 4.2 Validação de Comprovantes e Sorologias
1. Identifique doadoras com o status **"Em Análise Médica"** ou com comprovante pendente;
2. Clique em **"Ver Comprovante de Exames"** para abrir o documento ou foto da caderneta;
3. Use a ferramenta de zoom e conferência dos 5 marcadores obrigatórios:
   - HIV 1 e 2: Não Reagente;
   - VDRL / Sífilis: Não Reagente;
   - HBsAg (Hepatite B): Não Reagente;
   - Anti-HCV (Hepatite C): Não Reagente;
   - HTLV I/II: Não Reagente.
4. Clique em **"Validar Exames (Enfermagem)"**;
5. O sistema registrará automaticamente seu nome, COREN e carimbo de data/hora no prontuário eletrônico e no **Log de Auditoria ANVISA**.

### 4.3 Gestão de Status e Agendamento
- A enfermeira pode reagendar visitas domiciliares, solicitar novos exames caso a foto esteja ilegível e atualizar o endereço e telefone da doadora para facilitar a rota da van.

---

## 5. GUIA PARA O CORPO MÉDICO (PEDIATRIA & NEONATOLOGIA)

### 5.1 Emissão de Parecer Clínico
O parecer médico é o ato oficial que autoriza ou veda o uso do leite materno para os recém-nascidos da Santa Mônica:

1. No **Painel Hospitalar MESM**, filtre as doadoras por **"Em Análise Médica"**;
2. Clique no botão **"Parecer Médico"** no card da doadora;
3. Analise o histórico obstétrico, idade do bebê, respostas da triagem clínica e comprovantes validados pela enfermagem;
4. Selecione a decisão clínica:
   - **APROVADA:** Doadora liberada para rota de coleta domiciliar imediata;
   - **REJEITADA / INAPTA:** Com justificativa sanitária obrigatória (ex: uso de medicação incompatível nível L3/L4, janela sorológica de risco).
5. Preencha seu nome e registro profissional (ex: `CRM-AL 4821 / UNCISAL`);
6. Clique em **"Salvar Parecer e Assinar"**;
7. O sistema gera a chave de autenticação digital e atualiza instantaneamente o status da doadora para **APTA**.

### 5.2 Emissão de Ficha Clínica Oficial ANVISA (PDF)
- Ao lado do cadastro da doadora, clique no botão **"Imprimir Ficha ANVISA"**;
- O sistema gera um documento oficial em PDF pronto para arquivamento ou anexação ao prontuário da UTIN, contendo:
  - Cabeçalho institucional UNCISAL / MESM / rBLH;
  - Dados completos da nutriz e do lactente;
  - Registro de sorologias e carimbo da enfermagem;
  - Parecer médico com assinatura digital e código de rastreabilidade.

---

## 6. GUIA PARA OS COLETADORES E MOTORISTAS DAS VANS

O módulo **"Rota da Van (Coletador)"** foi concebido especificamente para funcionamento em smartphones e tablets utilizados pelas equipes de rua:

### 6.1 Identificação e Login na Van
1. Acesse o sistema e selecione **"Rota da Van (Coletador)"** no menu;
2. Selecione sua matrícula de coletador (ex: `48291-0 - Carlos Eduardo Rocha`) e digite seu PIN numérico (padrão inicial: `1234`);
3. Caso necessário, utilize a opção **"Trocar Senha"** no cabeçalho do coletador.

### 6.2 Modo Offline (PWA)
- A aplicação possui tecnologia **Service Worker** e armazenamento local offline;
- Caso a van esteja em áreas de sombra de sinal celular em Maceió (ex: grotas ou bairros periféricos), o coletador pode continuar operando normalmente;
- As baixas de coleta efetuadas sem internet são salvas em fila local e sincronizadas automaticamente com o servidor central assim que a conexão 4G for restabelecida.

### 6.3 Execução da Rota de Coleta
1. **Filtros e Turnos:** Visualize as coletas divididas por turno (**Manhã** ou **Tarde**) e bairros de Maceió;
2. **Contato com a Doadora:** Clique no botão de telefone para ligar diretamente para a mãe antes do deslocamento;
3. **Navegação GPS:** Clique no botão de mapa para abrir o endereço da doadora diretamente no Waze, Google Maps ou Apple Maps;
4. **Realização da Coleta Domiciliar:**
   - Apresente-se devidamente uniformizado e com crachá da MESM/UNCISAL;
   - Receba os frascos congelados e entregue frascos estéreis vazios novos para as próximas ordenhas;
   - Guarde imediatamente os frascos na **caixa isotérmica com gelo reciclável** e confira a temperatura no termômetro digital da van.

### 6.4 Formulário de Baixa de Coleta
1. No card da visita, clique em **"Dar Baixa na Coleta"**;
2. Preencha os campos sanitários obrigatórios:
   - **Frascos Coletados:** Quantidade de frascos recolhidos;
   - **Volume Estimado (mL):** Volume total aproximado (ex: 400 mL);
   - **Frascos Estéreis Entregues:** Quantidade de vidros vazios entregues à mãe;
   - **Temperatura da Caixa Térmica (°C):** Aferição no momento da coleta (deve estar entre **$-10^\circ\text{C}$ e $-18^\circ\text{C}$**);
   - **Observações:** Anotações sobre aspectos do leite, cor, odor ou frasco.
3. Clique em **"Confirmar Coleta e Concluir Visita"**;
4. O status mudará imediatamente para **COLETADO** e o estoque de leite do hospital será atualizado.

---

## 7. COORDENAÇÃO HOSPITALAR, ALERTAS E AUDITORIA ANVISA

### 7.1 Indicador Visual de Alerta de Rotas Atrasadas
Para impedir que a cadeia de frio seja rompida ou que doadoras fiquem desassistidas, o sistema monitora ativamente os horários limite de finalização:
- **Horário Limite Padrão da Manhã:** `12:30`
- **Horário Limite Padrão da Tarde:** `17:30`

**Comportamento do Alerta:**
- Sempre que houver coletas não finalizadas após o horário limite estabelecido, um **banner visual crítico em tom vermelho pulsante** surge no topo do Painel Administrativo;
- Um badge numérico de alerta é exibido na aba **"Rotas da Van"**;
- O painel exibe botões rápidos:
  - **"Ver Atrasadas":** Filtra a listagem apenas para as coletas excedentes;
  - **"Auditar & Contatar Vans":** Abre o canal de comunicação imediata com o motorista e permite baixa emergencial pela coordenação caso a coleta já tenha chegado ao hospital;
  - **"Configurar Horários":** Permite ajustar os horários limites de acordo com a escala do dia.

---

### 7.2 Tela de Logs de Atividade & Auditoria ANVISA (RDC 171/2006)
Em conformidade com os **Artigos 14, 15 e 18 da RDC ANVISA nº 171/2006**, o sistema mantém um registro permanente e inalterável de todas as ações:

1. **Acesso:** No Painel Hospitalar, clique na sub-aba **"Logs & Auditoria"**;
2. **Dados Rastreáveis:**
   - Data e hora exata do evento (ISO UTC);
   - Categoria (*Enfermagem*, *Corpo Médico*, *Coletador*, *Chatbot*, *Coordenação*);
   - Tipo de Ação (*Validação de Exames*, *Parecer Médico*, *Baixa de Coleta*, *Autenticação*, *Triagem Virtual*);
   - Identificação do operador (Nome, Cargo, Matrícula, CRM ou COREN);
   - Protocolo associado e dados anteriores vs novos dados;
   - **Hash Criptográfico SHA-256:** Garantia matemática de não repúdio e integridade do registro.
3. **Filtros e Busca:**
   - Filtragem por período (Hoje, 7 dias, Todos);
   - Busca em tempo real por protocolo, profissional ou termo clínico.
4. **Exportação Oficial:**
   - **Exportar CSV:** Para tabulação em planilhas e análise estatística;
   - **Gerar Relatório ANVISA em PDF:** Documento padronizado da UNCISAL com paginação, dados de auditoria e termo de responsabilidade técnica para fiscalizações sanitárias.

---

## 8. PERGUNTAS FREQUENTES (FAQ)

**1. O serviço de coleta tem algum custo para a mãe?**  
Não. Todo o atendimento, fornecimento de frascos estéreis e transporte de van pela Maternidade Santa Mônica é 100% gratuito pelo SUS.

**2. A mãe pode doar se tiver tomado vacina recentemente?**  
Sim, a maioria das vacinas permite doação sem impedimento. No caso de vacinas de vírus atenuado (como febre amarela ou sarampo), pode haver um prazo temporário de suspensão de 2 a 4 semanas. A equipe de enfermagem instruirá a doadora no painel.

**3. O que acontece se o motorista perder a conexão de internet na van?**  
O sistema continuará funcionando perfeitamente em modo offline. O motorista pode consultar os dados da visita e dar baixa normalmente. Assim que a van retornar à área com sinal ou à garagem da maternidade, os dados serão enviados automaticamente ao servidor central.

**4. Como alterar a senha de acesso ao sistema?**  
Tanto no Painel Hospitalar quanto no módulo do Coletador, há botões destacados com ícone de chave (**"Trocar Senha"** ou **"Trocar PIN"**). Basta informar a credencial atual e definir o novo código de segurança.

---
**Maternidade Escola Santa Mônica (MESM) — UNCISAL**  
Rua Jorge de Lima, 113 — Trapiche da Barra, Maceió/AL — CEP 57010-330  
Plantão 24h do Banco de Leite: (82) 3315-4400 | bancodeleite.uncisal.edu.br
