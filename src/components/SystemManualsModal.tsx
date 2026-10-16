import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Code, 
  FileText, 
  Download, 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  Stethoscope, 
  Truck, 
  UserCheck, 
  Copy, 
  ExternalLink,
  ChevronRight,
  Server,
  Layers,
  HelpCircle,
  Globe,
  Lock,
  ShieldAlert,
  X
} from 'lucide-react';

export type ManualTabType = 'USUARIO' | 'DESENVOLVEDOR' | 'INFRA_SUTIN' | 'SEGURANCA';

interface SystemManualsModalProps {
  onClose?: () => void;
  initialTab?: ManualTabType;
}

export const SystemManualsModal: React.FC<SystemManualsModalProps> = ({ 
  onClose,
  initialTab = 'USUARIO'
}) => {
  const [activeManual, setActiveManual] = useState<ManualTabType>(initialTab);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const getActiveText = (type: ManualTabType) => {
    switch (type) {
      case 'USUARIO':
        return USER_MANUAL_TEXT;
      case 'DESENVOLVEDOR':
        return DEV_MANUAL_TEXT;
      case 'INFRA_SUTIN':
        return SUTIN_REQUISITION_TEXT;
      case 'SEGURANCA':
        return SECURITY_AUDIT_TEXT;
    }
  };

  const downloadMarkdown = (type: ManualTabType) => {
    let filename = 'MANUAL_DO_USUARIO.md';
    if (type === 'DESENVOLVEDOR') filename = 'MANUAL_DO_DESENVOLVEDOR.md';
    if (type === 'INFRA_SUTIN') filename = 'SOLICITACAO_INFRAESTRUTURA_SUTIN_UNCISAL.md';
    if (type === 'SEGURANCA') filename = 'ANALISE_DE_VULNERABILIDADES.md';

    const content = getActiveText(type);
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    const content = getActiveText(activeManual);
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-w-6xl mx-auto my-2">
      {/* Top Header */}
      <div className="bg-slate-900 text-white p-4 sm:p-6 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Documentação Oficial MESM / UNCISAL
                </span>
                <span className="text-xs text-slate-400">RDC 171/2006</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Central de Manuais e Infraestrutura BLH
              </h2>
              <p className="text-xs text-slate-300">
                Guia operacional do usuário, documentação técnica e solicitação de infraestrutura à SUTIN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={copyToClipboard}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copiar texto do documento ativo"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              type="button"
              onClick={() => downloadMarkdown(activeManual)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Baixar arquivo Markdown"
            >
              <Download className="w-4 h-4" />
              <span>Baixar .MD</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 mt-5 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setActiveManual('USUARIO')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeManual === 'USUARIO'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Manual do Usuário</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-white font-mono hidden md:inline">
              Doadoras, Triagem & Vans
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveManual('DESENVOLVEDOR')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeManual === 'DESENVOLVEDOR'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Manual do Desenvolvedor</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-white font-mono hidden md:inline">
              APIs, Hashes & Offline
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveManual('INFRA_SUTIN')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeManual === 'INFRA_SUTIN'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Requisitos SUTIN / TI</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-bold hidden md:inline">
              Ofício UNCISAL
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveManual('SEGURANCA')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeManual === 'SEGURANCA'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-300" />
            <span>Vulnerabilidades & Segurança</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-300 border border-rose-400/30 font-bold hidden md:inline">
              Auditoria LGPD & OWASP
            </span>
          </button>
        </div>
      </div>

      {/* Main View with Search and Contents */}
      <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeManual === 'USUARIO'
                ? 'Buscar no Manual do Usuário...'
                : activeManual === 'DESENVOLVEDOR'
                ? 'Buscar no Manual do Desenvolvedor...'
                : activeManual === 'INFRA_SUTIN'
                ? 'Buscar nos Requisitos de Infraestrutura SUTIN...'
                : 'Buscar no Relatório de Vulnerabilidades e LGPD...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Manual Content Display */}
      <div className="p-4 sm:p-8 max-h-[70vh] overflow-y-auto space-y-8 bg-white">
        {activeManual === 'USUARIO' && <UserManualRendered searchTerm={searchTerm} />}
        {activeManual === 'DESENVOLVEDOR' && <DevManualRendered searchTerm={searchTerm} />}
        {activeManual === 'INFRA_SUTIN' && <SutinRequisitionRendered searchTerm={searchTerm} />}
        {activeManual === 'SEGURANCA' && <SecurityAuditRendered searchTerm={searchTerm} />}
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-100 border-t border-slate-200 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Arquivos disponíveis na raiz: <code>MANUAL_DO_USUARIO.md</code>, <code>MANUAL_DO_DESENVOLVEDOR.md</code>, <code>SOLICITACAO_INFRAESTRUTURA_SUTIN_UNCISAL.md</code> e <code>ANALISE_DE_VULNERABILIDADES.md</code></span>
        <span className="font-semibold text-slate-700">Maternidade Escola Santa Mônica (MESM / UNCISAL)</span>
      </div>
    </div>
  );
};

// Rendered Components for rich reading experience
const UserManualRendered: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  return (
    <div className="prose prose-slate max-w-none space-y-6 text-slate-800 text-sm leading-relaxed">
      {/* Section 1 */}
      <section className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
        <div className="flex items-center gap-2 text-emerald-900 font-black text-base">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <h3>1. Apresentação Institucional (MESM / UNCISAL)</h3>
        </div>
        <p className="mt-2 text-xs sm:text-sm text-slate-700">
          O <strong>Sistema do Banco de Leite Humano da Maternidade Escola Santa Mônica</strong> atende à maternidade de referência terciária em Alagoas para gestações de alto risco. O sistema opera em conformidade com as diretrizes da <strong>Rede Global de Bancos de Leite (rBLH / Fiocruz)</strong>, <strong>Resolução ANVISA RDC nº 171/2006</strong> e a <strong>LGPD</strong>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-emerald-200/60 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
            <strong>👶 Beneficiários:</strong> Recém-nascidos prematuros da UTIN e UCIN.
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
            <strong>🚚 Coleta Domiciliar:</strong> Gratuita em todos os bairros de Maceió.
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
            <strong>🔒 Segurança:</strong> Rastreabilidade ponta a ponta e cadeia de frio.
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex items-center gap-2 text-slate-900 font-black text-base">
          <span className="text-xl">📱</span>
          <h3>2. Guia para Mães Doadoras & Chatbot Dra. Mônica</h3>
        </div>
        <div className="space-y-3 mt-3 text-xs sm:text-sm">
          <p>
            <strong>Requisitos Básicos:</strong> Estar amamentando ou ordenhando com excedente de leite, ter exames de pré-natal negativos (HIV, Sífilis, Hepatites B e C, HTLV), não fazer uso de drogas ou tabagismo excessivo e não ter feito tatuagem ou piercing nos últimos 12 meses.
          </p>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Fluxo no Chatbot:</h4>
            <ol className="list-decimal pl-5 space-y-1 text-xs">
              <li><strong>Início:</strong> Clique em "Chatbot Celular" no menu superior e inicie com a Dra. Mônica;</li>
              <li><strong>Cadastro:</strong> Forneça dados básicos da mãe e data de nascimento do bebê;</li>
              <li><strong>11 Perguntas Clínicas:</strong> Responda às perguntas padronizadas rBLH/Fiocruz;</li>
              <li><strong>Comprovante de Exames:</strong> Envie foto da folha de sorologias da caderneta de pré-natal;</li>
              <li><strong>Agendamento:</strong> Escolha a data e o turno da visita da van (Manhã: 08h-12h ou Tarde: 13h-17h);</li>
              <li><strong>Protocolo:</strong> Anote seu código <code>BLH-2026-XXXX</code> para consultas futuras.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40">
        <div className="flex items-center gap-2 text-amber-950 font-black text-base">
          <span className="text-xl">🧪</span>
          <h3>3. Guia de Boas Práticas Sanitárias (Fiocruz / ANVISA)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-1">Frascos Coletores:</h4>
            <p>Usar apenas potes de vidro com tampa plástica de rosca (ex: café solúvel). Ferver vidro e tampa por 15 minutos cronometrados. Secar de boca para baixo em pano limpo sem secar por dentro.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-1">Higiene & Paramentação:</h4>
            <p>Prender os cabelos com touca ou lenço, usar máscara facial limpa, lavar mãos e antebraços até o cotovelo com água e sabão. Lavar as mamas apenas com água.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-1">Armazenamento:</h4>
            <p>Deixar espaço de 2 cm (dois dedos) até a tampa para expansão no congelamento. Congelar imediatamente no freezer doméstico (até 15 dias de validade).</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-1">Identificação:</h4>
            <p>Rotular o frasco com fita adesiva contendo nome da mãe, data e hora da primeira coleta.</p>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex items-center gap-2 text-slate-900 font-black text-base">
          <UserCheck className="w-5 h-5 text-sky-700" />
          <h3>4. Guia para a Equipe de Enfermagem do BLH</h3>
        </div>
        <p className="mt-2 text-xs sm:text-sm text-slate-700">
          A enfermagem atua na sub-aba <strong>CRM Doadoras</strong> do Painel Hospitalar. Suas atribuições incluem checagem de documentos e validação das 5 sorologias obrigatórias (HIV, VDRL, HBsAg, Anti-HCV e HTLV). A validação registra automaticamente o COREN e carimbo no prontuário eletrônico.
        </p>
      </section>

      {/* Section 5 */}
      <section className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex items-center gap-2 text-slate-900 font-black text-base">
          <Stethoscope className="w-5 h-5 text-rose-700" />
          <h3>5. Guia para o Corpo Médico (Pediatria & Neonatologia)</h3>
        </div>
        <p className="mt-2 text-xs sm:text-sm text-slate-700">
          O médico avalia casos pendentes de liberação clínica e emite o parecer (Aprovada ou Rejeitada com justificativa). O sistema emite a <strong>Ficha Clínica Oficial ANVISA em PDF</strong>, com dados completos e assinatura digitalizada para o prontuário da UTIN.
        </p>
      </section>

      {/* Section 6 */}
      <section className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex items-center gap-2 text-slate-900 font-black text-base">
          <Truck className="w-5 h-5 text-emerald-700" />
          <h3>6. Guia para Coletadores e Motoristas de Van</h3>
        </div>
        <p className="mt-2 text-xs sm:text-sm text-slate-700">
          O módulo mobile <strong>Rota da Van</strong> possui suporte offline (PWA). O motorista acessa sua rota com matrícula e PIN, pode ligar para a mãe com 1 clique, abrir a navegação GPS (Waze/Maps) e dar baixa na coleta registrando o volume em mL, número de frascos e a temperatura aferida na caixa isotérmica (ex: -12°C).
        </p>
      </section>

      {/* Section 7 */}
      <section className="p-5 rounded-2xl border border-rose-200 bg-rose-50/30">
        <div className="flex items-center gap-2 text-rose-950 font-black text-base">
          <span className="text-xl">⚠️</span>
          <h3>7. Alerta de Rotas Atrasadas & Auditoria ANVISA RDC 171/2006</h3>
        </div>
        <div className="mt-2 text-xs sm:text-sm space-y-2">
          <p>
            <strong>Horários Limite:</strong> Manhã (12:30) e Tarde (17:30). Se houver coletas pendentes após esses horários, o sistema dispara um alerta visual vermelho pulsante no painel administrativo para salvaguarda da cadeia de frio.
          </p>
          <p>
            <strong>Logs de Auditoria:</strong> Na sub-aba "Logs & Auditoria", cada ação é registrada de forma imutável com carimbo UTC e hash criptográfico SHA-256. É possível gerar o relatório oficial ANVISA em PDF e exportar planilhas CSV.
          </p>
        </div>
      </section>
    </div>
  );
};

