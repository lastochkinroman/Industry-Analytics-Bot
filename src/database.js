const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: 'db',
    port: 5432,
    dialect: 'postgres',
    logging: false,
  }
);

// Тестирование подключения
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к PostgreSQL установлено');
  } catch (error) {
    console.error('❌ Ошибка подключения к PostgreSQL:', error);
  }
}

module.exports = { sequelize, testConnection };