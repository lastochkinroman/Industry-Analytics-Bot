FROM node:18-alpine

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm ci --only=production

# Копирование исходного кода
COPY src/ ./src/

# Создание пользователя node для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S node -u 1001
USER node

# Запуск приложения
CMD ["node", "src/index.js"]