const DevManualRendered: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  return (
    <div className="prose prose-slate max-w-none space-y-6 text-slate-800 text-sm leading-relaxed font-mono">
      {/* Dev Section 1 */}
      <section className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 font-sans">
        <div className="flex items-center gap-2 text-emerald-400 font-black text-base">
          <Server className="w-5 h-5 text-emerald-400" />
          <h3>1. Arquitetura do Sistema e Stack Tecnológica</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
          <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Frontend</span>
            <strong>React 19 + Vite 8</strong>
          </div>
          <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Linguagem</span>
            <strong>TypeScript 5.8 (Strict)</strong>
          </div>
          <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Backend</span>
            <strong>Express + Node.js (tsx)</strong>
          </div>
          <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Estilização</span>
            <strong>Tailwind CSS v4</strong>
          </div>
        </div>
      </section>

      {/* Dev Section 2 */}
      <section className="p-5 rounded-2xl border border-slate-200 bg-white font-sans shadow-2xs">
        <div className="flex items-center gap-2 text-slate-900 font-black text-base">
          <Layers className="w-5 h-5 text-sky-700" />
          <h3>2. Modelo de Dados e Interfaces TypeScript (`src/types/blh.ts`)</h3>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          O modelo tipado garante integridade de ponta a ponta. Principais contratos:
        </p>
        <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs overflow-x-auto mt-2">
{`interface Doadora {
  id: string;
  protocolo: string; // Ex: BLH-2026-0142
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  status: 'APTA' | 'EM_ANALISE' | 'INAPTA_TEMPORARIA' | 'INAPTA_DEFINITIVA';
  tipoLeite: 'COLOSTRO' | 'TRANSICAO' | 'MADURO';
  respostas: RespostasTriagem;
  comprovanteExames?: ComprovanteExames;
  parecerMedico?: ParecerMedico;
}`}
        </pre>
      </section>

      {/* Dev Section 3 */}
      <section className="p-5 rounded-2xl border border-slate-200 bg-white font-sans shadow-2xs">
        <div className="flex items-center gap-2 text-slate-900 font-black text-base">
          <Code className="w-5 h-5 text-indigo-700" />
          <h3>3. Endpoints da API REST (`server.ts`)</h3>
        </div>
        <div className="space-y-2 mt-3 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span><code>POST /api/auth/hospital-login</code></span>
            <span className="text-slate-500">Login médico/enfermagem/gestão</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span><code>GET /api/donors</code> & <code>POST /api/donors</code></span>
            <span className="text-slate-500">Listagem e cadastro de doadoras</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span><code>PATCH /api/donors/:id/medical-review</code></span>
            <span className="text-slate-500">Parecer médico oficial</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span><code>PATCH /api/donors/:id/validate-comprovante</code></span>
            <span className="text-slate-500">Validação técnica da enfermagem</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span><code>PATCH /api/appointments/:id/status</code></span>
            <span className="text-slate-500">Baixa da coleta da van com temperatura</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span><code>GET /api/logs</code> & <code>GET /api/logs/stats</code></span>
            <span className="text-slate-500">Rastreabilidade ANVISA e auditoria</span>
          </div>
        </div>
      </section>

      {/* Dev Section 4 */}
      <section className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 font-sans">
        <div className="flex items-center gap-2 text-emerald-950 font-black text-base">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <h3>4. Hashes Criptográficos SHA-256 e Rastreabilidade ANVISA</h3>
        </div>
        <p className="mt-2 text-xs text-slate-700">
          Cada evento gravado pelo helper <code>recordActivityLog()</code> gera um hash criptográfico imutável:
        </p>
        <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs overflow-x-auto mt-2">
{`function generateLogHash(logData: any): string {
  const content = \`\${logData.timestamp}|\${logData.tipo}|\${logData.categoria}|\${logData.usuario?.id}|\${logData.protocolo}|\${JSON.stringify(logData.dadosNovos)}\`;
  return crypto.createHash('sha256').update(content).digest('hex');
}`}
        </pre>
      </section>

      {/* Dev Section 5 */}
      <section className="p-5 rounded-2xl border border-sky-200 bg-sky-50/30 font-sans">
        <div className="flex items-center gap-2 text-sky-950 font-black text-base">
          <Truck className="w-5 h-5 text-sky-700" />
          <h3>5. Estratégia Offline-First do Coletador</h3>
        </div>
        <p className="mt-2 text-xs text-slate-700">
          O módulo mobile utiliza <code>localStorage</code> com a chave <code>mesm_blh_offline_queue</code> para armazenar requisições com falha de rede. Ao disparar o evento nativo <code>window.addEventListener('online')</code>, a sincronização é realizada automaticamente em background.
        </p>
      </section>

      {/* Dev Section 6 */}
      <section className="p-5 rounded-2xl border border-slate-200 bg-white font-sans shadow-2xs">
        <div className="flex items-center gap-2 text-slate-900 font-black text-base">
          <HelpCircle className="w-5 h-5 text-slate-700" />
          <h3>6. Comandos e Build</h3>
        </div>
        <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs overflow-x-auto mt-2">
{`# Desenvolvimento (dev server com tsx na porta 3000):
npm run dev

# Checagem de tipagem:
npm run lint

# Build de produção:
npm run build`}
        </pre>
      </section>
    </div>
  );
};

