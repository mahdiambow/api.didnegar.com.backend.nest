import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from '../../dto/pagination-query.dto.js';
import type { PaginatedList } from '../interfaces/paginated-list.interface.js';
import type { ApiPaginatedResponse } from '../interfaces/paginated-list.interface.js';
import type {
  PaginationMeta,
  PaginationParams,
  PaginationQuery,
} from '../interfaces/pagination.interface.js';

export function getPaginationParams(query: PaginationQuery): PaginationParams {
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(query.limit) || DEFAULT_LIMIT),
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

export function paginatedList<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedList<T> {
  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export function paginatedResponse<T>(
  code: string,
  message: string,
  items: T[],
  page: number,
  limit: number,
  total: number,
): ApiPaginatedResponse<T> {
  return {
    code,
    message,
    data: paginatedList(items, page, limit, total),
  };
}
