// Глобальные переменные
const API_URL = 'http://localhost:3001/api';

// Функция для проверки авторизации
async function checkAuth() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
}

// Функция для выхода из аккаунта
function logout() {
    localStorage.removeItem('userId');
    window.location.href = 'login.html';
}

// Функция для отображения информации о пользователе
async function displayUserInfo() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const response = await fetch(`${API_URL}/users/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const user = await response.json();
        const userInfoElement = document.querySelector('.user-info');
        if (userInfoElement) {
            userInfoElement.innerHTML = `
                <p>Имя пользователя: ${user.username}</p>
                <p>ФИО: ${user.fullname}</p>
                <p>Телефон: ${user.phone}</p>
                <p>Адрес: ${user.address}</p>
                <p>Индекс: ${user.index}</p>
            `;
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// Функция для отображения заказов пользователя
async function displayUserOrders() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const response = await fetch(`${API_URL}/orders/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }

        const orders = await response.json();
        const ordersContainer = document.querySelector('.orders-container');
        if (ordersContainer) {
            if (orders.length === 0) {
                ordersContainer.innerHTML = '<p>У вас пока нет заказов</p>';
                return;
            }

            ordersContainer.innerHTML = orders.map(order => `
                <div class="order-card">
                    <h3>Заказ #${order._id}</h3>
                    <p>Дата: ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p>Статус: ${order.status}</p>
                    <p>Сумма: ${order.totalAmount} KZT</p>
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <p>${item.product.name}</p>
                                <p>Количество: ${item.quantity}</p>
                                <p>Цвет: ${item.color}</p>
                                <p>Размер: ${item.size}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

// Инициализация страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем авторизацию на защищенных страницах
    if (window.location.pathname.includes('profile.html')) {
        await checkAuth();
        await displayUserInfo();
        await displayUserOrders();
    }

    // Добавляем обработчики событий для кнопок
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});