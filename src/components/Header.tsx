import React, { useState } from 'react';
import { Truck, Hospital, Search, BookOpen, Baby, Menu, X, ChevronRight, ShieldCheck, FileText } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type TabType = 'CHATBOT' | 'ADMIN' | 'COLETADOR' | 'CONSULTA' | 'NORMAS' | 'MANUAIS';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingReviewsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, pendingReviewsCount = 0 }) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      {/* Top institutional ribbon */}
      <div className="bg-linear-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white text-[10px] sm:text-xs px-3 sm:px-4 py-1 flex justify-between items-center gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-bold tracking-wide uppercase shrink-0 text-white">UNCISAL</span>
          <span className="text-emerald-300">|</span>
          <span className="font-medium text-white truncate">Maternidade Santa Mônica • Maceió</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-200 shrink-0">
          <span className="font-mono text-[10px] bg-white text-emerald-950 font-bold px-2 py-0.2 rounded border border-emerald-200">
            bancodeleite.uncisal.edu.br
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-white font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            rBLH / Fiocruz
          </span>
        </div>
      </div>

      {/* Main header navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 sm:py-3">
          {/* Logo & Institution Titles */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer" 
            onClick={() => handleSelectTab('CHATBOT')}
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 shrink-0 border border-emerald-600">
              <Baby className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                  Banco de Leite Humano
                </span>
                <span className="text-[10px] font-medium text-slate-500 hidden sm:inline">
                  Rede Global rBLH / Fiocruz
                </span>
              </div>
              <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 leading-tight">
                Maternidade Santa Mônica <span className="text-emerald-700 font-bold text-xs sm:text-sm">(MESM)</span>
              </h1>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                Referência Terciária em Alto Risco Materno-Infantil • Maceió/AL
              </p>
            </div>
          </div>

          {/* Botões de Ação do Header */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectTab('MANUAIS')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                activeTab === 'MANUAIS'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Acessar Manual do Usuário e do Desenvolvedor"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Manuais & Docs</span>
            </button>

            <PWAInstallButton />
            
            {/* Botão Hamburguer */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-colors border border-slate-200 shadow-2xs cursor-pointer"
                aria-label="Abrir menu de navegação"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-slate-700" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-700" />
                )}
                <span className="hidden sm:inline font-semibold">
                  {isMenuOpen ? 'Fechar' : 'Menu'}
                </span>
                {pendingReviewsCount > 0 && !isMenuOpen && (
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                    {pendingReviewsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Hambúrguer Dropdown / Modal */}
      {isMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-150"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer / Menu Panel */}
          <div className="absolute right-2 sm:right-6 top-full mt-1 w-[92vw] sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Módulos do Sistema BLH
              </span>
              <button 
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="space-y-1">
              {/* Opção 1: Chatbot */}
              <button
                type="button"
                onClick={() => handleSelectTab('CHATBOT')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                  activeTab === 'CHATBOT'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold'
                    : 'hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    activeTab === 'CHATBOT' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                  }`}>
                    📱
                  </div>
                  <div>
                    <div className="text-xs font-bold">Chatbot Celular (Doar)</div>
                    <div className="text-[10px] text-slate-500">Atendimento com Dra. Mônica (Chatbot)</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Opção 2: Painel Hospitalar */}
              <button
                type="button"
                onClick={() => handleSelectTab('ADMIN')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                  activeTab === 'ADMIN'
                    ? 'bg-sky-50 border border-sky-200 text-sky-900 font-bold'
                    : 'hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeTab === 'ADMIN' ? 'bg-sky-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Hospital className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>Painel Hospitalar MESM</span>
                      {pendingReviewsCount > 0 && (
                        <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                          {pendingReviewsCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">Gestão clínica e pareceres médicos</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Opção 3: Rota da Van */}
              <button
                type="button"
                onClick={() => handleSelectTab('COLETADOR')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                  activeTab === 'COLETADOR'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeTab === 'COLETADOR' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Rota da Van (Coletador)</div>
                    <div className={`text-[10px] ${activeTab === 'COLETADOR' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Visão mobile das visitas em Maceió
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Opção 4: Consultar Protocolo */}
              <button
                type="button"
                onClick={() => handleSelectTab('CONSULTA')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                  activeTab === 'CONSULTA'
                    ? 'bg-sky-50 border border-sky-200 text-sky-900 font-bold'
                    : 'hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeTab === 'CONSULTA' ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Consultar / Recuperar Protocolo</div>
                    <div className="text-[10px] text-slate-500">Recupere por WhatsApp, CPF ou código</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Opção 5: Normas Fiocruz */}
              <button
                type="button"
                onClick={() => handleSelectTab('NORMAS')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                  activeTab === 'NORMAS'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold'
                    : 'hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeTab === 'NORMAS' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Guia de Coleta Fiocruz</div>
                    <div className="text-[10px] text-slate-500">Normas sanitárias e esterilização</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Opção 6: Manuais e Documentação */}
              <button
                type="button"
                onClick={() => handleSelectTab('MANUAIS')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                  activeTab === 'MANUAIS'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeTab === 'MANUAIS' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Manuais do Sistema</div>
                    <div className={`text-[10px] ${activeTab === 'MANUAIS' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Manual do Usuário & Desenvolvedor
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </nav>

            <div className="mt-3 pt-2.5 border-t border-slate-100 px-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>SUS • rBLH • RDC 171 ANVISA</span>
              <span className="font-bold text-emerald-700">MESM / UNCISAL</span>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
