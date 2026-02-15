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
            code: normalizeForGame(stripComments(code)),
            language: detectLanguage(randomPath)
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
    console.log(`Файлов для игры найдено: ${sourceFiles.length}`);
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

function collectSourceFiles(rootDir) {
    const files = [];
    const allowedExtensions = new Set([
        '.js', '.ts', '.py', '.rb', '.java', '.kt', '.kts', '.cs',
        '.c', '.h', '.hpp', '.cpp', '.cc', '.cxx', '.php', '.rs',
        '.swift', '.go', '.lua', '.hs', '.scala', '.dart', '.ex', '.clj', '.ml', '.groovy', '.jl', '.nim', '.zig'
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
            if (countLines(fullPath) < 50) continue;
            files.push(fullPath);
        }
    }

    walk(rootDir);
    return files;
}

function countLines(filePath) {
    try {
        const text = fs.readFileSync(filePath, 'utf8');
        if (text.length === 0) return 0;
        return text.split(/\r?\n/).length;
    } catch {
        return 0;
    }
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

function normalizeTabs(text) {
    return text.replace(/\t/g, '    ');
}

function normalizeForGame(text) {
    const withSpaces = normalizeTabs(text);
    const lines = withSpaces.split(/\r?\n/);

    // Drop empty lines at file edges to avoid large blank margins.
    while (lines.length > 0 && lines[0].trim() === '') lines.shift();
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
    if (lines.length === 0) return '';

    // Remove common left indentation while preserving relative nesting.
    let minIndent = Infinity;
    for (const line of lines) {
        if (line.trim() === '') continue;
        const match = line.match(/^ */);
        const indent = match ? match[0].length : 0;
        if (indent < minIndent) minIndent = indent;
    }
    if (!Number.isFinite(minIndent)) minIndent = 0;

    return lines.map(line => line.slice(Math.min(minIndent, line.length))).join('\n');
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
        '.lua': 'Lua',
        '.hs': 'Haskell',
        '.scala': 'Scala',
        '.dart': 'Dart',
        '.ex': 'Elixir',
        '.clj': 'Clojure',
        '.ml': 'OCaml',
        '.groovy': 'Groovy',
        '.jl': 'Julia',
        '.nim': 'Nim',
        '.zig': 'Zig'
    };

    return extMap[ext] || 'Unknown';
}
