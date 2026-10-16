/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, TabType } from './components/Header';
import { PhoneChatbotSimulator } from './components/PhoneChatbotSimulator';
import { HospitalAdminDashboard } from './components/HospitalAdminDashboard';
import { RouteCollectorView } from './components/RouteCollectorView';
import { ProtocolLookupModal } from './components/ProtocolLookupModal';
import { FiocruzGuidelinesModal } from './components/FiocruzGuidelinesModal';
import { SystemManualsModal } from './components/SystemManualsModal';
import { api } from './services/api';
import { Baby } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('CHATBOT');
  const [showGuidelinesModal, setShowGuidelinesModal] = useState<boolean>(false);
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);

  // Carrega contagem de análises pendentes para o badge no header
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const stats = await api.getStats();
        setPendingReviewsCount(stats.emAnalise || 0);
      } catch (e) {
        // quiet
      }
    };
    fetchPending();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col font-sans">
      {/* Header Institucional UNCISAL / MESM */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingReviewsCount={pendingReviewsCount}
      />

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto ${activeTab === 'CHATBOT' ? 'max-w-7xl px-2 sm:px-6 lg:px-8 py-2 sm:py-6 flex items-center justify-center' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6'}`}>
        {/* MÓDULO 1: CHATBOT NO CELULAR (Tela Principal: Apenas o Celular com Chat) */}
        {activeTab === 'CHATBOT' && (
          <PhoneChatbotSimulator
            onOpenGuidelines={() => setShowGuidelinesModal(true)}
            onOpenAdmin={() => setActiveTab('ADMIN')}
            onOpenCollector={() => setActiveTab('COLETADOR')}
          />
        )}

        {/* MÓDULO 2: PAINEL DE GESTÃO DA MATERNIDADE (Hospital Dashboard) */}
        {activeTab === 'ADMIN' && <HospitalAdminDashboard />}

        {/* MÓDULO 3: MÓDULO ROTA DO COLETADOR (Mobile Web Ultraleve) */}
        {activeTab === 'COLETADOR' && <RouteCollectorView />}

        {/* MÓDULO 4: CONSULTAR PROTOCOLO */}
        {activeTab === 'CONSULTA' && (
          <ProtocolLookupModal
            onOpenGuidelines={() => setShowGuidelinesModal(true)}
          />
        )}

        {/* MÓDULO 5: GUIA SANITÁRIO FIOCRUZ */}
        {activeTab === 'NORMAS' && (
          <FiocruzGuidelinesModal
            onClose={() => setActiveTab('CHATBOT')}
          />
        )}

        {/* MÓDULO 6: MANUAIS DO USUÁRIO E DO DESENVOLVEDOR */}
        {activeTab === 'MANUAIS' && (
          <SystemManualsModal
            onClose={() => setActiveTab('CHATBOT')}
          />
        )}
      </main>

      {/* Modal Guia Sanitário Flutuante */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
          <FiocruzGuidelinesModal onClose={() => setShowGuidelinesModal(false)} />
        </div>
      )}

      {/* Rodapé Institucional e Sanitário */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Baby className="w-5 h-5 text-emerald-400" />
                <span>Banco de Leite Humano • Maternidade Escola Santa Mônica (UNCISAL)</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
                Unidade assistencial e de ensino da Universidade Estadual de Ciências da Saúde de Alagoas (UNCISAL), em Maceió/AL. Referência terciária estadual no atendimento à gestante e ao recém-nascido de alto risco.
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                bancodeleite.uncisal.edu.br • Custo R$ 0,00 de Mensagens da Meta • Conformidade LGPD & RDC 171/2006
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2">
                Protocolos Sanitários
              </h4>
              <ul className="space-y-1 text-xs">
                <li>• Rede Global de Bancos de Leite (rBLH)</li>
                <li>• Fundação Oswaldo Cruz (Fiocruz)</li>
                <li>• Resolução ANVISA RDC nº 171/2006</li>
                <li>• Portaria MS nº 1.018/2005 (SUS)</li>
                <li>• Lei Geral de Proteção de Dados (LGPD)</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-2">
                Atendimento BLH Maceió
              </h4>
              <p className="text-xs">
                Rua Jorge de Lima, 113 - Trapiche da Barra<br />
                Maceió - AL, CEP 57010-330<br />
                <span className="font-semibold text-slate-300">Central Telefônica: (82) 3315-4400</span><br />
                Plantão do Banco de Leite: 24 horas
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-center text-slate-500 text-[11px] flex flex-wrap justify-between items-center gap-2">
            <span>© {new Date().getFullYear()} Universidade Estadual de Ciências da Saúde de Alagoas (UNCISAL) • Todos os direitos reservados.</span>
            <span>Sistema Institucional de Triagem Clínica e Captação de Leite Materno</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
