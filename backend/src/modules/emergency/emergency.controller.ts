import { Request, Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
import * as emergencyService from './emergency.service';
import {
  admitEmergencyPatientSchema,
  logVitalsSchema,
  saveConsentSchema,
  createEmergencyOrderSchema,
  updateEmergencyStatusSchema
} from './emergency.schema';

export const admitEmergencyPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = admitEmergencyPatientSchema.parse(req.body);
    const result = await emergencyService.admitEmergencyPatient(input);
    res.status(201).json({
      success: true,
      message: 'Emergency patient registered and medical care initiated.',
      data: result.emergencyRecord,
      policeNotice: result.policeNotice
    });
  } catch (error) {
    next(error);
  }
};

export const generatePoliceIntimation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emergencyId, officerName, badgeNumber, policeStation } = req.body;
    const result = await emergencyService.generatePoliceIntimation(emergencyId, {
      officerName,
      badgeNumber,
      policeStation
    });
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

export const getEmergencyConsents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consents = await emergencyService.getEmergencyConsents(req.params.emergencyId as string);
    res.status(200).json({
      success: true,
      data: consents
    });
  } catch (error) {
    next(error);
  }
};

export const saveDigitalConsent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = saveConsentSchema.parse(req.body);
    const consent = await emergencyService.saveDigitalConsent(input);
    res.status(201).json({
      success: true,
      data: consent
    });
  } catch (error) {
    next(error);
  }
};

export const logEmergencyVitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = logVitalsSchema.parse(req.body);
    const log = await emergencyService.logEmergencyVitals(input);
    res.status(201).json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
};

export const getEmergencyVitalsHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await emergencyService.getEmergencyVitalsHistory(req.params.emergencyId as string);
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmergencyStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateEmergencyStatusSchema.parse(req.body);
    const record = await emergencyService.updateEmergencyStatus(input);
    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

export const createEmergencyOrder = async (req: ProtectedRequest, res: Response, next: NextFunction) => {
  try {
    const input = createEmergencyOrderSchema.parse(req.body);
    const order = await emergencyService.createEmergencyOrder(input, req.identity!.userId);
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const getEmergencyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await emergencyService.getEmergencyOrders(req.params.emergencyId as string);
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmergencyOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const order = await emergencyService.updateEmergencyOrderStatus(req.params.orderId as string, status);
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveEmergencyPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patients = await emergencyService.getActiveEmergencyPatients();
    res.status(200).json({
      success: true,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};
