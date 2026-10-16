-- ==============================================================================
-- SISTEMA DO BANCO DE LEITE HUMANO — MATERNIDADE ESCOLA SANTA MÔNICA (BLH/MESM)
-- Script DDL de Inicialização do PostgreSQL 15/16 para SUTIN / UNCISAL
-- Em conformidade com ANVISA RDC nº 171/2006 e LGPD (Lei nº 13.709/2018)
-- ==============================================================================

-- Criar extensão para UUIDs e Criptografia caso necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABELA DE DOADORAS (DONORS)
-- Cadastro clínico, endereço georreferenciado e elegibilidade
-- ==============================================================================
CREATE TABLE IF NOT EXISTS blh_donors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    birth_date DATE,
    baby_birth_date DATE,
    address_street VARCHAR(255) NOT NULL,
    address_neighborhood VARCHAR(100) NOT NULL,
    address_city VARCHAR(100) DEFAULT 'Maceió',
    address_cep VARCHAR(10),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_TRIAGE', -- PENDING_TRIAGE, APPROVED, SUSPENDED, REJECTED
    blood_type VARCHAR(10),
    medical_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blh_donors_cpf ON blh_donors(cpf);
CREATE INDEX IF NOT EXISTS idx_blh_donors_status ON blh_donors(status);
CREATE INDEX IF NOT EXISTS idx_blh_donors_neighborhood ON blh_donors(address_neighborhood);

-- ==============================================================================
-- 2. TABELA DE EXAMES SOROLÓGICOS E TRIAGEM CLÍNICA (SEROLOGY & CLINICAL TRIAGE)
-- ANVISA RDC 171/2006: HIV, Sífilis, Hepatite B, Hepatite C, HTLV
-- ==============================================================================
CREATE TABLE IF NOT EXISTS blh_donor_serology (
    id VARCHAR(64) PRIMARY KEY,
    donor_id VARCHAR(64) NOT NULL REFERENCES blh_donors(id) ON DELETE CASCADE,
    hiv_test VARCHAR(20) NOT NULL DEFAULT 'NAO_REAGENTE',
    syphilis_vdrl VARCHAR(20) NOT NULL DEFAULT 'NAO_REAGENTE',
    hbsag_hepatitis_b VARCHAR(20) NOT NULL DEFAULT 'NAO_REAGENTE',
    anti_hcv_hepatitis_c VARCHAR(20) NOT NULL DEFAULT 'NAO_REAGENTE',
    htlv_test VARCHAR(20) NOT NULL DEFAULT 'NAO_REAGENTE',
    hemoglobin_level NUMERIC(4, 1),
    exam_document_url TEXT, -- Arquivo ou Base64 da caderneta de pré-natal
    medical_evaluator_name VARCHAR(255),
    medical_evaluator_crm VARCHAR(50),
    evaluated_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'EM_ANALISE', -- EM_ANALISE, APTO, INAPTO_TEMPORARIO, INAPTO_DEFINITIVO
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blh_serology_donor ON blh_donor_serology(donor_id);

-- ==============================================================================
-- 3. TABELA DE ROTAS E AGENDAMENTOS DE COLETA DOMICILIAR (COLLECTION ROUTES)
-- Roteamento logístico das vans da MESM nos bairros de Maceió
-- ==============================================================================
CREATE TABLE IF NOT EXISTS blh_collection_routes (
    id VARCHAR(64) PRIMARY KEY,
    donor_id VARCHAR(64) NOT NULL REFERENCES blh_donors(id),
    scheduled_date DATE NOT NULL,
    period VARCHAR(20) NOT NULL DEFAULT 'MANHA', -- MANHA, TARDE
    status VARCHAR(30) NOT NULL DEFAULT 'AGENDADA', -- AGENDADA, EM_ROTA, COLETADA, INFRUTIFERA, CANCELADA
    driver_name VARCHAR(255),
    vehicle_plate VARCHAR(20),
    volume_ml_collected INTEGER DEFAULT 0,
    temperature_celsius NUMERIC(4, 1), -- Controle de cadeia de frio (-1°C a 5°C no transporte refrigerado)
    frasco_ids JSONB DEFAULT '[]'::jsonb,
    unsuccessful_reason TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blh_routes_date ON blh_collection_routes(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_blh_routes_status ON blh_collection_routes(status);

-- ==============================================================================
-- 4. TABELA DE ATENDIMENTOS DO CHATBOT DRA. MÔNICA (CHATBOT SESSIONS)
-- Triagem inteligente, orientações de ordenha e esclarecimento de dúvidas
-- ==============================================================================
CREATE TABLE IF NOT EXISTS blh_chatbot_sessions (
    id VARCHAR(64) PRIMARY KEY,
    donor_id VARCHAR(64) REFERENCES blh_donors(id) ON DELETE SET NULL,
    session_token VARCHAR(128) NOT NULL,
    channel VARCHAR(30) DEFAULT 'WEB_MESM', -- WEB_MESM, WHATSAPP
    status VARCHAR(30) DEFAULT 'FINALIZADO',
    summary TEXT,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blh_chatbot_created ON blh_chatbot_sessions(created_at);

-- ==============================================================================
-- 5. TABELA DE LOGS DE AUDITORIA SANITÁRIA IMUTÁVEIS (AUDIT LOGS)
-- ANVISA RDC 171/2006 & LGPD: Rastreabilidade de acessos a dados de saúde
-- ==============================================================================
CREATE TABLE IF NOT EXISTS blh_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    operator_name VARCHAR(255) NOT NULL,
    operator_role VARCHAR(50) NOT NULL, -- MEDICO, ENFERMEIRO, MOTORISTA, ADMIN
    operator_registration VARCHAR(50), -- CRM, COREN, Matrícula UNCISAL
    action VARCHAR(100) NOT NULL, -- CONSULTA_EXAMES, HOMOLOGACAO_DOADORA, FINALIZACAO_ROTA
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    client_ip VARCHAR(45),
    user_agent TEXT,
    sha256_hash VARCHAR(64) NOT NULL, -- Integridade do registro para auditoria
    payload_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blh_audit_created ON blh_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_blh_audit_operator ON blh_audit_logs(operator_registration);
CREATE INDEX IF NOT EXISTS idx_blh_audit_action ON blh_audit_logs(action);

-- Comentários das tabelas para o catálogo do PostgreSQL
COMMENT ON TABLE blh_donors IS 'Cadastro das nutrizes doadoras da MESM/UNCISAL';
COMMENT ON TABLE blh_donor_serology IS 'Triagem sorológica conforme ANVISA RDC 171/2006';
COMMENT ON TABLE blh_collection_routes IS 'Logística e monitoramento de coletas domiciliares e cadeia de frio';
COMMENT ON TABLE blh_chatbot_sessions IS 'Histórico de conversas da Dra. Mônica e triagem automatizada';
COMMENT ON TABLE blh_audit_logs IS 'Trilha de auditoria sanitária imutável e conformidade LGPD';
