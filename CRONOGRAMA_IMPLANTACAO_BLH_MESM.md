# CRONOGRAMA INTEGRADO DE CRIAÇÃO E IMPLANTAÇÃO
## Sistema de Gestão e Triagem do Banco de Leite Humano (BLH)
### Maternidade Escola Santa Mônica (MESM) — Universidade Estadual de Ciências da Saúde de Alagoas (UNCISAL)

---

**Documento:** Plano Diretor e Cronograma Físico-Operacional de Implantação  
**Versão:** 1.2 (Marco Inicial Fixado em 01 de Outubro)  
**Data de Emissão Original:** 01 de Outubro de 2026  
**Período Oficial de Execução:** **01 de Outubro de 2026 a 20 de Fevereiro de 2027**  
**Data Impreterível de Conclusão / Entrega Final:** **20 de Fevereiro de 2027**  
**Órgãos Envolvidos:** 
* Banco de Leite Humano — Maternidade Escola Santa Mônica (BLH/MESM)
* Diretoria Geral e Diretoria Médica da MESM
* Superintendência de Tecnologia da Informação (SUTIN / UNCISAL)
* Reitoria e Pró-Reitoria de Extensão e Pesquisa da UNCISAL
* Secretaria de Estado da Saúde de Alagoas (SESAU/AL)

**Marco Legal e Normativo:**
* **ANVISA RDC nº 171/2006:** Regulamento Técnico para Funcionamento de Bancos de Leite Humano;
* **Lei Federal nº 13.709/2018 (LGPD):** Art. 11 (Tratamento de Dados Pessoais Sensíveis de Saúde);
* **Portaria MS nº 1.018/2005:** Normas Técnicas para Coleta e Transporte de Leite Humano Ordenhado;
* **Rede Brasileira de Bancos de Leite Humano (rBLH / Fiocruz):** Manuais de Triagem e Amamentação.

---

## 1. VISÃO GERAL E OBJETIVO DO CRONOGRAMA

O presente cronograma estabelece o calendário executivo detalhado de planejamento, arquitetura, desenvolvimento, engenharia de qualidade (QA/Playwright), segurança da informação, homologação clínica, provisionamento de infraestrutura em nuvem privada da SUTIN/UNCISAL e go-live oficial da **Plataforma Digital do Banco de Leite Humano da MESM**.

O projeto tem como **marco inicial o dia 01 de outubro de 2026** e como **prazo fatal de conclusão o dia 20 de fevereiro de 2027**, momento em que se encerra o ciclo de operação assistida, com o sistema 100% transferido para a sustentação contínua da MESM e da SUTIN.

A solução contempla:
1. **Atendimento Humanizado e Automatizado:** Chatbot institucional ("Dra. Mônica") para triagem preliminar, agendamento de frascos esterilizados e coleta domiciliar;
2. **Triagem Clínica e Auditoria Médica:** Análise de exames sorológicos (HIV, Sífilis, Hepatites B/C e HTLV) com registro de CRM/COREN e rastreabilidade total conforme RDC 171/2006;
3. **Logística Domiciliar Inteligente:** Módulo PWA Offline-First para a equipe da van de coleta em Maceió, com geolocalização e controle térmico rigoroso (-1°C a 5°C);
4. **Infraestrutura Governamental Segura:** Hospedagem nas instalações da SUTIN/UNCISAL em 2 Máquinas Virtuais dedicadas e isoladas, sob o domínio oficial `bancodeleite.uncisal.edu.br`.

---

## 2. LINHA DO TEMPO MACRO E CALENDÁRIO DAS FASES

O cronograma totaliza **21 semanas de execução contínua** (de **01/10/2026 a 20/02/2027**), distribuídas em 8 fases encadeadas:

