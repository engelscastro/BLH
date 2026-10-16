export type StatusTriagem = 
  | 'APTA' 
  | 'EM_ANALISE' 
  | 'INAPTA_TEMPORARIA' 
  | 'INAPTA_DEFINITIVA';

export type TipoLeite = 
  | 'COLOSTRO'    // Até 7 dias de vida
  | 'TRANSICAO'   // 8 a 14 dias
  | 'MADURO';     // 15 dias ou mais

export type RegiaoLogistica = 
  | 'ORLA_BAIXA' 
  | 'FAROL_CENTRO' 
  | 'TABULEIRO_ALTA' 
  | 'LITORAL_SUL_TRAPICHE' 
  | 'NORTE_JACARECICA';

export interface RespostasTriagem {
  // P1: Amamentação ativa
  amamentandoProprioFilho: boolean;
  // P2: Primazia e sobra de leite
  bebeMamaBemETemSobra: boolean;
  // P3: Nascimento do bebê
  dataNascimentoBebe: string;
  // P4: Cartão de pré-natal
  temCartaoPreNatal: boolean;
  // P5: Sorologias (HIV, VDRL, Hep B/C, HTLV)
  sorologiaPositiva: boolean;
  sorologiasDetalhes?: string;
  // P6: Tabagismo
  tabagismo: 'NAO' | 'ATE_10' | 'MAIS_10';
  // P7: Álcool / drogas
  alcoolDrogas: 'NUNCA' | 'ALCOOL_ESPORADICO' | 'SUBSTANCIAS_ILICITAS';
  // P8: Transfusão 12 meses
  transfusao12Meses: boolean;
  // P9: Tatuagem / piercing / micro 12 meses
  tatuagem12Meses: boolean;
  // P10: Medicamentos contínuos ou recentes
  tomaMedicamentos: boolean;
  descricaoMedicamentos?: string;
  // P11: Sintomas infecciosos / lesões mamárias
  sintomasInfecciososOuLesao: boolean;
  descricaoSintomas?: string;
}

export interface ResultadoTriagem {
  status: StatusTriagem;
  tipoLeite: TipoLeite;
  idadeBebeDias: number;
  titulo: string;
  mensagem: string;
  detalhesClinicos: string[];
  orientacoesSanitarias: string[];
  permiteAgendamento: boolean;
  necessitaAnaliseMedica: boolean;
}

export interface EnderecoDoadora {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  pontoReferencia: string;
  cidade: string;
  regiaoLogistica: RegiaoLogistica;
}

export interface ComprovanteExames {
  arquivoUrl: string;
  nomeArquivo: string;
  dataEnvio: string;
  tipo: 'FOTO_CADERNETA' | 'LAUDO_PDF';
  tamanhoKb?: number;
  validadoEnfermagem: boolean;
  validadoPor?: string;
  dataValidacao?: string;
  observacoes?: string;
}

export interface Doadora {
  id: string;
  protocolo: string;
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
  parecerMedico?: {
    aprovadoPor: string;
    matricula: string;
    dataParecer: string;
    decisao: 'APROVADA' | 'REJEITADA';
    observacoes: string;
  };
}

export type MotivoColeta = 'BUSCAR_LEITE' | 'RECEBER_FRASCOS' | 'AMBOS';
export type TurnoColeta = 'MANHA' | 'TARDE';
export type StatusAgendamento = 'PENDENTE' | 'EM_ROTA' | 'COLETADO' | 'REAGENDADO' | 'CANCELADO';

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
  dataAgendada: string;
  turno: TurnoColeta;
  status: StatusAgendamento;
  coletadorId?: string;
  coletadorNome?: string;
  dadosColeta?: {
    dataHoraColeta: string;
    frascosColetados: number;
    volumeAproximadoMl: number;
    frascosEntregues: number;
    temperaturaTermicaC: number;
    observacoes?: string;
    coletadorMatricula: string;
  };
}

export interface Coletador {
  id: string;
  nome: string;
  matricula: string;
  telefone: string;
  veiculo: string;
  pin?: string;
  ativo: boolean;
}

export interface EstatisticasBLH {
  totalDoadoras: number;
  aptas: number;
  emAnalise: number;
  inaptasTemporarias: number;
  inaptasDefinitivas: number;
  coletasHoje: number;
  coletasConcluidas: number;
  volumeTotalMl: number;
  bebesBeneficiadosEstimados: number;
  frascosDistribuidos: number;
}

export interface ProfissionalHospitalar {
  id: string;
  nome: string;
  cargo: string;
  funcao: 'MEDICO' | 'ENFERMEIRO' | 'GESTOR';
  registroProfissional: string;
  matricula: string;
  email: string;
  departamento: string;
}

export type TipoLogAtividade = 
  | 'ALTERACAO_STATUS' 
  | 'VALIDACAO_EXAMES' 
  | 'PARECER_MEDICO' 
  | 'INTERACAO_CHAT' 
  | 'COLETA_ROTA' 
  | 'ACESSO_AUTENTICACAO'
  | 'CADASTRO_DOADORA';

export type CategoriaLogAtividade = 
  | 'ENFERMAGEM' 
  | 'MEDICO' 
  | 'CHATBOT' 
  | 'LOGISTICA' 
  | 'SISTEMA';

export interface LogAtividade {
  id: string;
  timestamp: string;
  tipo: TipoLogAtividade;
  categoria: CategoriaLogAtividade;
  protocolo?: string;
  doadoraId?: string;
  doadoraNome?: string;
  usuarioResponsavel: string;
  cargoResponsavel?: string;
  matriculaOuRegistro?: string;
  funcaoUsuario?: 'MEDICO' | 'ENFERMEIRO' | 'GESTOR' | 'COLETADOR' | 'SISTEMA_CHATBOT';
  acao: string;
  statusAnterior?: string;
  statusNovo?: string;
  detalhes: string;
  justificativaClinica?: string;
  transcricaoChat?: Array<{
    remetente: 'USUARIO' | 'BOT';
    mensagem: string;
    horario: string;
  }>;
  respostasTriagem?: Partial<RespostasTriagem>;
  ipOuCanal: string;
  nivelRisco: 'INFORMATIVO' | 'ATENCAO' | 'CRITICO' | 'SUCESSO';
  conformidadeNormativa: string; // Ex: 'RDC ANVISA nº 171/2006 - Art. 14 / Art. 18'
  hashRastreabilidade?: string;
}

