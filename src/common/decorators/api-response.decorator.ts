import { SetMetadata } from '@nestjs/common';

export const API_RESPONSE_KEY = 'api_response_meta';

export interface ApiResponseMetaOptions {
  code: string;
  message: string;
}

export const ApiResponseMeta = (meta: ApiResponseMetaOptions) =>
  SetMetadata(API_RESPONSE_KEY, meta);
