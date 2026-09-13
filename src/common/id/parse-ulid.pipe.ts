import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isUlid } from './ulid.js';

@Injectable()
export class ParseULIDPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!isUlid(value)) {
      throw new BadRequestException(
        `Validation failed (${metadata.data ?? 'param'} must be a ULID)`,
      );
    }
    return value;
  }
}
