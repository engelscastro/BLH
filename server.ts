import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  hashPin,
  verifyPin,
  generateToken,
  requireAuth,
  createRateLimiter,
  maskName,
  maskPhone,
  maskCpf,
  AuthenticatedRequest
} from './server/security';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'blh_database.json');
const DB_BACKUP_FILE = path.resolve(DATA_DIR, 'blh_database.json.bak');
const DB_TMP_FILE = path.resolve(DATA_DIR, 'blh_database.json.tmp');

// Ensure data folder exists with restricted permissions (0700)
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
} else {
  try {
    fs.chmodSync(DATA_DIR, 0o700);
  } catch {}
}

// Initial realistic seed data for MESM / UNCISAL
const SEED_DATA = {
  donors: [
    {
      id: 'd-001',
      protocolo: 'BLH-2026-0142',
      nomeCompleto: 'Camila Albuquerque Vasconcelos',
      cpf: '042.883.914-22',
      telefone: '(82) 99614-2201',
      email: 'camila.albuquerque@gmail.com',
      dataNascimento: '1996-05-14',
      nomeBebe: 'Bernardo',
      dataNascimentoBebe: '2026-09-29',
      idadeBebeDias: 4,
      tipoLeite: 'COLOSTRO',
      status: 'APTA',
      motivoStatus: 'Apta - Leite Colostro de altíssimo teor imunológico para UTIN',
      dataCadastro: '2026-10-02T10:15:00.000Z',
      respostas: {
        amamentandoProprioFilho: true,
        bebeMamaBemETemSobra: true,
        dataNascimentoBebe: '2026-09-29',
        temCartaoPreNatal: true,
        sorologiaPositiva: false,
        tabagismo: 'NAO',
        alcoolDrogas: 'NUNCA',
        transfusao12Meses: false,
        tatuagem12Meses: false,
        tomaMedicamentos: false,
        sintomasInfecciososOuLesao: false
      },
      comprovanteExames: {
        arquivoUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800',
        nomeArquivo: 'Caderneta_Gestante_Camila_Sorologias.jpg',
        dataEnvio: '2026-10-02T10:20:00.000Z',
        tipo: 'FOTO_CADERNETA',
        tamanhoKb: 640,
        validadoEnfermagem: true,
        validadoPor: 'Enfª Ana Cláudia Silva (COREN-AL 12894)',
        dataValidacao: '2026-10-02T10:45:00.000Z',
        observacoes: 'HIV, VDRL, HBsAg e Anti-HCV todos Não Reagentes no 3º trimestre.'
      },
      endereco: {
        cep: '57010-330',
        logradouro: 'Rua Jorge de Lima',
        numero: '113',
        complemento: 'Apto 204',
        bairro: 'Trapiche da Barra',
        pontoReferencia: 'Próximo à Maternidade Santa Mônica',
        cidade: 'Maceió',
        regiaoLogistica: 'LITORAL_SUL_TRAPICHE'
      }
    },
    {
      id: 'd-002',
      protocolo: 'BLH-2026-0143',
      nomeCompleto: 'Mariana Silva de Holanda',
      cpf: '118.492.304-85',
      telefone: '(82) 98842-9912',
      email: 'mariana.holanda@yahoo.com.br',
      dataNascimento: '1994-11-20',
      nomeBebe: 'Laura',
      dataNascimentoBebe: '2026-09-12',
      idadeBebeDias: 21,
      tipoLeite: 'MADURO',
      status: 'APTA',
      motivoStatus: 'Apta - Leite Maduro de alta densidade calórica e lipídica',
      dataCadastro: '2026-10-01T14:30:00.000Z',
      respostas: {
        amamentandoProprioFilho: true,
        bebeMamaBemETemSobra: true,
        dataNascimentoBebe: '2026-09-12',
        temCartaoPreNatal: true,
        sorologiaPositiva: false,
        tabagismo: 'NAO',
        alcoolDrogas: 'NUNCA',
        transfusao12Meses: false,
        tatuagem12Meses: false,
        tomaMedicamentos: false,
        sintomasInfecciososOuLesao: false
      },
      endereco: {
        cep: '57035-000',
        logradouro: 'Rua Engenheiro Mário de Gusmão',
        numero: '450',
        complemento: 'Ed. Mar do Caribe, Apt 701',
        bairro: 'Ponta Verde',
        pontoReferencia: 'Próximo à Praça Lions',
        cidade: 'Maceió',
        regiaoLogistica: 'ORLA_BAIXA'
      }
    },
    {
      id: 'd-003',
      protocolo: 'BLH-2026-0144',
      nomeCompleto: 'Juliana Peixoto Tavares',
      cpf: '075.291.684-10',
      telefone: '(82) 99133-7744',
      email: 'juliana.peixoto@uncisal.edu.br',
      dataNascimento: '1992-03-08',
      nomeBebe: 'Gabriel',
      dataNascimentoBebe: '2026-09-22',
      idadeBebeDias: 11,
      tipoLeite: 'TRANSICAO',
      status: 'EM_ANALISE',
      motivoStatus: 'Uso de medicamento informado: Sertralina 50mg/dia (em avaliação pelo médico do BLH)',
      dataCadastro: '2026-10-02T16:45:00.000Z',
      respostas: {
        amamentandoProprioFilho: true,
        bebeMamaBemETemSobra: true,
        dataNascimentoBebe: '2026-09-22',
        temCartaoPreNatal: true,
        sorologiaPositiva: false,
        tabagismo: 'NAO',
        alcoolDrogas: 'NUNCA',
        transfusao12Meses: false,
        tatuagem12Meses: false,
        tomaMedicamentos: true,
        descricaoMedicamentos: 'Sertralina 50mg para ansiedade pós-parto, com prescrição médica',
        sintomasInfecciososOuLesao: false
      },
      endereco: {
        cep: '57051-000',
        logradouro: 'Avenida Fernandes Lima',
        numero: '1820',
        complemento: 'Apto 402 Bloco B',
        bairro: 'Farol',
        pontoReferencia: 'Em frente ao Hospital Sanatório',
        cidade: 'Maceió',
        regiaoLogistica: 'FAROL_CENTRO'
      }
    },
    {
      id: 'd-004',
      protocolo: 'BLH-2026-0145',
      nomeCompleto: 'Larissa Melo dos Santos',
      cpf: '099.123.456-78',
      telefone: '(82) 98711-3322',
      dataNascimento: '1998-07-19',
      nomeBebe: 'Arthur',
      dataNascimentoBebe: '2026-09-18',
      idadeBebeDias: 15,
      tipoLeite: 'MADURO',
      status: 'INAPTA_TEMPORARIA',
      motivoStatus: 'Procedimento de micropigmentação de sobrancelha realizado há 4 meses (aguardando cumprimento de janela de 12 meses)',
      dataCadastro: '2026-10-02T09:20:00.000Z',
      respostas: {
        amamentandoProprioFilho: true,
        bebeMamaBemETemSobra: true,
        dataNascimentoBebe: '2026-09-18',
        temCartaoPreNatal: true,
        sorologiaPositiva: false,
        tabagismo: 'NAO',
        alcoolDrogas: 'NUNCA',
        transfusao12Meses: false,
        tatuagem12Meses: true,
        tomaMedicamentos: false,
        sintomasInfecciososOuLesao: false
      },
      endereco: {
        cep: '57081-000',
        logradouro: 'Rua Doutor José Castro de Azevedo',
        numero: '88',
        complemento: 'Casa',
        bairro: 'Tabuleiro do Martins',
        pontoReferencia: 'Próximo à Bomba da Marieta',
        cidade: 'Maceió',
        regiaoLogistica: 'TABULEIRO_ALTA'
      }
    },
    {
      id: 'd-005',
      protocolo: 'BLH-2026-0146',
      nomeCompleto: 'Beatriz Vasconcelos Ramos',
      cpf: '063.441.228-90',
      telefone: '(82) 99655-4433',
      dataNascimento: '1995-02-14',
      nomeBebe: 'Helena',
      dataNascimentoBebe: '2026-09-25',
      idadeBebeDias: 8,
      tipoLeite: 'TRANSICAO',
      status: 'APTA',
      motivoStatus: 'Apta - Leite de Transição liberado para UTIN',
      dataCadastro: '2026-10-03T08:10:00.000Z',
      respostas: {
        amamentandoProprioFilho: true,
        bebeMamaBemETemSobra: true,
        dataNascimentoBebe: '2026-09-25',
        temCartaoPreNatal: true,
        sorologiaPositiva: false,
        tabagismo: 'NAO',
        alcoolDrogas: 'NUNCA',
        transfusao12Meses: false,
        tatuagem12Meses: false,
        tomaMedicamentos: false,
        sintomasInfecciososOuLesao: false
      },
      endereco: {
        cep: '57084-000',
        logradouro: 'Avenida Cachoeira do Meirim',
        numero: '310',
        complemento: 'Conjunto Graciliano Ramos',
        bairro: 'Benedito Bentes',
        pontoReferencia: 'Próximo ao Terminal de Ônibus',
        cidade: 'Maceió',
        regiaoLogistica: 'TABULEIRO_ALTA'
      }
    }
  ],
  appointments: [
    {
      id: 'apt-001',
      protocolo: 'BLH-2026-0142',
      doadoraId: 'd-001',
      nomeDoadora: 'Camila Albuquerque Vasconcelos',
      telefone: '(82) 99614-2201',
      bairro: 'Trapiche da Barra',
      regiaoLogistica: 'LITORAL_SUL_TRAPICHE',
      enderecoCompleto: 'Rua Jorge de Lima, 113, Apto 204, Trapiche da Barra',
      pontoReferencia: 'Próximo à Maternidade Santa Mônica',
      motivo: 'AMBOS',
      quantidadeFrascosEstimada: 2,
      dataAgendada: new Date().toISOString().split('T')[0],
      turno: 'MANHA',
      status: 'PENDENTE',
      coletadorId: 'col-001',
      coletadorNome: 'Carlos Eduardo Rocha'
    },
    {
      id: 'apt-002',
      protocolo: 'BLH-2026-0143',
      doadoraId: 'd-002',
      nomeDoadora: 'Mariana Silva de Holanda',
      telefone: '(82) 98842-9912',
      bairro: 'Ponta Verde',
      regiaoLogistica: 'ORLA_BAIXA',
      enderecoCompleto: 'Rua Engenheiro Mário de Gusmão, 450, Apt 701, Ponta Verde',
      pontoReferencia: 'Próximo à Praça Lions',
      motivo: 'BUSCAR_LEITE',
      quantidadeFrascosEstimada: 3,
      dataAgendada: new Date().toISOString().split('T')[0],
      turno: 'MANHA',
      status: 'COLETADO',
      coletadorId: 'col-001',
      coletadorNome: 'Carlos Eduardo Rocha',
      dadosColeta: {
        dataHoraColeta: new Date().toISOString(),
        frascosColetados: 3,
        volumeAproximadoMl: 650,
        frascosEntregues: 3,
        temperaturaTermicaC: -12.5,
        observacoes: 'Leite perfeitamente congelado em frascos padronizados. Mãe excelente.',
        coletadorMatricula: '48291-0'
      }
    },
    {
      id: 'apt-003',
      protocolo: 'BLH-2026-0146',
      doadoraId: 'd-005',
      nomeDoadora: 'Beatriz Vasconcelos Ramos',
      telefone: '(82) 99655-4433',
      bairro: 'Benedito Bentes',
      regiaoLogistica: 'TABULEIRO_ALTA',
      enderecoCompleto: 'Avenida Cachoeira do Meirim, 310, Conjunto Graciliano Ramos, Benedito Bentes',
      pontoReferencia: 'Próximo ao Terminal de Ônibus',
      motivo: 'RECEBER_FRASCOS',
      quantidadeFrascosEstimada: 4,
      dataAgendada: new Date().toISOString().split('T')[0],
      turno: 'TARDE',
      status: 'PENDENTE',
      coletadorId: 'col-001',
      coletadorNome: 'Carlos Eduardo Rocha'
    }
  ],
  collectors: [
    {
      id: 'col-001',
      nome: 'Carlos Eduardo Rocha',
      matricula: '48291-0',
      telefone: '(82) 99341-8899',
      veiculo: 'Van Fiat Ducato Isotérmica - Placa QTT-4821 (MESM/UNCISAL)',
      pin: hashPin('1234'),
      ativo: true
    },
    {
      id: 'col-002',
      nome: 'Ana Patrícia Viana',
      matricula: '39102-4',
      telefone: '(82) 99122-3344',
      veiculo: 'Van Renault Master Refr. - Placa QTT-9012 (MESM/UNCISAL)',
      pin: hashPin('5678'),
      ativo: true
    }
  ],
  staffMembers: [
    {
      id: 'prof-001',
      nome: 'Dra. Maria do Carmo Lins',
      cargo: 'Médica Neonatologista & Coord. Técnica BLH',
      funcao: 'MEDICO',
      registroProfissional: 'CRM-AL 4821',
      matricula: '4821',
      email: 'maria.lins@uncisal.edu.br',
      departamento: 'Banco de Leite Humano • MESM/UNCISAL',
      pin: hashPin('1234')
    },
    {
      id: 'prof-002',
      nome: 'Enfª Ana Cláudia Silva',
      cargo: 'Enfermeira Especialista em Triagem & Captação',
      funcao: 'ENFERMEIRO',
      registroProfissional: 'COREN-AL 12894',
      matricula: '12894',
      email: 'ana.silva@uncisal.edu.br',
      departamento: 'Enfermagem & Triagem Clínica • MESM/UNCISAL',
      pin: hashPin('1234')
    },
    {
      id: 'prof-003',
      nome: 'Dra. Helena Brandão',
      cargo: 'Coordenadora Administrativa & Regulatório',
      funcao: 'GESTOR',
      registroProfissional: 'Matrícula UNCISAL 51902-3',
      matricula: '51902',
      email: 'helena.brandao@uncisal.edu.br',
      departamento: 'Gestão Operacional de Frotas & BLH',
      pin: hashPin('1234')
    }
  ],
  logs: [
    {
      id: 'log-001',
      timestamp: '2026-10-04T15:20:00.000Z',
      tipo: 'VALIDACAO_EXAMES',
      categoria: 'ENFERMAGEM',
      protocolo: 'BLH-2026-0142',
      doadoraNome: 'Camila Albuquerque Vasconcelos',
      usuarioResponsavel: 'Enfª Ana Cláudia Silva',
      cargoResponsavel: 'Enfermeira Especialista em Triagem & Captação',
      matriculaOuRegistro: 'COREN-AL 12894',
      funcaoUsuario: 'ENFERMEIRO',
      acao: 'Validação de Caderneta de Pré-Natal e Sorologias',
      statusAnterior: 'EM_ANALISE',
      statusNovo: 'APTA',
      detalhes: 'Sorologias do 3º trimestre conferidas (HIV 1/2 não reagente, VDRL não reagente, HBsAg não reagente, Anti-HCV não reagente). Doadora liberada para rota de coleta domiciliar.',
      justificativaClinica: 'Conforme Item 4.2 da RDC ANVISA nº 171/2006 (Controle Higiênico-Sanitário e Sorológico da Doadora).',
      ipOuCanal: 'Terminal Enfermagem BLH • MESM (IP 10.20.4.18)',
      nivelRisco: 'SUCESSO',
      conformidadeNormativa: 'RDC ANVISA nº 171/2006 - Art. 14 / Art. 18',
      hashRastreabilidade: 'SHA256-ANVISA-8F20D1A39C4E'
    },
    {
      id: 'log-002',
      timestamp: '2026-10-04T14:40:00.000Z',
      tipo: 'PARECER_MEDICO',
      categoria: 'MEDICO',
      protocolo: 'BLH-2026-0144',
      doadoraNome: 'Juliana Mendes Peixoto',
      usuarioResponsavel: 'Dra. Maria do Carmo Lins',
      cargoResponsavel: 'Médica Neonatologista & Coord. Técnica BLH',
      matriculaOuRegistro: 'CRM-AL 4821',
      funcaoUsuario: 'MEDICO',
      acao: 'Emissão de Parecer Médico Farmacológico',
      statusAnterior: 'EM_ANALISE',
      statusNovo: 'APTA',
      detalhes: 'Avaliação clínica de uso de Levotiroxina 50mcg (reposição tireoidiana estável). Medicamento de risco L1 (seguro/compatível na lactação). Liberação de doação autorizada para a UTIN.',
      justificativaClinica: 'L-Tiroxina possui transferência mínima ao leite materno sem efeitos adversos aos neonatos prematuros.',
      ipOuCanal: 'Estação Médica Neonatologia • MESM (IP 10.20.4.12)',
      nivelRisco: 'SUCESSO',
      conformidadeNormativa: 'RDC ANVISA nº 171/2006 - Art. 18 / Guia MS 2024',
      hashRastreabilidade: 'SHA256-ANVISA-5B81C7E92A11'
    },
    {
      id: 'log-003',
      timestamp: '2026-10-04T13:15:00.000Z',
      tipo: 'INTERACAO_CHAT',
      categoria: 'CHATBOT',
      protocolo: 'BLH-2026-0145',
      doadoraNome: 'Larissa Duarte Fontes',
      usuarioResponsavel: 'Chatbot Virtual BLH (Atendimento Virtual)',
      cargoResponsavel: 'Agente de Inteligência Sanitária BLH',
      matriculaOuRegistro: 'BOT-MESM-UNCISAL',
      funcaoUsuario: 'SISTEMA_CHATBOT',
      acao: 'Triagem Clínica Automatizada via WhatsApp',
      statusNovo: 'EM_ANALISE',
      detalhes: 'Candidata realizou triagem completa via chat. Informou uso de antibiótico (Amoxicilina) há 3 dias por extração dentária. Sistema direcionou para análise da equipe de enfermagem.',
      justificativaClinica: 'Suspensão cautelar de captação até término do período de carência medicamentosa (7 dias pós-antibioticoterapia).',
      transcricaoChat: [
        { remetente: 'BOT', mensagem: 'Olá! Que bom ter você aqui no Banco de Leite da Maternidade Santa Mônica. Vamos fazer sua triagem?', horario: '13:10' },
        { remetente: 'USUARIO', mensagem: 'Olá! Gostaria de doar leite, meu bebê tem 12 dias e estou com bastante sobra.', horario: '13:11' },
        { remetente: 'BOT', mensagem: 'Maravilha! Você realizou os exames de pré-natal (HIV, Sífilis, Hepatites)?', horario: '13:11' },
        { remetente: 'USUARIO', mensagem: 'Sim, todos deram negativo no cartão de gestante.', horario: '13:12' },
        { remetente: 'BOT', mensagem: 'Você está tomando algum medicamento ou passou por procedimento cirúrgico/odontológico recente?', horario: '13:13' },
        { remetente: 'USUARIO', mensagem: 'Tomei Amoxicilina tem 3 dias por causa de um dente que tirei.', horario: '13:14' },
        { remetente: 'BOT', mensagem: 'Entendido. Encaminhamos seu pré-cadastro (Protocolo BLH-2026-0145) para a equipe de Enfermagem verificar o prazo de segurança!', horario: '13:15' }
      ],
      ipOuCanal: 'WhatsApp Cloud API • Celular (82) 99341-9988',
      nivelRisco: 'ATENCAO',
      conformidadeNormativa: 'RDC ANVISA nº 171/2006 - Art. 15 (Triagem Preliminar)',
      hashRastreabilidade: 'SHA256-ANVISA-7C4410FE3189'
    },
    {
      id: 'log-004',
      timestamp: '2026-10-04T11:50:00.000Z',
      tipo: 'ALTERACAO_STATUS',
      categoria: 'ENFERMAGEM',
      protocolo: 'BLH-2026-0143',
      doadoraNome: 'Mariana Tavares Queiroz',
      usuarioResponsavel: 'Enfª Ana Cláudia Silva',
      cargoResponsavel: 'Enfermeira Especialista em Triagem & Captação',
      matriculaOuRegistro: 'COREN-AL 12894',
      funcaoUsuario: 'ENFERMEIRO',
      acao: 'Inaptidão Temporária Registrada pela Enfermagem',
      statusAnterior: 'EM_ANALISE',
      statusNovo: 'INAPTA_TEMPORARIA',
      detalhes: 'Doadora realizou micropigmentação há 4 meses. Conforme norma RDC 171/2006, é necessária carência sanitária de 12 meses. Retorno programado para 04/06/2027.',
      justificativaClinica: 'Janela imunológica para infecções transmissíveis pelo sangue (Hepatite B/C e HIV).',
      ipOuCanal: 'Terminal Enfermagem BLH • MESM (IP 10.20.4.18)',
      nivelRisco: 'ATENCAO',
      conformidadeNormativa: 'RDC ANVISA nº 171/2006 - Item 4.2.3',
      hashRastreabilidade: 'SHA256-ANVISA-1A9908CD7321'
    },
    {
      id: 'log-005',
      timestamp: '2026-10-04T10:30:00.000Z',
      tipo: 'COLETA_ROTA',
      categoria: 'LOGISTICA',
      protocolo: 'BLH-2026-0142',
      doadoraNome: 'Camila Albuquerque Vasconcelos',
      usuarioResponsavel: 'Carlos Eduardo Rocha',
      cargoResponsavel: 'Motorista e Agente de Coleta Externa',
      matriculaOuRegistro: 'Matrícula 48291-0 / Van QTT-4821',
      funcaoUsuario: 'COLETADOR',
      acao: 'Registro de Baixa de Coleta Domiciliar Concluída',
      statusAnterior: 'EM_ROTA',
      statusNovo: 'COLETADO',
      detalhes: 'Coleta de 2 frascos de vidro (total 400ml colostro/transição). Temperatura da caixa isotérmica de transporte aferida em -12°C. 2 frascos esterilizados entregues à mãe.',
      justificativaClinica: 'Cadeia de frio rigorosamente mantida abaixo de -10°C conforme norma de transporte de leite humano cru.',
      ipOuCanal: 'App Mobile Coletador MESM • GPS Rota Ponta Verde',
      nivelRisco: 'SUCESSO',
      conformidadeNormativa: 'RDC ANVISA nº 171/2006 - Art. 21 (Transporte de Leite Humano)',
      hashRastreabilidade: 'SHA256-ANVISA-44DF8902AA19'
    },
    {
      id: 'log-006',
      timestamp: '2026-10-04T09:15:00.000Z',
      tipo: 'ACESSO_AUTENTICACAO',
      categoria: 'SISTEMA',
      usuarioResponsavel: 'Dra. Helena Brandão',
      cargoResponsavel: 'Coordenadora Administrativa & Regulatório',
      matriculaOuRegistro: 'Matrícula UNCISAL 51902-3',
      funcaoUsuario: 'GESTOR',
      acao: 'Início de Sessão de Plantão Administrativo',
      detalhes: 'Autenticação bem-sucedida no Painel Hospitalar do BLH da Maternidade Escola Santa Mônica.',
      ipOuCanal: 'Terminal Central BLH • MESM (IP 10.20.4.10)',
      nivelRisco: 'INFORMATIVO',
      conformidadeNormativa: 'RDC ANVISA nº 171/2006 - Art. 14 (Segurança e Registro de Acesso)',
      hashRastreabilidade: 'SHA256-ANVISA-99AB1234EE00'
    },
    {
      id: 'log-007',
      timestamp: '2026-10-03T16:45:00.000Z',
      tipo: 'INTERACAO_CHAT',
      categoria: 'CHATBOT',
      protocolo: 'BLH-2026-0144',
      doadoraNome: 'Juliana Mendes Peixoto',
      usuarioResponsavel: 'Chatbot Virtual BLH',
      cargoResponsavel: 'Agente de Inteligência Sanitária BLH',
      matriculaOuRegistro: 'BOT-MESM-UNCISAL',
      funcaoUsuario: 'SISTEMA_CHATBOT',
      acao: 'Captação de Doadora e Envio de Orientações de Ordenha',
      statusNovo: 'EM_ANALISE',
      detalhes: 'Doadora esclareceu dúvidas sobre esterilização de frascos e higiene das mamas (sem uso de sabonetes na aréola). Agendamento preliminar registrado.',
      transcricaoChat: [
        { remetente: 'BOT', mensagem: 'Olá! Sou a assistente do Banco de Leite da MESM. Gostaria de doar ou saber como guardar o leite?', horario: '16:40' },
        { remetente: 'USUARIO', mensagem: 'Quero doar, mas não sei como esterilizar o vidro em casa.', horario: '16:41' },
        { remetente: 'BOT', mensagem: 'Ferva o pote de vidro com tampa de plástico livre de BPA por 15 minutos. Nós também entregamos frascos já esterilizados no seu domicílio!', horario: '16:42' },
        { remetente: 'USUARIO', mensagem: 'Perfeito! Meu endereço é na Rua Fernandes Lima, Farol.', horario: '16:43' },
        { remetente: 'BOT', mensagem: 'Endereço recebido e rota Farol/Centro configurada!', horario: '16:45' }
      ],
      ipOuCanal: 'WhatsApp Cloud API • Celular (82) 99122-3344',
      nivelRisco: 'SUCESSO',
      conformidadeNormativa: 'RDC ANVISA nº 171/2006 - Art. 15',
      hashRastreabilidade: 'SHA256-ANVISA-33EF88190B12'
    }
  ]
};

