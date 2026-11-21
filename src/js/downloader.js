export async function fetchFileAsBase64(fileName) {
    // Передаем fileName напрямую — запрос пойдет относительно текущей директории/страницы
    const response = await fetch(fileName);

    if (!response.ok) {
        throw new Error(`Ошибка загрузки файла "${fileName}": ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();

    const base64Content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Берем второй элемент массива (индекс 1) — чистый Base64 после запятой
            const base64 = reader.result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    return {
        name: fileName,
        content: base64Content
    };
}

export async function fetchFileContent(fileName) {
    // Список расширений, которые считаем текстовыми (в нижнем регистре)
    const TEXT_EXTENSIONS = new Set([
        "txt", "md", "csv", "tsv", "log",
        "json", "xml", "yaml", "yml", "toml", "ini", "env",
        "html", "htm", "css", "scss", "less", "svg",
        "js", "mjs", "cjs", "ts", "jsx", "tsx",
        "py", "php", "rb", "java", "c", "cpp", "h", "cs", "go", "rs", "sh", "sql"
    ]);

    const response = await fetch(fileName);

    if (!response.ok) {
        throw new Error(`Ошибка загрузки файла "${fileName}": ${response.status} ${response.statusText}`);
    }

    // Извлекаем расширение (игнорируя возможные GET-параметры вроде ?v=1)
    const cleanName = fileName.split("?")[0].split("#")[0];
    const extension = cleanName.includes(".")
        ? cleanName.split(".").pop().toLowerCase()
        : "";

    const isText = TEXT_EXTENSIONS.has(extension);
    let content;

    if (isText) {
        // Текстовые файлы читаем как обычную UTF-8 строку
        content = await response.text();
    } else {
        // Бинарные файлы конвертируем в Base64
        const blob = await response.blob();
        content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    return {
        name: fileName,
        content
    };
}

export async function fetchFileContent2(fileName) {
    const TEXT_EXTENSIONS = new Set([
        "txt", "md", "csv", "tsv", "log",
        "json", "xml", "yaml", "yml", "toml", "ini", "env",
        "html", "htm", "css", "scss", "less", "svg",
        "js", "mjs", "cjs", "ts", "jsx", "tsx",
        "py", "php", "rb", "java", "c", "cpp", "h", "cs", "go", "rs", "sh", "sql"
    ]);

    const response = await fetch(fileName);

    if (!response.ok) {
        throw new Error(`Ошибка загрузки файла "${fileName}": ${response.status} ${response.statusText}`);
    }

    // Обратите внимание на индексы [0] при отсечении query-параметров и хешей
    const cleanName = fileName.split("?")[0].split("#")[0];
    const extension = cleanName.includes(".")
        ? cleanName.split(".").pop().toLowerCase()
        : "";

    const isText = TEXT_EXTENSIONS.has(extension);
    let content;
    let type;

    if (isText) {
        content = await response.text();
        type = "plaintext";
    } else {
        const blob = await response.blob();
        content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            // Берем второй элемент [1] — сам Base64 после запятой
            reader.onloadend = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        type = "base64";
    }

    return {
        name: fileName,
        type,
        content
    };
}

export async function fetchFileContent3(fileName = "") {
    const TEXT_EXTENSIONS = new Set([
        "txt", "md", "csv", "tsv", "log",
        "json", "xml", "yaml", "yml", "toml", "ini", "env",
        "html", "htm", "css", "scss", "less", "svg",
        "js", "mjs", "cjs", "ts", "jsx", "tsx",
        "py", "php", "rb", "java", "c", "cpp", "h", "cs", "go", "rs", "sh", "sql"
    ]);

    // Отсекаем query-параметры и хеши (например, '/?page=2' -> '/')
    const cleanName = fileName.split("?")[0].split("#")[0].trim();

    // Если путь пустой или заканчивается на '/' (директория/корень), считаем его HTML-страницей
    const isDirectoryOrRoot = cleanName === "" || cleanName.endsWith("/");

    const extension = !isDirectoryOrRoot && cleanName.includes(".")
        ? cleanName.split(".").pop().toLowerCase()
        : "";

    const isText = isDirectoryOrRoot || TEXT_EXTENSIONS.has(extension);

    const response = await fetch(fileName);

    if (!response.ok) {
        throw new Error(`Ошибка загрузки файла "${fileName}": ${response.status} ${response.statusText}`);
    }

    let data;
    let type;

    if (isText) {
        data = await response.text();
        type = "plaintext";
    } else {
        const blob = await response.blob();
        data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        type = "base64";
    }

    return {
        name: fileName,
        type,
        data
    };
}

// Примеры использования:
// fetchFileContent('config.json').then(console.log); // { name: 'config.json', content: '{"key": "value"}' }
// fetchFileContent('logo.png').then(console.log);    // { name: 'logo.png', content: 'iVBORw0KGgoAAAANSUhEUg...' }

