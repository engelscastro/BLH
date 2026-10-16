import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para o Sistema Banco de Leite Humano (BLH MESM / UNCISAL)
 * 
 * O Playwright executa testes End-to-End (E2E) simulando um usuário real no navegador.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Simulação Mobile (Smartphone Doadora)',
      use: { 
        ...devices['Pixel 5'],
        // Simulação em português do Brasil
        locale: 'pt-BR',
        timezoneId: 'America/Maceio',
      },
    },
    {
      name: 'Desktop Web (Administração / BLH)',
      use: { 
        ...devices['Desktop Chrome'],
        locale: 'pt-BR',
        timezoneId: 'America/Maceio',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
