import React, { useState } from 'react';
import { Search, ShieldCheck, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Doadora, AgendamentoColeta } from '../types/blh';
import { ProtocolCard } from './ProtocolCard';
import { maskName } from '../utils/masking';

interface ProtocolLookupProps {
  onOpenGuidelines?: () => void;
}

export const ProtocolLookupModal: React.FC<ProtocolLookupProps> = ({ onOpenGuidelines }) => {
  const [codigoInput, setCodigoInput] = useState<string>('BLH-2026-0142');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [resultado, setResultado] = useState<{
    doadora: Doadora | null;
    agendamento: AgendamentoColeta | null;
    protocoloEncontrado?: string;
  } | null>(null);

  const handleConsultar = async (e?: React.FormEvent, customValue?: string) => {
    if (e) e.preventDefault();
    const query = (customValue !== undefined ? customValue : codigoInput).trim();
    if (!query) return;

    setLoading(true);
    setErrorMsg('');
    setResultado(null);
    setCopied(false);

    try {
      const res = await api.lookupProtocol(query);
      setResultado({
        doadora: res.doadora,
        agendamento: res.agendamento,
        protocoloEncontrado: res.protocolo || res.doadora?.protocolo
      });
    } catch (err: any) {
      setErrorMsg('Não localizamos nenhum cadastro com este protocolo, telefone ou CPF. Verifique os dados digitados ou inicie um novo cadastro no Chatbot da Santa Mônica.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyProtocol = (proto: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(proto);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Busca e Recuperação */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-sky-100 text-sky-800 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Acompanhamento e Recuperação de Protocolo BLH
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Consulte a situação da sua triagem clínica ou <strong>recupere seu protocolo</strong> digitando o código (BLH-2026-XXXX), seu WhatsApp com DDD ou seu CPF.
          </p>
        </div>

        {/* Card Dica de Recuperação e Sigilo LGPD */}
        <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-950 space-y-2">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Esqueceu o número do seu protocolo?</span>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                Digite abaixo o número do seu <strong>WhatsApp com DDD</strong> ou seu <strong>CPF</strong> para recuperar seu código de protocolo oficial da Santa Mônica.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-sky-200/60 flex items-start gap-2 text-[11px] text-slate-600">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Proteção de Dados (LGPD Art. 11):</strong> Para garantir a total privacidade das mães doadoras e bebês, dados sensíveis como endereço residencial completo, número da casa, telefone e prontuário médico nunca são expostos nesta consulta pública.
            </span>
          </div>
        </div>

        <form onSubmit={(e) => handleConsultar(e)} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
              placeholder="Digite Protocolo, WhatsApp com DDD ou CPF..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-800 focus:ring-2 focus:ring-sky-500 uppercase"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Localizando...' : 'Localizar Cadastro'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1">
            <span className="font-semibold text-slate-700">Testar busca rápida:</span>
            <button
              type="button"
              onClick={() => {
                setCodigoInput('BLH-2026-0142');
                handleConsultar(undefined, 'BLH-2026-0142');
              }}
              className="text-sky-700 hover:text-sky-900 underline font-mono cursor-pointer"
            >
              BLH-2026-0142 (Por Código)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setCodigoInput('(82) 98842-1234');
                handleConsultar(undefined, '82988421234');
              }}
              className="text-emerald-700 hover:text-emerald-900 underline font-mono cursor-pointer"
            >
              (82) 98842-1234 (Por WhatsApp)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setCodigoInput('123.456.789-00');
                handleConsultar(undefined, '12345678900');
              }}
              className="text-amber-800 hover:text-amber-950 underline font-mono cursor-pointer"
            >
              123.456.789-00 (Por CPF)
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Banner de Recuperação Bem-sucedida */}
      {resultado && resultado.protocoloEncontrado && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                Protocolo Recuperado com Sucesso!
              </span>
            </div>
            <div className="text-lg sm:text-xl font-mono font-black text-emerald-950 tracking-wider">
              {resultado.protocoloEncontrado}
            </div>
            <p className="text-xs text-emerald-800">
              Titular: <strong>{maskName(resultado.doadora?.nomeCompleto)}</strong> • Bairro: {resultado.doadora?.endereco?.bairro || (resultado.doadora as any)?.bairro || resultado.agendamento?.bairro || 'Maceió'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleCopyProtocol(resultado.protocoloEncontrado!)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Protocolo Copiado!</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Copiar Protocolo</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Exibição do Protocolo Encontrado */}
      {resultado && resultado.doadora && (
        <div className="space-y-4 animate-in fade-in">
          <ProtocolCard
            doadora={resultado.doadora}
            agendamento={resultado.agendamento}
            onOpenGuidelines={onOpenGuidelines}
          />
        </div>
      )}
    </div>
  );
};
