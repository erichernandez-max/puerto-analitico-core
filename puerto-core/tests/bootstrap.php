<?php
declare(strict_types=1);

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/../');
}

if (!defined('ARRAY_A')) {
    define('ARRAY_A', 'ARRAY_A');
}
if (!defined('ARRAY_N')) {
    define('ARRAY_N', 'ARRAY_N');
}
if (!defined('OBJECT')) {
    define('OBJECT', 'OBJECT');
}

define('PUERTO_CORE_FILE', __DIR__ . '/../puerto-core.php');
define('PUERTO_CORE_PATH', __DIR__ . '/../');
define('PUERTO_CORE_URL', 'http://localhost/wp-content/plugins/puerto-core/');

// ==========================================
// Clases Mock de WordPress
// ==========================================

if (!class_exists('WP_REST_Server')) {
    class WP_REST_Server
    {
        public const READABLE  = 'GET';
        public const CREATABLE = 'POST';
        public const DELETABLE = 'DELETE';
    }
}

if (!class_exists('WP_REST_Request')) {
    class WP_REST_Request
    {
        private array $params = [];

        public function __construct(private string $method = 'GET', private string $route = '')
        {
        }

        public function set_param(string $k, mixed $v): void
        {
            $this->params[$k] = $v;
        }

        public function get_param(string $k): mixed
        {
            return $this->params[$k] ?? null;
        }

        public function get_params(): array
        {
            return $this->params;
        }
    }
}

if (!class_exists('WP_REST_Response')) {
    class WP_REST_Response
    {
        public function __construct(private mixed $data = null, private int $status = 200)
        {
        }

        public function get_data(): mixed
        {
            return $this->data;
        }

        public function get_status(): int
        {
            return $this->status;
        }

        public function set_status(int $status): void
        {
            $this->status = $status;
        }
    }
}

if (!class_exists('WP_Error')) {
    class WP_Error
    {
        public function __construct(private string $code, private string $message, private mixed $data = null)
        {
        }

        public function get_error_code(): string
        {
            return $this->code;
        }

        public function get_error_message(): string
        {
            return $this->message;
        }

        public function get_error_data(): mixed
        {
            return $this->data;
        }
    }
}

// ==========================================
// Base de datos Mock transaccional para $wpdb
// ==========================================

class PuertoMockWpdb
{
    public string $prefix = 'wp_';
    public int $insert_id = 0;
    public string $last_query = '';

    public array $tables = [];
    private ?array $transactionSnapshot = null;

    public function __construct()
    {
        $this->reset();
    }

    public function reset(): void
    {
        $this->tables = [
            'wp_puerto_consultorios'     => [],
            'wp_puerto_productos'        => [],
            'wp_puerto_usuarios_negocio' => [],
            'wp_puerto_saldos'           => [],
            'wp_puerto_reservas'         => [],
            'wp_puerto_movimientos'      => [],
            'wp_puerto_reglas'           => [],
            'wp_puerto_bloqueos'         => [],
        ];
        $this->transactionSnapshot = null;
        $this->insert_id = 0;
    }

    public function get_charset_collate(): string
    {
        return 'DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci';
    }

    public function query(string $sql): int|bool
    {
        $this->last_query = $sql;
        $sqlTrim = trim($sql);

        if (stripos($sqlTrim, 'START TRANSACTION') === 0) {
            $this->transactionSnapshot = $this->tables;
            return true;
        }

        if (stripos($sqlTrim, 'COMMIT') === 0) {
            $this->transactionSnapshot = null;
            return true;
        }

        if (stripos($sqlTrim, 'ROLLBACK') === 0) {
            if ($this->transactionSnapshot !== null) {
                $this->tables = $this->transactionSnapshot;
                $this->transactionSnapshot = null;
            }
            return true;
        }

        // UPDATE query directa (ej. SaldoManager::renovarSaldosVigentesPorCompra)
        if (preg_match('/UPDATE\s+([^\s]+)\s+SET\s+(.+)\s+WHERE\s+(.+)/is', $sqlTrim, $matches)) {
            $tableName = str_replace('`', '', $matches[1]);
            $whereClause = trim($matches[3]);
            $count = 0;

            if (isset($this->tables[$tableName])) {
                foreach ($this->tables[$tableName] as &$row) {
                    if ($this->matchesWhereClause($row, $whereClause)) {
                        $this->applySetClause($row, $matches[2]);
                        $count++;
                    }
                }
            }
            return $count;
        }

        return true;
    }

