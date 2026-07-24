import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
import { successResponse } from '../../utils/responseHelper';
import * as appointmentService from './appointment.service';

export const create = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointment = await appointmentService.createAppointment(req.body);
    successResponse(res, appointment, 'Appointment created successfully.', 201);
  } catch (error) { next(error); }
};

export const getAll = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await appointmentService.getAppointments({
      doctorId: req.query.doctorId as string,
      status: req.query.status as string,
      date: req.query.date as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    });
    successResponse(res, result);
  } catch (error) { next(error); }
};

export const getById = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id as string);
    successResponse(res, appointment);
  } catch (error) { next(error); }
};

export const updateStatus = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointment = await appointmentService.updateAppointmentStatus(req.params.id as string, req.body.status);
    successResponse(res, appointment, 'Appointment status updated.');
  } catch (error) { next(error); }
};

export const createOPCheckIn = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await appointmentService.createOPCheckIn(req.body);
    successResponse(res, result, 'OPD Check-in successful.', 201);
  } catch (error) { next(error); }
};

export const checkReviewStatus = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId, doctorId } = req.query;
    if (!patientId || !doctorId) {
      res.status(400).json({ success: false, error: 'patientId and doctorId are required.' });
      return;
    }
    const result = await appointmentService.checkReviewStatus(patientId as string, doctorId as string);
    successResponse(res, result);
  } catch (error) { next(error); }
};

export const recordTriageVitals = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointmentId = req.params.id || req.body.appointmentId || req.body.bookingId;
    const result = await appointmentService.recordTriageVitals({
      ...req.body,
      appointmentId
    });
    successResponse(res, result, 'Vitals recorded successfully and synced to Patient Timeline.', 200);
  } catch (error) { next(error); }
};


