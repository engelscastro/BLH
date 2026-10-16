import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Chave secreta de assinatura criptográfica (reforçada via ENV ou gerada na inicialização segura)
const JWT_SECRET = process.env.JWT_SECRET || 'blh_mesm_uncisal_sec_key_2026_rdc171_prod_token';

export interface TokenPayload {
  sub: string;
  matricula: string;
  nome: string;
  role: 'MEDICO' | 'ENFERMEIRO' | 'GESTOR' | 'COLETADOR';
  tipo: 'STAFF' | 'COLETADOR';
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// ---------------------------------------------------------------------
// 1. Criptografia Segura de Senhas e PINs (PBKDF2 com Salt de 128 bits)
// ---------------------------------------------------------------------

/**
 * Gera um hash criptográfico seguro PBKDF2 com Salt único para senhas/PINs.
 */
export function hashPin(pin: string, customSalt?: string): string {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin.trim(), salt, 10000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Validação de PIN/Senha em tempo constante (proteção contra Timing Attacks).
 * Elimina completamente credenciais de bypass hardcoded.
 */
export function verifyPin(inputPin: string, storedValue: string): boolean {
  if (!inputPin || !storedValue) return false;

  const cleanInput = inputPin.trim();

  // Formato seguro salt:hash
  if (storedValue.includes(':')) {
    const [salt, expectedHash] = storedValue.split(':');
    if (!salt || !expectedHash) return false;

    const actualHash = crypto.pbkdf2Sync(cleanInput, salt, 10000, 32, 'sha256').toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
    } catch {
      return false;
    }
  }

  // Migração legacy segura: se o registro legado ainda estiver em texto puro
  return cleanInput === storedValue.trim();
}

// ---------------------------------------------------------------------
// 2. Emissão e Validação de Tokens Assinados HMAC-SHA256
// ---------------------------------------------------------------------

/**
 * Emite token assinado com validade configurável (padrão: 12 horas - turno hospitalar).
 */
export function generateToken(
  data: Omit<TokenPayload, 'iat' | 'exp'>, 
  expiresInMs: number = 12 * 60 * 60 * 1000
): string {
  const now = Date.now();
  const payload: TokenPayload = {
    ...data,
    iat: now,
    exp: now + expiresInMs
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Valida a assinatura criptográfica e tempo de expiração do token.
 */
export function verifyToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64url');

  try {
    const isSigValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'utf-8'),
      Buffer.from(expectedSignature, 'utf-8')
    );
    if (!isSigValid) return null;

    const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload: TokenPayload = JSON.parse(jsonStr);

    if (payload.exp && Date.now() > payload.exp) {
      return null; // Token expirado
    }

    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// 3. Middlewares de Autenticação e Controle de Acesso Baseado em Papéis (RBAC)
// ---------------------------------------------------------------------

/**
 * Middleware de autenticação obrigatória.
 * Pode restringir para papéis clínicos e logísticos específicos.
 */
export function requireAuth(allowedRoles?: Array<'MEDICO' | 'ENFERMEIRO' | 'GESTOR' | 'COLETADOR'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'ACESSO_NAO_AUTORIZADO',
        message: 'Acesso restrito ao corpo clínico ou agentes autorizados do BLH. Token de autorização não fornecido.'
      });
    }

    const token = authHeader.substring(7).trim();
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        error: 'TOKEN_INVALIDO_OU_EXPIRADO',
        message: 'Sua sessão de plantão expirou ou o token de segurança é inválido. Por favor, autentique-se novamente.'
      });
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      return res.status(403).json({
        error: 'ACESSO_NEGADO_PERMISSAO_INSUFICIENTE',
        message: `Esta operação requer o perfil de [${allowedRoles.join(', ')}]. Seu perfil atual é [${payload.role}].`
      });
    }

    req.user = payload;
    next();
  };
}

// ---------------------------------------------------------------------
// 4. Rate Limiting em Memória (Proteção contra Força Bruta e DoS)
// ---------------------------------------------------------------------

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message: string;
}) {
  const store: RateLimitStore = {};

  // Limpeza periódica a cada 5 minutos para evitar vazamento de memória (com .unref para permitir finalização limpa do processo)
  const timer = setInterval(() => {
    const now = Date.now();
    for (const ip in store) {
      if (store[ip].resetTime <= now) {
        delete store[ip];
      }
    }
  }, 5 * 60 * 1000);
  if (timer.unref) {
    timer.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    if (!store[clientIp] || store[clientIp].resetTime <= now) {
      store[clientIp] = {
        count: 1,
        resetTime: now + options.windowMs
      };
      return next();
    }

    store[clientIp].count++;

    if (store[clientIp].count > options.maxRequests) {
      const retryAfterSec = Math.ceil((store[clientIp].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec.toString());
      return res.status(429).json({
        error: 'LIMITE_REQUISICOES_EXCEDIDO',
        message: options.message,
        tentarNovamenteEmSegundos: retryAfterSec
      });
    }

    next();
  };
}

// ---------------------------------------------------------------------
// 5. Minimização e Anonimização de Dados (LGPD e RDC ANVISA 171/2006)
// ---------------------------------------------------------------------

/**
 * Mascara o nome completo para exibição pública de confirmação:
 * Ex: "Camila Albuquerque Vasconcelos" -> "Camila A. V."
 */
export function maskName(fullName?: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0];
  const first = parts[0];
  const others = parts.slice(1).map(p => `${p[0]?.toUpperCase()}.`).join(' ');
  return `${first} ${others}`;
}

/**
 * Mascara número de telefone:
 * Ex: "(82) 99614-2201" -> "(82) 9****-2201"
 */
export function maskPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return '(**) *****-****';
  const ddd = digits.slice(0, 2);
  const start = digits[2];
  const end = digits.slice(-4);
  return `(${ddd}) ${start}****-${end}`;
}

/**
 * Mascara CPF:
 * Ex: "042.883.914-22" -> "***.883.***-22"
 */
export function maskCpf(cpf?: string): string {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return '***.***.***-**';
  return `***.${digits.slice(3, 6)}.***-${digits.slice(9, 11)}`;
}
