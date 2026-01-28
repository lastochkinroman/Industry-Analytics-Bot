-- Инициализация базы данных
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    current_industry VARCHAR(50) DEFAULT 'finance',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS industries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    currency_usd DECIMAL(10,2) NOT NULL,
    currency_eur DECIMAL(10,2) NOT NULL,
    currency_cny DECIMAL(10,2) NOT NULL,
    news_title TEXT NOT NULL,
    news_source VARCHAR(255) NOT NULL,
    news_url VARCHAR(500) NOT NULL
);

-- Индекс для быстрого поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Индекс для фильтрации по отрасли
CREATE INDEX IF NOT EXISTS idx_users_industry ON users(current_industry);

-- Индекс для быстрого поиска по коду отрасли
CREATE INDEX IF NOT EXISTS idx_industries_code ON industries(code);

-- Вставка тестовых данных
INSERT INTO industries (name, code, currency_usd, currency_eur, currency_cny, news_title, news_source, news_url) VALUES
('Финансы', 'finance', 91.45, 99.30, 12.85, 'ЦБ РФ может изменить ключевую ставку', 'РБК', 'https://example.com/finance1'),
('IT', 'it', 91.40, 99.25, 12.80, 'Рост рынка кибербезопасности на 25%', 'VC.ru', 'https://example.com/it1'),
('Энергетика', 'energy', 91.50, 99.35, 12.90, 'Цены на нефть растут', 'Коммерсантъ', 'https://example.com/energy1')
ON CONFLICT (code) DO NOTHING;