    public function prepare(string $query, ...$args): string
    {
        if (isset($args[0]) && is_array($args[0]) && count($args) === 1) {
            $args = $args[0];
        }

        $query = str_replace('%s', "'%s'", $query);
        $escapedArgs = array_map(function ($arg) {
            if ($arg === null) {
                return 'NULL';
            }
            return addslashes((string) $arg);
        }, $args);

        return @vsprintf($query, $escapedArgs) ?: $query;
    }

    public function insert(string $table, array $data, ?array $format = null): int|bool
    {
        if (!isset($this->tables[$table])) {
            $this->tables[$table] = [];
        }

        $row = $data;
        if (!isset($row['id']) && $table !== 'wp_puerto_reglas' && $table !== 'wp_puerto_usuarios_negocio') {
            $this->insert_id++;
            $row['id'] = $this->insert_id;
        } elseif (isset($row['id'])) {
            $this->insert_id = (int) $row['id'];
        }

        $this->tables[$table][] = $row;
        return 1;
    }

    public function update(string $table, array $data, array $where, ?array $format = null, ?array $whereFormat = null): int|bool
    {
        if (!isset($this->tables[$table])) {
            return 0;
        }

        $affected = 0;
        foreach ($this->tables[$table] as &$row) {
            $match = true;
            foreach ($where as $wKey => $wVal) {
                if (!isset($row[$wKey]) || (string) $row[$wKey] !== (string) $wVal) {
                    $match = false;
                    break;
                }
            }

            if ($match) {
                foreach ($data as $dKey => $dVal) {
                    $row[$dKey] = $dVal;
                }
                $affected++;
            }
        }

        return $affected;
    }

    public function replace(string $table, array $data, ?array $format = null): int|bool
    {
        if (!isset($this->tables[$table])) {
            $this->tables[$table] = [];
        }

        // Si existe primary key, actualizar
        $pk = ($table === 'wp_puerto_reglas') ? 'clave' : 'id';
        if (isset($data[$pk])) {
            foreach ($this->tables[$table] as &$row) {
                if (isset($row[$pk]) && (string) $row[$pk] === (string) $data[$pk]) {
                    $row = $data;
                    return 1;
                }
            }
        }

        $this->tables[$table][] = $data;
        return 1;
    }

    public function get_results(string $query, string $output = 'OBJECT'): array
    {
        $this->last_query = $query;
        $table = $this->extractTableFromQuery($query);

        if (!$table || !isset($this->tables[$table])) {
            return [];
        }

        $rows = $this->tables[$table];
        $filtered = [];

        foreach ($rows as $row) {
            if ($this->evalRowForQuery($row, $query)) {
                $filtered[] = ($output === 'ARRAY_A') ? $row : (object) $row;
            }
        }

        return $filtered;
    }

    public function get_row(string $query, string $output = 'OBJECT'): array|object|null
    {
        $results = $this->get_results($query, $output);
        return $results[0] ?? null;
    }

