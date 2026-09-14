-- Runs only on first MySQL volume init.
-- Creates Nest DB (if missing) + legacy dump DB for db:import:legacy.

CREATE DATABASE IF NOT EXISTS `didnegar`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `didnegar_new`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON `didnegar`.* TO 'didnegar'@'%';
GRANT ALL PRIVILEGES ON `didnegar_new`.* TO 'didnegar'@'%';
FLUSH PRIVILEGES;
