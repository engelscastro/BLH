/**
 * Utilitários de Mascaramento e Proteção de Dados Sensíveis
 * Sistema de Gestão do Banco de Leite Humano (BLH) — MESM / UNCISAL
 * 
 * Em conformidade com:
 * - Lei Federal nº 13.709/2018 (LGPD - Art. 11: Dados Pessoais Sensíveis de Saúde)
 * - ANVISA RDC nº 171/2006 (Boas Práticas e Rastreabilidade em BLH)
 */

/**
 * Mascara o nome da doadora mantendo o primeiro nome e as iniciais dos sobrenomes.
 * Ex: "Camila Albuquerque Vasconcelos" -> "Camila A. V."
 * Ex: "Mariana Silva de Holanda" -> "Mariana S. H."
 */
export function maskName(fullName?: string): string {
  if (!fullName) return 'Doadora Cadastrada';
  const clean = fullName.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || 'Doadora';
  
  const firstName = parts[0];
  const lastInitials = parts.slice(1).map(p => {
    const lower = p.toLowerCase();
    if (['de', 'da', 'do', 'dos', 'das', 'e'].includes(lower)) {
      return '';
    }
    return `${p[0]?.toUpperCase()}.`;
  }).filter(Boolean).join(' ');

  return `${firstName} ${lastInitials}`;
}

/**
 * Mascara o CPF para consulta pública:
 * Ex: "042.883.914-22" -> "***.883.***-22"
 * Ex: "12345678900" -> "***.456.***-00"
 */
export function maskCpf(cpf?: string): string {
  if (!cpf) return '***.***.***-** (Protegido)';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) {
    if (cpf.includes('*')) return cpf;
    return '***.***.***-** (Protegido)';
  }
  return `***.${digits.slice(3, 6)}.***-${digits.slice(9, 11)}`;
}

/**
 * Mascara o número de telefone/WhatsApp:
 * Ex: "(82) 99614-2201" -> "(82) 9****-2201"
 * Ex: "82988421234" -> "(82) 9****-1234"
 */
export function maskPhone(phone?: string): string {
  if (!phone) return '(82) 9****-****';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) {
    if (phone.includes('*')) return phone;
    return '(82) 9****-****';
  }
  const ddd = digits.slice(0, 2);
  const start = digits.length === 11 ? digits[2] : '9';
  const end = digits.slice(-4);
  return `(${ddd}) ${start}****-${end}`;
}

/**
 * Mascara o endereço residencial para visualização pública, mantendo apenas o bairro e cidade:
 * Ex: "Rua Jorge de Lima, 113, Apto 204, Trapiche da Barra" -> "Bairro Trapiche da Barra, Maceió - AL"
 */
export function maskAddress(address?: string, bairro?: string): string {
  const localBairro = bairro || 'Maceió';
  return `Bairro ${localBairro}, Maceió - AL (Logradouro sob sigilo sanitário)`;
}

/**
 * Higieniza a justificativa/motivo do status para não expor diagnósticos,
 * medicamentos ou condições de saúde sensíveis (Art. 11 da LGPD).
 */
export function getSafeStatusDescription(status?: string, motivoOriginal?: string): string {
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
}
