import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception.js';
import {
  getPaginationParams,
  paginatedList,
} from '../common/response/helpers/paginated-response.helper.js';
import { ContactMessage } from './entities/contact-message.entity.js';
import {
  CreateContactMessageDto,
  ListContactMessagesQueryDto,
  UpdateContactMessageDto,
} from './dto/contact-message.dto.js';

@Injectable()
export class ContactMessagesService {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly messages: Repository<ContactMessage>,
  ) {}

  async create(dto: CreateContactMessageDto) {
    const email = dto.email?.trim() || null;
    const phoneNumber = dto.phoneNumber?.trim() || null;
    if (!email && !phoneNumber) {
      throw new ApiException(
        'CONTACT_REQUIRED',
        'حداقل یکی از ایمیل یا شماره تماس الزامی است',
        HttpStatus.BAD_REQUEST,
      );
    }

    const saved = await this.messages.save(
      this.messages.create({
        name: dto.name.trim(),
        email,
        phoneNumber,
        subject: dto.subject.trim(),
        message: dto.message.trim(),
        isRead: false,
        internalNote: null,
        reply: null,
      }),
    );
    return this.toResponse(saved);
  }

  async findAll(query: ListContactMessagesQueryDto) {
    const { page, limit, offset } = getPaginationParams(query);
    const qb = this.messages.createQueryBuilder('message');

    if (query.isRead !== undefined) {
      qb.andWhere('message.isRead = :isRead', { isRead: query.isRead });
    }

    const [items, total] = await qb
      .orderBy('message.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return paginatedList(items.map(this.toResponse), page, limit, total);
  }

  async findOne(id: string) {
    return this.toResponse(await this.getEntity(id));
  }

  async update(id: string, dto: UpdateContactMessageDto) {
    const message = await this.getEntity(id);

    if (dto.isRead !== undefined) message.isRead = dto.isRead;
    if (dto.internalNote !== undefined) {
      message.internalNote = dto.internalNote?.trim() || null;
    }
    if (dto.reply !== undefined) {
      message.reply = dto.reply?.trim() || null;
    }

    return this.toResponse(await this.messages.save(message));
  }

  async remove(id: string) {
    const message = await this.getEntity(id);
    await this.messages.remove(message);
    return {};
  }

  private async getEntity(id: string) {
    const message = await this.messages.findOneBy({ id });
    if (!message) {
      throw new ApiException(
        'CONTACT_MESSAGE_NOT_FOUND',
        'پیام یافت نشد',
        HttpStatus.NOT_FOUND,
      );
    }
    return message;
  }

  private toResponse(message: ContactMessage) {
    return {
      id: message.id,
      name: message.name,
      email: message.email,
      phoneNumber: message.phoneNumber,
      subject: message.subject,
      message: message.message,
      isRead: message.isRead,
      internalNote: message.internalNote,
      reply: message.reply,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}
