import { RespostasTriagem, ResultadoTriagem, TipoLeite, StatusTriagem } from '../types/blh';

/**
 * Faz parse e validação segura de data de nascimento do bebê.
 * Suporta formatos YYYY-MM-DD e DD/MM/YYYY.
 * Evita anos incompletos (como ano '2' gerando 739484 dias) e datas no futuro ou > 2 anos.
 */
export function parseDataNascimentoBebe(dataStr: string): {
  valida: boolean;
  dataISO?: string;
  idadeDias?: number;
  erro?: string;
} {
  if (!dataStr || typeof dataStr !== 'string') {
    return { valida: false, erro: 'Por favor, informe a data de nascimento.' };
  }

  const strLimpa = dataStr.trim();
  let ano = 0;
  let mes = 0;
  let dia = 0;

  // Formato DD/MM/YYYY ou DD-MM-YYYY
  const regexBR = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
  // Formato YYYY-MM-DD
  const regexISO = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;

  if (regexBR.test(strLimpa)) {
    const match = strLimpa.match(regexBR)!;
    dia = parseInt(match[1], 10);
    mes = parseInt(match[2], 10);
    ano = parseInt(match[3], 10);
    if (match[3].length <= 2) {
      ano += 2000;
    }
  } else if (regexISO.test(strLimpa)) {
    const match = strLimpa.match(regexISO)!;
    ano = parseInt(match[1], 10);
    mes = parseInt(match[2], 10);
    dia = parseInt(match[3], 10);
  } else {
    const d = new Date(strLimpa);
    if (isNaN(d.getTime())) {
      return { valida: false, erro: 'Formato de data inválido. Digite dia/mês/ano (ex: 12/09/2026).' };
    }
    ano = d.getFullYear();
    mes = d.getMonth() + 1;
    dia = d.getDate();
  }

  const anoAtual = new Date().getFullYear();

  // Se o ano for menor que 100, ajusta para 2000+
  if (ano < 100) {
    ano += 2000;
  }

  // Validação estrita de ano: o bebê deve ter no máximo 2 anos (período de amamentação rBLH)
  if (ano < anoAtual - 2) {
    return { 
      valida: false, 
      erro: `O ano informado (${ano}) parece incorreto. A doação para a UTI é voltada a mães com bebês de até 2 anos.` 
    };
  }

  if (ano > anoAtual) {
    return { valida: false, erro: 'A data não pode ser futura.' };
  }

  if (mes < 1 || mes > 12) {
    return { valida: false, erro: 'Mês inválido.' };
  }

  if (dia < 1 || dia > 31) {
    return { valida: false, erro: 'Dia inválido.' };
  }

  const dataObj = new Date(ano, mes - 1, dia);
  if (isNaN(dataObj.getTime()) || dataObj.getMonth() !== mes - 1) {
    return { valida: false, erro: 'Data inexistente no calendário.' };
  }

  const hoje = new Date();
  dataObj.setHours(0, 0, 0, 0);
  hoje.setHours(0, 0, 0, 0);

  const diffTempo = hoje.getTime() - dataObj.getTime();
  const diffDias = Math.floor(diffTempo / (1000 * 60 * 60 * 24));

  if (diffDias < 0) {
    return { valida: false, erro: 'A data de nascimento não pode ser no futuro.' };
  }

  if (diffDias > 730) {
    return { 
      valida: false, 
      erro: 'O bebê informado tem mais de 2 anos. A captação de leite para prematuros é voltada para a fase lactante inicial.' 
    };
  }

  const dataISO = `${ano.toString().padStart(4, '0')}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
  return {
    valida: true,
    dataISO,
    idadeDias: diffDias
  };
}

/**
 * Calcula a idade em dias do bebê a partir da data de nascimento de forma segura
 */
export function calcularIdadeBebeDias(dataNascimentoStr: string): number {
  if (!dataNascimentoStr) return 0;
  const parsed = parseDataNascimentoBebe(dataNascimentoStr);
  if (parsed.valida && parsed.idadeDias !== undefined) {
    return parsed.idadeDias;
  }
  return 0;
}

/**
 * Classificação Bromatológica rBLH / Fiocruz por idade lactente
 */
export function classificarTipoLeite(dias: number): {
  tipo: TipoLeite;
  rotulo: string;
  descricao: string;
  destinacaoUTIN: string;
} {
  if (dias <= 7) {
    return {
      tipo: 'COLOSTRO',
      rotulo: 'Leite Colostro (Até 7 dias)',
      descricao: 'Líquido amarelado de altíssimo valor biológico, rico em anticorpos (imunoglobulinas IgA), lactoferrina e leucócitos vivos.',
      destinacaoUTIN: 'Prioridade Ouro: Bebês prematuros extremos de muito baixo peso na UTIN da Santa Mônica.'
    };
  } else if (dias <= 14) {
    return {
      tipo: 'TRANSICAO',
      rotulo: 'Leite de Transição (8 a 14 dias)',
      descricao: 'Período intermediário com equilíbrio perfeito entre imunidade e adaptação aos nutrientes calóricos.',
      destinacaoUTIN: 'Essencial para a transição alimentar dos prematuros em estabilização clínica.'
    };
  } else {
    return {
      tipo: 'MADURO',
      rotulo: 'Leite Maduro (15 dias ou mais)',
      descricao: 'Leite volumoso, rico em lipídios saudáveis, lactose, proteínas essenciais e minerais para ganho ponderal.',
      destinacaoUTIN: 'Destinado ao ganho de peso contínuo e desenvolvimento neurológico dos bebês na UTIN.'
    };
  }
}

/**
 * Algoritmo clínico de avaliação rBLH / Fiocruz & RDC 171/2006 ANVISA
 */
export function avaliarTriagemClinica(respostas: RespostasTriagem): ResultadoTriagem {
  const idadeDias = calcularIdadeBebeDias(respostas.dataNascimentoBebe);
  const infoLeite = classificarTipoLeite(idadeDias);
  const detalhes: string[] = [];
  const orientacoes: string[] = [];

  // P1: Critério Fundamental de Inclusão
  if (!respostas.amamentandoProprioFilho) {
    return {
      status: 'INAPTA_DEFINITIVA',
      tipoLeite: infoLeite.tipo,
      idadeBebeDias: idadeDias,
      titulo: 'Critério de Inclusão Primário Não Atendido',
      mensagem: 'De acordo com a RDC nº 171/2006 da ANVISA e as diretrizes da Rede Global de Bancos de Leite Humano, apenas mães que estão em lactação ativa para seus próprios bebês podem atuar como doadoras.',
      detalhesClinicos: ['A doadora precisa estar em fase de amamentação ativa.'],
      orientacoesSanitarias: ['Agradecemos imensamente o seu nobre interesse em apoiar a Maternidade Santa Mônica.'],
      permiteAgendamento: false,
      necessitaAnaliseMedica: false
    };
  }

  // P2: Primazia Absoluta do Filho da Doadora
  if (!respostas.bebeMamaBemETemSobra) {
    return {
      status: 'INAPTA_TEMPORARIA',
      tipoLeite: infoLeite.tipo,
      idadeBebeDias: idadeDias,
      titulo: 'O Leite do Seu Bebê é Prioridade Absoluta',
      mensagem: 'Na Maternidade Santa Mônica e em toda a Rede de Bancos de Leite, a nutrição do seu próprio filho vem sempre em primeiro lugar. Cuide bem dele e assegure a sua livre demanda! Caso perceba futuramente que há produção excedente de leite, estaremos de braços abertos para acolhê-la.',
      detalhesClinicos: ['Prioridade biológica ao binômio mãe-filho sem esgotamento de reservas.'],
      orientacoesSanitarias: ['Mantenha a amamentação em livre demanda.', 'Beba bastante água e descanse.'],
      permiteAgendamento: false,
      necessitaAnaliseMedica: false
    };
  }

  // P5: Sorologias Impeditivas Absolutas (HIV, Sífilis, Hep B, Hep C, HTLV)
  if (respostas.sorologiaPositiva) {
    return {
      status: 'INAPTA_DEFINITIVA',
      tipoLeite: infoLeite.tipo,
      idadeBebeDias: idadeDias,
      titulo: 'Agradecemos o Seu Gesto de Carinho e Solidariedade',
      mensagem: 'Agradecemos imensamente a sua boa vontade e generosidade. Pelas normas sanitárias de biossegurança da ANVISA (RDC 171/2006) voltadas a bebês prematuros e imunologicamente vulneráveis da UTI Neonatal, o histórico sorológico informado não permite a doação de leite humano. Desejamos muita saúde para você e sua família!',
      detalhesClinicos: ['Sorologia reagente ou inconclusiva para patógenos de transmissão biológica.'],
      orientacoesSanitarias: ['Mantenha o acompanhamento médico habitual no seu posto de saúde ou maternidade.'],
      permiteAgendamento: false,
      necessitaAnaliseMedica: false
    };
  }

  // P6: Tabagismo pesado (> 10 cigarros)
  if (respostas.tabagismo === 'MAIS_10') {
    return {
      status: 'INAPTA_DEFINITIVA',
      tipoLeite: infoLeite.tipo,
      idadeBebeDias: idadeDias,
      titulo: 'Inaptidão por Fator de Tabagismo Elevado',
      mensagem: 'O consumo de mais de 10 cigarros ou uso contínuo de dispositivos eletrônicos (vape) satura os alvéolos mamários com nicotina e derivados tóxicos, inviabilizando o consumo seguro pelos prematuros da UTI Neonatal (RDC 171/2006).',
      detalhesClinicos: ['Tabagismo superior a 10 unidades/dia ou uso intenso de nicotina.'],
      orientacoesSanitarias: ['Priorize a sua saúde respiratória e proteja o ambiente doméstico do seu bebê.'],
      permiteAgendamento: false,
      necessitaAnaliseMedica: false
    };
  }

  // P7: Substâncias Ilícitas
  if (respostas.alcoolDrogas === 'SUBSTANCIAS_ILICITAS') {
    return {
      status: 'INAPTA_DEFINITIVA',
      tipoLeite: infoLeite.tipo,
      idadeBebeDias: idadeDias,
      titulo: 'Critério Sanitário de Biossegurança',
      mensagem: 'Pelas normas de farmacovigilância e toxicologia pediátrica, o histórico de substâncias psicoativas impede a doação para a Unidade Neonatal da Santa Mônica.',
      detalhesClinicos: ['Histórico impeditivo pela toxicologia neonatal.'],
      orientacoesSanitarias: ['A equipe da MESM/UNCISAL deseja bem-estar integral a você e ao seu filho.'],
      permiteAgendamento: false,
      necessitaAnaliseMedica: false
    };
  }

  // Inaptidões Temporárias
  let isInaptaTemporaria = false;
  const motivosInaptidaoTemporaria: string[] = [];

  if (respostas.sintomasInfecciososOuLesao) {
    isInaptaTemporaria = true;
    motivosInaptidaoTemporaria.push('Presença recente de sintomas infecciosos (febre, diarreia, gripe) ou feridas/bolhas na mama.');
    detalhes.push('Aguardar 7 dias após o desaparecimento completo dos sintomas e cicatrização de lesões.');
  }

  if (respostas.transfusao12Meses) {
    isInaptaTemporaria = true;
    motivosInaptidaoTemporaria.push('Transfusão sanguínea ou hemoderivados realizada nos últimos 12 meses (janela imunológica).');
    detalhes.push('Aguardar completar 12 meses decorridos da data da transfusão.');
  }

  if (respostas.tatuagem12Meses) {
    isInaptaTemporaria = true;
    motivosInaptidaoTemporaria.push('Tatuagem, piercing ou micropigmentação realizada nos últimos 12 meses.');
    detalhes.push('Aguardar o cumprimento da janela sorológica de 12 meses após a realização do procedimento.');
  }

  if (respostas.alcoolDrogas === 'ALCOOL_ESPORADICO') {
    // Álcool esporádico é restrição de 12-24h
    orientacoes.push('Atenção: Ao consumir bebida alcoólica esporadicamente, suspenda a ordenha para doação por pelo menos 12 a 24 horas.');
  }

  if (isInaptaTemporaria) {
    return {
      status: 'INAPTA_TEMPORARIA',
      tipoLeite: infoLeite.tipo,
      idadeBebeDias: idadeDias,
      titulo: 'Inaptidão Temporária - Janela de Aguardo',
      mensagem: 'Você é muito bem-vinda como doadora! No entanto, no momento identificamos uma condição temporária que exige um curto período de espera para garantir a segurança biológica dos bebês da UTI Neonatal.',
      detalhesClinicos: motivosInaptidaoTemporaria.concat(detalhes),
      orientacoesSanitarias: [
        'Continue amamentando o seu próprio bebê normalmente.',
        'Logo que a condição for superada (janela completada ou sintomas cessados), você poderá reagendar imediatamente a doação!'
      ],
      permiteAgendamento: false,
      necessitaAnaliseMedica: false
    };
  }

  // Análise Médica / Enfermagem (Medicamentos ou Tabagismo leve)
  const motivosAnalise: string[] = [];
  if (respostas.tomaMedicamentos) {
    motivosAnalise.push(`Uso de medicamento contínuo ou recente: ${respostas.descricaoMedicamentos || 'A relatar'}`);
  }
  if (respostas.tabagismo === 'ATE_10') {
    motivosAnalise.push('Fumante de até 10 cigarros/dia (necessita validação médica e intervalo de 2h entre fumar e ordenhar)');
  }

  if (motivosAnalise.length > 0) {
    return {
      status: 'EM_ANALISE',
      tipoLeite: infoLeite.tipo,
      idadeBebeDias: idadeDias,
      titulo: 'Cadastro Encaminhado para Análise Médica',
      mensagem: 'Recebemos as suas informações com muito carinho! Como você informou medicamentos ou condições específicas, nossa equipe médica/farmacêutica do Banco de Leite da Maternidade Santa Mônica fará uma rápida avaliação clínica do seu prontuário.',
      detalhesClinicos: motivosAnalise,
      orientacoesSanitarias: [
        'Não interrompa seus medicamentos prescritos pelo seu médico.',
        'Um profissional da Maternidade Santa Mônica revisará sua ficha e entrará em contato via WhatsApp institucional.',
        'Assim que validado, a rota da van será liberada para o seu endereço em Maceió.'
      ],
      permiteAgendamento: true,
      necessitaAnaliseMedica: true
    };
  }

  // Cartão de Pré-natal verificação
  if (!respostas.temCartaoPreNatal) {
    orientacoes.push('Caderneta de Pré-natal: Como você não possui o cartão físico em mãos no momento, nossa equipe agendará a realização rápida das sorologias em domicílio ou na Santa Mônica.');
  } else {
    orientacoes.push('Caderneta de Pré-natal: Mantenha o cartão disponível para verificação no momento da visita da van coletora.');
  }

  orientacoes.push(infoLeite.destinacaoUTIN);

  // Status: Pré-Cadastro Inicial Aprovado (Aguardando Validação Regulatória pela Enfermagem BLH conforme RDC 171/2006)
  return {
    status: 'EM_ANALISE',
    tipoLeite: infoLeite.tipo,
    idadeBebeDias: idadeDias,
    titulo: 'Pré-Cadastro Inicial Realizado com Sucesso!',
    mensagem: `Seu perfil atende aos critérios iniciais da Rede Brasileira de Bancos de Leite Humano (rBLH) e da ANVISA (RDC 171/2006)! 💛 O seu leite é classificado como ${infoLeite.rotulo.toUpperCase()}.\n\nConforme a regulação técnica sanitária, todo cadastro e exames devem ser conferidos e validados pela equipe de enfermagem do BLH da Maternidade Escola Santa Mônica (UNCISAL) antes da liberação definitiva da coleta domiciliar.`,
    detalhesClinicos: [
      `Idade do bebê: ${idadeDias} dia(s) de vida`,
      `Classificação Bromatológica: ${infoLeite.rotulo}`,
      'Status: Pré-Cadastro concluído - Aguardando validação regulatória pela Enfermagem BLH',
      infoLeite.descricao
    ],
    orientacoesSanitarias: orientacoes,
    permiteAgendamento: true,
    necessitaAnaliseMedica: false
  };
}
