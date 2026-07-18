export const getEncounterByIpAdmissionId = async (ipAdmissionId: string) => {
  const result = await query(
    `SELECT e.*, u.first_name || ' ' || u.last_name as provider_name,
            p.first_name || ' ' || p.last_name as patient_name, p.medical_record_number
     FROM encounters e
     JOIN users u ON e.provider_id = u.user_id
     JOIN patients p ON e.patient_id = p.patient_id
     WHERE e.ip_admission_id = $1 ORDER BY e.encounter_timestamp DESC LIMIT 1`,
    [ipAdmissionId]
  );
  if (result.rows.length === 0) throw new AppError('Encounter not found for this IP Admission.', 404);

  const encounter = result.rows[0];
  const diagnoses = await query('SELECT * FROM diagnoses WHERE encounter_id = $1', [encounter.encounter_id]);
  encounter.diagnoses = diagnoses.rows;
  return encounter;
};
