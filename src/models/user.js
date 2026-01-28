const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  telegram_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  current_industry: {
    type: DataTypes.STRING,
    defaultValue: 'finance',
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'users',
  timestamps: false,
});

const Industry = sequelize.define('Industry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  currency_usd: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency_eur: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency_cny: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  news_title: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  news_source: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  news_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'industries',
  timestamps: false,
});

async function syncDatabase() {
  try {
    await User.sync({ alter: true });
    await Industry.sync({ alter: true });
    console.log('✅ Таблицы синхронизированы');
  } catch (error) {
    console.error('❌ Ошибка синхронизации базы данных:', error);
  }
}

module.exports = { User, Industry, syncDatabase };
