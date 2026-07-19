import { CreateAppointmentInput } from './appointment.schema';
export declare const createAppointment: (input: CreateAppointmentInput) => Promise<any>;
export declare const getAppointments: (filters: {
    doctorId?: string;
    status?: string;
    date?: string;
    limit?: number;
    offset?: number;
}) => Promise<{
    appointments: any[];
    total: number;
}>;
export declare const getAppointmentById: (id: string) => Promise<any>;
export declare const updateAppointmentStatus: (id: string, status: string) => Promise<any>;
export declare const createOPCheckIn: (input: {
    patientId: string;
    doctorId: string;
    paymentMethod: string;
}) => Promise<{
    appointment: any;
    invoice: any;
    isFreeReview: boolean;
    chargedFee: number;
    doctorName: string;
    department: any;
    opNo: number;
    tokenNo: number;
    billNo: string;
}>;
export declare const checkReviewStatus: (patientId: string, doctorId: string) => Promise<{
    isFreeReview: boolean;
    lastAppointmentDate: any;
}>;
//# sourceMappingURL=appointment.service.d.ts.map