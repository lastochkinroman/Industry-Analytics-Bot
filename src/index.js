require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { GigaChat } = require('langchain-gigachat');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const https = require('https');
const { sequelize, testConnection } = require('./database');
const { User, Industry, syncDatabase } = require('./models/user');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const giga = new GigaChat({
  credentials: process.env.GIGACHAT_TOKEN,
  model: 'GigaChat',
  httpsAgent
});

const industryMenu = Markup.keyboard([
  ['Финансы', 'IT', 'Энергетика'],
  ['📊 Общий отчёт']
]).resize();

const mainMenu = Markup.keyboard([
  ['📰 Новости отрасли', '💱 Курсы валют'],
  ['📈 Аналитика', '🔄 Сменить отрасль']
]).resize();

async function getIndustryData(code) {
  return await Industry.findOne({ where: { code } });
}

async function getAllIndustries() {
  return await Industry.findAll();
}

function formatData(industry) {
  return `📊 *${industry.name}*\n\n` +
    `💵 USD: ${industry.currency_usd.toFixed(2)} ₽\n` +
    `💶 EUR: ${industry.currency_eur.toFixed(2)} ₽\n` +
    `💴 CNY: ${industry.currency_cny.toFixed(2)} ₽\n` +
    `⏱ Обновлено: ${new Date().toLocaleTimeString('ru-RU')}`;
}

async function generateReport(industry) {
  const messages = [
    new SystemMessage({
      content: `Ты — отраслевой аналитик с опытом в макроэкономике и финансовых рынках. Проведи комплексный анализ ситуации для ${industry.name} на основе предоставленных данных.

1. Анализ валютного рынка
- Текущие курсы:
  - USD/RUB: ${industry.currency_usd} ₽
  - EUR/RUB: ${industry.currency_eur} ₽
- Анализ динамики:
  Сравни текущие значения с предыдущими периодами (если данные доступны). Отметь тренды укрепления/ослабления рубля.
- Факторы влияния:
  Упомяни возможные причины изменений (цены на нефть, процентные ставки, геополитика).

 2. Анализ новостного фона
Ключевые новости:
- ${industry.news_title}

Воздействие на рынок:
Проанализируй, как эти события могут повлиять на отрасль и валютные курсы.

3. Выводы и прогноз
Сформулируй краткие выводы (3-5 предложений):
- Основные тренды для ${industry.name}
- Ключевые риски и возможности
- Краткосрочный прогноз развития ситуации

Формат: Четко, без лишних слов, с акцентом на практическую пользу.`
    })
  ];

  const response = await giga.invoke(messages);
  return response.content;
}

async function getOrCreateUser(ctx) {
  const telegramId = ctx.from.id;
  
  try {
    let user = await User.findOne({ where: { telegram_id: telegramId } });
    
    if (!user) {
      user = await User.create({
        telegram_id: telegramId,
        username: ctx.from.username,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        current_industry: 'finance'
      });
      console.log(`✅ Создан новый пользователь: ${telegramId}`);
    }
    
    return user;
  } catch (error) {
    console.error('❌ Ошибка работы с пользователем:', error);
    return null;
  }
}

bot.start(async (ctx) => {
  const user = await getOrCreateUser(ctx);
  if (user) {
    ctx.reply(`👋 Привет, ${ctx.from.first_name}! Добро пожаловать в бот аналитики отраслей.`, industryMenu);
  } else {
    ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

bot.hears(['Финансы', 'IT', 'Энергетика'], async (ctx) => {
  const industryMap = {
    'Финансы': 'finance',
    'IT': 'it',
    'Энергетика': 'energy'
  };
  
  const industryKey = industryMap[ctx.message.text];
  const user = await getOrCreateUser(ctx);
  
  if (user && industryKey) {
    try {
      await user.update({ current_industry: industryKey });
      const industry = await getIndustryData(industryKey);
      ctx.reply(`✅ Выбрана отрасль: ${industry.name}`, mainMenu);
    } catch (error) {
      console.error('❌ Ошибка обновления отрасли:', error);
      ctx.reply('Произошла ошибка при выборе отрасли.');
    }
  }
});

bot.hears('📊 Общий отчёт', async (ctx) => {
  const industries = await getAllIndustries();
  let report = '';
  for (const industry of industries) {
    report += `${formatData(industry)}\n\n`;
  }
  ctx.replyWithMarkdown(report);
});

bot.hears('💱 Курсы валют', async (ctx) => {
  const user = await getOrCreateUser(ctx);
  if (user) {
    const industry = await getIndustryData(user.current_industry);
    ctx.replyWithMarkdown(formatData(industry));
  }
});

bot.hears('📰 Новости отрасли', async (ctx) => {
  const user = await getOrCreateUser(ctx);
  if (user) {
    const industry = await getIndustryData(user.current_industry);
    const message = `📌 *${industry.news_title}*\n${industry.news_source}\n[Читать](${industry.news_url})`;
    ctx.replyWithMarkdown(`📰 *Новости ${industry.name}:*\n\n${message}`);
  }
});

bot.hears('📈 Аналитика', async (ctx) => {
  const user = await getOrCreateUser(ctx);
  if (user) {
    ctx.reply('🔍 Анализирую данные...');
    const industry = await getIndustryData(user.current_industry);
    const analysis = await generateReport(industry);
    ctx.replyWithMarkdown(`📊 *Аналитика для ${industry.name}:*\n\n${analysis}`);
  }
});

bot.hears('🔄 Сменить отрасль', (ctx) => {
  ctx.reply('Выберите новую отрасль:', industryMenu);
});

async function startBot() {
  try {
    await testConnection();
    await syncDatabase();
    await bot.launch();
    console.log('🤖 Бот запущен в тестовом режиме (без проверки SSL)');
    console.log('📊 База данных готова к работе');
  } catch (error) {
    console.error('❌ Ошибка запуска приложения:', error);
    process.exit(1);
  }
}

process.once('SIGINT', async () => {
  console.log('🛑 Остановка бота...');
  await bot.stop('SIGINT');
  await sequelize.close();
  process.exit(0);
});

process.once('SIGTERM', async () => {
  console.log('🛑 Остановка бота...');
  await bot.stop('SIGTERM');
  await sequelize.close();
  process.exit(0);
});

startBot();
