# MANUAL DO DESENVOLVEDOR
## Arquitetura, Engenharia de Software e Especificação Técnica
### Sistema do Banco de Leite Humano (BLH) — Maternidade Escola Santa Mônica (MESM / UNCISAL)

---

## 1. VISÃO GERAL DA ARQUITETURA

O sistema é uma aplicação full-stack moderna concebida para oferecer alta disponibilidade, rastreabilidade em conformidade com as normas sanitárias da **ANVISA (RDC 171/2006)** e resiliência com suporte **Offline-First (PWA)** para operações logísticas em campo.

### 1.1 Stack Tecnológica
- **Linguagem Principal:** TypeScript 5.8+ (Strict Mode ativado em todo o projeto)
- **Frontend SPA:** React 19.0.1 com React DOM 19.0.1
- **Bundler & Build Tool:** Vite 8.3.0
- **Estilização & Design System:** Tailwind CSS v4.3.3 (importado via `@import "tailwindcss";` em `@tailwindcss/vite`)
- **Backend / API Server:** Node.js 22+ com Express 4.21.2 executado em tempo de execução via `tsx`
- **Geração de Relatórios Oficiais:** `jspdf` 4.2.1 + `jspdf-autotable` 5.0.8
- **Visualização de Dados & Gráficos:** `recharts` 3.10.1
- **Ícones do Sistema:** `lucide-react` 0.546.0
- **Animações e Transições:** `motion` 12.23.24
- **PWA e Service Worker:** `vite-plugin-pwa` 2.0.0 com estratégias de cache `NetworkFirst` e `CacheFirst`
- **Banco de Dados / Armazenamento:** Camada persistente com persistência atômica em arquivo JSON (`data/blh_database.json`) e rotinas síncronas/assíncronas de escrita segura com backup e lock lógico.

---

## 2. ESTRUTURA DO DIRETÓRIO DO PROJETO

```
├── .env.example                     # Variáveis de ambiente de exemplo
├── data/
│   └── blh_database.json            # Base de dados persistente (doadoras, rotas, coletadores, logs)
├── index.html                       # Entry-point HTML com meta tags e manifest PWA
├── metadata.json                    # Metadados do applet na plataforma AI Studio
├── package.json                     # Dependências e scripts de automação
├── public/                          # Ativos estáticos e ícones PWA
├── server.ts                        # Servidor Express, rotas da API RESTful e motor de persistência
├── src/
│   ├── App.tsx                      # Componente raiz, orquestrador de abas e modais
│   ├── main.tsx                     # Ponto de entrada React 19
│   ├── index.css                    # Folha de estilo global com Tailwind CSS v4
│   ├── components/
│   │   ├── ActivityLogsView.tsx     # Tela de Logs de Atividade & Auditoria ANVISA (RDC 171/2006)
│   │   ├── ClinicalScreeningWizard.tsx # Fluxo de triagem clínica rBLH / Fiocruz
│   │   ├── FiocruzGuidelinesModal.tsx  # Modal com normas técnicas da Fiocruz/rBLH
│   │   ├── Header.tsx               # Barra institucional UNCISAL/MESM e navegação responsiva
│   │   ├── HospitalAdminDashboard.tsx # Painel Administrativo Hospitalar completo
│   │   ├── PhoneChatbotSimulator.tsx   # Simulador interativo do celular com Dra. Mônica
│   │   ├── ProtocolCard.tsx         # Componente de exibição de comprovante e protocolo
│   │   ├── ProtocolLookupModal.tsx  # Modal de consulta pública por código BLH-2026
│   │   ├── PWAInstallButton.tsx     # Botão inteligente de instalação PWA (beforeinstallprompt)
│   │   └── RouteCollectorView.tsx   # Módulo mobile ultraleve para motoristas da van (offline-first)
│   ├── services/
│   │   └── api.ts                   # Camada de comunicação com a API REST e fila offline
│   └── types/
│       └── blh.ts                   # Definições completas de tipos TypeScript e contratos de domínio
├── tsconfig.json                    # Configurações do compilador TypeScript
└── vite.config.ts                   # Configurações do Vite e integração do plugin PWA
```

