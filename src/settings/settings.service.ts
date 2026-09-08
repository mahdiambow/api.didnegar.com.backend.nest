import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import { FooterSettings } from './entities/footer-settings.entity.js';
import { CreateFooterDto, UpdateFooterDto } from './dto/footer.dto.js';
import { HeaderSettings } from './entities/header-settings.entity.js';
import { CreateHeaderDto, UpdateHeaderDto } from './dto/header.dto.js';
import { AboutUs } from './entities/about-us.entity.js';
import { CreateAboutUsDto, UpdateAboutUsDto } from './dto/about-us.dto.js';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(FooterSettings)
    private readonly footerRepository: Repository<FooterSettings>,
    @InjectRepository(HeaderSettings)
    private readonly headerRepository: Repository<HeaderSettings>,
    @InjectRepository(AboutUs)
    private readonly aboutUsRepository: Repository<AboutUs>,
  ) {}

  async getFooter() {
    const footer = await this.footerRepository.findOneBy({ id: 1 });
    if (!footer) {
      throw new ApiException(
        'FOOTER_NOT_FOUND',
        'تنظیمات فوتر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return footer;
  }

  async createFooter(dto: CreateFooterDto) {
    try {
      await this.footerRepository.insert({ ...dto, id: 1 });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ApiException(
          'FOOTER_ALREADY_EXISTS',
          'تنظیمات فوتر از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
    return this.getFooter();
  }

  async updateFooter(dto: UpdateFooterDto) {
    await this.getFooter();
    if (Object.keys(dto).length) {
      await this.footerRepository.update({ id: 1 }, dto);
    }
    return this.getFooter();
  }

  async removeFooter() {
    const result = await this.footerRepository.delete({ id: 1 });
    if (!result.affected) {
      throw new ApiException(
        'FOOTER_NOT_FOUND',
        'تنظیمات فوتر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return {};
  }

  async getHeader() {
    const header = await this.headerRepository.findOneBy({ id: 1 });
    if (!header) {
      throw new ApiException(
        'HEADER_NOT_FOUND',
        'تنظیمات هدر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return header;
  }

  async createHeader(dto: CreateHeaderDto) {
    try {
      await this.headerRepository.insert({ ...dto, id: 1 });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ApiException(
          'HEADER_ALREADY_EXISTS',
          'تنظیمات هدر از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
    return this.getHeader();
  }

  async updateHeader(dto: UpdateHeaderDto) {
    await this.getHeader();
    if (Object.keys(dto).length) {
      await this.headerRepository.update({ id: 1 }, dto);
    }
    return this.getHeader();
  }

  async removeHeader() {
    const result = await this.headerRepository.delete({ id: 1 });
    if (!result.affected) {
      throw new ApiException(
        'HEADER_NOT_FOUND',
        'تنظیمات هدر یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return {};
  }

  async getAboutUs() {
    const aboutUs = await this.aboutUsRepository.findOneBy({ id: 1 });
    if (!aboutUs) {
      throw new ApiException(
        'ABOUT_US_NOT_FOUND',
        'درباره ما یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return aboutUs;
  }

  async createAboutUs(dto: CreateAboutUsDto) {
    try {
      await this.aboutUsRepository.insert({
        id: 1,
        title: dto.title,
        content: dto.content,
        faqs: dto.faqs ?? [],
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ApiException(
          'ABOUT_US_ALREADY_EXISTS',
          'درباره ما از قبل وجود دارد',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
    return this.getAboutUs();
  }

  async updateAboutUs(dto: UpdateAboutUsDto) {
    await this.getAboutUs();
    if (Object.keys(dto).length) {
      await this.aboutUsRepository.update({ id: 1 }, dto);
    }
    return this.getAboutUs();
  }

  async removeAboutUs() {
    const result = await this.aboutUsRepository.delete({ id: 1 });
    if (!result.affected) {
      throw new ApiException(
        'ABOUT_US_NOT_FOUND',
        'درباره ما یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return {};
  }
}
