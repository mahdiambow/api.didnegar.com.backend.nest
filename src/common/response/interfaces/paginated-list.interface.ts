import type { PaginationMeta } from './pagination.interface.js';

export interface PaginatedList<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ApiPaginatedResponse<T> {
  code: string;
  message: string;
  data: PaginatedList<T>;
}