---

## 3. MODELO DE DADOS E TIPOS DE DOMÍNIO (`src/types/blh.ts`)

A integridade do sistema é garantida pelo modelo de tipos estrito. Abaixo estão as principais interfaces:

### 3.1 Doadora (`Doadora`)
```typescript
export type StatusTriagem = 'APTA' | 'EM_ANALISE' | 'INAPTA_TEMPORARIA' | 'INAPTA_DEFINITIVA';
export type TipoLeite = 'COLOSTRO' | 'TRANSICAO' | 'MADURO';
export type RegiaoLogistica = 
  | 'ORLA_BAIXA' 
  | 'TABULEIRO_ALTA' 
  | 'LITORAL_SUL_TRAPICHE' 
  | 'CENTRO_FAROL' 
  | 'BENEDITO_BENTES';

export interface Doadora {
  id: string;
  protocolo: string;              // Ex: "BLH-2026-0142"
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  email?: string;
  dataNascimento: string;
  nomeBebe: string;
  dataNascimentoBebe: string;
  idadeBebeDias: number;
  tipoLeite: TipoLeite;
  status: StatusTriagem;
  motivoStatus: string;
  respostas: RespostasTriagem;
  endereco?: EnderecoDoadora;
  dataCadastro: string;
  comprovanteExames?: ComprovanteExames;
  parecerMedico?: ParecerMedico;
}
```

### 3.2 Agendamento de Coleta (`AgendamentoColeta`)
```typescript
export type TurnoColeta = 'MANHA' | 'TARDE';
export type StatusAgendamento = 'PENDENTE' | 'EM_ROTA' | 'COLETADO' | 'REAGENDADO' | 'CANCELADO';
export type MotivoColeta = 'BUSCAR_LEITE' | 'RECEBER_FRASCOS' | 'AMBOS';

export interface AgendamentoColeta {
  id: string;
  protocolo: string;
  doadoraId: string;
  nomeDoadora: string;
  telefone: string;
  bairro: string;
  regiaoLogistica: RegiaoLogistica;
  enderecoCompleto: string;
  pontoReferencia: string;
  motivo: MotivoColeta;
  quantidadeFrascosEstimada: number;
  dataAgendada: string;          // Formato YYYY-MM-DD
  turno: TurnoColeta;
  status: StatusAgendamento;
  coletadorId?: string;
  coletadorNome?: string;
  dadosColeta?: {
    dataHoraColeta?: string;
    frascosColetados: number;
    volumeAproximadoMl: number;
    frascosEntregues: number;
    temperaturaTermicaC: number;  // Ex: -12.5 (Aferição na van)
    observacoes?: string;
    coletadorMatricula: string;
  };
}
```

### 3.3 Log de Auditoria & Rastreabilidade ANVISA (`LogAtividade`)
```typescript
export interface LogAtividade {
  id: string;
  timestamp: string;             // ISO-8601 UTC
  tipo: 
    | 'ALTERACAO_STATUS'
    | 'VALIDACAO_EXAMES'
    | 'PARECER_MEDICO'
    | 'BAIXA_COLETA'
    | 'CHATBOT_INTERACAO'
    | 'ACESSO_AUTENTICACAO'
    | 'CADASTRO_DOADORA';
  categoria: 'ENFERMAGEM' | 'MEDICO' | 'COLETADOR' | 'CHATBOT' | 'SISTEMA' | 'GESTAO';
  acao: string;
  protocolo?: string;
  usuario: {
    id: string;
    nome: string;
    cargo: string;
    matriculaOuRegistro?: string; // CRM, COREN ou Matrícula da Van
  };
  dadosAnteriores?: any;
  dadosNovos?: any;
  justificativaClinica?: string;
  hashIntegridade: string;       // SHA-256 gerado no backend
  ipOrigem?: string;
  detalhesAuditoria?: {
    artigoRDC171?: string;       // Ex: "Art. 14, RDC 171/2006"
    conformidade: 'CONFORME' | 'ALERTA' | 'AUDITADO';
    canal: 'WEB_HOSPITALAR' | 'MOBILE_VAN' | 'CHATBOT_WHATSAPP' | 'API_SISTEMA';
  };
}
```

