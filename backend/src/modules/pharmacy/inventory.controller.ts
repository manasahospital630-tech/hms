import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
import { successResponse } from '../../utils/responseHelper';
import * as inventoryService from './inventory.service';

export const getAll = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await inventoryService.getInventory({
      search: req.query.search as string,
      lowStock: req.query.lowStock === 'true',
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    });
    successResponse(res, result);
  } catch (error) { next(error); }
};

export const getById = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await inventoryService.getInventoryItemById(req.params.id as string);
    successResponse(res, item);
  } catch (error) { next(error); }
};

export const create = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await inventoryService.createInventoryItem(req.body);
    successResponse(res, item, 'Inventory item created.', 201);
  } catch (error) { next(error); }
};

export const update = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await inventoryService.updateInventoryItem(req.params.id as string, req.body);
    successResponse(res, item, 'Inventory item updated.');
  } catch (error) { next(error); }
};

export const getLowStock = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const items = await inventoryService.getLowStockItems();
    successResponse(res, items);
  } catch (error) { next(error); }
};

export const createSale = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoice = await inventoryService.createSale(req.identity!.userId, req.body);
    successResponse(res, invoice, 'Pharmacy sale recorded successfully.', 201);
  } catch (error) { next(error); }
};

export const getSalesHistory = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const history = await inventoryService.getSalesHistory();
    successResponse(res, history);
  } catch (error) { next(error); }
};
