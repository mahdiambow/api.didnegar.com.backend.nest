/**
 * Imports legacy users and roles into the existing Nest users/roles structure.
 * Each 1,000-user batch is committed atomically in its own target transaction.
 */
import { createHash } from 'node:crypto';
import {
  BATCH_SIZE,
  asBoolean,
  asNullableString,
  assertColumns,
  assertTables,
  openLegacyConnection,
  openTargetConnection,
  newId,
  requiredEnv,
} from './shared.mjs';

const ROLE_PRIORITY = ['super-admin', 'admin', 'super-seller', 'seller', 'user'];
const LEGACY_ROLE_MAP = new Map([
  ['customer', 'user'],
  // Seller eligibility is read from the legacy sellers table below. WordPress
  // capabilities such as shop_manager must not create a seller by themselves.
  ['shop_manager', 'user'],
  ['subscriber', 'user'],
  ['administrator', 'super-admin'],
  ['dokan_export_order', 'user'],
  ['edit_users', 'admin'],
  ['seller', 'user'],
  ['gform_full_access', 'admin'],
  ['edit_files', 'admin'],
  ['edit_plugins', 'admin'],
  ['edit_themes', 'admin'],
  ['manage_links', 'admin'],
]);

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: npm run db:migrate:users

Reads legacy users through LEGACY_MIGRATED_DB_* and writes batches of ${BATCH_SIZE}
users to the current DB_* database. Each batch is one target transaction.`);
  process.exit(0);
}

function legacyKey(row) {
  return `${row.legacyTable || 'users'}:${row.legacyId}`;
}

function mapLegacyRole(rawRole) {
  return LEGACY_ROLE_MAP.get(String(rawRole || '').trim().toLowerCase()) || null;
}

function usernameBase(value) {
  return String(value || '').trim().slice(0, 20);
}

function uniqueUsername(base, legacyId, usernameOwners, ownId = null) {
  let candidate = base;
  let sequence = 0;
  while (usernameOwners.has(candidate) && usernameOwners.get(candidate) !== ownId) {
    sequence += 1;
    const suffix = `${legacyId ?? 'legacy'}${sequence > 1 ? `-${sequence}` : ''}`;
    candidate = `${base.slice(0, Math.max(1, 20 - suffix.length - 1))}-${suffix}`.slice(0, 20);
  }
  return candidate;
}

function chooseRoles(roles, defaultUserRoleId) {
  const distinct = [...new Map(roles.map((role) => [role.id, role])).values()];
  distinct.sort((a, b) => {
    const aRank = ROLE_PRIORITY.indexOf(a.slug);
    const bRank = ROLE_PRIORITY.indexOf(b.slug);
    return (aRank === -1 ? ROLE_PRIORITY.length : aRank) - (bRank === -1 ? ROLE_PRIORITY.length : bRank)
      || a.slug.localeCompare(b.slug);
  });
  const primary = distinct[0] || { id: defaultUserRoleId, slug: 'user' };
  return {
    roleId: primary.id,
    extraRoleIds: distinct.filter((role) => role.id !== primary.id).map((role) => role.id),
  };
}

async function getBatchRoles(source, userIds) {
  if (!userIds.length) return new Map();
  const [links] = await source.execute(
    `SELECT userId, role FROM user_roles WHERE userId IN (${userIds.map(() => '?').join(', ')})`,
    userIds,
  );
  const byUser = new Map();
  for (const link of links) {
    const id = String(link.userId);
    const roles = byUser.get(id) || [];
    roles.push(String(link.role));
    byUser.set(id, roles);
  }
  return byUser;
}

// The previous migration has already applied the legacy seller rules
// (seller_status = 1 or dokan_enable_selling = yes). This table, rather than
// a WordPress role/capability, is the authoritative seller source.
async function getBatchSellers(source, userIds) {
  if (!userIds.length) return new Map();
  const [rows] = await source.execute(
    `SELECT id, userId, legacyId, legacyTable, isActive, createdAt, updatedAt
     FROM sellers
     WHERE userId IN (${userIds.map(() => '?').join(', ')})`,
    userIds,
  );
  return new Map(rows.map((row) => [String(row.userId), row]));
}

async function loadTargetUsers(target, legacyRows) {
  const usernames = [...new Set(legacyRows.map((row) => usernameBase(row.username)).filter(Boolean))];
  const legacyClauses = legacyRows.map(() => '(legacyTable = ? AND legacyId = ?)').join(' OR ');
  const conditions = [];
  const parameters = [];
  if (usernames.length) {
    conditions.push(`username IN (${usernames.map(() => '?').join(', ')})`);
    parameters.push(...usernames);
  }
  conditions.push(legacyClauses);
  for (const row of legacyRows) parameters.push(row.legacyTable || 'users', row.legacyId);
  const [rows] = await target.execute(
    `SELECT id, legacyId, legacyTable, username, adminId FROM users WHERE ${conditions.join(' OR ')}`,
    parameters,
  );
  return {
    byLegacy: new Map(rows.filter((row) => row.legacyId !== null).map((row) => [legacyKey(row), row])),
    byUsername: new Map(rows.map((row) => [String(row.username), row])),
  };
}

function sellerName(row) {
  return asNullableString(row.displayName, 150)
    || [asNullableString(row.firstName, 100), asNullableString(row.lastName, 100)].filter(Boolean).join(' ')
    || usernameBase(row.username);
}

function sellerSlug(sourceSeller) {
  return `legacy-seller-${createHash('sha1').update(String(sourceSeller.id)).digest('hex').slice(0, 32)}`;
}

async function ensureSeller(target, row, sourceSeller) {
  const slug = sellerSlug(sourceSeller);
  const name = sellerName(row);
  const email = asNullableString(row.email, 150) || `seller-${row.legacyId}@legacy.invalid`;
  const phone = usernameBase(row.username).slice(0, 20);
  const legacyId = Number(sourceSeller.legacyId);
  const legacyTable = String(sourceSeller.legacyTable || 'users');
  const values = [
    legacyId,
    legacyTable,
    name,
    name.slice(0, 200),
    email,
    phone,
    asBoolean(sourceSeller.isActive) ? 'active' : 'inactive',
    sourceSeller.createdAt,
    sourceSeller.updatedAt,
  ];
  let [existing] = await target.execute(
    'SELECT id FROM sellers WHERE legacyTable = ? AND legacyId = ? LIMIT 1',
    [legacyTable, legacyId],
  );
  if (!existing[0]) {
    [existing] = await target.execute('SELECT id FROM sellers WHERE slug = ? LIMIT 1', [slug]);
  }
  if (existing[0]) {
    await target.execute(
      `UPDATE sellers SET legacyId = ?, legacyTable = ?, name = ?, businessName = ?, email = ?,
       phone = ?, status = ?, createdAt = ?, updatedAt = ? WHERE id = ?`,
      [...values, existing[0].id],
    );
    return { id: existing[0].id, created: false };
  }
  const id = newId();
  await target.execute(
    `INSERT INTO sellers (id, legacyId, legacyTable, name, slug, businessName, businessType, email,
     phone, status, settings, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 'other', ?, ?, ?, CAST('{}' AS JSON), ?, ?)`,
    [id, legacyId, legacyTable, name, slug, ...values.slice(3)],
  );
  return { id, created: true };
}

function adminPhone(row) {
  const username = usernameBase(row.username);
  if (username) return username;
  return `legacy-${createHash('sha1').update(String(row.id)).digest('hex').slice(0, 13)}`;
}

async function ensureAdmin(target, row, existingAdminId) {
  const name = sellerName(row);
  const phone = adminPhone(row);
  const email = asNullableString(row.email, 150);
  const legacyId = Number(row.legacyId);
  const legacyTable = String(row.legacyTable || 'users');
  let existing = null;

  if (existingAdminId) {
    const [byId] = await target.execute('SELECT id FROM admins WHERE id = ? LIMIT 1', [existingAdminId]);
    existing = byId[0] || null;
  }
  if (!existing) {
    const [byLegacy] = await target.execute(
      'SELECT id FROM admins WHERE legacyTable = ? AND legacyId = ? LIMIT 1',
      [legacyTable, legacyId],
    );
    existing = byLegacy[0] || null;
  }
  if (!existing) {
    const [byPhone] = await target.execute('SELECT id FROM admins WHERE phone = ? LIMIT 1', [phone]);
    existing = byPhone[0] || null;
  }
  if (!existing && email) {
    const [byEmail] = await target.execute('SELECT id FROM admins WHERE email = ? LIMIT 1', [email]);
    existing = byEmail[0] || null;
  }

  const values = [
    legacyId,
    legacyTable,
    name,
    email,
    phone,
    asBoolean(row.isActive) ? 1 : 0,
    row.createdAt,
    row.updatedAt,
  ];
  if (existing) {
    await target.execute(
      `UPDATE admins SET legacyId = ?, legacyTable = ?, name = ?, email = ?, phone = ?, isActive = ?,
       createdAt = ?, updatedAt = ? WHERE id = ?`,
      [...values, existing.id],
    );
    return { id: existing.id, created: false };
  }

  const id = newId();
  await target.execute(
    `INSERT INTO admins (id, legacyId, legacyTable, name, email, phone, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, ...values],
  );
  return { id, created: true };
}

