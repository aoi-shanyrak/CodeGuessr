const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const filePath = path.join(__dirname, 'data.txt');

app.use(express.static(__dirname));

// Размер окна (9x9)
const WINDOW_SIZE = 9;
const HALF = Math.floor(WINDOW_SIZE / 2); // 4

app.get('/api/window', (req, res) => {
    let centerRow = parseInt(req.query.row);
    let centerCol = parseInt(req.query.col);

    if (isNaN(centerRow) || isNaN(centerCol)) {
        centerRow = 5;
        centerCol = 5;
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка чтения файла' });
        }

        const lines = data.split(/\r?\n/);
        const totalRows = lines.length;

        // Создаём матрицу WINDOW_SIZE x WINDOW_SIZE, заполняем пробелами
        const window = Array.from({ length: WINDOW_SIZE }, () => Array(WINDOW_SIZE).fill(' '));

        for (let dr = -HALF; dr <= HALF; dr++) {
            for (let dc = -HALF; dc <= HALF; dc++) {
                const r = centerRow + dr;   // номер строки (1‑индексация)
                const c = centerCol + dc;   // номер столбца (1‑индексация)

                if (r >= 1 && r <= totalRows) {
                    const line = lines[r - 1];
                    if (c >= 1 && c <= line.length) {
                        const winRow = dr + HALF;
                        const winCol = dc + HALF;
                        window[winRow][winCol] = line[c - 1];
                    }
                }
            }
        }

        res.json({
            window: window,
            centerRow: centerRow,
            centerCol: centerCol,
            totalRows: totalRows
        });
    });
});

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