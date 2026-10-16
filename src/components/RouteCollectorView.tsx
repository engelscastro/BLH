import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Navigation, 
  CheckCircle, 
  Snowflake, 
  Package, 
  Search, 
  ShieldCheck, 
  LogOut,
  Clock,
  Droplets,
  AlertCircle,
  Filter,
  Layers,
  MessageCircle,
  ChevronRight,
  Printer,
  Sparkles,
  Building2,
  RefreshCw,
  Wifi,
  WifiOff,
  CloudCheck,
  HardDrive,
  DownloadCloud,
  Check,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { AgendamentoColeta, Coletador, RegiaoLogistica } from '../types/blh';
import { api } from '../services/api';
import { BAIRROS_MACEIO, getNomeRegiao } from '../utils/maceioNeighborhoods';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const RouteCollectorView: React.FC = () => {
  // Status de Conexão e Cache do Service Worker
  const isOnline = useOnlineStatus();
  const [cacheTimestamp, setCacheTimestamp] = useState<string>(() => {
    try {
      const ts = localStorage.getItem('mesm_blh_cache_timestamp');
      return ts ? new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
    } catch {
      return '';
    }
  });
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => {
    try {
      const q = localStorage.getItem('mesm_blh_offline_queue');
      return q ? JSON.parse(q).length : 0;
    } catch {
      return 0;
    }
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [cacheSyncMsg, setCacheSyncMsg] = useState<string>('');

  // Autenticação do Coletador
  const [loggedCollector, setLoggedCollector] = useState<Coletador | null>(null);
  const [matriculaInput, setMatriculaInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Modal de Troca de Senha / PIN da Van
  const [showChangePinModal, setShowChangePinModal] = useState<boolean>(false);
  const [changePinMatricula, setChangePinMatricula] = useState<string>('');
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [showNewPin, setShowNewPin] = useState<boolean>(false);
  const [changePinLoading, setChangePinLoading] = useState<boolean>(false);
  const [changePinError, setChangePinError] = useState<string>('');
  const [changePinSuccess, setChangePinSuccess] = useState<string>('');

  const openChangePinModal = (defaultMat?: string) => {
    setChangePinMatricula(defaultMat || loggedCollector?.matricula || matriculaInput || '48291-0');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setChangePinError('');
    setChangePinSuccess('');
    setShowChangePinModal(true);
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError('');
    setChangePinSuccess('');

    if (newPinInput.trim().length < 4) {
      setChangePinError('O novo PIN da van deve conter no mínimo 4 dígitos ou caracteres.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setChangePinError('A confirmação não confere com o novo PIN digitado.');
      return;
    }

    setChangePinLoading(true);
    try {
      const res = await api.collectorChangePin(
        changePinMatricula.trim(),
        currentPinInput.trim(),
        newPinInput.trim()
      );
      setChangePinSuccess(res.message || 'PIN da van alterado com sucesso!');
      if (loggedCollector) {
        setLoggedCollector({
          ...loggedCollector,
          pin: newPinInput.trim()
        });
      }
      setTimeout(() => {
        setShowChangePinModal(false);
        setChangePinSuccess('');
      }, 2000);
    } catch (err: any) {
      setChangePinError(err.message || 'Erro ao alterar PIN. Verifique o PIN atual informado.');
    } finally {
      setChangePinLoading(false);
    }
  };

  // Lista de coletas do dia
  const [appointments, setAppointments] = useState<AgendamentoColeta[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchCode, setSearchCode] = useState<string>('');

  // Filtros de Rotas por Bairros (Maceió)
  const [selectedRegiao, setSelectedRegiao] = useState<string>('TODAS');
  const [selectedBairro, setSelectedBairro] = useState<string>('TODOS');
  const [selectedTurno, setSelectedTurno] = useState<string>('TODOS');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'PENDENTE' | 'COLETADO'>('TODOS');
  const [viewMode, setViewMode] = useState<'BAIRROS' | 'LISTA'>('BAIRROS');

  // Modal / Ação de Baixa de Coleta
  const [selectedAptForBaixa, setSelectedAptForBaixa] = useState<AgendamentoColeta | null>(null);
  const [frascosColetados, setFrascosColetados] = useState<number>(2);
  const [volumeMl, setVolumeMl] = useState<number>(400);
  const [frascosEntregues, setFrascosEntregues] = useState<number>(2);
  const [temperaturaTermica, setTemperaturaTermica] = useState<number>(-12);
  const [observacoesColeta, setObservacoesColeta] = useState<string>('Leite perfeitamente congelado. Vidros esterilizados entregues.');
  const [isSubmittingBaixa, setIsSubmittingBaixa] = useState<boolean>(false);
  const [sucessoMsg, setSucessoMsg] = useState<string>('');

  // Carrega coletas com suporte a cache local offline
  const carregarColetas = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const apts = await api.getAppointments();
      setAppointments(apts);
      const ts = localStorage.getItem('mesm_blh_cache_timestamp');
      if (ts) {
        setCacheTimestamp(new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
      if (forceRefresh) {
        setCacheSyncMsg('Rotas salvas em cache local para uso offline nas vans!');
        setTimeout(() => setCacheSyncMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarColetas();
  }, [loggedCollector]);

  // Sincronização de baixas pendentes quando a conexão retorna
  const handleSyncOfflineQueue = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncOfflineQueue();
      setOfflineQueueCount(res.remaining);
      if (res.synced > 0) {
        setSucessoMsg(`${res.synced} baixa(s) offline transmitida(s) à central hospitalar com sucesso!`);
        setTimeout(() => setSucessoMsg(''), 4000);
        await carregarColetas();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isOnline && offlineQueueCount > 0) {
      handleSyncOfflineQueue();
    }
  }, [isOnline]);

  // Login do coletador (com suporte offline via cache)
  const handleLogin = async (e?: React.FormEvent, customMatricula?: string, customPin?: string) => {
    if (e) e.preventDefault();
    setAuthError('');
    const mat = customMatricula || matriculaInput;
    const pin = customPin || pinInput;
    try {
      const collector = await api.collectorLogin(mat.trim(), pin.trim());
      setLoggedCollector(collector);
    } catch (err: any) {
      setAuthError(err.message || 'Matrícula UNCISAL ou PIN incorreto. Verifique suas credenciais.');
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    setLoggedCollector(null);
  };

  // Registrar baixa de coleta (online ou offline)
  const handleConfirmarBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAptForBaixa) return;
    setIsSubmittingBaixa(true);
    try {
      await api.updateAppointmentStatus(selectedAptForBaixa.id, {
        status: 'COLETADO',
        dadosColeta: {
          frascosColetados,
          volumeAproximadoMl: volumeMl,
          frascosEntregues,
          temperaturaTermicaC: temperaturaTermica,
          observacoes: observacoesColeta,
          coletadorMatricula: loggedCollector?.matricula || '48291-0'
        }
      });

      const q = localStorage.getItem('mesm_blh_offline_queue');
      const count = q ? JSON.parse(q).length : 0;
      setOfflineQueueCount(count);

      if (!isOnline) {
        setSucessoMsg(`Coleta ${selectedAptForBaixa.protocolo} salva no aparelho (Modo Offline). Será transmitida quando houver sinal.`);
      } else {
        setSucessoMsg(`Coleta ${selectedAptForBaixa.protocolo} baixada com sucesso!`);
      }

      setSelectedAptForBaixa(null);
      await carregarColetas();
      setTimeout(() => setSucessoMsg(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Erro ao dar baixa na coleta');
    } finally {
      setIsSubmittingBaixa(false);
    }
  };

  // Filtragem de coletas pela busca e filtros de bairros/setor de Maceió
  const filteredAppointments = appointments.filter((a) => {
    if (searchCode) {
      const q = searchCode.toLowerCase();
      const matchText = (
        a.protocolo.toLowerCase().includes(q) ||
        a.nomeDoadora.toLowerCase().includes(q) ||
        a.bairro.toLowerCase().includes(q) ||
        a.enderecoCompleto.toLowerCase().includes(q) ||
        a.telefone.includes(q)
      );
      if (!matchText) return false;
    }

    if (selectedRegiao !== 'TODAS' && a.regiaoLogistica !== selectedRegiao) {
      return false;
    }

    if (selectedBairro !== 'TODOS' && a.bairro.toLowerCase() !== selectedBairro.toLowerCase()) {
      return false;
    }

    if (selectedTurno !== 'TODOS' && a.turno !== selectedTurno) {
      return false;
    }

    if (statusFilter !== 'TODOS') {
      if (statusFilter === 'PENDENTE' && a.status === 'COLETADO') return false;
      if (statusFilter === 'COLETADO' && a.status !== 'COLETADO') return false;
    }

    return true;
  });

  // Agrupamento de coletas por bairro de Maceió
  const appointmentsByBairro = filteredAppointments.reduce((acc, apt) => {
    const bName = apt.bairro || 'Outros Bairros';
    if (!acc[bName]) {
      acc[bName] = {
        bairro: bName,
        regiao: apt.regiaoLogistica,
        coletas: []
      };
    }
    acc[bName].coletas.push(apt);
    return acc;
  }, {} as Record<string, { bairro: string; regiao: RegiaoLogistica; coletas: AgendamentoColeta[] }>);

  // Lista única de bairros presentes nas coletas
  const bairrosComColetas = Array.from(new Set(appointments.map(a => a.bairro))).sort();

  // Contagens por região
  const getCountByRegiao = (regiao: string) => {
    if (regiao === 'TODAS') return appointments.length;
    return appointments.filter(a => a.regiaoLogistica === regiao).length;
  };

  // Resumo de frascos previstos na rota filtrada
  const totalFrascosRecolher = filteredAppointments.reduce((acc, a) => acc + (a.quantidadeFrascosEstimada || 2), 0);
  const totalConcluidas = filteredAppointments.filter(a => a.status === 'COLETADO').length;

  // Modal de Trocar PIN do Coletador / Motorista
  const renderChangePinModal = () => {
    if (!showChangePinModal) return null;
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto p-4 flex min-h-full items-center justify-center animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-800 border border-sky-200/80 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-sky-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Trocar Senha / PIN da Van
                </h3>
                <p className="text-[11px] text-slate-500">
                  Módulo de Coleta em Domicílio • MESM / UNCISAL
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowChangePinModal(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {changePinSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{changePinSuccess}</span>
            </div>
          )}

          {changePinError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{changePinError}</span>
            </div>
          )}

          <form onSubmit={handleChangePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Matrícula UNCISAL do Coletador
              </label>
              <input
                type="text"
                required
                value={changePinMatricula}
                onChange={(e) => setChangePinMatricula(e.target.value)}
                placeholder="Ex: 48291-0"
                disabled={!!loggedCollector}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 font-mono text-xs text-slate-900 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIN Atual da Van
              </label>
              <input
                type="password"
                required
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value)}
                placeholder="PIN atual (padrão: 1234)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Novo PIN da Van
                </label>
                <span className="text-[10px] text-slate-400">Mínimo 4 dígitos</span>
              </div>
              <div className="relative">
                <input
                  type={showNewPin ? 'text' : 'password'}
                  required
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Digite o novo PIN"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmar Novo PIN da Van
              </label>
              <input
                type={showNewPin ? 'text' : 'password'}
                required
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value)}
                placeholder="Repita o novo PIN"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowChangePinModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={changePinLoading}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {changePinLoading ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Salvar Novo PIN</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Se não estiver logado, exibe tela de login com opções de 1 toque
  if (!loggedCollector) {
    return (
      <>
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <Truck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Acesso à Van de Coleta BLH
            </h2>
            <p className="text-xs text-slate-500">
              Módulo Mobile Ultraleve para Motoristas e Coletadores • MESM / UNCISAL
            </p>
            {!isOnline && (
              <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full text-[11px] font-bold mt-1">
                <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                <span>Modo Offline Ativo — Acesso liberado via cache do Service Worker</span>
              </div>
            )}
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Matrícula Institucional UNCISAL:
              </label>
              <input
                type="text"
                required
                value={matriculaInput}
                onChange={(e) => setMatriculaInput(e.target.value)}
                placeholder="Ex: 48291-0"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PIN / Senha Rápida da Van:
              </label>
              <input
                type="password"
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="1234"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Entrar na Rota da Van</span>
            </button>
          </form>

          {/* Botão de Trocar PIN no Login da Van */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => openChangePinModal(matriculaInput)}
              className="text-xs text-slate-500 hover:text-sky-700 font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-600" />
              <span>Trocar senha ou PIN da van</span>
            </button>
          </div>

          {/* Acesso Rápido de Demonstração com 1 Toque */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block text-center">
              Entrar com 1 toque (Credenciados):
            </span>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleLogin(undefined, '48291-0', '1234')}
                className="w-full py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-bold block">Carlos Eduardo Rocha</span>
                  <span className="text-[10px] text-sky-700">Van Fiat Ducato • Trapiche / Orla</span>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-600" />
              </button>

              <button
                type="button"
                onClick={() => handleLogin(undefined, '39102-4', '5678')}
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-bold block">Ana Patrícia Calheiros</span>
                  <span className="text-[10px] text-slate-600">Van Renault Master • Farol / Tabuleiro</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
        {renderChangePinModal()}
      </>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-16">
      {/* Header do Coletador */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm leading-tight truncate">{loggedCollector.nome}</h3>
            <span className="text-[11px] text-slate-300 block truncate">
              {loggedCollector.veiculo}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openChangePinModal()}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 shrink-0"
            title="Trocar PIN da van"
          >
            <KeyRound className="w-3.5 h-3.5 text-sky-400" />
            <span>Trocar Senha</span>
          </button>

          <button
            onClick={handleLogout}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Barra de Status de Cache (Service Worker) & Conectividade nas Vans */}
      <div className={`rounded-2xl p-3.5 border transition-all text-xs ${
        !isOnline 
          ? 'bg-amber-500/10 border-amber-300 text-amber-950 shadow-xs' 
          : 'bg-white border-slate-200/90 text-slate-700 shadow-2xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              !isOnline 
                ? 'bg-amber-500 text-white animate-pulse' 
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {!isOnline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs text-slate-900">
                  {!isOnline ? 'Modo Offline Ativo nas Vans' : 'Conectado à Central BLH'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  !isOnline 
                    ? 'bg-amber-200 text-amber-900 border border-amber-300' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {!isOnline ? 'Visualizando Rotas em Cache' : 'Cache SW Atualizado'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {cacheTimestamp 
                  ? `Última sincronização do cache da rota: hoje às ${cacheTimestamp}` 
                  : 'Rotas do dia disponíveis para consulta sem conexão'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => carregarColetas(true)}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              title="Atualizar e armazenar as rotas em cache local para uso offline"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar Cache</span>
            </button>
          </div>
        </div>

        {/* Notificação de Sincronização do Cache */}
        {cacheSyncMsg && (
          <div className="mt-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{cacheSyncMsg}</span>
          </div>
        )}

        {/* Alerta de Baixas Pendentes Realizadas Offline */}
        {offlineQueueCount > 0 && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-[11px] font-bold">
                {offlineQueueCount} baixa(s) de coleta salva(s) offline neste aparelho.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSyncOfflineQueue}
              disabled={isSyncing || !isOnline}
              className="px-3 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Transmitindo...</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>{!isOnline ? 'Aguardando Sinal...' : 'Transmitir à Central'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Alerta de Sucesso */}
      {sucessoMsg && (
        <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{sucessoMsg}</span>
        </div>
      )}

      {/* ============================================================= */}
      {/* PAINEL PRINCIPAL: ROTAS DA VAN POR BAIRROS (MACEIÓ) */}
      {/* ============================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-4">
        {/* Título Oficial e Alternador de Visão */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full mb-1">
              <Truck className="w-3.5 h-3.5 text-sky-600" />
              <span>Rotas da Van por Bairros (Maceió)</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Programação de Coletas por Setor e Bairro
            </h2>
            <p className="text-[11px] text-slate-500">
              Trajeto planejado para recolhimento de leite materno e entrega de vidros na capital alagoana.
            </p>
          </div>

          {/* Alternador de Modo de Exibição */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('BAIRROS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'BAIRROS'
                  ? 'bg-white text-sky-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Por Bairros</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LISTA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'LISTA'
                  ? 'bg-white text-sky-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Sequencial ({filteredAppointments.length})</span>
            </button>
          </div>
        </div>

        {/* 1. Chips de Setores Geográficos de Maceió */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Selecione o Setor da Van:
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => { setSelectedRegiao('TODAS'); setSelectedBairro('TODOS'); }}
              className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedRegiao === 'TODAS'
                  ? 'bg-sky-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Todos os Bairros</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedRegiao === 'TODAS' ? 'bg-sky-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {getCountByRegiao('TODAS')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedRegiao('ORLA_BAIXA'); setSelectedBairro('TODOS'); }}
              className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedRegiao === 'ORLA_BAIXA'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>🌊 Orla / Baixa</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedRegiao === 'ORLA_BAIXA' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {getCountByRegiao('ORLA_BAIXA')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedRegiao('FAROL_CENTRO'); setSelectedBairro('TODOS'); }}
              className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedRegiao === 'FAROL_CENTRO'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>🏛️ Farol / Centro</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedRegiao === 'FAROL_CENTRO' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {getCountByRegiao('FAROL_CENTRO')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedRegiao('TABULEIRO_ALTA'); setSelectedBairro('TODOS'); }}
              className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedRegiao === 'TABULEIRO_ALTA'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>⛰️ Tabuleiro / Alta</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedRegiao === 'TABULEIRO_ALTA' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {getCountByRegiao('TABULEIRO_ALTA')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedRegiao('LITORAL_SUL_TRAPICHE'); setSelectedBairro('TODOS'); }}
              className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedRegiao === 'LITORAL_SUL_TRAPICHE'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>🏥 Trapiche / MESM</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedRegiao === 'LITORAL_SUL_TRAPICHE' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {getCountByRegiao('LITORAL_SUL_TRAPICHE')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedRegiao('NORTE_JACARECICA'); setSelectedBairro('TODOS'); }}
              className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedRegiao === 'NORTE_JACARECICA'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>🌴 Norte / Jacarecica</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedRegiao === 'NORTE_JACARECICA' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {getCountByRegiao('NORTE_JACARECICA')}
              </span>
            </button>
          </div>
        </div>

        {/* 2. Filtros de Bairro Específico, Turno e Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
              Isolar Bairro de Maceió:
            </label>
            <select
              value={selectedBairro}
              onChange={(e) => setSelectedBairro(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-1 focus:ring-sky-500"
            >
              <option value="TODOS">Todos os Bairros com Coleta</option>
              {bairrosComColetas.map((bName) => {
                const count = appointments.filter(a => a.bairro.toLowerCase() === bName.toLowerCase()).length;
                return (
                  <option key={bName} value={bName}>
                    {bName} ({count} {count === 1 ? 'coleta' : 'coletas'})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
              Turno da Visita:
            </label>
            <select
              value={selectedTurno}
              onChange={(e) => setSelectedTurno(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-1 focus:ring-sky-500"
            >
              <option value="TODOS">Todos os Turnos (Manhã e Tarde)</option>
              <option value="MANHA">☀️ Manhã (08h às 12h)</option>
              <option value="TARDE">🌤️ Tarde (13h30 às 17h)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
              Status da Coleta:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-1 focus:ring-sky-500"
            >
              <option value="TODOS">Todas ({filteredAppointments.length})</option>
              <option value="PENDENTE">⏳ Apenas Pendentes</option>
              <option value="COLETADO">✅ Concluídas</option>
            </select>
          </div>
        </div>

        {/* 3. Resumo da Carga da Van no Trajeto Filtrado */}
        <div className="bg-sky-50/70 border border-sky-200/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-sky-800 uppercase block">Paradas da Rota</span>
              <span className="text-base font-black text-sky-950 font-mono">
                {filteredAppointments.length}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Leite a Recolher</span>
              <span className="text-base font-black text-emerald-900 font-mono flex items-center gap-1">
                <Snowflake className="w-3.5 h-3.5 text-sky-600" />
                ~{totalFrascosRecolher} frascos
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-700 uppercase block">Concluídas</span>
              <span className="text-base font-black text-slate-800 font-mono">
                {totalConcluidas}/{filteredAppointments.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => carregarColetas(true)}
            className="text-[11px] font-bold text-sky-800 hover:text-sky-950 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Rota
          </button>
        </div>
      </div>

      {/* Busca Rápida por Protocolo, Nome ou Rua */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Buscar doadora, rua ou protocolo (ex: BLH-2026...)"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white shadow-xs text-sm font-medium focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* ============================================================= */}
      {/* EXIBIÇÃO 1: AGRUPADA POR BAIRROS DE MACEIÓ */}
      {/* ============================================================= */}
      {viewMode === 'BAIRROS' && (
        <div className="space-y-4">
          {Object.keys(appointmentsByBairro).length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6 text-slate-500 text-sm">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Nenhuma coleta encontrada para este bairro ou setor selecionado.
            </div>
          ) : (
            Object.values(appointmentsByBairro).map((grupo) => {
              const pendentesGrupo = grupo.coletas.filter(c => c.status !== 'COLETADO').length;
              return (
                <div key={grupo.bairro} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Cabeçalho do Bairro */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                          Bairro {grupo.bairro}
                        </h3>
                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                          {getNomeRegiao(grupo.regiao)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        pendentesGrupo === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {pendentesGrupo === 0 ? '✓ Todas Coletadas' : `${pendentesGrupo} pendente(s)`}
                      </span>

                      {/* Abrir Trajeto do Bairro no Google Maps */}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${grupo.bairro}, Maceio - AL`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Ver trajeto do bairro no mapa"
                      >
                        <Navigation className="w-3 h-3 text-sky-600" />
                        <span className="hidden sm:inline">Mapa do Bairro</span>
                      </a>
                    </div>
                  </div>

                  {/* Lista de Doadoras no Bairro */}
                  <div className="p-3 sm:p-4 space-y-3 divide-y divide-slate-100">
                    {grupo.coletas.map((apt, idx) => {
                      const isColetado = apt.status === 'COLETADO';
                      return (
                        <div key={apt.id} className={`pt-3 first:pt-0 space-y-2.5 ${isColetado ? 'opacity-85' : ''}`}>
                          {/* Topo do Card da Parada */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                                  #{idx + 1}
                                </span>
                                <span className="font-mono text-xs font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                  {apt.protocolo}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {apt.turno === 'MANHA' ? '☀️ Manhã' : '🌤️ Tarde'}
                                </span>
                              </div>
                              <h4 className="font-black text-slate-900 text-sm mt-0.5">
                                {apt.nomeDoadora}
                              </h4>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                isColetado
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {isColetado ? '✓ Coletado' : 'Pendente'}
                            </span>
                          </div>

                          {/* Endereço Detalhado */}
                          <div className="text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                            <div className="font-semibold text-slate-900 flex items-start gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                              <span>{apt.enderecoCompleto}</span>
                            </div>
                            {apt.pontoReferencia && (
                              <div className="text-[11px] text-slate-600 pl-5">
                                <strong>Ponto de Ref:</strong> {apt.pontoReferencia}
                              </div>
                            )}
                            <div className="text-[11px] text-sky-900 font-medium pl-5 pt-0.5">
                              📦 <strong>Finalidade:</strong> {apt.motivo} (~{apt.quantidadeFrascosEstimada} frascos)
                            </div>
                          </div>

                          {/* Se já foi coletado, exibe detalhes */}
                          {apt.dadosColeta && (
                            <div className="text-[11px] bg-emerald-50 text-emerald-950 p-2 rounded-xl border border-emerald-200 flex flex-wrap gap-x-3 gap-y-1">
                              <span>✅ <strong>Coletados:</strong> {apt.dadosColeta.frascosColetados} frascos</span>
                              <span>💧 <strong>Volume:</strong> {apt.dadosColeta.volumeAproximadoMl} mL</span>
                              <span>❄️ <strong>Temp:</strong> {apt.dadosColeta.temperaturaTermicaC}°C</span>
                              <span>🫙 <strong>Entregues:</strong> {apt.dadosColeta.frascosEntregues} novos</span>
                            </div>
                          )}

                          {/* Barra de Ações Operacionais da Van */}
                          <div className="grid grid-cols-4 gap-1.5 pt-1">
                            {/* Ligar */}
                            <a
                              href={`tel:${apt.telefone.replace(/\D/g, '')}`}
                              className="py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                              title="Ligar para a mãe"
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-600" />
                              <span className="hidden sm:inline">Ligar</span>
                            </a>

                            {/* WhatsApp Avisar */}
                            <button
                              type="button"
                              onClick={() => {
                                const limpo = apt.telefone.replace(/\D/g, '');
                                const msg = encodeURIComponent(`Olá ${apt.nomeDoadora}, aqui é da van do Banco de Leite da Maternidade Santa Mônica! Estamos no bairro ${apt.bairro} a caminho da sua casa para a coleta domiciliar. 🚐🍼`);
                                window.open(`https://wa.me/55${limpo}?text=${msg}`, '_blank');
                              }}
                              className="py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                              title="Avisar no WhatsApp que a van está chegando"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">Avisar</span>
                            </button>

                            {/* GPS / Navegar */}
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${apt.enderecoCompleto}, ${apt.bairro}, Maceio - AL`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                              title="Abrir GPS no Waze ou Google Maps"
                            >
                              <Navigation className="w-3.5 h-3.5 text-sky-600" />
                              <span className="hidden sm:inline">GPS</span>
                            </a>

                            {/* Dar Baixa */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAptForBaixa(apt);
                                setFrascosColetados(apt.quantidadeFrascosEstimada || 2);
                                setVolumeMl((apt.quantidadeFrascosEstimada || 2) * 200);
                              }}
                              className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer text-center ${
                                isColetado
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{isColetado ? 'Revisar' : 'Baixa'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* EXIBIÇÃO 2: SEQUENCIAL DA ROTA */}
      {/* ============================================================= */}
      {viewMode === 'LISTA' && (
        <div className="space-y-3">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6 text-slate-500 text-sm">
              Nenhuma coleta localizada na rota.
            </div>
          ) : (
            filteredAppointments.map((apt, index) => {
              const isColetado = apt.status === 'COLETADO';
              return (
                <div
                  key={apt.id}
                  className={`rounded-2xl border p-4 transition-all shadow-xs ${
                    isColetado
                      ? 'bg-slate-50 border-slate-200 opacity-80'
                      : 'bg-white border-slate-300 hover:border-sky-500'
                  }`}
                >
                  {/* Linha 1: Status & Protocolo */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-mono font-bold text-xs text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {apt.protocolo}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {apt.turno === 'MANHA' ? '☀️ Manhã' : '🌤️ Tarde'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isColetado
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900 animate-pulse'
                      }`}
                    >
                      {isColetado ? '✓ Coletado' : 'Pendente'}
                    </span>
                  </div>

                  {/* Linha 2: Doadora & Bairro */}
                  <div className="py-2.5 space-y-1">
                    <div className="font-black text-slate-900 text-base">
                      {apt.nomeDoadora}
                    </div>

                    <div className="text-xs font-bold text-sky-900 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>Bairro {apt.bairro} ({getNomeRegiao(apt.regiaoLogistica)})</span>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">
                      <div className="font-medium">{apt.enderecoCompleto}</div>
                      {apt.pontoReferencia && (
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          <strong>Ref:</strong> {apt.pontoReferencia}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                      <span>📦 <strong>Solicitação:</strong> {apt.motivo} (~{apt.quantidadeFrascosEstimada} vidros)</span>
                    </div>
                  </div>

                  {/* Se já foi coletado */}
                  {apt.dadosColeta && (
                    <div className="text-[11px] bg-emerald-50 text-emerald-950 p-2 rounded-xl border border-emerald-200 flex flex-wrap gap-x-3 gap-y-1 mb-2">
                      <span>✅ <strong>Coletados:</strong> {apt.dadosColeta.frascosColetados}</span>
                      <span>💧 <strong>Volume:</strong> {apt.dadosColeta.volumeAproximadoMl} mL</span>
                      <span>❄️ <strong>Temp:</strong> {apt.dadosColeta.temperaturaTermicaC}°C</span>
                      <span>🫙 <strong>Entregues:</strong> {apt.dadosColeta.frascosEntregues}</span>
                    </div>
                  )}

                  {/* Botões de Ação Imediata da Van */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100">
                    {/* Ligar */}
                    <a
                      href={`tel:${apt.telefone.replace(/\D/g, '')}`}
                      className="py-2.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-600" />
                      <span className="hidden sm:inline">Ligar</span>
                    </a>

                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={() => {
                        const limpo = apt.telefone.replace(/\D/g, '');
                        const msg = encodeURIComponent(`Olá ${apt.nomeDoadora}, a van do Banco de Leite da Santa Mônica está a caminho no seu bairro! 🚐🍼`);
                        window.open(`https://wa.me/55${limpo}?text=${msg}`, '_blank');
                      }}
                      className="py-2.5 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Avisar</span>
                    </button>

                    {/* Navegar no Waze/Google Maps */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${apt.enderecoCompleto}, ${apt.bairro}, Maceio - AL`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                    >
                      <Navigation className="w-3.5 h-3.5 text-sky-600" />
                      <span className="hidden sm:inline">GPS</span>
                    </a>

                    {/* Baixa com 1 Toque */}
                    <button
                      onClick={() => {
                        setSelectedAptForBaixa(apt);
                        setFrascosColetados(apt.quantidadeFrascosEstimada || 2);
                        setVolumeMl((apt.quantidadeFrascosEstimada || 2) * 200);
                      }}
                      className={`py-2.5 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer text-center ${
                        isColetado
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isColetado ? 'Revisar' : 'Baixa'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL DE BAIXA DE COLETA */}
      {/* ============================================================= */}
      {selectedAptForBaixa && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleConfirmarBaixa}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Registro da Coleta em Trânsito
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedAptForBaixa.nomeDoadora}
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {selectedAptForBaixa.protocolo} • Bairro {selectedAptForBaixa.bairro}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAptForBaixa(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Frascos Coletados:
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  required
                  value={frascosColetados}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    setFrascosColetados(val);
                    setVolumeMl(val * 200);
                  }}
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Volume Aprox. (mL):
                </label>
                <input
                  type="number"
                  step={50}
                  required
                  value={volumeMl}
                  onChange={(e) => setVolumeMl(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Frascos Limpos Entregues:
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={frascosEntregues}
                  onChange={(e) => setFrascosEntregues(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Temp. Caixa Térmica (°C):
                </label>
                <input
                  type="number"
                  step={0.5}
                  required
                  value={temperaturaTermica}
                  onChange={(e) => setTemperaturaTermica(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observações do Coletador:
              </label>
              <textarea
                rows={2}
                value={observacoesColeta}
                onChange={(e) => setObservacoesColeta(e.target.value)}
                placeholder="Ex: Leite perfeitamente congelado. Mãe muito atenciosa."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAptForBaixa(null)}
                className="px-4 py-2 text-xs text-slate-600 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingBaixa}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSubmittingBaixa ? 'Salvando...' : 'Confirmar Baixa de Coleta'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Troca de Senha / PIN do Coletador */}
      {renderChangePinModal()}
    </div>
  );
};
