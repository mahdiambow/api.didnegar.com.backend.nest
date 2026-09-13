import { EventSubscriber, EntitySubscriberInterface, InsertEvent } from 'typeorm';
import { ULID_LENGTH, newId } from './ulid.js';

/**
 * برای entityهایی که PK رشته‌ای varchar(26) دارند، اگر id ست نشده باشد ULID می‌سازد.
 * singletonهای smallint (مثل footer_settings) دست نخورده می‌مانند.
 */
@EventSubscriber()
export class UlidSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<Record<string, unknown>>): void {
    if (!event.entity) return;

    const idColumn = event.metadata.primaryColumns.find(
      (c) => c.propertyName === 'id',
    );
    if (!idColumn) return;

    const type = String(idColumn.type).toLowerCase();
    if (type !== 'varchar' && type !== 'char' && type !== 'character varying') {
      return;
    }
    if (Number(idColumn.length) !== ULID_LENGTH) return;

    const current = event.entity.id;
    if (current == null || current === '') {
      event.entity.id = newId();
    }
  }
}
