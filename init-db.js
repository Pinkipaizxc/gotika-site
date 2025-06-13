require('dotenv').config({ path: './server.env' });
const mongoose = require('mongoose');

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
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

// Массив товаров
const products = [
    {
        name: 'Худи Mastermind Japan x Travis Scott',
        description: 'Эксклюзивная коллекция худи от Mastermind Japan в коллаборации с Travis Scott. Премиальное качество материалов, уникальный дизайн и фирменные детали обоих брендов. Доступно в розовом и сером цветах.',
        price: 11000,
        image: 'mastermindjapan.png',
        category: 'Худи',
        slug: 'mastermind-travis',
        colors: ['Розовый', 'Серый'],
        sizes: ['S', 'M', 'L', 'XL']
    },
    {
        name: 'Спортивка Balenciaga x Adidas',
        description: 'Эксклюзивная спортивная куртка от Balenciaga в коллаборации с Adidas. Премиальное качество материалов, уникальный дизайн с фирменными элементами обоих брендов. Доступна в черном цвете.',
        price: 35000,
        image: 'adidas.png',
        category: 'Спортивные куртки',
        slug: 'balenciaga-adidas',
        colors: ['Черный'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL']
    },
    {
        name: 'Свитер Maison Margiela',
        description: 'Зип худи от Maison Margiela – это стильный и удобный элемент гардероба, который идеально подходит для повседневного ношения. Премиальное качество материалов и уникальный дизайн.',
        price: 9000,
        image: 'margiela.png',
        category: 'Свитера',
        slug: 'margiela-sweater',
        colors: ['Черный', 'Белый', 'Серый'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL']
    },
    {
        name: 'Куртка ERD',
        description: 'Премиальная кожаная куртка от бренда ERD с фирменным дизайном и уникальными деталями. Изготовлена из высококачественной кожи с металлической фурнитурой. Доступна в красном цвете.',
        price: 26000,
        image: 'erd.png',
        category: 'Куртки',
        slug: 'erd-jacket',
        colors: ['Красный'],
        sizes: ['S', 'M', 'L', 'XL']
    },
    {
        name: 'Худи Mastermind World',
        description: 'Эксклюзивное зип-худи от Mastermind World с фирменным черепом на спине. Премиальное качество материалов, уникальный дизайн и характерные детали бренда. Доступно в черном цвете.',
        price: 30000,
        image: 'mastermindworld.png',
        category: 'Худи',
        slug: 'mastermind-world',
        colors: ['Черный'],
        sizes: ['S', 'M', 'L', 'XL']
    },
    {
        name: 'Пальто Yohji Yamamoto',
        description: 'Премиальное пальто от Yohji Yamamoto. Уникальный дизайн и высокое качество материалов.',
        price: 45000,
        image: 'yohji.png',
        category: 'Пальто',
        slug: 'yohji-coat',
        colors: ['Черный'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL']
    },
    {
        name: 'Спортивный костюм Yohji Yamamoto',
        description: 'Премиальный спортивный костюм от Yohji Yamamoto. Уникальный дизайн и комфорт.',
        price: 28000,
        image: 'yohji.png',
        category: 'Спортивные костюмы',
        slug: 'yohji-sport',
        colors: ['Черный'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL']
    },
    {
        name: 'Брюки Yohji Yamamoto',
        description: 'Премиальные брюки от Yohji Yamamoto с фирменным кроем и асимметричными деталями. Изготовлены из высококачественной шерстяной ткани с характерными элементами дизайна бренда. Доступны в черном цвете.',
        price: 22000,
        image: 'YYshtani.png',
        category: 'Брюки',
        slug: 'yohji-pants',
        colors: ['Черный'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL']
    },
    {
        name: 'Бомбер Vetements',
        description: 'Премиальный бомбер от Vetements. Уникальный дизайн и высокое качество материалов. Доступен в черном цвете.',
        price: 32000,
        image: 'vetements.png',
        category: 'Куртки',
        slug: 'bomber-vetements',
        colors: ['Черный'],
        sizes: ['S', 'M', 'L', 'XL']
    }
];

// Функция для инициализации базы данных
async function initializeDatabase() {
    try {
        // Очищаем существующие товары
        await Product.deleteMany({});
        console.log('Existing products cleared');

        // Добавляем новые товары
        await Product.insertMany(products);
        console.log('Products added successfully');

        // Закрываем соединение с базой данных
        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

// Запускаем инициализацию
initializeDatabase(); 