```
[01/10/2026 a 24/10/2026] FASE 1: Concepção, Levantamento e Arquitetura de Software (Sem 01 a 04)
            │
[26/10/2026 a 05/12/2026] FASE 2: Desenvolvimento Full-Stack e Módulos Operacionais (Sem 05 a 10)
            │
[07/12/2026 a 23/12/2026] FASE 3: Engenharia de Qualidade (QA), Playwright E2E e Pentest (Sem 11 a 13)
            │
[28/12/2026 a 13/01/2027] FASE 4: Validação Clínica, Usabilidade e Homologação MESM (Sem 14 a 15)
            │
[11/01/2027 a 27/01/2027] FASE 5: Solicitação Formal e Provisionamento na SUTIN (2 VMs) (Sem 15 a 17)
            │
[28/01/2027 a 03/02/2027] FASE 6: Implantação em Produção (Deploy, Nginx, SSL e PostgreSQL) (Sem 18)
            │
[04/02/2027 a 10/02/2027] FASE 7: Capacitação, Treinamento das Equipes e Manuais (Sem 19)
            │
[11/02/2027 a 20/02/2027] FASE 8: Go-Live Oficial, Campanha Pública e Operação Assistida (Sem 20 a 21)
            ▼
     ★ 20/02/2027: ENCERRAMENTO FORMAL DA IMPLANTAÇÃO E TRANSIÇÃO DEFINITIVA ★
```

---

## 3. CALENDÁRIO DETALHADO POR ATIVIDADES E ENTREGAS

### FASE 1: Concepção, Levantamento e Arquitetura de Software
**Período:** 01 de Outubro de 2026 a 24 de Outubro de 2026 (Semanas 01 a 04)  
*Foco: Alinhamento regulatório, mapeamento de processos hospitalares e definição arquitetural.*

| Cód | Atividade / Tarefa | Responsável | Período Exato | Entregável / Evidência |
| :--- | :--- | :--- | :---: | :--- |
| **1.1** | Reunião de Abertura (Kick-off) e Imersão no BLH da MESM | Diretoria MESM + Coord. BLH + Equipe TI | 01/10 a 03/10/2026 | Termo de abertura do projeto e mapa de jornada da doadora |
| **1.2** | Mapeamento das rotas e logística das vans nos bairros de Maceió | Equipe da Van + Enfermagem BLH | 05/10 a 09/10/2026 | Relação de polos de atendimento e rotas críticas municipais |
| **1.3** | Levantamento dos requisitos da ANVISA RDC 171/2006 e rBLH/Fiocruz | Enfermagem BLH + Especialista QA | 08/10 a 14/10/2026 | Matriz de conformidade técnica e critérios de aptidão clínica |
| **1.4** | Mapeamento de exigências da LGPD (Art. 11 - Dados Sensíveis de Saúde) | DPO/Jurídico UNCISAL + Segurança TI | 13/10 a 17/10/2026 | Termo de consentimento e diretrizes de proteção e anonimização |
| **1.5** | Definição da Arquitetura de Software (Frontend React 19 + API Node.js 22) | Arquiteto de Software | 15/10 a 21/10/2026 | Documento de Arquitetura (`MANUAL_DO_DESENVOLVEDOR.md`) |
| **1.6** | Modelagem do Banco Relacional (PostgreSQL) e Topologia SUTIN (2 VMs) | DBA + Arquiteto de Redes SUTIN | 19/10 a 24/10/2026 | DDL inicial (`init_postgresql_blh.sql`) e topologia de rede |

**Marco 1 (24/10/2026):** Arquitetura e requisitos formalmente aprovados pela Diretoria Médica da MESM e pela Coordenação de TI.

---

### FASE 2: Desenvolvimento Full-Stack e Módulos Operacionais
**Período:** 26 de Outubro de 2026 a 05 de Dezembro de 2026 (Semanas 05 a 10)  
*Foco: Codificação das funcionalidades, experiência do usuário e regras sanitárias.*

