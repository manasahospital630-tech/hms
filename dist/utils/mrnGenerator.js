"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMRN = void 0;
const database_1 = require("../config/database");
/**
 * Generate a Medical Record Number in the format MRN-YYYY-XXXXX
 * Uses PostgreSQL mrn_seq sequence for unique, sequential numbers
 */
const generateMRN = async () => {
    const year = new Date().getFullYear();
    const result = await (0, database_1.query)("SELECT nextval('mrn_seq')");
    const seqNumber = result.rows[0].nextval;
    const paddedNumber = String(seqNumber).padStart(5, '0');
    return `MRN-${year}-${paddedNumber}`;
};
exports.generateMRN = generateMRN;
//# sourceMappingURL=mrnGenerator.js.map