    public function get_var(string $query): mixed
    {
        $this->last_query = $query;

        // COUNT(*)
        if (preg_match('/SELECT\s+COUNT\(\*\)\s+FROM\s+([^\s]+)(?:\s+WHERE\s+(.+))?/i', $query, $matches)) {
            $table = str_replace('`', '', $matches[1]);
            $where = $matches[2] ?? '';
            $rows = $this->tables[$table] ?? [];
            if ($where === '') {
                return count($rows);
            }
            $c = 0;
            foreach ($rows as $row) {
                if ($this->evalRowForQuery($row, $query)) {
                    $c++;
                }
            }
            return $c;
        }

        // SUM(...) de saldos
        if (preg_match('/SELECT\s+COALESCE\(SUM\(horas_compradas\s*-\s*horas_consumidas\),\s*0(?:\.00)?\)\s+FROM\s+([^\s]+)/i', $query, $matches)) {
            $table = str_replace('`', '', $matches[1]);
            $sum = 0.0;
            foreach ($this->tables[$table] ?? [] as $row) {
                if ($this->evalRowForQuery($row, $query)) {
                    $sum += ((float) $row['horas_compradas'] - (float) $row['horas_consumidas']);
                }
            }
            return $sum;
        }

        // SUM horas de reservas
        if (preg_match('/SELECT\s+COALESCE\(SUM\(TIMESTAMPDIFF\(MINUTE,\s*fecha_inicio,\s*fecha_fin\)\s*\/\s*60\.0\),\s*0(?:\.00)?\)\s+FROM\s+([^\s]+)/i', $query, $matches)) {
            $table = str_replace('`', '', $matches[1]);
            $sum = 0.0;
            foreach ($this->tables[$table] ?? [] as $row) {
                if ($this->evalRowForQuery($row, $query)) {
                    $min = (strtotime($row['fecha_fin']) - strtotime($row['fecha_inicio'])) / 60.0;
                    $sum += ($min / 60.0);
                }
            }
            return $sum;
        }

        $row = $this->get_row($query, 'ARRAY_A');
        if ($row) {
            return reset($row);
        }

        return null;
    }

    public function get_col(string $query): array
    {
        $results = $this->get_results($query, 'ARRAY_A');
        $col = [];
        foreach ($results as $row) {
            $col[] = reset($row);
        }
        return $col;
    }

    private function extractTableFromQuery(string $query): ?string
    {
        if (preg_match('/FROM\s+`?([a-zA-Z0-9_]+)`?/i', $query, $m)) {
            return $m[1];
        }
        return null;
    }

