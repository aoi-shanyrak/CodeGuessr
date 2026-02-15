import os
import shutil
import subprocess
import sys
from pathlib import Path

# --- Настройки ---
# Список языков и их расширений файлов
LANGUAGES = {
    "Clojure": [".clj", ".cljs", ".cljc"],
    "Dart": [".dart"],
    "Elixir": [".ex", ".exs"],
    "Groovy": [".groovy", ".gvy", ".gy", ".gsh"],
    "Haskell": [".hs", ".lhs"],
    "Julia": [".jl"],
    "Nim": [".nim"],
    "OCaml": [".ml", ".mli"],
    "Scala": [".scala", ".sc"],
    "Zig": [".zig"],
}

# Целевой размер для каждого языка (в байтах)
TARGET_SIZE_BYTES = 200 * 1024  # 200 КБ
# Директория, куда будут сохраняться все примеры
BASE_DOWNLOAD_DIR = Path("language_examples")
# Временная директория для клонирования репозиториев
TEMP_CLONE_DIR = BASE_DOWNLOAD_DIR / "temp_repos"

# --- Функции ---

def setup_directories():
    """Создает необходимые директории."""
    BASE_DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_CLONE_DIR.mkdir(parents=True, exist_ok=True)
    for lang in LANGUAGES.keys():
        (BASE_DOWNLOAD_DIR / lang).mkdir(parents=True, exist_ok=True)

def get_size(path):
    """Возвращает размер файла или суммарный размер директории в байтах."""
    if path.is_file():
        return path.stat().st_size
    elif path.is_dir():
        total = 0
        for item in path.rglob('*'):
            if item.is_file():
                total += item.stat().st_size
        return total
    return 0

def clone_repo(repo_url, clone_path):
    """Клонирует репозиторий по указанному пути."""
    print(f"  Клонирование {repo_url}...")
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, str(clone_path)],
            check=True,
            capture_output=True,
            text=True,
            timeout=300  # Тайм-аут 5 минут
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"  Ошибка клонирования {repo_url}: {e.stderr}")
        return False
    except Exception as e:
        print(f"  Неожиданная ошибка при клонировании {repo_url}: {e}")
        return False

def collect_files(repo_path, extensions):
    """Собирает все файлы с заданными расширениями из репозитория."""
    files = []
    for ext in extensions:
        files.extend(repo_path.rglob(f"*{ext}"))
    # Исключаем файлы из скрытых папок (например, .git)
    files = [f for f in files if not any(part.startswith('.') for part in f.parts)]
    return files

def copy_files_until_limit(files, target_dir, limit):
    """Копирует файлы, пока не будет достигнут лимит по размеру."""
    total_copied_size = 0
    copied_count = 0
    for file_path in files:
        file_size = file_path.stat().st_size
        if total_copied_size + file_size > limit:
            continue

        dest_path = target_dir / file_path.name
        # Избегаем перезаписи, добавляя суффикс, если файл с таким именем уже есть
        counter = 1
        original_stem = dest_path.stem
        while dest_path.exists():
            dest_path = target_dir / f"{original_stem}_{counter}{dest_path.suffix}"
            counter += 1

        try:
            shutil.copy2(file_path, dest_path)
            total_copied_size += file_size
            copied_count += 1
        except Exception as e:
            print(f"    Ошибка копирования {file_path.name}: {e}")

    return total_copied_size, copied_count

def search_and_download_for_language(lang, extensions):
    """
    Функция для поиска и скачивания примеров для одного языка.
    В текущей версии использует заранее известные популярные репозитории.
    """
    print(f"\n--- Обработка языка: {lang} ---")
    lang_dir = BASE_DOWNLOAD_DIR / lang
    current_size = get_size(lang_dir)

    if current_size >= TARGET_SIZE_BYTES:
        print(f"  Целевой размер ({TARGET_SIZE_BYTES} байт) уже достигнут. Пропуск.")
        return

    # --- Список репозиториев для поиска (можно расширить) ---
    # На основе результатов поиска [citation:3][citation:5][citation:8]
    repos_to_try = {
        "Clojure": ["https://github.com/clojuredatascience/ch1-statistics"],
        "Elixir": ["https://github.com/gothinkster/elixir-phoenix-realworld-example-app"],
        "Haskell": ["https://github.com/bravit/hid-examples"],
        "OCaml": ["https://github.com/lorenzolibardi/ocaml-programming-paradigms-2024-2025"],
        "Scala": ["https://github.com/progfunc-2025-q2/aula-scala-basico"],
        "Zig": ["https://github.com/fulgidus/ziglets"],
    }

    for repo_url in repos_to_try.get(lang, []):
        if current_size >= TARGET_SIZE_BYTES:
            break

        repo_name = repo_url.rstrip('/').split('/')[-1]
        clone_path = TEMP_CLONE_DIR / f"{lang}_{repo_name}"

        if clone_path.exists():
            print(f"  Репозиторий {repo_name} уже был клонирован ранее. Очистка...")
            shutil.rmtree(clone_path)

        if clone_repo(repo_url, clone_path):
            print(f"  Поиск файлов ({', '.join(extensions)})...")
            files = collect_files(clone_path, extensions)

            if not files:
                print("  Файлы с нужными расширениями не найдены.")
                continue

            print(f"  Найдено {len(files)} файлов. Копирование до лимита...")
            copied_size, copied_count = copy_files_until_limit(files, lang_dir, TARGET_SIZE_BYTES - current_size)

            if copied_count > 0:
                print(f"  Скопировано {copied_count} файлов, общий размер: {copied_size} байт.")
                current_size = get_size(lang_dir)
            else:
                print("  Не удалось скопировать файлы (возможно, превышен лимит размера).")

            # Очистка после обработки репозитория
            shutil.rmtree(clone_path)

    if current_size < TARGET_SIZE_BYTES:
        print(f"  Внимание: Не удалось набрать нужный объем ({current_size}/{TARGET_SIZE_BYTES} байт).")
    else:
        print(f"  Готово. Текущий размер: {current_size} байт.")

def main():
    """Главная функция."""
    print("="*60)
    print("Начинаем сбор примеров кода...")
    print("="*60)

    # Проверка наличия git
    if not shutil.which("git"):
        print("Ошибка: Git не найден в системе. Пожалуйста, установите Git.")
        sys.exit(1)

    setup_directories()

    for lang, extensions in LANGUAGES.items():
        search_and_download_for_language(lang, extensions)

    print("\n" + "="*60)
    print("Сбор завершен!")
    print(f"Все файлы сохранены в директории: {BASE_DOWNLOAD_DIR.resolve()}")
    print("="*60)

    # Удаление временной папки, если она пуста
    try:
        TEMP_CLONE_DIR.rmdir()
    except OSError:
        pass  # Папка не пуста, оставляем как есть

if __name__ == "__main__":
    main()
    