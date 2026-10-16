import React from 'react';
import { ShieldCheck, Flame, Droplets, Snowflake, Sparkles, Clock, AlertTriangle, CheckCircle2, X, Heart } from 'lucide-react';

interface FiocruzGuidelinesProps {
  onClose?: () => void;
}

export const FiocruzGuidelinesModal: React.FC<FiocruzGuidelinesProps> = ({ onClose }) => {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden w-full max-w-4xl mx-auto flex flex-col max-h-[92dvh] sm:max-h-[88vh]">
      {/* Header Fixo */}
      <div className="bg-linear-to-r from-emerald-950 via-emerald-900 to-emerald-950 p-4 sm:p-6 text-white flex items-start justify-between gap-3 shrink-0">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-800/60 text-emerald-200 text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full mb-1.5 border border-emerald-700">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Fiocruz / rBLH • RDC 171 ANVISA</span>
          </div>
          <h2 className="text-base sm:text-xl md:text-2xl font-black leading-tight">
            Guia Sanitário de Coleta e Esterilização
          </h2>
          <p className="text-emerald-200 text-xs sm:text-sm mt-0.5 leading-snug">
            Maternidade Escola Santa Mônica (UNCISAL) • Proteção para a UTI Neonatal
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar guia"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Conteúdo com rolagem suave */}
      <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
        {/* Banner de Impacto */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 sm:p-4 flex items-start gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-950 text-sm sm:text-base">Cada gota alimenta e salva uma vida!</h4>
            <p className="text-xs sm:text-sm text-emerald-800 mt-0.5 leading-relaxed">
              1 único frasco de 200ml de leite materno doado pode alimentar até <strong>10 bebês prematuros</strong> por dia na UTIN da Santa Mônica. Siga o passo a passo de biossegurança:
            </p>
          </div>
        </div>

        {/* 4 Etapas Cruciais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
          {/* Passo 1: Preparo do Frasco */}
          <div className="border border-slate-200 rounded-xl p-3.5 sm:p-5 bg-slate-50/70 hover:border-sky-300 transition-all">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Preparo do Frasco de Vidro</h3>
                <span className="text-[10px] sm:text-xs text-sky-700 font-medium">Vidro com tampa de plástico</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Utilize frasco de vidro de café solúvel ou maionese com <strong>tampa plástica rosqueável</strong> (retire o papelão interno da tampa).</span>
              </li>
              <li className="flex items-start gap-2">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Ferva o vidro e a tampa de plástico em uma panela com água fervendo por <strong>15 minutos</strong> (a água deve cobrir tudo).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Deixe secar naturalmente com a boca para baixo sobre um pano de prato limpo. Não seque por dentro com pano ou papel.</span>
              </li>
            </ul>
          </div>

          {/* Passo 2: Higiene Pessoal */}
          <div className="border border-slate-200 rounded-xl p-3.5 sm:p-5 bg-slate-50/70 hover:border-sky-300 transition-all">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Higiene Antes de Ordenhar</h3>
                <span className="text-[10px] sm:text-xs text-sky-700 font-medium">Proteção contra contaminação</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>Prenda os cabelos com touca, lenço ou elástico limpo.</span>
              </li>
              <li className="flex items-start gap-2">
                <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>Coloque máscara ou amarre uma fralda limpa cobrindo o nariz e a boca para evitar gotículas.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Lave as mãos e os antebraços até os cotovelos com água e sabão neutro em abundância. Seque com toalha limpa.</span>
              </li>
            </ul>
          </div>

          {/* Passo 3: A Ordenha */}
          <div className="border border-slate-200 rounded-xl p-3.5 sm:p-5 bg-slate-50/70 hover:border-sky-300 transition-all">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">A Retirada do Leite</h3>
                <span className="text-[10px] sm:text-xs text-sky-700 font-medium">Manual ou com extrator esterilizado</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Descarte os primeiros jatos:</strong> Retire e jogue fora os primeiros 2 a 3 jatos antes de coletar (limpeza dos ductos externos).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Massageie a mama suavemente em movimentos circulares da aréola em direção à base.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Coloque o frasco esterilizado abaixo da aréola e colete com calma. Evite falar durante a ordenha.</span>
              </li>
            </ul>
          </div>

          {/* Passo 4: Congelamento e Armazenamento */}
          <div className="border border-slate-200 rounded-xl p-3.5 sm:p-5 bg-slate-50/70 hover:border-sky-300 transition-all">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                4
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Congelamento e Validade</h3>
                <span className="text-[10px] sm:text-xs text-sky-700 font-medium">Armazenamento a -10°C</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <Snowflake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500 shrink-0 mt-0.5" />
                <span>Guarde o frasco tampado <strong>imediatamente no congelador ou freezer</strong> (nunca guarde na porta da geladeira).</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>Validade de 15 dias:</strong> O leite congelado dura até 15 dias. A van da Santa Mônica passa na sua casa antes desse prazo!</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Para completar o frasco:</strong> Ordenhe em um copo fervido e despeje sobre o leite já congelado.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Informações Institucionais do BLH Santa Mônica */}
        <div className="bg-sky-50 rounded-xl p-3.5 sm:p-5 border border-sky-100 text-xs sm:text-sm">
          <div className="font-bold text-sky-950 mb-1.5">Visita da Van do Banco de Leite em Maceió:</div>
          <p className="text-sky-900 leading-relaxed">
            A equipe do Banco de Leite da Maternidade Escola Santa Mônica (MESM/UNCISAL) vai até a sua residência com veículo refrigerado e caixas térmicas certificadas. Você recebe frascos esterilizados gratuitamente e entrega as doações sem precisar sair de casa!
          </p>
          <div className="mt-3 flex flex-wrap gap-2 sm:gap-4 text-[11px] sm:text-xs font-semibold text-sky-800">
            <span className="bg-white/80 px-2 py-1 rounded-md border border-sky-200/60">📍 Poço / Trapiche • Maceió/AL</span>
            <span className="bg-white/80 px-2 py-1 rounded-md border border-sky-200/60">📞 (82) 3315-4434</span>
            <span className="bg-white/80 px-2 py-1 rounded-md border border-sky-200/60">🏥 Maternidade Santa Mônica</span>
          </div>
        </div>
      </div>

      {/* Rodapé do Modal com Botão de Ação */}
      <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4 flex items-center justify-between gap-3 shrink-0">
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Rede Global rBLH • Fiocruz • Ministério da Saúde
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 transition-colors text-center cursor-pointer"
          >
            Entendido, Voltar ao Chat
          </button>
        )}
      </div>
    </div>
  );
};
