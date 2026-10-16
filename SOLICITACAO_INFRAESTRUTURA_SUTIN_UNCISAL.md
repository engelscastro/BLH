# SOLICITAÇÃO DE INFRAESTRUTURA DE TI E HOSPEDAGEM
## Superintendência de Tecnologia da Informação (SUTIN / UNCISAL)
### Sistema do Banco de Leite Humano — Maternidade Escola Santa Mônica (BLH / MESM)

---

**Para:** Superintendência de Tecnologia da Informação (SUTIN / UNCISAL)  
**De:** Coordenação do Banco de Leite Humano / Diretoria Médica da MESM  
**Assunto:** Requisitos de Infraestrutura, Servidor, Segurança e Domínio para Entrada em Produção do Sistema Web do BLH/MESM  
**Legislação de Referência:** ANVISA RDC nº 171/2006 (Boas Práticas em BLH), Lei Federal nº 13.709/2018 (LGPD) e Portaria MS nº 1.018/2005.

---

## 1. RESUMO EXECUTIVO DO PROJETO

O **Sistema do Banco de Leite Humano da Maternidade Escola Santa Mônica** é uma plataforma institucional desenvolvida para a UNCISAL para modernizar a triagem clínica de nutrizes, a validação de exames sorológicos (HIV, Sífilis, Hepatites e HTLV), a emissão de pareceres médicos pediátricos e o roteamento logístico das vans de coleta domiciliar em Maceió.

Para a publicação oficial do sistema na rede corporativa da UNCISAL e disponibilização pública para as cidadãs alagoanas, solicitamos o provisionamento dos recursos de infraestrutura descritos neste documento.

---

## 2. ARQUITETURA DE IMPLANTAÇÃO EM DUAS MÁQUINAS VIRTUAIS (VMs)

Conforme as melhores práticas de segurança corporativa em TI em saúde, segmentação de redes do SUS e conformidade com a LGPD (Lei nº 13.709/2018), o sistema será implantado em **duas Máquinas Virtuais (VMs) dedicadas e isoladas**:

```
 [ Cidadãs / Doadoras ]       [ Vans de Coleta / Motoristas ]      [ Equipe Médica MESM ]
            │                                 │                               │
            └─────────────────────────────────┼───────────────────────────────┘
                                              │  HTTPS (443)
                                              ▼
                        ┌──────────────────────────────────────────────┐
                        │  VM 1: APLICAÇÃO & PROXY REVERSO             │
                        │  Hostname: srv-blhapp.uncisal.edu.br         │
                        │  IP Privado: Subrede DMZ / Aplicações        │
                        │  • Nginx (SSL/TLS + Proxy Reverso)           │
                        │  • Node.js 22 LTS + Express + React 19       │
                        │  • PM2 Process Manager                       │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               │ Conexão Segura TCP 5432
                                               │ (Restrita via Firewall Interno)
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │  VM 2: BANCO DE DADOS POSTGRESQL 15/16       │
                        │  Hostname: srv-blhdb.uncisal.edu.br          │
                        │  IP Privado: Subrede de Dados / BD UNCISAL   │
                        │  • PostgreSQL 15 / 16 (Database Server)      │
                        │  • Sem IP Público / Sem Acesso Externo       │
                        │  • Rotina de pg_dump + Backup Central SUTIN  │
                        └──────────────────────────────────────────────┘
```

---

## 3. DIMENSIONAMENTO DAS DUAS MÁQUINAS VIRTUAIS

### 3.1 VM 1 — Servidor de Aplicação Web (Frontend + Backend Node.js)
* **Finalidade:** Servir a aplicação web React, API RESTful Express, motor do chatbot Dra. Mônica, geração de termos de doação em PDF e roteamento das vans;
* **Hostname Sugerido:** `vm-blh-app.uncisal.edu.br` (ou `srv-blhapp`);
* **Sistema Operacional:** Ubuntu Server 22.04 LTS ou 24.04 LTS (ou Rocky Linux 9 / Debian 12);
* **Processador (vCPU):** 2 a 4 vCPUs;
* **Memória RAM:** 4 GB a 8 GB;
* **Armazenamento (Disco SSD):** 60 GB a 80 GB;
* **Interfaces de Rede:** 
  * 1 interface na rede com acesso à Internet (via Proxy Reverso/Firewall da SUTIN nas portas 80/443);
  * Conectividade na sub-rede interna da UNCISAL com a **VM 2 (Porta 5432)**;
