"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamRoles = exports.updateTeamMembers = exports.getTeamMembers = exports.createTeam = exports.getTeams = exports.updateBusinessUnit = exports.createBusinessUnit = exports.getBusinessUnits = exports.ensureTablesExist = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
let tablesInitialized = false;
const ensureTablesExist = async () => {
    if (tablesInitialized)
        return;
    try {
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS business_units (
        bu_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        parent_bu_id VARCHAR(50) REFERENCES business_units(bu_id) ON DELETE SET NULL,
        category VARCHAR(50),
        unit_head_id VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS teams (
        team_id VARCHAR(50) PRIMARY KEY,
        team_name VARCHAR(100) NOT NULL,
        bu_id VARCHAR(50) NOT NULL REFERENCES business_units(bu_id) ON DELETE CASCADE,
        team_type VARCHAR(30) DEFAULT 'Owner',
        team_lead_id VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS team_members (
        team_id VARCHAR(50) REFERENCES teams(team_id) ON DELETE CASCADE,
        user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (team_id, user_id)
      );
      CREATE TABLE IF NOT EXISTS team_security_roles (
        team_id VARCHAR(50) REFERENCES teams(team_id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        PRIMARY KEY (team_id, role)
      );
    `);
        // Seed default business units if empty
        const buCount = await (0, database_1.query)('SELECT COUNT(*) FROM business_units');
        if (parseInt(buCount.rows[0].count, 10) === 0) {
            await (0, database_1.query)(`
        INSERT INTO business_units (bu_id, name, parent_bu_id, category, status) VALUES
        ('BU-01', 'Clinical OPD & Check-in', NULL, 'Clinical', 'Active'),
        ('BU-02', 'Inpatient Department (IPD)', NULL, 'Clinical', 'Active'),
        ('BU-03', 'Emergency & Trauma Care (ICU)', NULL, 'Critical Care', 'Active'),
        ('BU-04', 'Laboratory & Pathology', NULL, 'Diagnostics', 'Active'),
        ('BU-05', 'Pharmacy & Dispensing', NULL, 'Pharmacy', 'Active'),
        ('BU-06', 'Billing, Revenue & Finance', NULL, 'Administration', 'Active'),
        ('BU-07', 'Reception & Front Desk', NULL, 'Operations', 'Active'),
        ('BU-08', 'System Administration', NULL, 'IT & Infrastructure', 'Active')
        ON CONFLICT (bu_id) DO NOTHING;
      `);
            await (0, database_1.query)(`
        INSERT INTO teams (team_id, team_name, bu_id, team_type) VALUES
        ('TEAM-01', 'OPD Clinical Team', 'BU-01', 'Owner'),
        ('TEAM-02', 'IPD Ward Team', 'BU-02', 'Owner'),
        ('TEAM-03', 'Emergency Response Team', 'BU-03', 'Owner'),
        ('TEAM-04', 'Pathology & Lab Techs', 'BU-04', 'Owner'),
        ('TEAM-05', 'Pharmacy Operations Team', 'BU-05', 'Owner'),
        ('TEAM-06', 'Billing & Accounts Team', 'BU-06', 'Owner'),
        ('TEAM-07', 'Front Desk Reception Team', 'BU-07', 'Owner'),
        ('TEAM-08', 'System IT Admin Team', 'BU-08', 'Owner')
        ON CONFLICT (team_id) DO NOTHING;
      `);
            await (0, database_1.query)(`
        INSERT INTO team_security_roles (team_id, role) VALUES
        ('TEAM-01', 'Doctor'), ('TEAM-01', 'Nurse'),
        ('TEAM-02', 'Doctor'), ('TEAM-02', 'Nurse'),
        ('TEAM-03', 'Doctor'), ('TEAM-03', 'Nurse'),
        ('TEAM-04', 'Incharge'),
        ('TEAM-05', 'Pharmacist'),
        ('TEAM-06', 'Biller'),
        ('TEAM-07', 'Receptionist'),
        ('TEAM-08', 'Admin')
        ON CONFLICT DO NOTHING;
      `);
        }
        tablesInitialized = true;
    }
    catch (err) {
        console.error('Failed to ensure Business Units tables exist:', err);
    }
};
exports.ensureTablesExist = ensureTablesExist;
// Auto-run migration check on module import
(0, exports.ensureTablesExist)();
const getBusinessUnits = async () => {
    await (0, exports.ensureTablesExist)();
    const res = await (0, database_1.query)(`
    SELECT 
      bu.bu_id, 
      bu.name, 
      bu.parent_bu_id, 
      pbu.name as parent_bu_name,
      bu.category, 
      bu.unit_head_id,
      u.first_name || ' ' || u.last_name as unit_head_name,
      bu.status,
      bu.created_at,
      (SELECT COUNT(DISTINCT tm.user_id) 
       FROM teams t 
       JOIN team_members tm ON t.team_id = tm.team_id 
       WHERE t.bu_id = bu.bu_id) as staff_count,
      (SELECT COUNT(*) FROM teams t WHERE t.bu_id = bu.bu_id) as teams_count
    FROM business_units bu
    LEFT JOIN business_units pbu ON bu.parent_bu_id = pbu.bu_id
    LEFT JOIN users u ON bu.unit_head_id = u.user_id
    ORDER BY bu.created_at ASC
  `);
    return res.rows.map(r => ({
        buId: r.bu_id,
        name: r.name,
        parentBuId: r.parent_bu_id,
        parentBuName: r.parent_bu_name,
        category: r.category,
        unitHeadId: r.unit_head_id,
        unitHeadName: r.unit_head_name || 'Unassigned',
        status: r.status,
        createdAt: r.created_at,
        staffCount: parseInt(r.staff_count, 10) || 0,
        teamsCount: parseInt(r.teams_count, 10) || 0
    }));
};
exports.getBusinessUnits = getBusinessUnits;
const createBusinessUnit = async (data) => {
    await (0, exports.ensureTablesExist)();
    let buId = data.buId;
    if (!buId) {
        const countRes = await (0, database_1.query)('SELECT COUNT(*) FROM business_units');
        const num = parseInt(countRes.rows[0].count, 10) + 1;
        buId = `BU-${String(num).padStart(2, '0')}`;
    }
    const res = await (0, database_1.query)(`INSERT INTO business_units (bu_id, name, parent_bu_id, category, unit_head_id, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`, [buId, data.name, data.parentBuId || null, data.category || 'Clinical', data.unitHeadId || null, data.status || 'Active']);
    const defaultTeamId = `TEAM-${buId.replace('BU-', '')}-DEF`;
    await (0, database_1.query)(`INSERT INTO teams (team_id, team_name, bu_id, team_type)
     VALUES ($1, $2, $3, 'Owner')
     ON CONFLICT DO NOTHING`, [defaultTeamId, `${data.name} Default Team`, buId]);
    return res.rows[0];
};
exports.createBusinessUnit = createBusinessUnit;
const updateBusinessUnit = async (buId, data) => {
    await (0, exports.ensureTablesExist)();
    const res = await (0, database_1.query)(`UPDATE business_units
     SET name = COALESCE($1, name),
         parent_bu_id = $2,
         category = COALESCE($3, category),
         unit_head_id = $4,
         status = COALESCE($5, status),
         updated_at = NOW()
     WHERE bu_id = $6
     RETURNING *`, [data.name, data.parentBuId || null, data.category, data.unitHeadId || null, data.status, buId]);
    if (res.rows.length === 0)
        throw new errorHandler_1.AppError('Business Unit not found', 404);
    return res.rows[0];
};
exports.updateBusinessUnit = updateBusinessUnit;
const getTeams = async () => {
    await (0, exports.ensureTablesExist)();
    const res = await (0, database_1.query)(`
    SELECT 
      t.team_id, 
      t.team_name, 
      t.bu_id, 
      bu.name as bu_name,
      t.team_type, 
      t.team_lead_id,
      u.first_name || ' ' || u.last_name as team_lead_name,
      (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.team_id) as member_count,
      (SELECT ARRAY_AGG(tsr.role) FROM team_security_roles tsr WHERE tsr.team_id = t.team_id) as roles
    FROM teams t
    JOIN business_units bu ON t.bu_id = bu.bu_id
    LEFT JOIN users u ON t.team_lead_id = u.user_id
    ORDER BY t.created_at ASC
  `);
    return res.rows.map(r => ({
        teamId: r.team_id,
        teamName: r.team_name,
        buId: r.bu_id,
        buName: r.bu_name,
        teamType: r.team_type,
        teamLeadId: r.team_lead_id,
        teamLeadName: r.team_lead_name || 'Unassigned',
        memberCount: parseInt(r.member_count, 10) || 0,
        roles: r.roles || []
    }));
};
exports.getTeams = getTeams;
const createTeam = async (data) => {
    await (0, exports.ensureTablesExist)();
    const countRes = await (0, database_1.query)('SELECT COUNT(*) FROM teams');
    const num = parseInt(countRes.rows[0].count, 10) + 1;
    const teamId = `TEAM-${String(num).padStart(2, '0')}`;
    const res = await (0, database_1.query)(`INSERT INTO teams (team_id, team_name, bu_id, team_type, team_lead_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`, [teamId, data.teamName, data.buId, data.teamType || 'Owner', data.teamLeadId || null]);
    if (data.roles && data.roles.length > 0) {
        for (const role of data.roles) {
            await (0, database_1.query)(`INSERT INTO team_security_roles (team_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [teamId, role]);
        }
    }
    return res.rows[0];
};
exports.createTeam = createTeam;
const getTeamMembers = async (teamId) => {
    await (0, exports.ensureTablesExist)();
    const assignedRes = await (0, database_1.query)(`
    SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, u.employee_department
    FROM team_members tm
    JOIN users u ON tm.user_id = u.user_id
    WHERE tm.team_id = $1
  `, [teamId]);
    const availableRes = await (0, database_1.query)(`
    SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, u.employee_department
    FROM users u
    WHERE u.role != 'Patient'
      AND u.user_id NOT IN (SELECT user_id FROM team_members WHERE team_id = $1)
    ORDER BY u.first_name ASC
  `, [teamId]);
    const rolesRes = await (0, database_1.query)(`SELECT role FROM team_security_roles WHERE team_id = $1`, [teamId]);
    return {
        assignedMembers: assignedRes.rows,
        availableUsers: availableRes.rows,
        securityRoles: rolesRes.rows.map(r => r.role)
    };
};
exports.getTeamMembers = getTeamMembers;
const updateTeamMembers = async (teamId, memberUserIds) => {
    await (0, exports.ensureTablesExist)();
    await (0, database_1.query)(`DELETE FROM team_members WHERE team_id = $1`, [teamId]);
    for (const uid of memberUserIds) {
        await (0, database_1.query)(`INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [teamId, uid]);
    }
    return { success: true, count: memberUserIds.length };
};
exports.updateTeamMembers = updateTeamMembers;
const updateTeamRoles = async (teamId, roles) => {
    await (0, exports.ensureTablesExist)();
    await (0, database_1.query)(`DELETE FROM team_security_roles WHERE team_id = $1`, [teamId]);
    for (const role of roles) {
        await (0, database_1.query)(`INSERT INTO team_security_roles (team_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [teamId, role]);
    }
    return { success: true, roles };
};
exports.updateTeamRoles = updateTeamRoles;
//# sourceMappingURL=businessUnits.service.js.map