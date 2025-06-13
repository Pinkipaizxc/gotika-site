const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Токен бота из .env файла
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminChatIds = process.env.ADMIN_CHAT_IDS.split(',');

const bot = new TelegramBot(token, { polling: true });

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
        'Добро пожаловать в магазин Gotika! 🛍\n\n' +
        'Я могу помочь вам:\n' +
        '• Узнать статус заказа /order\n' +
        '• Связаться с поддержкой /support\n' +
        '• Узнать о доставке /delivery\n' +
        '• Посмотреть каталог /catalog'
    );
});

// Обработка команды /support
bot.onText(/\/support/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
        'Служба поддержки Gotika 📞\n\n' +
        'Время работы: ПН-ПТ 9:00 – 21:00\n' +
        'Email: Gotika@gmail.com\n\n' +
        'Оставьте ваше сообщение, и мы ответим вам в ближайшее время!'
    );
});

// Обработка команды /delivery
bot.onText(/\/delivery/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
        'Информация о доставке 🚚\n\n' +
        'Мы доставляем заказы через:\n' +
        '• Казпочта\n' +
        '• Курьерская служба\n\n' +
        'Сроки доставки: 1-3 рабочих дня\n' +
        'Стоимость доставки рассчитывается при оформлении заказа'
    );
});

// Функция отправки уведомления о новом заказе админам
async function sendOrderNotification(order) {
    const message = `
🛍 Новый заказ #${order._id}!

👤 Покупатель: ${order.user.fullname}
📞 Телефон: ${order.user.phone}
📍 Адрес: ${order.user.address}

📦 Товары:
${order.items.map(item => `• ${item.product.name} (${item.quantity} шт.) - ${item.price} KZT`).join('\n')}

💰 Общая сумма: ${order.totalAmount} KZT
`;

    // Отправляем уведомление всем админам
    for (const adminChatId of adminChatIds) {
        try {
            await bot.sendMessage(adminChatId, message);
        } catch (error) {
            console.error(`Ошибка отправки уведомления админу ${adminChatId}:`, error);
        }
    }
}

// Функция отправки статуса заказа клиенту
async function sendOrderStatus(chatId, orderId, status) {
    const statusEmoji = {
        'processing': '⏳',
        'confirmed': '✅',
        'shipping': '🚚',
        'delivered': '📦',
        'cancelled': '❌'
    };

    const statusText = {
        'processing': 'обрабатывается',
        'confirmed': 'подтвержден',
        'shipping': 'в пути',
        'delivered': 'доставлен',
        'cancelled': 'отменен'
    };

    const message = `
Заказ #${orderId} ${statusEmoji[status]}
Статус: ${statusText[status]}

${status === 'shipping' ? 'Ожидаемая дата доставки: 1-3 дня' : ''}
${status === 'delivered' ? 'Спасибо за покупку!' : ''}
`;

    await bot.sendMessage(chatId, message);
}

// Обработка всех остальных сообщений
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    
    // Если это не команда
    if (!msg.text.startsWith('/')) {
        bot.sendMessage(chatId, 
            'Спасибо за ваше сообщение! Наши менеджеры скоро свяжутся с вами.\n' +
            'Для просмотра доступных команд отправьте /start'
        );
    }
});

module.exports = {
    bot,
    sendOrderNotification,
    sendOrderStatus
}; 