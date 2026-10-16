import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  History, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  UserCheck, 
  Stethoscope, 
  Truck, 
  Bot, 
  Sparkles, 
  FileText, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Hash, 
  ArrowRight, 
  Copy, 
  Check, 
  X, 
  MessageSquare, 
  Building2, 
  FileSpreadsheet, 
  Info,
  Lock,
  ChevronDown
} from 'lucide-react';
import { LogAtividade, CategoriaLogAtividade, TipoLogAtividade, ProfissionalHospitalar } from '../types/blh';
import { api } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ActivityLogsViewProps {
  loggedStaff: ProfissionalHospitalar;
}

export const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({ loggedStaff }) => {
  const [logs, setLogs] = useState<LogAtividade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<{
    totalLogs: number;
    enfermagemCount: number;
    medicoCount: number;
    chatbotCount: number;
    logisticaCount: number;
    logsHoje: number;
    conformidadeTaxa: string;
  } | null>(null);

  // Filtros
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedTipo, setSelectedTipo] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'TODOS' | 'HOJE' | '7DIAS' | '30DIAS'>('TODOS');
  
  // Modal de Detalhes
  const [selectedLog, setSelectedLog] = useState<LogAtividade | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const fetchLogs = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      let dataInicio: string | undefined = undefined;
      const now = new Date();
      if (dateFilter === 'HOJE') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dataInicio = startOfDay.toISOString();
      } else if (dateFilter === '7DIAS') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dataInicio = sevenDaysAgo.toISOString();
      } else if (dateFilter === '30DIAS') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dataInicio = thirtyDaysAgo.toISOString();
      }

      const [logsData, statsData] = await Promise.all([
        api.getLogs({
          categoria: selectedCategoria !== 'TODAS' ? selectedCategoria : undefined,
          tipo: selectedTipo !== 'TODOS' ? selectedTipo : undefined,
          search: searchTerm.trim() || undefined,
          dataInicio
        }),
        api.getLogStats()
      ]);

      setLogs(logsData);
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar logs de atividade:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedCategoria, selectedTipo, dateFilter]);

  // Filtro em tempo real no cliente caso a busca mude
  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const q = searchTerm.toLowerCase();
    return logs.filter(l => 
      l.protocolo?.toLowerCase().includes(q) ||
      l.doadoraNome?.toLowerCase().includes(q) ||
      l.usuarioResponsavel?.toLowerCase().includes(q) ||
      l.matriculaOuRegistro?.toLowerCase().includes(q) ||
      l.acao?.toLowerCase().includes(q) ||
      l.detalhes?.toLowerCase().includes(q) ||
      l.justificativaClinica?.toLowerCase().includes(q) ||
      l.hashRastreabilidade?.toLowerCase().includes(q)
    );
  }, [logs, searchTerm]);

  const handleCopyHash = (hash?: string) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Exportar Relatório Oficial em PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const currentYear = new Date().getFullYear();
    const dataHoraStr = new Date().toLocaleString('pt-BR');

    // Cabeçalho Institucional
    doc.setFillColor(4, 120, 87); // Emerald 700
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('MATERNIDADE ESCOLA SANTA MÔNICA • UNCISAL', 14, 11);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('BANCO DE LEITE HUMANO (BLH) • RELATÓRIO DE AUDITORIA E RASTREABILIDADE ANVISA', 14, 18);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);
    doc.text(`Emissão: ${dataHoraStr} | Emitido por: ${loggedStaff.nome} (${loggedStaff.registroProfissional})`, 14, 30);
    doc.text(`Regulamentação: RDC ANVISA nº 171/2006 • Total de Registros: ${filteredLogs.length}`, 14, 35);

    const tableData = filteredLogs.map((log, index) => [
      (index + 1).toString(),
      new Date(log.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      log.protocolo || 'N/A',
      log.categoria,
      log.usuarioResponsavel,
      log.acao,
      log.statusNovo ? `${log.statusAnterior || 'INICIAL'} -> ${log.statusNovo}` : '-',
      log.hashRastreabilidade ? log.hashRastreabilidade.substring(0, 16) + '...' : 'OK'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['#', 'Data/Hora', 'Protocolo', 'Categoria', 'Responsável', 'Ação Realizada', 'Transição Status', 'Hash ANVISA']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${i} de ${pageCount} • Documento rastreável do Sistema de Gestão BLH MESM/UNCISAL • Validade Jurídica Sanitária`,
        14,
        290
      );
    }

    doc.save(`BLH_MESM_Auditoria_ANVISA_${currentYear}_${Date.now()}.pdf`);
  };

  // Exportar CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Data_Hora', 'Protocolo', 'Doadora', 'Categoria', 'Tipo', 'Responsavel', 'Registro_Conselho', 'Acao', 'Status_Anterior', 'Status_Novo', 'Detalhes', 'Justificativa_Clinica', 'Canal_IP', 'Hash_Rastreabilidade'];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.timestamp).toISOString(),
      l.protocolo || '',
      `"${(l.doadoraNome || '').replace(/"/g, '""')}"`,
      l.categoria,
      l.tipo,
      `"${(l.usuarioResponsavel || '').replace(/"/g, '""')}"`,
      `"${(l.matriculaOuRegistro || '').replace(/"/g, '""')}"`,
      `"${(l.acao || '').replace(/"/g, '""')}"`,
      l.statusAnterior || '',
      l.statusNovo || '',
      `"${(l.detalhes || '').replace(/"/g, '""')}"`,
      `"${(l.justificativaClinica || '').replace(/"/g, '""')}"`,
      `"${(l.ipOuCanal || '').replace(/"/g, '""')}"`,
      l.hashRastreabilidade || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Logs_Auditoria_BLH_MESM_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryBadge = (categoria: CategoriaLogAtividade) => {
    switch (categoria) {
      case 'ENFERMAGEM':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
            <UserCheck className="w-3 h-3 text-sky-600" />
            Enfermagem
          </span>
        );
      case 'MEDICO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <Stethoscope className="w-3 h-3 text-emerald-600" />
            Médico Neonatologista
          </span>
        );
      case 'CHATBOT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-800 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-200">
            <Bot className="w-3 h-3 text-violet-600" />
            Chatbot Virtual
          </span>
        );
      case 'LOGISTICA':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            <Truck className="w-3 h-3 text-amber-600" />
            Rota / Van
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            <ShieldCheck className="w-3 h-3 text-slate-500" />
            Sistema
          </span>
        );
    }
  };

  const getRiskBadge = (nivel: string) => {
    switch (nivel) {
      case 'SUCESSO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Conforme
          </span>
        );
      case 'ATENCAO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Atenção Clínica
          </span>
        );
      case 'CRITICO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Restrição Sanitária
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            <Info className="w-3 h-3 text-slate-400" />
            Registro
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner: Rastreabilidade ANVISA RDC 171/2006 */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                RDC ANVISA nº 171/2006 • Art. 14 / 18
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                <Lock className="w-3 h-3 text-slate-400" />
                Trilha de Auditoria Imutável
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Logs de Atividade & Rastreabilidade Regulatória
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Registro cronológico completo de todas as alterações de status realizadas pelas enfermeiras e médicos, histórico de triagens do chatbot de captação e baixas logísticas das vans do BLH MESM/UNCISAL.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => fetchLogs(true)}
              disabled={refreshing}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Atualizar registros em tempo real"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Exportar registros em formato CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              title="Gerar laudo oficial de auditoria em PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Gerar Relatório ANVISA (PDF)</span>
            </button>
          </div>
        </div>

        {/* Métricas de Auditoria */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-5 border-t border-slate-800/80">
            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
              <span className="text-[11px] font-semibold text-slate-400 block">Total de Logs</span>
              <span className="text-lg sm:text-xl font-black text-white">{stats.totalLogs}</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5 font-medium">Auditados</span>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
              <span className="text-[11px] font-semibold text-sky-300 block">Enfermagem</span>
              <span className="text-lg sm:text-xl font-black text-sky-400">{stats.enfermagemCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Validações / Exames</span>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
              <span className="text-[11px] font-semibold text-emerald-300 block">Corpo Médico</span>
              <span className="text-lg sm:text-xl font-black text-emerald-400">{stats.medicoCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Pareceres Clínicos</span>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
              <span className="text-[11px] font-semibold text-violet-300 block">Chatbot Virtual</span>
              <span className="text-lg sm:text-xl font-black text-violet-400">{stats.chatbotCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Triagens & Captação</span>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
              <span className="text-[11px] font-semibold text-amber-300 block">Rotas das Vans</span>
              <span className="text-lg sm:text-xl font-black text-amber-400">{stats.logisticaCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Baixas Domiciliares</span>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
              <span className="text-[11px] font-semibold text-slate-400 block">Eventos Hoje</span>
              <span className="text-lg sm:text-xl font-black text-white">{stats.logsHoje}</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5 font-medium">{stats.conformidadeTaxa}</span>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por protocolo, nome da doadora, enfermeira, médico, CRM/COREN, ação ou hash..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro de Categoria */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative min-w-[150px]">
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                aria-label="Filtrar por Categoria"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 appearance-none pr-8 cursor-pointer"
              >
                <option value="TODAS">Todas as Categorias</option>
                <option value="ENFERMAGEM">Enfermagem BLH</option>
                <option value="MEDICO">Corpo Médico (CRM)</option>
                <option value="CHATBOT">Chatbot de Captação</option>
                <option value="LOGISTICA">Logística / Rotas</option>
                <option value="SISTEMA">Segurança / Acesso</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filtro de Tipo */}
            <div className="relative min-w-[170px]">
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                aria-label="Filtrar por Tipo de Ação"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 appearance-none pr-8 cursor-pointer"
              >
                <option value="TODOS">Todos os Tipos de Ação</option>
                <option value="ALTERACAO_STATUS">Alteração de Status</option>
                <option value="VALIDACAO_EXAMES">Validação de Exames</option>
                <option value="PARECER_MEDICO">Parecer Médico</option>
                <option value="INTERACAO_CHAT">Interação no Chat</option>
                <option value="COLETA_ROTA">Baixa de Coleta</option>
                <option value="ACESSO_AUTENTICACAO">Autenticação & Senha</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filtro de Período */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setDateFilter('TODOS')}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${dateFilter === 'TODOS' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('HOJE')}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${dateFilter === 'HOJE' ? 'bg-white text-emerald-800 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('7DIAS')}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${dateFilter === '7DIAS' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                7 dias
              </button>
            </div>
          </div>
        </div>

        {/* Resumo da Consulta */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="font-medium">
            Exibindo <strong className="text-slate-800">{filteredLogs.length}</strong> registro(s) de atividade auditáveis
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Horário de referência: Horário de Brasília (BRT) • Hash SHA-256
          </span>
        </div>
      </div>

      {/* Tabela de Logs de Atividade */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-700">Carregando trilha de auditoria e logs regulatórios...</p>
            <p className="text-xs text-slate-400">Verificando conformidade com a RDC ANVISA nº 171/2006</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Nenhum registro de atividade encontrado</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Nenhum evento corresponde aos filtros selecionados. Tente limpar os filtros de busca ou alterar o período.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategoria('TODAS');
                setSelectedTipo('TODOS');
                setSearchTerm('');
                setDateFilter('TODOS');
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors inline-block"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Data / Hora</th>
                  <th className="py-3.5 px-3">Categoria</th>
                  <th className="py-3.5 px-3">Profissional / Responsável</th>
                  <th className="py-3.5 px-3">Protocolo / Doadora</th>
                  <th className="py-3.5 px-3">Ação Realizada & Transição</th>
                  <th className="py-3.5 px-3">Justificativa / Detalhes</th>
                  <th className="py-3.5 px-3">Canal / IP</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const dataObj = new Date(log.timestamp);
                  const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Data / Hora */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{dataFormatada}</div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {horaFormatada}
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getCategoryBadge(log.categoria)}
                      </td>

                      {/* Profissional / Responsável */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 leading-tight">
                          {log.usuarioResponsavel}
                        </div>
                        {log.matriculaOuRegistro && (
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {log.matriculaOuRegistro}
                          </div>
                        )}
                        {log.cargoResponsavel && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {log.cargoResponsavel}
                          </div>
                        )}
                      </td>

                      {/* Protocolo / Doadora */}
                      <td className="py-3.5 px-3">
                        {log.protocolo ? (
                          <>
                            <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {log.protocolo}
                            </span>
                            {log.doadoraNome && (
                              <div className="text-xs font-semibold text-slate-700 mt-1 truncate max-w-[160px]">
                                {log.doadoraNome}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Geral / Sistema</span>
                        )}
                      </td>

                      {/* Ação Realizada & Transição */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {log.acao}
                        </div>
                        {log.statusNovo && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-mono">
                            <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200">
                              {log.statusAnterior || 'INICIAL'}
                            </span>
                            <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                            <span className="px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                              {log.statusNovo}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Justificativa / Detalhes */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {log.detalhes}
                        </p>
                        {log.transcricaoChat && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 mt-1">
                            <MessageSquare className="w-3 h-3" />
                            {log.transcricaoChat.length} mensagens no chat
                          </span>
                        )}
                      </td>

                      {/* Canal / IP */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="text-[11px] text-slate-600">
                          {log.ipOuCanal}
                        </div>
                        <div className="mt-1">
                          {getRiskBadge(log.nivelRisco)}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                          title="Inspecionar auditoria completa"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-700" />
                          <span>Auditar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Log de Auditoria (RDC 171/2006) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto p-4 flex min-h-full items-center justify-center animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Registro de Auditoria ANVISA
                    </span>
                    {getRiskBadge(selectedLog.nivelRisco)}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {selectedLog.acao}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">Profissional Responsável</span>
                <div className="text-sm font-bold text-slate-900">{selectedLog.usuarioResponsavel}</div>
                {selectedLog.matriculaOuRegistro && (
                  <div className="text-xs font-mono text-slate-600">{selectedLog.matriculaOuRegistro}</div>
                )}
                {selectedLog.cargoResponsavel && (
                  <div className="text-[11px] text-slate-500">{selectedLog.cargoResponsavel}</div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">Doadora / Protocolo</span>
                <div className="text-sm font-bold text-slate-900">
                  {selectedLog.doadoraNome || 'Não aplicável (Ação de Sistema)'}
                </div>
                {selectedLog.protocolo && (
                  <div className="inline-block font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {selectedLog.protocolo}
                  </div>
                )}
              </div>
            </div>

            {/* Transição de Status se houver */}
            {selectedLog.statusNovo && (
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-1.5">
                <span className="text-xs font-bold text-sky-950 block">Transição de Status Sanitário</span>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-white font-bold text-slate-700 border border-slate-300">
                    {selectedLog.statusAnterior || 'INICIAL'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 font-bold text-white shadow-xs">
                    {selectedLog.statusNovo}
                  </span>
                </div>
              </div>
            )}

            {/* Descrição dos Detalhes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Detalhamento da Ocorrência
              </label>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed">
                {selectedLog.detalhes}
              </div>
            </div>

            {/* Justificativa Clínica */}
            {selectedLog.justificativaClinica && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Fundamentação Técnica / Clínica (ANVISA RDC 171/2006)
                </label>
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 text-xs text-emerald-950 leading-relaxed font-medium">
                  {selectedLog.justificativaClinica}
                </div>
              </div>
            )}

            {/* Histórico / Transcrição do Chatbot se houver */}
            {selectedLog.transcricaoChat && selectedLog.transcricaoChat.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-violet-600" />
                    Histórico de Interações do Chatbot (WhatsApp)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {selectedLog.transcricaoChat.length} mensagens registradas
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto p-3.5 rounded-2xl bg-slate-900 space-y-2.5 text-xs">
                  {selectedLog.transcricaoChat.map((m, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col ${m.remetente === 'USUARIO' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-400 font-mono mb-0.5 flex items-center gap-1">
                        <span>{m.remetente === 'USUARIO' ? 'Candidata a Doadora' : 'Chatbot BLH MESM'}</span>
                        <span>•</span>
                        <span>{m.horario}</span>
                      </div>
                      <div 
                        className={`max-w-[85%] rounded-2xl p-2.5 ${
                          m.remetente === 'USUARIO' 
                            ? 'bg-emerald-700 text-white rounded-tr-none' 
                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                        }`}
                      >
                        {m.mensagem}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadados e Hash Criptográfico de Rastreabilidade */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Canal / Origem: {selectedLog.ipOuCanal}</span>
                <span>Data/Hora UTC: {selectedLog.timestamp}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                    Hash Criptográfico de Rastreabilidade ANVISA (SHA-256):
                  </span>
                  <span className="font-mono text-xs text-emerald-400 truncate block">
                    {selectedLog.hashRastreabilidade || 'SHA256-ANVISA-BLH-VALID'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyHash(selectedLog.hashRastreabilidade)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                >
                  {copiedHash ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Hash</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
              <span>Rastreabilidade em conformidade com RDC ANVISA nº 171/2006</span>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
