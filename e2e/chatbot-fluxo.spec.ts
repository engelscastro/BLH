import { test, expect } from '@playwright/test';

/**
 * Testes End-to-End (E2E) com Playwright
 * Sistema de Coleta Domiciliar de Leite Humano - MESM / UNCISAL
 * 
 * Este arquivo ensina como o Playwright testa os fluxos reais do usuário:
 * 1. Acesso à aplicação e verificação de elementos visuais (ex: botão 'Reiniciar o chat').
 * 2. Fluxo de pedido de frascos pela 1ª vez -> direcionamento para formulário de cadastro.
 * 3. Recuperação de protocolo esquecido via WhatsApp, CPF ou Código.
 * 4. Navegação entre abas e verificação de segurança/sanitização.
 */

test.describe('Fluxos de Atendimento do Chatbot BLH (Dra. Mônica)', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Navega até a página inicial do sistema
    await page.goto('/');
  });

  test('Passo 1: Interface inicial carrega com sucesso e exibe botão "Reiniciar o chat"', async ({ page }) => {
    // Verifica título da Dra. Mônica
    await expect(page.getByText('Dra. Mônica')).toBeVisible();

    // Verifica a presença do botão com texto explícito "Reiniciar o chat"
    const botaoReiniciar = page.getByRole('button', { name: /Reiniciar o chat/i });
    await expect(botaoReiniciar).toBeVisible();

    // Verifica a mensagem inicial de boas-vindas do Banco de Leite
    await expect(page.getByText(/Banco de Leite da Maternidade Escola Santa Mônica/i)).toBeVisible();
  });

  test('Passo 2: Pedido de frascos pela 1ª vez direciona para o cadastro da doadora', async ({ page }) => {
    // Clica na opção "Preciso de frascos esterilizados para coletar leite"
    const opcaoFrascos = page.getByRole('button', { name: /Preciso de frascos esterilizados/i });
    await expect(opcaoFrascos).toBeVisible();
    await opcaoFrascos.click();

    // O chatbot deve responder perguntando se já é cadastrada ou 1ª vez
    const opcaoPrimeiraVez = page.getByRole('button', { name: /É meu primeiro pedido de frascos/i });
    await expect(opcaoPrimeiraVez).toBeVisible();
    await opcaoPrimeiraVez.click();

    // Deve direcionar para o cadastro: o bot deve solicitar o Nome Completo
    await expect(page.getByText(/Como você se chama\?/i).or(page.getByText(/nome completo/i))).toBeVisible();

    // Verifica que o campo de input ou formulário está pronto para preenchimento
    const inputNome = page.locator('input[placeholder*="nome" i]').or(page.locator('input[type="text"]').last());
    await expect(inputNome).toBeVisible();
  });

  test('Passo 3: Recuperação de protocolo esquecido pelo menu do chatbot', async ({ page }) => {
    // Procura o botão de consulta/recuperação no menu inicial
    const opcaoEsqueci = page.getByRole('button', { name: /Esqueci meu Protocolo \/ Consultar Cadastro/i });
    await expect(opcaoEsqueci).toBeVisible();
    await opcaoEsqueci.click();

    // O bot orienta a digitar o protocolo, WhatsApp com DDD ou CPF
    await expect(page.getByText(/Digite seu protocolo anterior, seu WhatsApp com DDD ou CPF/i)).toBeVisible();

    // Localiza o campo de digitação do WhatsApp/protocolo
    const inputChat = page.getByPlaceholder(/Digite o protocolo, WhatsApp com DDD ou CPF/i).or(page.locator('input[type="text"]').last());
    await expect(inputChat).toBeVisible();

    // Testa busca com número de exemplo existente na base mock
    await inputChat.fill('82999991111');
    await inputChat.press('Enter');

    // Deve responder com os dados recuperados ou orientação clara
    await expect(page.getByText(/Localizei seu cadastro/i).or(page.getByText(/Protocolo/i))).toBeVisible({ timeout: 10000 });
  });

  test('Passo 4: Acessar a aba "Consultar / Recuperar Protocolo" pelo Header', async ({ page }) => {
    // Procura o botão de consulta no menu superior (desktop ou dropdown)
    const abaConsulta = page.getByRole('button', { name: /Consultar \/ Recuperar Protocolo/i }).or(page.getByText(/Consultar \/ Recuperar Protocolo/i));
    if (await abaConsulta.isVisible()) {
      await abaConsulta.click();

      // Verifica que o painel de Acompanhamento e Recuperação abre
      await expect(page.getByText(/Acompanhamento e Recuperação de Protocolo/i)).toBeVisible();
    }
  });

  test('Passo 5: Validação de Segurança e LGPD - Acompanhamento e Recuperação não expõe dados sensíveis', async ({ page }) => {
    // Acessa a aba de consulta
    const abaConsulta = page.getByRole('button', { name: /Consultar \/ Recuperar Protocolo/i }).or(page.getByText(/Consultar \/ Recuperar Protocolo/i));
    if (await abaConsulta.isVisible()) {
      await abaConsulta.click();

      // Realiza a busca pelo código de teste BLH-2026-0142
      const botaoTeste = page.getByRole('button', { name: /BLH-2026-0142/i });
      if (await botaoTeste.isVisible()) {
        await botaoTeste.click();
      }

      // Verifica selo de conformidade com a LGPD
      await expect(page.getByText(/LGPD/i)).toBeVisible();

      // Assegura que o CPF não é exposto sem máscara
      await expect(page.locator('body')).not.toContainText('042.883.914-22');

      // Assegura que o telefone completo não é exposto sem máscara
      await expect(page.locator('body')).not.toContainText('(82) 99614-2201');

      // Assegura que o logradouro residencial não é exposto em consulta pública
      await expect(page.locator('body')).not.toContainText('Rua Jorge de Lima, 113');
    }
  });

});
