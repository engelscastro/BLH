import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Phone, 
  Info, 
  RotateCcw, 
  Check, 
  CheckCheck, 
  Baby, 
  Heart, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  AlertCircle,
  FileCheck,
  Package,
  ExternalLink,
  Download,
  Wifi,
  Battery,
  Signal,
  MessageCircle,
  Stethoscope,
  Search,
  Clock,
  CheckCircle2,
  Camera,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Eye,
  UploadCloud,
  Navigation,
  Building2,
  Home,
  MapPinOff,
  LocateFixed,
  User,
  ClipboardCheck,
  Loader2,
  Copy
} from 'lucide-react';
import { RespostasTriagem, ResultadoTriagem, Doadora, AgendamentoColeta, MotivoColeta, TurnoColeta, ComprovanteExames } from '../types/blh';
import { avaliarTriagemClinica, classificarTipoLeite, calcularIdadeBebeDias, parseDataNascimentoBebe } from '../utils/screeningLogic';
import { BAIRROS_MACEIO, getRegiaoPorBairro } from '../utils/maceioNeighborhoods';
import { api } from '../services/api';

type StepType = 
  | 'INITIAL_MENU'
  | 'QUESTION_P1'
  | 'QUESTION_P2'
  | 'QUESTION_P3_DATE'
  | 'QUESTION_P4_CARD'
  | 'QUESTION_P5_SEROLOGY'
  | 'QUESTION_P6_P7_HABITS'
  | 'QUESTION_P8_P9_PROCEDURES'
  | 'QUESTION_P10_P11_MEDS'
  | 'RESULT_SCREENING'
  // Conversational Form Steps:
  | 'FORM_NAME'
  | 'FORM_PHONE'
  | 'FORM_CPF'
  | 'FORM_BABY_NAME'
  | 'FORM_NEIGHBORHOOD'
  | 'FORM_STREET_NUMBER'
  | 'FORM_LANDMARK'
  | 'FORM_PURPOSE_AND_BOTTLES'
  | 'FORM_BOTTLES_COUNT'
  | 'FORM_DATE_SHIFT'
  | 'FORM_CONFIRM_SUMMARY'
  | 'PROTOCOL_COMPLETED'
  // Protocol Lookup & Dedicated Flows:
  | 'LOOKUP_INPUT'
  | 'FLOW_GET_BOTTLES_CHOICE'
  | 'FLOW_RETURN_MILK_CHOICE'
  | 'ACTION_LOOKUP_INPUT'
  | 'EXISTING_DONOR_ACTION_BOTTLES'
  | 'EXISTING_DONOR_NEED_REPLACEMENT'
  | 'EXISTING_DONOR_ACTION_SHIFT';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  stepType?: StepType;
  options?: { label: string; value: any; icon?: string }[];
  data?: any;
  attachment?: {
    type: 'image' | 'pdf';
    url: string;
    name: string;
    caption?: string;
    tamanhoKb?: number;
  };
}

interface PhoneChatbotSimulatorProps {
  onOpenGuidelines?: () => void;
  onOpenAdmin?: () => void;
  onOpenCollector?: () => void;
}

