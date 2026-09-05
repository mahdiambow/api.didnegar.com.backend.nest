import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { SettingsService } from './settings.service.js';
import { FooterSettings } from './entities/footer-settings.entity.js';
import { HeaderSettings } from './entities/header-settings.entity.js';
import { CreateHeaderDto, UpdateHeaderDto } from './dto/header.dto.js';

const input = { text: 'ارسال رایگان' };

function setup() {
  let row: Record<string, unknown> | null = null;
  const repository = {
    findOneBy: vi.fn(async () => row),
    insert: vi.fn(async (data) => {
      if (row) throw { code: '23505' };
      row = { ...data };
    }),
    update: vi.fn(async (_where, data) => {
      row = { ...row, ...data };
    }),
    delete: vi.fn(async () => {
      const affected = row ? 1 : 0;
      row = null;
      return { affected };
    }),
  };
  return {
    repository,
    service: new SettingsService(
      {} as Repository<FooterSettings>,
      repository as unknown as Repository<HeaderSettings>,
    ),
  };
}

describe('header settings', () => {
  it('creates, reads, partially updates, clears social links, deletes and recreates', async () => {
    const { service } = setup();
    await service.createHeader({
      ...input,
      instagram: 'https://instagram.com/example',
    });
    expect(await service.getHeader()).toMatchObject({ ...input, id: 1 });
    expect(await service.updateHeader({ instagram: null })).toMatchObject({
      ...input,
      instagram: null,
    });
    await service.removeHeader();
    await expect(service.getHeader()).rejects.toMatchObject({ status: 404 });
    await expect(service.createHeader(input)).resolves.toMatchObject(input);
  });

  it('rejects duplicate creation without overwriting existing settings', async () => {
    const { service } = setup();
    await service.createHeader(input);
    await expect(
      service.createHeader({ ...input, text: 'other' }),
    ).rejects.toMatchObject({ status: 409 });
    expect((await service.getHeader()).text).toBe(input.text);
  });

  it('returns 404 for update and delete when unconfigured', async () => {
    const { service, repository } = setup();
    await expect(service.updateHeader({ text: 'other' })).rejects.toMatchObject(
      { status: 404 },
    );
    expect(repository.update).not.toHaveBeenCalled();
    await expect(service.removeHeader()).rejects.toMatchObject({ status: 404 });
  });

  it.each([
    { text: 123 },
    { text: '' },
    { text: null },
    { instagram: 'javascript:alert(1)' },
    { telegram: 'not-a-url' },
  ])('rejects invalid create input %j', async (patch) => {
    expect(
      (await validate(plainToInstance(CreateHeaderDto, { ...input, ...patch })))
        .length,
    ).toBeGreaterThan(0);
  });

  it('requires text on creation and rejects null text on update', async () => {
    expect(
      (await validate(plainToInstance(CreateHeaderDto, {}))).length,
    ).toBeGreaterThan(0);
    expect(
      (await validate(plainToInstance(UpdateHeaderDto, { text: null }))).length,
    ).toBeGreaterThan(0);
    expect(
      await validate(plainToInstance(UpdateHeaderDto, { instagram: null })),
    ).toEqual([]);
    expect(await validate(plainToInstance(UpdateHeaderDto, {}))).toEqual([]);
    expect(await validate(plainToInstance(CreateHeaderDto, input))).toEqual([]);
  });
});
