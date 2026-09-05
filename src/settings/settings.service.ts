import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import { FooterSettings } from './entities/footer-settings.entity.js';
import { CreateFooterDto, UpdateFooterDto } from './dto/footer.dto.js';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(FooterSettings)
    private readonly footerRepository: Repository<FooterSettings>,
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
      // INSERT and the fixed primary key also protect against concurrent creates.
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
}
