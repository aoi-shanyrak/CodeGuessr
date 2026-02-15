const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const examplesDir = path.join(__dirname, '..', 'examples_dump');
const sourceFiles = collectSourceFiles(examplesDir);
const dataDir = path.join(__dirname, 'app-data');
const usersFile = path.join(dataDir, 'users.json');
const leaderboardFile = path.join(dataDir, 'leaderboard.json');

const sessions = new Map(); // token -> usernameLower

app.use(express.json());
app.use(express.static(__dirname));

ensureStorage();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'read-text.html'));
});

app.post('/api/register', (req, res) => {
    const usernameRaw = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const passwordRaw = typeof req.body?.password === 'string' ? req.body.password : '';

    if (usernameRaw.length < 3 || usernameRaw.length > 32) {
        return res.status(400).json({ error: 'Логин должен быть от 3 до 32 символов' });
    }
    if (!/^[a-zA-Z0-9_\-.]+$/.test(usernameRaw)) {
        return res.status(400).json({ error: 'Логин может содержать только буквы, цифры, _, -, .' });
    }
    if (passwordRaw.length < 6) {
        return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
    }

    const usernameLower = usernameRaw.toLowerCase();
    const users = readJson(usersFile, []);
    if (users.some(user => user.usernameLower === usernameLower)) {
        return res.status(409).json({ error: 'Такой логин уже занят' });
    }

    const passwordHash = hashPassword(passwordRaw);
    users.push({
        username: usernameRaw,
        usernameLower,
        passwordHash,
        createdAt: Date.now()
    });
    writeJson(usersFile, users);

    const token = createSession(usernameLower);
    return res.json({ token, username: usernameRaw });
});

app.post('/api/login', (req, res) => {
    const usernameRaw = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const passwordRaw = typeof req.body?.password === 'string' ? req.body.password : '';

    const usernameLower = usernameRaw.toLowerCase();
    const users = readJson(usersFile, []);
    const user = users.find(entry => entry.usernameLower === usernameLower);

    if (!user || !verifyPassword(passwordRaw, user.passwordHash)) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = createSession(usernameLower);
    return res.json({ token, username: user.username });
});

app.post('/api/logout', requireAuth, (req, res) => {
    sessions.delete(req.authToken);
    return res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
    return res.json({ username: req.user.username });
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

app.get('/api/leaderboard', (req, res) => {
    const byUser = readJson(leaderboardFile, {});
    const users = readJson(usersFile, []);
    const usernameByLower = {};
    for (const user of users) {
        if (user && typeof user.usernameLower === 'string' && typeof user.username === 'string') {
            usernameByLower[user.usernameLower] = user.username;
        }
    }

    const globalBoard = {};
    for (const [usernameLower, perLanguage] of Object.entries(byUser)) {
        if (!perLanguage || typeof perLanguage !== 'object') continue;
        const displayUsername = usernameByLower[usernameLower] || usernameLower;

        for (const [language, entries] of Object.entries(perLanguage)) {
            if (!Array.isArray(entries)) continue;
            if (!globalBoard[language]) globalBoard[language] = [];

            for (const entry of entries) {
                if (!entry || !Number.isFinite(entry.score) || !Number.isFinite(entry.timeLeft)) continue;
                globalBoard[language].push({
                    username: typeof entry.username === 'string' && entry.username.trim()
                        ? entry.username
                        : displayUsername,
                    score: Math.floor(entry.score),
                    timeLeft: Math.floor(entry.timeLeft),
                    round: Number.isFinite(entry.round) ? Math.floor(entry.round) : 0,
                    at: Number.isFinite(entry.at) ? entry.at : Date.now()
                });
            }
        }
    }

    for (const language of Object.keys(globalBoard)) {
        globalBoard[language].sort((a, b) => b.score - a.score || b.timeLeft - a.timeLeft || a.at - b.at);
        globalBoard[language] = globalBoard[language].slice(0, 50);
    }

    return res.json({ leaderboard: globalBoard });
});

app.post('/api/leaderboard/entry', requireAuth, (req, res) => {
    const language = typeof req.body?.language === 'string' ? req.body.language.trim() : '';
    const score = Number.isFinite(req.body?.score) ? Math.floor(req.body.score) : NaN;
    const timeLeft = Number.isFinite(req.body?.timeLeft) ? Math.floor(req.body.timeLeft) : NaN;
    const round = Number.isFinite(req.body?.round) ? Math.floor(req.body.round) : 0;

    if (!language) {
        return res.status(400).json({ error: 'Неверный язык' });
    }
    if (!Number.isFinite(score) || score < 0 || !Number.isFinite(timeLeft) || timeLeft < 0) {
        return res.status(400).json({ error: 'Неверные параметры результата' });
    }

    const byUser = readJson(leaderboardFile, {});
    const usernameLower = req.user.usernameLower;
    if (!byUser[usernameLower]) byUser[usernameLower] = {};
    if (!Array.isArray(byUser[usernameLower][language])) byUser[usernameLower][language] = [];

    byUser[usernameLower][language].push({
        username: req.user.username,
        score,
        timeLeft,
        round,
        at: Date.now()
    });

    byUser[usernameLower][language].sort((a, b) => b.score - a.score || b.timeLeft - a.timeLeft || a.at - b.at);
    byUser[usernameLower][language] = byUser[usernameLower][language].slice(0, 10);

    writeJson(leaderboardFile, byUser);
    return res.json({ ok: true });
});

app.delete('/api/leaderboard', requireAuth, (req, res) => {
    const byUser = readJson(leaderboardFile, {});
    byUser[req.user.usernameLower] = {};
    writeJson(leaderboardFile, byUser);
    return res.json({ ok: true });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('Для доступа из локальной сети: http://' + getLocalIP() + ':' + PORT);
    console.log(`Файлов для игры найдено: ${sourceFiles.length}`);
});

function requireAuth(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const usernameLower = sessions.get(token);
    if (!usernameLower) {
        return res.status(401).json({ error: 'Сессия недействительна' });
    }

    const users = readJson(usersFile, []);
    const user = users.find(entry => entry.usernameLower === usernameLower);
    if (!user) {
        sessions.delete(token);
        return res.status(401).json({ error: 'Пользователь не найден' });
    }

    req.user = user;
    req.authToken = token;
    next();
}

function extractToken(req) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }

    const alt = req.headers['x-auth-token'];
    if (typeof alt === 'string' && alt.trim()) {
        return alt.trim();
    }

    return '';
}

function createSession(usernameLower) {
    const token = crypto.randomUUID();
    sessions.set(token, usernameLower);
    return token;
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, encoded) {
    if (typeof encoded !== 'string' || !encoded.includes(':')) return false;
    const [salt, expectedHash] = encoded.split(':');
    const actualHash = crypto.scryptSync(password, salt, 64).toString('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
    } catch {
        return false;
    }
}

function ensureStorage() {
    fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(usersFile)) writeJson(usersFile, []);
    if (!fs.existsSync(leaderboardFile)) writeJson(leaderboardFile, {});
}

function readJson(filePath, fallback) {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function writeJson(filePath, value) {
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

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
