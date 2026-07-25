import { Pool, QueryResult, QueryResultRow } from 'pg';
declare let activePool: Pool;
export declare const query: <T extends QueryResultRow = any>(text: string, params?: any[]) => Promise<QueryResult<T>>;
export declare const getClient: () => Promise<import("pg").PoolClient>;
export default activePool;
//# sourceMappingURL=database.d.ts.map