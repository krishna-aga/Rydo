import { ApiResponse } from '@rydo/shared';

export const successResponse = <T>(data: T): ApiResponse<T> => {
  return {
    success: true,
    data
  };
};

export const errorResponse = (error: string): ApiResponse<any> => {
  return {
    success: false,
    error
  };
};
