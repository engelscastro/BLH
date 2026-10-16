import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Truck, 
  ShieldCheck, 
  Calendar, 
  Filter, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Phone, 
  Download, 
  Plus, 
  Baby, 
  Droplet, 
  Sparkles,
  ExternalLink,
  Printer,
  ChevronRight,
  UserCheck,
  Stethoscope,
  FileText,
  Camera,
  Eye,
  X,
  Loader2,
  Lock,
  LogOut,
  Hospital,
  KeyRound,
  Building2,
  CheckCircle,
  EyeOff,
  BarChart3,
  TrendingUp,
  Droplets,
  ArrowUpRight,
  MapPin,
  PieChart as PieChartIcon,
  Activity,
  Award,
  Layers,
  History,
  MessageCircle,
  Check
} from 'lucide-react';
import { ActivityLogsView } from './ActivityLogsView';
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Line,
  ComposedChart
} from 'recharts';
import { 
  Doadora, 
  AgendamentoColeta, 
  Coletador, 
  EstatisticasBLH, 
  StatusTriagem, 
  RegiaoLogistica,
  ProfissionalHospitalar
} from '../types/blh';
import { api } from '../services/api';
import { BAIRROS_MACEIO, getNomeRegiao } from '../utils/maceioNeighborhoods';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Tooltip customizado para o gráfico de evolução mensal
const CustomVolumeTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[210px]">
        <div className="font-black text-sm text-emerald-400 border-b border-slate-700 pb-1 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-800">
            {data.atingimento}% da Meta
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span>Volume Coletado:</span>
          <strong className="text-white text-sm">
            {unit === 'LITROS' ? `${data.volumeL.toFixed(1)} L` : `${data.volumeMl.toLocaleString('pt-BR')} mL`}
          </strong>
        </div>
        <div className="flex justify-between items-center text-amber-300">
          <span>Meta UTIN MESM:</span>
          <strong className="text-amber-200">
            {unit === 'LITROS' ? `${data.metaL.toFixed(1)} L` : `${(data.metaL * 1000).toLocaleString('pt-BR')} mL`}
          </strong>
        </div>
        <div className="pt-1 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
          <span>Prematuros nutridos:</span>
          <span className="text-slate-200 font-bold">{data.prematuros} recém-nascidos</span>
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip customizado para o gráfico de doadoras por bairro
const CustomNeighborhoodTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const taxaAptas = data.total > 0 ? Math.round((data.aptas / data.total) * 100) : 0;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[220px]">
        <div className="border-b border-slate-700 pb-1">
          <div className="font-black text-sm text-sky-400">{label}</div>
          <div className="text-[10px] text-slate-400 font-medium">{data.nomeRegiao}</div>
        </div>
        <div className="space-y-1 text-slate-300">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Aptas (Liberadas):
            </span>
            <strong className="text-emerald-400">{data.aptas} ({taxaAptas}%)</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Em Análise Médica:
            </span>
            <strong className="text-amber-400">{data.emAnalise}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span> Inaptas Temporárias:
            </span>
            <strong className="text-rose-400">{data.inaptas}</strong>
          </div>
        </div>
        <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center font-bold text-white text-xs">
          <span>Total Cadastradas:</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-sky-300 font-mono">{data.total} doadoras</span>
        </div>
      </div>
    );
  }
  return null;
};

