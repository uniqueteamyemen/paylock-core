FROM node:18-alpine
RUN apk update && apk upgrade --no-cache
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# تعيين قيمة افتراضية للمتغير لضمان التشغيل التلقائي دون الحاجة لإدخاله يدوياً
ENV PLATFORM_SECRET=paylock_default_dev_secret
EXPOSE 3000
CMD ["node", "platform.js"]
