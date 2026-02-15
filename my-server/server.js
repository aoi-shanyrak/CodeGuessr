const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const filePath = path.join(__dirname, 'data.txt');

app.get('/', (req, res) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Ошибка чтения файла');
        }

        const lines = data.split(/\r?\n/);
        if (lines.length < 5) {
            return res.send('В файле меньше 5 строк');
        }

        const fifthLine = lines[4];
        if (fifthLine.length < 5) {
            return res.send('5-я строка содержит меньше 5 символов');
        }

        const fifthChar = fifthLine[4];

        res.send(`
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>5-й символ</title></head>
            <body style="font-family: sans-serif; text-align: center; margin-top: 100px;">
                <h1>5-й символ 5-й строки</h1>
                <p style="font-size: 5rem; color: blue;">"${fifthChar}"</p>
                <p>из файла data.txt</p>
            </body>
            </html>
        `);
    });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('Для доступа из локальной сети: http://' + getLocalIP() + ':' + PORT);
});

// Вспомогательная функция для определения IP в локальной сети
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