---

## 4. ESPECIFICAÇÃO COMPLETA DA API RESTful (`server.ts`)

Todas as requisições utilizam JSON (`application/json`) e retornam códigos HTTP padrão.

### 4.1 Autenticação e Gestão de Credenciais
- `POST /api/auth/hospital-login`
  - **Body:** `{ login: string, pin: string }`
  - **Retorno 200:** `{ success: true, user: ProfissionalHospitalar }`
  - **Retorno 401:** `{ error: "Credenciais inválidas" }`
- `POST /api/auth/hospital-change-password`
  - **Body:** `{ login: string, currentPin: string, newPin: string }`
  - **Retorno 200:** `{ success: true, message: string }`
- `POST /api/auth/collector-change-pin`
  - **Body:** `{ matricula: string, currentPin: string, newPin: string }`
  - **Retorno 200:** `{ success: true, message: string }`

### 4.2 Doadoras e Triagem Clínica
- `GET /api/donors`
  - Retorna a lista completa de doadoras cadastradas.
- `GET /api/donors/check-phone?phone=(82)9...`
  - Verifica se o número de telefone já possui cadastro ativo para evitar duplicidades no chatbot.
- `POST /api/donors`
  - **Body:** Objeto parcial ou completo de `Doadora`.
  - **Ação:** Cria o registro da doadora, gera o protocolo `BLH-2026-XXXX`, calcula o tipo do leite com base na idade do bebê e cria automaticamente o agendamento de coleta se o endereço foi fornecido. Registra log de auditoria.
- `PATCH /api/donors/:id/comprovante`
  - **Body:** Objeto `ComprovanteExames`.
  - **Ação:** Vincula a foto/PDF da caderneta de exames da doadora.
- `PATCH /api/donors/:id/validate-comprovante`
  - **Body:** `{ validadoPor: string, coren: string, observacoes?: string }`
  - **Ação:** Registra a validação técnica da enfermagem. Emite log de auditoria com hash SHA-256.
- `PATCH /api/donors/:id/medical-review`
  - **Body:** `{ decisao: 'APROVADA' | 'REJEITADA', observacoes: string, aprovadoPor: string, matricula: string }`
  - **Ação:** Atualiza o parecer médico oficial. Em caso de aprovação, altera o status da doadora para `APTA`. Registra log imutável.

### 4.3 Consultas e Protocolos Públicos
- `GET /api/protocols/:code`
  - Permite a busca pública sem credencial confidencial pelo código `BLH-2026-XXXX` ou número de telefone limpo.

### 4.4 Agendamentos e Rotas da Van
- `GET /api/appointments`
  - Retorna os agendamentos de coleta com ordenação cronológica e por região logística.
- `POST /api/appointments`
  - **Body:** Criação direta de novo agendamento de rota.
- `PATCH /api/appointments/:id/status`
  - **Body:** `{ status: StatusAgendamento, dadosColeta?: { frascosColetados, volumeAproximadoMl, frascosEntregues, temperaturaTermicaC, observacoes, coletadorMatricula, dataHoraColeta } }`
  - **Ação:** Registra a baixa da van, confere a temperatura sanitária e emite log de rastreabilidade ANVISA.

### 4.5 Logs de Auditoria ANVISA (RDC 171/2006)
- `GET /api/logs`
  - **Query Params:** `?tipo=...&categoria=...&protocolo=...&search=...&limit=...`
  - Retorna os logs filtrados ordenados pelo mais recente.
- `POST /api/logs`
  - Registra um log de evento customizado (ex: interações do chatbot, auditorias de segurança).
- `GET /api/logs/stats`
  - Retorna estatísticas de auditoria: total de logs, eventos de enfermagem, corpo médico, baixas de coleta, etc.