* **Pacotes e Softwares:** Node.js 22 LTS, npm, PM2, Nginx, Certbot (caso não haja WAF corporativo com terminação TLS).

### 3.2 VM 2 — Servidor de Banco de Dados Relacional (PostgreSQL 15 / 16)
* **Finalidade:** Armazenamento seguro de cadastros de doadoras, resultados de exames sorológicos (HIV/VDRL/Hepatites), agendamentos de coleta e logs imutáveis de auditoria sanitária;
* **Hostname Sugerido:** `vm-blh-db.uncisal.edu.br` (ou `srv-blhdb`);
* **Sistema Operacional:** Ubuntu Server 22.04 LTS ou 24.04 LTS (ou Rocky Linux 9 / Debian 12);
* **SGBD:** **PostgreSQL 15 ou 16**;
* **Processador (vCPU):** 2 a 4 vCPUs;
* **Memória RAM:** 4 GB a 8 GB (com shared_buffers otimizado para PostgreSQL);
* **Armazenamento (Disco SSD):** 80 GB a 120 GB (partição `/var/lib/postgresql` com expansão em storage);
* **Interfaces e Regras de Rede:**
  * **Zero exposição à Internet (Sem IP público e sem rota externa)**;
  * Acesso à porta `5432/TCP` liberado **estritamente e exclusivamente** para o IP da **VM 1 (Servidor de Aplicação)**;
  * Acesso administrativo via SSH (Porta 22) restrito à VPN da equipe de infraestrutura da SUTIN.

---

## 4. REQUISITOS DE SUBDOMÍNIO, DNS E CERTIFICADO DIGITAL SSL/TLS

### 4.1 Subdomínio Institucional Definido
O sistema utilizará oficialmente o subdomínio institucional sob a zona de DNS da UNCISAL:

* **Subdomínio Oficial (FQDN):** `bancodeleite.uncisal.edu.br`
* **Tipo de Apontamento DNS:** Registro `A` apontando diretamente para o IP público alocado para a **VM 1** (ou para o IP do Firewall/Proxy Reverso corporativo da SUTIN);
* **TTL Sugerido:** 3600 segundos (1 hora);
* **Identidade Visual e Institucional:** O endereço `https://bancodeleite.uncisal.edu.br` transmitirá total credibilidade pública às mães doadoras alagoanas, equipes de saúde dos postos e maternidades do Estado.

### 4.2 Certificado Digital SSL/TLS (HTTPS Obrigatório)
O funcionamento sob protocolo seguro **HTTPS (porta 443) é mandatório e requisito impeditivo**, em virtude das seguintes exigências técnicas e sanitárias:
1. **Requisitos de PWA e Service Worker (Coleta Offline das Vans):** O aplicativo dos motoristas/coletores funciona mesmo em áreas com sinal oscilante de internet em Maceió via Service Worker e cache local. Os navegadores modernos (Google Chrome, Firefox, Safari) **bloqueiam terminantemente o registro de Service Workers em conexões HTTP inseguras**;
2. **Geolocalização (GPS) e Captura de Imagens:** O aplicativo requer autorização do smartphone para coletar coordenadas GPS da residência da doadora e tirar fotos do cartão de gestante/exames, APIs que são restritas exclusivamente a origens criptografadas (HTTPS);
3. **LGPD (Lei Federal nº 13.709/2018 - Art. 11):** Proteção criptográfica rigorosa em trânsito (TLS 1.2 / TLS 1.3) para exames sorológicos sensíveis de HIV, Hepatites, Sífilis e dados clínicos de lactantes e recém-nascidos da MESM;
4. **Opções de Emissão do Certificado:**
   * Certificado Digital Corporativo emitido via CA RNP / ICPEdu (padrão de segurança das universidades federais e estaduais);
   * Ou certificado emitido automaticamente pelo Let's Encrypt através do utilitário `certbot` com renovação programada.

### 4.3 Liberação de Portas e Firewall
* **Portas Externas (Públicas):**
  * `80/TCP (HTTP)` — Com redirecionamento permanente (`301 Moved Permanently`) obrigatório para a porta 443;
  * `443/TCP (HTTPS)` — Tráfego web público do sistema (`https://bancodeleite.uncisal.edu.br`).
* **Portas Internas / Acesso Administrativo:**
  * `22/TCP (SSH)` — Restrito exclusivamente à VPN da SUTIN/UNCISAL ou à sub-rede da TI (sem acesso SSH aberto para a internet);
  * Porta da aplicação interna: `3000/TCP` (vinculada a `127.0.0.1` na VM 1, atendida pelo Nginx).

