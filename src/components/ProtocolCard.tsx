import React from 'react';
import { ShieldCheck, Calendar, MapPin, Phone, Clock, Download, Baby, CheckCircle, ExternalLink, Lock } from 'lucide-react';
import { Doadora, AgendamentoColeta } from '../types/blh';
import { maskName, maskCpf, maskPhone, getSafeStatusDescription } from '../utils/masking';

interface ProtocolCardProps {
  doadora: Doadora;
  agendamento?: AgendamentoColeta | null;
  onOpenGuidelines?: () => void;
}

export const ProtocolCard: React.FC<ProtocolCardProps> = ({ doadora, agendamento, onOpenGuidelines }) => {
  const getStatusBadge = () => {
    switch (doadora.status) {
      case 'APTA':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            🟢 DOADORA APTA (Liberada para Coleta)
          </span>
        );
      case 'EM_ANALISE':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            🟡 EM ANÁLISE MÉDICA / ENFERMAGEM
          </span>
        );
      case 'INAPTA_TEMPORARIA':
        return (
          <span className="bg-orange-100 text-orange-900 border border-orange-300 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            🟠 INAPTA TEMPORÁRIA (Aguardando Janela Sanitária)
          </span>
        );
      default:
        return (
          <span className="bg-rose-100 text-rose-900 border border-rose-300 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            🔴 NÃO APTA PARA DOAÇÃO
          </span>
        );
    }
  };

  const getMilkBadge = () => {
    switch (doadora.tipoLeite) {
      case 'COLOSTRO':
        return {
          title: 'Leite Colostro (Até 7 dias)',
          color: 'bg-amber-50 text-amber-900 border-amber-200',
          desc: 'Rico em imunoglobulinas e anticorpos protetores para os prematuros extremos da UTIN.'
        };
      case 'TRANSICAO':
        return {
          title: 'Leite de Transição (8 a 14 dias)',
          color: 'bg-orange-50 text-orange-900 border-orange-200',
          desc: 'Equilíbrio vital imunológico e calórico.'
        };
      default:
        return {
          title: 'Leite Maduro (15 dias ou mais)',
          color: 'bg-blue-50 text-blue-900 border-blue-200',
          desc: 'Maior densidade calórica e lipídica para ganho de peso na UTIN.'
        };
    }
  };

  const milkInfo = getMilkBadge();

  // Bairro seguro para exibição
  const bairroSeguro = agendamento?.bairro || doadora.endereco?.bairro || (doadora as any).bairro || 'Maceió';

  // Gerador de Link para Google Agenda (sem expor endereço residencial nem telefone)
  const gerarLinkGoogleAgenda = () => {
    if (!agendamento) return '#';
    const dataParts = agendamento.dataAgendada.split('-');
    const dataStr = dataParts.join('');
    const startTime = agendamento.turno === 'MANHA' ? `${dataStr}T083000` : `${dataStr}T140000`;
    const endTime = agendamento.turno === 'MANHA' ? `${dataStr}T113000` : `${dataStr}T170000`;
    
    const title = encodeURIComponent(`Coleta Banco de Leite MESM - ${agendamento.protocolo}`);
    const details = encodeURIComponent(
      `Visita da van coletora do Banco de Leite da Maternidade Santa Mônica (UNCISAL).\nProtocolo: ${agendamento.protocolo}\nTurno: ${agendamento.turno === 'MANHA' ? 'Manhã (08h às 12h)' : 'Tarde (13h30 às 17h)'}\nBairro: ${bairroSeguro} (Maceió - AL)\n\n*Lembrete Fiocruz:* Mantenha o leite materno congelado no freezer a -10°C.`
    );
    const location = encodeURIComponent(`Bairro ${bairroSeguro}, Maceió - AL`);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
  };

  // Gerador de arquivo .ics seguro
  const downloadICS = () => {
    if (!agendamento) return;
    const dataParts = agendamento.dataAgendada.split('-');
    const dataCompact = dataParts.join('');
    const startTime = agendamento.turno === 'MANHA' ? `${dataCompact}T083000Z` : `${dataCompact}T140000Z`;
    const endTime = agendamento.turno === 'MANHA' ? `${dataCompact}T113000Z` : `${dataCompact}T170000Z`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UNCISAL MESM//Banco de Leite Humano//PT',
      'BEGIN:VEVENT',
      `UID:${agendamento.id}@bancodeleite.uncisal.edu.br`,
      `DTSTAMP:${dataCompact}T000000Z`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:Visita Banco de Leite MESM - Protocolo ${agendamento.protocolo}`,
      `DESCRIPTION:Coleta domiciliar da van da Maternidade Escola Santa Mônica (UNCISAL). Mantenha o leite congelado no freezer a -10°C.`,
      `LOCATION:Bairro ${bairroSeguro}, Maceio - AL`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `agendamento-${agendamento.protocolo}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp de suporte do hospital institucional
  const linkWhatsAppSuporte = () => {
    const nomeDoadora = maskName(doadora.nomeCompleto);
    const msg = encodeURIComponent(
      `Olá! Sou a doadora cadastrada sob o protocolo ${doadora.protocolo} (${nomeDoadora}) no Banco de Leite da Maternidade Santa Mônica. Gostaria de tirar uma dúvida sobre a minha coleta domiciliar.`
    );
    return `https://wa.me/558233154400?text=${msg}`;
  };

  const nomeExibicao = maskName(doadora.nomeCompleto);
  const cpfExibicao = maskCpf(doadora.cpf);
  const telExibicao = maskPhone(doadora.telefone || (doadora as any).telefoneMascarado);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-2xl mx-auto">
      {/* Top Protocol Header */}
      <div className="bg-linear-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white p-6 relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-emerald-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Cartão Digital de Acompanhamento • MESM / UNCISAL</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 mt-1 font-mono">
              <span>{doadora.protocolo}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-200 block">Data de Cadastro:</span>
            <span className="text-sm font-semibold">
              {new Date(doadora.dataCadastro).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Status Pill */}
        <div className="mt-4">{getStatusBadge()}</div>

        {/* Selo LGPD */}
        <div className="mt-3 pt-2 border-t border-emerald-800/60 flex items-center justify-between text-[11px] text-emerald-200">
          <span className="flex items-center gap-1 font-medium">
            <Lock className="w-3 h-3 text-emerald-300" />
            Consulta Pública com Sigilo Sanitário & LGPD (Lei nº 13.709/2018 - Art. 11)
          </span>
          <span className="text-emerald-300/80 hidden sm:inline">RDC ANVISA nº 171/2006</span>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-6 space-y-6">
        {/* Doadora & Bebê */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Doadora Cadastrada
            </span>
            <span className="text-base font-bold text-slate-900 block">{nomeExibicao}</span>
            <div className="text-xs text-slate-600 space-y-0.5">
              <div>CPF: <span className="font-mono font-bold text-slate-800">{cpfExibicao}</span></div>
              <div>WhatsApp: <span className="font-mono font-bold text-slate-800">{telExibicao}</span></div>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Bebê Lactente
            </span>
            <span className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Baby className="w-4 h-4 text-rose-500" />
              {doadora.nomeBebe ? doadora.nomeBebe.split(' ')[0] : 'Seu bebê'}
            </span>
            <span className="text-xs text-slate-500 block">
              Idade: {doadora.idadeBebeDias} dia(s) de vida
            </span>
          </div>
        </div>

        {/* Descrição Sanitária Segura */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <strong className="text-slate-900 block mb-0.5">Situação da Triagem Clínica:</strong>
          {getSafeStatusDescription(doadora.status, doadora.motivoStatus)}
        </div>

        {/* Bromatologia do Leite */}
        <div className={`p-4 rounded-xl border ${milkInfo.color}`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Classificação Bromatológica: {milkInfo.title}</span>
          </div>
          <p className="text-xs mt-1 opacity-90">{milkInfo.desc}</p>
        </div>

        {/* Agendamento da Rota */}
        {agendamento ? (
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-700" />
                Agendamento da Coleta Domiciliar (Van da Santa Mônica)
              </h4>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                {agendamento.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Data:</strong> {new Date(agendamento.dataAgendada + 'T00:00:00').toLocaleDateString('pt-BR')} ({agendamento.turno === 'MANHA' ? 'Turno da Manhã: 08h às 12h' : 'Turno da Tarde: 13h30 às 17h'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Região:</strong> Bairro {bairroSeguro} (Maceió)
                </span>
              </div>
            </div>

            {/* Endereço com Proteção de Privacidade LGPD */}
            <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <MapPin className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                <span>Ponto de Atendimento: Bairro {bairroSeguro}, Maceió - AL</span>
              </div>
              <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-0.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Proteção de Privacidade:</strong> O logradouro residencial, número do imóvel e referências exatas são de visualização restrita à equipe móvel da van oficial do hospital via terminal autenticado.
                </span>
              </div>
            </div>

            {/* Ações de Calendário */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                href={gerarLinkGoogleAgenda()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 text-white text-xs font-semibold hover:bg-sky-800 transition-colors shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                Adicionar ao Google Agenda
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>

              <button
                onClick={downloadICS}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar (.ics)
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-xs text-amber-900">
            <strong>Status de Agendamento:</strong> Seu cadastro está sendo processado pela equipe de triagem da Santa Mônica. Aguarde a confirmação de rota no seu WhatsApp institucional cadastrado.
          </div>
        )}

        {/* Parecer Clínico Sanitário Homologado (sem expor prontuário nem diagnósticos íntimos) */}
        {doadora.parecerMedico && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-950">
            <div className="font-bold flex items-center gap-1.5 text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              Parecer Clínico Oficial Homologado • BLH / MESM:
            </div>
            <p className="mt-1">
              Avaliação sanitária e regulatória concluída com sucesso pelo corpo clínico da Maternidade Escola Santa Mônica (UNCISAL) conforme a RDC ANVISA nº 171/2006.
            </p>
            <span className="block mt-2 text-blue-800/80 font-medium">
              Homologação Médica: {doadora.parecerMedico.aprovadoPor?.split('(')[0]?.trim() || 'Médica Neonatologista BLH'} • {new Date(doadora.parecerMedico.dataParecer).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}

        {/* Botões Inferiores */}
        <div className="flex flex-wrap gap-2 pt-2">
          {onOpenGuidelines && (
            <button
              onClick={onOpenGuidelines}
              className="flex-1 min-w-[200px] py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              📖 Ver Instruções Sanitárias Fiocruz
            </button>
          )}

          <a
            href={linkWhatsAppSuporte()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[200px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Phone className="w-3.5 h-3.5" />
            WhatsApp BLH Santa Mônica
          </a>
        </div>
      </div>
    </div>
  );
};
