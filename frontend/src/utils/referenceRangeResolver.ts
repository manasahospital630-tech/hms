export interface PatientInfo {
  dob?: string | Date;
  date_of_birth?: string | Date;
  patient_birth_date?: string | Date;
  birth_date?: string | Date;
  age?: number | string;
  patient_age?: number | string;
  gender?: string;
  patient_gender?: string;
}

export interface ParameterRefInfo {
  reference_range?: string | null;
  referenceRange?: string | null;
  ref_min_male?: string | number | null;
  refMinMale?: string | number | null;
  ref_max_male?: string | number | null;
  refMaxMale?: string | number | null;
  ref_min_female?: string | number | null;
  refMinFemale?: string | number | null;
  ref_max_female?: string | number | null;
  refMaxFemale?: string | number | null;
  ref_min_child?: string | number | null;
  refMinChild?: string | number | null;
  ref_max_child?: string | number | null;
  refMaxChild?: string | number | null;
  row_type?: string | null;
  rowType?: string | null;
}

/**
 * Calculates patient age in years from patient object.
 */
export const getPatientAgeInYears = (patient?: PatientInfo | any | null): number => {
  if (!patient) return 25; // Default to adult if unspecified

  const rawAge = patient.age !== undefined && patient.age !== null ? patient.age : patient.patient_age;
  if (rawAge !== undefined && rawAge !== null) {
    const ageStr = rawAge.toString().trim().toLowerCase();
    if (ageStr === 'child' || ageStr.includes('child') || ageStr.includes('pediatric')) {
      return 10;
    }
    const numericPart = parseFloat(ageStr);
    if (!isNaN(numericPart)) {
      if (ageStr.includes('m') || ageStr.includes('month')) {
        return numericPart / 12;
      }
      if (ageStr.includes('d') || ageStr.includes('day')) {
        return numericPart / 365;
      }
      return numericPart;
    }
  }

  const dob = patient.dob || patient.date_of_birth || patient.patient_birth_date || patient.birth_date;
  if (dob) {
    const dobDate = new Date(dob);
    if (!isNaN(dobDate.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      return Math.max(0, age);
    }
  }

  if (patient.ageGroup === 'Child' || patient.age_group === 'Child') {
    return 10;
  }

  return 25; // Fallback to adult
};

/**
 * Returns the exact patient-specific reference range string based on the 4 user rules:
 * Rule 1: Child (<18 yrs) -> Child Ref Range if present.
 * Rule 2: Male Adult (Male, >=18 yrs) -> Male Ref Range if present.
 * Rule 3: Female Adult (Female, >=18 yrs) -> Female Ref Range if present.
 * Rule 4: Universal Adult Ref Range -> Fallback for all patients if gender/child specific ranges are null/empty.
 */
export const resolvePatientReferenceRange = (
  param?: ParameterRefInfo | null,
  patient?: PatientInfo | null
): string => {
  if (!param) return '—';

  const rowType = param.row_type || param.rowType || 'parameter';
  if (rowType === 'findings' || rowType === 'reference') {
    const rawRef = param.reference_range || param.referenceRange || '';
    return rawRef.trim() || 'Descriptive';
  }

  const ageInYears = getPatientAgeInYears(patient);
  const isChild = ageInYears < 18;
  const rawGender = (patient?.gender || patient?.patient_gender || '').toString().trim().toLowerCase();
  const isMale = rawGender === 'male' || rawGender === 'm';
  const isFemale = rawGender === 'female' || rawGender === 'f';

  const refMinChild = param.ref_min_child !== undefined && param.ref_min_child !== null ? param.ref_min_child : param.refMinChild;
  const refMaxChild = param.ref_max_child !== undefined && param.ref_max_child !== null ? param.ref_max_child : param.refMaxChild;
  const refMinMale = param.ref_min_male !== undefined && param.ref_min_male !== null ? param.ref_min_male : param.refMinMale;
  const refMaxMale = param.ref_max_male !== undefined && param.ref_max_male !== null ? param.ref_max_male : param.refMaxMale;
  const refMinFemale = param.ref_min_female !== undefined && param.ref_min_female !== null ? param.ref_min_female : param.refMinFemale;
  const refMaxFemale = param.ref_max_female !== undefined && param.ref_max_female !== null ? param.ref_max_female : param.refMaxFemale;
  let universalRef = (param.reference_range !== undefined && param.reference_range !== null ? param.reference_range : param.referenceRange) || '';
  universalRef = universalRef ? universalRef.toString().trim() : '';

  const getStr = (val: any) => (val !== null && val !== undefined ? val.toString().trim() : '');

  const minStrChild = getStr(refMinChild);
  const maxStrChild = getStr(refMaxChild);
  const minStrMale = getStr(refMinMale);
  const maxStrMale = getStr(refMaxMale);
  const minStrFemale = getStr(refMinFemale);
  const maxStrFemale = getStr(refMaxFemale);

  // 1. Child Condition (Patient < 18 yrs)
  if (isChild && (minStrChild || maxStrChild)) {
    if (minStrChild && maxStrChild) return `${minStrChild} - ${maxStrChild}`;
    if (minStrChild) return `>= ${minStrChild}`;
    if (maxStrChild) return `<= ${maxStrChild}`;
  }

  // 2. Male Adult Condition (Male, >= 18 yrs)
  if (!isChild && isMale && (minStrMale || maxStrMale)) {
    if (minStrMale && maxStrMale) return `${minStrMale} - ${maxStrMale}`;
    if (minStrMale) return `>= ${minStrMale}`;
    if (maxStrMale) return `<= ${maxStrMale}`;
  }

  // 3. Female Adult Condition (Female, >= 18 yrs)
  if (!isChild && isFemale && (minStrFemale || maxStrFemale)) {
    if (minStrFemale && maxStrFemale) return `${minStrFemale} - ${maxStrFemale}`;
    if (minStrFemale) return `>= ${minStrFemale}`;
    if (maxStrFemale) return `<= ${maxStrFemale}`;
  }

  // 4. If universalRef contains a composite summary e.g. "M: 44-147 | F: 45-150 | Child: 40-150", extract matching segment
  if (universalRef.includes('|') || universalRef.includes('M:') || universalRef.includes('F:') || universalRef.includes('Child:')) {
    const parts = universalRef.split('|').map((p) => p.trim());
    if (isChild) {
      const childPart = parts.find((p) => p.toLowerCase().startsWith('child:'));
      if (childPart) return childPart.replace(/child:\s*/i, '').trim();
    } else if (isMale) {
      const malePart = parts.find((p) => p.toLowerCase().startsWith('m:'));
      if (malePart) return malePart.replace(/m:\s*/i, '').trim();
    } else if (isFemale) {
      const femalePart = parts.find((p) => p.toLowerCase().startsWith('f:'));
      if (femalePart) return femalePart.replace(/f:\s*/i, '').trim();
    }
  }

  // 5. Universal Adult Ref Fallback
  if (universalRef && universalRef !== '-') {
    return universalRef;
  }

  // Fallbacks if any specific min/max is defined
  if (minStrMale || maxStrMale) return `${minStrMale || 0} - ${maxStrMale || 0}`;
  if (minStrFemale || maxStrFemale) return `${minStrFemale || 0} - ${maxStrFemale || 0}`;
  if (minStrChild || maxStrChild) return `${minStrChild || 0} - ${maxStrChild || 0}`;

  return '—';
};