// Database helper com Proteção Atômica, Backup Rotativo e Tolerância a Falhas
function sanitizeAndMigrateData(parsed: any): { data: any; dirty: boolean } {
  let dirty = false;
  if (!parsed.staffMembers) {
    parsed.staffMembers = SEED_DATA.staffMembers;
    dirty = true;
  }
  if (!parsed.collectors) {
    parsed.collectors = SEED_DATA.collectors;
    dirty = true;
  }
  if (!parsed.logs || !Array.isArray(parsed.logs) || parsed.logs.length === 0) {
    parsed.logs = SEED_DATA.logs;
    dirty = true;
  }
  // Sanitização e hashing retroativo de senhas no arquivo do banco (PBKDF2 com Salt)
  if (Array.isArray(parsed.staffMembers)) {
    for (const member of parsed.staffMembers) {
      if (member.pin && !member.pin.includes(':')) {
        member.pin = hashPin(member.pin);
        dirty = true;
      }
    }
  }
  if (Array.isArray(parsed.collectors)) {
    for (const collector of parsed.collectors) {
      if (collector.pin && !collector.pin.includes(':')) {
        collector.pin = hashPin(collector.pin);
        dirty = true;
      }
    }
  }
  return { data: parsed, dirty };
}

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      try {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        const { data: sanitized, dirty } = sanitizeAndMigrateData(parsed);
        if (dirty) {
          saveDB(sanitized);
        }
        return sanitized;
      } catch (parseErr) {
        console.error('[DB] Corrupção de arquivo detectada em DB_FILE! Tentando restauração a partir do backup rotativo:', parseErr);
        if (fs.existsSync(DB_BACKUP_FILE)) {
          const backupData = fs.readFileSync(DB_BACKUP_FILE, 'utf-8');
          const parsedBackup = JSON.parse(backupData);
          console.log('[DB] Banco restaurado com sucesso a partir do backup rotativo (.bak)!');
          const { data: sanitized } = sanitizeAndMigrateData(parsedBackup);
          saveDB(sanitized);
          return sanitized;
        }
      }
    }
  } catch (err) {
    console.error('Error reading DB_FILE, falling back to seed:', err);
  }

  // Se não existir ou recuperação falhar, inicializa seed segura
  try {
    saveDB(SEED_DATA);
  } catch (err) {
    console.error('Error writing initial seed data:', err);
  }
  return SEED_DATA;
}