---

## 5. SERVIDOR WEB REVERSO (NGINX) E SERVIÇOS DE SISTEMA (VM 1)

Recomendamos a instalação do **Nginx** como Proxy Reverso frontal da aplicação na VM 1, com o **PM2** gerenciando o processo Node.js.

### 5.1 Configuração Homologada do Nginx (`/etc/nginx/sites-available/bancodeleite.uncisal.edu.br`)
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name bancodeleite.uncisal.edu.br;
    return 301 https://bancodeleite.uncisal.edu.br$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bancodeleite.uncisal.edu.br;

    ssl_certificate /etc/letsencrypt/live/bancodeleite.uncisal.edu.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bancodeleite.uncisal.edu.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Limite para upload de imagens de caderneta de exames
    client_max_body_size 15M;

    # Cabeçalhos de segurança recomendados (HSTS, No-Sniff, X-Frame)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2 Gerenciador de Processos (PM2)
* O processo do sistema roda via `npm run start` (ou `node server.ts` / `tsx server.ts`);
* Inicialização automática no boot do sistema operacional através de `pm2 startup systemd` e `pm2 save`.

---

## 6. REQUISITOS DO BANCO DE DADOS POSTGRESQL (VM 2 DEDICADA)

A escolha arquitetural definida é o **PostgreSQL 15 ou 16 em Máquina Virtual Dedicada (VM 2)**, garantindo conformidade rigorosa com o **Artigo 11 da LGPD (Tratamento de dados pessoais sensíveis de saúde)** e **ANVISA RDC nº 171/2006 (Rastreabilidade e integridade de bancos de leite humano)**.

### 6.1 Parâmetros do PostgreSQL Solicitados à SUTIN
* **Versão do SGBD:** PostgreSQL 15.x ou 16.x (Ubuntu LTS Package);
* **Nome da Base de Dados:** `blh_mesm_prod`;
* **Encoding / Collation:** `UTF8` / `pt_BR.UTF-8`;
* **Usuário da Aplicação:** `blh_app`;
* **Extensões Necessárias:** `uuid-ossp`, `pgcrypto` (para suporte a UUIDs v4 e funções criptográficas de integridade);
* **Suporte a JSONB:** Nativo no PostgreSQL, utilizado para armazenar os diálogos de triagem da Dra. Mônica e snapshots de auditoria sanitária.

### 6.2 Configuração de Rede e Conectividade Segura (pg_hba.conf)
Para manter o banco de dados blindado contra qualquer tráfego indevido:
1. No arquivo `/etc/postgresql/16/main/postgresql.conf`:
   ```ini
   listen_addresses = '*'  # ou IP da interface interna da VM 2
   port = 5432
   ```
2. No arquivo `/etc/postgresql/16/main/pg_hba.conf` (liberação **exclusiva** para o IP da VM 1):
   ```ini
   # Regra estrita: apenas a VM da Aplicação conecta na base do BLH
   host    blh_mesm_prod    blh_app    <IP_PRIVADO_VM1_APLICACAO>/32    scram-sha-256
   ```
3. Nenhuma outra máquina ou IP público terá permissão na porta 5432.

### 6.3 Script DDL de Criação das Tabelas
O repositório do projeto disponibiliza o script completo DDL para execução inicial pelo DBA da SUTIN no arquivo:
* **Caminho:** `/scripts/init_postgresql_blh.sql`
* **Tabelas Criadas:**
  1. `blh_donors` — Cadastro de nutrizes, contato, endereço com geolocalização e status;
  2. `blh_donor_serology` — Exames sorológicos (HIV, Sífilis, Hepatites B/C, HTLV) e parecer médico com CRM;
  3. `blh_collection_routes` — Roteamento das vans em Maceió, controle térmico (-1°C a 5°C) e volumes coletados;
  4. `blh_chatbot_sessions` — Histórico de atendimentos automatizados da Dra. Mônica;
  5. `blh_audit_logs` — Trilha sanitária imutável com hashes SHA-256 e snapshots de cada operação.

