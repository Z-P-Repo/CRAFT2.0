export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FilterOptions {
  search?: string;
  [key: string]: any;
}

export class PaginationHelper {
  static validatePaginationParams(query: any): PaginationOptions {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    return { page, limit, sortBy, sortOrder };
  }

  static buildPaginationResult<T>(
    data: T[],
    total: number,
    options: PaginationOptions
  ): PaginationResult<T> {
    const { page, limit } = options;
    const pages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }

  static buildSortObject(sortBy: string, sortOrder: 'asc' | 'desc'): Record<string, 1 | -1> {
    return { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  }

  static buildSearchFilter(search: string, searchFields: string[]): any {
    if (!search || !searchFields.length) return {};
    
    return {
      $or: searchFields.map(field => ({
        [field]: { $regex: search, $options: 'i' }
      }))
    };
  }
}