async function migrateBatch({ source, target, rows, offset, batchNumber, roleBySlug, defaultUserRoleId }) {
  const startedAt = Date.now();
  const rolesByUser = await getBatchRoles(source, rows.map((row) => String(row.id)));
  const sellersByUser = await getBatchSellers(source, rows.map((row) => String(row.id)));
  const users = await loadTargetUsers(target, rows);
  const usernameOwners = new Map([...users.byUsername].map(([username, user]) => [username, user.id]));
  const counters = {
    read: rows.length,
    added: 0,
    updated: 0,
    skipped: 0,
    sellersAdded: 0,
    sellersUpdated: 0,
    adminsAdded: 0,
    adminsUpdated: 0,
    unmappedRoleLinks: 0,
  };

  await target.beginTransaction();
  try {
    for (const row of rows) {
      const base = usernameBase(row.username);
      if (!base) {
        counters.skipped += 1;
        continue;
      }
      const key = legacyKey(row);
      let existing = users.byLegacy.get(key);
      if (!existing) {
        const usernameMatch = users.byUsername.get(base);
        if (usernameMatch && (!usernameMatch.legacyId || legacyKey(usernameMatch) === key)) existing = usernameMatch;
      }
      const username = uniqueUsername(base, row.legacyId, usernameOwners, existing?.id || null);
      const sourceRoles = rolesByUser.get(String(row.id)) || [];
      const mappedSlugs = sourceRoles.map(mapLegacyRole);
      counters.unmappedRoleLinks += mappedSlugs.filter((slug) => !slug).length;
      const mappedRoles = mappedSlugs.map((slug) => (slug ? roleBySlug.get(slug) : null)).filter(Boolean);
      const sourceSeller = sellersByUser.get(String(row.id));
      if (sourceSeller) mappedRoles.push(roleBySlug.get('seller'));
      const { roleId, extraRoleIds } = chooseRoles(mappedRoles, defaultUserRoleId);
      const seller = sourceSeller ? await ensureSeller(target, row, sourceSeller) : null;
      if (seller?.created) counters.sellersAdded += 1;
      if (seller && !seller.created) counters.sellersUpdated += 1;
      const adminRole = mappedRoles.some((role) => role.slug === 'admin' || role.slug === 'super-admin');
      const admin = adminRole ? await ensureAdmin(target, row, existing?.adminId || null) : null;
      if (admin?.created) counters.adminsAdded += 1;
      if (admin && !admin.created) counters.adminsUpdated += 1;
      const values = [
        row.legacyId, row.legacyTable || 'users', username,
        asNullableString(row.password, 255), asNullableString(row.email, 150),
        asNullableString(row.displayName, 150), asNullableString(row.firstName, 100),
        asNullableString(row.lastName, 100), asNullableString(row.website, 255),
        asBoolean(row.isActive) ? 1 : 0, roleId, JSON.stringify(extraRoleIds), seller?.id || null,
        admin?.id || null, row.createdAt, row.updatedAt,
      ];
      if (existing) {
        await target.execute(
          `UPDATE users SET legacyId = ?, legacyTable = ?, username = ?, password = ?, email = ?,
           displayName = ?, firstName = ?, lastName = ?, website = ?, isActive = ?, roleId = ?,
           extraRoleIds = CAST(? AS JSON), sellerId = ?, adminId = ?, createdAt = ?, updatedAt = ? WHERE id = ?`,
          [...values, existing.id],
        );
        if (existing.username !== username) usernameOwners.delete(existing.username);
        Object.assign(existing, { legacyId: row.legacyId, legacyTable: row.legacyTable || 'users', username });
        users.byLegacy.set(key, existing);
        users.byUsername.set(username, existing);
        usernameOwners.set(username, existing.id);
        counters.updated += 1;
      } else {
        const id = newId();
        await target.execute(
          `INSERT INTO users (id, legacyId, legacyTable, username, password, email, displayName,
           firstName, lastName, website, isActive, roleId, extraRoleIds, sellerId, adminId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?)`,
          [id, ...values],
        );
        const inserted = { id, legacyId: row.legacyId, legacyTable: row.legacyTable || 'users', username };
        users.byLegacy.set(key, inserted);
        users.byUsername.set(username, inserted);
        usernameOwners.set(username, id);
        counters.added += 1;
      }
    }
    await target.commit();
  } catch (error) {
    await target.rollback();
    throw error;
  }
  console.log(JSON.stringify({ batch: batchNumber, offset, ...counters, elapsedMs: Date.now() - startedAt }, null, 2));
  return counters;
}