// SUTIN UNCISAL Component
const SutinRequisitionRendered: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  return (
    <div className="space-y-6 text-slate-800">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white">
            Ofício Oficial para SUTIN / UNCISAL
          </span>
          <h3 className="text-lg font-black text-indigo-950 mt-1">
            Levantamento de Requisitos de Infraestrutura, Servidor e Rede
          </h3>
          <p className="text-xs text-indigo-800 mt-0.5">
            Documento de solicitação formal para publicação do Sistema BLH na rede da UNCISAL
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-900 text-xs font-bold">
            RDC ANVISA 171/2006 & LGPD
          </span>
        </div>
      </div>

      {/* Section 1: Resumo do Ofício */}
      <section className="p-5 rounded-2xl border border-slate-200 bg-white">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-600" />
          1. Destinatário e Finalidade Institucional
        </h4>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-bold block">Destinatário:</span>
            <span className="font-bold text-slate-900">Superintendência de Tecnologia da Informação (SUTIN / UNCISAL)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-bold block">Setor Solicitante:</span>
            <span className="font-bold text-slate-900">Banco de Leite Humano — Maternidade Escola Santa Mônica (BLH / MESM)</span>
          </div>
        </div>
      </section>

      {/* Section 2: Arquitetura 2 VMs */}
      <section className="p-5 rounded-2xl border border-indigo-200 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-indigo-950 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            2. Arquitetura de Implantação em Duas Máquinas Virtuais (VMs)
          </h4>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
            Segmentação de Segurança & LGPD
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* VM 1 */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                VM 1: Aplicação Web & Proxy
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Portas 80 / 443</span>
            </div>
            <p className="text-slate-600">
              Hospeda a aplicação React + Node.js 22 LTS, PM2 e Nginx com Proxy Reverso e SSL.
            </p>
            <ul className="space-y-1 text-slate-700 pt-1 border-t border-indigo-100 font-mono text-[11px]">
              <li>• <b>vCPU:</b> 2 a 4 vCPUs</li>
              <li>• <b>RAM:</b> 4 GB (mínimo) a 8 GB</li>
              <li>• <b>Disco:</b> 60 GB a 80 GB SSD</li>
              <li>• <b>Rede:</b> Acesso HTTP/HTTPS público + Rede interna para VM 2</li>
            </ul>
          </div>

          {/* VM 2 */}
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 text-sm flex items-center gap-1.5">
                <Server className="w-4 h-4 text-purple-600" />
                VM 2: Banco de Dados PostgreSQL
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-200 text-purple-900 font-bold">Porta 5432 (Privada)</span>
            </div>
            <p className="text-slate-600">
              SGBD PostgreSQL 15/16 isolado, armazenando sorologias, termos de doação e logs de auditoria.
            </p>
            <ul className="space-y-1 text-purple-950 pt-1 border-t border-purple-100 font-mono text-[11px]">
              <li>• <b>SGBD:</b> PostgreSQL 15 ou 16</li>
              <li>• <b>vCPU:</b> 2 a 4 vCPUs | <b>RAM:</b> 4 GB a 8 GB</li>
              <li>• <b>Disco:</b> 80 GB a 120 GB SSD</li>
              <li>• <b>Firewall:</b> Sem IP público. Porta 5432 aberta APENAS para IP da VM 1</li>
            </ul>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 border border-slate-200">
          <b>Sistema Operacional Homologado para ambas as VMs:</b> Ubuntu Server 22.04 LTS / 24.04 LTS, Debian 12 ou Rocky Linux 9.
        </div>
      </section>

      {/* Section 3: Subdomínio, DNS e HTTPS */}
      <section className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            3. Subdomínio Institucional, DNS e Certificado Digital (HTTPS Obrigatório)
          </h4>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-mono">
            bancodeleite.uncisal.edu.br
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Subdomínio Oficial Solicitado à SUTIN:</span>
            <code className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded text-xs font-mono">
              bancodeleite.uncisal.edu.br
            </code>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            O endereço oficial garante a chancela acadêmica e hospitalar da UNCISAL/MESM, gerando imediata confiança para as nutrizes doadoras e equipes das maternidades parceiras.
          </p>
        </div>

        <ul className="space-y-2 text-xs text-slate-700">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><b>Registro DNS:</b> Entrada tipo <code>A</code> apontando <code>bancodeleite.uncisal.edu.br</code> para o IP público da <b>VM 1</b> (ou IP do Proxy Reverso / Firewall da SUTIN). TTL recomendado: <code>3600s</code>.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><b>Certificado SSL/TLS (HTTPS Porta 443 Mandatório):</b> Requisito impeditivo de infraestrutura. Necessário para:
              <ul className="mt-1 ml-4 list-disc space-y-0.5 text-slate-600">
                <li><b>PWA Offline & Service Worker:</b> O aplicativo dos motoristas/vans só ativa cache offline em conexões HTTPS válidas;</li>
                <li><b>Câmera e Geolocalização GPS:</b> Navegadores móveis exigem HTTPS para captura de foto da caderneta e rotas;</li>
                <li><b>LGPD Art. 11:</b> Criptografia de ponta a ponta para dados de saúde de lactantes e recém-nascidos.</li>
              </ul>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><b>Portas Externas na VM 1:</b> <code>80/TCP (HTTP)</code> (redirecionamento permanente 301 para HTTPS) e <code>443/TCP (HTTPS)</code>. Porta <code>22/TCP (SSH)</code> restrita à VPN da SUTIN.</span>
          </li>
        </ul>
      </section>

      {/* Section 4: Nginx Proxy Reverso */}
      <section className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Code className="w-4 h-4 text-slate-700" />
          4. Configuração Recomendada do Nginx Proxy Reverso (na VM 1)
        </h4>
        <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs overflow-x-auto">
{`# /etc/nginx/sites-available/blh-uncisal (na VM 1)
server {
    listen 80;
    server_name bancodeleite.uncisal.edu.br;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bancodeleite.uncisal.edu.br;
    ssl_certificate /etc/letsencrypt/live/bancodeleite.uncisal.edu.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bancodeleite.uncisal.edu.br/privkey.pem;

    client_max_body_size 15M; # Upload de fotos de cadernetas de pré-natal

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}
        </pre>
      </section>

      {/* Section 5: Banco de Dados PostgreSQL na VM 2 */}
      <section className="p-5 rounded-2xl border border-purple-200 bg-purple-50/30 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-purple-950 flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-700" />
            5. Especificações do Banco de Dados PostgreSQL 15/16 (VM 2)
          </h4>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-200 text-purple-900">
            Script DDL: /scripts/init_postgresql_blh.sql
          </span>
        </div>
        <p className="text-xs text-slate-700">
          O PostgreSQL 15/16 armazenará de forma segura e relacional todos os dados clínicos de doadoras, resultados sorológicos, agendamentos de vans e a trilha de auditoria ANVISA.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-purple-200 shadow-2xs space-y-1.5">
            <span className="font-bold text-slate-900 block text-xs">Configurações do Banco:</span>
            <ul className="text-slate-600 space-y-1 font-mono text-[11px]">
              <li>• Base: <code>blh_mesm_prod</code></li>
              <li>• Usuário: <code>blh_app</code></li>
              <li>• Encoding: <code>UTF8 / pt_BR.UTF-8</code></li>
              <li>• Extensões: <code>uuid-ossp</code>, <code>pgcrypto</code></li>
              <li>• Suporte nativo a <code>JSONB</code> ativo</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-purple-200 shadow-2xs space-y-1.5">
            <span className="font-bold text-slate-900 block text-xs">Segurança de Rede (pg_hba.conf):</span>
            <p className="text-slate-600">
              Conexão autorizada <b>unicamente para o IP privado da VM 1</b>:
            </p>
            <pre className="bg-slate-900 text-purple-300 p-2 rounded text-[10px] font-mono">
{`# /etc/postgresql/16/main/pg_hba.conf
host blh_mesm_prod blh_app <IP_VM1_APP>/32 scram-sha-256`}
            </pre>
            <p className="text-emerald-700 font-bold text-[11px]">
              ✓ Porta 5432 bloqueada para qualquer IP externo ou internet.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-purple-100/60 text-xs text-purple-950">
          <b>Script DDL incluso no sistema:</b> O arquivo <code>/scripts/init_postgresql_blh.sql</code> já contém as instruções de criação de todas as tabelas (<code>blh_donors</code>, <code>blh_donor_serology</code>, <code>blh_collection_routes</code>, <code>blh_chatbot_sessions</code>, <code>blh_audit_logs</code>), índices e chaves estrangeiras.
        </div>
      </section>

      {/* Section 6: Backup e Auditoria */}
      <section className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2">
        <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          6. Política de Backups e Conformidade Sanitária (ANVISA RDC 171/2006)
        </h4>
        <div className="text-xs text-amber-900 space-y-1">
          <p>• <b>Rotina Diária:</b> Snapshot / dump da base de dados e pasta <code>/app/data</code> diariamente às 02h00.</p>
          <p>• <b>Retenção:</b> 30 dias de snapshots diários e retenção mínima de 12 meses para cópias mensais consolidadas.</p>
          <p>• <b>Storage Secundário:</b> Cópia off-site no storage corporativo da UNCISAL para recuperação de desastres.</p>
        </div>
      </section>
    </div>
  );
};

// Rendered Component for Security & Vulnerability Audit
const SecurityAuditRendered: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  return (
    <div className="prose prose-slate max-w-none space-y-6 text-slate-800 text-sm leading-relaxed">
      {/* Header Banner - Status 100% Corrigido */}
      <div className="p-5 rounded-3xl bg-emerald-950 text-white border border-emerald-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Auditoria & Blindagem Concluída
            </span>
            <span className="text-xs text-emerald-300 font-mono font-bold">✅ 100% DAS VULNERABILIDADES CORRIGIDAS</span>
          </div>
          <h3 className="text-lg font-black text-white mt-1">
            Relatório de Correção & Mitigação de Vulnerabilidades
          </h3>
          <p className="text-xs text-emerald-200">
            Todas as vulnerabilidades identificadas no Frontend e Backend foram remediadas no código-fonte para o subdomínio <code>bancodeleite.uncisal.edu.br</code>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-900 border border-emerald-600 text-emerald-100 font-black text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            10/10 Remediadas no Código
          </span>
        </div>
      </div>

      {/* Matriz Resumo com Status de Correção */}
      <section className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          1. Quadro Consolidado de Vulnerabilidades & Status de Remediação
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-2.5">ID</th>
                <th className="p-2.5">Vulnerabilidade</th>
                <th className="p-2.5">Camada</th>
                <th className="p-2.5">Severidade</th>
                <th className="p-2.5">Status da Correção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-emerald-50/40">
                <td className="p-2.5 font-mono font-bold text-slate-900">VULN-01</td>
                <td className="p-2.5 font-semibold text-slate-900">Ausência de Autenticação/Autorização nas Rotas da API (BOLA)</td>
                <td className="p-2.5 text-slate-600">Backend</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-800">CRÍTICA</span></td>
                <td className="p-2.5"><span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">✅ CORRIGIDO (Middleware RBAC + Token HMAC)</span></td>
              </tr>
              <tr className="hover:bg-emerald-50/40">
                <td className="p-2.5 font-mono font-bold text-slate-900">VULN-02</td>
                <td className="p-2.5 font-semibold text-slate-900">Exposição de PINs e Credenciais via <code>/api/collectors</code></td>
                <td className="p-2.5 text-slate-600">Backend / Frontend</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-800">CRÍTICA</span></td>
                <td className="p-2.5"><span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">✅ CORRIGIDO (PIN removido da API; Login em <code>/auth/collector-login</code>)</span></td>
              </tr>
              <tr className="hover:bg-emerald-50/40">
                <td className="p-2.5 font-mono font-bold text-slate-900">VULN-03</td>
                <td className="p-2.5 font-semibold text-slate-900">Senhas Mestras Hardcoded e Bypass (<code>admin</code> e <code>1234</code>)</td>
                <td className="p-2.5 text-slate-600">Backend</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800">ALTA</span></td>
                <td className="p-2.5"><span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">✅ CORRIGIDO (Bypasses eliminados totalmente)</span></td>
              </tr>
              <tr className="hover:bg-emerald-50/40">
                <td className="p-2.5 font-mono font-bold text-slate-900">VULN-04</td>
                <td className="p-2.5 font-semibold text-slate-900">Senhas Armazenadas em Texto Puro</td>
                <td className="p-2.5 text-slate-600">Backend / Banco</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800">ALTA</span></td>
                <td className="p-2.5"><span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">✅ CORRIGIDO (Hash PBKDF2 + Salt 128-bit + timingSafeEqual)</span></td>
              </tr>
              <tr className="hover:bg-emerald-50/40">
                <td className="p-2.5 font-mono font-bold text-slate-900">VULN-05</td>
                <td className="p-2.5 font-semibold text-slate-900">Mass Assignment em <code>POST /api/donors</code> (Injeção de status)</td>
                <td className="p-2.5 text-slate-600">Backend</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800">ALTA</span></td>
                <td className="p-2.5"><span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">✅ CORRIGIDO (Whitelist estrita; Força status inicial <code>EM_ANALISE</code>)</span></td>
              </tr>
              <tr className="hover:bg-emerald-50/40">
                <td className="p-2.5 font-mono font-bold text-slate-900">VULN-06</td>
                <td className="p-2.5 font-semibold text-slate-900">Ausência de Rate Limiting nos Logins e Busca por Telefone</td>
                <td className="p-2.5 text-slate-600">Backend</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-sky-100 text-sky-800">MÉDIA</span></td>
                <td className="p-2.5"><span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">✅ CORRIGIDO (Rate Limiter em memória com Retry-After)</span></td>
              </tr>
              <tr className="hover:bg-emerald-50/40">
                <td className="p-2.5 font-mono font-bold text-slate-900">VULN-07</td>
                <td className="p-2.5 font-semibold text-slate-900">Ausência de Cabeçalhos HTTP de Segurança</td>
                <td className="p-2.5 text-slate-600">Backend / Nginx</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-sky-100 text-sky-800">MÉDIA</span></td>
                <td className="p-2.5"><span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">✅ CORRIGIDO (CSP, HSTS, nosniff, SAMEORIGIN, hide x-powered-by)</span></td>
              </tr>
              <tr className="hover:bg-emerald-50/40">
                <td className="p-2.5 font-mono font-bold text-slate-900">VULN-08</td>
                <td className="p-2.5 font-semibold text-slate-900">Exposição de Dados Pessoais em Consultas Públicas (LGPD)</td>
                <td className="p-2.5 text-slate-600">Backend / API</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-sky-100 text-sky-800">MÉDIA</span></td>
                <td className="p-2.5"><span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">✅ CORRIGIDO (Mascaramento de nomes e dados confidenciais)</span></td>
              </tr>
              <tr className="hover:bg-emerald-50/40">
                <td className="p-2.5 font-mono font-bold text-slate-900">VULN-09</td>
                <td className="p-2.5 font-semibold text-slate-900">Armazenamento Inseguro de Credenciais no Cliente</td>
                <td className="p-2.5 text-slate-600">Frontend</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-sky-100 text-sky-800">MÉDIA</span></td>
                <td className="p-2.5"><span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">✅ CORRIGIDO (Tokens em SessionStorage com expiração de turno)</span></td>
              </tr>
              <tr className="hover:bg-emerald-50/40">
                <td className="p-2.5 font-mono font-bold text-slate-900">VULN-10</td>
                <td className="p-2.5 font-semibold text-slate-900">Controle de Perfis Restrito ao Frontend</td>
                <td className="p-2.5 text-slate-600">Backend / API</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded font-bold text-[10px] bg-sky-100 text-sky-800">MÉDIA</span></td>
                <td className="p-2.5"><span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">✅ CORRIGIDO (Validação no servidor com 401/403 obrigatório)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Detalhamento das Correções Realizadas */}
      <section className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-4">
        <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          2. Detalhamento Técnico das Blindagens Implementadas
        </h4>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-1.5 shadow-2xs">
            <span className="font-bold text-emerald-950 block text-xs">
              Módulo de Segurança Criptográfica (/server/security.ts)
            </span>
            <p className="text-slate-700">
              Criado módulo nativo em TypeScript utilizando <code>crypto</code> do Node.js:
              <br />• <b>Função <code>hashPin(pin, salt)</code>:</b> Criptografia de senhas e PINs via derivação de chave PBKDF2 (10.000 iterações, SHA-256 e Salt pseudoaleatório criptográfico de 128 bits);
              <br />• <b>Função <code>verifyPin(input, stored)</code>:</b> Comparação em tempo constante via <code>crypto.timingSafeEqual</code> para proteção matemática contra Timing Attacks;
              <br />• <b>Emissão e Validação de Tokens HMAC-SHA256:</b> Tokens assinados digitalmente com chave secreta, tempo de expiração automático (12 horas - duração do plantão) e papéis clínicos (RBAC).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-1.5 shadow-2xs">
            <span className="font-bold text-emerald-950 block text-xs">
              Proteção de Rotas REST & Controle de Acesso Baseado em Papéis (RBAC)
            </span>
            <p className="text-slate-700">
              Aplicado o middleware <code>requireAuth(roles)</code> em todos os endpoints sensíveis:
              <br />• <code>GET /api/donors</code>: Restrito exclusivamente aos papéis <code>['MEDICO', 'ENFERMEIRO', 'GESTOR']</code>;
              <br />• <code>PATCH /api/donors/:id/medical-review</code>: Restrito a <code>['MEDICO', 'GESTOR']</code>;
              <br />• <code>PATCH /api/donors/:id/validate-comprovante</code>: Restrito a <code>['ENFERMEIRO', 'MEDICO', 'GESTOR']</code>;
              <br />• <code>GET /api/appointments</code> e <code>PATCH /api/appointments/:id/status</code>: Restrito a agentes autenticados de rota e coordenação <code>['COLETADOR', 'GESTOR', 'ENFERMEIRO']</code>;
              <br />• <code>GET /api/logs</code> e métricas: Restrito a <code>['GESTOR', 'MEDICO', 'ENFERMEIRO']</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-1.5 shadow-2xs">
            <span className="font-bold text-emerald-950 block text-xs">
              Eliminação de Bypasses e Exposição de PINs da Van
            </span>
            <p className="text-slate-700">
              • O endpoint <code>GET /api/collectors</code> foi sanitizado e não trafega mais os PINs ou hashes de nenhum motorista;
              <br />• Criado endpoint dedicado de autenticação <code>POST /api/auth/collector-login</code> que valida as credenciais unicamente no servidor;
              <br />• Removidas todas as senhas mestras hardcoded (<code>'admin'</code>, <code>'1234'</code> e matrículas).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-1.5 shadow-2xs">
            <span className="font-bold text-emerald-950 block text-xs">
              Proteção contra Mass Assignment & Minimização de Dados (LGPD)
            </span>
            <p className="text-slate-700">
              • Em <code>POST /api/donors</code>, é aplicada lista branca (whitelist) rígida que rejeita injeção de status ou parecer médico inicial;
              <br />• O status cadastral inicial é forçado a <code>'EM_ANALISE'</code>;
              <br />• O endpoint público <code>GET /api/donors/check-phone</code> e a consulta de protocolo <code>/api/protocols/:code</code> agora mascaram o nome das doadoras (ex: <i>Camila A. V.</i>) para cumprir o princípio da minimização da LGPD (Art. 6º, III).
            </p>
          </div>
        </div>
      </section>

      {/* Cabeçalhos HTTP e Rate Limiting */}
      <section className="p-5 rounded-2xl border border-sky-200 bg-sky-50/40 space-y-3">
        <h4 className="text-sm font-black text-sky-950 flex items-center gap-2">
          <Server className="w-4 h-4 text-sky-700" />
          3. Cabeçalhos HTTP de Segurança & Proteção contra Força Bruta
        </h4>
        <div className="text-xs text-sky-950 space-y-2">
          <p>
            • <b>Rate Limiting Ativo:</b> Limitador deslizante em memória bloqueia tentativas repetitivas de adivinhação de senhas com código HTTP <code>429 Too Many Requests</code> e header <code>Retry-After</code>;
          </p>
          <p>
            • <b>Cabeçalhos HTTP Injetados:</b> <code>X-Content-Type-Options: nosniff</code>, <code>X-Frame-Options: SAMEORIGIN</code>, <code>Content-Security-Policy</code> e <code>Strict-Transport-Security (HSTS)</code> ativos no Express;
          </p>
          <p>
            • <b>Ocultação de Fingerprint:</b> O cabeçalho <code>X-Powered-By: Express</code> foi desativado.
          </p>
        </div>
      </section>
    </div>
  );
};

// Raw text exports for markdown downloads
const USER_MANUAL_TEXT = `# MANUAL DO USUÁRIO
## Sistema de Triagem Clínica, Captação de Doadoras e Gestão de Rotas de Coleta
### Banco de Leite Humano (BLH) — Maternidade Escola Santa Mônica (MESM / UNCISAL)

Disponível na íntegra no repositório em: MANUAL_DO_USUARIO.md
Consulte o arquivo na raiz para a especificação completa de fluxos para Mães, Enfermagem, Médicos, Coletadores e Gestão Hospitalar.`;

const DEV_MANUAL_TEXT = `# MANUAL DO DESENVOLVEDOR
## Arquitetura, Engenharia de Software e Especificação Técnica
### Sistema do Banco de Leite Humano (BLH) — Maternidade Escola Santa Mônica (MESM / UNCISAL)

Disponível na íntegra no repositório em: MANUAL_DO_DESENVOLVEDOR.md
Consulte o arquivo na raiz para a especificação de APIs, Types, Hashes SHA-256 e Offline-First.`;

const SUTIN_REQUISITION_TEXT = `# SOLICITAÇÃO DE INFRAESTRUTURA DE TI E HOSPEDAGEM
## Superintendência de Tecnologia da Informação (SUTIN / UNCISAL)
### Sistema do Banco de Leite Humano — Maternidade Escola Santa Mônica (BLH / MESM)

---

**Para:** Superintendência de Tecnologia da Informação (SUTIN / UNCISAL)  
**De:** Coordenação do Banco de Leite Humano / Diretoria Médica da MESM  
**Assunto:** Requisitos de Infraestrutura, Servidor, Segurança e Domínio para Entrada em Produção do Sistema Web do BLH/MESM  
**Legislação de Referência:** ANVISA RDC nº 171/2006 (Boas Práticas em BLH), Lei Federal nº 13.709/2018 (LGPD) e Portaria MS nº 1.018/2005.

---

## 1. RESUMO EXECUTIVO DO PROJETO
O Sistema do Banco de Leite Humano da Maternidade Escola Santa Mônica é uma plataforma institucional desenvolvida para a UNCISAL para modernizar a triagem clínica de nutrizes, a validação de exames sorológicos (HIV, Sífilis, Hepatites e HTLV), a emissão de pareceres médicos pediátricos e o roteamento logístico das vans de coleta domiciliar em Maceió.

## 2. ARQUITETURA EM 2 MÁQUINAS VIRTUAIS (VMs)
- **VM 1 (Aplicação & Proxy Reverso Nginx):** Node.js 22 LTS, React 19, PM2, portas 80/443 públicas.
- **VM 2 (Banco de Dados PostgreSQL 15/16):** Instância isolada de SGBD na sub-rede interna da UNCISAL, sem acesso externo, porta 5432 restrita à VM 1.

## 3. DIMENSIONAMENTO DE RECURSOS
- **VM 1:** 2 a 4 vCPUs, 4 GB a 8 GB RAM, 60 GB SSD, Ubuntu 22.04/24.04 LTS.
- **VM 2:** 2 a 4 vCPUs, 4 GB a 8 GB RAM, 80 GB a 120 GB SSD, Ubuntu 22.04/24.04 LTS.

## 4. SUBDOMÍNIO INSTITUCIONAL E CERTIFICADO SSL/TLS
- **Subdomínio Oficial (FQDN):** bancodeleite.uncisal.edu.br
- **Tipo de Registro DNS:** Registro 'A' apontando para o IP público da VM 1 / Proxy Reverso SUTIN (TTL 3600s).
- **Certificado Digital SSL/TLS:** Mandatório (HTTPS porta 443) emitido via CA RNP/ICPEdu ou Let's Encrypt (Certbot).
  * Obrigatório para funcionamento do PWA Offline (Service Worker da van de coleta em Maceió);
  * Obrigatório para captura de câmera e geolocalização GPS de rota;
  * Cumprimento da LGPD Art. 11 (Criptografia de dados de saúde).

## 5. REQUISITOS DO POSTGRESQL (VM 2)
- Banco: blh_mesm_prod | Usuário: blh_app | Encoding: UTF8
- Extensões: uuid-ossp, pgcrypto, suporte nativo JSONB
- Regra pg_hba.conf: liberação exclusiva para o IP da VM 1
- Script DDL incluso no repositório: /scripts/init_postgresql_blh.sql

## 6. BACKUP E AUDITORIA (ANVISA RDC 171/2006)
- Dump diário automatizado pg_dump às 02h00 com retenção de 30 dias diários e 12 meses mensais em storage secundário da UNCISAL.

---
Documento na íntegra arquivado no repositório em: /SOLICITACAO_INFRAESTRUTURA_SUTIN_UNCISAL.md`;

const SECURITY_AUDIT_TEXT = `# RELATÓRIO DE MITIGAÇÃO & BLINDAGEM DE VULNERABILIDADES
## Sistema de Gestão do Banco de Leite Humano (BLH / MESM — UNCISAL)
### Status: 100% DAS VULNERABILIDADES IDENTIFICADAS FORAM REMEDIADAS NO CÓDIGO-FONTE

---

**Classificação:** Restrito / Tecnologia da Informação  
**Instituição:** Universidade Estadual de Ciências da Saúde de Alagoas (UNCISAL) / Maternidade Escola Santa Mônica (MESM)  
**Status de Homologação:** APROVADO PARA PRODUÇÃO EM bancodeleite.uncisal.edu.br  
**Conformidade:** OWASP Top 10, LGPD (Lei 13.709/2018) e RDC ANVISA nº 171/2006.

---

## 1. QUADRO DE CORREÇÕES IMPLEMENTADAS

- ✅ VULN-01 [CORRIGIDO]: Middleware 'requireAuth' com tokens HMAC-SHA256 e RBAC para Médicos, Enfermeiros e Gestores.
- ✅ VULN-02 [CORRIGIDO]: PINs removidos do endpoint '/api/collectors'; Autenticação isolada no backend via '/api/auth/collector-login'.
- ✅ VULN-03 [CORRIGIDO]: Senhas mestras 'admin', '1234' e matrículas como credenciais totalmente eliminadas.
- ✅ VULN-04 [CORRIGIDO]: Criptografia PBKDF2 com Salt de 128 bits e comparação em tempo constante 'timingSafeEqual'.
- ✅ VULN-05 [CORRIGIDO]: Whitelist rígida contra Mass Assignment em 'POST /api/donors' com status forçado a 'EM_ANALISE'.
- ✅ VULN-06 [CORRIGIDO]: Rate Limiting ativo em memória contra ataques de força bruta com código 429 e Retry-After.
- ✅ VULN-07 [CORRIGIDO]: Cabeçalhos HTTP de segurança injetados (CSP, HSTS, nosniff, SAMEORIGIN, hide x-powered-by).
- ✅ VULN-08 [CORRIGIDO]: Minimização de dados pessoais (LGPD) e mascaramento de nomes em consultas públicas.
- ✅ VULN-09 [CORRIGIDO]: Tokens armazenados em SessionStorage com expiração de turno de 12h.
- ✅ VULN-10 [CORRIGIDO]: Controle de acesso restrito no servidor garantindo bloqueio HTTP 401/403.

Consulte o documento completo em: /ANALISE_DE_VULNERABILIDADES.md`;