| Cód | Atividade / Tarefa | Responsável | Período Exato | Entregável / Evidência |
| :--- | :--- | :--- | :---: | :--- |
| **2.1** | **Sprint 1 — Core do Chatbot "Dra. Mônica":**<br>• Fluxo de 1º pedido de frascos esterilizados com cadastro;<br>• Fluxo de devolução de leite materno ordenhado;<br>• Consulta e recuperação de protocolo por WhatsApp/CPF;<br>• Botão explícito de reinicialização do chat no simulador. | Equipe Frontend/UX | 26/10 a 07/11/2026 | Componente `PhoneChatbotSimulator.tsx` operando com todos os fluxos conversacionais |
| **2.2** | **Sprint 2 — Módulo de Triagem Clínica Avançada:**<br>• Wizard de triagem com 5 etapas interativas;<br>• Upload seguro de imagens de exames sorológicos (HIV, VDRL, HBsAg, Anti-HCV, HTLV);<br>• Emissão automática do Protocolo com código de barras/QR Code (`BLH-2026-XXXX`). | Equipe Full-Stack | 09/11 a 21/11/2026 | Módulo `ClinicalScreeningWizard.tsx` e `ProtocolCard.tsx` integrados |
| **2.3** | **Sprint 3 — Módulo PWA das Vans de Coleta Domiciliar (Offline-First):**<br>• Roteirização por bairros de Maceió (Trapiche, Farol, Tabuleiro, Benedito Bentes, etc.);<br>• Aferição e validação da temperatura da caixa isotérmica (-1°C a 5°C);<br>• Sincronização offline via Service Worker e fila local indexada. | Equipe Mobile/PWA | 16/11 a 28/11/2026 | Módulo `RouteCollectorView.tsx` funcional mesmo sem conexão de rede |
| **2.4** | **Sprint 4 — Painel Hospitalar Administrativo e Auditoria ANVISA:**<br>• Dashboard de gestão de leitos de UTI Neonatal e volume de leite em estoque;<br>• Validação médica de sorologias com assinatura digital e carimbo de CRM/COREN;<br>• Registro de logs de auditoria sanitária com hash criptográfico SHA-256;<br>• Emissão de relatórios oficiais em PDF com carimbo de integridade (`jspdf`). | Equipe Backend/Hospitalar | 23/11 a 05/12/2026 | Módulos `HospitalAdminDashboard.tsx` e `ActivityLogsView.tsx` homologados |

**Marco 2 (05/12/2026):** Versão funcional *Release Candidate 1 (RC1)* pronta para a esteira de testes automatizados.

---

### FASE 3: Engenharia de Qualidade (QA), Automação Playwright e Segurança
**Período:** 07 de Dezembro de 2026 a 23 de Dezembro de 2026 (Semanas 11 a 13)  
*Foco: Validação de estabilidade, simulação de navegadores, pentest e testes de carga.*

| Cód | Atividade / Tarefa | Responsável | Período Exato | Entregável / Evidência |
| :--- | :--- | :--- | :---: | :--- |
| **3.1** | Criação e execução da suíte de testes E2E com **Playwright** (`e2e/chatbot-fluxo.spec.ts`):<br>• Teste do carregamento e botão "Reiniciar o chat";<br>• Teste do fluxo completo de 1º pedido de frascos esterilizados com cadastro;<br>• Teste de recuperação de protocolo perdido via Chatbot e Header;<br>• Simulação mobile (Pixel 7 / iPhone) e desktop corporativo. | Engenheiro de QA | 07/12 a 15/12/2026 | Relatório HTML e gravação de traces no Playwright com 100% de sucesso |
| **3.2** | Execução de Pentest e Análise de Vulnerabilidades (`ANALISE_DE_VULNERABILIDADES.md`):<br>• Varredura OWASP Top 10 (Injeção de SQL, XSS, CSRF, Broken Auth);<br>• Validação de criptografia de senhas (Argon2 / SCRAM-SHA-256);<br>• Verificação da política de mascaramento de dados (LGPD) em telas públicas. | Especialista em AppSec | 10/12 a 18/12/2026 | Laudo técnico de conformidade com zero vulnerabilidades críticas |
| **3.3** | Testes de Carga e Estresse de Conexões Simultâneas:<br>• Simulação de 500 usuárias simultâneas interagindo com o Chatbot;<br>• Avaliação de concorrência na escrita de agendamentos e transações do banco. | Engenheiro de QA | 16/12 a 21/12/2026 | Relatório de latência e consumo de CPU/Memória dentro dos limites |
| **3.4** | Testes de Confiabilidade Offline (Service Worker / PWA):<br>• Desconexão intencional de rede na van e validação do cache local e sincronização posterior. | Engenheiro de QA + Motorista BLH | 18/12 a 23/12/2026 | Evidência de persistência e baixa de coleta sem perda de dados |

