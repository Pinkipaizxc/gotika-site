const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config({ path: './server.env' });

const app = express();

// Инициализация Telegram бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Функция для отправки уведомлений в Telegram
async function sendTelegramNotification(message) {
    try {
        const adminChatIds = process.env.ADMIN_CHAT_IDS.split(',');
        for (const chatId of adminChatIds) {
            await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        }
    } catch (error) {
        console.error('Ошибка при отправке уведомления в Telegram:', error);
    }
}

// Middleware
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'Accept']
}));
app.use(bodyParser.json());
app.use(express.static('.'));

// Настройка сессий
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 день
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 день
    }
}));

// MongoDB connection configuration
const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    autoIndex: true
};

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI, mongoOptions)
    .then(() => {
        console.log('Connected to MongoDB successfully');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

// Обработка ошибок MongoDB
mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
});

// Схема товара
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    colors: [String],
    sizes: [String]
});

const Product = mongoose.model('Product', productSchema);

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullname: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    index: { type: String, required: true },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }]
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    color: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    shippingAddress: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Order = mongoose.model('Order', orderSchema);

// Middleware для проверки аутентификации
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: 'Требуется авторизация' });
    }
};

// Routes
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, fullname, phone, address, index } = req.body;

        // Валидация данных
        if (!username || !password || !fullname || !phone || !address || !index) {
            return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
        }

        if (username.length < 3) {
            return res.status(400).json({ message: 'Имя пользователя должно содержать минимум 3 символа' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
        }

        if (!/^\d{6}$/.test(index)) {
            return res.status(400).json({ message: 'Индекс должен состоять из 6 цифр' });
        }

        if (!/^\+?[\d\s-]{10,}$/.test(phone)) {
            return res.status(400).json({ message: 'Неверный формат номера телефона' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким именем уже существует' });
        }

        const user = new User({
            username,
            password,
            fullname,
            phone,
            address,
            index
        });

        await user.save();

        // Отправляем уведомление в Telegram
        const message = `
<b>🆕 Новый пользователь зарегистрировался!</b>

👤 <b>ФИО:</b> ${fullname}
📱 <b>Телефон:</b> ${phone}
📍 <b>Адрес:</b> ${address}
📮 <b>Индекс:</b> ${index}
👤 <b>Имя пользователя:</b> ${username}
⏰ <b>Дата регистрации:</b> ${new Date().toLocaleString()}
        `;
        await sendTelegramNotification(message);

        res.status(201).json({ message: 'Регистрация успешна' });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({ message: 'Ошибка при регистрации пользователя' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Необходимо указать имя пользователя и пароль' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
        }

        // Создаем сессию
        req.session.userId = user._id;
        req.session.username = user.username;

        res.json({
            message: 'Вход выполнен успешно',
            user: {
                id: user._id,
                username: user.username,
                fullname: user.fullname,
                phone: user.phone,
                address: user.address,
                index: user.index
            }
        });
    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ message: 'Ошибка при входе в систему' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Ошибка при выходе из системы' });
        }
        res.json({ message: 'Выход выполнен успешно' });
    });
});

app.get('/api/auth/check', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ authenticated: true, userId: req.session.userId });
    } else {
        res.json({ authenticated: false });
    }
});

// Защищенные маршруты
app.get('/api/user/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        res.json({
            username: user.username,
            fullname: user.fullname,
            phone: user.phone,
            address: user.address,
            index: user.index
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении профиля' });
    }
});

// Order Routes
app.post('/api/orders', async (req, res) => {
    try {
        const { userId, items, totalAmount, shippingAddress, phoneNumber } = req.body;

        // Создаем новый заказ
        const order = new Order({
            user: userId,
            items: items.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.priceAtAdd
            })),
            totalAmount,
            shippingAddress,
            phoneNumber
        });

        await order.save();
        await order.populate('items.product');

        // Формируем сообщение для Telegram
        const orderItems = order.items.map(item => {
            const product = item.product;
            return `
🏷 <b>${product.name}</b>
   • Количество: ${item.quantity}
   • Цена: ${item.price} KZT
   • Цвет: ${item.color}
   • Размер: ${item.size}`;
        }).join('\n\n');

        const message = `
🛍 <b>Новый заказ #${order._id}</b>

👤 <b>Данные покупателя:</b>
   • Телефон: ${phoneNumber}
   • Адрес: ${shippingAddress}

📦 <b>Заказанные товары:</b>
${orderItems}

💰 <b>Общая сумма:</b> ${totalAmount} KZT

⏰ <b>Дата заказа:</b> ${new Date().toLocaleString('ru-RU')}`;

        // Отправляем уведомление в Telegram
        await sendTelegramNotification(message);

        res.json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Заказ не найден' });
        }
        
        order.status = status;
        await order.save();
        
        if (order.telegramChatId) {
            await sendOrderStatus(order.telegramChatId, orderId, status);
        }
        
        res.json(order);
    } catch (error) {
        console.error('Ошибка при обновлении статуса заказа:', error);
        res.status(400).json({ message: error.message });
    }
});

// Эндпоинт для быстрого заказа
app.post('/api/quick-order', async (req, res) => {
    try {
        const { productId, color, size, phoneNumber, shippingAddress, paymentMethod } = req.body;

        // Проверяем наличие всех необходимых полей
        if (!productId || !color || !size || !phoneNumber || !shippingAddress || !paymentMethod) {
            return res.status(400).json({ message: 'Необходимо указать все данные заказа' });
        }

        // Находим продукт по slug
        const product = await Product.findOne({ slug: productId });
        
        // Проверяем существование продукта
        if (!product) {
            return res.status(404).json({ message: 'Товар не найден' });
        }

        // Проверяем доступность цвета и размера
        if (!product.colors.includes(color)) {
            return res.status(400).json({ message: 'Выбранный цвет недоступен' });
        }
        if (!product.sizes.includes(size)) {
            return res.status(400).json({ message: 'Выбранный размер недоступен' });
        }

        // Создаем новый заказ
        const order = new Order({
            product: product._id,
            quantity: 1,
            color,
            size,
            phoneNumber,
            shippingAddress,
            paymentMethod,
            totalAmount: product.price,
            status: 'pending'
        });

        await order.save();

        // Отправляем уведомление в Telegram
        const message = `
🛍 Новый быстрый заказ!

Товар: ${product.name}
Цвет: ${color}
Размер: ${size}
Цена: ${product.price} KZT

📱 Телефон: ${phoneNumber}
📍 Адрес: ${shippingAddress}
💳 Способ оплаты: ${paymentMethod}
        `;

        await sendTelegramNotification(message);

        res.status(201).json({ message: 'Заказ успешно создан', order });
    } catch (error) {
        console.error('Error creating quick order:', error);
        res.status(500).json({ 
            message: 'Ошибка при создании заказа',
            error: error.message 
        });
    }
});

// Маршрут для регистрации
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Проверяем, что email не пустой
        if (!email) {
            return res.status(400).json({ message: 'Email обязателен' });
        }

        // Проверяем, существует ли пользователь
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }

        // Создаем нового пользователя
        const user = new User({
            username,
            email,
            password // В реальном приложении пароль нужно хешировать
        });

        await user.save();
        res.json({ message: 'Пользователь успешно зарегистрирован' });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({ message: error.message });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 