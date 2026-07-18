import { query } from '../config/database';

/**
 * Generate a Medical Record Number in the format MRN-YYYY-XXXXX
 * Uses PostgreSQL mrn_seq sequence for unique, sequential numbers
 */
export const generateMRN = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const result = await query<{ nextval: string }>("SELECT nextval('mrn_seq')");
  const seqNumber = result.rows[0].nextval;
  const paddedNumber = String(seqNumber).padStart(5, '0');
  return `MRN-${year}-${paddedNumber}`;
};
