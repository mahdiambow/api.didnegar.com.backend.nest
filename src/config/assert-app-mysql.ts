/** Schema-only MySQL on the server — Nest must never use it as app DB. */
const BLOCKED_DB_HOSTS = new Set([
  'migration-mysql',
  'didnegar_migration_mysql',
]);

export function assertAppMysqlTarget(
  host: string | undefined,
  port: number | string | undefined,
) {
  const normalizedHost = (host ?? '').trim().toLowerCase();
  const normalizedPort = Number(port);
  if (BLOCKED_DB_HOSTS.has(normalizedHost) || normalizedPort === 3307) {
    throw new Error(
      `Refusing DB connection to schema migration MySQL ` +
        `(DB_HOST=${host}, DB_PORT=${port}). ` +
        `Use the app MySQL instead (e.g. new-mysql / mysql), never migration-mysql.`,
    );
  }
}
