import { Pool, QueryResult, QueryResultRow } from 'pg';
declare const pool: Pool;
export declare const query: <T extends QueryResultRow = any>(text: string, params?: any[]) => Promise<QueryResult<T>>;
export declare const getClient: () => Promise<import("pg").PoolClient>;
export default pool;
//# sourceMappingURL=database.d.ts.map