### 6.4 Variáveis de Ambiente na VM 1 (Aplicação)
Na VM 1 (Aplicação), o sistema se conectará à VM 2 através do arquivo `.env`:
```env
# URL de Acesso Público Oficial
APP_URL=https://bancodeleite.uncisal.edu.br

# Conexão com o PostgreSQL na VM 2
DATABASE_URL=postgresql://blh_app:<SENHA_SEGURA_SUTIN>@<IP_PRIVADO_VM2_BANCO>:5432/blh_mesm_prod
PGHOST=<IP_PRIVADO_VM2_BANCO>
PGPORT=5432
PGDATABASE=blh_mesm_prod
PGUSER=blh_app
PGPASSWORD=<SENHA_SEGURA_SUTIN>

# Segurança e Autenticação
SESSION_SECRET=<CHAVE_ALEATORIA_64_CHARS>
PORT=3000
NODE_ENV=production
```

### 6.5 Volume Estimado de Dados
* **Doadoras Ativas:** ~150 a 300 novas doadoras cadastradas por mês;
* **Agendamentos de Coleta:** ~400 a 800 coletas domiciliares mensais das vans;
* **Uploads de Comprovantes:** Média de 500 KB a 2 MB por imagem de cartão de gestante (~1 GB a 3 GB por ano);
* **Logs de Auditoria Sanitária:** ~5.000 a 10.000 eventos anuais com registros de IP, operador, CRM/COREN e hash SHA-256.

---

## 7. POLÍTICA DE BACKUP E CONFORMIDADE SANITÁRIA (ANVISA RDC 171/2006)

A Resolução RDC nº 171/2006 da ANVISA exige que os registros de doadoras, coletas de leite e exames sorológicos sejam auditáveis e rastreáveis.

Solicitamos à SUTIN a inclusão das duas máquinas virtuais na rotina de backups institucionais:
1. **VM 2 (Banco de Dados PostgreSQL):**
   * Rotina automatizada diária via `pg_dump` consistente:
     ```bash
     pg_dump -U blh_app -d blh_mesm_prod -F c -b -v -f /backups/blh_mesm_$(date +%Y%m%d).dump
     ```
   * Retenção de cópias diárias por 30 dias;
   * Cópia mensal consolidada mantida por no mínimo 12 meses;
   * Armazenamento do dump em storage secundário / off-site da UNCISAL.
2. **VM 1 (Aplicação e Arquivos):**
   * Backup snapshot da VM ou dos diretórios de código e uploads de cadernetas de gestantes.

---

## 8. RELAY SMTP INSTITUCIONAL (OPCIONAL / RECOMENDADO)

Para que o sistema possa enviar confirmações de agendamento às mães e alertas de rotas atrasadas à coordenação médica da Santa Mônica:
* **Servidor SMTP:** `smtp.uncisal.edu.br` (ou serviço de mensageria da UNCISAL);
* **Porta:** 587 (STARTTLS) ou 465 (SSL);
* **Conta de Envio:** `bancodeleite@uncisal.edu.br` (ou `notificacoes.mesm@uncisal.edu.br`).

---

## 9. MATRIZ DE RESPONSABILIDADES

| Atividade | Responsável |
| :--- | :--- |
| Provisionamento das 2 VMs (VM 1 Aplicação + VM 2 PostgreSQL) | **SUTIN / UNCISAL** |
| Criação do Subdomínio Oficial no DNS (`bancodeleite.uncisal.edu.br`) | **SUTIN / UNCISAL** |
| Emissão / Renovação do Certificado SSL/TLS (HTTPS Obrigatório) | **SUTIN / UNCISAL** |
| Instalação e Configuração do SGBD PostgreSQL 15/16 na VM 2 | **SUTIN / UNCISAL** |
| Configuração de Firewall (Portas 80/443 na VM 1 e 5432 restrita na VM 2) | **SUTIN / UNCISAL** |
| Rotina de Backup Automatizado no Storage Central | **SUTIN / UNCISAL** |
| Deploy do Código da Aplicação e Configuração do Node.js | **Equipe Técnica do Projeto / SUTIN** |
| Validação Clínica, Treinamento das Mães e Equipe da MESM | **Coordenação do BLH / MESM** |

---

## 10. CONTATO DA EQUIPE TÉCNICA E HOMOLOGAÇÃO

Ficamos à disposição para agendamento de alinhamento técnico conjunto ou reunião via Google Meet / presencial no campus da UNCISAL para sanar dúvidas de configuração e testes de conectividade.

* **Setor Demandante:** Banco de Leite Humano — Maternidade Escola Santa Mônica (MESM / UNCISAL)  
* **Endereço da Unidade:** Rua Jorge de Lima, 113 — Trapiche da Barra, Maceió/AL  
* **E-mail de Contato:** `bancodeleite@uncisal.edu.br`  
* **Telefone / Ramal:** (82) 3315-4400 / 3315-4411
