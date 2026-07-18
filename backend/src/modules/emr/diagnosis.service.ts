import { query } from '../../config/database';
import { AddDiagnosisInput } from './emr.schema';

export const addDiagnosis = async (encounterId: string, input: AddDiagnosisInput) => {
  const result = await query(
    `INSERT INTO diagnoses (encounter_id, icd_code, description, is_primary)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [encounterId, input.icdCode, input.description, input.isPrimary || false]
  );
  return result.rows[0];
};

export const getEncounterDiagnoses = async (encounterId: string) => {
  const result = await query(
    'SELECT * FROM diagnoses WHERE encounter_id = $1 ORDER BY is_primary DESC, recorded_at ASC',
    [encounterId]
  );
  return result.rows;
};
