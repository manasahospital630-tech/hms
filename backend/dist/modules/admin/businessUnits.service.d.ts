export declare const getBusinessUnits: () => Promise<{
    buId: any;
    name: any;
    parentBuId: any;
    parentBuName: any;
    category: any;
    unitHeadId: any;
    unitHeadName: any;
    status: any;
    createdAt: any;
    staffCount: number;
    teamsCount: number;
}[]>;
export declare const createBusinessUnit: (data: {
    buId?: string;
    name: string;
    parentBuId?: string;
    category: string;
    unitHeadId?: string;
    status?: string;
}) => Promise<any>;
export declare const updateBusinessUnit: (buId: string, data: {
    name?: string;
    parentBuId?: string;
    category?: string;
    unitHeadId?: string;
    status?: string;
}) => Promise<any>;
export declare const getTeams: () => Promise<{
    teamId: any;
    teamName: any;
    buId: any;
    buName: any;
    teamType: any;
    teamLeadId: any;
    teamLeadName: any;
    memberCount: number;
    roles: any;
}[]>;
export declare const createTeam: (data: {
    teamName: string;
    buId: string;
    teamType?: string;
    teamLeadId?: string;
    roles?: string[];
}) => Promise<any>;
export declare const getTeamMembers: (teamId: string) => Promise<{
    assignedMembers: any[];
    availableUsers: any[];
    securityRoles: any[];
}>;
export declare const updateTeamMembers: (teamId: string, memberUserIds: string[]) => Promise<{
    success: boolean;
    count: number;
}>;
export declare const updateTeamRoles: (teamId: string, roles: string[]) => Promise<{
    success: boolean;
    roles: string[];
}>;
//# sourceMappingURL=businessUnits.service.d.ts.map