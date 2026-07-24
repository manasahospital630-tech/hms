import { Request, Response } from 'express';
/**
 * 1. KPI Summary Endpoint
 * Returns Today, Week, Month, Year OPD count & revenue
 */
export declare const getOpdKpiSummary: (req: Request, res: Response) => Promise<void>;
/**
 * 2. Growth Chart & Comparison Endpoint
 */
export declare const getOpdGrowthChart: (req: Request, res: Response) => Promise<void>;
/**
 * 3. Master Filterable Records Endpoint
 */
export declare const getFilteredOpdRecords: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=opdAnalytics.controller.d.ts.map