// Gravação Atômica Inviolável (Atomic Write via Temp File + Atomic Rename POSIX)
function saveDB(data: typeof SEED_DATA) {
  try {
    const jsonStr = JSON.stringify(data, null, 2);

    // 1. Gravação no arquivo temporário
    fs.writeFileSync(DB_TMP_FILE, jsonStr, { mode: 0o600 });

    // 2. Backup do banco anterior para resiliência contra desastres
    if (fs.existsSync(DB_FILE)) {
      try {
        fs.copyFileSync(DB_FILE, DB_BACKUP_FILE);
      } catch (backupErr) {
        console.warn('[DB] Aviso na cópia de backup rotativo:', backupErr);
      }
    }

    // 3. Renomeação atômica POSIX (impede corrupção de arquivo em caso de desligamento abrupto)
    fs.renameSync(DB_TMP_FILE, DB_FILE);

    // 4. Enforça permissão restrita 0600 (apenas o processo da aplicação lê e grava)
    try {
      fs.chmodSync(DB_FILE, 0o600);
    } catch {}
  } catch (err) {
    console.error('[DB] Erro crítico ao persistir banco de dados:', err);
    if (fs.existsSync(DB_TMP_FILE)) {
      try { fs.unlinkSync(DB_TMP_FILE); } catch {}
    }
  }
}

