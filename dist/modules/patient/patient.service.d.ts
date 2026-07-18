import { CreatePatientInput, UpdatePatientInput } from './patient.schema';
export declare const createPatient: (input: CreatePatientInput) => Promise<any>;
export declare const getPatients: (options: {
    search?: string;
    limit?: number;
    offset?: number;
}) => Promise<{
    patients: any[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        totalPages: number;
    };
}>;
export declare const getPatientById: (patientId: string) => Promise<any>;
export declare const updatePatient: (patientId: string, input: UpdatePatientInput) => Promise<any>;
export declare const givePortalAccess: (patientId: string) => Promise<{
    email: any;
    password: string;
}>;
//# sourceMappingURL=patient.service.d.ts.map