import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { SettingsService } from './settings.service.js';
import { FooterSettings } from './entities/footer-settings.entity.js';
import { CreateFooterDto, UpdateFooterDto } from './dto/footer.dto.js';

const input = {
  address: 'تهران',
  phoneNumber: '02112345678',
  email: 'info@example.com',
  workingHours: '۹ تا ۱۸',
};

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
      repository as unknown as Repository<FooterSettings>,
    ),
  };
}

describe('footer settings', () => {
  it('creates, reads, partially updates, clears social links, deletes and recreates', async () => {
    const { service } = setup();
    await service.createFooter({
      ...input,
      instagram: 'https://instagram.com/example',
    });
    expect(await service.getFooter()).toMatchObject({ ...input, id: 1 });
    expect(await service.updateFooter({ instagram: null })).toMatchObject({
      ...input,
      instagram: null,
    });
    await service.removeFooter();
    await expect(service.getFooter()).rejects.toMatchObject({ status: 404 });
    await expect(service.createFooter(input)).resolves.toMatchObject(input);
  });

  it('rejects duplicate creation without overwriting existing settings', async () => {
    const { service } = setup();
    await service.createFooter(input);
    await expect(
      service.createFooter({ ...input, address: 'other' }),
    ).rejects.toMatchObject({ status: 409 });
    expect((await service.getFooter()).address).toBe(input.address);
  });

  it('returns 404 for update and delete when unconfigured', async () => {
    const { service, repository } = setup();
    await expect(
      service.updateFooter({ address: 'other' }),
    ).rejects.toMatchObject({ status: 404 });
    expect(repository.update).not.toHaveBeenCalled();
    await expect(service.removeFooter()).rejects.toMatchObject({ status: 404 });
  });

  it.each([
    { email: 'invalid' },
    { address: '' },
    { phoneNumber: null },
    { instagram: 'javascript:alert(1)' },
    { telegram: 'not-a-url' },
  ])('rejects invalid create input %j', async (patch) => {
    expect(
      (await validate(plainToInstance(CreateFooterDto, { ...input, ...patch })))
        .length,
    ).toBeGreaterThan(0);
  });

  it('requires contact fields on creation and rejects null contact fields on update', async () => {
    expect(
      (await validate(plainToInstance(CreateFooterDto, {}))).length,
    ).toBeGreaterThan(0);
    expect(
      (await validate(plainToInstance(UpdateFooterDto, { email: null })))
        .length,
    ).toBeGreaterThan(0);
    expect(
      await validate(plainToInstance(UpdateFooterDto, { instagram: null })),
    ).toEqual([]);
    expect(await validate(plainToInstance(UpdateFooterDto, {}))).toEqual([]);
    expect(await validate(plainToInstance(CreateFooterDto, input))).toEqual([]);
  });
});