// Audit Log Helper com Criptoencadeamento SHA-256 (ANVISA RDC 171/2006 Art. 18 & LGPD Art. 46)
function recordActivityLog(db: any, log: any) {
  if (!db.logs) {
    db.logs = [];
  }
  const timestamp = log.timestamp || new Date().toISOString();
  const previousHash = db.logs[0]?.hashRastreabilidade || 'GENESIS-BLH-MESM-2026';
  const logSignaturePayload = `${timestamp}|${log.tipo || 'ALTERACAO'}|${log.usuarioResponsavel || 'Sistema'}|${log.acao || ''}|${log.protocolo || ''}|${previousHash}`;
  const cryptoHash = `SHA256-ANVISA-${crypto.createHash('sha256').update(logSignaturePayload).digest('hex').substring(0, 16).toUpperCase()}`;

  const newLog = {
    id: log.id || `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp,
    tipo: log.tipo || 'ALTERACAO_STATUS',
    categoria: log.categoria || 'SISTEMA',
    protocolo: log.protocolo || undefined,
    doadoraId: log.doadoraId || undefined,
    doadoraNome: log.doadoraNome || undefined,
    usuarioResponsavel: log.usuarioResponsavel || 'Sistema BLH / MESM',
    cargoResponsavel: log.cargoResponsavel || undefined,
    matriculaOuRegistro: log.matriculaOuRegistro || undefined,
    funcaoUsuario: log.funcaoUsuario || 'ENFERMEIRO',
    acao: log.acao || 'Atualização de Registro',
    statusAnterior: log.statusAnterior || undefined,
    statusNovo: log.statusNovo || undefined,
    detalhes: log.detalhes || '',
    justificativaClinica: log.justificativaClinica || undefined,
    transcricaoChat: log.transcricaoChat || undefined,
    respostasTriagem: log.respostasTriagem || undefined,
    ipOuCanal: log.ipOuCanal || 'Terminal Interno MESM',
    nivelRisco: log.nivelRisco || 'INFORMATIVO',
    conformidadeNormativa: log.conformidadeNormativa || 'RDC ANVISA nº 171/2006 - Art. 14 / Art. 18',
    hashRastreabilidade: log.hashRastreabilidade || cryptoHash
  };

  db.logs.unshift(newLog);
  // Mantém histórico de até 1000 logs rastreáveis
  if (db.logs.length > 1000) {
    db.logs = db.logs.slice(0, 1000);
  }
  saveDB(db);
  return newLog;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Desativa identificador do servidor para dificultar fingerprinting (VULN-07)
  app.disable('x-powered-by');

  // Proteção Defesa-em-Profundidade: Bloqueio estrito de acesso direto a arquivos de banco de dados, backups e configurações
  app.use((req, res, next) => {
    const rawUrl = (req.url || '').toLowerCase().split('?')[0];
    if (
      rawUrl.startsWith('/data') ||
      rawUrl.includes('blh_database') ||
      rawUrl.endsWith('.db') ||
      rawUrl.endsWith('.bak') ||
      rawUrl.endsWith('.tmp') ||
      (rawUrl.endsWith('.json') && !rawUrl.startsWith('/api') && !rawUrl.includes('manifest')) ||
      rawUrl.includes('.env') ||
      rawUrl.includes('.git')
    ) {
      return res.status(403).json({
        error: 'ACESSO_PROIBIDO',
        message: 'Acesso direto a arquivos de banco de dados, backups ou configurações sensíveis é estritamente proibido.'
      });
    }
    next();
  });

  // Cabeçalhos HTTP de Segurança Reforçados (OWASP / LGPD / ANVISA)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval';");
    next();
  });

  // Rate Limiting para Autenticação (VULN-06: Prevenção de ataques de força bruta)
  const authRateLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 20,
    message: 'Muitas tentativas de autenticação a partir deste endereço IP. Aguarde alguns minutos antes de tentar novamente.'
  });

  // Rate Limiting para Consulta de Telefones (VULN-06 / VULN-09: Prevenção de scraping)
  const phoneCheckLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000,
    maxRequests: 40,
    message: 'Limite de consultas de verificação atingido. Tente novamente mais tarde.'
  });

  app.use(express.json({ limit: '10mb' }));

  // -------------------------------------------------------------
  // REST API Routes
  // -------------------------------------------------------------

  // POST /api/auth/hospital-login (Autenticação do Corpo Clínico MESM)
  app.post('/api/auth/hospital-login', authRateLimiter, (req: Request, res: Response) => {
    const { login, pin } = req.body;
    if (!login || !pin) {
      return res.status(400).json({ error: 'Informe o registro/matrícula e a senha.' });
    }

    const cleanLogin = (login || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanPin = (pin || '').trim();

    const db = loadDB();
    const staffMembers = db.staffMembers || SEED_DATA.staffMembers;

    const found = staffMembers.find((m: any) => {
      const matchMat = m.matricula.toLowerCase() === cleanLogin;
      const matchReg = m.registroProfissional.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanLogin);
      const matchEmail = m.email.toLowerCase() === login.trim().toLowerCase();
      const matchNome = m.nome.toLowerCase().includes(login.trim().toLowerCase());
      return matchMat || matchReg || matchEmail || matchNome;
    });

    if (!found || !verifyPin(cleanPin, found.pin)) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique a matrícula ou senha informada.' });
    }

    // Emissão de Token Assinado HMAC-SHA256 (VULN-01)
    const token = generateToken({
      sub: found.id,
      matricula: found.matricula,
      nome: found.nome,
      role: found.funcao,
      tipo: 'STAFF'
    });

    // Registro de Auditoria de Acesso (RDC ANVISA 171/2006 Art. 14)
    recordActivityLog(db, {
      tipo: 'ACESSO_AUTENTICACAO',
      categoria: 'SISTEMA',
      usuarioResponsavel: found.nome,
      cargoResponsavel: found.cargo,
      matriculaOuRegistro: found.matricula,
      funcaoUsuario: found.funcao,
      acao: 'Autenticação Bem-Sucedida no Painel Hospitalar',
      detalhes: `Sessão iniciada por ${found.nome} (${found.funcao}).`,
      ipOuCanal: req.ip || 'Terminal MESM Web',
      nivelRisco: 'INFORMATIVO'
    });

    res.json({
      success: true,
      user: {
        id: found.id,
        nome: found.nome,
        cargo: found.cargo,
        funcao: found.funcao,
        registroProfissional: found.registroProfissional,
        matricula: found.matricula,
        email: found.email,
        departamento: found.departamento
      },
      token
    });
  });

  // POST /api/auth/collector-login (VULN-02: Autenticação Segura de Vans/Coletadores no Backend)
  app.post('/api/auth/collector-login', authRateLimiter, (req: Request, res: Response) => {
    const { matricula, pin } = req.body;
    if (!matricula || !pin) {
      return res.status(400).json({ error: 'Informe a matrícula da van e o PIN de acesso.' });
    }

    const cleanMat = (matricula || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanPin = (pin || '').trim();

    const db = loadDB();
    const collectors = db.collectors || SEED_DATA.collectors;

    const found = collectors.find((c: any) => 
      c.matricula.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanMat ||
      c.id === matricula.trim()
    );

    if (!found || !verifyPin(cleanPin, found.pin)) {
      return res.status(401).json({ error: 'Matrícula da van ou PIN incorreto. Verifique suas credenciais.' });
    }

    // Emissão de Token Assinado para Van
    const token = generateToken({
      sub: found.id,
      matricula: found.matricula,
      nome: found.nome,
      role: 'COLETADOR',
      tipo: 'COLETADOR'
    });

    recordActivityLog(db, {
      tipo: 'ACESSO_AUTENTICACAO',
      categoria: 'LOGISTICA',
      usuarioResponsavel: found.nome,
      cargoResponsavel: 'Motorista / Agente de Coleta Externa',
      matriculaOuRegistro: found.matricula,
      funcaoUsuario: 'COLETADOR',
      acao: 'Autenticação na Van de Coleta Externa',
      detalhes: `Acesso autenticado para ${found.veiculo}.`,
      ipOuCanal: req.ip || 'Dispositivo Móvel Van',
      nivelRisco: 'INFORMATIVO'
    });

    res.json({
      success: true,
      collector: {
        id: found.id,
        nome: found.nome,
        matricula: found.matricula,
        telefone: found.telefone,
        veiculo: found.veiculo,
        ativo: found.ativo
      },
      token
    });
  });

  // POST /api/auth/hospital-change-password
  app.post('/api/auth/hospital-change-password', authRateLimiter, (req: Request, res: Response) => {
    const { login, currentPin, newPin } = req.body;
    if (!login || !currentPin || !newPin) {
      return res.status(400).json({ error: 'Informe o registro/matrícula, a senha atual e a nova senha.' });
    }

    if (newPin.trim().length < 4) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 4 caracteres ou dígitos.' });
    }

    const db = loadDB();
    if (!db.staffMembers) {
      db.staffMembers = SEED_DATA.staffMembers;
    }

    const cleanLogin = (login || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCurrent = (currentPin || '').trim();

    const staffIndex = db.staffMembers.findIndex((m: any) => {
      const matchMat = m.matricula.toLowerCase() === cleanLogin;
      const matchReg = m.registroProfissional.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanLogin);
      const matchEmail = m.email.toLowerCase() === login.trim().toLowerCase();
      const matchNome = m.nome.toLowerCase().includes(login.trim().toLowerCase());
      return matchMat || matchReg || matchEmail || matchNome;
    });

    if (staffIndex === -1) {
      return res.status(404).json({ error: 'Profissional não localizado no corpo clínico da MESM.' });
    }

    const member = db.staffMembers[staffIndex];
    if (!verifyPin(cleanCurrent, member.pin)) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }

    // Salva a nova senha com hash PBKDF2 e Salt criptográfico (VULN-04)
    member.pin = hashPin(newPin);
    saveDB(db);

    recordActivityLog(db, {
      tipo: 'ACESSO_AUTENTICACAO',
      categoria: 'SISTEMA',
      usuarioResponsavel: member.nome,
      cargoResponsavel: member.cargo,
      matriculaOuRegistro: member.matricula,
      funcaoUsuario: member.funcao,
      acao: 'Alteração de Senha Funcional',
      detalhes: 'Senha de acesso hospitalar atualizada com sucesso e criptografada via PBKDF2.',
      ipOuCanal: req.ip || 'Terminal MESM',
      nivelRisco: 'INFORMATIVO'
    });

    res.json({
      success: true,
      message: `Senha de ${member.nome} alterada com sucesso!`,
      user: {
        id: member.id,
        nome: member.nome,
        cargo: member.cargo,
        funcao: member.funcao,
        registroProfissional: member.registroProfissional,
        matricula: member.matricula,
        email: member.email,
        departamento: member.departamento
      }
    });
  });

  // POST /api/auth/collector-change-pin
  app.post('/api/auth/collector-change-pin', authRateLimiter, (req: Request, res: Response) => {
    const { matricula, currentPin, newPin } = req.body;
    if (!matricula || !currentPin || !newPin) {
      return res.status(400).json({ error: 'Informe a matrícula da van, o PIN atual e o novo PIN.' });
    }

    if (newPin.trim().length < 4) {
      return res.status(400).json({ error: 'O novo PIN deve conter no mínimo 4 dígitos.' });
    }

    const db = loadDB();
    const cleanMat = (matricula || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCurrent = (currentPin || '').trim();

    const colIndex = db.collectors.findIndex((c: any) => 
      c.matricula.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanMat ||
      c.id === matricula.trim() ||
      c.nome.toLowerCase().includes(matricula.trim().toLowerCase())
    );

    if (colIndex === -1) {
      return res.status(404).json({ error: 'Coletador/motorista não encontrado.' });
    }

    const collector = db.collectors[colIndex];
    if (!verifyPin(cleanCurrent, collector.pin)) {
      return res.status(401).json({ error: 'PIN atual incorreto.' });
    }

    // Salva novo PIN criptografado (VULN-04)
    collector.pin = hashPin(newPin);
    saveDB(db);

    recordActivityLog(db, {
      tipo: 'ACESSO_AUTENTICACAO',
      categoria: 'LOGISTICA',
      usuarioResponsavel: collector.nome,
      cargoResponsavel: 'Motorista / Agente de Coleta Externa',
      matriculaOuRegistro: collector.matricula,
      funcaoUsuario: 'COLETADOR',
      acao: 'Alteração de PIN da Van',
      detalhes: `PIN do coletador atualizado com sucesso e criptografado.`,
      ipOuCanal: req.ip || 'Terminal Van',
      nivelRisco: 'INFORMATIVO'
    });

    // Retorna coletador SEM expor o PIN ou hash (VULN-02)
    res.json({
      success: true,
      message: `PIN da van (${collector.nome}) atualizado com sucesso!`,
      collector: {
        id: collector.id,
        nome: collector.nome,
        matricula: collector.matricula,
        telefone: collector.telefone,
        veiculo: collector.veiculo,
        ativo: collector.ativo
      }
    });
  });

  // GET /api/stats
  app.get('/api/stats', (req: Request, res: Response) => {
    const db = loadDB();
    const totalDoadoras = db.donors.length;
    const aptas = db.donors.filter((d: any) => d.status === 'APTA').length;
    const emAnalise = db.donors.filter((d: any) => d.status === 'EM_ANALISE').length;
    const inaptasTemporarias = db.donors.filter((d: any) => d.status === 'INAPTA_TEMPORARIA').length;
    const inaptasDefinitivas = db.donors.filter((d: any) => d.status === 'INAPTA_DEFINITIVA').length;
    
    const coletasHoje = db.appointments.length;
    const coletasConcluidas = db.appointments.filter((a: any) => a.status === 'COLETADO').length;

    // Calcular volume total coletado
    const volumeTotalMl = db.appointments.reduce((acc: number, a: any) => {
      return acc + (a.dadosColeta?.volumeAproximadoMl || 0);
    }, 4850); // baseline histórico

    // 1 litro de leite materno pode alimentar até 10 recém-nascidos prematuros por dia na UTIN
    const bebesBeneficiadosEstimados = Math.max(12, Math.round((volumeTotalMl / 1000) * 8));

    // Frascos entregues
    const frascosDistribuidos = db.appointments.reduce((acc: number, a: any) => {
      return acc + (a.dadosColeta?.frascosEntregues || 0);
    }, 18);

    res.json({
      totalDoadoras,
      aptas,
      emAnalise,
      inaptasTemporarias,
      inaptasDefinitivas,
      coletasHoje,
      coletasConcluidas,
      volumeTotalMl,
      bebesBeneficiadosEstimados,
      frascosDistribuidos
    });
  });

  // GET /api/donors (VULN-01: Requer autenticação do corpo clínico MESM)
  app.get('/api/donors', requireAuth(['MEDICO', 'ENFERMEIRO', 'GESTOR']), (req: Request, res: Response) => {
    const db = loadDB();
    const { status, search, bairro } = req.query;
    let donors = db.donors;

    if (status && status !== 'TODOS') {
      donors = donors.filter((d: any) => d.status === status);
    }
    if (bairro) {
      donors = donors.filter((d: any) => d.endereco?.bairro?.toLowerCase() === (bairro as string).toLowerCase());
    }
    if (search) {
      const q = (search as string).toLowerCase();
      donors = donors.filter((d: any) => 
        d.nomeCompleto?.toLowerCase().includes(q) ||
        d.protocolo?.toLowerCase().includes(q) ||
        d.cpf?.includes(q) ||
        d.telefone?.includes(q)
      );
    }

    res.json(donors);
  });

  // GET /api/donors/check-phone (VULN-06 & VULN-09: Protegido contra scraping com dados minimizados LGPD)
  app.get('/api/donors/check-phone', phoneCheckLimiter, (req: Request, res: Response) => {
    const db = loadDB();
    const phone = req.query.phone as string;
    if (!phone) {
      return res.json({ exists: false });
    }
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 8) {
      return res.json({ exists: false });
    }
    const found = db.donors.find((d: any) => {
      const dDigits = (d.telefone || '').replace(/\D/g, '');
      return dDigits.length >= 8 && (dDigits === clean || dDigits.endsWith(clean) || clean.endsWith(dDigits));
    });
    if (found) {
      return res.json({ 
        exists: true, 
        protocolo: found.protocolo, 
        nomeCompleto: maskName(found.nomeCompleto), // Minimizado conforme LGPD
        status: found.status
      });
    }
    return res.json({ exists: false });
  });

  // POST /api/donors (VULN-05: Validação estrita e proteção contra Mass Assignment)
  app.post('/api/donors', (req: Request, res: Response) => {
    const db = loadDB();
    const body = req.body || {};

    if (!body.nomeCompleto || !body.telefone || !body.cpf) {
      return res.status(400).json({ error: 'Nome completo, telefone e CPF são obrigatórios para a triagem.' });
    }

    // Restrição Sanitária: Não permitir telefone duplicado
    const telDigits = (body.telefone || '').replace(/\D/g, '');
    if (telDigits.length >= 8) {
      const existingDonor = db.donors.find((d: any) => {
        const dDigits = (d.telefone || '').replace(/\D/g, '');
        return dDigits.length >= 8 && (dDigits === telDigits || dDigits.endsWith(telDigits) || telDigits.endsWith(dDigits));
      });
      if (existingDonor) {
        return res.status(409).json({ 
          error: 'TELEFONE_DUPLICADO',
          message: `Este número de telefone já possui cadastro ativo sob o protocolo ${existingDonor.protocolo}.`,
          protocoloExistente: existingDonor.protocolo,
          doadoraExistente: maskName(existingDonor.nomeCompleto)
        });
      }
    }

    // Protocolo sequencial oficial BLH-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const seq = (db.donors.length + 147).toString().padStart(4, '0');
    const protocolo = `BLH-${currentYear}-${seq}`;

    // Determina status inicial sanitário rigoroso (nunca aceita status injetado pelo cliente)
    const respostas = body.respostas || {};
    let statusInicial = 'EM_ANALISE';
    let motivoStatus = 'Aguardando conferência de sorologias do pré-natal e parecer médico.';

    if (respostas.sorologiaPositiva || respostas.alcoolDrogas === 'SUBSTANCIAS_ILICITAS') {
      statusInicial = 'INAPTA_DEFINITIVA';
      motivoStatus = 'Inaptidão definitiva preliminar detectada na triagem inicial.';
    } else if (respostas.tatuagem12Meses || respostas.transfusao12Meses || respostas.tabagismo === 'MAIS_10') {
      statusInicial = 'INAPTA_TEMPORARIA';
      motivoStatus = 'Critério temporal de carência sanitária identificado na triagem.';
    }

    // Whitelist estrita de campos permitidos
    const doadoraCompleta = {
      id: `d-${Date.now()}`,
      protocolo,
      nomeCompleto: String(body.nomeCompleto).trim().slice(0, 150),
      cpf: String(body.cpf).trim().slice(0, 20),
      telefone: String(body.telefone).trim().slice(0, 25),
      email: body.email ? String(body.email).trim().slice(0, 100) : undefined,
      dataNascimento: String(body.dataNascimento || '').trim().slice(0, 20),
      nomeBebe: body.nomeBebe ? String(body.nomeBebe).trim().slice(0, 100) : 'Bebê',
      dataNascimentoBebe: String(body.dataNascimentoBebe || '').trim().slice(0, 20),
      idadeBebeDias: Number(body.idadeBebeDias) || 0,
      tipoLeite: ['COLOSTRO', 'TRANSICAO', 'MADURO'].includes(body.tipoLeite) ? body.tipoLeite : 'MADURO',
      status: statusInicial,
      motivoStatus,
      respostas,
      endereco: body.endereco || undefined,
      termoConsentimento: Boolean(body.termoConsentimento),
      dataCadastro: new Date().toISOString(),
      comprovanteExames: undefined,
      parecerMedico: undefined // Impossibilita autoaprovação médica maliciosa
    };

    db.donors.unshift(doadoraCompleta);
    saveDB(db);

    recordActivityLog(db, {
      tipo: 'CADASTRO_DOADORA',
      categoria: 'SISTEMA',
      protocolo,
      doadoraId: doadoraCompleta.id,
      doadoraNome: doadoraCompleta.nomeCompleto,
      usuarioResponsavel: 'Portal Doadora / Chatbot',
      cargoResponsavel: 'Canal de Autoatendimento BLH',
      funcaoUsuario: 'SISTEMA_CHATBOT',
      acao: 'Pré-Cadastro de Doadora Realizado',
      statusNovo: statusInicial,
      detalhes: `Pré-cadastro criado com sucesso. Bairro: ${doadoraCompleta.endereco?.bairro || 'Não informado'}.`,
      ipOuCanal: req.ip || 'Web Canal Doadora',
      nivelRisco: 'INFORMATIVO'
    });

    res.status(201).json(doadoraCompleta);
  });

  // PATCH /api/donors/:id/medical-review (VULN-01: Exclusivo para Médicos ou Gestores Clínicos)
  app.patch('/api/donors/:id/medical-review', requireAuth(['MEDICO', 'GESTOR']), (req: Request, res: Response) => {
    const db = loadDB();
    const { id } = req.params;
    const { decisao, observacoes, aprovadoPor, matricula } = req.body;

    if (!decisao || !['APROVADA', 'REJEITADA'].includes(decisao)) {
      return res.status(400).json({ error: 'Decisão médica inválida. Valores aceitos: APROVADA ou REJEITADA.' });
    }

    const donorIndex = db.donors.findIndex((d: any) => d.id === id || d.protocolo === id);
    if (donorIndex === -1) {
      return res.status(404).json({ error: 'Doadora não encontrada' });
    }

    const donor = db.donors[donorIndex];
    const statusAnterior = donor.status;

    donor.parecerMedico = {
      aprovadoPor: aprovadoPor || 'Dra. Maria do Carmo Lins (Médica Neonatologista BLH/MESM)',
      matricula: matricula || 'CRM-AL 4821 / UNCISAL',
      dataParecer: new Date().toISOString(),
      decisao,
      observacoes: observacoes || 'Avaliação clínica e farmacológica realizada com sucesso.'
    };

    if (decisao === 'APROVADA') {
      donor.status = 'APTA';
      donor.motivoStatus = `Aprovada por parecer médico: ${observacoes || 'Medicamento compatível com amamentação'}`;
    } else {
      donor.status = 'INAPTA_TEMPORARIA';
      donor.motivoStatus = `Suspensão preventiva por parecer médico: ${observacoes || 'Contraindicação farmacológica temporária'}`;
    }

    // Registrar Log de Atividade Rastreável (ANVISA)
    recordActivityLog(db, {
      tipo: 'PARECER_MEDICO',
      categoria: 'MEDICO',
      protocolo: donor.protocolo,
      doadoraId: donor.id,
      doadoraNome: donor.nomeCompleto,
      usuarioResponsavel: aprovadoPor || 'Dra. Maria do Carmo Lins',
      cargoResponsavel: 'Médica Neonatologista & Coordenação Técnica BLH',
      matriculaOuRegistro: matricula || 'CRM-AL 4821',
      funcaoUsuario: 'MEDICO',
      acao: decisao === 'APROVADA' ? 'Emissão de Parecer Favorável e Liberação Clínica' : 'Emissão de Parecer com Inaptidão Temporária',
      statusAnterior,
      statusNovo: donor.status,
      detalhes: observacoes || 'Parecer clínico-farmacológico emitido.',
      justificativaClinica: `Decisão médica registrada conforme protocolos da RDC ANVISA nº 171/2006. ${observacoes || ''}`,
      ipOuCanal: req.ip || 'Terminal Médico MESM',
      nivelRisco: decisao === 'APROVADA' ? 'SUCESSO' : 'ATENCAO',
      conformidadeNormativa: 'RDC ANVISA nº 171/2006 - Art. 18'
    });

    saveDB(db);
    res.json(donor);
  });

  // PATCH /api/donors/:id/comprovante (Envio Digital de Exames)
  app.patch('/api/donors/:id/comprovante', (req: Request, res: Response) => {
    const db = loadDB();
    const { id } = req.params;
    const { comprovanteExames } = req.body;

    if (!comprovanteExames || !comprovanteExames.arquivoUrl) {
      return res.status(400).json({ error: 'Arquivo do comprovante é obrigatório.' });
    }

    const donorIndex = db.donors.findIndex((d: any) => d.id === id || d.protocolo === id);
    if (donorIndex === -1) {
      return res.status(404).json({ error: 'Doadora não encontrada' });
    }

    const donor = db.donors[donorIndex];
    donor.comprovanteExames = {
      arquivoUrl: String(comprovanteExames.arquivoUrl),
      nomeArquivo: String(comprovanteExames.nomeArquivo || 'Caderneta_Exames.jpg'),
      dataEnvio: new Date().toISOString(),
      tipo: comprovanteExames.tipo === 'LAUDO_PDF' ? 'LAUDO_PDF' : 'FOTO_CADERNETA',
      tamanhoKb: Number(comprovanteExames.tamanhoKb) || 500,
      validadoEnfermagem: false // Sempre inicia como não validado
    };

    recordActivityLog(db, {
      tipo: 'CADASTRO_DOADORA',
      categoria: 'ENFERMAGEM',
      protocolo: donor.protocolo,
      doadoraId: donor.id,
      doadoraNome: donor.nomeCompleto,
      usuarioResponsavel: 'Recepção Digital BLH',
      cargoResponsavel: 'Triagem Digital de Documentos',
      funcaoUsuario: 'ENFERMEIRO',
      acao: 'Upload de Comprovante de Exames / Caderneta de Pré-Natal',
      statusAnterior: donor.status,
      statusNovo: donor.status,
      detalhes: `Comprovante recebido via canal digital e aguardando validação da enfermagem.`,
      ipOuCanal: req.ip || 'Canal Digital',
      nivelRisco: 'INFORMATIVO',
      conformidadeNormativa: 'RDC ANVISA nº 171/2006 - Item 4.2'
    });

    saveDB(db);
    res.json(donor);
  });

  // PATCH /api/donors/:id/validate-comprovante (VULN-01: Exclusivo para Enfermagem / Gestores)
  app.patch('/api/donors/:id/validate-comprovante', requireAuth(['ENFERMEIRO', 'MEDICO', 'GESTOR']), (req: Request, res: Response) => {
    const db = loadDB();
    const { id } = req.params;
    const { validadoPor, observacoes, aprovado } = req.body;

    const donorIndex = db.donors.findIndex((d: any) => d.id === id || d.protocolo === id);
    if (donorIndex === -1) {
      return res.status(404).json({ error: 'Doadora não encontrada' });
    }

    const donor = db.donors[donorIndex];
    const statusAnterior = donor.status;

    if (donor.comprovanteExames) {
      donor.comprovanteExames.validadoEnfermagem = Boolean(aprovado);
      donor.comprovanteExames.validadoPor = validadoPor || 'Enfª Ana Cláudia Silva (COREN-AL 12894)';
      donor.comprovanteExames.dataValidacao = new Date().toISOString();
      donor.comprovanteExames.observacoes = observacoes || 'Sorologias conferidas e aprovadas para doação na UTIN.';
    }

    if (aprovado) {
      donor.status = 'APTA';
      donor.motivoStatus = `Apta - Sorologias do pré-natal validadas pela Enfermagem: ${observacoes || 'Laudo sem alterações'}`;
    } else {
      donor.status = 'INAPTA_TEMPORARIA';
      donor.motivoStatus = `Inaptidão temporária indicada pela Enfermagem: ${observacoes || 'Exames pendentes ou incompletos'}`;
    }

    // Registrar Log de Atividade de Enfermagem (ANVISA)
    recordActivityLog(db, {
      tipo: 'VALIDACAO_EXAMES',
      categoria: 'ENFERMAGEM',
      protocolo: donor.protocolo,
      doadoraId: donor.id,
      doadoraNome: donor.nomeCompleto,
      usuarioResponsavel: validadoPor || 'Enfª Ana Cláudia Silva',
      cargoResponsavel: 'Enfermeira Especialista em Triagem & Captação',
      matriculaOuRegistro: 'COREN-AL 12894',
      funcaoUsuario: 'ENFERMEIRO',
      acao: aprovado ? 'Validação e Aprovação de Sorologias da Caderneta' : 'Reprovação/Pendência em Exames Sanitários',
      statusAnterior,
      statusNovo: donor.status,
      detalhes: observacoes || (aprovado ? 'Sorologias de HIV, Sífilis e Hepatites conferidas como Não Reagentes.' : 'Documento ilegível ou exames desatualizados.'),
      justificativaClinica: `Conferência rigorosa de exames laboratoriais conforme RDC ANVISA nº 171/2006 Artigo 14. ${observacoes || ''}`,
      ipOuCanal: req.ip || 'Terminal Enfermagem MESM',
      nivelRisco: aprovado ? 'SUCESSO' : 'ATENCAO',
      conformidadeNormativa: 'RDC ANVISA nº 171/2006 - Art. 14 / Art. 18'
    });

    saveDB(db);
    res.json(donor);
  });

  // GET /api/protocols/:code (VULN-09: Sanitizado / Mascarado para Consulta Pública e Recuperação de Protocolo)
  app.get('/api/protocols/:code', (req: Request, res: Response) => {
    const db = loadDB();
    const rawCode = String(req.params.code || '').trim();
    const codeUpper = rawCode.toUpperCase();
    const cleanDigits = rawCode.replace(/\D/g, '');
    const normSearch = rawCode.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const donor = db.donors.find((d: any) => {
      if (d.protocolo?.toUpperCase() === codeUpper) return true;
      if (cleanDigits.length >= 8) {
        const dDigits = (d.telefone || '').replace(/\D/g, '');
        if (dDigits === cleanDigits || dDigits.endsWith(cleanDigits) || cleanDigits.endsWith(dDigits)) return true;
      }
      if (cleanDigits.length === 11) {
        const dCpf = (d.cpf || '').replace(/\D/g, '');
        if (dCpf && dCpf === cleanDigits) return true;
      }
      if (normSearch.length >= 4) {
        const dName = (d.nomeCompleto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (dName.includes(normSearch) || normSearch.includes(dName)) return true;
      }
      return false;
    });

    const appointment = db.appointments.find((a: any) => {
      if (a.protocolo?.toUpperCase() === codeUpper) return true;
      if (donor && a.protocolo?.toUpperCase() === donor.protocolo?.toUpperCase()) return true;
      if (cleanDigits.length >= 8) {
        const aDigits = (a.telefone || '').replace(/\D/g, '');
        if (aDigits === cleanDigits || aDigits.endsWith(cleanDigits) || cleanDigits.endsWith(aDigits)) return true;
      }
      if (normSearch.length >= 4) {
        const aName = (a.nomeDoadora || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (aName.includes(normSearch) || normSearch.includes(aName)) return true;
      }
      return false;
    });

    if (!donor && !appointment) {
      return res.status(404).json({ error: 'Protocolo de doação, WhatsApp, CPF ou nome não encontrado' });
    }

    const maskPhone = (phone?: string) => {
      if (!phone) return '';
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 8) return phone;
      const ddd = digits.slice(0, 2);
      const end = digits.slice(-4);
      return `(${ddd}) 9****-${end}`;
    };

    const getSafeStatusText = (status?: string): string => {
      switch (status) {
        case 'APTA':
          return 'Doadora apta e liberada pelo corpo clínico para coleta domiciliar de leite materno.';
        case 'EM_ANALISE':
          return 'Ficha cadastral em processo de conferência documental pela equipe de enfermagem do BLH.';
        case 'INAPTA_TEMPORARIA':
          return 'Aguardando cumprimento de janela sanitária regulatória ou reavaliação de rotina.';
        case 'INAPTA_DEFINITIVA':
          return 'Cadastro não elegível para captação externa conforme diretrizes da RDC 171/2006 da ANVISA.';
        default:
          return 'Situação cadastral regular sob acompanhamento do Banco de Leite da Santa Mônica.';
      }
    };

    const sanitizedDonor = donor ? {
      id: donor.id,
      protocolo: donor.protocolo,
      nomeCompleto: maskName(donor.nomeCompleto),
      primeiroNome: donor.nomeCompleto.split(' ')[0],
      telefoneMascarado: maskPhone(donor.telefone),
      bairro: donor.endereco?.bairro || 'Maceió',
      regiaoLogistica: donor.endereco?.regiaoLogistica,
      enderecoCompleto: `Bairro ${donor.endereco?.bairro || 'Maceió'}, Maceió - AL (Logradouro sob sigilo sanitário)`,
      status: donor.status,
      motivoStatus: getSafeStatusText(donor.status),
      tipoLeite: donor.tipoLeite,
      dataCadastro: donor.dataCadastro,
      examesEnviados: !!donor.comprovanteExames,
      examesValidados: !!donor.comprovanteExames?.validadoEnfermagem
    } : null;

    const sanitizedAppointment = appointment ? {
      id: appointment.id,
      protocolo: appointment.protocolo,
      bairro: appointment.bairro,
      dataAgendada: appointment.dataAgendada,
      turno: appointment.turno,
      status: appointment.status,
      motivo: appointment.motivo,
      quantidadeFrascosEstimada: appointment.quantidadeFrascosEstimada
    } : null;

    res.json({
      protocolo: donor?.protocolo || appointment?.protocolo || codeUpper,
      doadora: sanitizedDonor,
      agendamento: sanitizedAppointment
    });
  });

  // POST /api/protocols/recover (Recuperação Segura de Protocolo por Telefone, CPF ou Nome + Bairro)
  app.post('/api/protocols/recover', (req: Request, res: Response) => {
    const db = loadDB();
    const { telefone, cpf, nome, bairro } = req.body || {};

    const cleanPhone = telefone ? String(telefone).replace(/\D/g, '') : '';
    const cleanCpf = cpf ? String(cpf).replace(/\D/g, '') : '';
    const nameQuery = nome ? String(nome).trim().toLowerCase() : '';
    const bairroQuery = bairro ? String(bairro).trim().toLowerCase() : '';

    const donor = db.donors.find((d: any) => {
      // 1. Busca por WhatsApp/Telefone
      if (cleanPhone && cleanPhone.length >= 8) {
        const dDigits = (d.telefone || '').replace(/\D/g, '');
        if (dDigits === cleanPhone || dDigits.endsWith(cleanPhone) || cleanPhone.endsWith(dDigits)) return true;
      }
      // 2. Busca por CPF
      if (cleanCpf && cleanCpf.length === 11) {
        const dCpf = (d.cpf || '').replace(/\D/g, '');
        if (dCpf && dCpf === cleanCpf) return true;
      }
      // 3. Busca por Nome da Doadora e Bairro
      if (nameQuery && nameQuery.length >= 3) {
        const dName = (d.nomeCompleto || '').toLowerCase();
        const dBairro = (d.endereco?.bairro || '').toLowerCase();
        if (dName.includes(nameQuery) && (!bairroQuery || dBairro.includes(bairroQuery))) {
          return true;
        }
      }
      return false;
    });

    if (!donor) {
      return res.status(404).json({ 
        error: 'Nenhum cadastro de doadora foi localizado com os dados informados.',
        dica: 'Verifique se digitou o DDD do WhatsApp ou confira os 11 dígitos do CPF.'
      });
    }

    const appointment = db.appointments.find((a: any) => a.protocolo?.toUpperCase() === donor.protocolo?.toUpperCase());

    const getSafeStatusText = (status?: string): string => {
      switch (status) {
        case 'APTA':
          return 'Doadora apta e liberada pelo corpo clínico para coleta domiciliar de leite materno.';
        case 'EM_ANALISE':
          return 'Ficha cadastral em processo de conferência documental pela equipe de enfermagem do BLH.';
        case 'INAPTA_TEMPORARIA':
          return 'Aguardando cumprimento de janela sanitária regulatória ou reavaliação de rotina.';
        case 'INAPTA_DEFINITIVA':
          return 'Cadastro não elegível para captação externa conforme diretrizes da RDC 171/2006 da ANVISA.';
        default:
          return 'Situação cadastral regular sob acompanhamento do Banco de Leite da Santa Mônica.';
      }
    };

    const sanitizedDonor = {
      id: donor.id,
      protocolo: donor.protocolo,
      nomeCompleto: maskName(donor.nomeCompleto),
      primeiroNome: donor.nomeCompleto.split(' ')[0],
      telefoneMascarado: maskPhone(donor.telefone),
      bairro: donor.endereco?.bairro || 'Maceió',
      regiaoLogistica: donor.endereco?.regiaoLogistica,
      enderecoCompleto: `Bairro ${donor.endereco?.bairro || 'Maceió'}, Maceió - AL (Logradouro sob sigilo sanitário)`,
      status: donor.status,
      motivoStatus: getSafeStatusText(donor.status),
      tipoLeite: donor.tipoLeite,
      dataCadastro: donor.dataCadastro
    };

    res.json({
      sucesso: true,
      protocolo: donor.protocolo,
      doadora: sanitizedDonor,
      agendamento: appointment ? {
        id: appointment.id,
        protocolo: appointment.protocolo,
        dataAgendada: appointment.dataAgendada,
        turno: appointment.turno,
        status: appointment.status,
        motivo: appointment.motivo
      } : null
    });
  });

  // GET /api/appointments (VULN-01: Requer autenticação de Coletador ou Hospital)
  app.get('/api/appointments', requireAuth(['COLETADOR', 'GESTOR', 'ENFERMEIRO', 'MEDICO']), (req: Request, res: Response) => {
    const db = loadDB();
    const { status, regiao, data } = req.query;
    let appointments = db.appointments;

    if (status && status !== 'TODOS') {
      appointments = appointments.filter((a: any) => a.status === status);
    }
    if (regiao) {
      appointments = appointments.filter((a: any) => a.regiaoLogistica === regiao);
    }
    if (data) {
      appointments = appointments.filter((a: any) => a.dataAgendada === data);
    }

    res.json(appointments);
  });

  // POST /api/appointments (Criação de agendamento de coleta ou reposição de frascos)
  app.post('/api/appointments', (req: Request, res: Response) => {
    const db = loadDB();
    const body = req.body || {};

    // Localizar doadora existente caso protocolo ou doadoraId sejam fornecidos
    let existingDonor: any = null;
    if (body.protocolo) {
      existingDonor = db.donors.find((d: any) => d.protocolo?.toUpperCase() === String(body.protocolo).toUpperCase());
    } else if (body.doadoraId) {
      existingDonor = db.donors.find((d: any) => d.id === body.doadoraId);
    }

    const nomeDoadora = body.nomeDoadora || existingDonor?.nomeCompleto;
    const bairro = body.bairro || existingDonor?.endereco?.bairro;
    const telefone = body.telefone || existingDonor?.telefone;

    if (!nomeDoadora || !bairro || !telefone) {
      return res.status(400).json({ error: 'Nome da doadora, bairro e telefone são obrigatórios.' });
    }

    const regiaoLogistica = body.regiaoLogistica || existingDonor?.endereco?.regiaoLogistica || 'FAROL_CENTRO';
    const enderecoCompleto = body.enderecoCompleto || (existingDonor ? `${existingDonor.endereco?.logradouro || ''}${existingDonor.endereco?.numero ? `, nº ${existingDonor.endereco?.numero}` : ', S/N'}, ${existingDonor.endereco?.bairro || ''}, Maceió - AL` : '');
    const pontoReferencia = body.pontoReferencia || existingDonor?.endereco?.pontoReferencia || '';

    const agendamentoCompleto = {
      id: `apt-${Date.now()}`,
      protocolo: body.protocolo || existingDonor?.protocolo || `BLH-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      doadoraId: body.doadoraId || existingDonor?.id || `d-${Date.now()}`,
      nomeDoadora: String(nomeDoadora).trim().slice(0, 150),
      telefone: String(telefone).trim().slice(0, 25),
      bairro: String(bairro).trim().slice(0, 80),
      regiaoLogistica,
      enderecoCompleto: String(enderecoCompleto).trim().slice(0, 250),
      pontoReferencia: String(pontoReferencia).trim().slice(0, 150),
      motivo: ['BUSCAR_LEITE', 'RECEBER_FRASCOS', 'AMBOS'].includes(body.motivo) ? body.motivo : 'BUSCAR_LEITE',
      quantidadeFrascosEstimada: Math.min(20, Math.max(1, Number(body.quantidadeFrascosEstimada) || 2)),
      dataAgendada: body.dataAgendada || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      turno: body.turno === 'TARDE' ? 'TARDE' : 'MANHA',
      status: 'PENDENTE' // Força status inicial seguro
    };

    db.appointments.unshift(agendamentoCompleto);
    saveDB(db);

    res.status(201).json(agendamentoCompleto);
  });

  // PATCH /api/appointments/:id/status (VULN-01: Requer autenticação de Coletador ou Gestor)
  app.patch('/api/appointments/:id/status', requireAuth(['COLETADOR', 'GESTOR', 'ENFERMEIRO']), (req: Request, res: Response) => {
    const db = loadDB();
    const { id } = req.params;
    const { status, dadosColeta } = req.body;

    const allowedStatuses = ['COLETADO', 'PENDENTE', 'EM_ROTA', 'REAGENDADO', 'CANCELADO'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status de coleta inválido.' });
    }

    const aptIndex = db.appointments.findIndex((a: any) => a.id === id || a.protocolo === id);
    if (aptIndex === -1) {
      return res.status(404).json({ error: 'Agendamento de coleta não encontrado' });
    }

    const apt = db.appointments[aptIndex];
    const statusAnterior = apt.status;
    apt.status = status || 'COLETADO';

    if (dadosColeta) {
      apt.dadosColeta = {
        frascosColetados: Math.min(50, Math.max(0, Number(dadosColeta.frascosColetados) || 0)),
        volumeAproximadoMl: Math.min(5000, Math.max(0, Number(dadosColeta.volumeAproximadoMl) || 0)),
        frascosEntregues: Math.min(50, Math.max(0, Number(dadosColeta.frascosEntregues) || 0)),
        temperaturaTermicaC: Math.min(15, Math.max(-30, Number(dadosColeta.temperaturaTermicaC) || -12)),
        observacoes: String(dadosColeta.observacoes || '').slice(0, 300),
        coletadorMatricula: String(dadosColeta.coletadorMatricula || '48291-0'),
        dataHoraColeta: new Date().toISOString()
      };
    }

    // Registrar Log de Auditoria Logística (ANVISA RDC 171/2006 Art. 21)
    recordActivityLog(db, {
      tipo: 'COLETA_ROTA',
      categoria: 'LOGISTICA',
      protocolo: apt.protocolo,
      doadoraId: apt.doadoraId,
      doadoraNome: apt.nomeDoadora,
      usuarioResponsavel: dadosColeta?.coletadorMatricula ? `Coletador (Mat. ${dadosColeta.coletadorMatricula})` : (apt.coletadorNome || 'Coletador em Rota BLH'),
      cargoResponsavel: 'Motorista / Agente de Coleta Externa BLH',
      matriculaOuRegistro: dadosColeta?.coletadorMatricula || 'Rota Van MESM',
      funcaoUsuario: 'COLETADOR',
      acao: status === 'COLETADO' ? 'Baixa de Coleta Domiciliar Concluída' : `Alteração de Status de Rota para ${status}`,
      statusAnterior,
      statusNovo: apt.status,
      detalhes: dadosColeta ? 
        `Coletados: ${dadosColeta.frascosColetados} frascos (${dadosColeta.volumeAproximadoMl}ml). Temperatura térmica: ${dadosColeta.temperaturaTermicaC}°C. Frascos entregues: ${dadosColeta.frascosEntregues}. ${dadosColeta.observacoes || ''}` : 
        `Status de rota atualizado para ${status}.`,
      justificativaClinica: 'Garantia de cadeia de frio e controle de integridade sanitária dos frascos de vidro esterilizados recolhidos.',
      ipOuCanal: req.ip || 'App Mobile Coletador MESM',
      nivelRisco: 'SUCESSO',
      conformidadeNormativa: 'RDC ANVISA nº 171/2006 - Art. 21 (Transporte de Leite Humano)'
    });

    saveDB(db);
    res.json(apt);
  });

  // -------------------------------------------------------------
  // LOGS DE ATIVIDADE & RASTREABILIDADE ANVISA (RDC 171/2006)
  // -------------------------------------------------------------

  // GET /api/logs (VULN-01: Requer autenticação de Gestores e Médicos)
  app.get('/api/logs', requireAuth(['GESTOR', 'MEDICO', 'ENFERMEIRO']), (req: Request, res: Response) => {
    const db = loadDB();
    const { tipo, categoria, protocolo, search, dataInicio, dataFim, limit } = req.query;
    let logs = db.logs || [];

    if (tipo && tipo !== 'TODOS') {
      logs = logs.filter((l: any) => l.tipo === tipo);
    }
    if (categoria && categoria !== 'TODAS') {
      logs = logs.filter((l: any) => l.categoria === categoria);
    }
    if (protocolo) {
      logs = logs.filter((l: any) => l.protocolo?.toUpperCase() === (protocolo as string).toUpperCase());
    }
    if (dataInicio) {
      logs = logs.filter((l: any) => new Date(l.timestamp) >= new Date(dataInicio as string));
    }
    if (dataFim) {
      logs = logs.filter((l: any) => new Date(l.timestamp) <= new Date(dataFim as string));
    }
    if (search) {
      const q = (search as string).toLowerCase();
      logs = logs.filter((l: any) => 
        l.protocolo?.toLowerCase().includes(q) ||
        l.doadoraNome?.toLowerCase().includes(q) ||
        l.usuarioResponsavel?.toLowerCase().includes(q) ||
        l.matriculaOuRegistro?.toLowerCase().includes(q) ||
        l.acao?.toLowerCase().includes(q) ||
        l.detalhes?.toLowerCase().includes(q) ||
        l.justificativaClinica?.toLowerCase().includes(q) ||
        l.hashRastreabilidade?.toLowerCase().includes(q)
      );
    }

    const maxLimit = limit ? parseInt(limit as string, 10) : 500;
    res.json(logs.slice(0, maxLimit));
  });

  // POST /api/logs (Registro de eventos de auditoria)
  app.post('/api/logs', (req: Request, res: Response) => {
    const db = loadDB();
    const logData = req.body;

    if (!logData.acao) {
      return res.status(400).json({ error: 'Ação e descrição do evento são obrigatórios para auditoria.' });
    }

    const savedLog = recordActivityLog(db, logData);
    res.status(201).json(savedLog);
  });

  // GET /api/logs/stats (Métricas de Auditoria Regulatória)
  app.get('/api/logs/stats', requireAuth(['GESTOR', 'MEDICO', 'ENFERMEIRO']), (req: Request, res: Response) => {
    const db = loadDB();
    const logs = db.logs || [];

    const totalLogs = logs.length;
    const enfermagemCount = logs.filter((l: any) => l.categoria === 'ENFERMAGEM').length;
    const medicoCount = logs.filter((l: any) => l.categoria === 'MEDICO').length;
    const chatbotCount = logs.filter((l: any) => l.categoria === 'CHATBOT').length;
    const logisticaCount = logs.filter((l: any) => l.categoria === 'LOGISTICA').length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const logsHoje = logs.filter((l: any) => l.timestamp?.startsWith(todayStr)).length;

    res.json({
      totalLogs,
      enfermagemCount,
      medicoCount,
      chatbotCount,
      logisticaCount,
      logsHoje,
      conformidadeTaxa: '100% RDC 171/2006'
    });
  });

  // GET /api/collectors (VULN-02: Sanitizado - PIN e senhas NUNCA são expostos)
  app.get('/api/collectors', (req: Request, res: Response) => {
    const db = loadDB();
    const collectors = (db.collectors || []).map((c: any) => ({
      id: c.id,
      nome: c.nome,
      matricula: c.matricula,
      telefone: c.telefone,
      veiculo: c.veiculo,
      ativo: c.ativo
    }));
    res.json(collectors);
  });

  // POST /api/collectors (VULN-01 & VULN-04: Exclusivo para Gestores com PIN criptografado)
  app.post('/api/collectors', requireAuth(['GESTOR']), (req: Request, res: Response) => {
    const db = loadDB();
    const novoColetador = req.body;

    if (!novoColetador.nome || !novoColetador.matricula) {
      return res.status(400).json({ error: 'Nome e matrícula são obrigatórios para o cadastro da van.' });
    }

    const colDigits = (novoColetador.telefone || '').replace(/\D/g, '');
    if (colDigits.length >= 8) {
      const existing = db.collectors.find((c: any) => {
        const cDigits = (c.telefone || '').replace(/\D/g, '');
        return cDigits.length >= 8 && (cDigits === colDigits || cDigits.endsWith(colDigits) || colDigits.endsWith(cDigits));
      });
      if (existing) {
        return res.status(409).json({
          error: 'TELEFONE_DUPLICADO',
          message: `Este número de telefone (${novoColetador.telefone}) já está cadastrado para o coletador ${existing.nome} (Matrícula: ${existing.matricula}).`
        });
      }
    }

    const pinToStore = hashPin(novoColetador.pin || '1234');
    const coletadorCompleto = {
      id: novoColetador.id || `col-${Date.now()}`,
      nome: String(novoColetador.nome).trim(),
      matricula: String(novoColetador.matricula).trim(),
      telefone: String(novoColetador.telefone || '').trim(),
      veiculo: String(novoColetador.veiculo || 'Van BLH / MESM').trim(),
      pin: pinToStore,
      ativo: novoColetador.ativo !== undefined ? Boolean(novoColetador.ativo) : true
    };

    db.collectors.push(coletadorCompleto);
    saveDB(db);

    recordActivityLog(db, {
      tipo: 'ACESSO_AUTENTICACAO',
      categoria: 'LOGISTICA',
      usuarioResponsavel: 'Coordenação de Frotas BLH',
      cargoResponsavel: 'Gestão Operacional de Frotas',
      funcaoUsuario: 'GESTOR',
      acao: 'Cadastro de Novo Agente/Van de Coleta Externa',
      detalhes: `Veículo ${coletadorCompleto.veiculo} cadastrado com PIN criptografado.`,
      ipOuCanal: req.ip || 'Terminal Gestão MESM',
      nivelRisco: 'INFORMATIVO'
    });

    // Retorna sem expor o PIN ou hash
    res.status(201).json({
      id: coletadorCompleto.id,
      nome: coletadorCompleto.nome,
      matricula: coletadorCompleto.matricula,
      telefone: coletadorCompleto.telefone,
      veiculo: coletadorCompleto.veiculo,
      ativo: coletadorCompleto.ativo
    });
  });

  // In dev mode, mount Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MESM UNCISAL BLH] Server rodando na porta ${PORT}`);
  });
}

startServer();
