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
