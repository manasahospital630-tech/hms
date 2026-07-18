import { Request, Response, NextFunction } from 'express';
import { routineAdmissionSchema, emergencyFastTrackSchema, transferBedSchema, bedSchema } from './ip.schema';
import * as ipService from './ip.service';

export const getBeds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const beds = await ipService.getBeds();
    res.json({ success: true, data: beds });
  } catch (error) { next(error); }
};

export const getActiveAdmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admissions = await ipService.getActiveAdmissions();
    res.json({ success: true, data: admissions });
  } catch (error) { next(error); }
};

export const admitRoutine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = routineAdmissionSchema.parse(req.body);
    const admission = await ipService.admitRoutine(input);
    res.status(201).json({ success: true, data: admission });
  } catch (error) { next(error); }
};

export const admitEmergencyFastTrack = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = emergencyFastTrackSchema.parse(req.body);
    const result = await ipService.admitEmergencyFastTrack(input);
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const transferBed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = transferBedSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    const result = await ipService.transferBed(input, userId);
    res.json(result);
  } catch (error) { next(error); }
};

export const dischargePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await ipService.dischargePatient(id);
    res.json(result);
  } catch (error) { next(error); }
};

// Bed Configuration Controllers
export const addBed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = bedSchema.parse(req.body);
    const bed = await ipService.addBed(input);
    res.status(201).json({ success: true, data: bed });
  } catch (error) { next(error); }
};

export const editBed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const input = bedSchema.parse(req.body);
    const bed = await ipService.editBed(id, input);
    res.json({ success: true, data: bed });
  } catch (error) { next(error); }
};

export const deleteBed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await ipService.deleteBed(id);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};