**Marco 3 (23/12/2026):** Aplicação aprovada com 100% de cobertura de fluxos críticos no Playwright e pentest aprovado.

---

### FASE 4: Validação Clínica, Usabilidade e Homologação na MESM
**Período:** 28 de Dezembro de 2026 a 13 de Janeiro de 2027 (Semanas 14 a 15)  
*Foco: Aceite pelos profissionais de saúde da Maternidade e teste piloto assistido.*

| Cód | Atividade / Tarefa | Responsável | Período Exato | Entregável / Evidência |
| :--- | :--- | :--- | :---: | :--- |
| **4.1** | Sessões de teste de usabilidade com médicas pediatras e enfermeiras do BLH | Equipe Médica MESM + UX Designer | 28/12 a 31/12/2026 | Checklist de usabilidade clínica e refinamento de textos assistenciais |
| **4.2** | Teste piloto cego com doadoras voluntárias no ambulatório da MESM | Enfermagem BLH + Doadoras | 04/01 a 08/01/2027 | Avaliação de clareza do chatbot e facilidade de envio de exames |
| **4.3** | Teste de percurso real na van de coleta com a equipe móvel em Maceió | Motorista + Técnica de Enfermagem | 06/01 a 11/01/2027 | 5 coletas simuladas em bairros distintos com geolocalização |
| **4.4** | Reunião formal de Homologação Clínica e assinatura da ata | Diretoria Médica MESM + Coord. BLH | 13/01/2027 | **Termo de Homologação e Aceite da Plataforma** assinado |

**Marco 4 (13/01/2027):** Validação clínica assinada pelos responsáveis técnicos da MESM/UNCISAL.

---

### FASE 5: Solicitação Formal e Provisionamento de Infraestrutura na SUTIN
**Período:** 11 de Janeiro de 2027 a 27 de Janeiro de 2027 (Semanas 15 a 17)  
*Foco: Criação do ambiente computacional seguro nos data centers da UNCISAL.*

