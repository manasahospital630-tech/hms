import { Response } from 'express';

export const successResponse = (
  res: Response,
  data: any,
  message?: string,
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500
): Response => {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
};
