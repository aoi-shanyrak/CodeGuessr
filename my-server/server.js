const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const filePath = path.join(__dirname, 'data.txt');

// Раздаём статические файлы из текущей папки (чтобы отдавать HTML)
app.use(express.static(__dirname));

// Эндпоинт для получения окна 3x3
app.get('/api/window', (req, res) => {
    // Получаем координаты центра (row, col) из query-параметров
    let centerRow = parseInt(req.query.row);
    let centerCol = parseInt(req.query.col);

    // Если координаты не переданы или не числа, ставим по умолчанию (5,5)
    if (isNaN(centerRow) || isNaN(centerCol)) {
        centerRow = 5;
        centerCol = 5;
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка чтения файла' });
        }

        // Разбиваем на строки
        const lines = data.split(/\r?\n/);
        const totalRows = lines.length;

        // Создаём матрицу 3x3, заполняем пробелами по умолчанию
        const window = [
            [' ', ' ', ' '],
            [' ', ' ', ' '],
            [' ', ' ', ' ']
        ];

        // Проходим по всем ячейкам окна 3x3 (смещения от -1 до +1 по строкам и столбцам)
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = centerRow + dr;   // реальный номер строки (с 1)
                const c = centerCol + dc;   // реальный номер столбца (с 1)

                // Проверяем, что строка существует в файле (индексы с 1)
                if (r >= 1 && r <= totalRows) {
                    const line = lines[r - 1]; // переводим в индекс массива
                    // Проверяем, что столбец существует в этой строке
                    if (c >= 1 && c <= line.length) {
                        // Запоминаем символ (индексация в строке с 0)
                        window[dr + 1][dc + 1] = line[c - 1];
                    }
                }
                // Если вышли за границы, остаётся пробел (уже установлен)
            }
        }

        // Отправляем JSON с матрицей и координатами центра
        res.json({
            window: window,
            centerRow: centerRow,
            centerCol: centerCol,
            totalRows: totalRows
        });
    });
});

// Старый корневой маршрут можно оставить для проверки, но теперь главная страница — viewer.html
app.get('/', (req, res) => {
    res.send('<a href="/viewer.html">Перейти к просмотрщику</a>');
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('Для доступа из локальной сети: http://' + getLocalIP() + ':' + PORT);
});

function getLocalIP() {
    const nets = require('os').networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '127.0.0.1';
}