| Cód | Atividade / Tarefa | Responsável | Período Exato | Entregável / Evidência |
| :--- | :--- | :--- | :---: | :--- |
| **5.1** | Protocolo oficial do documento `SOLICITACAO_INFRAESTRUTURA_SUTIN_UNCISAL.md` via sistema SEI/UNCISAL | Diretoria Geral MESM | 11/01/2027 | Processo administrativo autuado e despachado à SUTIN |
| **5.2** | Reunião de alinhamento técnico entre TI do Projeto e analistas da SUTIN | Líder Técnico + Coord. SUTIN | 13/01/2027 | Cronograma operacional conjunto e definição de IPs/VLANs |
| **5.3** | Provisionamento da **VM 1 (Aplicação Web & Proxy Reverso)**:<br>• 4 vCPUs, 8 GB RAM, 80 GB SSD, Ubuntu Server 24.04 LTS;<br>• IP privado alocado na sub-rede de DMZ de aplicações. | Equipe de Infraestrutura SUTIN | 14/01 a 18/01/2027 | VM 1 criada e acessível via SSH com chave aos autorizados |
| **5.4** | Provisionamento da **VM 2 (Banco de Dados PostgreSQL)**:<br>• 4 vCPUs, 8 GB RAM, 120 GB SSD, Ubuntu Server 24.04 LTS;<br>• IP privado alocado na VLAN interna restrita (zero internet). | Equipe de Infraestrutura SUTIN | 15/01 a 20/01/2027 | VM 2 criada e isolada sem IP público |
| **5.5** | Instalação e Hardening do SGBD **PostgreSQL 16** na VM 2:<br>• Configuração de `postgresql.conf` e `pg_hba.conf` liberando apenas IP da VM 1;<br>• Execução do script DDL (`/scripts/init_postgresql_blh.sql`);<br>• Criação da base `blh_mesm_prod` e usuário `blh_app` com senha forte. | DBA SUTIN + Backend Lead | 19/01 a 23/01/2027 | Banco operacional e porta 5432 auditada |
| **5.6** | Configuração do Registro de DNS Institucional:<br>• Criação do apontamento DNS tipo `A` para `bancodeleite.uncisal.edu.br`. | Analista de Redes SUTIN | 21/01 a 25/01/2027 | Propagação de DNS corporativo testada |
| **5.7** | Estruturação da Rotina de Backup Centralizado SUTIN:<br>• Script diário automatizado via `cron` com `pg_dump` consistente;<br>• Envio automático para storage off-site e retenção de 30 dias (RDC 171). | Equipe de Storage SUTIN | 23/01 a 27/01/2027 | Teste de backup e restauração (*restore test*) realizado com sucesso |

**Marco 5 (27/01/2027):** Infraestrutura física e virtual homologada e pronta para receber a aplicação.

---

### FASE 6: Implantação em Produção (Deploy, Nginx e Certificação SSL/TLS)
**Período:** 28 de Janeiro de 2027 a 03 de Fevereiro de 2027 (Semana 18)  
*Foco: Instalação da aplicação, certificação digital e conexão segura ponta a ponta.*