### 4.6 Estatísticas Globais
- `GET /api/stats`
  - Retorna métricas consolidadas do BLH: doadoras totais, aptas, em análise, volume total coletado em mL e estimativa de prematuros beneficiados.

---

## 5. ARQUITETURA DE RASTREABILIDADE E AUDITORIA (ANVISA RDC 171/2006)

Para cumprir com as exigências sanitárias brasileiras para Bancos de Leite Humano:

### 5.1 Geração de Hash Criptográfico SHA-256
No arquivo `server.ts`, todo evento registrado pelo helper `recordActivityLog(entry)` passa pela função de integridade criptográfica:
```typescript
function generateLogHash(logData: any): string {
  const content = `${logData.timestamp}|${logData.tipo}|${logData.categoria}|${logData.usuario?.id}|${logData.protocolo || ''}|${JSON.stringify(logData.dadosNovos || {})}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}
```
Isso garante:
1. **Inviolabilidade:** Qualquer alteração manual indevida em um registro antigo quebra a correspondência do hash.
2. **Não Repúdio:** A ação é assinada com o carimbo de tempo UTC e os dados do operador responsável (CRM, COREN ou Matrícula da Van).
3. **Auditabilidade Externa:** O hash pode ser verificado por fiscais da vigilância sanitária estadual e da ANVISA.

---

## 6. LÓGICA DE NEGÓCIO E MOTOR DE TRIAGEM CLÍNICA

### 6.1 Classificação do Leite Humano por Dias Pós-Parto
Calculado dinamicamente no cadastro da nutriz:
- **0 a 7 dias:** `COLOSTRO` (Leite hiperproteico, rico em imunoglobulinas IgA, ideal para prematuros extremos nas primeiras horas de vida).
- **8 a 15 dias:** `TRANSICAO` (Adequação calórica intermediária).
- **Mais de 15 dias:** `MADURO` (Rico em gorduras, lipídios e lactose, indicado para ganho ponderal de peso na UTIN).

### 6.2 Regras Sanitárias de Inaptidão
Implementadas no `PhoneChatbotSimulator.tsx` e `ClinicalScreeningWizard.tsx`:
- **Sorologia Positiva (HIV, HTLV, Sífilis ativa, Hepatites virais):** `INAPTA_DEFINITIVA`.
- **Drogas ilícitas ou tabagismo > 10 cigarros/dia:** `INAPTA_DEFINITIVA`.
- **Tatuagem, piercing ou transfusão < 12 meses:** `INAPTA_TEMPORARIA` (Janela imunológica de 12 meses).
- **Medicamentos contínuos ou sintomas agudos:** `EM_ANALISE` (Exige parecer de neonatologista no Painel da MESM).

---

## 7. SISTEMA DE ALERTAS DE ROTAS PÓS-HORÁRIO LIMITE

Para evitar a perda térmica de amostras de leite congelado cru durante o transporte em Maceió:

### 7.1 Algoritmo de Verificação de Horário Limite (`HospitalAdminDashboard.tsx`)
```typescript
const checkRouteOverdue = (apt: AgendamentoColeta, cManha = cutoffManha, cTarde = cutoffTarde) => {
  if (apt.status === 'COLETADO' || apt.status === 'CANCELADO') {
    return { isOverdue: false, delayText: '', cutoffTime: '', isPastDay: false };
  }
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const aptDate = apt.dataAgendada ? apt.dataAgendada.split('T')[0] : todayStr;

  // Atraso de dias anteriores
  if (aptDate < todayStr) {
    const diffDays = Math.max(1, Math.floor((now.getTime() - new Date(aptDate).getTime()) / (86400000)));
    return { isOverdue: true, delayText: `+${diffDays}d de atraso`, cutoffTime: apt.turno === 'MANHA' ? cManha : cTarde, isPastDay: true };
  }

  // Atraso no mesmo dia após o cutoff do turno
  if (aptDate === todayStr) {
    const targetCutoff = apt.turno === 'MANHA' ? cManha : cTarde;
    const [cutoffH, cutoffM] = targetCutoff.split(':').map(Number);
    const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), cutoffH, cutoffM, 0);

    if (now.getTime() > cutoffDate.getTime()) {
      const diffMins = Math.floor((now.getTime() - cutoffDate.getTime()) / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return {
        isOverdue: true,
        delayText: hours > 0 ? `+${hours}h ${mins}min` : `+${mins}min`,
        cutoffTime: targetCutoff,
        isPastDay: false
      };
    }
  }

  return { isOverdue: false, delayText: '', cutoffTime: '', isPastDay: false };
};
```
O alerta dispara dinamicamente sem necessidade de recarregar a tela e atualiza os badges em tempo real.

---

## 8. ESTRATÉGIA OFFLINE-FIRST (PWA / ROTAS DA VAN)

As vans de coleta circulam por áreas de Maceió com instabilidade de sinal 4G. A estratégia adotada é:
1. **Cache de Rotas:** O arquivo `src/services/api.ts` mantém uma cópia das rotas em `localStorage` sob a chave `mesm_blh_cached_appointments`.
2. **Fila Offline:** Quando uma baixa de coleta falha por ausência de rede (`netErr`), o payload é armazenado em `mesm_blh_offline_queue`.
3. **Auto-Sync:** Ao detectar o evento de rede `window.addEventListener('online')`, o componente `RouteCollectorView.tsx` dispara a rotina de descarregamento da fila, enviando todas as baixas represadas para o servidor.
4. **Armazenamento de PIN:** O PIN dos motoristas é armazenado em cache criptografado com sal local para validação instantânea mesmo sem sinal.

---

## 9. GUIA DE AMBIENTE, INSTALAÇÃO E DEPLOY

### 9.1 Pré-requisitos
- Node.js versão 20.x ou 22.x
- NPM versão 10.x ou superior

### 9.2 Instalação e Execução em Desenvolvimento
```bash
# Instalação das dependências
npm install

