import { RegiaoLogistica } from '../types/blh';

export interface BairroMaceio {
  nome: string;
  regiao: RegiaoLogistica;
  descricaoRegiao: string;
  cepPadrao?: string;
}

export const BAIRROS_MACEIO: BairroMaceio[] = [
  // Litoral Sul / Trapiche (Área da MESM / UNCISAL)
  { nome: 'Trapiche da Barra', regiao: 'LITORAL_SUL_TRAPICHE', descricaoRegiao: 'Litoral Sul / Trapiche (Sede MESM / UNCISAL)', cepPadrao: '57010-330' },
  { nome: 'Prado', regiao: 'LITORAL_SUL_TRAPICHE', descricaoRegiao: 'Litoral Sul / Trapiche', cepPadrao: '57010-000' },
  { nome: 'Pontal da Barra', regiao: 'LITORAL_SUL_TRAPICHE', descricaoRegiao: 'Litoral Sul / Trapiche', cepPadrao: '57010-820' },
  { nome: 'Vergel do Lago', regiao: 'LITORAL_SUL_TRAPICHE', descricaoRegiao: 'Litoral Sul / Trapiche', cepPadrao: '57014-000' },
  { nome: 'Ponta Grossa', regiao: 'LITORAL_SUL_TRAPICHE', descricaoRegiao: 'Litoral Sul / Trapiche', cepPadrao: '57014-050' },
  { nome: 'Levada', regiao: 'LITORAL_SUL_TRAPICHE', descricaoRegiao: 'Litoral Sul / Trapiche', cepPadrao: '57017-000' },

  // Farol / Centro / Eixo Universitário
  { nome: 'Farol', regiao: 'FAROL_CENTRO', descricaoRegiao: 'Farol / Centro', cepPadrao: '57051-000' },
  { nome: 'Centro', regiao: 'FAROL_CENTRO', descricaoRegiao: 'Farol / Centro', cepPadrao: '57020-000' },
  { nome: 'Pinheiro', regiao: 'FAROL_CENTRO', descricaoRegiao: 'Farol / Centro', cepPadrao: '57057-000' },
  { nome: 'Pitanguinha', regiao: 'FAROL_CENTRO', descricaoRegiao: 'Farol / Centro', cepPadrao: '57052-000' },
  { nome: 'Gruta de Lourdes', regiao: 'FAROL_CENTRO', descricaoRegiao: 'Farol / Centro', cepPadrao: '57052-800' },
  { nome: 'Rotary', regiao: 'FAROL_CENTRO', descricaoRegiao: 'Farol / Centro', cepPadrao: '57052-100' },
  { nome: 'Canaã', regiao: 'FAROL_CENTRO', descricaoRegiao: 'Farol / Centro', cepPadrao: '57080-000' },
  { nome: 'Santo Amaro', regiao: 'FAROL_CENTRO', descricaoRegiao: 'Farol / Centro', cepPadrao: '57052-400' },

  // Orla / Baixa
  { nome: 'Ponta Verde', regiao: 'ORLA_BAIXA', descricaoRegiao: 'Orla / Baixa', cepPadrao: '57035-000' },
  { nome: 'Pajuçara', regiao: 'ORLA_BAIXA', descricaoRegiao: 'Orla / Baixa', cepPadrao: '57030-000' },
  { nome: 'Jatiúca', regiao: 'ORLA_BAIXA', descricaoRegiao: 'Orla / Baixa', cepPadrao: '57036-000' },
  { nome: 'Cruz das Almas', regiao: 'ORLA_BAIXA', descricaoRegiao: 'Orla / Baixa', cepPadrao: '57038-000' },
  { nome: 'Mangabeiras', regiao: 'ORLA_BAIXA', descricaoRegiao: 'Orla / Baixa', cepPadrao: '57037-000' },
  { nome: 'Poço', regiao: 'ORLA_BAIXA', descricaoRegiao: 'Orla / Baixa', cepPadrao: '57025-000' },
  { nome: 'Jaraguá', regiao: 'ORLA_BAIXA', descricaoRegiao: 'Orla / Baixa', cepPadrao: '57022-000' },

  // Tabuleiro / Parte Alta
  { nome: 'Tabuleiro do Martins', regiao: 'TABULEIRO_ALTA', descricaoRegiao: 'Tabuleiro / Parte Alta', cepPadrao: '57081-000' },
  { nome: 'Benedito Bentes', regiao: 'TABULEIRO_ALTA', descricaoRegiao: 'Tabuleiro / Parte Alta', cepPadrao: '57084-000' },
  { nome: 'Santa Lúcia', regiao: 'TABULEIRO_ALTA', descricaoRegiao: 'Tabuleiro / Parte Alta', cepPadrao: '57082-000' },
  { nome: 'Antares', regiao: 'TABULEIRO_ALTA', descricaoRegiao: 'Tabuleiro / Parte Alta', cepPadrao: '57083-000' },
  { nome: 'Serraria', regiao: 'TABULEIRO_ALTA', descricaoRegiao: 'Tabuleiro / Parte Alta', cepPadrao: '57046-000' },
  { nome: 'Cidade Universitária', regiao: 'TABULEIRO_ALTA', descricaoRegiao: 'Tabuleiro / Parte Alta', cepPadrao: '57072-900' },
  { nome: 'Clima Bom', regiao: 'TABULEIRO_ALTA', descricaoRegiao: 'Tabuleiro / Parte Alta', cepPadrao: '57071-000' },
  { nome: 'Santos Dumont', regiao: 'TABULEIRO_ALTA', descricaoRegiao: 'Tabuleiro / Parte Alta', cepPadrao: '57075-000' },

  // Norte / Jacarecica / Intermediário
  { nome: 'Jacintinho', regiao: 'NORTE_JACARECICA', descricaoRegiao: 'Norte / Jacarecica', cepPadrao: '57040-000' },
  { nome: 'Feitosa', regiao: 'NORTE_JACARECICA', descricaoRegiao: 'Norte / Jacarecica', cepPadrao: '57043-000' },
  { nome: 'Barro Duro', regiao: 'NORTE_JACARECICA', descricaoRegiao: 'Norte / Jacarecica', cepPadrao: '57045-000' },
  { nome: 'São Jorge', regiao: 'NORTE_JACARECICA', descricaoRegiao: 'Norte / Jacarecica', cepPadrao: '57044-000' },
  { nome: 'Jacarecica', regiao: 'NORTE_JACARECICA', descricaoRegiao: 'Norte / Jacarecica', cepPadrao: '57038-640' },
  { nome: 'Guaxuma', regiao: 'NORTE_JACARECICA', descricaoRegiao: 'Norte / Jacarecica', cepPadrao: '57039-000' },
  { nome: 'Garça Torta', regiao: 'NORTE_JACARECICA', descricaoRegiao: 'Norte / Jacarecica', cepPadrao: '57039-200' },
  { nome: 'Riacho Doce', regiao: 'NORTE_JACARECICA', descricaoRegiao: 'Norte / Jacarecica', cepPadrao: '57039-500' }
];

export function getRegiaoPorBairro(nomeBairro: string): RegiaoLogistica {
  const normalizado = nomeBairro.trim().toLowerCase();
  const encontrado = BAIRROS_MACEIO.find(b => b.nome.toLowerCase() === normalizado);
  return encontrado ? encontrado.regiao : 'FAROL_CENTRO';
}

export function getNomeRegiao(regiao: RegiaoLogistica): string {
  switch (regiao) {
    case 'ORLA_BAIXA': return 'Setor 1: Orla / Baixa (Ponta Verde, Pajuçara, Jatiúca)';
    case 'FAROL_CENTRO': return 'Setor 2: Farol / Centro (Farol, Gruta, Centro)';
    case 'TABULEIRO_ALTA': return 'Setor 3: Tabuleiro / Parte Alta (Benedito Bentes, Tabuleiro)';
    case 'LITORAL_SUL_TRAPICHE': return 'Setor 4: Litoral Sul / Trapiche (MESM, Pontal, Vergel)';
    case 'NORTE_JACARECICA': return 'Setor 5: Norte / Jacarecica (Jacintinho, Feitosa, Litoral Norte)';
    default: return 'Setor Geral Maceió';
  }
}