| Cód | Atividade / Tarefa | Responsável | Período Exato | Entregável / Evidência |
| :--- | :--- | :--- | :---: | :--- |
| **6.1** | Instalação dos pacotes base na VM 1 (Node.js 22 LTS, npm, Nginx, PM2) | SUTIN + DevOps | 28/01 a 29/01/2027 | Ambiente de execução padronizado |
| **6.2** | Emissão e Instalação do **Certificado Digital SSL/TLS**:<br>• Certificado ICPEdu / RNP corporativo (ou Let's Encrypt com Certbot);<br>• Forçamento obrigatório de HTTPS (Porta 443) com redirecionamento da Porta 80. | Analista de Segurança SUTIN | 29/01 a 30/01/2027 | Conexão com Nota A+ no Qualys SSL Labs |
| **6.3** | Configuração do Nginx Proxy Reverso na VM 1 (`/etc/nginx/sites-available`):<br>• Configuração homologada no documento de solicitação;<br>• Cabeçalhos de segurança (HSTS, CSP, X-Frame-Options, No-Sniff);<br>• Limite de upload `client_max_body_size 15M` para cartões de exames. | Analista de Redes SUTIN | 30/01 a 01/02/2027 | Nginx ativo e roteando tráfego para `127.0.0.1:3000` |
| **6.4** | Deploy do Código-Fonte e Configuração das Variáveis de Ambiente (`.env`):<br>• `DATABASE_URL` conectando à VM 2 através da rede interna segura;<br>• Chaves criptográficas de sessão (`SESSION_SECRET`);<br>• Inicialização contínua via PM2 (`pm2 start`, `pm2 startup systemd`). | Líder Técnico do Projeto | 01/02 a 02/02/2027 | Aplicação online respondendo em `bancodeleite.uncisal.edu.br` |
| **6.5** | Execução de Smoke Tests Pós-Deploy no Ambiente Oficial:<br>• Verificação de comunicação com o banco de dados da VM 2;<br>• Envio de imagem de teste de sorologia e verificação no storage;<br>• Emissão de relatório PDF oficial com carimbo de integridade. | Equipe QA + SUTIN | 02/02 a 03/02/2027 | Relatório de Smoke Test Aprovado sem não-conformidades |

**Marco 6 (03/02/2027):** Plataforma operando em ambiente de produção da UNCISAL com HTTPS ativo.

---

### FASE 7: Capacitação, Treinamento das Equipes e Manuais
**Período:** 04 de Fevereiro de 2027 a 10 de Fevereiro de 2027 (Semana 19)  
*Foco: Habilitação de pessoas e assimilação cultural da nova tecnologia.*

| Cód | Atividade / Tarefa | Responsável | Período Exato | Entregável / Evidência |
| :--- | :--- | :--- | :---: | :--- |
| **7.1** | Distribuição e fixação dos manuais oficiais:<br>• `MANUAL_DO_USUARIO.md` (médicos, enfermeiras, recepcionistas e motoristas);<br>• `MANUAL_DO_DESENVOLVEDOR.md` (equipe interna de TI da SUTIN). | Coordenação do Projeto | 04/02 a 05/02/2027 | Manuais impressos no setor e disponibilizados na intranet |
| **7.2** | Oficina de Treinamento da Equipe Médica e de Enfermagem do BLH:<br>• Avaliação de exames, inserção de parecer com CRM/COREN;<br>• Gestão de prioridades de doadoras e distribuição de frascos esterilizados. | Instrutor / Enfermeira Chefe | 05/02 a 06/02/2027 | 100% da equipe assistencial capacitada e certificada |
| **7.3** | Treinamento Prático para Motoristas e Técnicos de Coleta da Van:<br>• Instalação do PWA como aplicativo no celular corporativo;<br>• Registro de coletas offline, aferição térmica e confirmação com a doadora. | Instrutor de Campo | 08/02 a 09/02/2027 | Motoristas realizando simulações de campo sem erros |
| **7.4** | Treinamento de Suporte e Sustentação da SUTIN:<br>• Monitoramento de processos no PM2 (`pm2 status`, `pm2 logs`);<br>• Procedimento de restore emergencial do PostgreSQL (`pg_restore`). | DevOps Lead + Equipe SUTIN | 09/02 a 10/02/2027 | Protocolo de Suporte Nível 2 e Nível 3 estabelecido |

**Marco 7 (10/02/2027):** Todas as equipes operacionais, assistenciais e de suporte aptas para o início das operações.

---

### FASE 8: Go-Live Oficial, Campanha Pública e Operação Assistida
**Período:** 11 de Fevereiro de 2027 a 20 de Fevereiro de 2027 (Semanas 20 a 21)  
*Foco: Abertura para a sociedade alagoana, monitoramento intensivo e estabilização.*

| Cód | Atividade / Tarefa | Responsável | Período Exato | Entregável / Evidência |
| :--- | :--- | :--- | :---: | :--- |
| **8.1** | **Virada de Chave Oficial (Go-Live Day):**<br>• Abertura pública irrestrita do subdomínio `https://bancodeleite.uncisal.edu.br`;<br>• Publicação oficial no portal institucional da UNCISAL e da MESM. | Reitoria UNCISAL + Diretoria MESM | **11/02/2027** | Sistema em produção atendendo à população |
| **8.2** | Coletiva de imprensa e campanha nas redes sociais:<br>• Peças informativas para incentivo à doação de leite materno em Alagoas;<br>• Apresentação da "Dra. Mônica" como facilitadora do cadastro pelo celular. | Assessoria de Comunicação UNCISAL / SESAU | 11/02 a 14/02/2027 | Matérias nos canais de comunicação, rádio e TV educativa |
| **8.3** | **Operação Assistida e Sala de Situação:**<br>• Plantão diário conjunto (Equipe de Desenvolvimento + SUTIN + BLH);<br>• Acompanhamento contínuo dos cadastros, rotas e agendamentos;<br>• Ajustes finos imediatos de textos ou usabilidade identificados em campo. | Comitê Gestor do Projeto | 11/02 a 19/02/2027 | Relatório diário de estabilidade de produção sem incidentes graves |
| **8.4** | **Encerramento Formal da Implantação e Transição Definitiva:**<br>• Apresentação do balanço inicial de doações e coletas realizadas;<br>• Assinatura do **Termo de Encerramento do Projeto de Implantação**;<br>• Transferência da governança operacional definitiva para a MESM e SUTIN. | Todas as lideranças do projeto | **20/02/2027** | **Ata de Conclusão e Termo de Entrega Oficial Definitivo** |

---

## 4. MATRIZ DE RESPONSABILIDADES (RACI)

A matriz a seguir define os papéis de cada grupo de atores nas atividades-chave do cronograma:
* **R (Responsible):** Quem executa a atividade;
* **A (Accountable):** Quem responde pelo resultado e aprova;
* **C (Consulted):** Quem é consultado e contribui tecnicamente;
* **I (Informed):** Quem é mantido informado sobre o andamento.

| Atividade do Cronograma | Período | Coord. BLH / Médicos MESM | Equipe Dev / QA Projeto | SUTIN / TI UNCISAL | Diretoria Geral MESM | Doadoras / Cidadãs |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Abertura, Regras Clínicas e RDC 171** | 01/10 a 24/10/26 | **A / R** | C | I | I | I |
| **Desenvolvimento Full-Stack e Chatbot** | 26/10 a 05/12/26 | C | **A / R** | C | I | I |
| **Automação de Testes com Playwright** | 07/12 a 15/12/26 | I | **A / R** | I | I | I |
| **Validação e Pentest de Segurança** | 10/12 a 18/12/26 | I | **R** | **A** | I | I |
| **Homologação Clínica e Piloto na Van** | 28/12 a 13/01/27 | **A / R** | R | I | I | C |
| **Provisionamento das 2 VMs (App e DB)** | 14/01 a 20/01/27 | I | C | **A / R** | I | I |
| **Configuração de DNS e Certificado SSL** | 21/01 a 30/01/27 | I | C | **A / R** | I | I |
| **Instalação e Hardening do PostgreSQL** | 19/01 a 23/01/27 | I | C | **A / R** | I | I |
| **Deploy da Aplicação e Configuração Nginx**| 28/01 a 03/02/27 | I | **R** | **A** | I | I |
| **Treinamento das Equipes Hospitalares** | 04/02 a 10/02/27 | **A** | **R** | C | I | I |
| **Autorização do Go-Live Oficial** | 11/02/2027 | C | C | C | **A** | I |
| **Operação Assistida e Transição Final** | 11/02 a 20/02/27 | **A / R** | R | R | A | **Atores-Alvo** |

---

## 5. MATRIZ DE GESTÃO DE RISCOS E PLANOS DE CONTINGÊNCIA

| Risco Mapeado | Impacto | Probabilidade | Ação Preventiva (Mitigação) | Plano de Contingência |
| :--- | :---: | :---: | :--- | :--- |
| **Atraso na liberação das VMs pela SUTIN** | Alto | Média | Envio formal do formulário SEI em **11/01/2027** e alinhamento prévio com a equipe de infraestrutura. | Uso temporário de ambiente espelho pré-configurado para não paralisar testes de homologação. |
| **Oscilação ou ausência de sinal 4G/5G na van de coleta** | Médio | Alta | Arquitetura PWA Offline-First homologada com cache local e Service Worker (`RouteCollectorView.tsx`). | O motorista anota em formulário de contingência ou registra offline; o app sincroniza automaticamente ao retornar ao sinal. |
| **Problemas na emissão do certificado institucional ICPEdu** | Alto | Baixa | Abertura antecipada de chamado na autoridade certificadora da RNP pela SUTIN em 28/01/2027. | Ativação imediata de certificado gratuito e reconhecido mundialmente via Let's Encrypt / Certbot. |
| **Incompatibilidade ou travamento de banco de dados** | Crítico | Baixa | Uso do PostgreSQL 16 com scripts DDL estruturados e testados previamente. | Restauração pontual do dump de homologação e reversão via migração DDL controlada. |
| **Resistência das usuárias ou dúvidas no uso do Chatbot** | Médio | Média | Interface conversacional extremamente simplificada e intuitiva ("Dra. Mônica"), com botões visíveis de ajuda e reinicialização. | Disponibilização de suporte telefônico direto com a recepção do Banco de Leite da MESM. |

---

## 6. INDICADORES-CHAVE DE DESEMPENHO (KPIS) DA IMPLANTAÇÃO

Para avaliar a efetividade da implantação até o fechamento em **20 de fevereiro de 2027**, os seguintes indicadores serão acompanhados semanalmente na Sala de Situação:

1. **Eficiência Técnica e Estabilidade:**
   * **Disponibilidade da Plataforma (Uptime):** $\ge 99,5\%$ durante toda a fase de operação assistida;
   * **Tempo de Resposta da API:** Média inferior a $250\text{ ms}$ em 95% das requisições;
   * **Sucesso na Execução de Testes E2E (Playwright):** $100\%$ de aprovação nos testes automatizados em cada release.

2. **Impacto Assistencial e Sanitário (BLH/MESM):**
   * **Aumento no Cadastro de Novas Doadoras:** Meta de aumento de $+35\%$ no 1º trimestre de uso do sistema;
   * **Tempo Médio entre Cadastro e Primeira Coleta:** Redução do prazo médio de 5 dias para menos de 48 horas;
   * **Índice de Retenção Térmica das Coletas:** $100\%$ das coletas registradas com temperatura dentro dos padrões normativos da ANVISA (-1°C a 5°C);
   * **Tempo Médio de Liberação de Exames Sorológicos:** Menos de 24 horas úteis após a inserção do laudo no sistema.

---

## 7. DOCUMENTOS E MANUAIS DE REFERÊNCIA NO REPOSITÓRIO

Todas as atividades deste cronograma apoiam-se na documentação técnica já consolidada no projeto:
* **`SOLICITACAO_INFRAESTRUTURA_SUTIN_UNCISAL.md`:** Formulário completo com especificações de hardware, rede, firewall, Nginx e PostgreSQL das duas VMs;
* **`MANUAL_DO_DESENVOLVEDOR.md`:** Especificação de arquitetura de software, modelo de tipos TypeScript, contratos de API e regras de negócio;
* **`MANUAL_DO_USUARIO.md`:** Guias passo a passo ilustrados para médicas, enfermeiras, motoristas e doadoras;
* **`ANALISE_DE_VULNERABILIDADES.md`:** Laudo de testes de penetração, conformidade com a LGPD e sanitização de segurança;
* **`playwright.config.ts` & `e2e/chatbot-fluxo.spec.ts`:** Especificações automatizadas de testes de regressão ponta a ponta dos fluxos do sistema.

---

### TERMO DE COMPROMISSO E APROVAÇÃO DAS DATAS

As datas deste cronograma foram pactuadas entre as partes para assegurar o início das atividades em **01 de outubro de 2026** e a conclusão definitiva com transferência de governança no dia **20 de fevereiro de 2027**:

Maceió/AL, 01 de Outubro de 2026.

___________________________________________________  
**Coordenação Geral do Banco de Leite Humano**  
Maternidade Escola Santa Mônica (MESM / UNCISAL)

___________________________________________________  
**Superintendência de Tecnologia da Informação (SUTIN)**  
Universidade Estadual de Ciências da Saúde de Alagoas (UNCISAL)

___________________________________________________  
**Diretoria Geral / Diretoria Médica**  
Maternidade Escola Santa Mônica (MESM / UNCISAL)
