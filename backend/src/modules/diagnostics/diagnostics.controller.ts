import { Request, Response, NextFunction } from 'express';
import * as dService from './diagnostics.service';
import * as schemas from './diagnostics.schema';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await dService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await dService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
};

export const getServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await dService.getServices();
    res.json({ success: true, data: services });
  } catch (error) { next(error); }
};

export const addService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = schemas.serviceSchema.parse(req.body);
    const service = await dService.addService(input);
    res.status(201).json({ success: true, data: service });
  } catch (error) { next(error); }
};

export const editService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const input = schemas.serviceSchema.parse(req.body);
    const service = await dService.editService(id, input);
    res.json({ success: true, data: service });
  } catch (error) { next(error); }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await dService.deleteService(id);
    res.json(result);
  } catch (error) { next(error); }
};

export const getPackages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await dService.getPackages();
    res.json({ success: true, data: packages });
  } catch (error) { next(error); }
};

export const addPackage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = schemas.packageSchema.parse(req.body);
    const pkg = await dService.addPackage(input);
    res.status(201).json({ success: true, data: pkg });
  } catch (error) { next(error); }
};

export const editPackage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const input = schemas.packageSchema.parse(req.body);
    const result = await dService.editPackage(id, input);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const deletePackage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await dService.deletePackage(id);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await dService.getOrders();
    res.json({ success: true, data: orders });
  } catch (error) { next(error); }
};

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = schemas.orderSchema.parse(req.body);
    const order = await dService.createOrder(input);
    res.status(201).json({ success: true, data: order });
  } catch (error) { next(error); }
};

export const payOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await dService.payOrder(id);
    res.json(result);
  } catch (error) { next(error); }
};

export const collectSample = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = schemas.sampleCollectionSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    const collection = await dService.collectSample(input, userId);
    res.status(201).json({ success: true, data: collection });
  } catch (error) { next(error); }
};

export const submitResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as string; // 'lab', 'radiology', 'ultrasound', 'ecg'
    const userId = (req as any).user?.userId;
    let result: any;

    if (type === 'lab') {
      const input = schemas.labResultSchema.parse(req.body);
      result = await dService.submitLabResult(input, userId);
    } else if (type === 'radiology') {
      const input = schemas.radiologyReportSchema.parse(req.body);
      result = await dService.submitRadiologyReport(input, userId);
    } else if (type === 'ultrasound') {
      const input = schemas.ultrasoundReportSchema.parse(req.body);
      result = await dService.submitUltrasoundReport(input, userId);
    } else if (type === 'ecg') {
      const input = schemas.ecgReportSchema.parse(req.body);
      result = await dService.submitEcgReport(input, userId);
    } else {
      throw new Error('Invalid diagnostic result category type');
    }

    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const verifyReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = schemas.reportVerificationSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    const verification = await dService.verifyReport(input, userId);
    res.status(201).json({ success: true, data: verification });
  } catch (error) { next(error); }
};

export const getMachines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const machines = await dService.getMachines();
    res.json({ success: true, data: machines });
  } catch (error) { next(error); }
};

export const addMachine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = schemas.machineSchema.parse(req.body);
    const machine = await dService.addMachine(input);
    res.status(201).json({ success: true, data: machine });
  } catch (error) { next(error); }
};

export const getReferrals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const referrals = await dService.getReferrals();
    res.json({ success: true, data: referrals });
  } catch (error) { next(error); }
};

export const addReferral = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = schemas.referralDoctorSchema.parse(req.body);
    const referral = await dService.addReferral(input);
    res.status(201).json({ success: true, data: referral });
  } catch (error) { next(error); }
};

export const getQcLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await dService.getQcLogs();
    res.json({ success: true, data: logs });
  } catch (error) { next(error); }
};

export const addQcLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = schemas.qcLogSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    const log = await dService.addQcLog(input, userId);
    res.status(201).json({ success: true, data: log });
  } catch (error) { next(error); }
};

export const updateOrderItemStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = req.params.itemId as string;
    const { status } = req.body;
    const result = await dService.updateOrderItemStatus(itemId, status);
    res.json(result);
  } catch (error) { next(error); }
};

export const getPublicReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = req.params.itemId as string;
    const report = await dService.getPublicReport(itemId);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found or not finalized.' });
    }
    return res.json({ success: true, data: report });
  } catch (error) {
    next(error);
    return;
  }
};
