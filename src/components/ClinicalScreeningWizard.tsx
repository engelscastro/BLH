import React, { useState } from 'react';
import { 
  Heart, 
  Baby, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  Info,
  Phone,
  FileCheck,
  Package
} from 'lucide-react';
import { RespostasTriagem, ResultadoTriagem, Doadora, AgendamentoColeta, MotivoColeta, TurnoColeta } from '../types/blh';
import { avaliarTriagemClinica, classificarTipoLeite, calcularIdadeBebeDias, parseDataNascimentoBebe } from '../utils/screeningLogic';
import { BAIRROS_MACEIO, getRegiaoPorBairro } from '../utils/maceioNeighborhoods';
import { api } from '../services/api';
import { ProtocolCard } from './ProtocolCard';

interface ScreeningWizardProps {
  onSuccess?: (doadora: Doadora, agendamento: AgendamentoColeta) => void;
  onOpenGuidelines?: () => void;
}

export const ClinicalScreeningWizard: React.FC<ScreeningWizardProps> = ({ onSuccess, onOpenGuidelines }) => {
  // Passos do Wizard:
  // 1: Boas-vindas & Pré-requisitos (P1, P2)
  // 2: Idade do bebê & Bromatologia (P3)
  // 3: Sorologias & Cartão Pré-natal (P4, P5)
  // 4: Hábitos de vida & Exclusões (P6, P7, P8, P9)
  // 5: Condições clínicas & Medicamentos (P10, P11)
  // 6: Resultado da Triagem (Apta / Em Análise / Inapta)
  // 7: Cadastro de Doadora & Logística de Coleta em Maceió
  // 8: Conclusão & Cartão Protocolo BLH-XXXX
  const [etapa, setEtapa] = useState<number>(1);

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

  // Resultado avaliado
  const [resultado, setResultado] = useState<ResultadoTriagem | null>(null);

  // Dados Cadastrais & Endereço
  const [nomeMae, setNomeMae] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [nomeBebe, setNomeBebe] = useState('');
  const [bairro, setBairro] = useState('Trapiche da Barra');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [cep, setCep] = useState('');
  const [pontoReferencia, setPontoReferencia] = useState('');
  
  // Agendamento da van
  const [motivoColeta, setMotivoColeta] = useState<MotivoColeta>('AMBOS');
  const [quantidadeFrascos, setQuantidadeFrascos] = useState<number>(2);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [dataAgendada, setDataAgendada] = useState<string>(tomorrowStr);
  const [turno, setTurno] = useState<TurnoColeta>('MANHA');

  // Estado final
  const [doadoraCriada, setDoadoraCriada] = useState<Doadora | null>(null);
  const [agendamentoCriado, setAgendamentoCriado] = useState<AgendamentoColeta | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Executa avaliação clínica
  const processarAvaliacao = () => {
    const res = avaliarTriagemClinica(respostas);
    setResultado(res);
    setEtapa(6);
  };

  // Envio final do cadastro
  const finalizarCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeMae || !telefone || !logradouro || !bairro) {
      alert('Por favor, preencha os campos obrigatórios marcados com *');
      return;
    }

    setIsSubmitting(true);
    try {
      const regiao = getRegiaoPorBairro(bairro);
      const currentYear = new Date().getFullYear();
      const randSeq = Math.floor(1000 + Math.random() * 9000);
      const protocoloGerado = `BLH-${currentYear}-${randSeq}`;

      // Salva doadora
      const novaDoadora = await api.createDonor({
        protocolo: protocoloGerado,
        nomeCompleto: nomeMae,
        cpf: cpf || 'Não informado',
        telefone: telefone,
        email: email || '',
        dataNascimento: '1995-01-01',
        nomeBebe: nomeBebe || 'Bebê',
        dataNascimentoBebe: respostas.dataNascimentoBebe,
        idadeBebeDias: resultado?.idadeBebeDias || 10,
        tipoLeite: resultado?.tipoLeite || 'MADURO',
        status: resultado?.status || 'APTA',
        motivoStatus: resultado?.mensagem || 'Triagem clínica concluída',
        respostas: respostas,
        endereco: {
          cep: cep || '57000-000',
          logradouro: logradouro,
          numero: numero || 'S/N',
          complemento: complemento || '',
          bairro: bairro,
          pontoReferencia: pontoReferencia || '',
          cidade: 'Maceió',
          regiaoLogistica: regiao
        }
      });

      // Cria agendamento se for Apta ou Em Análise
      let novoApt: AgendamentoColeta | null = null;
      if (resultado?.permiteAgendamento) {
        novoApt = await api.createAppointment({
          protocolo: novaDoadora.protocolo,
          doadoraId: novaDoadora.id,
          nomeDoadora: novaDoadora.nomeCompleto,
          telefone: novaDoadora.telefone,
          bairro: bairro,
          regiaoLogistica: regiao,
          enderecoCompleto: `${logradouro}, ${numero || 'S/N'}${complemento ? ` (${complemento})` : ''}, ${bairro}`,
          pontoReferencia: pontoReferencia,
          motivo: motivoColeta,
          quantidadeFrascosEstimada: quantidadeFrascos,
          dataAgendada: dataAgendada,
          turno: turno,
          status: 'PENDENTE'
        });
      }

      setDoadoraCriada(novaDoadora);
      setAgendamentoCriado(novoApt);
      setEtapa(8);

      if (onSuccess && novoApt) {
        onSuccess(novaDoadora, novoApt);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao processar agendamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Informações bromatológicas do bebê em tempo real
  const diasCalculados = respostas.dataNascimentoBebe ? calcularIdadeBebeDias(respostas.dataNascimentoBebe) : null;
  const leiteCalculado = diasCalculados !== null ? classificarTipoLeite(diasCalculados) : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Barra de Progresso Superior */}
      {etapa <= 7 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Triagem Clínica rBLH (Etapa {Math.min(etapa, 5)} de 5)</span>
            <span className="text-sky-700 font-bold">
              {etapa === 1 && '1. Pré-requisitos Básicos'}
              {etapa === 2 && '2. Idade do Bebê & Bromatologia'}
              {etapa === 3 && '3. Exames & Pré-natal'}
              {etapa === 4 && '4. Hábitos & Biossegurança'}
              {etapa === 5 && '5. Saúde Atual & Remédios'}
              {etapa === 6 && '6. Avaliação Concluída'}
              {etapa === 7 && '7. Agendamento em Maceió'}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-linear-to-r from-rose-500 to-sky-600 h-full transition-all duration-300"
              style={{ width: `${(Math.min(etapa, 7) / 7) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ETAPA 1: Pré-requisitos Fundamentais (P1, P2) */}
      {/* ------------------------------------------------------------- */}
      {etapa === 1 && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Heart className="w-8 h-8 fill-rose-500 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              Seja Muito Bem-Vinda ao Banco de Leite da Santa Mônica!
            </h2>
            <p className="text-sm text-slate-600">
              A Maternidade Escola Santa Mônica (UNCISAL) cuida de prematuros que lutam pela vida na UTIN. Vamos iniciar uma rápida triagem confidencial conforme as normas da <strong>Rede Global rBLH / Fiocruz</strong>.
            </p>
          </div>

          <div className="space-y-5 pt-4">
            {/* P1: Amamentação ativa */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <label className="block text-base font-bold text-slate-900 mb-2">
                1. Você está amamentando ou retirando leite para o seu próprio bebê? <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-4">
                Pela RDC 171/2006 da ANVISA, apenas mães em lactação ativa para o próprio filho podem ser doadoras.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, amamentandoProprioFilho: true })}
                  className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    respostas.amamentandoProprioFilho
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Sim, estou amamentando
                </button>
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, amamentandoProprioFilho: false })}
                  className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    !respostas.amamentandoProprioFilho
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Não estou amamentando
                </button>
              </div>
            </div>

            {/* P2: Primazia do próprio filho */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <label className="block text-base font-bold text-slate-900 mb-2">
                2. O seu bebê está mamando bem e você percebe que tem leite excedente (sobrando)? <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-4">
                A prioridade absoluta do Banco de Leite é a nutrição e o ganho de peso do seu próprio bebê.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, bebeMamaBemETemSobra: true })}
                  className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    respostas.bebeMamaBemETemSobra
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Sim, tenho leite sobrando
                </button>
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, bebeMamaBemETemSobra: false })}
                  className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    !respostas.bebeMamaBemETemSobra
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Não percebo sobra
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                if (!respostas.amamentandoProprioFilho || !respostas.bebeMamaBemETemSobra) {
                  processarAvaliacao();
                } else {
                  setEtapa(2);
                }
              }}
              className="px-6 py-3 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <span>Avançar para Estágio 2</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ETAPA 2: Idade do Bebê & Classificação Bromatológica (P3) */}
      {/* ------------------------------------------------------------- */}
      {etapa === 2 && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full mb-2">
              <Baby className="w-4 h-4" />
              Estágio 2: Classificação Bromatológica rBLH
            </div>
            <h2 className="text-2xl font-black text-slate-900">Qual a data de nascimento do seu bebê?</h2>
            <p className="text-sm text-slate-600 mt-1">
              O leite materno muda de composição conforme a idade do bebê. Essa informação é vital para os médicos da UTIN direcionarem o leite certo para cada prematuro.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Data do Parto / Nascimento do Bebê: <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={new Date(Date.now() - 730 * 86400000).toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                value={respostas.dataNascimentoBebe}
                onChange={(e) => setRespostas({ ...respostas, dataNascimentoBebe: e.target.value })}
                className="w-full sm:w-80 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-semibold text-slate-800 text-sm"
              />
            </div>

            {/* Prévia Bromatológica Dinâmica */}
            {leiteCalculado && (
              <div className="p-4 rounded-xl border bg-sky-50 border-sky-200 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span className="font-bold text-sm text-sky-950">
                    Idade: {diasCalculados} dia(s) • {leiteCalculado.rotulo}
                  </span>
                </div>
                <p className="text-xs text-sky-900 leading-relaxed">
                  {leiteCalculado.descricao}
                </p>
                <div className="text-xs font-bold text-sky-800 bg-white/70 p-2 rounded-lg border border-sky-100">
                  🎯 {leiteCalculado.destinacaoUTIN}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setEtapa(1)}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-sm flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <button
              onClick={() => {
                if (!respostas.dataNascimentoBebe) {
                  alert('Por favor, informe a data de nascimento do seu bebê.');
                  return;
                }
                const parsed = parseDataNascimentoBebe(respostas.dataNascimentoBebe);
                if (!parsed.valida) {
                  alert(parsed.erro || 'Data inválida.');
                  return;
                }
                setRespostas({ ...respostas, dataNascimentoBebe: parsed.dataISO || respostas.dataNascimentoBebe });
                setEtapa(3);
              }}
              className="px-6 py-3 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <span>Avançar para Estágio 3</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ETAPA 3: Exames & Cartão de Pré-natal (P4, P5) */}
      {/* ------------------------------------------------------------- */}
      {etapa === 3 && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full mb-2">
              <FileCheck className="w-4 h-4" />
              Estágio 3: Cartão de Pré-Natal & Rastreamento Sorológico
            </div>
            <h2 className="text-2xl font-black text-slate-900">Exames e Sorologias do Pré-Natal</h2>
            <p className="text-sm text-slate-600 mt-1">
              Os bebês prematuros da Santa Mônica possuem sistema imunológico imaturo. A RDC 171/2006 exige a verificação dos exames do pré-natal.
            </p>
          </div>

          <div className="space-y-5">
            {/* P4: Cartão de Pré-Natal */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <label className="block text-base font-bold text-slate-900 mb-1">
                4. Você possui a Caderneta da Gestante / Cartão de Pré-Natal com os exames anotados? <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Se não tiver o papel em mãos agora, fique tranquila! Nossa equipe pode agendar exames para você.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, temCartaoPreNatal: true })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                    respostas.temCartaoPreNatal
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Sim, possuo a Caderneta
                </button>
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, temCartaoPreNatal: false })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                    !respostas.temCartaoPreNatal
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Não possuo no momento
                </button>
              </div>
              {!respostas.temCartaoPreNatal && (
                <div className="mt-3 text-xs bg-amber-50 text-amber-900 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Não se preocupe:</strong> A equipe da Maternidade Santa Mônica agendará a realização rápida das suas sorologias em domicílio ou no hospital antes da liberação do leite para a UTI.
                  </span>
                </div>
              )}
            </div>

            {/* P5: Rastreamento Sorológico Obrigatório */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <label className="block text-base font-bold text-slate-900 mb-1">
                5. Algum dos seus exames de pré-natal deu positivo para HIV, Sífilis (VDRL), Hepatite B, Hepatite C ou HTLV? <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Regra impeditiva absoluta de biossegurança (RDC 171/2006 ANVISA).
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, sorologiaPositiva: false })}
                  className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    !respostas.sorologiaPositiva
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Não, todos negativos / não reagentes
                </button>
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, sorologiaPositiva: true })}
                  className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    respostas.sorologiaPositiva
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Sim, tive resultado positivo
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setEtapa(2)}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-sm flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <button
              onClick={() => {
                if (respostas.sorologiaPositiva) {
                  processarAvaliacao();
                } else {
                  setEtapa(4);
                }
              }}
              className="px-6 py-3 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <span>Avançar para Estágio 4</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ETAPA 4: Hábitos de Vida & Exclusões (P6, P7, P8, P9) */}
      {/* ------------------------------------------------------------- */}
      {etapa === 4 && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full mb-2">
              <ShieldAlert className="w-4 h-4" />
              Estágio 4: Hábitos de Vida & Critérios de Exclusão
            </div>
            <h2 className="text-2xl font-black text-slate-900">Hábitos e Janelas de Segurança</h2>
            <p className="text-sm text-slate-600 mt-1">
              Verificamos fatores que passam para o leite ou procedimentos invasivos recentes.
            </p>
          </div>

          <div className="space-y-5">
            {/* P6: Tabagismo e Vape */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <label className="block text-base font-bold text-slate-900 mb-1">
                6. Você fuma cigarro comum ou utiliza cigarro eletrônico (vape)? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, tabagismo: 'NAO' })}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    respostas.tabagismo === 'NAO'
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  🟢 Não fumo
                </button>
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, tabagismo: 'ATE_10' })}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    respostas.tabagismo === 'ATE_10'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  🟡 Fumo até 10 cigarros/dia (Avaliação médica)
                </button>
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, tabagismo: 'MAIS_10' })}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    respostas.tabagismo === 'MAIS_10'
                      ? 'bg-rose-700 text-white border-rose-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  🔴 Mais de 10 cigarros/dia
                </button>
              </div>
            </div>

            {/* P7: Álcool e Drogas */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <label className="block text-base font-bold text-slate-900 mb-1">
                7. Você consome bebidas alcoólicas ou fez uso de substâncias psicoativas ilícitas? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, alcoolDrogas: 'NUNCA' })}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    respostas.alcoolDrogas === 'NUNCA'
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  🟢 Não consumo bebidas nem substâncias
                </button>
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, alcoolDrogas: 'ALCOOL_ESPORADICO' })}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    respostas.alcoolDrogas === 'ALCOOL_ESPORADICO'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  🟡 Consumo de álcool esporádico (Pausa 24h)
                </button>
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, alcoolDrogas: 'SUBSTANCIAS_ILICITAS' })}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    respostas.alcoolDrogas === 'SUBSTANCIAS_ILICITAS'
                      ? 'bg-rose-700 text-white border-rose-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  🔴 Uso de substâncias ilícitas
                </button>
              </div>
            </div>

            {/* P8: Transfusão 12 meses */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <label className="block text-base font-bold text-slate-900 mb-1">
                8. Você recebeu transfusão de sangue ou hemoderivados nos últimos 12 meses? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, transfusao12Meses: false })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                    !respostas.transfusao12Meses
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Não recebi
                </button>
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, transfusao12Meses: true })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                    respostas.transfusao12Meses
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Sim, recebi nos últimos 12 meses
                </button>
              </div>
            </div>

            {/* P9: Tatuagem / Piercing 12 meses */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <label className="block text-base font-bold text-slate-900 mb-1">
                9. Você fez tatuagem, piercing ou micropigmentação nos últimos 12 meses? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, tatuagem12Meses: false })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                    !respostas.tatuagem12Meses
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Não fiz procedimentos
                </button>
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, tatuagem12Meses: true })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                    respostas.tatuagem12Meses
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Sim, fiz nos últimos 12 meses
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setEtapa(3)}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-sm flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <button
              onClick={() => {
                if (respostas.tabagismo === 'MAIS_10' || respostas.alcoolDrogas === 'SUBSTANCIAS_ILICITAS') {
                  processarAvaliacao();
                } else {
                  setEtapa(5);
                }
              }}
              className="px-6 py-3 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <span>Avançar para Estágio 5</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ETAPA 5: Condições Clínicas & Medicamentos (P10, P11) */}
      {/* ------------------------------------------------------------- */}
      {etapa === 5 && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full mb-2">
              <Heart className="w-4 h-4" />
              Estágio 5: Medicamentos & Condições de Saúde Atuais
            </div>
            <h2 className="text-2xl font-black text-slate-900">Uso de Remédios e Sintomas Recentes</h2>
            <p className="text-sm text-slate-600 mt-1">
              Última checagem clínica antes de emitir a avaliação rBLH da Maternidade Santa Mônica.
            </p>
          </div>

          <div className="space-y-5">
            {/* P10: Medicamentos contínuos ou recentes */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <label className="block text-base font-bold text-slate-900 mb-1">
                10. Você está tomando algum remédio contínuo ou tomou recentemente (antibióticos, antidepressivos, calmantes, anti-inflamatórios)? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, tomaMedicamentos: false, descricaoMedicamentos: '' })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                    !respostas.tomaMedicamentos
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Não tomo medicamentos
                </button>
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, tomaMedicamentos: true })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                    respostas.tomaMedicamentos
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Sim, tomo remédios
                </button>
              </div>

              {respostas.tomaMedicamentos && (
                <div className="mt-4 animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quais medicamentos você está utilizando? (Nome e dosagem, se souber):
                  </label>
                  <textarea
                    rows={2}
                    value={respostas.descricaoMedicamentos || ''}
                    onChange={(e) => setRespostas({ ...respostas, descricaoMedicamentos: e.target.value })}
                    placeholder="Ex: Sertralina 50mg, Paracetamol para dor de cabeça, etc."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-amber-800 block mt-1">
                    ℹ️ Seu cadastro passará por validação amigável do médico ou farmacêutico do Banco de Leite da MESM.
                  </span>
                </div>
              )}
            </div>

            {/* P11: Sintomas infecciosos / lesões mamárias */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <label className="block text-base font-bold text-slate-900 mb-1">
                11. Você apresentou febre, diarreia, sintomas gripais ou feridas/bolhas na mama nos últimos dias? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, sintomasInfecciososOuLesao: false, descricaoSintomas: '' })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                    !respostas.sintomasInfecciososOuLesao
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Não tive sintomas
                </button>
                <button
                  type="button"
                  onClick={() => setRespostas({ ...respostas, sintomasInfecciososOuLesao: true })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                    respostas.sintomasInfecciososOuLesao
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Sim, tive sintomas / lesão
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setEtapa(4)}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-sm flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <button
              onClick={processarAvaliacao}
              className="px-7 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-200 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Concluir Triagem Clínica rBLH</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ETAPA 6: Resultado da Triagem Clínica rBLH */}
      {/* ------------------------------------------------------------- */}
      {etapa === 6 && resultado && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header do Parecer */}
          <div className={`p-6 sm:p-8 text-white ${
            resultado.status === 'APTA' 
              ? 'bg-linear-to-r from-emerald-600 to-teal-700'
              : resultado.status === 'EM_ANALISE'
              ? 'bg-linear-to-r from-amber-600 to-orange-700'
              : resultado.status === 'INAPTA_TEMPORARIA'
              ? 'bg-linear-to-r from-orange-600 to-amber-700'
              : 'bg-linear-to-r from-rose-700 to-red-800'
          }`}>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Parecer Oficial rBLH / MESM UNCISAL
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">{resultado.titulo}</h2>
            <p className="mt-2 text-white/90 text-sm leading-relaxed">{resultado.mensagem}</p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Detalhes Clínicos */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Critérios Clínicos Identificados:
              </h4>
              <ul className="space-y-2">
                {resultado.detalhesClinicos.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-sky-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Orientações Sanitárias */}
            {resultado.orientacoesSanitarias.length > 0 && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900 mb-2">
                  Orientações da Maternidade Santa Mônica:
                </h4>
                <ul className="space-y-1.5 text-xs text-sky-800">
                  {resultado.orientacoesSanitarias.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-sky-600 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ações */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setEtapa(1)}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-sm flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Refazer Triagem
              </button>

              {resultado.permiteAgendamento ? (
                <button
                  onClick={() => setEtapa(7)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all"
                >
                  <span>Preencher Endereço & Agendar Coleta</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  {onOpenGuidelines && (
                    <button
                      onClick={onOpenGuidelines}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
                    >
                      Ler Normas Fiocruz
                    </button>
                  )}
                  <a
                    href="https://wa.me/558233154400"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Falar com BLH Santa Mônica
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ETAPA 7: Dados da Doadora & Endereço em Maceió / Agendamento */}
      {/* ------------------------------------------------------------- */}
      {etapa === 7 && (
        <form onSubmit={finalizarCadastro} className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-2">
              <CheckCircle2 className="w-4 h-4" />
              Etapa Final: Agendamento da Van em Maceió
            </div>
            <h2 className="text-2xl font-black text-slate-900">Onde a van do Banco de Leite deve ir?</h2>
            <p className="text-sm text-slate-600 mt-1">
              Nossa equipe visita seu endereço em Maceió para entregar os frascos esterilizados e recolher o leite congelado com custo <strong>R$ 0,00</strong> para você.
            </p>
          </div>

          {/* Dados Pessoais */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              1. Identificação da Doadora
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seu Nome Completo: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Silva de Holanda"
                  value={nomeMae}
                  onChange={(e) => setNomeMae(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp com DDD: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(82) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CPF (Para prontuário hospitalar SUS):
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do seu Bebê:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Laura"
                  value={nomeBebe}
                  onChange={(e) => setNomeBebe(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Endereço em Maceió */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              2. Endereço de Coleta em Maceió
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bairro em Maceió: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                >
                  {BAIRROS_MACEIO.map((b) => (
                    <option key={b.nome} value={b.nome}>
                      {b.nome} ({b.descricaoRegiao})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Logradouro (Rua, Avenida, Travessa): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rua Engenheiro Mário de Gusmão"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número / Casa / Lote: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 450"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Complemento (Apartamento, Bloco):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Apt 701, Ed. Mar do Caribe"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ponto de Referência (Crucial para o motorista da van da Santa Mônica):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Próximo à Praça Lions, em frente à padaria..."
                  value={pontoReferencia}
                  onChange={(e) => setPontoReferencia(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Detalhes da Coleta */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              3. O Que Você Precisa na Visita?
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMotivoColeta('AMBOS')}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                  motivoColeta === 'AMBOS'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                📦 <strong>Ambos (Recomendado):</strong>
                <span className="block font-normal mt-1 opacity-90">Entregar leite congelado e receber novos frascos esterilizados</span>
              </button>

              <button
                type="button"
                onClick={() => setMotivoColeta('BUSCAR_LEITE')}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                  motivoColeta === 'BUSCAR_LEITE'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ❄️ <strong>Buscar Leite Congelado:</strong>
                <span className="block font-normal mt-1 opacity-90">Já tenho frascos cheios e congelados prontos</span>
              </button>

              <button
                type="button"
                onClick={() => setMotivoColeta('RECEBER_FRASCOS')}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                  motivoColeta === 'RECEBER_FRASCOS'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🫙 <strong>Receber Frascos Vazios:</strong>
                <span className="block font-normal mt-1 opacity-90">Ainda vou começar a ordenhar e preciso de vidros limpos</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantidade Estimada de Frascos:
                </label>
                <select
                  value={quantidadeFrascos}
                  onChange={(e) => setQuantidadeFrascos(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                >
                  <option value={1}>1 frasco de vidro</option>
                  <option value={2}>2 frascos de vidro</option>
                  <option value={3}>3 frascos de vidro</option>
                  <option value={4}>4 frascos de vidro</option>
                  <option value={5}>5 ou mais frascos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data Preferencial:
                </label>
                <input
                  type="date"
                  min={tomorrowStr}
                  value={dataAgendada}
                  onChange={(e) => setDataAgendada(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Turno Preferencial:
                </label>
                <select
                  value={turno}
                  onChange={(e) => setTurno(e.target.value as TurnoColeta)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                >
                  <option value="MANHA">Manhã (08:00 às 12:00)</option>
                  <option value="TARDE">Tarde (13:30 às 17:00)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botão de Envio */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setEtapa(6)}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-sm flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-200 transition-all"
            >
              <Package className="w-4 h-4" />
              <span>{isSubmitting ? 'Gerando Protocolo...' : 'Confirmar e Gerar Protocolo BLH'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ETAPA 8: Conclusão & Cartão Protocolo BLH-XXXX */}
      {/* ------------------------------------------------------------- */}
      {etapa === 8 && doadoraCriada && (
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto space-y-2">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              Protocolo Gerado com Sucesso!
            </h2>
            <p className="text-xs text-slate-600">
              Guarde seu código de segurança institucional da Santa Mônica. A van de coleta já foi programada para a rota do seu bairro.
            </p>
          </div>

          <ProtocolCard 
            doadora={doadoraCriada} 
            agendamento={agendamentoCriado}
            onOpenGuidelines={onOpenGuidelines}
          />

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setEtapa(1);
                setResultado(null);
                setDoadoraCriada(null);
                setAgendamentoCriado(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
            >
              Iniciar novo cadastro ou simulação de doadora
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
