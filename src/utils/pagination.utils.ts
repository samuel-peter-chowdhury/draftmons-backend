import { IsIn, IsPositive, IsString } from "class-validator";

export class PaginationOptions {
  @IsPositive()
  page: number;

  @IsPositive()
  pageSize: number;
}

export class SortOptions {
  @IsString()
  sortBy: string;

  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC';
}

export interface PaginatedResponse<E> {
  data: E[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
