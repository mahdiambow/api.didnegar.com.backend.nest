/** Schema-only MySQL on the server — Nest must never use it as app DB. */
const BLOCKED_DB_HOSTS = new Set([
  'migration-mysql',
  'didnegar_migration_mysql',
]);

/** Legacy dump DB — only for import scripts as SOURCE_DATABASE, never as DB_DATABASE. */
const BLOCKED_APP_DATABASES = new Set(['didnegar_new']);

export function assertAppMysqlTarget(
  host: string | undefined,
  port: number | string | undefined,
  database?: string | undefined,
) {
  const normalizedHost = (host ?? '').trim().toLowerCase();
  const normalizedPort = Number(port);
  if (blockedHosts(normalizedHost) || normalizedPort === 3307) {
    throw new Error(
      `Refusing DB connection to schema migration MySQL ` +
        `(DB_HOST=${host}, DB_PORT=${port}). ` +
        `Use the app MySQL instead (e.g. new-mysql / mysql), never migration-mysql.`,
    );
  }

  const normalizedDatabase = (database ?? '').trim().toLowerCase();
  if (BLOCKED_APP_DATABASES.has(normalizedDatabase)) {
    throw new Error(
      `Refusing to use legacy dump database as app DB ` +
        `(DB_DATABASE=${database}). ` +
        `Use the Nest database (e.g. didnegar). ` +
        `didnegar_new is only allowed as SOURCE_DATABASE for one-off imports.`,
    );
  }
}

function blockedHosts(host: string) {
  return BLOCKED_DB_HOSTS.has(host);
}
