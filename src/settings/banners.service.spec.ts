import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { BannersService } from './banners.service.js';
import { Banner } from './entities/banner.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto.js';
import { BannerPage, BannerSection } from './types/banner.enums.js';

const categoryId = '550e8400-e29b-41d4-a716-446655440000';
const items = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    mediaUrl: `https://example.com/${i}.jpg`,
  }));
const input = {
  page: BannerPage.HOME,
  section: BannerSection.SINGLE_BANNER,
  items: items(1),
};
function setup() {
  let row: Banner | null = null;
  const repository = {
    create: vi.fn((data) => data),
    save: vi.fn(async (data) => (row = { ...data, id: categoryId })),
    findOneBy: vi.fn(async () => (row ? { ...row } : null)),
    findAndCount: vi.fn(async () => [row ? [row] : [], row ? 1 : 0]),
    delete: vi.fn(async () => {
      const affected = row ? 1 : 0;
      row = null;
      return { affected };
    }),
  };
  const categories = { existsBy: vi.fn(async () => true) };
  return {
    repository,
    categories,
    service: new BannersService(
      repository as unknown as Repository<Banner>,
      categories as unknown as Repository<Category>,
    ),
  };
}

describe('banner settings', () => {
  it.each([
    [BannerSection.MAIN_SLIDER, 4],
    [BannerSection.THREE_IMAGES, 3],
    [BannerSection.NARROW_BANNER, 1],
    [BannerSection.VIDEO, 1],
    [BannerSection.TWO_IMAGES, 2],
    [BannerSection.SINGLE_BANNER, 1],
  ])(
    'creates home section %s with %i ordered items',
    async (section, count) => {
      const { service } = setup();
      const result = await service.create({
        ...input,
        section,
        items: items(count),
      });
      expect(result.items).toEqual(items(count));
      expect(result.categoryId).toBeNull();
    },
  );

  it.each([
    [BannerSection.THREE_IMAGES, 2],
    [BannerSection.TWO_IMAGES, 3],
    [BannerSection.NARROW_BANNER, 2],
    [BannerSection.VIDEO, 2],
    [BannerSection.MAIN_SLIDER, 0],
    [BannerSection.MAIN_SLIDER, 51],
  ])('rejects wrong item counts in %s', async (section, count) => {
    const { service, repository } = setup();
    await expect(
      service.create({ ...input, section, items: items(count) }),
    ).rejects.toMatchObject({ status: 422 });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it.each([
    { page: BannerPage.HOME, section: BannerSection.SIDEBAR },
    { categoryId },
    { page: BannerPage.CATEGORY_SIDEBAR, section: BannerSection.SIDEBAR },
    { page: BannerPage.CATEGORY_SIDEBAR, categoryId },
  ])('rejects incompatible placements %j', async (patch) => {
    const { service } = setup();
    await expect(service.create({ ...input, ...patch })).rejects.toMatchObject({
      status: 422,
    });
  });

  it('requires an existing category for sidebar banners', async () => {
    const { service, categories } = setup();
    const sidebar = {
      ...input,
      page: BannerPage.CATEGORY_SIDEBAR,
      section: BannerSection.SIDEBAR,
      categoryId,
    };
    await expect(service.create(sidebar)).resolves.toMatchObject(sidebar);
    categories.existsBy.mockResolvedValue(false);
    await expect(service.create(sidebar)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('validates partial updates against the saved section and allows moving placements together', async () => {
    const { service } = setup();
    const banner = await service.create({
      ...input,
      section: BannerSection.THREE_IMAGES,
      items: items(3),
    });
    await expect(
      service.update(banner.id, { items: items(2) }),
    ).rejects.toMatchObject({ status: 422 });
    expect((await service.findOne(banner.id)).items).toHaveLength(3);
    await expect(
      service.update(banner.id, {
        section: BannerSection.TWO_IMAGES,
        items: items(2),
      }),
    ).resolves.toMatchObject({ section: BannerSection.TWO_IMAGES });
    await expect(
      service.update(banner.id, {
        page: BannerPage.CATEGORY_SIDEBAR,
        section: BannerSection.SIDEBAR,
        categoryId,
        items: items(1),
      }),
    ).resolves.toMatchObject({ categoryId });
  });

  it('maps concurrent duplicate inserts to conflict', async () => {
    const { service, repository } = setup();
    repository.save.mockRejectedValueOnce({ code: '23505' });
    await expect(service.create(input)).rejects.toMatchObject({ status: 409 });
  });

  it('filters and paginates the list and returns 404 after deletion', async () => {
    const { service, repository } = setup();
    const banner = await service.create(input);
    await service.findAll({
      page: BannerPage.HOME,
      section: BannerSection.SINGLE_BANNER,
      pageNumber: 2,
      limit: 5,
    });
    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { page: BannerPage.HOME, section: BannerSection.SINGLE_BANNER },
        skip: 5,
        take: 5,
      }),
    );
    await service.remove(banner.id);
    await expect(service.findOne(banner.id)).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.update(banner.id, {})).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.remove(banner.id)).rejects.toMatchObject({
      status: 404,
    });
  });

  it.each([
    { items: null },
    { items: [] },
    { items: [null] },
    { items: [{ mediaUrl: 'javascript:alert(1)' }] },
    {
      items: [
        {
          mediaUrl: 'https://example.com/a.jpg',
          linkUrl: 'javascript:alert(1)',
        },
      ],
    },
    { section: 'unknown' },
    { page: null },
    { categoryId: 'bad-id' },
  ])('rejects malformed input %j', async (patch) => {
    expect(
      (await validate(plainToInstance(CreateBannerDto, { ...input, ...patch })))
        .length,
    ).toBeGreaterThan(0);
  });

  it('accepts valid input and partial updates but rejects null items', async () => {
    expect(await validate(plainToInstance(CreateBannerDto, input))).toEqual([]);
    expect(await validate(plainToInstance(UpdateBannerDto, {}))).toEqual([]);
    expect(
      (await validate(plainToInstance(UpdateBannerDto, { items: null })))
        .length,
    ).toBeGreaterThan(0);
  });
});
