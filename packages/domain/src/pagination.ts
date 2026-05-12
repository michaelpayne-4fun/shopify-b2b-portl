export interface PageRequest {
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export const emptyPage = <T>(): Page<T> => ({
  items: [],
  page: 1,
  pageSize: 0,
  totalItems: 0,
  totalPages: 0,
});

export const paginate = <T>(items: T[], req?: PageRequest): Page<T> => {
  const page = req?.page ?? 1;
  const pageSize = req?.pageSize ?? 20;
  const slice = items.slice((page - 1) * pageSize, page * pageSize);
  return {
    items: slice,
    page,
    pageSize,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
};