async function main() {
  const sourceDatabase = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
  const targetDatabase = requiredEnv('DB_DATABASE');
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const totals = {
    read: 0,
    added: 0,
    updated: 0,
    skipped: 0,
    sellersAdded: 0,
    sellersUpdated: 0,
    adminsAdded: 0,
    adminsUpdated: 0,
    unmappedRoleLinks: 0,
  };
  try {
    await assertTables(source, sourceDatabase, ['users', 'user_roles', 'sellers'], 'Legacy');
    await assertColumns(source, sourceDatabase, 'sellers', ['id', 'userId', 'legacyId', 'legacyTable', 'isActive'], 'Legacy');
    await assertTables(target, targetDatabase, ['users', 'roles', 'sellers', 'admins'], 'Target');
    await assertColumns(target, targetDatabase, 'users', ['legacyId', 'legacyTable', 'adminId'], 'Target');
    await assertColumns(target, targetDatabase, 'sellers', ['legacyId', 'legacyTable'], 'Target');
    await assertColumns(target, targetDatabase, 'admins', ['legacyId', 'legacyTable'], 'Target');
    const [roleRows] = await target.execute('SELECT id, slug FROM roles');
    const roleBySlug = new Map(roleRows.map((role) => [String(role.slug), role]));
    const defaultUserRoleId = roleBySlug.get('user')?.id;
    if (!defaultUserRoleId) throw new Error('Target role "user" is missing. Seed roles before importing users.');
    const missingMappedRoles = ['seller', 'admin', 'super-admin'].filter((slug) => !roleBySlug.has(slug));
    if (missingMappedRoles.length) {
      throw new Error(`Target role(s) missing. Seed roles before importing users: ${missingMappedRoles.join(', ')}`);
    }
    let offset = 0;
    let batchNumber = 0;
    while (true) {
      const [rows] = await source.execute(
        `SELECT id, legacyId, legacyTable, username, password, email, displayName, firstName,
         lastName, website, isActive, createdAt, updatedAt
         FROM users ORDER BY legacyId ASC, id ASC LIMIT ? OFFSET ?`,
        [BATCH_SIZE, offset],
      );
      if (!rows.length) break;
      batchNumber += 1;
      try {
        const counters = await migrateBatch({ source, target, rows, offset, batchNumber, roleBySlug, defaultUserRoleId });
        for (const key of Object.keys(totals)) totals[key] += counters[key];
      } catch (error) {
        console.error(JSON.stringify({ batch: batchNumber, offset, rolledBack: true, error: error.message }, null, 2));
        throw error;
      }
      offset += rows.length;
      if (rows.length < BATCH_SIZE) break;
    }
    console.log(JSON.stringify({ complete: true, batches: batchNumber, ...totals }, null, 2));
  } finally {
    await Promise.all([source.end(), target.end()]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