export const PhoneChatbotSimulator: React.FC<PhoneChatbotSimulatorProps> = ({ 
  onOpenGuidelines, 
  onOpenAdmin,
  onOpenCollector
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [activeStep, setActiveStep] = useState<StepType>('INITIAL_MENU');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Comprovante Digital de Exames (Envio via WhatsApp)
  const [comprovanteAnexado, setComprovanteAnexado] = useState<ComprovanteExames | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState<boolean>(false);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Respostas da triagem clínica
  const [respostas, setRespostas] = useState<RespostasTriagem>({
    amamentandoProprioFilho: true,
    bebeMamaBemETemSobra: true,
    dataNascimentoBebe: '',
    temCartaoPreNatal: true,
    sorologiaPositiva: false,
    tabagismo: 'NAO',
    alcoolDrogas: 'NUNCA',
    transfusao12Meses: false,
    tatuagem12Meses: false,
    tomaMedicamentos: false,
    descricaoMedicamentos: '',
    sintomasInfecciososOuLesao: false,
    descricaoSintomas: ''
  });

  const [resultado, setResultado] = useState<ResultadoTriagem | null>(null);

  // Dados Cadastrais coletados no chat:
  const [nomeMae, setNomeMae] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [nomeBebe, setNomeBebe] = useState('');
  const [selectedDateP3, setSelectedDateP3] = useState<string>('');
  const [bairro, setBairro] = useState('Ponta Verde');
  const [cep, setCep] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<{ tipo: 'sucesso' | 'erro' | 'aviso'; mensagem: string } | null>(null);
  const [logradouro, setLogradouro] = useState('');
  const [numeroResidencia, setNumeroResidencia] = useState('');
  const [complementoApto, setComplementoApto] = useState('');
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [mapSearchQuery, setMapSearchQuery] = useState<string>('');
  const [pontoReferencia, setPontoReferencia] = useState('');
  const [motivoColeta, setMotivoColeta] = useState<MotivoColeta>('AMBOS');
  const [qtdFrascos, setQtdFrascos] = useState<number>(2);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [dataColeta, setDataColeta] = useState<string>(tomorrowStr);
  const [turnoColeta, setTurnoColeta] = useState<TurnoColeta>('MANHA');

  // Controle de fluxos dedicados para pegar frascos e devolver leite:
  const [actionType, setActionType] = useState<'DOAR' | 'PEGAR_FRASCOS' | 'DEVOLVER_LEITE' | 'CONSULTA'>('DOAR');
  const [existingDonorData, setExistingDonorData] = useState<any | null>(null);
  const [existingNeedReplacement, setExistingNeedReplacement] = useState<boolean>(true);
  const [lookupInputValue, setLookupInputValue] = useState<string>('');

  // Relógio do celular
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, []);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getCurrentTimeString = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Iniciar conversa
  useEffect(() => {
    iniciarConversa();
  }, []);

  const iniciarConversa = () => {
    setMessages([]);
    setActiveStep('INITIAL_MENU');
    setResultado(null);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const msg1: ChatMessage = {
        id: 'msg-1',
        sender: 'bot',
        text: 'Olá, mamãe! 🌸 Bem-vinda ao atendimento do Banco de Leite Humano da Maternidade Escola Santa Mônica (MESM / UNCISAL).',
        timestamp: getCurrentTimeString()
      };
      const msg2: ChatMessage = {
        id: 'msg-2',
        sender: 'bot',
        text: 'Sou a Dra. Mônica, o chatbot do Banco de Leite da Maternidade Escola Santa Mônica (MESM / UNCISAL). Todo o nosso atendimento e triagem inicial funcionam aqui neste chat, rápido e sem burocracia!\n\nComo posso te ajudar hoje?',
        timestamp: getCurrentTimeString(),
        stepType: 'INITIAL_MENU',
        options: [
          { label: '💖 Quero Doar Leite Materno (Nova Doadora)', value: 'INICIAR_TRIAGEM' },
          { label: '🫙 Pegar Frascos Esterilizados (Pedir Kit)', value: 'PEGAR_FRASCOS' },
          { label: '❄️ Devolver o Leite / Agendar Coleta', value: 'DEVOLVER_LEITE' },
          { label: '🔍 Esqueci meu Protocolo / Consultar Cadastro', value: 'CONSULTAR_PROTOCOLO' },
          { label: '📖 Guia de Fervura e Coleta (Fiocruz)', value: 'VER_GUIA' }
        ]
      };
      setMessages([msg1, msg2]);
    }, 800);
  };

  // Helper para adicionar resposta do usuário e resposta do bot com delay
  const pushUserMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: getCurrentTimeString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
  };

  const pushBotMessage = (text: string, nextStep?: StepType, options?: { label: string; value: any; icon?: string }[], data?: any) => {
    if (nextStep) setActiveStep(nextStep);
    setTimeout(() => {
      setIsTyping(false);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text,
        timestamp: getCurrentTimeString(),
        stepType: nextStep,
        options,
        data
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 750);
  };

  // -------------------------------------------------------------
  // HANDLERS DO FLUXO CONVERSACIONAL
  // -------------------------------------------------------------

  const handleMenuOption = (val: string) => {
    if (val === 'INICIAR_TRIAGEM') {
      setActionType('DOAR');
      setMotivoColeta('AMBOS');
      setActiveStep('QUESTION_P1');
      pushUserMessage('Quero doar leite materno! 💖');
      pushBotMessage(
        'Que alegria imensa! Cada frasco doado salva prematuros na nossa UTI Neonatal. 🤱\n\nPrimeira pergunta de segurança da rBLH:\nVocê está amamentando ou retirando leite para o seu próprio bebê?',
        'QUESTION_P1',
        [
          { label: 'Sim, estou amamentando meu bebê', value: true },
          { label: 'Não estou amamentando', value: false }
        ]
      );
    } else if (val === 'PEGAR_FRASCOS') {
      setActionType('PEGAR_FRASCOS');
      setMotivoColeta('RECEBER_FRASCOS');
      setActiveStep('FLOW_GET_BOTTLES_CHOICE');
      pushUserMessage('Preciso de frascos esterilizados para coletar leite 🫙');
      pushBotMessage(
        'Excelente iniciativa! 🫙✨ Para garantir a biossegurança dos bebês da UTI Neonatal, o Banco de Leite da Santa Mônica fornece gratuitamente frascos de vidro com tampa plástica esterilizados em autoclave hospitalar (padrão Fiocruz/ANVISA).\n\nA nossa van leva o kit diretamente até a sua residência em Maceió, sem nenhum custo!\n\nVocê já possui cadastro/protocolo no Banco de Leite ou é seu primeiro pedido?',
        'FLOW_GET_BOTTLES_CHOICE',
        [
          { label: '🫙 Já sou cadastrada (Buscar por Protocolo/WhatsApp)', value: 'JA_CADASTRADA' },
          { label: '🆕 É meu primeiro pedido (Solicitar Kit em Domicílio)', value: 'PRIMEIRA_VEZ' }
        ]
      );
    } else if (val === 'DEVOLVER_LEITE') {
      setActionType('DEVOLVER_LEITE');
      setMotivoColeta('BUSCAR_LEITE');
      setActiveStep('FLOW_RETURN_MILK_CHOICE');
      pushUserMessage('Quero devolver o leite congelado / agendar coleta ❄️');
      pushBotMessage(
        'Que maravilha, mamãe! Cada gota de leite materno salva vidas dos nossos prematuros! 🍼❄️\n\nA van da Maternidade Santa Mônica recolhe o leite congelado na sua residência em caixa isotérmica com termômetro calibrado.\n\n*Lembrete Fiocruz:* O leite coletado deve permanecer congelado no freezer a -10°C (validade máxima de 15 dias).\n\nVocê já é uma doadora cadastrada conosco?',
        'FLOW_RETURN_MILK_CHOICE',
        [
          { label: '❄️ Já sou cadastrada (Buscar por Protocolo/WhatsApp)', value: 'JA_CADASTRADA' },
          { label: '🆕 Primeira vez que vou doar leite', value: 'PRIMEIRA_VEZ' }
        ]
      );
    } else if (val === 'CONSULTAR_PROTOCOLO') {
      setActionType('CONSULTA');
      setActiveStep('LOOKUP_INPUT');
      pushUserMessage('Quero consultar / recuperar meu protocolo 🔍');
      pushBotMessage(
        'Fique tranquila, mamãe! 🌸 Você pode consultar seu cadastro ou recuperar seu número de protocolo a qualquer momento.\n\nPor favor, digite aqui o seu número de WhatsApp com DDD (ex: 82 98842-1234), seu CPF ou seu código de protocolo (BLH-2026-XXXX):',
        'LOOKUP_INPUT'
      );
    } else if (val === 'VER_GUIA') {
      pushUserMessage('Quero saber como coletar e ferver o vidro');
      pushBotMessage(
        'Vou abrir o nosso Guia Sanitário Oficial da Fiocruz com o passo a passo de fervura por 15 minutos e congelamento a -10°C.',
        'INITIAL_MENU',
        [
          { label: '💖 Quero Iniciar a Triagem', value: 'INICIAR_TRIAGEM' },
          { label: '🫙 Solicitar Frascos Esterilizados', value: 'PEGAR_FRASCOS' },
          { label: '❄️ Devolver Leite Congelado', value: 'DEVOLVER_LEITE' }
        ]
      );
      if (onOpenGuidelines) onOpenGuidelines();
    }
  };

  // -------------------------------------------------------------
  // FLUXOS ESPECÍFICOS: PEGAR FRASCOS E DEVOLVER LEITE
  // -------------------------------------------------------------

  const handleGetBottlesChoice = (choice: 'JA_CADASTRADA' | 'PRIMEIRA_VEZ') => {
    if (choice === 'JA_CADASTRADA') {
      setActionType('PEGAR_FRASCOS');
      setActiveStep('ACTION_LOOKUP_INPUT');
      pushUserMessage('Já sou cadastrada no Banco de Leite 🫙');
      pushBotMessage(
        'Perfeito! Por favor, digite aqui o seu código de protocolo (ex: BLH-2026-0142), o seu WhatsApp com DDD ou CPF para localizarmos seu endereço:',
        'ACTION_LOOKUP_INPUT'
      );
    } else {
      setActionType('PEGAR_FRASCOS');
      setMotivoColeta('RECEBER_FRASCOS');
      setActiveStep('FORM_NAME');
      pushUserMessage('É meu primeiro pedido de frascos 🫙');
      pushBotMessage(
        'Que alegria ter você conosco, mamãe! 🌸\n\nPara a van do Banco de Leite da Maternidade Escola Santa Mônica (UNCISAL) levar o seu kit com frascos esterilizados gratuitamente até a sua residência em Maceió, vamos realizar o seu cadastro de entrega. É super rápido e sem burocracia!\n\nPara começarmos:\nQual é o seu NOME COMPLETO?',
        'FORM_NAME'
      );
    }
  };

  const handleReturnMilkChoice = (choice: 'JA_CADASTRADA' | 'PRIMEIRA_VEZ') => {
    if (choice === 'JA_CADASTRADA') {
      setActionType('DEVOLVER_LEITE');
      setActiveStep('ACTION_LOOKUP_INPUT');
      pushUserMessage('Já sou cadastrada no Banco de Leite ❄️');
      pushBotMessage(
        'Maravilha! Por favor, digite o seu código de protocolo (ex: BLH-2026-0142), WhatsApp com DDD ou CPF para agendarmos a rota da van:',
        'ACTION_LOOKUP_INPUT'
      );
    } else {
      setActionType('DOAR');
      setMotivoColeta('AMBOS');
      setActiveStep('QUESTION_P1');
      pushUserMessage('É a primeira vez que vou doar leite 🍼');
      pushBotMessage(
        'Que momento especial! 💛 Para a sua primeira doação, a legislação sanitária (ANVISA RDC nº 171/2006) exige uma breve triagem para a segurança do seu bebê e dos recém-nascidos da UTI Neonatal.\n\nPrimeira pergunta de segurança:\nVocê está amamentando ou retirando leite para o seu próprio bebê?',
        'QUESTION_P1',
        [
          { label: 'Sim, estou amamentando meu bebê', value: true },
          { label: 'Não estou amamentando', value: false }
        ]
      );
    }
  };

  const handleActionLookup = async (code: string) => {
    if (!code.trim()) return;
    pushUserMessage(code.trim());
    setIsTyping(true);
    try {
      const res = await api.lookupProtocol(code.trim());
      setIsTyping(false);
      if (res && res.doadora) {
        setExistingDonorData(res.doadora);
        const donorName = (res.doadora as any).primeiroNome || res.doadora.nomeCompleto.split(' ')[0] || 'mamãe';
        const bairroDoadora = res.doadora.endereco?.bairro || (res.doadora as any).bairro || 'Maceió';

        if (actionType === 'PEGAR_FRASCOS') {
          pushBotMessage(
            `Localizei o seu cadastro, ${donorName}! 🫙✨\nEndereço de entrega: ${bairroDoadora} (Maceió).\n\nQuantos frascos esterilizados vazios você deseja receber no seu kit?`,
            'EXISTING_DONOR_ACTION_BOTTLES',
            [
              { label: '2 frascos vazios', value: 2 },
              { label: '3 frascos vazios', value: 3 },
              { label: '4 frascos vazios', value: 4 },
              { label: '6 frascos vazios', value: 6 }
            ]
          );
        } else {
          // actionType === 'DEVOLVER_LEITE'
          pushBotMessage(
            `Localizei o seu cadastro, ${donorName}! 🍼❄️\nEndereço da coleta: ${bairroDoadora} (Maceió).\n\nQuantos frascos com leite materno congelado você tem prontos para a van recolher?`,
            'EXISTING_DONOR_ACTION_BOTTLES',
            [
              { label: '1 frasco congelado', value: 1 },
              { label: '2 frascos congelados', value: 2 },
              { label: '3 frascos congelados', value: 3 },
              { label: '4 frascos congelados', value: 4 },
              { label: '5 frascos congelados', value: 5 },
              { label: '6 frascos congelados', value: 6 }
            ]
          );
        }
      } else {
        pushBotMessage(
          'Não localizei o seu cadastro com esses dados. Deseja tentar novamente ou cadastrar agora?',
          'ACTION_LOOKUP_INPUT',
          [
            { label: '✏️ Digitar novamente', value: 'DIGITAR_NOVAMENTE' },
            { label: '🆕 Cadastrar agora', value: actionType === 'PEGAR_FRASCOS' ? 'FRASCOS_PRIMEIRA_VEZ' : 'INICIAR_TRIAGEM' },
            { label: '🏠 Menu Inicial', value: 'MENU_INICIAL' }
          ]
        );
      }
    } catch (err) {
      setIsTyping(false);
      pushBotMessage(
        'Não encontramos esse protocolo ou telefone no sistema. Você pode cadastrar sua solicitação agora:',
        'INITIAL_MENU',
        [
          { label: '🫙 Solicitar Frascos (Novo Pedido)', value: 'PEGAR_FRASCOS' },
          { label: '💖 Nova Triagem de Doação', value: 'INICIAR_TRIAGEM' },
          { label: '🏠 Menu Inicial', value: 'INICIAR' }
        ]
      );
    }
  };

  const handleExistingDonorBottles = (num: number) => {
    if (activeStep !== 'EXISTING_DONOR_ACTION_BOTTLES') return;
    const finalQtd = Math.max(1, num);
    setQtdFrascos(finalQtd);

    if (actionType === 'PEGAR_FRASCOS') {
      pushUserMessage(`${finalQtd} ${finalQtd === 1 ? 'frasco vazio' : 'frascos vazios'} 🫙`);
      pushBotMessage(
        'Excelente! A van levará frascos de vidro autoclavados a 121°C e esterilizados.\n\nQual turno você prefere para a entrega da van no seu endereço?',
        'EXISTING_DONOR_ACTION_SHIFT',
        [
          { label: '☀️ Manhã (08h às 12h)', value: 'MANHA' },
          { label: '🌤️ Tarde (13h30 às 17h)', value: 'TARDE' }
        ]
      );
    } else {
      pushUserMessage(`${finalQtd} ${finalQtd === 1 ? 'frasco' : 'frascos'} com leite congelado ❄️`);
      pushBotMessage(
        'Maravilha! Você gostaria que o coletador da van entregue novos frascos esterilizados vazios para reposição?',
        'EXISTING_DONOR_NEED_REPLACEMENT',
        [
          { label: '🍼 Sim, repor novos frascos vazios', value: true },
          { label: '❄️ Não, apenas recolher o leite', value: false }
        ]
      );
    }
  };

  const handleExistingDonorNeedReplacement = (repor: boolean) => {
    if (activeStep !== 'EXISTING_DONOR_NEED_REPLACEMENT') return;
    setExistingNeedReplacement(repor);
    pushUserMessage(repor ? 'Sim, favor repor novos frascos vazios 🍼' : 'Não precisa, apenas recolher o leite ❄️');
    pushBotMessage(
      'Qual turno você prefere para a van da Maternidade passar na sua casa?',
      'EXISTING_DONOR_ACTION_SHIFT',
      [
        { label: '☀️ Manhã (08h às 12h)', value: 'MANHA' },
        { label: '🌤️ Tarde (13h30 às 17h)', value: 'TARDE' }
      ]
    );
  };

  const handleExistingDonorShift = async (shift: TurnoColeta) => {
    if (activeStep !== 'EXISTING_DONOR_ACTION_SHIFT') return;
    setTurnoColeta(shift);
    pushUserMessage(shift === 'MANHA' ? 'Prefiro o turno da manhã (08h - 12h) ☀️' : 'Prefiro o turno da tarde (13h30 - 17h) 🌤️');
    setIsTyping(true);

    try {
      const isBottles = actionType === 'PEGAR_FRASCOS';
      const motivoFinal: MotivoColeta = isBottles ? 'RECEBER_FRASCOS' : (existingNeedReplacement ? 'AMBOS' : 'BUSCAR_LEITE');
      
      const apt = await api.createAppointment({
        protocolo: existingDonorData?.protocolo,
        doadoraId: existingDonorData?.id,
        nomeDoadora: existingDonorData?.nomeReal || existingDonorData?.nomeCompleto,
        bairro: existingDonorData?.endereco?.bairro || existingDonorData?.bairro || 'Maceió',
        telefone: existingDonorData?.telefone || telefone || 'Cadastrado no sistema',
        motivo: motivoFinal,
        quantidadeFrascosEstimada: qtdFrascos,
        turno: shift,
        dataAgendada: tomorrowStr
      });

      setIsTyping(false);

      if (isBottles) {
        pushBotMessage(
          `🎉 SOLICITAÇÃO DE FRASCOS AGENDADA COM SUCESSO!\n\n📋 Protocolo: ${existingDonorData?.protocolo || apt.protocolo}\n🚐 Rota da Van: Bairro ${existingDonorData?.endereco?.bairro || existingDonorData?.bairro || 'Maceió'}\n📦 Kit: ${qtdFrascos} frascos de vidro esterilizados\n⏰ Previsão: Amanhã (${shift === 'MANHA' ? 'Turno da Manhã • 08h às 12h' : 'Turno da Tarde • 13h30 às 17h'})\n\nOs frascos de vidro com tampa plástica são lavados e esterilizados pelo Banco de Leite da Santa Mônica conforme RDC 171/2006 da ANVISA. O coletador entrará em contato via WhatsApp antes de chegar!`,
          'PROTOCOL_COMPLETED',
          [],
          { doadora: existingDonorData, agendamento: apt }
        );
      } else {
        pushBotMessage(
          `🎉 COLETA DE LEITE MATERNO AGENDADA COM SUCESSO!\n\n📋 Protocolo: ${existingDonorData?.protocolo || apt.protocolo}\n🚐 Rota da Van: Bairro ${existingDonorData?.endereco?.bairro || existingDonorData?.bairro || 'Maceió'}\n❄️ Coleta: ${qtdFrascos} frascos congelados${existingNeedReplacement ? ' (+ reposição de frascos esterilizados)' : ''}\n⏰ Previsão: Amanhã (${shift === 'MANHA' ? 'Turno da Manhã • 08h às 12h' : 'Turno da Tarde • 13h30 às 17h'})\n\n*Instruções Sanitárias Fiocruz:*\n1. Mantenha os frascos congelados no freezer a -10°C até o momento da chegada da van.\n2. O coletador levará caixa isotérmica com termômetro calibrado para transporte seguro.\n\nMuito obrigado por alimentar nossos prematuros! 🤱💛`,
          'PROTOCOL_COMPLETED',
          [],
          { doadora: existingDonorData, agendamento: apt }
        );
      }
    } catch (err) {
      setIsTyping(false);
      pushBotMessage(
        'Houve uma instabilidade ao salvar o agendamento da van. Por favor, tente novamente.',
        'INITIAL_MENU'
      );
    }
  };

  const handleTriggerDirectAction = (type: 'DEVOLVER_LEITE' | 'PEGAR_FRASCOS', doadora?: any) => {
    setActionType(type);
    const targetDonor = doadora || existingDonorData;
    if (!targetDonor) {
      if (type === 'PEGAR_FRASCOS') {
        handleMenuOption('PEGAR_FRASCOS');
      } else {
        handleMenuOption('DEVOLVER_LEITE');
      }
      return;
    }
    setExistingDonorData(targetDonor);
    const donorName = targetDonor.primeiroNome || targetDonor.nomeCompleto?.split(' ')[0] || 'mamãe';
    const bairroDoadora = targetDonor.endereco?.bairro || targetDonor.bairro || 'Maceió';

    if (type === 'PEGAR_FRASCOS') {
      pushUserMessage('Quero solicitar novos frascos esterilizados 🫙');
      pushBotMessage(
        `Com certeza, ${donorName}! 🫙✨\nA van da Maternidade Santa Mônica entregará seu kit no bairro ${bairroDoadora}.\n\nQuantos frascos esterilizados vazios você deseja receber?`,
        'EXISTING_DONOR_ACTION_BOTTLES',
        [
          { label: '2 frascos vazios', value: 2 },
          { label: '3 frascos vazios', value: 3 },
          { label: '4 frascos vazios', value: 4 },
          { label: '6 frascos vazios', value: 6 }
        ]
      );
    } else {
      pushUserMessage('Quero agendar a entrega do meu leite congelado ❄️');
      pushBotMessage(
        `Com certeza, ${donorName}! 🍼❄️\nA van com caixa térmica e termômetro calibrado passará no seu endereço em ${bairroDoadora}.\n\nQuantos frascos com leite congelado você tem prontos para a van recolher?`,
        'EXISTING_DONOR_ACTION_BOTTLES',
        [
          { label: '1 frasco congelado', value: 1 },
          { label: '2 frascos congelados', value: 2 },
          { label: '3 frascos congelados', value: 3 },
          { label: '4 frascos congelados', value: 4 },
          { label: '5 frascos congelados', value: 5 },
          { label: '6 frascos congelados', value: 6 }
        ]
      );
    }
  };

  // P1: Amamentando
  const handleAnswerP1 = (sim: boolean) => {
    if (activeStep !== 'QUESTION_P1') return;
    const novasRespostas = { ...respostas, amamentandoProprioFilho: sim };
    setRespostas(novasRespostas);

    if (!sim) {
      pushUserMessage('Não estou amamentando no momento');
      const res = avaliarTriagemClinica(novasRespostas);
      setResultado(res);
      pushBotMessage(
        'Agradecemos imensamente o seu carinho e boa vontade! Pelas normas da Rede rBLH e RDC 171/2006 da ANVISA, apenas mães em amamentação ativa para seus filhos podem ser doadoras. Desejamos muita saúde para você e sua família!',
        'RESULT_SCREENING',
        [{ label: '🔄 Iniciar Novo Atendimento', value: 'REINICIAR' }]
      );
      return;
    }

    pushUserMessage('Sim, estou amamentando meu bebê! 🤱');
    pushBotMessage(
      'Maravilha! O leite para o seu filho é a prioridade absoluta.\n\nEle está mamando bem e você percebe que tem leite excedente (sobrando)?',
      'QUESTION_P2',
      [
        { label: 'Sim! Ele mama bem e tenho sobra ✨', value: true },
        { label: 'Não percebo sobra de leite', value: false }
      ]
    );
  };

  // P2: Sobra
  const handleAnswerP2 = (sim: boolean) => {
    if (activeStep !== 'QUESTION_P2') return;
    const novasRespostas = { ...respostas, bebeMamaBemETemSobra: sim };
    setRespostas(novasRespostas);

    if (!sim) {
      pushUserMessage('Não percebo sobra de leite');
      const res = avaliarTriagemClinica(novasRespostas);
      setResultado(res);
      pushBotMessage(
        'O leite do seu bebê é prioridade máxima! Cuide bem dele e assegure a sua livre demanda. Se futuramente a produção aumentar e sobrar, estaremos aqui de braços abertos na Santa Mônica! ❤️',
        'RESULT_SCREENING',
        [{ label: '🔄 Iniciar Novo Atendimento', value: 'REINICIAR' }]
      );
      return;
    }

    pushUserMessage('Sim, ele mama bem e tenho leite sobrando! ✨');
    pushBotMessage(
      'Que notícia abençoada! Agora me conte: qual a data de nascimento do seu bebê?\n(Nossa equipe médica calcula a idade para classificar o leite em Colostro, Transição ou Maduro)',
      'QUESTION_P3_DATE'
    );
  };

  // P3: Data do nascimento do bebê
  const handleAnswerP3 = (dataStr: string) => {
    if (activeStep !== 'QUESTION_P3_DATE') return;
    if (!dataStr) return;
    const parsed = parseDataNascimentoBebe(dataStr);

    if (!parsed.valida || parsed.idadeDias === undefined || !parsed.dataISO) {
      pushUserMessage(dataStr);
      pushBotMessage(
        `⚠️ ${parsed.erro || 'Data inválida.'}\n\nPor favor, informe a data no formato dia/mês/ano com 4 dígitos (ex: 12/02/2026) ou utilize o calendário abaixo:`,
        'QUESTION_P3_DATE'
      );
      return;
    }

    const dias = parsed.idadeDias;
    const infoLeite = classificarTipoLeite(dias);
    const novasRespostas = { ...respostas, dataNascimentoBebe: parsed.dataISO };
    setRespostas(novasRespostas);

    const partes = parsed.dataISO.split('-');
    const dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;

    pushUserMessage(`Meu bebê nasceu em ${dataFormatada} (${dias} dias de vida)`);
    pushBotMessage(
      `Que bênção! Seu bebê tem ${dias} dia(s) de vida. O seu leite é classificado como ${infoLeite.rotulo.toUpperCase()}!\n\n🎯 ${infoLeite.destinacaoUTIN}\n\nVocê possui a Caderneta da Gestante / Cartão de Pré-Natal com os exames anotados?`,
      'QUESTION_P4_CARD',
      [
        { label: '📷 Enviar Foto da Caderneta / Exames Agora (Recomendado)', value: 'ENVIAR_FOTO' },
        { label: 'Sim, vou apresentar na visita da van', value: true },
        { label: 'Não tenho o cartão físico em mãos', value: false }
      ]
    );
  };

  // Envio de comprovante digital de exames (Forma 2)
  const handleEnviarComprovante = (
    tipo: 'FOTO_CADERNETA' | 'LAUDO_PDF', 
    customUrl?: string, 
    customName?: string, 
    customSizeKb?: number
  ) => {
    setShowAttachmentModal(false);
    const isPdf = tipo === 'LAUDO_PDF';
    const url = customUrl || (isPdf 
      ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' 
      : 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800');
    const name = customName || (isPdf ? 'Laudo_Laboratorial_Sorologias_MESM.pdf' : 'Caderneta_Gestante_Folha_Sorologias.jpg');
    const sizeKb = customSizeKb || (isPdf ? 340 : 680);

    const novoComprovante: ComprovanteExames = {
      arquivoUrl: url,
      nomeArquivo: name,
      dataEnvio: new Date().toISOString(),
      tipo,
      tamanhoKb: sizeKb,
      validadoEnfermagem: false
    };
    setComprovanteAnexado(novoComprovante);
    setRespostas(prev => ({ ...prev, temCartaoPreNatal: true }));

    // Mensagem da doadora com anexo visual no chat
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `📷 Envio digital de comprovante: ${name}`,
      timestamp: getCurrentTimeString(),
      attachment: {
        type: isPdf ? 'pdf' : 'image',
        url,
        name,
        caption: isPdf ? 'Laudo Laboratorial de Sorologias (3º Trimestre)' : 'Caderneta da Gestante • Página de Sorologias (HIV, VDRL, HBsAg)',
        tamanhoKb: sizeKb
      }
    };
    setMessages(prev => [...prev, userMsg]);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      pushBotMessage(
        'Recebi a foto dos seus exames/caderneta com sucesso! 📄✅\n\nO documento já foi anexado à sua ficha para conferência da nossa equipe de enfermagem do BLH da Santa Mônica.\n\nAgora sobre as sorologias: algum exame do pré-natal deu reagente/positivo para HIV, Sífilis (VDRL), Hepatite B, Hepatite C ou HTLV?',
        'QUESTION_P5_SEROLOGY',
        [
          { label: 'Todos negativos / não reagentes 🛡️', value: false },
          { label: 'Tive resultado reagente / positivo', value: true }
        ]
      );
    }, 750);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação estrita de tipo de arquivo (OWASP File Upload Security)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const hasValidExt = /\.(jpe?g|png|webp|pdf)$/i.test(file.name);
    if ((file.type && !allowedTypes.includes(file.type)) || !hasValidExt) {
      alert('Formato de arquivo não suportado. Por favor, envie uma foto (JPG, PNG) ou documento PDF dos seus exames ou caderneta.');
      return;
    }

    // Limite sanitário e operacional de upload: 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo selecionado excede o limite máximo permitido de 5MB. Por favor, selecione uma imagem ou PDF mais leve.');
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const sizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = () => {
      const resultUrl = reader.result as string;
      handleEnviarComprovante(isPdf ? 'LAUDO_PDF' : 'FOTO_CADERNETA', resultUrl, file.name, sizeKb);
    };
    reader.readAsDataURL(file);
  };

  // P4: Cartão Pré-natal
  const handleAnswerP4 = (val: boolean | 'ENVIAR_FOTO') => {
    if (activeStep !== 'QUESTION_P4_CARD') return;
    if (val === 'ENVIAR_FOTO') {
      setShowAttachmentModal(true);
      return;
    }
    const temCartao = val;
    const novasRespostas = { ...respostas, temCartaoPreNatal: temCartao };
    setRespostas(novasRespostas);

    const txt = temCartao ? 'Sim, vou apresentar a Caderneta na visita' : 'Não tenho o cartão físico em mãos agora';
    pushUserMessage(txt);

    const detalhe = temCartao
      ? 'Perfeito! Você só precisará mostrar ao coletador da van no dia da visita.'
      : 'Fique tranquila! Caso não tenha a caderneta em mãos, a Santa Mônica agenda a coleta rápida de sangue em domicílio ou no hospital.';

    pushBotMessage(
      `${detalhe}\n\nAgora sobre as sorologias: algum exame do pré-natal deu reagente/positivo para HIV, Sífilis (VDRL), Hepatite B, Hepatite C ou HTLV?`,
      'QUESTION_P5_SEROLOGY',
      [
        { label: 'Todos negativos / não reagentes 🛡️', value: false },
        { label: 'Tive resultado reagente / positivo', value: true }
      ]
    );
  };

  // P5: Sorologia
  const handleAnswerP5 = (positiva: boolean) => {
    if (activeStep !== 'QUESTION_P5_SEROLOGY') return;
    const novasRespostas = { ...respostas, sorologiaPositiva: positiva };
    setRespostas(novasRespostas);

    if (positiva) {
      pushUserMessage('Tive resultado positivo / reagente');
      const res = avaliarTriagemClinica(novasRespostas);
      setResultado(res);
      pushBotMessage(
        'Agradecemos imensamente o seu carinho e boa vontade! Pelos protocolos de biossegurança de leite humano para prematuros da UTI (RDC 171/2006), este perfil de exames não possibilita a doação. Desejamos muita saúde para você e seu bebê!',
        'RESULT_SCREENING',
        [{ label: '🔄 Iniciar Novo Atendimento', value: 'REINICIAR' }]
      );
      return;
    }

    pushUserMessage('Não, todos os exames foram negativos / não reagentes! 🛡️');
    pushBotMessage(
      'Excelente! Sobre hábitos de vida: você fuma cigarro comum ou vape, bebe álcool ou faz uso de substâncias?',
      'QUESTION_P6_P7_HABITS',
      [
        { label: 'Não fumo nem consumo bebidas alcoólicas', value: 'NENHUM' },
        { label: 'Fumo até 10 cigarros/dia (moderado)', value: 'ATE_10' },
        { label: 'Bebo cerveja/vinho esporadicamente', value: 'ALCOOL' },
        { label: 'Fumo mais de 10/dia ou uso substâncias', value: 'IMPEDITIVO' }
      ]
    );
  };

  // P6 & P7: Hábitos
  const handleAnswerP6P7 = (habito: string) => {
    if (activeStep !== 'QUESTION_P6_P7_HABITS') return;
    const novasRespostas = { ...respostas };
    if (habito === 'NENHUM') {
      novasRespostas.tabagismo = 'NAO';
      novasRespostas.alcoolDrogas = 'NUNCA';
      pushUserMessage('Não fumo nem consumo bebidas ou substâncias');
    } else if (habito === 'ATE_10') {
      novasRespostas.tabagismo = 'ATE_10';
      pushUserMessage('Fumo até 10 cigarros/dia (uso moderado)');
    } else if (habito === 'ALCOOL') {
      novasRespostas.alcoolDrogas = 'ALCOOL_ESPORADICO';
      pushUserMessage('Consumo bebidas alcoólicas esporadicamente');
    } else {
      novasRespostas.tabagismo = 'MAIS_10';
      novasRespostas.alcoolDrogas = 'SUBSTANCIAS_ILICITAS';
      setRespostas(novasRespostas);
      pushUserMessage('Fumo mais de 10 cigarros/dia ou uso substâncias');
      const res = avaliarTriagemClinica(novasRespostas);
      setResultado(res);
      pushBotMessage(
        'Pelas normas sanitárias e farmacológicas, essas substâncias passam para o leite e não são seguras para os bebês da UTI Neonatal. Desejamos muita saúde para você!',
        'RESULT_SCREENING',
        [{ label: '🔄 Iniciar Novo Atendimento', value: 'REINICIAR' }]
      );
      return;
    }

    setRespostas(novasRespostas);
    pushBotMessage(
      'Entendido! E procedimentos: você recebeu transfusão de sangue ou fez tatuagem, piercing ou micropigmentação nos últimos 12 meses?',
      'QUESTION_P8_P9_PROCEDURES',
      [
        { label: 'Não fiz tatuagem nem transfusão recente 🛡️', value: false },
        { label: 'Sim, fiz procedimento nos últimos 12 meses', value: true }
      ]
    );
  };

  // P8 & P9: Procedimentos
  const handleAnswerP8P9 = (fez: boolean) => {
    if (activeStep !== 'QUESTION_P8_P9_PROCEDURES') return;
    const novasRespostas = { ...respostas, transfusao12Meses: fez, tatuagem12Meses: fez };
    setRespostas(novasRespostas);

    if (fez) {
      pushUserMessage('Sim, fiz nos últimos 12 meses');
      const res = avaliarTriagemClinica(novasRespostas);
      setResultado(res);
      pushBotMessage(
        'Você é muito bem-vinda! No entanto, existe uma janela imunológica preventiva de 12 meses a contar do procedimento. Assim que completar o prazo, você poderá doar e salvar vidas aqui na Santa Mônica!',
        'RESULT_SCREENING',
        [{ label: '🔄 Iniciar Novo Atendimento', value: 'REINICIAR' }]
      );
      return;
    }

    pushUserMessage('Não fiz tatuagem nem recebi transfusão recente 🛡️');
    pushBotMessage(
      'Última pergunta clínica: você está tomando algum medicamento contínuo ou recente (antibióticos, calmantes, antidepressivos, etc.)?',
      'QUESTION_P10_P11_MEDS',
      [
        { label: 'Não tomo nenhum medicamento', value: 'NAO' },
        { label: 'Sim, tomo medicamentos', value: 'SIM' }
      ]
    );
  };

  // P10 & P11: Remédios
  const handleAnswerP10P11 = (toma: boolean, remedioTxt?: string) => {
    if (activeStep !== 'QUESTION_P10_P11_MEDS') return;
    const novasRespostas = { 
      ...respostas, 
      tomaMedicamentos: toma, 
      descricaoMedicamentos: remedioTxt || '' 
    };
    setRespostas(novasRespostas);

    const txt = toma ? `Sim, tomo remédio: ${remedioTxt || 'informado'}` : 'Não tomo remédios';
    pushUserMessage(txt);

    const res = avaliarTriagemClinica(novasRespostas);
    setResultado(res);

    if (res.status === 'APTA' || res.status === 'EM_ANALISE') {
      const isMed = res.necessitaAnaliseMedica;
      pushBotMessage(
        isMed 
          ? `💛 PRÉ-CADASTRO ENCAMINHADO PARA AVALIAÇÃO MÉDICA!\n\nComo você informou o uso de medicação (${remedioTxt || 'medicamento'}), nossa equipe médica e farmacêutica do BLH Santa Mônica revisará sua indicação com muito carinho.\n\nConforme a regulação da rBLH/ANVISA, todos os cadastros passam por conferência da enfermagem antes da primeira coleta.\n\nVamos registrar seus dados e endereço para adiantar a rota da van!\n\nQual é o seu NOME COMPLETO?`
          : `🎉 PRÉ-CADASTRO REALIZADO COM SUCESSO, MAMÃE!\n\nSua pré-triagem atende aos requisitos iniciais da Rede rBLH/ANVISA! 💛\n\nConforme a regulação técnica dos Bancos de Leite Humano (RDC 171/2006 da ANVISA), todo cadastro e exames devem ser conferidos e validados pela equipe de enfermagem do BLH da Maternidade Escola Santa Mônica (UNCISAL) antes da liberação definitiva da coleta domiciliar.\n\nVamos registrar seus dados e endereço para agendar a visita da van?\n\nQual é o seu NOME COMPLETO?`,
        'FORM_NAME'
      );
    } else {
      pushBotMessage(res.mensagem, 'RESULT_SCREENING', [{ label: '🔄 Iniciar Novo Atendimento', value: 'REINICIAR' }]);
    }
  };

  // -------------------------------------------------------------
  // VALIDAÇÕES E ETAPAS CONVERSACIONAIS DO CADASTRO NO CHAT
  // -------------------------------------------------------------

  // Validador de Nome Completo (mínimo 2 palavras, 5 caracteres, sem números)
  const validarNomeCompleto = (name: string): { valido: boolean; motivo?: string } => {
    const trimmed = name.trim();
    if (!trimmed) return { valido: false, motivo: 'Por favor, digite seu nome completo.' };
    
    if (/[0-9]/.test(trimmed)) {
      return { valido: false, motivo: 'O nome não deve conter números.' };
    }

    const words = trimmed.split(/\s+/).filter(p => p.length > 0);
    if (words.length < 2) {
      return { 
        valido: false, 
        motivo: 'O nome informado precisa conter seu nome e sobrenome completos (ex: Mariana Silva de Holanda).' 
      };
    }

    const lettersOnly = trimmed.replace(/[^a-zA-ZÀ-ÿ]/g, '');
    if (lettersOnly.length < 5) {
      return {
        valido: false,
        motivo: 'O nome informado é muito curto. Por favor, digite seu nome e sobrenome completos (pelo menos 5 letras).'
      };
    }

    const invalidWords = words.filter(w => {
      const lower = w.toLowerCase();
      const isConnective = ['de', 'da', 'do', 'dos', 'das', 'e'].includes(lower);
      return !isConnective && w.length < 2;
    });

    if (invalidWords.length > 0) {
      return {
        valido: false,
        motivo: 'Cada parte do seu nome deve conter pelo menos 2 letras (ex: Mariana Silva).'
      };
    }

    return { valido: true };
  };

  // Validador de WhatsApp (formato brasileiro com DDD de 2 dígitos + 8 ou 9 dígitos)
  const validarWhatsApp = (phone: string): { valido: boolean; formatado?: string; motivo?: string } => {
    let digits = phone.replace(/\D/g, '');
    
    // Tratamento de DDI 55 (ex: 5582991234567 -> 82991234567)
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      digits = digits.slice(2);
    }

    if (digits.length < 10 || digits.length > 11) {
      return { 
        valido: false, 
        motivo: `O número de WhatsApp precisa conter o DDD (2 dígitos) e o número completo com 8 ou 9 dígitos (ex: (82) 99123-4567). Você digitou apenas ${digits.length === 0 ? 'nada' : digits.length + ' dígito(s)'}.` 
      };
    }

    const ddd = parseInt(digits.slice(0, 2), 10);
    if (ddd < 11 || ddd > 99) {
      return { valido: false, motivo: 'DDD inválido. Por favor informe o DDD de 2 dígitos (ex: 82 para Alagoas).' };
    }

    const formatted = digits.length === 11
      ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
      : `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return { valido: true, formatado: formatted };
  };

  // Validador de Nome do Bebê (pelo menos 2 letras, sem números)
  const validarNomeBebe = (baby: string): { valido: boolean; motivo?: string } => {
    const trimmed = baby.trim();
    if (!trimmed) {
      return { 
        valido: false, 
        motivo: 'Por favor, informe o nome do seu bebê.' 
      };
    }
    if (/[0-9]/.test(trimmed)) {
      return { valido: false, motivo: 'O nome do bebê não deve conter números.' };
    }
    const lettersOnly = trimmed.replace(/[^a-zA-ZÀ-ÿ]/g, '');
    if (lettersOnly.length < 2) {
      return { 
        valido: false, 
        motivo: 'Por favor, informe o nome do seu bebê com pelo menos 2 letras (ex: Laura, Gabriel, Davi, Sofia).' 
      };
    }
    return { valido: true };
  };

  const handleFormName = (name: string) => {
    if (activeStep !== 'FORM_NAME') return;
    const checagem = validarNomeCompleto(name);
    if (!checagem.valido) {
      pushUserMessage(name.trim() || 'Nome informado');
      pushBotMessage(
        `⚠️ ${checagem.motivo}\n\nPor favor, informe seu NOME COMPLETO para o registro no prontuário da Maternidade Santa Mônica:`,
        'FORM_NAME'
      );
      return;
    }
    setNomeMae(name.trim());
    pushUserMessage(name.trim());
    pushBotMessage(
      `Prazer, ${name.trim()}! 🥰\n\nAgora, qual o seu número de WhatsApp com DDD para a equipe da van confirmar o horário da visita?`,
      'FORM_PHONE'
    );
  };

  const handleFormPhone = async (phone: string) => {
    if (activeStep !== 'FORM_PHONE') return;
    const checagem = validarWhatsApp(phone);
    if (!checagem.valido || !checagem.formatado) {
      pushUserMessage(phone.trim() || 'Número informado');
      pushBotMessage(
        `⚠️ ${checagem.motivo}\n\nPor favor, informe seu WhatsApp com DDD (ex: (82) 98842-1234):`,
        'FORM_PHONE'
      );
      return;
    }

    // Restrição Sanitária: Verificar se o telefone já está cadastrado
    const existing = await api.checkPhoneExists(checagem.formatado);
    if (existing.exists) {
      pushUserMessage(checagem.formatado);
      pushBotMessage(
        `⚠️ O número ${checagem.formatado} já possui um pré-cadastro ativo no Banco de Leite da Santa Mônica!\n\n📋 Protocolo Oficial: ${existing.protocolo}\n👤 Titular: ${existing.nomeCompleto || 'Doadora'}\n\nConforme as normas da ANVISA (RDC 171/2006), o mesmo telefone não pode ser cadastrado duas vezes para garantir a rastreabilidade do leite. O que deseja fazer?`,
        'FORM_PHONE',
        [
          { label: `🔍 Consultar meu Protocolo (${existing.protocolo})`, value: `CONSULTAR_${existing.protocolo}` },
          { label: '✏️ Informar outro número de WhatsApp', value: 'DIGITAR_OUTRO_TELEFONE' }
        ]
      );
      return;
    }

    setTelefone(checagem.formatado);
    pushUserMessage(checagem.formatado);
    pushBotMessage(
      'Anotado! E qual é o nome do seu bebezinho?',
      'FORM_BABY_NAME'
    );
  };

  const handleFormBabyName = (baby: string) => {
    if (activeStep !== 'FORM_BABY_NAME') return;
    const checagem = validarNomeBebe(baby);
    if (!checagem.valido) {
      pushUserMessage(baby.trim() || 'Nome informado');
      pushBotMessage(
        `⚠️ ${checagem.motivo}\n\nQual é o nome do seu bebê?`,
        'FORM_BABY_NAME'
      );
      return;
    }
    const bName = baby.trim();
    setNomeBebe(bName);
    pushUserMessage(bName);
    pushBotMessage(
      `Que amor a/o ${bName}! 👶\n\nAgora sobre o seu endereço: em qual BAIRRO de Maceió você mora?`,
      'FORM_NEIGHBORHOOD'
    );
  };

  const handleFormNeighborhood = (bairroNome: string) => {
    if (activeStep !== 'FORM_NEIGHBORHOOD') return;
    setBairro(bairroNome);
    pushUserMessage(`Moro no bairro ${bairroNome}`);
    pushBotMessage(
      `Ótimo, a van da Santa Mônica atende frequentemente o bairro ${bairroNome}! 🚐\n\nQual a sua RUA (ou avenida) e o NÚMERO da residência (com complemento se for prédio/apto)?\n\n💡 Você também pode digitar seu CEP para buscar o endereço automaticamente!`,
      'FORM_STREET_NUMBER'
    );
  };

  const consultarCep = async (cepInput: string) => {
    const digits = cepInput.replace(/\D/g, '');
    if (!digits) {
      setCepFeedback({ tipo: 'erro', mensagem: 'Digite o CEP com 8 dígitos.' });
      return;
    }
    if (digits.length !== 8) {
      setCepFeedback({ tipo: 'erro', mensagem: 'O CEP deve conter exatamente 8 dígitos (ex: 57035-000).' });
      return;
    }

    setIsSearchingCep(true);
    setCepFeedback(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      setIsSearchingCep(false);

      if (data.erro) {
        setCepFeedback({ tipo: 'erro', mensagem: 'CEP não localizado na base dos Correios. Você pode preencher os campos abaixo manualmente.' });
        return;
      }

      const formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
      setCep(formatted);

      if (data.logradouro) {
        setLogradouro(data.logradouro);
      }
      if (data.bairro) {
        const bEncontrado = BAIRROS_MACEIO.find(b => b.nome.toLowerCase() === data.bairro.toLowerCase());
        if (bEncontrado) {
          setBairro(bEncontrado.nome);
        } else {
          setBairro(data.bairro);
        }
      }

      const isMaceio = data.localidade?.toLowerCase().includes('maceio') || data.localidade?.toLowerCase().includes('maceió');
      if (isMaceio) {
        setCepFeedback({
          tipo: 'sucesso',
          mensagem: `Endereço localizado! ${data.logradouro ? data.logradouro + ' • ' : ''}${data.bairro} (${data.localidade}/AL)`
        });
      } else {
        setCepFeedback({
          tipo: 'aviso',
          mensagem: `CEP localizado em ${data.localidade}/${data.uf}. A van do BLH Santa Mônica atende a região de Maceió e entorno.`
        });
      }
    } catch (err) {
      setIsSearchingCep(false);
      setCepFeedback({
        tipo: 'aviso',
        mensagem: 'Não foi possível consultar os Correios online agora. Você pode preencher sua rua e bairro normalmente abaixo!'
      });
    }
  };

  const handleFormAddressFields = (street?: string, num?: string, comp?: string) => {
    if (activeStep !== 'FORM_STREET_NUMBER') return;
    const finalStreet = (street !== undefined ? street : logradouro).trim();
    const finalNum = (num !== undefined ? num : numeroResidencia).trim();
    const finalComp = (comp !== undefined ? comp : complementoApto).trim();

    if (!finalStreet || finalStreet.length < 3) {
      alert('Por favor, informe o nome completo da sua rua ou avenida (pelo menos 3 caracteres).');
      return;
    }

    setLogradouro(finalStreet);
    if (num !== undefined) setNumeroResidencia(finalNum);
    if (comp !== undefined) setComplementoApto(finalComp);

    const txtResumo = `${finalStreet}${finalNum ? `, nº ${finalNum}` : ', S/N'}${finalComp ? ` (${finalComp})` : ''}${cep ? ` • CEP: ${cep}` : ''}`;
    pushUserMessage(txtResumo);
    pushBotMessage(
      'Perfeito! Tem algum PONTO DE REFERÊNCIA para ajudar o motorista da van da maternidade a encontrar fácil o seu portão?',
      'FORM_LANDMARK',
      [
        { label: 'Não tenho ponto de referência', value: 'SEM_REFERENCIA' }
      ]
    );
  };

  const handleFormStreetNumber = (street: string) => {
    if (activeStep !== 'FORM_STREET_NUMBER') return;
    handleFormAddressFields(street);
  };

  const handleFormLandmark = (landmark: string) => {
    if (activeStep !== 'FORM_LANDMARK') return;
    const finalLandmark = landmark === 'SEM_REFERENCIA' ? '' : landmark.trim();
    setPontoReferencia(finalLandmark);
    if (finalLandmark) {
      pushUserMessage(`Ref: ${finalLandmark}`);
    } else {
      pushUserMessage('Não tenho ponto de referência');
    }

    if (motivoColeta === 'RECEBER_FRASCOS') {
      pushBotMessage(
        `Perfeito! Quantos frascos esterilizados vazios você gostaria de receber no kit da van para começar a coletar em casa? 🫙✨`,
        'FORM_BOTTLES_COUNT',
        [
          { label: '2 frascos esterilizados', value: 2 },
          { label: '3 frascos (Padrão Recomendado)', value: 3 },
          { label: '4 frascos esterilizados', value: 4 },
          { label: '6 frascos esterilizados', value: 6 }
        ]
      );
      return;
    }

    if (motivoColeta === 'BUSCAR_LEITE') {
      pushBotMessage(
        `Perfeito! Qual o melhor TURNO para a van da Maternidade passar na sua casa para recolher o leite materno congelado? ❄️`,
        'FORM_DATE_SHIFT',
        [
          { label: '☀️ Manhã (08h às 12h)', value: 'MANHA' },
          { label: '🌤️ Tarde (13h30 às 17h)', value: 'TARDE' }
        ]
      );
      return;
    }

    pushBotMessage(
      'Como a equipe da van do Banco de Leite pode ajudar você? 🚐',
      'FORM_PURPOSE_AND_BOTTLES',
      [
        { 
          label: '🍼 Doar Leite Materno (e repor novos frascos)', 
          value: 'AMBOS' 
        },
        { 
          label: '❄️ Apenas Entregar Leite Congelado', 
          value: 'BUSCAR_LEITE' 
        },
        { 
          label: '🫙 Apenas Receber Frascos Esterilizados', 
          value: 'RECEBER_FRASCOS' 
        }
      ]
    );
  };

  const handleFormPurpose = (purpose: MotivoColeta) => {
    if (activeStep !== 'FORM_PURPOSE_AND_BOTTLES') return;
    setMotivoColeta(purpose);

    if (purpose === 'RECEBER_FRASCOS') {
      pushUserMessage('Preciso apenas receber frascos esterilizados 🫙');
      pushBotMessage(
        'Quantos frascos esterilizados vazios você gostaria de receber no kit da van para começar a coletar? 🫙✨',
        'FORM_BOTTLES_COUNT',
        [
          { label: '2 frascos esterilizados', value: 2 },
          { label: '3 frascos (Padrão Recomendado)', value: 3 },
          { label: '4 frascos esterilizados', value: 4 },
          { label: '6 frascos esterilizados', value: 6 }
        ]
      );
    } else {
      pushUserMessage(
        purpose === 'AMBOS' 
          ? 'Quero doar leite e repor frascos vazios 🍼' 
          : 'Quero apenas entregar meus frascos com leite ❄️'
      );
      pushBotMessage(
        'Quantos frascos com leite materno você tem congelados para doar? (Informe o número exato) ❄️',
        'FORM_BOTTLES_COUNT',
        [
          { label: '1 frasco', value: 1 },
          { label: '2 frascos', value: 2 },
          { label: '3 frascos', value: 3 },
          { label: '4 frascos', value: 4 },
          { label: '5 frascos', value: 5 },
          { label: '6 frascos', value: 6 }
        ]
      );
    }
  };

  const handleFormBottlesCount = (num: number) => {
    if (activeStep !== 'FORM_BOTTLES_COUNT') return;
    const finalQtd = Math.max(1, num);
    setQtdFrascos(finalQtd);
    pushUserMessage(`${finalQtd} ${finalQtd === 1 ? 'frasco' : 'frascos'}${motivoColeta === 'RECEBER_FRASCOS' ? ' vazios esterilizados 🫙' : ' com leite congelado ❄️'}`);

    if (!nomeMae) {
      pushBotMessage(
        `Excelente! Separamos o seu kit com ${finalQtd} frascos esterilizados. 🫙✨\n\nAgora vamos registrar seus dados e endereço para a van da Maternidade Santa Mônica!\n\nQual é o seu NOME COMPLETO?`,
        'FORM_NAME'
      );
      return;
    }

    pushBotMessage(
      'Excelente! Qual o melhor TURNO para a van da Maternidade passar na sua casa?',
      'FORM_DATE_SHIFT',
      [
        { label: '☀️ Manhã (08h às 12h)', value: 'MANHA' },
        { label: '🌤️ Tarde (13h30 às 17h)', value: 'TARDE' }
      ]
    );
  };

  const handleFormShift = (shift: TurnoColeta) => {
    if (activeStep !== 'FORM_DATE_SHIFT') return;
    setTurnoColeta(shift);
    pushUserMessage(shift === 'MANHA' ? 'Prefiro o turno da manhã (08h - 12h) ☀️' : 'Prefiro o turno da tarde (13h30 - 17h) 🌤️');

    pushBotMessage(
      'Excelente! Quase tudo pronto. 💛\n\nPor favor, confira atentamente o resumo de todas as suas informações antes de confirmarmos o seu pré-cadastro e emitirmos o protocolo oficial:',
      'FORM_CONFIRM_SUMMARY',
      [
        { label: '✅ Tudo Correto! Confirmar e Gerar Protocolo', value: 'CONFIRMAR_TUDO' },
        { label: '✏️ Corrigir Alguma Informação', value: 'CORRIGIR_DADOS' }
      ]
    );
  };

  const handleFinalConfirmation = async () => {
    if (activeStep !== 'FORM_CONFIRM_SUMMARY') return;
    pushUserMessage('Confirmo todos os meus dados! Gerar meu protocolo oficial ✅');

    setIsTyping(true);
    try {
      // Verificação rigorosa: Não permitir que o mesmo telefone seja cadastrado duas vezes
      const phoneCheck = await api.checkPhoneExists(telefone);
      if (phoneCheck.exists) {
        setIsTyping(false);
        pushBotMessage(
          `⚠️ Não é possível concluir o cadastro: o número ${telefone} já está registrado no sistema com o protocolo ${phoneCheck.protocolo} (${phoneCheck.nomeCompleto || 'Doadora'}).\n\nConforme as normas da ANVISA (RDC 171/2006), o mesmo telefone não pode ser cadastrado duas vezes para garantir a rastreabilidade do leite materno.`,
          'FORM_PHONE',
          [
            { label: `🔍 Consultar Protocolo (${phoneCheck.protocolo})`, value: `CONSULTAR_${phoneCheck.protocolo}` },
            { label: '✏️ Informar outro número de WhatsApp', value: 'DIGITAR_OUTRO_TELEFONE' }
          ]
        );
        return;
      }

      const regiao = getRegiaoPorBairro(bairro);
      const currentYear = new Date().getFullYear();
      const randSeq = Math.floor(1000 + Math.random() * 9000);
      const protocoloGerado = `BLH-${currentYear}-${randSeq}`;

      const fullEndLogradouro = `${logradouro}${numeroResidencia ? `, nº ${numeroResidencia}` : ', S/N'}${complementoApto ? ` (${complementoApto})` : ''}`;

      const novaDoadora = await api.createDonor({
        protocolo: protocoloGerado,
        nomeCompleto: nomeMae,
        cpf: cpf || 'Não informado',
        telefone: telefone,
        dataNascimento: '1995-01-01',
        nomeBebe: nomeBebe,
        dataNascimentoBebe: respostas.dataNascimentoBebe || '2026-09-20',
        idadeBebeDias: resultado?.idadeBebeDias || 10,
        tipoLeite: resultado?.tipoLeite || 'MADURO',
        status: 'EM_ANALISE',
        motivoStatus: 'Pré-cadastro via Chatbot - Aguardando validação regulatória da Enfermagem BLH',
        respostas: respostas,
        comprovanteExames: comprovanteAnexado || undefined,
        endereco: {
          cep: cep || '57000-000',
          logradouro: fullEndLogradouro,
          numero: numeroResidencia || 'S/N',
          bairro: bairro,
          pontoReferencia: pontoReferencia,
          cidade: 'Maceió',
          regiaoLogistica: regiao
        }
      });

      const novoApt = await api.createAppointment({
        protocolo: novaDoadora.protocolo,
        doadoraId: novaDoadora.id,
        nomeDoadora: novaDoadora.nomeCompleto,
        telefone: novaDoadora.telefone,
        bairro: bairro,
        regiaoLogistica: regiao,
        enderecoCompleto: `${fullEndLogradouro}, ${bairro}, Maceió - AL${cep ? ` (CEP: ${cep})` : ''}`,
        pontoReferencia: pontoReferencia,
        motivo: motivoColeta,
        quantidadeFrascosEstimada: qtdFrascos,
        dataAgendada: dataColeta,
        turno: turnoColeta,
        status: 'PENDENTE'
      });

      // Registrar Log de Atividade Rastreável do Chatbot (ANVISA RDC 171/2006)
      try {
        await api.createLog({
          tipo: 'INTERACAO_CHAT',
          categoria: 'CHATBOT',
          protocolo: novaDoadora.protocolo,
          doadoraId: novaDoadora.id,
          doadoraNome: novaDoadora.nomeCompleto,
          usuarioResponsavel: 'Chatbot Virtual BLH (Atendimento Virtual)',
          cargoResponsavel: 'Agente de Inteligência Sanitária BLH',
          matriculaOuRegistro: 'BOT-MESM-UNCISAL',
          funcaoUsuario: 'SISTEMA_CHATBOT',
          acao: 'Triagem Clínica e Captação via WhatsApp',
          statusNovo: 'EM_ANALISE',
          detalhes: `Sessão de triagem virtual concluída para ${nomeMae} (Bebê: ${nomeBebe}). Bairro: ${bairro} (${regiao}). Agendamento prévio registrado para ${dataColeta} (${turnoColeta}).`,
          justificativaClinica: 'Triagem preliminar automatizada conforme RDC ANVISA nº 171/2006 Artigo 15. Encaminhado para homologação regulatória da Enfermagem BLH.',
          transcricaoChat: messages.slice(-12).map(m => ({
            remetente: m.sender === 'user' ? 'USUARIO' : 'BOT',
            mensagem: m.text,
            horario: new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          })),
          respostasTriagem: respostas,
          ipOuCanal: `WhatsApp Cloud API • Celular ${telefone}`,
          nivelRisco: 'SUCESSO',
          conformidadeNormativa: 'RDC ANVISA nº 171/2006 - Art. 15'
        });
      } catch (logErr) {
        console.warn('Registro de log do chatbot:', logErr);
      }

      setIsTyping(false);
      if (motivoColeta === 'RECEBER_FRASCOS') {
        pushBotMessage(
          `🎉 TUDO PRONTO! SEU CADASTRO E SOLICITAÇÃO DE FRASCOS FORAM REGISTRADOS COM SUCESSO!\n\n📋 Protocolo Oficial: ${novaDoadora.protocolo}\n🚐 Rota da Van: Bairro ${bairro} (Maceió)\n📦 Kit: ${qtdFrascos} frascos de vidro esterilizados com tampa plástica\n⏰ Previsão: Amanhã (${turnoColeta === 'MANHA' ? 'Turno da Manhã • 08h às 12h' : 'Turno da Tarde • 13h30 às 17h'})\n\nOs frascos são esterilizados em autoclave hospitalar conforme as normas da Fiocruz/ANVISA. O coletador entrará em contato via WhatsApp antes de chegar!`,
          'PROTOCOL_COMPLETED',
          [],
          { doadora: novaDoadora, agendamento: novoApt }
        );
      } else {
        pushBotMessage(
          `🎉 TUDO PRONTO! SEU PRÉ-CADASTRO E PROTOCOLO FORAM GERADOS COM SUCESSO!\n\n📋 Protocolo Oficial: ${novaDoadora.protocolo}\n⏳ Status: Aguardando Validação Regulatória pela Enfermagem BLH\n\nConforme a RDC 171/2006 da ANVISA, nossa equipe de enfermagem do BLH Santa Mônica conferirá os dados e exames para homologar a rota da van no bairro ${bairro}.\n\nLembre-se de manter os frascos com leite congelados no freezer a -10°C (validade de 15 dias)!`,
          'PROTOCOL_COMPLETED',
          [],
          { doadora: novaDoadora, agendamento: novoApt }
        );
      }
    } catch (err: any) {
      console.error(err);
      setIsTyping(false);
      if (err?.code === 'TELEFONE_DUPLICADO' || err?.message?.includes('já possui cadastro')) {
        pushBotMessage(
          `⚠️ Não foi possível concluir o pré-cadastro: este número de WhatsApp já possui um protocolo ativo no Banco de Leite da Santa Mônica (${err.protocolo || 'cadastrado'}).\n\nPor favor, utilize outro número ou consulte o seu protocolo existente.`,
          'INITIAL_MENU',
          [
            { label: '🔍 Consultar meu Protocolo', value: 'CONSULTAR_PROTOCOLO' },
            { label: '🏠 Menu Inicial', value: 'INICIAR' }
          ]
        );
      } else {
        pushBotMessage('Houve um pequeno problema ao registrar. Por favor, tente novamente.', 'INITIAL_MENU');
      }
    }
  };

  const handleRequestCorrection = (field: 'NOME' | 'WHATSAPP' | 'ENDERECO' | 'TURNO') => {
    if (activeStep !== 'FORM_CONFIRM_SUMMARY') return;
    if (field === 'NOME') {
      pushUserMessage('Quero alterar meu nome ✏️');
      pushBotMessage('Por favor, digite seu nome e sobrenome corretos:', 'FORM_NAME');
    } else if (field === 'WHATSAPP') {
      pushUserMessage('Quero alterar meu número de WhatsApp ✏️');
      pushBotMessage('Por favor, informe seu número de WhatsApp com DDD:', 'FORM_PHONE');
    } else if (field === 'ENDERECO') {
      pushUserMessage('Quero alterar meu endereço de coleta ✏️');
      pushBotMessage('Em qual bairro de Maceió você mora?', 'FORM_NEIGHBORHOOD');
    } else if (field === 'TURNO') {
      pushUserMessage('Quero alterar o tipo de coleta / turno ✏️');
      pushBotMessage(
        'Como a equipe da van do Banco de Leite pode ajudar você? 🚐',
        'FORM_PURPOSE_AND_BOTTLES',
        [
          { label: '🍼 Doar Leite Materno (e repor novos frascos)', value: 'AMBOS' },
          { label: '❄️ Apenas Entregar Leite Congelado', value: 'BUSCAR_LEITE' },
          { label: '🫙 Apenas Receber Frascos Esterilizados', value: 'RECEBER_FRASCOS' }
        ]
      );
    }
  };

  // Consulta e Recuperação de protocolo por chat
  const handleLookupProtocol = async (code: string) => {
    if (!code.trim()) return;
    pushUserMessage(code.trim());
    setIsTyping(true);
    try {
      const res = await api.lookupProtocol(code.trim());
      setIsTyping(false);
      if (res && res.doadora) {
        setExistingDonorData(res.doadora);
        const donorName = (res.doadora as any).primeiroNome || res.doadora.nomeCompleto.split(' ')[0] || 'mamãe';
        const bairroDoadora = res.doadora.endereco?.bairro || (res.doadora as any).bairro || 'Maceió';
        const telefoneDoadora = (res.doadora as any).telefoneMascarado || res.doadora.telefone || '';

        pushBotMessage(
          `Localizei o seu cadastro e recuperei o seu protocolo, ${donorName}! 🎉\n\n📋 PROTOCOLO OFICIAL: ${res.protocolo}\n👤 Doadora: ${res.doadora.nomeCompleto}\n📱 Telefone Cadastrado: ${telefoneDoadora || 'WhatsApp ativo'}\n📍 Bairro de Coleta: ${bairroDoadora} (Maceió)\n🩺 Situação no Banco de Leite: ${res.doadora.status}\n\nGuarde o código ${res.protocolo} com carinho! O que você gostaria de agendar hoje?`,
          'PROTOCOL_COMPLETED',
          [
            { label: '❄️ Devolver Leite / Agendar Coleta', value: 'AGENDAR_DEVOLVER_LEITE' },
            { label: '🫙 Solicitar Frascos Esterilizados (Pedir Kit)', value: 'AGENDAR_PEGAR_FRASCOS' },
            { label: '🔄 Reiniciar o chat', value: 'REINICIAR' }
          ],
          { doadora: res.doadora, agendamento: res.agendamento, protocolo: res.protocolo }
        );
      } else {
        pushBotMessage(
          'Não localizamos nenhum cadastro com este protocolo, WhatsApp ou CPF. 🔍\n\nCaso tenha esquecido o número do protocolo, tente digitar seu WhatsApp com DDD (ex: 82 98842-1234) ou seu CPF.\n\nSe for o seu primeiro pedido, você pode fazer seu cadastro agora mesmo!',
          'LOOKUP_INPUT',
          [
            { label: '🫙 Pedir Kit de Frascos (Fazer Cadastro)', value: 'NOVO_CADASTRO_FRASCOS' },
            { label: '💖 Fazer Triagem para Doar Leite', value: 'NOVA_TRIAGEM' },
            { label: '🏠 Menu Inicial', value: 'MENU_INICIAL' }
          ]
        );
      }
    } catch (err) {
      setIsTyping(false);
      pushBotMessage(
        'Não localizamos nenhum cadastro ativo com esse protocolo, WhatsApp ou CPF no sistema do Banco de Leite da Santa Mônica. Deseja realizar seu cadastro agora?',
        'LOOKUP_INPUT',
        [
          { label: '🫙 Pedir Frascos Esterilizados (Fazer Cadastro)', value: 'NOVO_CADASTRO_FRASCOS' },
          { label: '💖 Iniciar Triagem para Doar', value: 'NOVA_TRIAGEM' },
          { label: '🏠 Menu Inicial', value: 'MENU_INICIAL' }
        ]
      );
    }
  };

  // Envio manual de texto pelo input bar inferior
  const handleManualInputSubmit = () => {
    if (!inputMessage.trim()) return;
    const txt = inputMessage.trim();
    setInputMessage('');

    const lower = txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (activeStep === 'INITIAL_MENU') {
      pushUserMessage(txt);

      // Verificação de intenções
      const isGreeting = /^(oi|ola|olá|bom dia|boa tarde|boa noite|ola dra|dra|opa|alo|alô|ei|ola monica|dra monica|monica|chatbot|bot)\b/i.test(lower) || lower === 'oi' || lower === 'ola' || lower === 'olá';
      const isForgotProtocol = lower.includes('esqueci') || lower.includes('perdi') || lower.includes('nao sei') || lower.includes('nao lembro') || lower.includes('recuperar') || lower.includes('qual meu protocolo') || lower.includes('perdi o codigo');
      const isFirstTimeBottles = (lower.includes('primeiro pedido') || lower.includes('primeira vez') || lower.includes('novo pedido') || lower.includes('nunca pedi') || lower.includes('primeiro kit')) && (lower.includes('frasco') || lower.includes('pote') || lower.includes('kit') || lower.includes('vidro'));
      const isGetBottlesIntent = lower.includes('frasco') || lower.includes('pote') || lower.includes('vidro') || lower.includes('recipiente') || lower.includes('pegar frasco') || lower.includes('pedir frasco') || lower.includes('solicitar frasco') || lower.includes('trazer frasco') || lower.includes('kit');
      const isReturnMilkIntent = lower.includes('devolver') || lower.includes('recolher') || lower.includes('leite congelado') || lower.includes('buscar leite') || lower.includes('pegar o leite') || lower.includes('coleta') || lower.includes('agendar coleta') || lower.includes('van vir') || lower.includes('entregar leite') || lower.includes('buscar o leite');
      const isDonationIntent = (lower.includes('doar') || lower.includes('doacao') || lower.includes('leite') || lower.includes('quero doar') || lower.includes('triagem') || lower.includes('cadastro')) && !isGetBottlesIntent && !isReturnMilkIntent;
      const isLookupIntent = lower.includes('consultar') || lower.includes('protocolo') || lower.includes('status') || lower.includes('codigo') || lower.includes('blh');
      const isGuideIntent = lower.includes('guia') || lower.includes('ferver') || lower.includes('norma') || lower.includes('fiocruz') || lower.includes('esteriliz');
      const isContactIntent = lower.includes('telefone') || lower.includes('contato') || lower.includes('endereco') || lower.includes('onde fica') || lower.includes('whatsapp');
      const isExamIntent = lower.includes('exame') || lower.includes('sorologia') || lower.includes('sangue') || lower.includes('caderneta') || lower.includes('laudo') || lower.includes('vdrl') || lower.includes('hiv');

      if (isForgotProtocol) {
        handleMenuOption('CONSULTAR_PROTOCOLO');
      } else if (isFirstTimeBottles) {
        handleGetBottlesChoice('PRIMEIRA_VEZ');
      } else if (isGetBottlesIntent) {
        handleMenuOption('PEGAR_FRASCOS');
      } else if (isReturnMilkIntent) {
        handleMenuOption('DEVOLVER_LEITE');
      } else if (isLookupIntent) {
        handleMenuOption('CONSULTAR_PROTOCOLO');
      } else if (isDonationIntent && !isGreeting) {
        pushBotMessage(
          'Que alegria imensa! Cada frasco doado salva prematuros na nossa UTI Neonatal da Santa Mônica. 🤱✨\n\nPrimeira pergunta de segurança da rBLH:\nVocê está amamentando ou retirando leite para o seu próprio bebê?',
          'QUESTION_P1',
          [
            { label: 'Sim, estou amamentando meu bebê', value: true },
            { label: 'Não estou amamentando', value: false }
          ]
        );
      } else if (isExamIntent) {
        pushBotMessage(
          'A verificação dos exames é muito simples e 100% gratuita! 🩺✨\n\nPela norma da ANVISA (RDC nº 171/2006), são conferidos os exames de rotina que você já realizou durante o pré-natal e parto: HIV, Sífilis, Hepatites B e C.\n\nVocê pode comprovar de 3 formas práticas:\n1️⃣ Apresentando sua Caderneta da Gestante / Cartão de Pré-Natal quando a van do hospital for à sua casa;\n2️⃣ Enviando foto das páginas de exames aqui no chat da Maternidade;\n3️⃣ Caso você não tenha o cartão em mãos ou os exames tenham vencido (> 6 meses), a equipe da Santa Mônica colhe o sangue gratuitamente em domicílio!\n\nDeseja iniciar a sua triagem agora?',
          'INITIAL_MENU',
          [
            { label: '💖 Iniciar Triagem para Doar', value: 'INICIAR_TRIAGEM' },
            { label: '🫙 Solicitar Frascos Esterilizados', value: 'PEGAR_FRASCOS' },
            { label: '📖 Guia de Fervura e Coleta (Fiocruz)', value: 'VER_GUIA' }
          ]
        );
      } else if (isGuideIntent) {
        pushBotMessage(
          'O nosso Guia Sanitário Fiocruz orienta: use vidro de café solúvel com tampa plástica, ferva por 15 minutos e congele por até 15 dias a -10°C.',
          'INITIAL_MENU',
          [
            { label: '💖 Quero Iniciar Triagem de Doação', value: 'INICIAR_TRIAGEM' },
            { label: '🫙 Solicitar Frascos Esterilizados', value: 'PEGAR_FRASCOS' },
            { label: '❄️ Devolver Leite Congelado', value: 'DEVOLVER_LEITE' }
          ]
        );
        if (onOpenGuidelines) onOpenGuidelines();
      } else if (isContactIntent) {
        pushBotMessage(
          'O Banco de Leite da Santa Mônica fica na Av. Comendador Leão, s/n - Poço, Maceió - AL.\n\nTelefone/WhatsApp: (82) 3315-4434\nAtendimento: Segunda a Sexta, das 07h às 18h.\nA nossa van também busca o leite na sua casa sem custo!',
          'INITIAL_MENU',
          [
            { label: '💖 Quero Doar Leite Materno', value: 'INICIAR_TRIAGEM' },
            { label: '🫙 Pegar Frascos Esterilizados', value: 'PEGAR_FRASCOS' },
            { label: '❄️ Devolver o Leite / Coleta', value: 'DEVOLVER_LEITE' }
          ]
        );
      } else {
        // Saudação gentil ("oi", "olá", "boa tarde") ou qualquer mensagem geral
        pushBotMessage(
          'Olá, mamãe! Tudo bem com você e com seu bebê? 😊 Sou a Dra. Mônica, o chatbot do Banco de Leite Humano da Maternidade Escola Santa Mônica (MESM / UNCISAL).\n\nEstou à sua disposição! Como posso ajudar você hoje?',
          'INITIAL_MENU',
          [
            { label: '💖 Quero Doar Leite Materno (Nova Doadora)', value: 'INICIAR_TRIAGEM' },
            { label: '🫙 Pegar Frascos Esterilizados (Pedir Kit)', value: 'PEGAR_FRASCOS' },
            { label: '❄️ Devolver o Leite / Agendar Coleta', value: 'DEVOLVER_LEITE' },
            { label: '🔍 Esqueci meu Protocolo / Consultar Cadastro', value: 'CONSULTAR_PROTOCOLO' },
            { label: '📖 Guia de Fervura e Coleta (Fiocruz)', value: 'VER_GUIA' }
          ]
        );
      }
      return;
    }

    if (activeStep === 'LOOKUP_INPUT') {
      if (lower.includes('novo cadastro') || lower.includes('pedir kit') || lower.includes('primeiro pedido') || (lower.includes('frasco') && !lower.includes('blh'))) {
        handleGetBottlesChoice('PRIMEIRA_VEZ');
        return;
      }
      if (lower.includes('triagem') || lower.includes('doar')) {
        handleMenuOption('INICIAR_TRIAGEM');
        return;
      }
      if (lower.includes('menu') || lower.includes('inicio') || lower.includes('voltar')) {
        iniciarConversa();
        return;
      }
      handleLookupProtocol(txt);
      return;
    }

    if (activeStep === 'ACTION_LOOKUP_INPUT') {
      if (lower.includes('novo cadastro') || lower.includes('cadastrar agora') || lower.includes('primeiro')) {
        handleGetBottlesChoice('PRIMEIRA_VEZ');
        return;
      }
      handleActionLookup(txt);
      return;
    }

    if (activeStep === 'FLOW_GET_BOTTLES_CHOICE') {
      if (lower.includes('primeiro') || lower.includes('primeira') || lower.includes('novo') || lower.includes('nunca') || lower === '2') {
        handleGetBottlesChoice('PRIMEIRA_VEZ');
      } else if (lower.includes('ja') || lower.includes('cadastr') || lower.includes('tenho') || lower === '1') {
        handleGetBottlesChoice('JA_CADASTRADA');
      } else {
        handleGetBottlesChoice('PRIMEIRA_VEZ');
      }
      return;
    }

    if (activeStep === 'FLOW_RETURN_MILK_CHOICE') {
      if (lower.includes('primeiro') || lower.includes('primeira') || lower.includes('novo') || lower.includes('nunca') || lower === '2') {
        handleReturnMilkChoice('PRIMEIRA_VEZ');
      } else if (lower.includes('ja') || lower.includes('cadastr') || lower.includes('tenho') || lower === '1') {
        handleReturnMilkChoice('JA_CADASTRADA');
      } else {
        handleReturnMilkChoice('PRIMEIRA_VEZ');
      }
      return;
    }

    if (activeStep === 'EXISTING_DONOR_ACTION_BOTTLES') {
      const numMatch = txt.match(/\d+/);
      const qtd = numMatch ? Math.max(1, Math.min(20, parseInt(numMatch[0], 10))) : 2;
      handleExistingDonorBottles(qtd);
      return;
    }

    if (activeStep === 'EXISTING_DONOR_NEED_REPLACEMENT') {
      if (lower.includes('s') || lower.includes('sim') || lower.includes('repor') || lower.includes('quero') || lower.includes('frasco') || lower === '1') {
        handleExistingDonorNeedReplacement(true);
      } else {
        handleExistingDonorNeedReplacement(false);
      }
      return;
    }

    if (activeStep === 'EXISTING_DONOR_ACTION_SHIFT') {
      if (lower.includes('manha') || lower.includes('manhã') || lower === '1' || lower.includes('8') || lower.includes('08')) {
        handleExistingDonorShift('MANHA');
      } else if (lower.includes('tarde') || lower === '2' || lower.includes('13') || lower.includes('14') || lower.includes('15')) {
        handleExistingDonorShift('TARDE');
      } else {
        pushUserMessage(txt);
        pushBotMessage('Por favor, informe se prefere Manhã (08h às 12h) ou Tarde (13h30 às 17h):', 'EXISTING_DONOR_ACTION_SHIFT', [
          { label: '☀️ Manhã (08h às 12h)', value: 'MANHA' },
          { label: '🌤️ Tarde (13h30 às 17h)', value: 'TARDE' }
        ]);
      }
      return;
    }

    if (activeStep === 'QUESTION_P1') {
      if (lower.startsWith('s') || lower.includes('sim') || lower.includes('amamento')) {
        handleAnswerP1(true);
      } else if (lower.startsWith('n') || lower.includes('nao')) {
        handleAnswerP1(false);
      } else {
        pushUserMessage(txt);
        pushBotMessage('Por favor, informe se você está amamentando seu bebê:', 'QUESTION_P1', [
          { label: 'Sim, estou amamentando meu bebê', value: true },
          { label: 'Não estou amamentando', value: false }
        ]);
      }
      return;
    }

    if (activeStep === 'QUESTION_P2') {
      if (lower.startsWith('s') || lower.includes('sim') || lower.includes('sobra')) {
        handleAnswerP2(true);
      } else if (lower.startsWith('n') || lower.includes('nao')) {
        handleAnswerP2(false);
      } else {
        pushUserMessage(txt);
        pushBotMessage('Por favor, confirme se você percebe leite excedente (sobrando):', 'QUESTION_P2', [
          { label: 'Sim! Ele mama bem e tenho sobra ✨', value: true },
          { label: 'Não percebo sobra de leite', value: false }
        ]);
      }
      return;
    }

    if (activeStep === 'QUESTION_P3_DATE') {
      handleAnswerP3(txt);
      return;
    }

    if (activeStep === 'QUESTION_P4_CARD') {
      if (lower.startsWith('s') || lower.includes('sim') || lower.includes('tenho')) {
        handleAnswerP4(true);
      } else if (lower.startsWith('n') || lower.includes('nao')) {
        handleAnswerP4(false);
      } else {
        pushUserMessage(txt);
        pushBotMessage('Você possui a Caderneta da Gestante / Cartão de Pré-Natal em mãos?', 'QUESTION_P4_CARD', [
          { label: 'Sim, possuo a Caderneta', value: true },
          { label: 'Não tenho o cartão físico em mãos', value: false }
        ]);
      }
      return;
    }

    if (activeStep === 'FORM_NAME') {
      handleFormName(txt);
      return;
    }

    if (activeStep === 'FORM_PHONE') {
      handleFormPhone(txt);
      return;
    }

    if (activeStep === 'FORM_BABY_NAME') {
      handleFormBabyName(txt);
      return;
    }

    if (activeStep === 'FORM_NEIGHBORHOOD') {
      const cleanDigits = txt.replace(/\D/g, '');
      if (cleanDigits.length === 8) {
        consultarCep(cleanDigits);
        setActiveStep('FORM_STREET_NUMBER');
        return;
      }
      const match = BAIRROS_MACEIO.find(b => b.nome.toLowerCase().includes(lower) || lower.includes(b.nome.toLowerCase()));
      if (match) {
        handleFormNeighborhood(match.nome);
      } else {
        handleFormNeighborhood(txt);
      }
      return;
    }

    if (activeStep === 'FORM_STREET_NUMBER') {
      const cleanDigits = txt.replace(/\D/g, '');
      if (cleanDigits.length === 8) {
        consultarCep(cleanDigits);
        return;
      }
      handleFormStreetNumber(txt);
      return;
    }

    if (activeStep === 'FORM_LANDMARK') {
      handleFormLandmark(txt);
      return;
    }

    if (activeStep === 'FORM_PURPOSE_AND_BOTTLES') {
      if (lower.includes('apenas receber') || lower.includes('so receber') || lower.includes('vidro') || lower.includes('frasco') || lower.includes('vazio') || lower.includes('esteriliz')) {
        handleFormPurpose('RECEBER_FRASCOS');
      } else if (lower.includes('apenas entregar') || lower.includes('so entregar') || lower.includes('congelado')) {
        handleFormPurpose('BUSCAR_LEITE');
      } else {
        handleFormPurpose('AMBOS');
      }
      return;
    }

    if (activeStep === 'FORM_BOTTLES_COUNT') {
      const numMatch = txt.match(/\d+/);
      const qtd = numMatch ? Math.max(1, Math.min(20, parseInt(numMatch[0], 10))) : 2;
      handleFormBottlesCount(qtd);
      return;
    }

    if (activeStep === 'FORM_DATE_SHIFT') {
      if (lower.includes('manha') || lower.includes('manhã') || lower === '1' || lower.includes('8') || lower.includes('08')) {
        handleFormShift('MANHA');
      } else if (lower.includes('tarde') || lower === '2' || lower.includes('13') || lower.includes('14') || lower.includes('15') || lower.includes('16')) {
        handleFormShift('TARDE');
      } else {
        pushUserMessage(txt);
        pushBotMessage('Por favor, escolha o turno de preferência para a visita da van:', 'FORM_DATE_SHIFT', [
          { label: '☀️ Manhã (08h às 12h)', value: 'MANHA' },
          { label: '🌤️ Tarde (13h30 às 17h)', value: 'TARDE' }
        ]);
      }
      return;
    }

    if (activeStep === 'FORM_CONFIRM_SUMMARY') {
      if (lower.includes('confirm') || lower.includes('sim') || lower.includes('ok') || lower.includes('certo') || lower.includes('gerar') || lower.includes('protocolo')) {
        handleFinalConfirmation();
      } else if (lower.includes('nome')) {
        handleRequestCorrection('NOME');
      } else if (lower.includes('whats') || lower.includes('tel') || lower.includes('fone')) {
        handleRequestCorrection('WHATSAPP');
      } else if (lower.includes('end') || lower.includes('rua') || lower.includes('bairro')) {
        handleRequestCorrection('ENDERECO');
      } else if (lower.includes('turno') || lower.includes('hora') || lower.includes('frasco')) {
        handleRequestCorrection('TURNO');
      } else {
        pushUserMessage(txt);
        pushBotMessage('Por favor, confirme seus dados acima ou selecione para corrigir alguma informação:', 'FORM_CONFIRM_SUMMARY');
      }
      return;
    }

    if (activeStep === 'QUESTION_P10_P11_MEDS') {
      handleAnswerP10P11(true, txt);
      return;
    }

    pushUserMessage(txt);
    pushBotMessage('Recebi sua mensagem! Por favor, utilize as opções no chat para continuarmos seu atendimento.');
  };

  // Google Calendar link
  const gerarLinkGoogleAgenda = (apt: AgendamentoColeta) => {
    const dataStr = apt.dataAgendada.split('-').join('');
    const startTime = apt.turno === 'MANHA' ? `${dataStr}T083000` : `${dataStr}T140000`;
    const endTime = apt.turno === 'MANHA' ? `${dataStr}T113000` : `${dataStr}T170000`;
    const title = encodeURIComponent(`Coleta Banco de Leite MESM - ${apt.protocolo}`);
    const details = encodeURIComponent(`Visita da van da Maternidade Santa Mônica (UNCISAL).\nProtocolo: ${apt.protocolo}\nDoadora: ${apt.nomeDoadora}\nEndereço: ${apt.enderecoCompleto}`);
    const location = encodeURIComponent(`${apt.enderecoCompleto}, Maceió - AL`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
  };

  return (
    <div className="flex items-center justify-center w-full px-2 sm:px-4 py-2 sm:py-6">
      {/* ------------------------------------------------------------- */}
      {/* SMARTPHONE DEVICE FRAME (ASPECTO DE CELULAR EM QUALQUER TELA) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full max-w-[380px] sm:max-w-[420px] h-[min(780px,calc(100dvh-100px))] sm:h-[820px] bg-slate-900 rounded-[44px] sm:rounded-[50px] p-2.5 sm:p-3 shadow-2xl ring-6 sm:ring-12 ring-slate-800/90 shadow-emerald-950/40 flex flex-col overflow-hidden shrink-0">
        {/* Dynamic Island (visível em todas as telas) */}
        <div className="flex absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-4 sm:h-5 bg-black rounded-full z-30 items-center justify-center gap-1.5 sm:gap-2">
          <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-slate-900 border border-slate-700/60"></div>
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-900/60"></div>
        </div>

        {/* Smartphone Screen Inner */}
        <div className="w-full h-full bg-[#f8fafc] rounded-[34px] sm:rounded-[40px] flex flex-col overflow-hidden relative shadow-inner">
          {/* Status Bar (visível em todas as telas para manter o aspecto de celular) */}
          <div className="flex h-8 sm:h-9 bg-emerald-950 text-white items-center justify-between px-5 sm:px-6 pt-0.5 sm:pt-1 text-[10px] sm:text-[11px] font-semibold tracking-tight z-20 select-none shrink-0">
            <span>{currentTime}</span>
            <div className="flex items-center gap-1.5 opacity-90">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>

          {/* Chat App Header (Santa Mônica: Verde Institucional MESM + Branco) */}
          <div className="bg-linear-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white px-3 sm:px-4 py-2.5 shadow-md flex items-center justify-between z-20 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-emerald-800 flex items-center justify-center font-bold shadow-xs border-2 border-emerald-300">
                  <Baby className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-emerald-950 rounded-full"></div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="text-xs font-bold leading-tight truncate">Dra. Mônica</h3>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                </div>
                <p className="text-[10px] text-emerald-200 leading-tight truncate">
                  Banco de Leite MESM • UNCISAL
                </p>
                <span className="text-[9px] text-emerald-300 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online no WhatsApp
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={iniciarConversa}
                title="Reiniciar o chat desde o início"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-[10px] sm:text-[11px] font-bold transition-all border border-white/20 shadow-xs cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                <span className="whitespace-nowrap">Reiniciar o chat</span>
              </button>

              {onOpenGuidelines && (
                <button
                  type="button"
                  onClick={onOpenGuidelines}
                  title="Guia Sanitário Fiocruz"
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/90 cursor-pointer"
                >
                  <Info className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Subtitle institucional da saúde */}
          <div className="bg-emerald-50 border-b border-emerald-100 px-3 py-1 flex items-center justify-between text-[10px] text-emerald-950 font-medium">
            <span className="truncate">bancodeleite.uncisal.edu.br</span>
            <span className="text-emerald-700 font-bold shrink-0">Custo R$ 0,00</span>
          </div>

          {/* Chat Messages Body */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"
          >
            {messages.map((msg, index) => {
              // Somente renderiza botões/interações se for a pergunta ATUAL ativa no chat
              const lastActiveIdx = messages.map((m) => m.stepType).lastIndexOf(activeStep);
              const isStepActive = msg.stepType === activeStep && index === lastActiveIdx;

              return (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
              >
                {/* Balão da Mensagem */}
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  {/* Visualização de Anexo (Foto da Caderneta / Laudo PDF) */}
                  {msg.attachment && (
                    <div className="mb-2 rounded-xl overflow-hidden bg-black/15 border border-white/20">
                      {msg.attachment.type === 'image' ? (
                        <div 
                          onClick={() => setPreviewAttachmentUrl(msg.attachment!.url)}
                          className="relative cursor-pointer group"
                        >
                          <img 
                            src={msg.attachment.url} 
                            alt={msg.attachment.name} 
                            className="w-full h-36 object-cover rounded-t-xl group-hover:opacity-90 transition-opacity" 
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-black/70 text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                              <Eye className="w-3.5 h-3.5" /> Ampliar Foto
                            </span>
                          </div>
                          <div className="p-2 bg-emerald-900/90 text-white flex items-center justify-between text-[10px]">
                            <span className="truncate font-semibold flex items-center gap-1">
                              <Camera className="w-3 h-3 shrink-0" />
                              {msg.attachment.name}
                            </span>
                            <span className="shrink-0 text-emerald-200 text-[9px]">
                              {msg.attachment.tamanhoKb ? `${msg.attachment.tamanhoKb} KB` : ''}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-900/90 text-white flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 truncate">
                            <div className="font-bold text-xs truncate">{msg.attachment.name}</div>
                            <div className="text-[10px] text-emerald-200">Documento PDF de Exames</div>
                          </div>
                        </div>
                      )}
                      {msg.attachment.caption && (
                        <div className="px-2.5 py-1 text-[9px] bg-black/20 text-emerald-100 italic">
                          {msg.attachment.caption}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="whitespace-pre-line">{msg.text}</p>
                  <div
                    className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                      msg.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-emerald-200" />}
                  </div>
                </div>

                {/* --------------------------------------------------------- */}
                {/* OPÇÕES INTERATIVAS NO CHAT (APENAS NA ETAPA ATIVA): */}
                {/* --------------------------------------------------------- */}

                {/* Menu Inicial */}
                {isStepActive && msg.stepType === 'INITIAL_MENU' && msg.options && (
                  <div className="mt-2 w-[88%] space-y-1.5">
                    {msg.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleMenuOption(opt.value)}
                        className="w-full py-2.5 px-3 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                      >
                        <span>{opt.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Opções dos Novos Fluxos (Pegar Frascos / Devolver Leite / Ações Rápidas / Consulta) */}
                {isStepActive && msg.options && (
                  msg.stepType === 'FLOW_GET_BOTTLES_CHOICE' ||
                  msg.stepType === 'FLOW_RETURN_MILK_CHOICE' ||
                  msg.stepType === 'EXISTING_DONOR_ACTION_BOTTLES' ||
                  msg.stepType === 'EXISTING_DONOR_NEED_REPLACEMENT' ||
                  msg.stepType === 'EXISTING_DONOR_ACTION_SHIFT' ||
                  msg.stepType === 'ACTION_LOOKUP_INPUT' ||
                  msg.stepType === 'LOOKUP_INPUT' ||
                  msg.stepType === 'PROTOCOL_COMPLETED'
                ) && (
                  <div className="mt-2 w-[88%] space-y-1.5">
                    {msg.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (msg.stepType === 'FLOW_GET_BOTTLES_CHOICE') handleGetBottlesChoice(opt.value);
                          else if (msg.stepType === 'FLOW_RETURN_MILK_CHOICE') handleReturnMilkChoice(opt.value);
                          else if (msg.stepType === 'EXISTING_DONOR_ACTION_BOTTLES') handleExistingDonorBottles(opt.value);
                          else if (msg.stepType === 'EXISTING_DONOR_NEED_REPLACEMENT') handleExistingDonorNeedReplacement(opt.value);
                          else if (msg.stepType === 'EXISTING_DONOR_ACTION_SHIFT') handleExistingDonorShift(opt.value as TurnoColeta);
                          else if (msg.stepType === 'ACTION_LOOKUP_INPUT') {
                            if (opt.value === 'MENU_INICIAL') iniciarConversa();
                            else if (opt.value === 'FRASCOS_PRIMEIRA_VEZ') handleGetBottlesChoice('PRIMEIRA_VEZ');
                            else if (opt.value === 'INICIAR_TRIAGEM') handleMenuOption('INICIAR_TRIAGEM');
                          } else if (msg.stepType === 'LOOKUP_INPUT') {
                            if (opt.value === 'MENU_INICIAL') iniciarConversa();
                            else if (opt.value === 'NOVO_CADASTRO_FRASCOS') handleGetBottlesChoice('PRIMEIRA_VEZ');
                            else if (opt.value === 'NOVA_TRIAGEM') handleMenuOption('INICIAR_TRIAGEM');
                          } else if (msg.stepType === 'PROTOCOL_COMPLETED') {
                            if (opt.value === 'AGENDAR_DEVOLVER_LEITE') handleTriggerDirectAction('DEVOLVER_LEITE', msg.data?.doadora || existingDonorData);
                            else if (opt.value === 'AGENDAR_PEGAR_FRASCOS') handleTriggerDirectAction('PEGAR_FRASCOS', msg.data?.doadora || existingDonorData);
                            else if (opt.value === 'REINICIAR') iniciarConversa();
                          }
                        }}
                        className="w-full py-2.5 px-3 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                      >
                        <span>{opt.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Caixa Interativa de Busca / Recuperação de Protocolo */}
                {isStepActive && (msg.stepType === 'LOOKUP_INPUT' || msg.stepType === 'ACTION_LOOKUP_INPUT') && (
                  <div className="mt-2 w-[92%] bg-white p-3 rounded-2xl border border-sky-200 shadow-sm space-y-2">
                    <span className="text-[11px] text-sky-950 font-bold block flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-sky-600" />
                      Digite seu WhatsApp com DDD, CPF ou Protocolo:
                    </span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Ex: 82988421234, CPF ou BLH..."
                        value={lookupInputValue}
                        onChange={(e) => setLookupInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = lookupInputValue.trim();
                            if (val) {
                              setLookupInputValue('');
                              if (msg.stepType === 'ACTION_LOOKUP_INPUT') handleActionLookup(val);
                              else handleLookupProtocol(val);
                            }
                          }
                        }}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-400 font-medium text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = lookupInputValue.trim();
                          if (val) {
                            setLookupInputValue('');
                            if (msg.stepType === 'ACTION_LOOKUP_INPUT') handleActionLookup(val);
                            else handleLookupProtocol(val);
                          }
                        }}
                        className="px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                      >
                        Localizar
                      </button>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-slate-500 font-medium">Exemplos de teste:</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (msg.stepType === 'ACTION_LOOKUP_INPUT') handleActionLookup('BLH-2026-0142');
                          else handleLookupProtocol('BLH-2026-0142');
                        }}
                        className="text-sky-700 hover:text-sky-900 underline font-mono cursor-pointer"
                      >
                        BLH-2026-0142
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (msg.stepType === 'ACTION_LOOKUP_INPUT') handleActionLookup('82988421234');
                          else handleLookupProtocol('82988421234');
                        }}
                        className="text-emerald-700 hover:text-emerald-900 underline font-mono cursor-pointer"
                      >
                        (82) 98842-1234
                      </button>
                    </div>
                  </div>
                )}

                {/* P1: Amamentação */}
                {isStepActive && msg.stepType === 'QUESTION_P1' && (
                  <div className="mt-2 w-[88%] space-y-1.5">
                    <button
                      onClick={() => handleAnswerP1(true)}
                      className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>Sim, estou amamentando meu bebê 🤱</span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    <button
                      onClick={() => handleAnswerP1(false)}
                      className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Não estou amamentando</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                )}

                {/* P2: Sobra de Leite */}
                {isStepActive && msg.stepType === 'QUESTION_P2' && (
                  <div className="mt-2 w-[88%] space-y-1.5">
                    <button
                      onClick={() => handleAnswerP2(true)}
                      className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>Sim! Ele mama bem e tenho leite sobrando ✨</span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    <button
                      onClick={() => handleAnswerP2(false)}
                      className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Não percebo leite sobrando</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                )}

                {/* P3: Data de Nascimento do Bebê */}
                {isStepActive && msg.stepType === 'QUESTION_P3_DATE' && (
                  <div className="mt-2 w-[88%] bg-white p-3 rounded-xl border border-sky-200 shadow-xs space-y-2.5">
                    <label className="block text-[11px] font-bold text-sky-950">
                      Informe a data de nascimento do seu bebê:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="date"
                        min={new Date(Date.now() - 730 * 86400000).toISOString().split('T')[0]}
                        max={new Date().toISOString().split('T')[0]}
                        value={selectedDateP3}
                        onChange={(e) => setSelectedDateP3(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-semibold text-slate-800"
                      />
                      <button
                        onClick={() => {
                          if (!selectedDateP3) {
                            alert('Por favor, selecione uma data no calendário.');
                            return;
                          }
                          handleAnswerP3(selectedDateP3);
                        }}
                        className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-2xs cursor-pointer"
                      >
                        Confirmar
                      </button>
                    </div>

                    {/* Atalhos Rápidos por Idade */}
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold block">Ou toque em uma faixa aproximada:</span>
                      <div className="grid grid-cols-1 gap-1">
                        <button
                          onClick={() => {
                            const d = new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0];
                            handleAnswerP3(d);
                          }}
                          className="py-1.5 px-2 text-left bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          🍼 Nasceu há 4 dias (Colostro - Ouro da UTIN)
                        </button>
                        <button
                          onClick={() => {
                            const d = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];
                            handleAnswerP3(d);
                          }}
                          className="py-1.5 px-2 text-left bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          👶 Nasceu há 10 dias (Transição)
                        </button>
                        <button
                          onClick={() => {
                            const d = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
                            handleAnswerP3(d);
                          }}
                          className="py-1.5 px-2 text-left bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          🌸 Nasceu há 30 dias (Maduro)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* P4: Caderneta Pré-Natal */}
                {isStepActive && msg.stepType === 'QUESTION_P4_CARD' && (
                  <div className="mt-2 w-[88%] space-y-1.5">
                    <button
                      onClick={() => setShowAttachmentModal(true)}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors shadow-xs cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Camera className="w-4 h-4 shrink-0 text-white" />
                        <span>📷 Enviar Foto da Caderneta / Exames Agora</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />
                    </button>
                    <button
                      onClick={() => handleAnswerP4(true)}
                      className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Sim, vou apresentar a Caderneta na visita</span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    <button
                      onClick={() => handleAnswerP4(false)}
                      className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Não tenho o cartão físico em mãos (preciso de coleta)</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                )}

                {/* P5: Sorologia */}
                {isStepActive && msg.stepType === 'QUESTION_P5_SEROLOGY' && (
                  <div className="mt-2 w-[88%] space-y-1.5">
                    <button
                      onClick={() => handleAnswerP5(false)}
                      className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>Todos negativos / não reagentes 🛡️</span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    <button
                      onClick={() => handleAnswerP5(true)}
                      className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Tive exame positivo / reagente</span>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                )}

                {/* P6 & P7: Hábitos */}
                {isStepActive && msg.stepType === 'QUESTION_P6_P7_HABITS' && (
                  <div className="mt-2 w-[88%] space-y-1.5">
                    <button
                      onClick={() => handleAnswerP6P7('NENHUM')}
                      className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Não fumo nem bebo 🛡️</span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    <button
                      onClick={() => handleAnswerP6P7('ATE_10')}
                      className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Fumo até 10 cigarros/dia</span>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                    <button
                      onClick={() => handleAnswerP6P7('ALCOOL')}
                      className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Bebo álcool esporadicamente</span>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                    <button
                      onClick={() => handleAnswerP6P7('IMPEDITIVO')}
                      className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Fumo mais de 10/dia ou uso substâncias</span>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                )}

                {/* P8 & P9: Procedimentos */}
                {isStepActive && msg.stepType === 'QUESTION_P8_P9_PROCEDURES' && (
                  <div className="mt-2 w-[88%] space-y-1.5">
                    <button
                      onClick={() => handleAnswerP8P9(false)}
                      className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>Não fiz tatuagem nem transfusão recente 🛡️</span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    <button
                      onClick={() => handleAnswerP8P9(true)}
                      className="w-full py-2 px-3 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Sim, fiz nos últimos 12 meses</span>
                      <ChevronRight className="w-3.5 h-3.5 text-orange-500" />
                    </button>
                  </div>
                )}

                {/* P10 & P11: Remédios */}
                {isStepActive && msg.stepType === 'QUESTION_P10_P11_MEDS' && (
                  <div className="mt-2 w-[88%] bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <button
                      onClick={() => handleAnswerP10P11(false)}
                      className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Não tomo remédios 🛡️</span>
                      <Check className="w-4 h-4 text-emerald-600" />
                    </button>

                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Se toma remédio contínuo, digite o nome aqui:
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder="Ex: Sertralina 50mg"
                          value={respostas.descricaoMedicamentos || ''}
                          onChange={(e) => setRespostas({ ...respostas, descricaoMedicamentos: e.target.value })}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300"
                        />
                        <button
                          onClick={() => handleAnswerP10P11(true, respostas.descricaoMedicamentos || 'Em uso')}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resultado da Triagem (Inaptidão / Opções de Reiniciar) */}
                {isStepActive && msg.stepType === 'RESULT_SCREENING' && msg.options && (
                  <div className="mt-2 w-[88%] space-y-1.5">
                    {msg.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (opt.value === 'REINICIAR') iniciarConversa();
                        }}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                      >
                        <span>{opt.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />
                      </button>
                    ))}
                  </div>
                )}

                {/* --------------------------------------------------------- */}
                {/* ETAPAS DO FORMULÁRIO DE CADASTRO 100% CONVERSACIONAL */}
                {/* --------------------------------------------------------- */}

                {/* Form: Nome Completo */}
                {isStepActive && msg.stepType === 'FORM_NAME' && (
                  <div className="mt-2 w-[92%] bg-white p-3 rounded-2xl border border-rose-200 shadow-sm space-y-2">
                    <span className="text-[11px] text-slate-800 font-bold block">
                      Digite seu nome completo (sem abreviações):
                    </span>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Mariana Silva de Holanda Cavalcante"
                        value={nomeMae}
                        onChange={(e) => setNomeMae(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFormName(nomeMae);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-400 font-medium text-slate-900"
                      />
                      <button
                        onClick={() => handleFormName(nomeMae)}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                      >
                        Confirmar Nome
                      </button>
                    </div>
                  </div>
                )}

                {/* Form: Telefone WhatsApp */}
                {isStepActive && msg.stepType === 'FORM_PHONE' && (
                  <div className="mt-2 w-[92%] bg-white p-3 rounded-2xl border border-rose-200 shadow-sm space-y-2">
                    <span className="text-[11px] text-slate-800 font-bold block">
                      Seu WhatsApp com DDD (para a van confirmar a rota):
                    </span>
                    <div className="flex flex-col gap-2">
                      <input
                        type="tel"
                        placeholder="Ex: (82) 99123-4567"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFormPhone(telefone);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-400 font-medium text-slate-900 font-mono"
                      />
                      <button
                        onClick={() => handleFormPhone(telefone)}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                      >
                        Confirmar WhatsApp
                      </button>
                    </div>

                    {msg.options && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        {msg.options.map((opt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (opt.value.startsWith('CONSULTAR_')) {
                                const proto = opt.value.replace('CONSULTAR_', '');
                                handleLookupProtocol(proto);
                              } else {
                                setTelefone('');
                                pushUserMessage('Quero digitar outro número ✏️');
                                pushBotMessage('Por favor, informe seu outro número de WhatsApp com DDD:', 'FORM_PHONE');
                              }
                            }}
                            className="w-full py-2 px-2.5 bg-slate-50 hover:bg-rose-50 text-slate-800 hover:text-rose-900 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                          >
                            <span className="truncate pr-1">{opt.label}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Form: Nome do Bebê */}
                {isStepActive && msg.stepType === 'FORM_BABY_NAME' && (
                  <div className="mt-2 w-[92%] bg-white p-3 rounded-2xl border border-rose-200 shadow-sm space-y-2">
                    <span className="text-[11px] text-slate-800 font-bold block">Nome do seu bebê:</span>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Laura"
                        value={nomeBebe}
                        onChange={(e) => setNomeBebe(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFormBabyName(nomeBebe);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-400 font-medium text-slate-900"
                      />
                      <button
                        onClick={() => handleFormBabyName(nomeBebe)}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                )}

                {/* Form: Bairro em Maceió */}
                {isStepActive && msg.stepType === 'FORM_NEIGHBORHOOD' && (
                  <div className="mt-2 w-[90%] bg-white p-2.5 rounded-xl border border-sky-200 shadow-xs space-y-2">
                    <span className="text-[10px] font-bold text-sky-950 block">
                      Toque no seu bairro ou escolha na lista:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Ponta Verde', 'Trapiche da Barra', 'Farol', 'Benedito Bentes', 'Jatiúca', 'Tabuleiro do Martins', 'Pajuçara', 'Cruz das Almas'].map((bNome) => (
                        <button
                          key={bNome}
                          onClick={() => handleFormNeighborhood(bNome)}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          {bNome}
                        </button>
                      ))}
                    </div>
                    <div className="pt-1 border-t border-slate-100 flex flex-col gap-1.5">
                      <select
                        onChange={(e) => handleFormNeighborhood(e.target.value)}
                        defaultValue=""
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white cursor-pointer"
                      >
                        <option value="" disabled>Outros bairros de Maceió...</option>
                        {BAIRROS_MACEIO.map((b) => (
                          <option key={b.nome} value={b.nome}>
                            {b.nome}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          pushUserMessage('Prefiro buscar pelo meu CEP 📮');
                          pushBotMessage(
                            'Perfeito! Digite o seu CEP para preenchermos automaticamente sua rua e bairro:',
                            'FORM_STREET_NUMBER'
                          );
                        }}
                        className="w-full py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-[10px] font-bold text-center cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <span>📮 Digitar meu CEP (Busca Automática)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Form: Endereço Detalhado (Rua, Número, Apartamento e Mapa de Maceió) */}
                {isStepActive && msg.stepType === 'FORM_STREET_NUMBER' && (
                  <div className="mt-2 w-[92%] bg-white p-3.5 rounded-2xl border border-rose-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs text-rose-950 font-bold flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-600" />
                        Endereço no Bairro {bairro}:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowMapModal(true)}
                        className="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-sky-200 shadow-2xs"
                      >
                        <Navigation className="w-3.5 h-3.5 text-sky-600" />
                        📍 Abrir Mapa
                      </button>
                    </div>

                    {/* Verificação e Busca por CEP */}
                    <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-sky-950 flex items-center gap-1">
                          <Search className="w-3.5 h-3.5 text-sky-600" />
                          Buscar por CEP (ViaCEP / Correios):
                        </label>
                        {cep && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">
                            {cep}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Ex: 57035-000"
                          value={cep}
                          maxLength={9}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCep(val);
                            const clean = val.replace(/\D/g, '');
                            if (clean.length === 8) {
                              consultarCep(clean);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') consultarCep(cep);
                          }}
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-mono font-medium text-slate-900 focus:ring-1 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => consultarCep(cep)}
                          disabled={isSearchingCep}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50 shadow-2xs"
                        >
                          {isSearchingCep ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Search className="w-3.5 h-3.5" />
                          )}
                          <span>Verificar</span>
                        </button>
                      </div>

                      {cepFeedback && (
                        <div className={`text-[10px] p-2 rounded-lg flex items-start gap-1.5 animate-in fade-in ${
                          cepFeedback.tipo === 'sucesso'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium'
                            : cepFeedback.tipo === 'aviso'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-rose-50 text-rose-900 border border-rose-200'
                        }`}>
                          {cepFeedback.tipo === 'sucesso' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
                          {cepFeedback.tipo === 'aviso' && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />}
                          {cepFeedback.tipo === 'erro' && <X className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />}
                          <span className="leading-tight">{cepFeedback.mensagem}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* Caixa 1: Rua / Logradouro */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Home className="w-3 h-3 text-slate-500" />
                          1. Rua / Avenida / Alameda:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Rua Engenheiro Mário de Gusmão"
                          value={logradouro}
                          onChange={(e) => setLogradouro(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-rose-500 font-medium text-slate-900"
                        />
                      </div>

                      {/* Caixa 2: Número e Caixa 3: Apartamento */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            2. Número:
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 450 ou S/N"
                            value={numeroResidencia}
                            onChange={(e) => setNumeroResidencia(e.target.value)}
                            className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-rose-500 font-medium text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            3. Apto / Bloco:
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Apt 701, Bloco B"
                            value={complementoApto}
                            onChange={(e) => setComplementoApto(e.target.value)}
                            className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-rose-500 font-medium text-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-1 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleFormAddressFields()}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Confirmar Endereço
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowMapModal(true)}
                        className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                        Buscar / Escolher no Mapa de Maceió
                      </button>
                    </div>
                  </div>
                )}

                {/* Form: Ponto de Referência */}
                {isStepActive && msg.stepType === 'FORM_LANDMARK' && (
                  <div className="mt-2 w-[88%] bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Ex: Próximo à Praça Lions..."
                        value={pontoReferencia}
                        onChange={(e) => setPontoReferencia(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFormLandmark(pontoReferencia);
                        }}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                      />
                      <button
                        onClick={() => handleFormLandmark(pontoReferencia)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Enviar
                      </button>
                    </div>
                    {msg.options && (
                      <button
                        onClick={() => handleFormLandmark('SEM_REFERENCIA')}
                        className="w-full py-1 text-center text-[11px] text-slate-500 hover:text-slate-700 underline font-medium cursor-pointer"
                      >
                        Não tenho ponto de referência
                      </button>
                    )}
                  </div>
                )}

                {/* Form: Finalidade da Coleta */}
                {isStepActive && msg.stepType === 'FORM_PURPOSE_AND_BOTTLES' && (
                  <div className="mt-2 w-[92%] bg-white p-3 rounded-2xl border border-rose-200 shadow-sm space-y-2">
                    <span className="text-[11px] text-slate-800 font-bold block flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-rose-500" />
                      Toque na opção desejada:
                    </span>

                    <div className="space-y-1.5">
                      {msg.options?.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleFormPurpose(opt.value as MotivoColeta)}
                          className="w-full py-2.5 px-3 bg-slate-50 hover:bg-rose-50 text-slate-800 hover:text-rose-900 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                        >
                          <span className="pr-1 leading-snug">{opt.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form: Quantidade Exata de Frascos */}
                {isStepActive && msg.stepType === 'FORM_BOTTLES_COUNT' && (
                  <div className="mt-2 w-[92%] bg-white p-3 rounded-2xl border border-rose-200 shadow-sm space-y-2.5">
                    <span className="text-[11px] text-slate-800 font-bold block flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Informe o número exato de frascos para a van:
                    </span>

                    {/* Botões com número exato */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleFormBottlesCount(num)}
                          className={`py-2 px-1 text-xs font-bold rounded-xl border transition-colors shadow-2xs cursor-pointer ${
                            qtdFrascos === num
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-50 hover:bg-rose-50 text-slate-800 border-slate-200 hover:border-rose-300'
                          }`}
                        >
                          {num} {num === 1 ? 'frasco' : 'frascos'}
                        </button>
                      ))}
                    </div>

                    {/* Stepper para ajuste de outro número exato (ex: 7, 8, 10...) */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-600 font-medium">Outro número exato:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQtdFrascos(prev => Math.max(1, prev - 1))}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-16 text-center text-xs font-bold text-sky-950 font-mono">
                          {qtdFrascos} {qtdFrascos === 1 ? 'frasco' : 'frascos'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQtdFrascos(prev => Math.min(30, prev + 1))}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormBottlesCount(qtdFrascos)}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form: Turno */}
                {isStepActive && msg.stepType === 'FORM_DATE_SHIFT' && msg.options && (
                  <div className="mt-2 w-[88%] space-y-1.5">
                    {msg.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFormShift(opt.value as TurnoColeta)}
                        className="w-full py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                      >
                        <span>{opt.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-sky-600" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Card de Validação e Conferência de Dados Pré-Protocolo */}
                {isStepActive && msg.stepType === 'FORM_CONFIRM_SUMMARY' && (
                  <div className="mt-2 w-[95%] bg-white p-3.5 rounded-2xl border-2 border-amber-300 shadow-md space-y-3 text-xs animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                      <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                        <ClipboardCheck className="w-4 h-4 text-amber-600" />
                        {motivoColeta === 'RECEBER_FRASCOS' ? 'CONFERÊNCIA DE DADOS - ENTREGA DE FRASCOS' : 'CONFERÊNCIA DE DADOS PRÉ-CADASTRO'}
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        Etapa de Validação
                      </span>
                    </div>

                    {/* Informações da Doadora */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5 text-[11px] text-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-rose-500" /> Doadora:
                        </span>
                        <span className="font-semibold text-slate-900">{nomeMae || 'Nome não informado'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp:
                        </span>
                        <span className="font-semibold text-slate-900 font-mono">{telefone || 'WhatsApp não informado'}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Baby className="w-3.5 h-3.5 text-pink-500" /> Bebê & Leite:
                        </span>
                        <span className="font-semibold text-slate-900">
                          {nomeBebe || 'Bebê'} {motivoColeta === 'RECEBER_FRASCOS' ? '(Solicitação de Frascos)' : resultado?.tipoLeite ? `(Leite ${resultado.tipoLeite})` : ''}
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200 space-y-1">
                        <div className="font-bold text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" /> {motivoColeta === 'RECEBER_FRASCOS' ? 'Endereço de Entrega da Van:' : 'Endereço de Coleta da Van:'}
                        </div>
                        <div className="pl-4 text-slate-900 font-medium leading-relaxed">
                          {logradouro || 'Rua não informada'}{numeroResidencia ? `, nº ${numeroResidencia}` : ', S/N'}
                          {complementoApto ? ` (${complementoApto})` : ''}
                          <br />
                          Bairro: <strong className="text-sky-900">{bairro}</strong> - Maceió/AL {cep && <span className="text-[10px] font-mono text-slate-500 font-semibold">• CEP: {cep}</span>}
                          {pontoReferencia && (
                            <div className="text-[10px] text-slate-600 mt-0.5">
                              Ref: {pontoReferencia}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-sky-600" /> Previsão & Turno:
                        </span>
                        <span className="font-semibold text-sky-950">
                          {turnoColeta === 'MANHA' ? '☀️ Manhã (08h às 12h)' : '🌤️ Tarde (13h30 às 17h)'} • {qtdFrascos} {motivoColeta === 'RECEBER_FRASCOS' ? 'frasco(s) esterilizado(s)' : 'frasco(s)'}
                        </span>
                      </div>

                      {/* Comprovante de Exames */}
                      <div className="pt-1.5 border-t border-slate-200">
                        <span className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                          <FileText className="w-3.5 h-3.5 text-amber-600" /> Comprovação de Exames (RDC 171/2006):
                        </span>
                        {comprovanteAnexado ? (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1.5 text-emerald-900 text-[10px] font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Foto da Caderneta/Exames anexada digitalmente
                          </div>
                        ) : respostas.temCartaoPreNatal ? (
                          <div className="bg-sky-50 border border-sky-200 rounded-lg p-1.5 text-sky-900 text-[10px] font-medium flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            Caderneta em mãos (conferência física com a equipe da van)
                          </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-1.5 text-amber-900 text-[10px] font-medium flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Coleta de sangue em domicílio pela van do BLH Santa Mônica
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Alerta Regulatório RDC 171/2006 */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[10px] text-amber-950 leading-relaxed space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-900">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        Regulação Técnica ANVISA / rBLH:
                      </div>
                      <p>
                        Ao confirmar, será gerado seu protocolo oficial em status <strong>"Aguardando Validação Regulatória pela Enfermagem BLH"</strong>. A equipe do BLH Santa Mônica conferirá os dados e exames para homologar a rota da van no bairro <strong>{bairro}</strong>.
                      </p>
                    </div>

                    {/* Botões de Ação */}
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={handleFinalConfirmation}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        {motivoColeta === 'RECEBER_FRASCOS' ? 'Confirmar e Agendar Entrega de Frascos' : 'Confirmar Todos os Dados e Gerar Protocolo'}
                      </button>

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          onClick={() => handleRequestCorrection('NOME')}
                          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold text-center cursor-pointer transition-colors"
                        >
                          ✏️ Alterar Nome
                        </button>
                        <button
                          onClick={() => handleRequestCorrection('WHATSAPP')}
                          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold text-center cursor-pointer transition-colors"
                        >
                          ✏️ Alterar WhatsApp
                        </button>
                        <button
                          onClick={() => handleRequestCorrection('ENDERECO')}
                          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold text-center cursor-pointer transition-colors"
                        >
                          ✏️ Alterar Endereço
                        </button>
                        <button
                          onClick={() => handleRequestCorrection('TURNO')}
                          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold text-center cursor-pointer transition-colors"
                        >
                          ✏️ Alterar Turno/Frascos
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cartão de Protocolo Emitido no Chat */}
                {msg.stepType === 'PROTOCOL_COMPLETED' && msg.data && (
                  <div className="mt-2 w-[95%] bg-white p-3.5 rounded-2xl border-2 border-emerald-500 shadow-md space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Protocolo Oficial MESM / UNCISAL
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="font-mono font-black text-sm text-sky-950">
                            {msg.data.doadora.protocolo}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator?.clipboard) {
                                navigator.clipboard.writeText(msg.data.doadora.protocolo);
                              }
                            }}
                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Copiar código do protocolo"
                          >
                            <Copy className="w-3 h-3 text-emerald-600" />
                            <span>Copiar</span>
                          </button>
                        </div>
                      </div>
                      <ShieldCheck className="w-6 h-6 text-emerald-500" />
                    </div>

                    <div className="text-[11px] text-slate-700 space-y-1">
                      <div><strong>Doadora:</strong> {msg.data.doadora.nomeCompleto}</div>
                      <div><strong>Bebê:</strong> {msg.data.doadora.nomeBebe} ({msg.data.doadora.tipoLeite})</div>
                      <div><strong>Bairro:</strong> {msg.data.agendamento?.bairro} (Maceió)</div>
                      <div><strong>Status:</strong> <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold text-[10px]">⏳ Em Análise / Validação Enfermagem</span></div>
                      <div><strong>Previsão de Coleta:</strong> {new Date(msg.data.agendamento?.dataAgendada + 'T00:00:00').toLocaleDateString('pt-BR')} ({msg.data.agendamento?.turno === 'MANHA' ? 'Turno da Manhã' : 'Turno da Tarde'})</div>
                      <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-100">
                        * Conforme regulação técnica rBLH/ANVISA, a confirmação da coleta ocorrerá após validação dos exames pela enfermagem da Santa Mônica.
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                      <button
                        onClick={() => handleTriggerDirectAction('DEVOLVER_LEITE', msg.data.doadora)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Package className="w-3.5 h-3.5" />
                        ❄️ Devolver Leite / Agendar Coleta Domiciliar
                      </button>

                      <button
                        onClick={() => handleTriggerDirectAction('PEGAR_FRASCOS', msg.data.doadora)}
                        className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-center font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        🫙 Solicitar Mais Frascos Esterilizados (Entrega Gratuita)
                      </button>

                      {msg.data.agendamento && (
                        <a
                          href={gerarLinkGoogleAgenda(msg.data.agendamento)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-center font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5 text-sky-600" />
                          Salvar no Google Agenda
                        </a>
                      )}

                      <button
                        onClick={onOpenGuidelines}
                        className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-center font-bold text-[11px] cursor-pointer transition-colors"
                      >
                        📖 Ver Instruções Sanitárias Fiocruz
                      </button>

                      <button
                        onClick={iniciarConversa}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-center font-semibold text-[11px] cursor-pointer transition-colors"
                      >
                        🔄 Reiniciar o chat
                      </button>
                    </div>
                  </div>
                )}

                {/* Opção para reiniciar em mensagens de resultado */}
                {isStepActive && msg.stepType === 'RESULT_SCREENING' && (
                  <div className="mt-2 w-[88%]">
                    <button
                      onClick={iniciarConversa}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      🔄 Reiniciar o chat
                    </button>
                  </div>
                )}
              </div>
            );
          })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-slate-500 text-xs pl-2 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold border border-emerald-200">
                  MESM
                </div>
                <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-2xl rounded-tl-xs flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Footer / Input Bar */}
          <div className="bg-white border-t border-slate-200 p-2.5 flex items-center gap-1.5 z-20">
            {/* Input de arquivo invisível */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInputChange} 
              accept="image/*,application/pdf" 
              className="hidden" 
            />

            {/* Botão de Anexo (Clipe) */}
            <button
              type="button"
              onClick={() => setShowAttachmentModal(true)}
              title="Anexar foto da Caderneta de Exames ou PDF"
              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Botão de Câmera */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Tirar foto da Caderneta de Exames"
              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer shrink-0"
            >
              <Camera className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={
                activeStep === 'QUESTION_P3_DATE'
                  ? 'Digite dia/mês/ano (ex: 12/02/2026)...'
                  : activeStep === 'FORM_NAME' 
                  ? 'Digite seu nome completo...' 
                  : activeStep === 'FORM_PHONE'
                  ? 'Digite seu WhatsApp com DDD...'
                  : activeStep === 'FORM_BABY_NAME'
                  ? 'Digite o nome do seu bebê...'
                  : activeStep === 'FORM_STREET_NUMBER'
                  ? 'Digite sua rua e número...'
                  : activeStep === 'FORM_LANDMARK'
                  ? 'Digite um ponto de referência...'
                  : activeStep === 'LOOKUP_INPUT' || activeStep === 'ACTION_LOOKUP_INPUT'
                  ? 'Digite seu protocolo ou WhatsApp...'
                  : activeStep === 'EXISTING_DONOR_ACTION_BOTTLES' || activeStep === 'FORM_BOTTLES_COUNT'
                  ? 'Digite a quantidade de frascos (ex: 2)...'
                  : 'Digite sua mensagem...'
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualInputSubmit();
              }}
              className="flex-1 bg-slate-100 rounded-full px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={handleManualInputSubmit}
              className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Android / iOS Home Indicator (visível em todas as telas) */}
          <div className="h-3.5 sm:h-4 bg-white flex items-center justify-center pb-1 shrink-0">
            <div className="w-24 sm:w-28 h-1 bg-slate-400 rounded-full"></div>
          </div>

          {/* Modal / Sheet: Anexar Comprovante Digital de Exames (WhatsApp MESM) */}
          {showAttachmentModal && (
            <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150">
              <div className="bg-white rounded-t-3xl p-5 space-y-4 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Envio Digital de Exames</h4>
                      <p className="text-[10px] text-slate-500">Conferência pela Enfermagem BLH • ANVISA RDC 171</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAttachmentModal(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Opção 1: Upload real da foto da caderneta */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center gap-3 text-left transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-xs text-slate-900">Tirar Foto / Galeria de Imagens</div>
                      <div className="text-[10px] text-slate-500">Envie a folha de sorologias da sua Caderneta da Gestante</div>
                    </div>
                  </button>

                  {/* Opção 2: Documento PDF */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center gap-3 text-left transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-xs text-slate-900">Anexar Laudo Laboratorial em PDF</div>
                      <div className="text-[10px] text-slate-500">Resultado oficial baixado do laboratório de análises</div>
                    </div>
                  </button>

                  {/* Opção 3: Exemplo Pré-Carregado de Demonstração */}
                  <button
                    type="button"
                    onClick={() => handleEnviarComprovante('FOTO_CADERNETA')}
                    className="w-full p-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100/80 flex items-center gap-3 text-left transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                        <span>Usar Foto de Exemplo Caderneta MESM</span>
                        <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono">100% Negativo</span>
                      </div>
                      <div className="text-[10px] text-emerald-800">HIV, VDRL, HBsAg e Anti-HCV Não Reagentes</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Zoom da Imagem Anexada */}
          {previewAttachmentUrl && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col justify-between p-4 animate-in fade-in">
              <div className="flex items-center justify-between text-white pb-2">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Comprovante de Sorologias • rBLH/MESM
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewAttachmentUrl(null)}
                  className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center cursor-pointer hover:bg-white/30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <img 
                  src={previewAttachmentUrl} 
                  alt="Comprovante de Exames" 
                  className="max-h-80 w-auto rounded-xl object-contain shadow-2xl border border-white/20"
                />
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewAttachmentUrl(null)}
                  className="px-4 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-full shadow-md"
                >
                  Fechar Visualização
                </button>
              </div>
            </div>
          )}

          {/* Modal: Mapa Interativo de Maceió para Seleção de Rua e Endereço */}
          {showMapModal && (
            <div className="absolute inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
              <div className="bg-white rounded-t-3xl max-h-[92%] flex flex-col shadow-2xl border-t border-slate-200 overflow-hidden animate-in slide-in-from-bottom duration-250">
                {/* Cabeçalho do Mapa */}
                <div className="p-3.5 bg-emerald-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-800 text-emerald-200 flex items-center justify-center">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">Mapa de Coleta BLH Maceió</h4>
                      <p className="text-[10px] text-emerald-200">Rota da Van Santa Mônica (UNCISAL)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowMapModal(false)}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
                  {/* Busca no Mapa */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar rua, avenida ou bairro em Maceió..."
                      value={mapSearchQuery}
                      onChange={(e) => setMapSearchQuery(e.target.value)}
                      className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                    />
                  </div>

                  {/* Mapa Visual Simulado de Maceió com Pins */}
                  <div className="relative h-44 rounded-2xl bg-slate-900 overflow-hidden border border-slate-200 shadow-inner">
                    {/* Visual de Mapa de Satélite / Ruas de Maceió */}
                    <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] opacity-40"></div>
                    
                    {/* Linhas de Avenidas Principais de Maceió */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Orla Marítima */}
                      <div className="absolute top-8 left-0 right-0 h-1 bg-sky-500/40 rotate-12"></div>
                      {/* Av. Fernandes Lima */}
                      <div className="absolute top-0 bottom-0 left-16 w-1.5 bg-amber-500/40 rotate-25"></div>
                      {/* Av. Menino Marcelo */}
                      <div className="absolute top-12 left-0 right-0 h-1 bg-emerald-500/40 -rotate-6"></div>
                    </div>

                    {/* Pin Hospital Santa Mônica (Base BLH) */}
                    <div className="absolute top-16 left-28 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                      <span className="text-[8px] bg-rose-700 text-white font-bold px-1 rounded shadow-xs mb-0.5">
                        🏥 BLH MESM
                      </span>
                      <div className="w-4 h-4 rounded-full bg-rose-600 border-2 border-white animate-pulse"></div>
                    </div>

                    {/* Pins Interativos de Bairros de Maceió */}
                    {[
                      { nome: 'Ponta Verde', rua: 'Rua Eng. Mário de Gusmão', top: '25%', left: '72%' },
                      { nome: 'Jatiúca', rua: 'Av. Dr. Antônio Gomes de Barros', top: '20%', left: '80%' },
                      { nome: 'Pajuçara', rua: 'Av. Dr. Antônio Gouveia', top: '35%', left: '65%' },
                      { nome: 'Farol', rua: 'Av. Fernandes Lima', top: '45%', left: '42%' },
                      { nome: 'Trapiche da Barra', rua: 'Av. Siqueira Campos', top: '70%', left: '28%' },
                      { nome: 'Mangabeiras', rua: 'Av. Comendador Gustavo Paiva', top: '18%', left: '60%' },
                      { nome: 'Cruz das Almas', rua: 'Av. Brig. Eduardo Gomes', top: '15%', left: '88%' },
                      { nome: 'Benedito Bentes', rua: 'Av. Cachoeira do Meirim', top: '20%', left: '20%' },
                      { nome: 'Tabuleiro do Martins', rua: 'Av. Menino Marcelo', top: '55%', left: '18%' }
                    ]
                      .filter(p => !mapSearchQuery || p.nome.toLowerCase().includes(mapSearchQuery.toLowerCase()) || p.rua.toLowerCase().includes(mapSearchQuery.toLowerCase()))
                      .map((p, idx) => {
                        const isSelected = bairro === p.nome;
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setBairro(p.nome);
                              setLogradouro(p.rua);
                              if (!numeroResidencia) setNumeroResidencia('120');
                            }}
                            style={{ top: p.top, left: p.left }}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                          >
                            <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold shadow-md transition-all flex items-center gap-0.5 whitespace-nowrap ${
                              isSelected 
                                ? 'bg-emerald-500 text-white scale-110 ring-2 ring-white' 
                                : 'bg-slate-900/90 text-slate-200 hover:bg-emerald-700 hover:text-white'
                            }`}>
                              <MapPin className="w-2.5 h-2.5" />
                              {p.nome}
                            </div>
                          </div>
                        );
                      })}

                    {/* Indicador de Localização Atual */}
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <LocateFixed className="w-2.5 h-2.5 text-emerald-400" />
                      Maceió • AL
                    </div>
                  </div>

                  {/* Formulário de 3 Caixas dentro do Mapa */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
                    <div className="text-[10px] font-bold text-slate-700 flex items-center justify-between">
                      <span>Endereço Selecionado:</span>
                      <span className="text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-semibold">
                        Bairro: {bairro}
                      </span>
                    </div>

                    {/* 1. Rua */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 mb-0.5">1. Rua / Avenida:</label>
                      <input
                        type="text"
                        placeholder="Nome da rua ou avenida"
                        value={logradouro}
                        onChange={(e) => setLogradouro(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                      />
                    </div>

                    {/* 2. Número e 3. Apartamento */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 mb-0.5">2. Número:</label>
                        <input
                          type="text"
                          placeholder="Ex: 350 ou S/N"
                          value={numeroResidencia}
                          onChange={(e) => setNumeroResidencia(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 mb-0.5">3. Apto / Bloco:</label>
                        <input
                          type="text"
                          placeholder="Ex: Apt 102 (Opcional)"
                          value={complementoApto}
                          onChange={(e) => setComplementoApto(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botão de Confirmação */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!logradouro.trim()) {
                          alert('Por favor, informe ou toque em uma rua no mapa.');
                          return;
                        }
                        setShowMapModal(false);
                        handleFormAddressFields(logradouro, numeroResidencia, complementoApto);
                      }}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Confirmar Localização do Mapa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
