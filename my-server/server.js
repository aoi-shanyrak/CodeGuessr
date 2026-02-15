const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const examplesDir = path.join(__dirname, '..', 'examples_dump');
const sourceFiles = collectSourceFiles(examplesDir);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'read-text.html'));
});

app.get('/api/random-code', (req, res) => {
    if (sourceFiles.length === 0) {
        return res.status(500).json({ error: 'Нет файлов в examples_dump' });
    }

    const randomPath = sourceFiles[Math.floor(Math.random() * sourceFiles.length)];
    fs.readFile(randomPath, 'utf8', (err, code) => {
        if (err) {
            return res.status(500).json({ error: 'Не удалось прочитать файл' });
        }

        res.json({
            code: stripComments(code),
            language: detectLanguage(randomPath)
        });
    });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('Для доступа из локальной сети: http://' + getLocalIP() + ':' + PORT);
    console.log(`Файлов для игры найдено: ${sourceFiles.length}`);
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

function collectSourceFiles(rootDir) {
    const files = [];
    const allowedExtensions = new Set([
        '.js', '.ts', '.py', '.rb', '.java', '.kt', '.kts', '.cs',
        '.c', '.h', '.hpp', '.cpp', '.cc', '.cxx', '.php', '.rs',
        '.swift', '.go', '.lua'
    ]);

    function walk(currentDir) {
        let entries = [];
        try {
            entries = fs.readdirSync(currentDir, { withFileTypes: true });
        } catch {
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name.toLowerCase() === 'jupyter') continue;
                walk(fullPath);
                continue;
            }

            if (!entry.isFile()) continue;
            const ext = path.extname(entry.name).toLowerCase();
            if (!allowedExtensions.has(ext)) continue;
            files.push(fullPath);
        }
    }

    walk(rootDir);
    return files;
}

function stripComments(text) {
    // Remove common block comments.
    let result = text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/<!--[\s\S]*?-->/g, '');

    // Remove full-line comments for common syntaxes.
    const commentLine = /^\s*(\/\/|#|--|;|%|REM\b)/i;
    result = result
        .split(/\r?\n/)
        .filter(line => !commentLine.test(line))
        .join('\n');

    return result;
}

function detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const extMap = {
        '.js': 'JavaScript',
        '.ts': 'TypeScript',
        '.py': 'Python',
        '.rb': 'Ruby',
        '.java': 'Java',
        '.kt': 'Kotlin',
        '.kts': 'Kotlin',
        '.cs': 'C#',
        '.c': 'C',
        '.h': 'C/C++',
        '.hpp': 'C++',
        '.cpp': 'C++',
        '.cc': 'C++',
        '.cxx': 'C++',
        '.php': 'PHP',
        '.rs': 'Rust',
        '.swift': 'Swift',
        '.go': 'Go',
        '.lua': 'Lua'
    };

    return extMap[ext] || 'Unknown';
}
