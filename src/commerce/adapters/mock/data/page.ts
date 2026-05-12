import type { Page, PageRequest } from '@/domain/models';

export const paginate = <T>(items: T[], pageRequest?: PageRequest): Page<T> => {
  const page = pageRequest?.page ?? 1;
  const pageSize = pageRequest?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    items: slice,
    page,
    pageSize,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
};
