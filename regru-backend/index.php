<?php
declare(strict_types=1);

const SESSION_LIFETIME = 604800;
const MAX_JSON_BODY = 64000;
const MAX_IMAGE_BYTES = 10485760;

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$configFile = __DIR__ . '/config.php';
$config = is_file($configFile) ? require $configFile : [];
$path = trim((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

function respond(mixed $data, int $status = 200, array $headers = []): never
{
    http_response_code($status);
    foreach ($headers as $name => $value) header($name . ': ' . $value);
    if ($status !== 204) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }
    exit;
}

function fail(string $message, int $status = 400): never
{
    respond(['error' => $message], $status);
}

function database(array $config): PDO
{
    static $pdo;
    if ($pdo instanceof PDO) return $pdo;
    foreach (['db_host', 'db_name', 'db_user', 'db_password'] as $key) {
        if (!isset($config[$key]) || $config[$key] === '' || str_starts_with((string) $config[$key], 'YOUR_')) {
            fail('Сначала настройте подключение к MySQL в api/config.php', 503);
        }
    }
    try {
        $pdo = new PDO(
            'mysql:host=' . $config['db_host'] . ';dbname=' . $config['db_name'] . ';charset=utf8mb4',
            $config['db_user'],
            $config['db_password'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false],
        );
        $pdo->exec("CREATE TABLE IF NOT EXISTS cases (
            id VARCHAR(80) PRIMARY KEY,
            position INT NOT NULL,
            title VARCHAR(160) NOT NULL,
            description TEXT NOT NULL,
            categories TEXT NOT NULL,
            tags TEXT NOT NULL,
            image VARCHAR(2048) NOT NULL,
            href VARCHAR(2048) NOT NULL DEFAULT '',
            featured TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX cases_position_idx (position)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $pdo->exec("CREATE TABLE IF NOT EXISTS case_categories (
            id VARCHAR(80) PRIMARY KEY,
            label VARCHAR(40) NOT NULL,
            position INT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $pdo->exec("CREATE TABLE IF NOT EXISTS admin_login_attempts (
            ip VARCHAR(45) PRIMARY KEY,
            window_started INT NOT NULL,
            attempt_count INT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        $defaults = [
            ['all', 'Все', 1], ['uxui', 'UXUI', 2], ['web', 'Веб-дизайн', 3],
            ['creative', 'Креативы', 4], ['motion', 'Моушен', 5], ['article', 'Статьи', 6],
        ];
        $insertCategory = $pdo->prepare('INSERT IGNORE INTO case_categories (id,label,position) VALUES (?,?,?)');
        foreach ($defaults as $row) $insertCategory->execute($row);

        if ((int) $pdo->query('SELECT COUNT(*) FROM cases')->fetchColumn() === 0) {
            $exportPath = __DIR__ . '/initial-data.json';
            $export = is_file($exportPath) ? json_decode((string) file_get_contents($exportPath), true) : null;
            $seed = is_array($export['cases'] ?? null) ? $export['cases'] : null;
            if (is_array($export['categories'] ?? null)) {
                $pdo->exec('DELETE FROM case_categories');
                $insertCategory = $pdo->prepare('INSERT INTO case_categories (id,label,position) VALUES (?,?,?)');
                foreach ($export['categories'] as $category) {
                    $insertCategory->execute([(string) $category['id'], (string) $category['label'], (int) $category['position']]);
                }
            }
            if (!is_array($seed)) {
                $seedPath = dirname(__DIR__) . '/content/cases.json';
                $plainSeed = is_file($seedPath) ? json_decode((string) file_get_contents($seedPath), true) : null;
                if (is_array($plainSeed)) {
                    $seed = array_map(static fn($item, $index) => [
                        'id' => 'case-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                        'position' => $index,
                        'title' => $item['title'] ?? '', 'description' => $item['description'] ?? '',
                        'categories' => $item['categories'] ?? [], 'tags' => $item['tags'] ?? [],
                        'image' => $item['image'] ?? '', 'href' => $item['href'] ?? '',
                        'featured' => !empty($item['featured']),
                    ], $plainSeed, array_keys($plainSeed));
                }
            }
            if (is_array($seed)) {
                $insert = $pdo->prepare('INSERT IGNORE INTO cases (id,position,title,description,categories,tags,image,href,featured) VALUES (?,?,?,?,?,?,?,?,?)');
                foreach ($seed as $index => $item) {
                    $image = (string) ($item['image'] ?? '');
                    if ($image !== '' && !str_starts_with($image, '/') && !preg_match('~^https://~i', $image)) $image = '/images/' . basename($image);
                    $insert->execute([
                        (string) ($item['id'] ?? 'case-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT)),
                        (int) ($item['position'] ?? $index), (string) ($item['title'] ?? ''), (string) ($item['description'] ?? ''),
                        json_encode($item['categories'] ?? [], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                        json_encode($item['tags'] ?? [], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                        $image, (string) ($item['href'] ?? ''), !empty($item['featured']) ? 1 : 0,
                    ]);
                }
            }
        }
        return $pdo;
    } catch (PDOException $error) {
        error_log('Portfolio database error: ' . $error->getMessage());
        fail('Не удалось подключиться к MySQL или подготовить таблицы. Проверьте настройки базы.', 503);
    }
}

function bodyJson(): array
{
    $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > MAX_JSON_BODY) fail('Слишком большой запрос', 413);
    $decoded = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($decoded)) fail('Не удалось прочитать данные запроса');
    return $decoded;
}

function sameOrigin(): bool
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    return $origin !== '' && strtolower($origin) === strtolower(($secure ? 'https://' : 'http://') . $host);
}

function requireOrigin(): void
{
    if (!sameOrigin()) fail('Запрос отклонён', 403);
}

function requireAdmin(array $config): void
{
    startSession();
    if (empty($_SESSION['portfolio_admin']) || (int) ($_SESSION['portfolio_admin_exp'] ?? 0) <= time()) {
        session_write_close();
        fail('Войдите в админку, чтобы продолжить', 401);
    }
    $_SESSION['portfolio_admin_exp'] = time() + SESSION_LIFETIME;
}

function startSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    session_name('portfolio_admin');
    session_set_cookie_params(['lifetime' => SESSION_LIFETIME, 'path' => '/api/admin', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Strict']);
    ini_set('session.use_strict_mode', '1');
    session_start();
}

function validLabel(mixed $value): ?string
{
    $label = trim((string) $value);
    return $label !== '' && mb_strlen($label) <= 40 ? $label : null;
}

function validCase(array $value, array $allowed): array
{
    $title = trim((string) ($value['title'] ?? ''));
    $description = trim((string) ($value['description'] ?? ''));
    $image = trim((string) ($value['image'] ?? ''));
    $href = trim((string) ($value['href'] ?? ''));
    $categories = array_values(array_unique(array_map('strval', is_array($value['categories'] ?? null) ? $value['categories'] : [])));
    $tags = array_values(array_filter(array_map(static fn($tag) => trim((string) $tag), is_array($value['tags'] ?? null) ? $value['tags'] : []), static fn($tag) => $tag !== ''));
    if ($title === '' || mb_strlen($title) > 160) fail('Заголовок обязателен и должен быть короче 160 символов');
    if ($description === '' || mb_strlen($description) > 5000) fail('Описание обязательно и должно быть короче 5000 символов');
    if ($image === '' || mb_strlen($image) > 2048) fail('Добавьте обложку проекта');
    if (array_diff($categories, $allowed)) fail('Выберите допустимые категории');
    if (count($tags) > 5 || array_filter($tags, static fn($tag) => mb_strlen($tag) > 40)) fail('Можно указать не более пяти тегов по 40 символов');
    if ($href !== '' && (!filter_var($href, FILTER_VALIDATE_URL) || !in_array(strtolower((string) parse_url($href, PHP_URL_SCHEME)), ['https', 'http'], true))) fail('Проверьте ссылку на проект');
    $isLocalImage = preg_match('~^/(images|uploads/cases)/[A-Za-z0-9._-]+$~', $image) === 1;
    if (!$isLocalImage && (!filter_var($image, FILTER_VALIDATE_URL) || parse_url($image, PHP_URL_SCHEME) !== 'https')) fail('Укажите файл сайта или публичную HTTPS-ссылку на обложку');
    return ['title' => $title, 'description' => $description, 'image' => $image, 'href' => $href, 'categories' => $categories, 'tags' => $tags, 'featured' => ($value['featured'] ?? false) === true];
}

function rowsToCases(PDO $db): array
{
    $rows = $db->query('SELECT id,title,description,categories,tags,image,href,featured FROM cases ORDER BY position ASC,created_at ASC')->fetchAll();
    foreach ($rows as &$row) {
        $row['categories'] = json_decode((string) $row['categories'], true) ?: [];
        $row['tags'] = json_decode((string) $row['tags'], true) ?: [];
        $row['featured'] = (bool) $row['featured'];
    }
    return $rows;
}

try {
    if ($path === 'api/cases' && $method === 'GET') respond(rowsToCases(database($config)));
    if ($path === 'api/categories' && $method === 'GET') {
        $rows = database($config)->query('SELECT id,label,position FROM case_categories ORDER BY position,id')->fetchAll();
        respond($rows);
    }

    if ($path === 'api/admin/session' && $method === 'GET') {
        if (empty($config['admin_password_hash']) || $config['admin_password_hash'] === 'REPLACE_WITH_PASSWORD_HASH') {
            respond(['authenticated' => false, 'configured' => false], 503);
        }
        startSession();
        $ok = !empty($_SESSION['portfolio_admin']) && (int) ($_SESSION['portfolio_admin_exp'] ?? 0) > time();
        respond(['authenticated' => $ok], $ok ? 200 : 401);
    }
    if ($path === 'api/admin/session' && $method === 'DELETE') {
        requireOrigin();
        startSession();
        $_SESSION = [];
        session_destroy();
        setcookie('portfolio_admin', '', ['expires' => time() - 3600, 'path' => '/api/admin', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
        respond(null, 204);
    }
    if ($path === 'api/admin/login' && $method === 'POST') {
        requireOrigin();
        if (empty($config['admin_password_hash']) || $config['admin_password_hash'] === 'REPLACE_WITH_PASSWORD_HASH') fail('Сначала задайте пароль админки в api/config.php', 503);
        $body = bodyJson();
        $password = (string) ($body['password'] ?? '');
        if ($password === '' || strlen($password) > 512) fail('Неверный пароль', 401);
        $db = database($config);
        $ip = substr((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 0, 45);
        $db->beginTransaction();
        $query = $db->prepare('SELECT window_started,attempt_count FROM admin_login_attempts WHERE ip=? FOR UPDATE');
        $query->execute([$ip]);
        $attempt = $query->fetch();
        $now = time();
        if ($attempt && $now - (int) $attempt['window_started'] < 900 && (int) $attempt['attempt_count'] >= 10) {
            $db->commit(); fail('Слишком много попыток. Попробуйте через 15 минут', 429);
        }
        if (!$attempt || $now - (int) $attempt['window_started'] >= 900) {
            $upsert = $db->prepare('INSERT INTO admin_login_attempts (ip,window_started,attempt_count) VALUES (?,?,1) ON DUPLICATE KEY UPDATE window_started=VALUES(window_started),attempt_count=1');
            $upsert->execute([$ip, $now]);
        } else {
            $db->prepare('UPDATE admin_login_attempts SET attempt_count=attempt_count+1 WHERE ip=?')->execute([$ip]);
        }
        $db->commit();
        if (!password_verify($password, $config['admin_password_hash'])) fail('Неверный пароль', 401);
        $db->prepare('DELETE FROM admin_login_attempts WHERE ip=?')->execute([$ip]);
        startSession();
        session_regenerate_id(true);
        $_SESSION['portfolio_admin'] = true;
        $_SESSION['portfolio_admin_exp'] = time() + SESSION_LIFETIME;
        respond(['authenticated' => true]);
    }

    if (str_starts_with($path, 'api/admin/')) {
        requireAdmin($config);
        requireOrigin();
        $db = database($config);
        if ($path === 'api/admin/upload' && $method === 'POST') {
            if (empty($_FILES['image']) || !is_uploaded_file($_FILES['image']['tmp_name'])) fail('Не удалось получить файл');
            $file = $_FILES['image'];
            if ((int) $file['size'] > MAX_IMAGE_BYTES) fail('Максимальный размер файла — 10 МБ', 413);
            $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
            $extension = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$mime] ?? null;
            if (!$extension) fail('Поддерживаются JPG, PNG и WebP');
            $directory = dirname(__DIR__) . '/uploads/cases';
            if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) fail('Не удалось создать папку для изображений', 500);
            $filename = 'cases_' . bin2hex(random_bytes(16)) . '.' . $extension;
            if (!move_uploaded_file($file['tmp_name'], $directory . '/' . $filename)) fail('Не удалось сохранить изображение', 500);
            respond(['image' => '/uploads/cases/' . $filename], 201);
        }

        if ($path === 'api/admin/cases' && in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
            $body = bodyJson();
            if ($method === 'DELETE') {
                $id = (string) ($body['id'] ?? '');
                if (!preg_match('/^[a-zA-Z0-9-]{1,80}$/', $id)) fail('Некорректный ID кейса');
                $statement = $db->prepare('DELETE FROM cases WHERE id=?'); $statement->execute([$id]);
                if (!$statement->rowCount()) fail('Кейс не найден', 404);
                respond(['id' => $id]);
            }
            $categoryIds = $db->query("SELECT id FROM case_categories WHERE id <> 'all'")->fetchAll(PDO::FETCH_COLUMN);
            $item = validCase($body, $categoryIds);
            if ($item['featured']) {
                $query = $db->prepare('SELECT COUNT(*) FROM cases WHERE featured=1 AND id<>?');
                $query->execute([$method === 'PUT' ? (string) ($body['id'] ?? '') : '']);
                if ((int) $query->fetchColumn() >= 4) fail('На главной можно показывать не больше четырёх кейсов', 409);
            }
            if ($method === 'POST') {
                $id = 'case-' . bin2hex(random_bytes(12));
                $position = (int) $db->query('SELECT COALESCE(MAX(position),-1)+1 FROM cases')->fetchColumn();
                $query = $db->prepare('INSERT INTO cases (id,position,title,description,categories,tags,image,href,featured) VALUES (?,?,?,?,?,?,?,?,?)');
                $query->execute([$id,$position,$item['title'],$item['description'],json_encode($item['categories'],JSON_UNESCAPED_UNICODE),json_encode($item['tags'],JSON_UNESCAPED_UNICODE),$item['image'],$item['href'],$item['featured'] ? 1 : 0]);
            } else {
                $id = (string) ($body['id'] ?? '');
                if (!preg_match('/^[a-zA-Z0-9-]{1,80}$/', $id)) fail('Некорректный ID кейса');
                $query = $db->prepare('UPDATE cases SET title=?,description=?,categories=?,tags=?,image=?,href=?,featured=? WHERE id=?');
                $query->execute([$item['title'],$item['description'],json_encode($item['categories'],JSON_UNESCAPED_UNICODE),json_encode($item['tags'],JSON_UNESCAPED_UNICODE),$item['image'],$item['href'],$item['featured'] ? 1 : 0,$id]);
                if (!$query->rowCount() && !$db->query('SELECT 1 FROM cases WHERE id=' . $db->quote($id))->fetchColumn()) fail('Кейс не найден', 404);
            }
            respond(['id' => $id], $method === 'POST' ? 201 : 200);
        }

        if ($path === 'api/admin/categories' && in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
            $body = bodyJson();
            if ($method === 'POST') {
                $label = validLabel($body['label'] ?? '');
                if (!$label) fail('Название обязательно и должно быть короче 40 символов');
                $rows = $db->query('SELECT id,label FROM case_categories')->fetchAll();
                if (count($rows) >= 21) fail('Можно создать не больше двадцати вкладок');
                foreach ($rows as $row) if (mb_strtolower($row['label'], 'UTF-8') === mb_strtolower($label, 'UTF-8')) fail('Вкладка с таким названием уже существует');
                $id = 'category-' . bin2hex(random_bytes(12));
                $position = (int) $db->query('SELECT COALESCE(MAX(position),0)+1 FROM case_categories')->fetchColumn();
                $query = $db->prepare('INSERT INTO case_categories (id,label,position) VALUES (?,?,?)'); $query->execute([$id,$label,$position]);
                respond(['id' => $id], 201);
            }
            if ($method === 'PUT') {
                $items = is_array($body['categories'] ?? null) ? $body['categories'] : [];
                $current = $db->query('SELECT id FROM case_categories')->fetchAll(PDO::FETCH_COLUMN);
                $ids = array_map(static fn($item) => (string) ($item['id'] ?? ''), $items);
                $positions = array_map(static fn($item) => (int) ($item['position'] ?? 0), $items);
                $labels = array_map(static fn($item) => validLabel($item['label'] ?? ''), $items);
                if (!$items || count(array_unique($ids)) !== count($ids) || array_diff($current, $ids) || array_diff($ids, $current) || in_array(null, $labels, true)) fail('Проверьте названия и состав вкладок');
                if (count(array_unique(array_map(static fn($value) => mb_strtolower((string) $value, 'UTF-8'), $labels))) !== count($labels)) fail('Названия вкладок должны отличаться друг от друга');
                if (count(array_unique($positions)) !== count($positions) || min($positions) < 1) fail('Порядок должен быть задан уникальными числами от 1');
                $allIndex = array_search('all', $ids, true);
                if ($allIndex === false || $positions[$allIndex] !== 1) fail('Вкладка «Все» должна оставаться первой');
                $db->beginTransaction();
                $update = $db->prepare('UPDATE case_categories SET label=?,position=? WHERE id=?');
                foreach ($items as $index => $item) $update->execute([$labels[$index],$positions[$index],$ids[$index]]);
                $db->commit();
                respond(['ok' => true]);
            }
            $id = (string) ($body['id'] ?? '');
            if ($id === 'all') fail('Вкладку «Все» нельзя удалить');
            if (!preg_match('/^[a-zA-Z0-9-]{1,80}$/', $id)) fail('Некорректный ID вкладки');
            $query = $db->prepare('SELECT id FROM case_categories WHERE id=?'); $query->execute([$id]);
            if (!$query->fetch()) fail('Вкладка не найдена', 404);
            $db->beginTransaction();
            foreach ($db->query('SELECT id,categories FROM cases')->fetchAll() as $case) {
                $categories = json_decode($case['categories'], true) ?: [];
                $next = array_values(array_filter($categories, static fn($categoryId) => $categoryId !== $id));
                if ($next !== $categories) { $update = $db->prepare('UPDATE cases SET categories=? WHERE id=?'); $update->execute([json_encode($next,JSON_UNESCAPED_UNICODE),$case['id']]); }
            }
            $delete = $db->prepare('DELETE FROM case_categories WHERE id=?'); $delete->execute([$id]);
            $db->commit();
            respond(['id' => $id]);
        }
    }
    fail('Маршрут не найден', 404);
} catch (Throwable $error) {
    error_log('Portfolio API error: ' . $error->getMessage());
    fail('Внутренняя ошибка сервера', 500);
}