export const HospitalAdminDashboard: React.FC = () => {
  // Autenticação do Corpo Clínico e Gestão Hospitalar MESM (UNCISAL)
  const [loggedStaff, setLoggedStaff] = useState<ProfissionalHospitalar | null>(() => {
    try {
      // Validação de sessão: só restaura perfil se houver token ativo válido
      const token = sessionStorage.getItem('mesm_blh_token');
      const saved = sessionStorage.getItem('mesm_blh_logged_staff');
      return token && saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loginInput, setLoginInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // Modal de Troca de Senha Hospitalar (MESM / UNCISAL)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [changePasswordLogin, setChangePasswordLogin] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState<boolean>(false);
  const [changePasswordError, setChangePasswordError] = useState<string>('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string>('');

  const openChangePasswordModal = (defaultLogin?: string) => {
    setChangePasswordLogin(defaultLogin || loggedStaff?.matricula || loginInput || '4821');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordError('');
    setChangePasswordSuccess('');
    setShowChangePasswordModal(true);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (newPassword.trim().length < 4) {
      setChangePasswordError('A nova senha deve conter no mínimo 4 caracteres ou dígitos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError('A confirmação não confere com a nova senha digitada.');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const res = await api.hospitalChangePassword(
        changePasswordLogin.trim(),
        currentPassword.trim(),
        newPassword.trim()
      );
      setChangePasswordSuccess(res.message || 'Senha hospitalar alterada com sucesso!');
      if (res.user && loggedStaff && res.user.id === loggedStaff.id) {
        setLoggedStaff(res.user);
        try {
          localStorage.setItem('mesm_blh_logged_staff', JSON.stringify(res.user));
        } catch {}
      }
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setChangePasswordSuccess('');
      }, 2000);
    } catch (err: any) {
      setChangePasswordError(err.message || 'Erro ao alterar senha. Verifique a senha atual informada.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<'CRM' | 'ROTAS' | 'COLETADORES' | 'GRAFICOS' | 'LOGS'>('CRM');
  const [stats, setStats] = useState<EstatisticasBLH | null>(null);
  const [donors, setDonors] = useState<Doadora[]>([]);
  const [appointments, setAppointments] = useState<AgendamentoColeta[]>([]);
  const [collectors, setCollectors] = useState<Coletador[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  // Estados dos Gráficos Comparativos (Recharts)
  const [chartVolumeUnit, setChartVolumeUnit] = useState<'LITROS' | 'ML'>('LITROS');
  const [chartNeighborhoodRegion, setChartNeighborhoodRegion] = useState<string>('TODAS');
  const [chartSortMode, setChartSortMode] = useState<'TOTAL' | 'APTAS'>('TOTAL');

  // Dados da Evolução Mensal do Volume de Leite Coletado (Histórico Semestral MESM)
  const monthlyMilkData = useMemo(() => [
    { mes: 'Mai/26', volumeL: 3.8, volumeMl: 3800, metaL: 5.0, metaMl: 5000, colostroMl: 750, transicaoMl: 1200, maduroMl: 1850, prematuros: 31, atingimento: 76 },
    { mes: 'Jun/26', volumeL: 4.2, volumeMl: 4200, metaL: 5.0, metaMl: 5000, colostroMl: 850, transicaoMl: 1350, maduroMl: 2000, prematuros: 34, atingimento: 84 },
    { mes: 'Jul/26', volumeL: 4.6, volumeMl: 4600, metaL: 5.0, metaMl: 5000, colostroMl: 920, transicaoMl: 1480, maduroMl: 2200, prematuros: 37, atingimento: 92 },
    { mes: 'Ago/26', volumeL: 4.9, volumeMl: 4900, metaL: 5.0, metaMl: 5000, colostroMl: 980, transicaoMl: 1550, maduroMl: 2370, prematuros: 39, atingimento: 98 },
    { mes: 'Set/26', volumeL: 5.2, volumeMl: 5200, metaL: 5.0, metaMl: 5000, colostroMl: 1100, transicaoMl: 1650, maduroMl: 2450, prematuros: 42, atingimento: 104 },
    { mes: 'Out/26', volumeL: 5.8, volumeMl: 5800, metaL: 5.0, metaMl: 5000, colostroMl: 1250, transicaoMl: 1850, maduroMl: 2700, prematuros: 46, atingimento: 116 }
  ], []);

  // Dados Agrupados de Novas Doadoras por Bairro de Maceió (Base Histórica + Cadastros em Tempo Real)
  const neighborhoodDonorsData = useMemo(() => {
    // Base territorial consolidada do BLH da MESM por bairros de Maceió
    const baseBairros: Record<string, { aptas: number; emAnalise: number; inaptas: number; regiao: string }> = {
      'Trapiche da Barra': { aptas: 9, emAnalise: 2, inaptas: 1, regiao: 'LITORAL_SUL_TRAPICHE' },
      'Benedito Bentes': { aptas: 8, emAnalise: 3, inaptas: 2, regiao: 'TABULEIRO_ALTA' },
      'Tabuleiro do Martins': { aptas: 7, emAnalise: 2, inaptas: 1, regiao: 'TABULEIRO_ALTA' },
      'Jacintinho': { aptas: 6, emAnalise: 2, inaptas: 2, regiao: 'FAROL_CENTRO' },
      'Ponta Verde': { aptas: 5, emAnalise: 1, inaptas: 0, regiao: 'ORLA_BAIXA' },
      'Jatiúca': { aptas: 5, emAnalise: 2, inaptas: 1, regiao: 'ORLA_BAIXA' },
      'Farol': { aptas: 4, emAnalise: 1, inaptas: 1, regiao: 'FAROL_CENTRO' },
      'Poço / Centro': { aptas: 4, emAnalise: 1, inaptas: 0, regiao: 'FAROL_CENTRO' },
      'Mangabeiras': { aptas: 3, emAnalise: 1, inaptas: 1, regiao: 'ORLA_BAIXA' },
      'Prado': { aptas: 3, emAnalise: 1, inaptas: 0, regiao: 'LITORAL_SUL_TRAPICHE' },
      'Pajuçara': { aptas: 3, emAnalise: 0, inaptas: 1, regiao: 'ORLA_BAIXA' },
      'Clima Bom': { aptas: 2, emAnalise: 1, inaptas: 1, regiao: 'TABULEIRO_ALTA' }
    };

    // Incrementa com os dados cadastrados em tempo real no banco
    donors.forEach((d) => {
      const bNome = d.endereco?.bairro || 'Trapiche da Barra';
      if (!baseBairros[bNome]) {
        baseBairros[bNome] = {
          aptas: 0,
          emAnalise: 0,
          inaptas: 0,
          regiao: d.endereco?.regiaoLogistica || 'LITORAL_SUL_TRAPICHE'
        };
      }
      if (d.status === 'APTA') baseBairros[bNome].aptas += 1;
      else if (d.status === 'EM_ANALISE') baseBairros[bNome].emAnalise += 1;
      else baseBairros[bNome].inaptas += 1;
    });

    let list = Object.entries(baseBairros).map(([bairro, d]) => ({
      bairro,
      regiaoLogistica: d.regiao,
      nomeRegiao: getNomeRegiao(d.regiao as RegiaoLogistica),
      aptas: d.aptas,
      emAnalise: d.emAnalise,
      inaptas: d.inaptas,
      total: d.aptas + d.emAnalise + d.inaptas
    }));

    if (chartNeighborhoodRegion !== 'TODAS') {
      list = list.filter((item) => item.regiaoLogistica === chartNeighborhoodRegion);
    }

    if (chartSortMode === 'TOTAL') {
      list.sort((a, b) => b.total - a.total);
    } else {
      list.sort((a, b) => b.aptas - a.aptas);
    }

    return list;
  }, [donors, chartNeighborhoodRegion, chartSortMode]);

  // Filtros do CRM
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [bairroFilter, setBairroFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtros de Rotas
  const [rotaRegiaoFilter, setRotaRegiaoFilter] = useState<string>('TODAS');
  const [rotaDataFilter, setRotaDataFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rotaStatusFilter, setRotaStatusFilter] = useState<'TODOS' | 'ATRASADAS' | 'PENDENTE' | 'EM_ROTA' | 'COLETADO'>('TODOS');

  // Configuração dos Horários Limite das Rotas (Padrão: Manhã 12:30 | Tarde 17:30)
  const [cutoffManha, setCutoffManha] = useState<string>('12:30');
  const [cutoffTarde, setCutoffTarde] = useState<string>('17:30');
  const [showOverdueModal, setShowOverdueModal] = useState<boolean>(false);
  const [showCutoffSettingsModal, setShowCutoffSettingsModal] = useState<boolean>(false);

  // Baixa Emergencial de Coleta pela Coordenação
  const [selectedAptForQuickBaixa, setSelectedAptForQuickBaixa] = useState<AgendamentoColeta | null>(null);
  const [quickBaixaFrascos, setQuickBaixaFrascos] = useState<number>(2);
  const [quickBaixaVolumeMl, setQuickBaixaVolumeMl] = useState<number>(400);
  const [quickBaixaTemp, setQuickBaixaTemp] = useState<number>(-12);
  const [quickBaixaObs, setQuickBaixaObs] = useState<string>('Baixa confirmada via coordenação BLH / rádio da van.');
  const [isSubmittingQuickBaixa, setIsSubmittingQuickBaixa] = useState<boolean>(false);

  // Verificação de rotas pendentes de finalização após o horário limite
  const checkRouteOverdue = (apt: AgendamentoColeta, cManha = cutoffManha, cTarde = cutoffTarde) => {
    if (apt.status === 'COLETADO' || apt.status === 'CANCELADO') {
      return { isOverdue: false, delayText: '', cutoffTime: '', isPastDay: false };
    }
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const aptDate = apt.dataAgendada ? apt.dataAgendada.split('T')[0] : todayStr;

    // Se a data é anterior a hoje (atraso de dias)
    if (aptDate < todayStr) {
      const aptDateTime = new Date(`${aptDate}T23:59:59`);
      const diffMs = now.getTime() - aptDateTime.getTime();
      const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return {
        isOverdue: true,
        delayText: `+${diffDays}d de atraso`,
        cutoffTime: apt.turno === 'MANHA' ? cManha : cTarde,
        isPastDay: true
      };
    }

    // Se a data é hoje, verificar o limite do turno
    if (aptDate === todayStr) {
      const targetCutoff = apt.turno === 'MANHA' ? cManha : cTarde;
      const [cutoffH, cutoffM] = targetCutoff.split(':').map(Number);
      const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), cutoffH, cutoffM, 0);

      if (now.getTime() > cutoffDate.getTime()) {
        const diffMs = now.getTime() - cutoffDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
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

  const overdueAppointments = useMemo(() => {
    return appointments.filter(apt => checkRouteOverdue(apt, cutoffManha, cutoffTarde).isOverdue);
  }, [appointments, cutoffManha, cutoffTarde]);

  // Modal Parecer Médico
  const [selectedDonorForReview, setSelectedDonorForReview] = useState<Doadora | null>(null);
  const [medReviewDecisao, setMedReviewDecisao] = useState<'APROVADA' | 'REJEITADA'>('APROVADA');
  const [medReviewObs, setMedReviewObs] = useState<string>('');
  const [medReviewNome, setMedReviewNome] = useState<string>(() => loggedStaff?.nome || 'Dra. Maria do Carmo Lins');
  const [medReviewMatricula, setMedReviewMatricula] = useState<string>(() => loggedStaff?.registroProfissional ? `${loggedStaff.registroProfissional} / UNCISAL` : 'CRM-AL 4821 / UNCISAL');
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [isValidatingComprovante, setIsValidatingComprovante] = useState<boolean>(false);

  // Sincroniza usuário logado com as assinaturas clínicas
  useEffect(() => {
    if (loggedStaff) {
      setMedReviewNome(loggedStaff.nome);
      setMedReviewMatricula(`${loggedStaff.registroProfissional} / UNCISAL`);
      try {
        sessionStorage.setItem('mesm_blh_logged_staff', JSON.stringify(loggedStaff));
      } catch (err) {
        // quiet
      }
    }
  }, [loggedStaff]);

  // Login no Painel Hospitalar
  const handleHospitalLogin = async (e?: React.FormEvent, customLogin?: string, customPin?: string) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    const userToAuth = (customLogin || loginInput).trim();
    const pinToAuth = (customPin || pinInput).trim();

    try {
      const user = await api.hospitalLogin(userToAuth, pinToAuth);
      setLoggedStaff(user);
      setMedReviewNome(user.nome);
      setMedReviewMatricula(`${user.registroProfissional} / UNCISAL`);
      try {
        sessionStorage.setItem('mesm_blh_logged_staff', JSON.stringify(user));
      } catch (err) {
        // quiet
      }
      // Carrega dados clínicos autenticados
      await loadData();
    } catch (err: any) {
      setAuthError(err.message || 'Falha na autenticação. Verifique seu CRM, Matrícula ou Senha.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout no Painel Hospitalar (Limpa sessão e token de segurança)
  const handleHospitalLogout = () => {
    api.setToken(null);
    try {
      sessionStorage.removeItem('mesm_blh_logged_staff');
    } catch (e) {
      // quiet
    }
    setLoggedStaff(null);
    setDonors([]);
    setAppointments([]);
    setCollectors([]);
    setAuthError('');
  };

  // Modal Novo Coletador
  const [showNewCollectorModal, setShowNewCollectorModal] = useState<boolean>(false);
  const [newColName, setNewColName] = useState<string>('');
  const [newColMatricula, setNewColMatricula] = useState<string>('');
  const [newColPhone, setNewColPhone] = useState<string>('');
  const [newColVehicle, setNewColVehicle] = useState<string>('Van Fiat Ducato - Placa QTT-4821');
  const [newColPin, setNewColPin] = useState<string>('1234');

  // Carrega dados clínicos autenticados
  const loadData = async () => {
    setLoading(true);
    try {
      const [s, d, a, c] = await Promise.all([
        api.getStats(),
        api.getDonors(),
        api.getAppointments(),
        api.getCollectors()
      ]);
      setStats(s);
      setDonors(d);
      setAppointments(a);
      setCollectors(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedStaff) {
      loadData();
    }
  }, [loggedStaff]);

  // Salvar Parecer Médico
  const handleSaveMedicalReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonorForReview) return;
    setIsSavingReview(true);
    try {
      await api.reviewDonorMedical(selectedDonorForReview.id, {
        decisao: medReviewDecisao,
        observacoes: medReviewObs,
        aprovadoPor: `${medReviewNome} (${medReviewMatricula})`
      });
      setSelectedDonorForReview(null);
      setMedReviewObs('');
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar parecer médico.');
    } finally {
      setIsSavingReview(false);
    }
  };

  // Validar Comprovante de Exames da Doadora (Enfermagem BLH)
  const handleValidateComprovante = async (donorId: string, aprovado: boolean) => {
    setIsValidatingComprovante(true);
    try {
      await api.validateDonorExamProof(donorId, {
        validadoPor: `${medReviewNome} (${medReviewMatricula})`,
        observacoes: aprovado 
          ? 'Sorologias do pré-natal conferidas e aprovadas pela equipe de Enfermagem BLH/MESM (HIV, Sífilis, Hepatites Negativos).'
          : 'Comprovante ilegível ou pendente de envio de novos exames.',
        aprovado
      });
      await loadData();
      if (selectedDonorForReview && selectedDonorForReview.id === donorId) {
        setSelectedDonorForReview((prev) => prev ? {
          ...prev,
          comprovanteExames: prev.comprovanteExames ? {
            ...prev.comprovanteExames,
            validadoEnfermagem: aprovado,
            validadoPor: `${medReviewNome} (${medReviewMatricula})`,
            dataValidacao: new Date().toISOString(),
            observacoes: aprovado 
              ? 'Sorologias conferidas e aprovadas pela equipe de Enfermagem BLH/MESM.'
              : 'Pendente de novos exames.'
          } : undefined
        } : null);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao validar comprovante de exames.');
    } finally {
      setIsValidatingComprovante(false);
    }
  };

  // Cadastrar Coletador
  const handleCreateCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName || !newColMatricula) return;

    // Restrição Sanitária: Não permitir cadastrar o mesmo número de telefone duas vezes
    const phoneDigits = newColPhone.replace(/\D/g, '');
    if (phoneDigits.length >= 8) {
      const existingCol = collectors.find(c => {
        const d = (c.telefone || '').replace(/\D/g, '');
        return d.length >= 8 && (d === phoneDigits || d.endsWith(phoneDigits) || phoneDigits.endsWith(d));
      });
      if (existingCol) {
        alert(`O número de telefone ${newColPhone} já está cadastrado para o coletador ${existingCol.nome} (Matrícula: ${existingCol.matricula}). Não é permitido cadastrar o mesmo telefone duas vezes.`);
        return;
      }
    }

    try {
      await api.createCollector({
        nome: newColName,
        matricula: newColMatricula,
        telefone: newColPhone,
        veiculo: newColVehicle,
        pin: newColPin,
        ativo: true
      });
      setShowNewCollectorModal(false);
      setNewColName('');
      setNewColMatricula('');
      setNewColPhone('');
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao cadastrar coletador');
    }
  };

  // Filtragem de Doadoras no CRM
  const filteredDonors = donors.filter((d) => {
    if (statusFilter !== 'TODOS' && d.status !== statusFilter) return false;
    if (bairroFilter && d.endereco?.bairro !== bairroFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        d.nomeCompleto.toLowerCase().includes(q) ||
        d.protocolo.toLowerCase().includes(q) ||
        d.cpf.includes(q) ||
        d.telefone.includes(q) ||
        d.nomeBebe?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Exportar Lista de Doadoras e Status de Triagem para PDF Oficial
  const handleExportPDF = () => {
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Cabeçalho Institucional MESM / UNCISAL
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 297, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('BANCO DE LEITE HUMANO • MATERNIDADE ESCOLA SANTA MÔNICA (UNCISAL)', 14, 9);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Relatório Oficial de Doadoras Cadastradas & Status de Triagem Clínica rBLH (Norma RDC 171/2006 ANVISA)', 14, 15);

      const dataHora = new Date().toLocaleString('pt-BR');
      doc.setFontSize(7.5);
      doc.text(`Gerado em: ${dataHora} • Total de Registros: ${filteredDonors.length} doadora(s) • Filtro Status: ${statusFilter !== 'TODOS' ? statusFilter : 'Todos'} • Bairro: ${bairroFilter || 'Todos'}`, 14, 20);

      // Linhas da Tabela
      const tableData = filteredDonors.map((d, index) => [
        `#${index + 1}\n${d.protocolo}`,
        `${d.nomeCompleto}\nCPF: ${d.cpf}`,
        d.telefone,
        `${d.nomeBebe || 'Bebê'}\n(${d.idadeBebeDias || 0} dias)\n${d.tipoLeite}`,
        `${d.endereco?.bairro || 'Maceió'}\n${d.endereco?.logradouro || ''}`,
        d.status === 'APTA' ? 'APTA' : d.status === 'EM_ANALISE' ? 'EM ANÁLISE' : d.status === 'INAPTA_TEMPORARIA' ? 'INAPTA TEMP.' : 'INAPTA DEF.',
        d.comprovanteExames?.validadoEnfermagem ? 'Validado Enf.' : (d.comprovanteExames ? 'Pendente Enf.' : 'Sem Envio Digital'),
        new Date(d.dataCadastro).toLocaleDateString('pt-BR')
      ]);

      autoTable(doc, {
        head: [['Protocolo', 'Doadora & CPF', 'Telefone', 'Bebê / Tipo Leite', 'Bairro / Endereço', 'Status Triagem', 'Exames Pré-Natal', 'Cadastro']],
        body: tableData,
        startY: 28,
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          valign: 'middle'
        },
        headStyles: {
          fillColor: [14, 116, 144], // sky-700
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 46 },
          2: { cellWidth: 28 },
          3: { cellWidth: 32 },
          4: { cellWidth: 50 },
          5: { cellWidth: 28, fontStyle: 'bold' },
          6: { cellWidth: 28 },
          7: { cellWidth: 24 }
        }
      });

      // Rodapé em todas as páginas
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Maternidade Escola Santa Mônica (MESM) • UNCISAL • Maceió - AL • Página ${i} de ${pageCount}`,
          14,
          204
        );
      }

      doc.save(`Relatorio_Doadoras_BLH_Santa_Monica_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Houve um erro ao exportar o PDF. Por favor, tente novamente.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Filtragem de Rotas
  const filteredAppointments = appointments.filter((a) => {
    if (rotaRegiaoFilter !== 'TODAS' && a.regiaoLogistica !== rotaRegiaoFilter) return false;
    if (rotaDataFilter && a.dataAgendada !== rotaDataFilter) return false;
    if (rotaStatusFilter === 'ATRASADAS') {
      return checkRouteOverdue(a, cutoffManha, cutoffTarde).isOverdue;
    }
    if (rotaStatusFilter !== 'TODOS' && a.status !== rotaStatusFilter) return false;
    return true;
  });

  // Baixa Emergencial de Coleta pela Coordenação
  const handleQuickBaixaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAptForQuickBaixa) return;
    setIsSubmittingQuickBaixa(true);
    try {
      await api.updateAppointmentStatus(selectedAptForQuickBaixa.id, {
        status: 'COLETADO',
        dadosColeta: {
          dataHoraColeta: new Date().toISOString(),
          frascosColetados: quickBaixaFrascos,
          volumeAproximadoMl: quickBaixaVolumeMl,
          frascosEntregues: 2,
          temperaturaTermicaC: quickBaixaTemp,
          observacoes: quickBaixaObs,
          coletadorMatricula: selectedAptForQuickBaixa.coletadorId || 'MESM-COORD'
        }
      });
      setSelectedAptForQuickBaixa(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar baixa de coleta');
    } finally {
      setIsSubmittingQuickBaixa(false);
    }
  };

  // Badge Status Doadora
  const renderStatusBadge = (status: StatusTriagem) => {
    switch (status) {
      case 'APTA':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Apta
          </span>
        );
      case 'EM_ANALISE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Em Análise Médica
          </span>
        );
      case 'INAPTA_TEMPORARIA':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            Inapta Temporária
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Inapta Definitiva
          </span>
        );
    }
  };

  // Badge Tipo de Leite
  const renderMilkBadge = (tipo: string) => {
    switch (tipo) {
      case 'COLOSTRO':
        return (
          <span className="inline-flex items-center text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
            Colostro (UTIN Prioritário)
          </span>
        );
      case 'TRANSICAO':
        return (
          <span className="inline-flex items-center text-[10px] font-bold bg-orange-100 text-orange-900 px-1.5 py-0.5 rounded border border-orange-200">
            Transição
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-bold bg-sky-100 text-sky-900 px-1.5 py-0.5 rounded border border-sky-200">
            Maduro
          </span>
        );
    }
  };

  // WhatsApp direto de enfermagem
  const openWhatsAppEnfermagem = (doadora: Doadora) => {
    const limpo = doadora.telefone.replace(/\D/g, '');
    const num = limpo.startsWith('55') ? limpo : `55${limpo}`;
    const msg = encodeURIComponent(
      `Olá ${doadora.nomeCompleto}! Aqui é da equipe do Banco de Leite da Maternidade Santa Mônica (UNCISAL). Seu protocolo é ${doadora.protocolo}. Estamos organizando a visita da nossa van no bairro ${doadora.endereco?.bairro || 'em Maceió'}.`
    );
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  };

  // Modal de Troca de Senha Hospitalar
  const renderChangePasswordModal = () => {
    if (!showChangePasswordModal) return null;
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto p-4 flex min-h-full items-center justify-center animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Trocar Senha Hospitalar
                </h3>
                <p className="text-[11px] text-slate-500">
                  Maternidade Santa Mônica • UNCISAL
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowChangePasswordModal(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {changePasswordSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{changePasswordSuccess}</span>
            </div>
          )}

          {changePasswordError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{changePasswordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Profissional / Matrícula UNCISAL ou CRM/COREN
              </label>
              <input
                type="text"
                required
                value={changePasswordLogin}
                onChange={(e) => setChangePasswordLogin(e.target.value)}
                placeholder="Ex: 4821 ou CRM-AL 4821"
                disabled={!!loggedStaff}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 font-medium text-xs text-slate-900 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha / PIN Atual
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite a senha atual (padrão: 1234)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nova Senha / PIN
                </label>
                <span className="text-[10px] text-slate-400">Mínimo 4 caracteres</span>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={changePasswordLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {changePasswordLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Salvar Nova Senha</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Se não estiver autenticado, exibe a tela institucional de login hospitalar (design clean & minimalista)
  if (!loggedStaff) {
    return (
      <>
        <div className="max-w-md mx-auto my-6 sm:my-10 bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-8 space-y-6">
          {/* Cabeçalho Clean & Minimalista */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100/80 flex items-center justify-center mx-auto shadow-2xs">
              <Hospital className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 inline-block mb-1">
                MESM • UNCISAL
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Painel Hospitalar
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Área restrita à equipe clínica e coordenação do BLH
              </p>
            </div>
          </div>

          {/* Alerta de Erro Discreto */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{authError}</span>
            </div>
          )}

          {/* Formulário Clean */}
          <form onSubmit={(e) => handleHospitalLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Matrícula ou CRM / COREN
              </label>
              <input
                type="text"
                required
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Ex: 4821 ou CRM-AL 4821"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-medium text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Senha / PIN
                </label>
                <span className="text-[11px] text-slate-400 font-normal">Padrão demo: 1234</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-mono text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Entrar no Painel</span>
              )}
            </button>
          </form>

          {/* Botão de Trocar Senha na Tela de Login */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => openChangePasswordModal(loginInput)}
              className="text-xs text-slate-500 hover:text-emerald-700 font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>Trocar ou redefinir senha do plantão</span>
            </button>
          </div>

          {/* Perfis de Plantão com 1 Toque (Clean & Minimalista) */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block text-center">
              Acesso rápido de plantão:
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleHospitalLogin(undefined, '4821', '1234')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-950 truncate">
                    Dra. Maria do Carmo Lins
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Médica Neonatologista • CRM-AL 4821
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleHospitalLogin(undefined, '12894', '1234')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-950 truncate">
                    Enfª Ana Cláudia Silva
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Enfermeira Chefe da Triagem • COREN-AL 12894
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleHospitalLogin(undefined, '51902', '1234')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-950 truncate">
                    Dra. Helena Brandão
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Coordenação Geral BLH • Matrícula 51902
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Rodapé Clean */}
          <div className="text-[11px] text-slate-400 text-center pt-1">
            Acesso institucional restrito • Conformidade RDC ANVISA nº 171/2006
          </div>
        </div>
        {renderChangePasswordModal()}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de Sessão do Profissional de Plantão (MESM / UNCISAL) - Sem Estouro */}
      <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Lado Esquerdo: Avatar + Identificação Clínica Estruturada sem estouro */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
              {loggedStaff.funcao === 'MEDICO' ? (
                <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-100" />
              ) : loggedStaff.funcao === 'ENFERMEIRO' ? (
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-sky-100" />
              ) : (
                <Hospital className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                  {loggedStaff.nome}
                </span>
                <span className="text-[11px] font-bold bg-emerald-100/90 text-emerald-950 px-2.5 py-0.5 rounded-md border border-emerald-300/80 font-mono whitespace-nowrap">
                  {loggedStaff.registroProfissional}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Plantão Ativo MESM
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 hidden sm:inline whitespace-nowrap">
                  Matrícula: {loggedStaff.matricula}
                </span>
              </div>
              <div className="text-xs text-slate-600 leading-normal flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="font-semibold text-slate-800">{loggedStaff.cargo}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{loggedStaff.departamento}</span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Ações da Sessão */}
          <div className="flex items-center justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => openChangePasswordModal()}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
              title="Trocar senha do profissional"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
              <span>Trocar Senha</span>
            </button>

            <button
              type="button"
              onClick={handleHospitalLogout}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs whitespace-nowrap"
              title="Encerrar sessão de plantão"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </div>
      </div>

      {/* Indicador Visual de Alerta: Rotas de Coleta Pendentes de Finalização pós-horário limite */}
      {overdueAppointments.length > 0 && (
        <div className="bg-linear-to-r from-rose-900 via-rose-800 to-amber-950 text-white rounded-3xl p-4 sm:p-5 shadow-lg border-2 border-rose-500/70 animate-in fade-in space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="relative shrink-0 mt-0.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/30 text-rose-200 border border-rose-400/60 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-rose-300 animate-bounce" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-white"></span>
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider animate-pulse">
                    ⚠️ Alerta Crítico de Rotas
                  </span>
                  <span className="text-xs text-rose-200 font-mono">
                    Horários Limite: Manhã ({cutoffManha}) • Tarde ({cutoffTarde})
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white mt-1 leading-snug">
                  {overdueAppointments.length} {overdueAppointments.length === 1 ? 'rota de coleta pendente' : 'rotas de coleta pendentes'} de finalização após o horário limite!
                </h3>
                <p className="text-xs text-rose-100/90 mt-0.5 max-w-2xl leading-relaxed">
                  Coletas em aberto após o horário limite estabelecido exigem averiguação imediata da cadeia de frio (temperatura &le; -10°C) e contato com os motoristas das vans para garantir a nutrição dos bebês na UTIN Santa Mônica.
                </p>
              </div>
            </div>

            {/* Botões de Ação Rápida no Alerta */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('ROTAS');
                  setRotaStatusFilter('ATRASADAS');
                }}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Truck className="w-4 h-4 text-rose-700" />
                <span>Ver {overdueAppointments.length} Atrasadas</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOverdueModal(true)}
                className="px-3.5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs border border-rose-400/60 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Auditar & Contatar Vans</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCutoffSettingsModal(true)}
                title="Configurar horários limite"
                className="p-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-950 text-rose-200 border border-rose-700/70 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner de Métricas em Tempo Real */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Doadoras</span>
              <Users className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalDoadoras}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Cadastradas no BLH</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
              <span>Doadoras Aptas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{stats.aptas}</div>
            <div className="text-[11px] text-emerald-800 mt-0.5">Liberadas para coleta</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-xs bg-amber-50/30">
            <div className="flex items-center justify-between text-amber-900 text-xs font-semibold">
              <span>Em Análise Médica</span>
              <Stethoscope className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1 flex items-center gap-1.5">
              <span>{stats.emAnalise}</span>
              {stats.emAnalise > 0 && (
                <span className="text-xs bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                  Ação
                </span>
              )}
            </div>
            <div className="text-[11px] text-amber-900 mt-0.5">Aguardando parecer</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-xs bg-orange-50/20">
            <div className="flex items-center justify-between text-orange-900 text-xs font-semibold">
              <span>Inaptas Temporárias</span>
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-black text-orange-800 mt-1">{stats.inaptasTemporarias}</div>
            <div className="text-[11px] text-orange-900 mt-0.5">Janela sorológica/cura</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-sky-200 shadow-xs bg-sky-50/30">
            <div className="flex items-center justify-between text-sky-900 text-xs font-semibold">
              <span>Volume Coletado</span>
              <Droplet className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-sky-800 mt-1">
              {(stats.volumeTotalMl / 1000).toFixed(1)} L
            </div>
            <div className="text-[11px] text-sky-900 mt-0.5">{stats.volumeTotalMl} mL pasteurizados</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-xs bg-rose-50/20">
            <div className="flex items-center justify-between text-rose-900 text-xs font-semibold">
              <span>Prematuros Salvos</span>
              <Baby className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-700 mt-1">{stats.bebesBeneficiadosEstimados}</div>
            <div className="text-[11px] text-rose-900 mt-0.5">Nutridos na UTIN MESM</div>
          </div>
        </div>
      )}

      {/* Navegação entre Sub-abas (Botões destacados e cabendo na mesma tela) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2.5 border-b border-slate-200 bg-slate-100/70 p-2 sm:p-2.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('CRM')}
            className={`w-full py-2.5 sm:py-3 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center ${
              activeSubTab === 'CRM'
                ? 'bg-white text-sky-950 shadow-md border-2 border-sky-600/40 ring-2 ring-sky-500/10'
                : 'bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-sky-700" />
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="truncate">CRM Doadoras</span>
              <span className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                activeSubTab === 'CRM' ? 'bg-sky-100 text-sky-900' : 'bg-slate-200/80 text-slate-700'
              }`}>
                {donors.length}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ROTAS')}
            className={`w-full py-2.5 sm:py-3 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center ${
              activeSubTab === 'ROTAS'
                ? overdueAppointments.length > 0
                  ? 'bg-white text-rose-950 shadow-md border-2 border-rose-600/60 ring-2 ring-rose-500/10'
                  : 'bg-white text-sky-950 shadow-md border-2 border-sky-600/40 ring-2 ring-sky-500/10'
                : overdueAppointments.length > 0
                ? 'bg-rose-50/70 hover:bg-rose-100 text-rose-900 border border-rose-200'
                : 'bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <Truck className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${overdueAppointments.length > 0 ? 'text-rose-600 animate-bounce' : 'text-sky-700'}`} />
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="truncate">Rotas da Van</span>
              {overdueAppointments.length > 0 ? (
                <span className="text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-mono font-black bg-rose-600 text-white animate-pulse shrink-0">
                  {overdueAppointments.length} atraso
                </span>
              ) : (
                <span className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                  activeSubTab === 'ROTAS' ? 'bg-sky-100 text-sky-900' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  {appointments.length}
                </span>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('COLETADORES')}
            className={`w-full py-2.5 sm:py-3 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center ${
              activeSubTab === 'COLETADORES'
                ? 'bg-white text-sky-950 shadow-md border-2 border-sky-600/40 ring-2 ring-sky-500/10'
                : 'bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <UserCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-sky-700" />
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="truncate">Coletadores</span>
              <span className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                activeSubTab === 'COLETADORES' ? 'bg-sky-100 text-sky-900' : 'bg-slate-200/80 text-slate-700'
              }`}>
                {collectors.length}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('GRAFICOS')}
            className={`w-full py-2.5 sm:py-3 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center ${
              activeSubTab === 'GRAFICOS'
                ? 'bg-white text-emerald-950 shadow-md border-2 border-emerald-600/40 ring-2 ring-emerald-500/10'
                : 'bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <BarChart3 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-700" />
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="truncate">Gráficos & Análises</span>
              <span className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                activeSubTab === 'GRAFICOS' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200/80 text-slate-700'
              }`}>
                Recharts
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('LOGS')}
            className={`w-full py-2.5 sm:py-3 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center col-span-2 sm:col-span-1 ${
              activeSubTab === 'LOGS'
                ? 'bg-white text-emerald-950 shadow-md border-2 border-emerald-600/40 ring-2 ring-emerald-500/10'
                : 'bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <History className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-700" />
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="truncate">Logs & Auditoria</span>
              <span className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                activeSubTab === 'LOGS' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200/80 text-slate-700'
              }`}>
                ANVISA
              </span>
            </div>
          </button>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* SUB-ABA 1: CRM DE DOADORAS */}
        {/* ----------------------------------------------------------- */}
        {activeSubTab === 'CRM' && (
          <div className="p-3.5 sm:p-6 space-y-4">
            {/* Filtros, Barra de Busca e Exportação PDF */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar nome, CPF, protocolo ou bebê..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 w-full sm:w-64 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium cursor-pointer"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="APTA">🟢 Apta</option>
                  <option value="EM_ANALISE">🟡 Em Análise Médica</option>
                  <option value="INAPTA_TEMPORARIA">🟠 Inapta Temporária</option>
                  <option value="INAPTA_DEFINITIVA">🔴 Inapta Definitiva</option>
                </select>

                <select
                  value={bairroFilter}
                  onChange={(e) => setBairroFilter(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium max-w-[200px] cursor-pointer"
                >
                  <option value="">Todos os Bairros</option>
                  {BAIRROS_MACEIO.map((b) => (
                    <option key={b.nome} value={b.nome}>
                      {b.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botão de Exportar PDF e Contador */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-xs text-slate-500 font-medium hidden lg:inline">
                  Mostrando <strong>{filteredDonors.length}</strong> de {donors.length} doadoras
                </span>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('GRAFICOS')}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                  title="Ver gráficos comparativos de volume de leite e doadoras por bairro"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  <span className="hidden sm:inline">Ver Gráficos BLH</span>
                  <span className="sm:hidden">Gráficos</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isExportingPDF || filteredDonors.length === 0}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                  title="Exportar lista de doadoras cadastradas e seus status de triagem para PDF"
                >
                  {isExportingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Exportar PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tabela de Doadoras */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs">
                  <tr>
                    <th className="py-3 px-4">Protocolo</th>
                    <th className="py-3 px-4">Doadora & Contato</th>
                    <th className="py-3 px-4">Bebê / Tipo de Leite</th>
                    <th className="py-3 px-4">Bairro em Maceió</th>
                    <th className="py-3 px-4">Status rBLH</th>
                    <th className="py-3 px-4">Condições & Comprovante de Exames</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDonors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        Nenhuma doadora encontrada com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredDonors.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-sky-900">
                          {d.protocolo}
                          <span className="block text-[10px] text-slate-400 font-sans">
                            {new Date(d.dataCadastro).toLocaleDateString('pt-BR')}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{d.nomeCompleto}</div>
                          <div className="text-[11px] text-slate-500">
                            CPF: {d.cpf} • {d.telefone}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 flex items-center gap-1">
                            <Baby className="w-3.5 h-3.5 text-rose-500" />
                            {d.nomeBebe} ({d.idadeBebeDias} dias)
                          </div>
                          <div className="mt-0.5">{renderMilkBadge(d.tipoLeite)}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800">{d.endereco?.bairro || 'Maceió'}</span>
                          <span className="block text-[10px] text-slate-500 truncate max-w-[150px]">
                            {d.endereco?.logradouro}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {renderStatusBadge(d.status)}
                          {d.parecerMedico && (
                            <span className="block text-[10px] text-emerald-800 mt-1 font-medium">
                              ✓ Parecer assinado
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 max-w-[240px]">
                          {d.respostas.tomaMedicamentos ? (
                            <div className="text-xs text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200">
                              <strong>Remédio:</strong> {d.respostas.descricaoMedicamentos || 'Informado'}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500">Sem medicamentos restritivos</span>
                          )}

                          {/* Comprovante de Exames (Envio via WhatsApp) */}
                          {d.comprovanteExames ? (
                            <div 
                              onClick={() => {
                                setSelectedDonorForReview(d);
                                setMedReviewObs(d.respostas.descricaoMedicamentos ? `Uso avaliado de: ${d.respostas.descricaoMedicamentos}.` : 'Sorologias conferidas via comprovante digital.');
                              }}
                              className={`mt-1.5 text-[10px] px-2 py-1 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                                d.comprovanteExames.validadoEnfermagem 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100' 
                                  : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 animate-pulse'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {d.comprovanteExames.validadoEnfermagem ? '✅ Caderneta Validada' : '📄 Comprovante WhatsApp (Aguardando)'}
                              </span>
                            </div>
                          ) : (
                            <span className="block text-[10px] text-slate-400 mt-1">
                              {d.respostas.temCartaoPreNatal ? '🔍 Conferência na visita da van' : '⚠️ Requer sorologia domiciliar'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Botão Parecer Médico se estiver em análise ou para reavaliar */}
                            <button
                              onClick={() => {
                                setSelectedDonorForReview(d);
                                setMedReviewObs(d.respostas.descricaoMedicamentos ? `Uso avaliado de: ${d.respostas.descricaoMedicamentos}.` : (d.comprovanteExames ? 'Sorologias conferidas no comprovante digital (HIV, VDRL, HBsAg, Anti-HCV Não Reagentes).' : ''));
                              }}
                              title="Avaliar Exames e Parecer Clínico"
                              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                                d.status === 'EM_ANALISE' || (d.comprovanteExames && !d.comprovanteExames.validadoEnfermagem)
                                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Exames / Parecer</span>
                            </button>

                            {/* Botão WhatsApp */}
                            <button
                              onClick={() => openWhatsAppEnfermagem(d)}
                              title="Contatar via WhatsApp Institucional MESM"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* SUB-ABA 2: ROTAS DE COLETA POR BAIRROS DE MACEIÓ */}
        {/* ----------------------------------------------------------- */}
        {activeSubTab === 'ROTAS' && (
          <div className="p-4 sm:p-6 space-y-4">
            {/* Barra Superior: Filtros de Data, Setor e Status */}
            <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">Data da Rota:</label>
                    <input
                      type="date"
                      value={rotaDataFilter}
                      onChange={(e) => setRotaDataFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">Setor Geográfico de Maceió:</label>
                    <select
                      value={rotaRegiaoFilter}
                      onChange={(e) => setRotaRegiaoFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="TODAS">Todos os Setores</option>
                      <option value="ORLA_BAIXA">Setor 1: Orla / Baixa (Ponta Verde, Pajuçara)</option>
                      <option value="FAROL_CENTRO">Setor 2: Farol / Centro (Farol, Gruta)</option>
                      <option value="TABULEIRO_ALTA">Setor 3: Tabuleiro / Parte Alta</option>
                      <option value="LITORAL_SUL_TRAPICHE">Setor 4: Litoral Sul / Trapiche (MESM)</option>
                      <option value="NORTE_JACARECICA">Setor 5: Norte / Jacarecica</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setShowCutoffSettingsModal(true)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Ajustar horários limite das rotas"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Limites: Manhã {cutoffManha} | Tarde {cutoffTarde}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Manifesto</span>
                  </button>
                </div>
              </div>

              {/* Pílulas de Filtro de Status com Indicador de Atraso */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setRotaStatusFilter('TODOS')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    rotaStatusFilter === 'TODOS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Todas ({appointments.length})
                </button>

                <button
                  type="button"
                  onClick={() => setRotaStatusFilter('ATRASADAS')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    rotaStatusFilter === 'ATRASADAS'
                      ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-600/30'
                      : overdueAppointments.length > 0
                      ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 font-black'
                      : 'bg-white text-slate-500 border border-slate-200 opacity-60'
                  }`}
                >
                  <AlertTriangle className={`w-3.5 h-3.5 ${overdueAppointments.length > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
                  <span>Atrasadas pós-limite</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    rotaStatusFilter === 'ATRASADAS'
                      ? 'bg-white text-rose-700 font-black'
                      : overdueAppointments.length > 0
                      ? 'bg-rose-600 text-white font-black animate-pulse'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {overdueAppointments.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRotaStatusFilter('PENDENTE')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    rotaStatusFilter === 'PENDENTE'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Pendentes ({appointments.filter(a => a.status === 'PENDENTE').length})
                </button>

                <button
                  type="button"
                  onClick={() => setRotaStatusFilter('EM_ROTA')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    rotaStatusFilter === 'EM_ROTA'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Em Rota ({appointments.filter(a => a.status === 'EM_ROTA').length})
                </button>

                <button
                  type="button"
                  onClick={() => setRotaStatusFilter('COLETADO')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    rotaStatusFilter === 'COLETADO'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Coletadas ({appointments.filter(a => a.status === 'COLETADO').length})
                </button>
              </div>
            </div>

            {/* Listagem de Paradas da Rota */}
            <div className="space-y-3">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                  <Truck className="w-9 h-9 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Nenhuma coleta encontrada com os filtros selecionados.</p>
                  <p className="text-xs text-slate-500">
                    {rotaStatusFilter === 'ATRASADAS' 
                      ? '🎉 Excelente! Nenhuma rota de coleta está pendente após o horário limite estabelecido.'
                      : 'Altere os filtros de data, setor ou status para visualizar os agendamentos.'}
                  </p>
                </div>
              ) : (
                filteredAppointments.map((apt, index) => {
                  const overdueInfo = checkRouteOverdue(apt);
                  const matchedCollector = collectors.find(c => c.id === apt.coletadorId || c.nome === apt.coletadorNome);

                  return (
                    <div
                      key={apt.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        overdueInfo.isOverdue
                          ? 'bg-rose-50/50 border-rose-400 ring-2 ring-rose-500/20 shadow-md'
                          : apt.status === 'COLETADO'
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-white border-slate-200 shadow-2xs hover:border-sky-300'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            overdueInfo.isOverdue
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-sky-100 text-sky-800'
                          }`}>
                            #{index + 1}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            {/* Alerta de Atraso em Destaque */}
                            {overdueInfo.isOverdue && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black tracking-wide shadow-2xs animate-pulse">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>ATRASO PÓS-HORÁRIO LIMITE ({overdueInfo.delayText} • Limite: {overdueInfo.cutoffTime})</span>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-slate-900 text-sm sm:text-base">{apt.nomeDoadora}</span>
                              <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                                {apt.protocolo}
                              </span>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                apt.status === 'COLETADO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : apt.status === 'EM_ROTA'
                                  ? 'bg-sky-100 text-sky-800'
                                  : overdueInfo.isOverdue
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 font-black'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {overdueInfo.isOverdue ? `PENDENTE (ATRASADA)` : apt.status}
                              </span>
                              {apt.coletadorNome && (
                                <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                                  🚐 {apt.coletadorNome}
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                              <span>📍 <strong>Bairro:</strong> {apt.bairro} ({getNomeRegiao(apt.regiaoLogistica)})</span>
                              <span>🕒 <strong>Turno:</strong> {apt.turno === 'MANHA' ? `Manhã (Limite: ${cutoffManha})` : `Tarde (Limite: ${cutoffTarde})`}</span>
                              <span>📦 <strong>Motivo:</strong> {apt.motivo} (~{apt.quantidadeFrascosEstimada} frascos)</span>
                            </div>

                            <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200/80 mt-1">
                              <strong>Endereço:</strong> {apt.enderecoCompleto}
                              {apt.pontoReferencia && (
                                <span className="block text-slate-500 font-medium mt-0.5">
                                  Ref.: {apt.pontoReferencia}
                                </span>
                              )}
                            </div>

                            {/* Se já foi coletado, mostra dados da coleta */}
                            {apt.dadosColeta && (
                              <div className="mt-2 text-xs bg-emerald-50 text-emerald-950 p-2.5 rounded-xl border border-emerald-200 flex flex-wrap gap-x-4 gap-y-1">
                                <span>✅ <strong>Frascos Coletados:</strong> {apt.dadosColeta.frascosColetados}</span>
                                <span>💧 <strong>Volume Aprox.:</strong> {apt.dadosColeta.volumeAproximadoMl} mL</span>
                                <span>❄️ <strong>Temperatura Caixa:</strong> {apt.dadosColeta.temperaturaTermicaC}°C</span>
                                <span>🫙 <strong>Frascos Entregues:</strong> {apt.dadosColeta.frascosEntregues}</span>
                                {apt.dadosColeta.observacoes && (
                                  <span className="w-full text-emerald-800 italic">"{apt.dadosColeta.observacoes}"</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ações da Rota */}
                        <div className="flex lg:flex-col gap-2 shrink-0 self-end lg:self-center">
                          {overdueInfo.isOverdue && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  const phone = matchedCollector?.telefone || '(82) 99341-8899';
                                  const limpo = phone.replace(/\D/g, '');
                                  const msg = encodeURIComponent(`URGENTE BLH SANTA MÔNICA: Identificamos que a coleta de ${apt.nomeDoadora} (${apt.protocolo}) no bairro ${apt.bairro} está pendente após o horário limite (${overdueInfo.cutoffTime}). Favor confirmar status da coleta e temperatura térmica.`);
                                  window.open(`https://wa.me/55${limpo}?text=${msg}`, '_blank');
                                }}
                                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                                title="Enviar alerta urgente para o motorista da van"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Alertar Van</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAptForQuickBaixa(apt);
                                  setQuickBaixaFrascos(apt.quantidadeFrascosEstimada || 2);
                                  setQuickBaixaVolumeMl((apt.quantidadeFrascosEstimada || 2) * 200);
                                  setQuickBaixaTemp(-12);
                                  setQuickBaixaObs(`Baixa emergencial confirmada via coordenação para ${apt.nomeDoadora}.`);
                                }}
                                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                                title="Registrar baixa de coleta pelo painel hospitalar"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Baixa Rápida</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const limpo = apt.telefone.replace(/\D/g, '');
                              window.open(`https://wa.me/55${limpo}?text=Olá ${apt.nomeDoadora}, a van do Banco de Leite da Maternidade Santa Mônica está a caminho para sua coleta!`, '_blank');
                            }}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Avisar Mãe</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* SUB-ABA 3: GESTÃO DE COLETADORES */}
        {/* ----------------------------------------------------------- */}
        {activeSubTab === 'COLETADORES' && (
          <div className="p-3.5 sm:p-6 space-y-4">
            {/* Header da Sub-Aba com Quebra Responsiva */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Equipe Operacional MESM / UNCISAL</span>
                </div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                  Profissionais de Coleta Credenciados
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Equipe autorizada a pilotar as vans refrigeradas e realizar coletas domiciliares na capital alagoana.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewCollectorModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Credenciar Novo Coletador</span>
              </button>
            </div>

            {/* Cards de Resumo Operacional */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Credenciados</span>
                  <span className="text-base font-black text-slate-900 font-mono">{collectors.length}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Vans em Operação</span>
                  <span className="text-base font-black text-slate-900 font-mono">{collectors.filter(c => c.ativo).length}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Segurança & PIN</span>
                  <span className="text-xs font-bold text-slate-800">Acesso Mobile Ativo</span>
                </div>
              </div>
            </div>

            {/* Grid Responsivo de Coletadores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {collectors.map((c) => (
                <div 
                  key={c.id} 
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-xs transition-shadow space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Header do Card */}
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-sky-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {c.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">
                            {c.nome}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            Matrícula UNCISAL: <strong className="text-slate-800">{c.matricula}</strong>
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                        {c.ativo ? 'Credenciado Ativo' : 'Inativo'}
                      </span>
                    </div>

                    {/* Detalhes do Veículo e Comunicação */}
                    <div className="text-xs text-slate-700 space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-start gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="break-words font-medium">
                          <strong>Veículo:</strong> {c.veiculo}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-mono font-medium truncate">{c.telefone}</span>
                        </div>
                        <a
                          href={`tel:${c.telefone.replace(/\D/g, '')}`}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors shrink-0"
                        >
                          Ligar
                        </a>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span className="text-slate-600 text-[11px]">PIN da Van:</span>
                        </div>
                        <span className="font-mono font-black text-xs text-sky-950 bg-sky-100/80 px-2 py-0.5 rounded-md border border-sky-200">
                          {c.pin}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 text-right pt-1">
                    Autorizado para coleta conforme RDC 171/2006 ANVISA
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* SUB-ABA 4: GRÁFICOS & INDICADORES COMPARATIVOS (RECHARTS) */}
        {/* ----------------------------------------------------------- */}
        {activeSubTab === 'GRAFICOS' && (
          <div className="p-3.5 sm:p-6 space-y-6">
            {/* Header da Aba de Gráficos */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-700" />
                    Epidemiologia & Produção BLH
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                    MESM / UNCISAL • RDC ANVISA 171/2006
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-black text-slate-900 mt-1">
                  Gráficos Comparativos de Coleta & Distribuição Territorial
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Visualização da evolução mensal do volume de leite pasteurizado e do número de novas doadoras por bairro de Maceió.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 inline-flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Meta UTIN: 5,0 L/mês
                </span>
              </div>
            </div>

            {/* Painel de Métricas Rápidas dos Gráficos */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
                  <span>Volume Out/26</span>
                  <Droplets className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-900 mt-1">5,8 L</div>
                <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  <span><strong>+16%</strong> acima da meta</span>
                </div>
              </div>

              <div className="bg-sky-50/50 border border-sky-200/80 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-sky-800 text-xs font-bold">
                  <span>Média Semestral</span>
                  <TrendingUp className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-2xl font-black text-sky-900 mt-1">4,75 L</div>
                <div className="text-[11px] text-sky-700 mt-0.5">
                  <span>28,5 L coletados no semestre</span>
                </div>
              </div>

              <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-amber-900 text-xs font-bold">
                  <span>Prematuros Atendidos</span>
                  <Baby className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-950 mt-1">46 bebês</div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  <span>100% da demanda UTIN suprida</span>
                </div>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-indigo-900 text-xs font-bold">
                  <span>Bairros em Maceió</span>
                  <MapPin className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-indigo-950 mt-1">12 bairros</div>
                <div className="text-[11px] text-indigo-700 mt-0.5">
                  <span>Cobertura ativa de vans</span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* GRÁFICO 1: EVOLUÇÃO MENSAL DO VOLUME DE LEITE COLETADO */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Droplets className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-slate-900">
                      1. Evolução Mensal do Volume de Leite Coletado (2026)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Comparativo entre volume real coletado pela van e a meta hospitalar estipulada para a UTIN MESM.
                    </p>
                  </div>
                </div>

                {/* Toggle de Unidade (Litros vs mL) */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setChartVolumeUnit('LITROS')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      chartVolumeUnit === 'LITROS'
                        ? 'bg-white text-emerald-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Litros (L)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartVolumeUnit('ML')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      chartVolumeUnit === 'ML'
                        ? 'bg-white text-emerald-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mililitros (mL)
                  </button>
                </div>
              </div>

              {/* Área do Gráfico Recharts */}
              <div className="w-full h-[320px] pt-2">
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={monthlyMilkData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="mes" 
                      stroke="#64748b" 
                      tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      tick={{ fontSize: 12, fill: '#475569' }} 
                      unit={chartVolumeUnit === 'LITROS' ? ' L' : ' mL'}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip content={<CustomVolumeTooltip unit={chartVolumeUnit} />} />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={chartVolumeUnit === 'LITROS' ? 'volumeL' : 'volumeMl'} 
                      name={chartVolumeUnit === 'LITROS' ? 'Volume Coletado (Litros)' : 'Volume Coletado (mL)'} 
                      stroke="#059669" 
                      strokeWidth={3} 
                      fill="url(#colorVolume)" 
                      activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2, fill: '#ffffff' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={chartVolumeUnit === 'LITROS' ? 'metaL' : 'metaMl'} 
                      name={chartVolumeUnit === 'LITROS' ? 'Meta Mensal UTIN (5,0 L)' : 'Meta Mensal UTIN (5.000 mL)'} 
                      stroke="#f59e0b" 
                      strokeWidth={2.5} 
                      strokeDasharray="5 5" 
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Fracionamento Clínico de Leite */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Fracionamento Clínico do Volume Coletado (Outubro/2026):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                    <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
                      <span>🟡 Colostro (&lt; 7 dias)</span>
                      <span>1.250 mL</span>
                    </div>
                    <p className="text-[11px] text-amber-800 mt-1 leading-tight">
                      Nutrição precoce exclusiva para prematuros de extremo baixo peso (&lt; 1.000g).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/80">
                    <div className="flex items-center justify-between text-xs text-orange-900 font-bold">
                      <span>🟠 Transição (8 a 14 dias)</span>
                      <span>1.850 mL</span>
                    </div>
                    <p className="text-[11px] text-orange-800 mt-1 leading-tight">
                      Rico em lipídios e proteínas bioativas para evolução enteral dos recém-nascidos.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/80">
                    <div className="flex items-center justify-between text-xs text-sky-900 font-bold">
                      <span>🔵 Leite Maduro (15+ dias)</span>
                      <span>2.700 mL</span>
                    </div>
                    <p className="text-[11px] text-sky-800 mt-1 leading-tight">
                      Manutenção calórica e ganho de peso contínuo para alta hospitalar na maternidade.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* GRÁFICO 2: NÚMERO DE NOVAS DOADORAS POR BAIRRO DE MACEIÓ */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-sky-700" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-slate-900">
                      2. Número de Novas Doadoras por Bairro de Maceió
                    </h4>
                    <p className="text-xs text-slate-500">
                      Distribuição geográfica das mães cadastradas agrupadas por status de triagem clínica.
                    </p>
                  </div>
                </div>

                {/* Filtros do Gráfico de Bairros */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                  <select
                    value={chartNeighborhoodRegion}
                    onChange={(e) => setChartNeighborhoodRegion(e.target.value)}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 cursor-pointer focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="TODAS">Todas as Regiões</option>
                    <option value="LITORAL_SUL_TRAPICHE">Litoral Sul (MESM)</option>
                    <option value="TABULEIRO_ALTA">Tabuleiro / Parte Alta</option>
                    <option value="ORLA_BAIXA">Orla / Baixa</option>
                    <option value="FAROL_CENTRO">Farol / Centro</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setChartSortMode(chartSortMode === 'TOTAL' ? 'APTAS' : 'TOTAL')}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  >
                    {chartSortMode === 'TOTAL' ? 'Classificar: Total' : 'Classificar: Aptas'}
                  </button>
                </div>
              </div>

              {/* Área do Gráfico de Barras Empilhadas Recharts */}
              <div className="w-full h-[360px] pt-2">
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={neighborhoodDonorsData} margin={{ top: 10, right: 15, left: -10, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="bairro" 
                      stroke="#64748b" 
                      interval={0} 
                      angle={-25} 
                      textAnchor="end" 
                      height={65}
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      tick={{ fontSize: 12, fill: '#475569' }} 
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip content={<CustomNeighborhoodTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                    />
                    <Bar 
                      dataKey="aptas" 
                      name="Doadoras Aptas (Liberadas)" 
                      fill="#10b981" 
                      stackId="a" 
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar 
                      dataKey="emAnalise" 
                      name="Em Análise Médica" 
                      fill="#f59e0b" 
                      stackId="a" 
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar 
                      dataKey="inaptas" 
                      name="Inaptas Temporárias" 
                      fill="#f43f5e" 
                      stackId="a" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Indicadores Territoriais & Rotas Estratégicas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Polo 1: Trapiche da Barra</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Sede da MESM. Alta concentração de mães com coletas diárias rápidas e entrega imediata ao laboratório de pasteurização.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <span>Polo 2: Parte Alta (Benedito Bentes)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Maior contingente populacional de Maceió. Rota programada da van às terças e quintas com busca de até 8 frascos por viagem.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    <span>Polo 3: Orla & Farol (Ponta Verde / Jatiúca)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Alta taxa de aprovação sorológica direta (90% aptas no primeiro parecer). Rota expressa da van às segundas e quartas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* SUB-ABA 5: LOGS DE ATIVIDADE & RASTREABILIDADE ANVISA */}
        {/* ----------------------------------------------------------- */}
        {activeSubTab === 'LOGS' && (
          <div className="p-3.5 sm:p-6">
            <ActivityLogsView loggedStaff={loggedStaff} />
          </div>
        )}
      </div>

      {/* Modal Parecer Médico / Enfermagem */}
      {selectedDonorForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full my-auto shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Fixo */}
            <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0 bg-white z-10">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Stethoscope className="w-3 h-3 text-amber-700" />
                    Parecer Clínico Oficial BLH
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-600 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                    {selectedDonorForReview.protocolo}
                  </span>
                </div>
                <h3 className="text-sm sm:text-lg font-black text-slate-900 mt-1 leading-snug truncate">
                  Avaliação: {selectedDonorForReview.nomeCompleto}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDonorForReview(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer font-bold text-sm"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
              {/* Informações da triagem */}
              <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3 sm:p-3.5 text-xs text-amber-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Medicamentos / Alertas na Triagem:</span>
                </div>
                <p className="font-semibold text-slate-800 pl-5 text-[11px] sm:text-xs leading-relaxed">
                  {selectedDonorForReview.respostas.descricaoMedicamentos || 'Nenhum medicamento específico relatado.'}
                </p>
                <div className="text-[10px] sm:text-[11px] text-amber-800/90 pt-1 border-t border-amber-200/60 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>👶 Bebê: <strong>{selectedDonorForReview.nomeBebe}</strong> ({selectedDonorForReview.idadeBebeDias} dias)</span>
                  <span>•</span>
                  <span>🍼 Tipo de Leite: <strong>{selectedDonorForReview.tipoLeite}</strong></span>
                </div>
              </div>

              {/* Card de Comprovante Digital de Exames */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <FileText className="w-4 h-4 text-sky-700 shrink-0" />
                    <span>Comprovante de Exames (Envio via WhatsApp)</span>
                  </div>
                  {selectedDonorForReview.comprovanteExames?.validadoEnfermagem ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Validado pela Enfermagem
                    </span>
                  ) : selectedDonorForReview.comprovanteExames ? (
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse shrink-0">
                      <Clock className="w-3 h-3" /> Pendente de Validação
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full shrink-0">
                      Sem Envio Digital
                    </span>
                  )}
                </div>

                {selectedDonorForReview.comprovanteExames ? (
                  <div className="space-y-2 bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      {selectedDonorForReview.comprovanteExames.tipo === 'FOTO_CADERNETA' ? (
                        <div 
                          onClick={() => setZoomImageUrl(selectedDonorForReview.comprovanteExames!.arquivoUrl)}
                          className="relative w-16 h-14 sm:w-20 sm:h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer group shrink-0"
                        >
                          <img 
                            src={selectedDonorForReview.comprovanteExames.arquivoUrl} 
                            alt="Caderneta de Exames" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-14 sm:w-20 sm:h-16 rounded-lg bg-sky-50 border border-sky-200 flex flex-col items-center justify-center text-sky-800 shrink-0">
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span className="text-[9px] font-bold">PDF</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0 text-xs">
                        <div className="font-bold text-slate-900 truncate">
                          {selectedDonorForReview.comprovanteExames.nomeArquivo}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                          Enviado em: {new Date(selectedDonorForReview.comprovanteExames.dataEnvio).toLocaleString('pt-BR')}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          {selectedDonorForReview.comprovanteExames.tipo === 'FOTO_CADERNETA' ? 'Foto da Caderneta de Pré-Natal' : 'Laudo PDF de Sorologias'}
                        </div>
                      </div>
                    </div>

                    {/* Detalhes da Validação */}
                    {selectedDonorForReview.comprovanteExames.validadoEnfermagem ? (
                      <div className="p-2 bg-emerald-50 text-emerald-900 rounded-lg text-[10px] sm:text-[11px] border border-emerald-200">
                        <strong>Validado por:</strong> {selectedDonorForReview.comprovanteExames.validadoPor} em {new Date(selectedDonorForReview.comprovanteExames.dataValidacao || '').toLocaleDateString('pt-BR')}.
                        {selectedDonorForReview.comprovanteExames.observacoes && (
                          <div className="text-emerald-800 italic mt-0.5">"{selectedDonorForReview.comprovanteExames.observacoes}"</div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <div className="text-[11px] text-amber-900 font-medium">
                          Conferir sorologias: HIV, VDRL, HBsAg e Anti-HCV Não Reagentes:
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={isValidatingComprovante}
                            onClick={() => handleValidateComprovante(selectedDonorForReview.id, true)}
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer text-center"
                          >
                            {isValidatingComprovante ? 'Validando...' : '✅ Aprovar Exames'}
                          </button>
                          <button
                            type="button"
                            disabled={isValidatingComprovante}
                            onClick={() => handleValidateComprovante(selectedDonorForReview.id, false)}
                            className="flex-1 sm:flex-none px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer text-center"
                          >
                            Recusar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] sm:text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                    {selectedDonorForReview.respostas.temCartaoPreNatal 
                      ? 'A doadora possui a Caderneta física e apresentará ao coletador no momento da visita domiciliar.'
                      : 'A doadora não possui os exames em mãos. A van coletora realizará a coleta de sangue em domicílio para processamento na UNCISAL.'}
                  </div>
                )}
              </div>

              {/* Formulário do Parecer Clínico */}
              <form id="medical-review-form" onSubmit={handleSaveMedicalReview} className="space-y-3.5 sm:space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Decisão Clínica:
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setMedReviewDecisao('APROVADA')}
                      className={`min-h-[42px] py-2 px-2.5 sm:px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                        medReviewDecisao === 'APROVADA'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-600/30'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>🟢 Aprovar Doadora</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedReviewDecisao('REJEITADA')}
                      className={`min-h-[42px] py-2 px-2.5 sm:px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                        medReviewDecisao === 'REJEITADA'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-600/30'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>🔴 Suspender Doação</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Justificativa Clínica / Farmacológica:
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={medReviewObs}
                    onChange={(e) => setMedReviewObs(e.target.value)}
                    placeholder="Ex: Medicamento com baixo índice de excreção no leite materno. Aprovada para doação de leite aos prematuros da maternidade."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Médico / Farmacêutico:
                    </label>
                    <input
                      type="text"
                      value={medReviewNome}
                      onChange={(e) => setMedReviewNome(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      CRM / Matrícula UNCISAL:
                    </label>
                    <input
                      type="text"
                      value={medReviewMatricula}
                      onChange={(e) => setMedReviewMatricula(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-semibold"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Footer com botões lado a lado */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDonorForReview(null)}
                className="py-2 px-4 text-xs text-slate-600 hover:text-slate-800 font-semibold rounded-xl hover:bg-slate-200/60 transition-colors text-center cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="medical-review-form"
                disabled={isSavingReview}
                className="py-2 px-5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSavingReview ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gravando...</span>
                  </>
                ) : (
                  <span>Salvar e Atualizar Status</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Coletador */}
      {showNewCollectorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex min-h-full items-center justify-center">
          <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in my-auto box-border">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full inline-block mb-1">
                  MESM • UNCISAL
                </span>
                <h3 className="text-base font-bold text-slate-900">Novo Coletador Credenciado</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCollectorModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors font-bold text-sm cursor-pointer"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCollector} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Rocha"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 box-border"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Matrícula UNCISAL:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 48291-0"
                    value={newColMatricula}
                    onChange={(e) => setNewColMatricula(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 box-border"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN da Van (4 dígitos):</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="1234"
                    value={newColPin}
                    onChange={(e) => setNewColPin(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 box-border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone WhatsApp:</label>
                <input
                  type="tel"
                  required
                  placeholder="(82) 99341-8899"
                  value={newColPhone}
                  onChange={(e) => setNewColPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 box-border"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  🔒 Cada profissional deve possuir telefone único no credenciamento.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Veículo / Placa:</label>
                <input
                  type="text"
                  required
                  value={newColVehicle}
                  onChange={(e) => setNewColVehicle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 box-border"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewCollectorModal(false)}
                  className="py-2 px-4 text-xs text-slate-600 hover:text-slate-800 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
                >
                  Salvar Credenciamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Zoom do Comprovante de Exames */}
      {zoomImageUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-2.5 sm:p-4 animate-in fade-in">
          <div className="max-w-2xl w-full bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 space-y-3 shadow-2xl border border-slate-200 max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                <FileText className="w-4 h-4 text-sky-700 shrink-0" />
                <span className="truncate">Caderneta da Gestante • Verificação BLH/MESM</span>
              </span>
              <button
                type="button"
                onClick={() => setZoomImageUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer font-bold text-sm shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden rounded-xl bg-slate-950 p-1">
              <img 
                src={zoomImageUrl} 
                alt="Comprovante de Exames" 
                className="max-h-[58vh] sm:max-h-[68vh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 pt-1 shrink-0">
              <span className="text-[11px] text-center sm:text-left">Norma RDC 171/2006 ANVISA • Doadora Santa Mônica</span>
              <button
                type="button"
                onClick={() => setZoomImageUrl(null)}
                className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer text-center"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Troca de Senha Hospitalar */}
      {renderChangePasswordModal()}

      {/* Modal 1: Auditoria de Rotas Atrasadas & Alerta de Cadeia de Frio */}
      {showOverdueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex min-h-full items-center justify-center animate-in fade-in">
          <div className="relative bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-rose-200 space-y-5 my-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 border border-rose-200">
                  <AlertTriangle className="w-6 h-6 text-rose-600 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      RDC ANVISA nº 171/2006 • Art. 21
                    </span>
                    <span className="text-xs text-slate-500">
                      Horários Limite: Manhã ({cutoffManha}) • Tarde ({cutoffTarde})
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">
                    Rotas Pendentes de Finalização Pós-Horário Limite ({overdueAppointments.length})
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowOverdueModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Alerta Sanitário da Cadeia de Frio</span>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  O leite humano cru congelado deve ser mantido rigorosamente em caixas isotérmicas abaixo de <strong>-10°C</strong>. Contate imediatamente os coletadores para confirmar a integridade térmica dos frascos e o retorno à MESM.
                </p>
              </div>
            </div>

            {/* Lista das Rotas Atrasadas */}
            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {overdueAppointments.map((apt) => {
                const overdueInfo = checkRouteOverdue(apt);
                const matchedCollector = collectors.find(c => c.id === apt.coletadorId || c.nome === apt.coletadorNome);

                return (
                  <div key={apt.id} className="p-4 rounded-2xl bg-rose-50/40 border border-rose-300 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{apt.nomeDoadora}</span>
                          <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.2 rounded border border-sky-200">
                            {apt.protocolo}
                          </span>
                          <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                            {overdueInfo.delayText}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          📍 {apt.bairro} ({getNomeRegiao(apt.regiaoLogistica)}) • {apt.turno === 'MANHA' ? 'Turno Manhã' : 'Turno Tarde'} (~{apt.quantidadeFrascosEstimada} frascos)
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {apt.enderecoCompleto}
                        </div>
                      </div>

                      {/* Motorista Designado */}
                      <div className="text-right sm:text-right shrink-0 bg-white/80 p-2.5 rounded-xl border border-slate-200 text-xs">
                        <span className="text-[10px] text-slate-400 block font-semibold">Motorista / Van:</span>
                        <strong className="text-slate-900 block">{apt.coletadorNome || 'Coletador em Rota'}</strong>
                        <span className="text-[11px] font-mono text-slate-600">{matchedCollector?.telefone || '(82) 99341-8899'}</span>
                      </div>
                    </div>

                    {/* Botões de Ação Imediata */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200/60 flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          const phone = matchedCollector?.telefone || '(82) 99341-8899';
                          const limpo = phone.replace(/\D/g, '');
                          const msg = encodeURIComponent(`URGENTE BLH SANTA MÔNICA: A coleta de ${apt.nomeDoadora} (${apt.protocolo}) no bairro ${apt.bairro} está pendente após o horário limite (${overdueInfo.cutoffTime}). Favor informar status e temperatura.`);
                          window.open(`https://wa.me/55${limpo}?text=${msg}`, '_blank');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Motorista</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowOverdueModal(false);
                          setSelectedAptForQuickBaixa(apt);
                          setQuickBaixaFrascos(apt.quantidadeFrascosEstimada || 2);
                          setQuickBaixaVolumeMl((apt.quantidadeFrascosEstimada || 2) * 200);
                          setQuickBaixaTemp(-12);
                          setQuickBaixaObs(`Baixa emergencial confirmada via coordenação para ${apt.nomeDoadora}.`);
                        }}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Dar Baixa no Painel</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Total: {overdueAppointments.length} rota(s) em atraso
              </span>
              <button
                type="button"
                onClick={() => setShowOverdueModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Configurar Horários Limite das Rotas */}
      {showCutoffSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto p-4 flex min-h-full items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-800 border border-sky-200 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Horários Limite das Rotas</h3>
                  <p className="text-[11px] text-slate-500">Gatilhos automáticos de alerta de atraso</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCutoffSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  Horário Limite - Turno Manhã (Horário máximo de finalização):
                </label>
                <input
                  type="time"
                  value={cutoffManha}
                  onChange={(e) => setCutoffManha(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-sky-500"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Sugestões rápidas:</span>
                  {['11:30', '12:00', '12:30', '13:00'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCutoffManha(t)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        cutoffManha === t ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  Horário Limite - Turno Tarde (Horário máximo de finalização):
                </label>
                <input
                  type="time"
                  value={cutoffTarde}
                  onChange={(e) => setCutoffTarde(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-sky-500"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Sugestões rápidas:</span>
                  {['16:30', '17:00', '17:30', '18:00'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCutoffTarde(t)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        cutoffTarde === t ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-600 leading-relaxed border border-slate-200">
              💡 Qualquer rota com status <strong>PENDENTE</strong> ou <strong>EM_ROTA</strong> após o horário configurado acionará imediatamente o alerta visual pulsante e o destaque no painel.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCutoffSettingsModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Baixa Emergencial de Coleta pelo Painel Hospitalar */}
      {selectedAptForQuickBaixa && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs overflow-y-auto p-4 flex min-h-full items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-emerald-200 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Baixa Emergencial de Coleta</h3>
                  <p className="text-[11px] text-slate-500">{selectedAptForQuickBaixa.protocolo} • {selectedAptForQuickBaixa.nomeDoadora}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAptForQuickBaixa(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickBaixaSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Frascos Recolhidos:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={20}
                    value={quickBaixaFrascos}
                    onChange={(e) => {
                      const f = parseInt(e.target.value, 10) || 1;
                      setQuickBaixaFrascos(f);
                      setQuickBaixaVolumeMl(f * 200);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Volume Total (mL):</label>
                  <input
                    type="number"
                    required
                    step={50}
                    value={quickBaixaVolumeMl}
                    onChange={(e) => setQuickBaixaVolumeMl(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Temperatura Térmica (°C):</label>
                <input
                  type="number"
                  step={0.5}
                  value={quickBaixaTemp}
                  onChange={(e) => setQuickBaixaTemp(parseFloat(e.target.value) || -12)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Norma ANVISA: manter abaixo de -10°C</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações da Coleta:</label>
                <textarea
                  rows={2}
                  value={quickBaixaObs}
                  onChange={(e) => setQuickBaixaObs(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAptForQuickBaixa(null)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuickBaixa}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingQuickBaixa ? 'Gravando...' : 'Confirmar Baixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
