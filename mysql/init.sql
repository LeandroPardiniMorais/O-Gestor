CREATE DATABASE IF NOT EXISTS gestor
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gestor;

CREATE TABLE IF NOT EXISTS clients (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  nome VARCHAR(120) NOT NULL,
  endereco VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NULL,
  telefone VARCHAR(20) NULL,
  email VARCHAR(120) NULL,
  nome_empresa VARCHAR(150) NULL,
  cnpj VARCHAR(18) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clients_cpf (cpf),
  UNIQUE KEY uq_clients_cnpj (cnpj),
  UNIQUE KEY uq_clients_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS suppliers (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  nome VARCHAR(150) NOT NULL,
  contato VARCHAR(150) NOT NULL,
  telefone VARCHAR(20) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_suppliers_contato (contato)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  nome VARCHAR(150) NOT NULL,
  categoria VARCHAR(100) NULL,
  estoque INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS budgets (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  codigo VARCHAR(32) NOT NULL,
  cliente_id CHAR(36) NOT NULL,
  status ENUM('rascunho','enviado','aceito','recusado') NOT NULL DEFAULT 'rascunho',
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  desconto DECIMAL(12,2) NULL,
  observacoes TEXT NULL,
  resumo_do_projeto TEXT NULL,
  previsao_inicio DATETIME NULL,
  previsao_entrega DATETIME NULL,
  responsavel_projeto VARCHAR(150) NULL,
  prioridade ENUM('baixa','media','alta') NOT NULL DEFAULT 'media',
  etapa_atual VARCHAR(120) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_budgets_codigo (codigo),
  KEY idx_budgets_cliente (cliente_id),
  CONSTRAINT fk_budgets_cliente FOREIGN KEY (cliente_id) REFERENCES clients (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS budget_items (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  budget_id CHAR(36) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  quantidade INT UNSIGNED NOT NULL DEFAULT 1,
  montagem VARCHAR(100) NULL,
  pintura VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_budget_items_budget (budget_id),
  CONSTRAINT fk_budget_items_budget FOREIGN KEY (budget_id) REFERENCES budgets (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS budget_parts (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  item_id CHAR(36) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  quantidade INT UNSIGNED NOT NULL DEFAULT 1,
  material VARCHAR(100) NULL,
  peso DECIMAL(10,3) NULL,
  tempo_impressao DECIMAL(10,2) NULL,
  custo_adicional DECIMAL(12,2) NULL,
  valor_calculado DECIMAL(12,2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_budget_parts_item (item_id),
  CONSTRAINT fk_budget_parts_item FOREIGN KEY (item_id) REFERENCES budget_items (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS production_plans (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  budget_id CHAR(36) NOT NULL,
  resumo TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_production_plans_budget (budget_id),
  CONSTRAINT fk_production_plans_budget FOREIGN KEY (budget_id) REFERENCES budgets (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS production_sectors (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  production_plan_id CHAR(36) NOT NULL,
  setor ENUM('impressao','acabamento','pintura','montagem','revisao','logistica') NOT NULL,
  status VARCHAR(60) NOT NULL DEFAULT 'Aguardando',
  responsavel VARCHAR(150) NULL,
  inicio_previsto DATETIME NULL,
  termino_previsto DATETIME NULL,
  observacoes TEXT NULL,
  percentual TINYINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sector_per_plan (production_plan_id, setor),
  CONSTRAINT fk_production_sectors_plan FOREIGN KEY (production_plan_id) REFERENCES production_plans (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;
