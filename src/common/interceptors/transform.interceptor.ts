import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import {
  API_RESPONSE_KEY,
  ApiResponseMetaOptions,
} from '../decorators/api-response.decorator.js';
import { successResponse } from '../response/helpers/success-response.helper.js';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<ApiResponseMetaOptions>(
      API_RESPONSE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => {
        if (!meta) {
          return data;
        }

        return successResponse(meta.code, meta.message, data ?? {});
      }),
    );
  }
}