# Execução em ambiente de desenvolvimento (Inicia Express + Vite na porta 3000)
npm run dev
```

### 9.3 Build de Produção
```bash
# Validação de tipagem e integridade
npm run lint

# Compilação dos ativos otimizados
npm run build

# Execução em produção
npm run start
```

### 9.4 Variáveis de Ambiente (`.env`)
```env
PORT=3000
NODE_ENV=production
APP_URL=https://bancodeleite.uncisal.edu.br

# Conexão com o PostgreSQL na VM 2 (Produção SUTIN)
DATABASE_URL=postgresql://blh_app:<SENHA_SEGURA>@<IP_VM2_POSTGRES>:5432/blh_mesm_prod
PGHOST=<IP_VM2_POSTGRES>
PGPORT=5432
PGDATABASE=blh_mesm_prod
PGUSER=blh_app
PGPASSWORD=<SENHA_SEGURA>
```

### 9.5 Infraestrutura Homologada (SUTIN / UNCISAL)
- **Subdomínio Oficial:** `https://bancodeleite.uncisal.edu.br` (DNS registro `A` na SUTIN)
- **Topologia:** 2 Máquinas Virtuais (VM 1 Aplicação com Node.js + Nginx Proxy Reverso + SSL; VM 2 Banco de Dados PostgreSQL 15/16 isolado na rede interna)
- **Documento Completo de Infraestrutura:** `/SOLICITACAO_INFRAESTRUTURA_SUTIN_UNCISAL.md`
- **Script DDL Inicial do Banco:** `/scripts/init_postgresql_blh.sql`

---

## 10. TESTES, LINTING E CONTROLE DE QUALIDADE

Para validar a integridade do código antes de qualquer deploy ou commit:
```bash
# Execução da checagem estrita do compilador TypeScript
npm run lint

# Teste de compilação completa do Vite
npm run build
```

Assegure que nenhum erro de tipagem seja introduzido nas estruturas de `types/blh.ts` ou nos contratos REST de `server.ts`.

---
**Banco de Leite Humano — Maternidade Escola Santa Mônica (MESM / UNCISAL)**  
Divisão de Tecnologia da Informação e Comunicação (DTIC / UNCISAL)