    private function evalRowForQuery(array $row, string $query): bool
    {
        // Consultorio ID
        if (preg_match('/consultorio_id\s*=\s*(\d+)/i', $query, $m)) {
            $cid = (int) $m[1];
            if (isset($row['consultorio_id']) && (int) $row['consultorio_id'] !== $cid) {
                // Bloqueos con consultorio_id IS NULL o = cid
                if (stripos($query, 'consultorio_id IS NULL') !== false) {
                    if ($row['consultorio_id'] !== null && (int) $row['consultorio_id'] !== $cid) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }

        // Nombre
        if (preg_match('/nombre\s*=\s*\'([^\']+)\'/i', $query, $m)) {
            if (isset($row['nombre']) && $row['nombre'] !== $m[1]) {
                return false;
            }
        }

        // Clave
        if (preg_match('/clave\s*=\s*\'([^\']+)\'/i', $query, $m)) {
            if (isset($row['clave']) && $row['clave'] !== $m[1]) {
                return false;
            }
        }

        // Filtro congelado en JOIN usuarios_negocio
        if (stripos($query, 'congelado') !== false) {
            $uid = (int) ($row['user_id'] ?? 0);
            foreach ($this->tables['wp_puerto_usuarios_negocio'] ?? [] as $uRow) {
                if ((int) ($uRow['user_id'] ?? 0) === $uid) {
                    if (($uRow['estado'] ?? '') === 'congelado') {
                        return false;
                    }
                }
            }
        }

        // User ID
        if (preg_match('/user_id\s*=\s*(\d+)/i', $query, $m)) {
            if (isset($row['user_id']) && (int) $row['user_id'] !== (int) $m[1]) {
                return false;
            }
        }

        // Serie ID
        if (preg_match('/serie_id\s*=\s*\'?([a-zA-Z0-9\-]+)\'?/i', $query, $m)) {
            if (!isset($row['serie_id']) || (string) $row['serie_id'] !== $m[1]) {
                return false;
            }
        }

        // Reserva ID
        if (preg_match('/reserva_id\s*=\s*(\d+)/i', $query, $m)) {
            if (isset($row['reserva_id']) && (int) $row['reserva_id'] !== (int) $m[1]) {
                return false;
            }
        }

        // ID específico
        if (preg_match('/WHERE\s+(?:.*?\s+)?id\s*=\s*(\d+)/i', $query, $m)) {
            if (isset($row['id']) && (int) $row['id'] !== (int) $m[1]) {
                return false;
            }
        }

        // id != X
        if (preg_match('/id\s*!=\s*(\d+)/i', $query, $m)) {
            if (isset($row['id']) && (int) $row['id'] === (int) $m[1]) {
                return false;
            }
        }

        // Estado IN (...)
        if (preg_match('/estado\s+IN\s*\(([^\)]+)\)/i', $query, $m)) {
            $estados = array_map(function ($s) {
                return trim($s, " '\t\n\r\0\x0B");
            }, explode(',', $m[1]));
            if (isset($row['estado']) && !in_array($row['estado'], $estados, true)) {
                return false;
            }
        } elseif (preg_match('/estado\s*=\s*\'([^\']+)\'/i', $query, $m)) {
            if (isset($row['estado']) && $row['estado'] !== $m[1]) {
                return false;
            }
        }

        // Recurrente
        if (preg_match('/recurrente\s*=\s*(\d)/i', $query, $m)) {
            if (isset($row['recurrente']) && (int) $row['recurrente'] !== (int) $m[1]) {
                return false;
            }
        }

        // Tipo
        if (preg_match('/tipo\s*=\s*\'([^\']+)\'/i', $query, $m)) {
            if (isset($row['tipo']) && $row['tipo'] !== $m[1]) {
                return false;
            }
        }

        // Overlap fechas: fecha_inicio < fin AND fecha_fin > inicio
        if (preg_match('/fecha_inicio\s*<\s*\'([^\']+)\'\s+AND\s+fecha_fin\s*>\s*\'([^\']+)\'/i', $query, $m)) {
            $qFin = $m[1];
            $qIni = $m[2];
            if (isset($row['fecha_inicio'], $row['fecha_fin'])) {
                if (!($row['fecha_inicio'] < $qFin && $row['fecha_fin'] > $qIni)) {
                    return false;
                }
            }
        }

        // Fecha_vencimiento >= fecha
        if (preg_match('/fecha_vencimiento\s*>=\s*\'([^\']+)\'/i', $query, $m)) {
            if (isset($row['fecha_vencimiento']) && $row['fecha_vencimiento'] < $m[1]) {
                return false;
            }
        }

        // Fecha_vencimiento < fecha
        if (preg_match('/fecha_vencimiento\s*<\s*\'([^\']+)\'/i', $query, $m)) {
            if (isset($row['fecha_vencimiento']) && $row['fecha_vencimiento'] >= $m[1]) {
                return false;
            }
        }

        // consumida_en IS NULL
        if (stripos($query, 'consumida_en IS NULL') !== false) {
            if (isset($row['consumida_en']) && $row['consumida_en'] !== null) {
                return false;
            }
        }

        // BETWEEN fechas
        if (preg_match('/fecha_inicio\s+BETWEEN\s+\'([^\']+)\'\s+AND\s+\'([^\']+)\'/i', $query, $m)) {
            if (isset($row['fecha_inicio'])) {
                if ($row['fecha_inicio'] < $m[1] || $row['fecha_inicio'] > $m[2]) {
                    return false;
                }
            }
        }

        return true;
    }

    private function matchesWhereClause(array $row, string $where): bool
    {
        // Simple evaluator for user_id = X AND estado = 'vigente' AND id != Y
        if (preg_match('/user_id\s*=\s*(\d+)/i', $where, $m)) {
            if ((int) $row['user_id'] !== (int) $m[1]) {
                return false;
            }
        }
        if (preg_match('/estado\s*=\s*\'([^\']+)\'/i', $where, $m)) {
            if ($row['estado'] !== $m[1]) {
                return false;
            }
        }
        if (preg_match('/id\s*!=\s*(\d+)/i', $where, $m)) {
            if ((int) $row['id'] === (int) $m[1]) {
                return false;
            }
        }
        return true;
    }

    private function applySetClause(array &$row, string $setClause): void
    {
        if (preg_match('/horas_consumidas\s*=\s*GREATEST\(0(?:\.00)?,\s*horas_consumidas\s*-\s*\'?([0-9\.]+)\'?\)/i', $setClause, $mGre)) {
            $row['horas_consumidas'] = max(0.0, round((float) ($row['horas_consumidas'] ?? 0) - (float) $mGre[1], 2));
        }

        if (stripos($setClause, "THEN 'vigente'") !== false) {
            $row['estado'] = 'vigente';
        }

        if (preg_match('/fecha_vencimiento\s*=\s*\'([^\']+)\'/i', $setClause, $mFv)) {
            $row['fecha_vencimiento'] = $mFv[1];
        }
        if (preg_match('/renovado_por_compra_id\s*=\s*(\d+)/i', $setClause, $mRen)) {
            $row['renovado_por_compra_id'] = (int) $mRen[1];
        }
    }
}

global $wpdb;
$wpdb = new PuertoMockWpdb();

// ==========================================
// Funciones globales de WordPress Mock
// ==========================================

$GLOBALS['puerto_current_user_id'] = 1;
$GLOBALS['puerto_current_user_caps'] = ['puerto_reservar' => true, 'manage_options' => true];
$GLOBALS['puerto_cache'] = [];

function get_current_user_id(): int
{
    return $GLOBALS['puerto_current_user_id'] ?? 1;
}

function current_user_can(string $cap): bool
{
    return !empty($GLOBALS['puerto_current_user_caps'][$cap]);
}

function get_user_by(string $field, mixed $val): ?object
{
    return (object)[
        'ID'           => $val,
        'display_name' => "Usuario #{$val}",
        'user_email'   => "usuario{$val}@puertoanalitico.mx",
    ];
}

function current_time(string $type = 'mysql'): string
{
    return date('Y-m-d H:i:s');
}

function wp_generate_uuid4(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function wp_cache_get(string $key, string $group = ''): mixed
{
    return $GLOBALS['puerto_cache'][$group . ':' . $key] ?? false;
}

function wp_cache_set(string $key, mixed $data, string $group = '', int $expire = 0): bool
{
    $GLOBALS['puerto_cache'][$group . ':' . $key] = $data;
    return true;
}

function wp_cache_delete(string $key, string $group = ''): bool
{
    unset($GLOBALS['puerto_cache'][$group . ':' . $key]);
    return true;
}

function update_option(string $opt, mixed $val): bool
{
    return true;
}

function get_option(string $opt, mixed $default = false): mixed
{
    return $default;
}

function flush_rewrite_rules(): void
{
}

function add_action(string $tag, callable $cb): void
{
}

function register_rest_route(string $ns, string $route, array $args): void
{
}

function load_plugin_textdomain(string $domain, mixed $deprecated = false, ?string $plugin_rel_path = null): bool
{
    return true;
}

function __($text, $domain = 'default'): string
{
    return $text;
}

function _e($text, $domain = 'default'): void
{
    echo $text;
}

function wp_next_scheduled(string $hook): int|false
{
    return false;
}

function wp_schedule_event(int $timestamp, string $recurrence, string $hook): bool
{
    return true;
}

function wp_clear_scheduled_hook(string $hook): int|false
{
    return 1;
}

// Carga de autoloader PSR-4 nativo de Puerto Core
require_once PUERTO_CORE_PATH . 'includes/autoloader.php';
require_once PUERTO_CORE_PATH . 'includes/helpers.php';
