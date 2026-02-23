(function() {
    // ------------------------------------------------------------
    // НАСТРОЙКА МОДЕЛЕЙ iPhone
    // ------------------------------------------------------------
    const models = [
        { name: 'iPhone 6', image: 'images/iphone6.jpg' },
        { name: 'iPhone 7', image: 'images/iphone7.jpg' },
        { name: 'iPhone 8', image: 'images/iphone8.jpg' },
        { name: 'iPhone X', image: 'images/iphoneX.jpg' },
        { name: 'iPhone XR', image: 'images/iphoneXR.jpg' },
        { name: 'iPhone 11', image: 'images/iphone11.jpg' },
        { name: 'iPhone 12', image: 'images/iphone12.jpg' },
        { name: 'iPhone 13', image: 'images/iphone13.jpg' },
        { name: 'iPhone 14', image: 'images/iphone14.jpg' },
        { name: 'iPhone 15', image: 'images/iphone15.jpg' },
        { name: 'iPhone 16e', image: 'images/iphone16e.jpg' },
        { name: 'iPhone 16', image: 'images/iphone16.jpg' },
        { name: 'iPhone 17 Pro', image: 'images/iphone17 pro.jpg' }
    ];

    // ---------- АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ПОРОГОВ (СБАЛАНСИРОВАННЫЙ РОСТ) ----------
    // Каждый следующий уровень требует в 2 раза больше
    // Начальное требование: 100 для 2-го уровня
    const thresholds = [];
    const baseRequirement = 100; // Можно настроить это значение для баланса
    
    for (let i = 0; i < models.length; i++) {
        if (i === 0) {
            thresholds.push(0); // 1-й уровень: 0
        } else {
            // Формула: baseRequirement * 2^(i-1)
            // i=1 (2 ур.): 100 * 2^0 = 100
            // i=2 (3 ур.): 100 * 2^1 = 200
            // i=3 (4 ур.): 100 * 2^2 = 400
            // i=4 (5 ур.): 100 * 2^3 = 800 и т.д.
            thresholds.push(baseRequirement * Math.pow(2, i - 1));
        }
    }
    
    console.log('Требования к уровням (каждый следующий в 2 раза больше):', thresholds);

    // ---------- УЛУЧШЕНИЯ (11 штук, макс. 2 покупки) ----------
    const upgrades = [
        { name: 'Множитель I', basePrice: 50, price: 50, type: 'multiplier', unlocked: true, count: 0, maxCount: 2 },
        { name: 'Генератор I', basePrice: 40, price: 40, type: 'auto', unlocked: true, count: 0, maxCount: 2 },
        { name: 'Усилитель клика I', basePrice: 80, price: 80, type: 'clickAdd', unlocked: false, count: 0, maxCount: 2 },
        { name: 'Генератор II', basePrice: 120, price: 120, type: 'auto', unlocked: false, count: 0, maxCount: 2 },
        { name: 'Множитель II', basePrice: 150, price: 150, type: 'multiplier', unlocked: false, count: 0, maxCount: 2 },
        { name: 'Усилитель клика II', basePrice: 200, price: 200, type: 'clickAdd', unlocked: false, count: 0, maxCount: 2 },
        { name: 'Генератор III', basePrice: 280, price: 280, type: 'auto', unlocked: false, count: 0, maxCount: 2 },
        { name: 'Множитель III', basePrice: 350, price: 350, type: 'multiplier', unlocked: false, count: 0, maxCount: 2 },
        { name: 'Усилитель клика III', basePrice: 450, price: 450, type: 'clickAdd', unlocked: false, count: 0, maxCount: 2 },
        { name: 'Генератор IV', basePrice: 600, price: 600, type: 'auto', unlocked: false, count: 0, maxCount: 2 },
        { name: 'Множитель IV', basePrice: 800, price: 800, type: 'multiplier', unlocked: false, count: 0, maxCount: 2 }
    ];

    // ---------- Переменные игры ----------
    let balance = 0;
    let clickMultiplier = 1;
    let clickAdd = 0;
    let autoIncome = 0;
    let currentLevel = 1;
    let gameCompletedNotified = false;

    // ---------- DOM элементы ----------
    const balanceDisplay = document.getElementById('balanceDisplay');
    const autoIncomeDisplay = document.getElementById('autoIncomeDisplay');
    const autoRateDisplay = document.getElementById('autoRateDisplay');
    const currentModelName = document.getElementById('currentModelName');
    const currentModelImage = document.getElementById('currentModelImage');
    const levelDisplay = document.getElementById('levelDisplay');
    const nextModelDisplay = document.getElementById('nextModelDisplay');
    const shopGrid = document.getElementById('shopGrid');
    const clickerMain = document.getElementById('clickerMain');
    const buyX2 = document.getElementById('buyX2');

    // Элементы уведомления
    const notification = document.getElementById('completionNotification');
    const closeBtn = document.getElementById('closeNotification');

    // ---------- Функции сохранения/загрузки ----------
    function saveGameProgress() {
        const gameData = {
            balance: balance,
            clickMultiplier: clickMultiplier,
            clickAdd: clickAdd,
            autoIncome: autoIncome,
            currentLevel: currentLevel,
            upgrades: upgrades.map(up => ({
                count: up.count,
                price: up.price,
                unlocked: up.unlocked
            }))
        };

        // Сохраняем в localStorage как запасной вариант
        try {
            localStorage.setItem('iphoneClicker_save', JSON.stringify(gameData));
            console.log('Progress saved to localStorage');
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }

        // Сохраняем через Yandex SDK
        if (window.ysdk) {
            window.ysdk.savePlayerData(gameData)
                .then(() => console.log('Progress saved to Yandex'))
                .catch(error => console.error('Error saving to Yandex:', error));
        }
    }

    function loadGameProgress() {
        // Сначала пробуем загрузить из Yandex SDK (данные приходят через событие)
        // Если не получилось, загружаем из localStorage
        
        const savedData = localStorage.getItem('iphoneClicker_save');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                applyLoadedData(data);
                console.log('Progress loaded from localStorage');
            } catch (e) {
                console.error('Error parsing saved data:', e);
                setDefaultProgress();
            }
        } else {
            setDefaultProgress();
        }
    }

    function applyLoadedData(data) {
        if (!data) return;
        
        balance = data.balance || 0;
        clickMultiplier = data.clickMultiplier || 1;
        clickAdd = data.clickAdd || 0;
        autoIncome = data.autoIncome || 0;
        currentLevel = data.currentLevel || 1;
        
        if (data.upgrades && Array.isArray(data.upgrades)) {
            data.upgrades.forEach((savedUp, index) => {
                if (upgrades[index]) {
                    upgrades[index].count = savedUp.count || 0;
                    upgrades[index].price = savedUp.price || upgrades[index].basePrice;
                    upgrades[index].unlocked = savedUp.unlocked || (index < 2); // Первые два всегда разблокированы
                }
            });
        }
        
        updateUI();
    }

    function setDefaultProgress() {
        balance = 0;
        clickMultiplier = 1;
        clickAdd = 0;
        autoIncome = 0;
        currentLevel = 1;
        
        // Сброс улучшений
        upgrades.forEach((up, index) => {
            up.count = 0;
            up.price = up.basePrice;
            up.unlocked = index < 2; // Только первые два разблокированы
        });
        
        updateUI();
    }

    // ---------- Обновление интерфейса ----------
    function updateUI() {
        balanceDisplay.innerText = Math.floor(balance);
        autoIncomeDisplay.innerText = autoIncome;
        autoRateDisplay.innerText = autoIncome + '/сек';

        // Определяем текущий уровень по балансу
        let newLevel = 1;
        for (let i = thresholds.length - 1; i >= 0; i--) {
            if (balance >= thresholds[i]) {
                newLevel = i + 1;
                break;
            }
        }
        newLevel = Math.min(newLevel, models.length);
        
        if (newLevel !== currentLevel) {
            currentLevel = newLevel;
            // Разблокировка улучшений в зависимости от уровня
            for (let i = 0; i < upgrades.length; i++) {
                if (i < currentLevel + 1) {
                    upgrades[i].unlocked = true;
                }
            }
            // Сохраняем прогресс при повышении уровня
            saveGameProgress();
        }

        // Проверка на достижение конца игры
        if (currentLevel >= models.length && !gameCompletedNotified) {
            showCompletionNotification();
            gameCompletedNotified = true;
        }

        const modelIndex = Math.min(currentLevel - 1, models.length - 1);
        currentModelName.innerText = models[modelIndex].name;
        currentModelImage.src = models[modelIndex].image;
        currentModelImage.alt = models[modelIndex].name;

        levelDisplay.innerText = `Уровень ${currentLevel}`;

        if (currentLevel < models.length) {
            nextModelDisplay.innerText = `→ ${models[currentLevel].name}`;
        } else {
            nextModelDisplay.innerText = `⭐ MAX`;
        }

        renderShopGrid();

        // Управление отдельной кнопкой x2
        const firstUpgrade = upgrades[0];
        buyX2.disabled = (firstUpgrade.count >= firstUpgrade.maxCount);
    }

    // ---------- Показать уведомление о завершении ----------
    function showCompletionNotification() {
        notification.classList.remove('hidden');
    }

    // ---------- Скрыть уведомление ----------
    function hideNotification() {
        notification.classList.add('hidden');
    }

    // ---------- Отрисовка сетки улучшений ----------
    function renderShopGrid() {
        let html = '';
        for (let i = 0; i < upgrades.length; i++) {
            const up = upgrades[i];
            if (!up.unlocked) {
                html += `
                    <div class="shop-item locked" data-index="${i}">
                        <div class="item-name">???</div>
                    </div>
                `;
            } else if (up.count >= up.maxCount) {
                html += `
                    <div class="shop-item maxed" data-index="${i}">
                        <div class="item-name">MAX</div>
                    </div>
                `;
            } else {
                html += `
                    <div class="shop-item" data-index="${i}">
                        <div class="item-name">${up.name}</div>
                        <div class="item-price">${up.price} Б</div>
                    </div>
                `;
            }
        }
        shopGrid.innerHTML = html;

        document.querySelectorAll('.shop-item:not(.locked):not(.maxed)').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = item.dataset.index;
                if (index !== undefined) buyUpgrade(parseInt(index));
            });
        });
    }

    // ---------- Покупка улучшения ----------
    function buyUpgrade(index) {
        const up = upgrades[index];
        if (!up || !up.unlocked) return;
        if (up.count >= up.maxCount) return;
        if (balance < up.price) return;

        balance -= up.price;
        up.count++;

        switch (up.type) {
            case 'multiplier':
                clickMultiplier *= 2;
                break;
            case 'auto':
                autoIncome += 1;
                break;
            case 'clickAdd':
                clickAdd += 1;
                break;
        }

        up.price = Math.floor(up.price * 2.2);
        
        // Сохраняем прогресс после покупки
        saveGameProgress();
        updateUI();
    }

    // ---------- Клик по айфону ----------
    function handleClick(e) {
        // Предотвращаем выделение и контекстное меню
        e.preventDefault();
        
        const gain = (1 + clickAdd) * clickMultiplier;
        balance += gain;
        
        // Сохраняем прогресс после клика (с небольшой задержкой, чтобы не вызывать сохранение слишком часто)
        if (window.clickTimeout) clearTimeout(window.clickTimeout);
        window.clickTimeout = setTimeout(() => {
            saveGameProgress();
        }, 500);
        
        updateUI();

        currentModelImage.style.transform = 'scale(0.9)';
        setTimeout(() => {
            currentModelImage.style.transform = 'scale(1)';
        }, 80);

        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(8);
        }
    }

    // ---------- Авто-доход ----------
    setInterval(() => {
        if (autoIncome > 0) {
            balance += autoIncome;
            saveGameProgress(); // Сохраняем при авто-доходе
            updateUI();
        }
    }, 1000);

    // ---------- Обработчики для мобильных устройств ----------
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    // Отключаем контекстное меню на всех элементах
    document.addEventListener('contextmenu', preventDefaults);
    
    // Отключаем выделение текста
    document.addEventListener('selectstart', preventDefaults);
    
    // Отключаем стандартные жесты на тач-устройствах
    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('.iphone-click-area, .shop-item')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchend', (e) => {
        e.preventDefault();
    }, { passive: false });

    // ---------- Обработчики событий ----------
    clickerMain.addEventListener('click', handleClick);
    clickerMain.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleClick(e);
    }, { passive: false });
    
    buyX2.addEventListener('click', (e) => {
        e.preventDefault();
        buyUpgrade(0);
    });
    
    closeBtn.addEventListener('click', hideNotification);
    
    // Клик по фону уведомления тоже закрывает
    notification.addEventListener('click', (e) => {
        if (e.target === notification) hideNotification();
    });

    // Обработка загрузки данных из Yandex SDK
    window.addEventListener('yandexLoadData', (event) => {
        if (event.detail && event.detail.data) {
            applyLoadedData(event.detail.data);
        }
    });

    // Обработка смены языка
    window.addEventListener('yandexLanguage', (event) => {
        const lang = event.detail.language;
        console.log('Game language set to:', lang);
        // Здесь можно добавить логику перевода интерфейса
        if (lang === 'en') {
            // Переключить на английский
            document.querySelector('.store-header h1').textContent = 'IPHONE CLICKER';
            document.querySelector('.balance-label').textContent = 'B';
            document.querySelector('.auto-label').innerHTML = '⏱ Auto <span id="autoIncomeDisplay">0</span>';
            document.querySelector('.footer-note').textContent = 'click iPhone — save for new level';
        }
    });

    // Обработка видимости страницы (сохраняем при уходе)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveGameProgress();
        }
    });

    // Сохраняем перед закрытием
    window.addEventListener('beforeunload', () => {
        saveGameProgress();
    });

    // ---------- Инициализация игры ----------
    loadGameProgress();
    
    // Отправляем событие gameReady через SDK после загрузки игры
    setTimeout(() => {
        if (window.ysdk && window.ysdk.features && window.ysdk.features.GameplayAPI) {
            window.ysdk.features.GameplayAPI.gameReady();
        }
    }, 1000);
})();