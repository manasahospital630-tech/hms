import { query } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export const getBusinessUnits = async () => {
  // Ensure migration tables exist
  await query(`
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

  const res = await query(`
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

export const createBusinessUnit = async (data: {
  buId?: string;
  name: string;
  parentBuId?: string;
  category: string;
  unitHeadId?: string;
  status?: string;
}) => {
  let buId = data.buId;
  if (!buId) {
    const countRes = await query('SELECT COUNT(*) FROM business_units');
    const num = parseInt(countRes.rows[0].count, 10) + 1;
    buId = `BU-${String(num).padStart(2, '0')}`;
  }

  const res = await query(
    `INSERT INTO business_units (bu_id, name, parent_bu_id, category, unit_head_id, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [buId, data.name, data.parentBuId || null, data.category || 'Clinical', data.unitHeadId || null, data.status || 'Active']
  );

  const defaultTeamId = `TEAM-${buId.replace('BU-', '')}-DEF`;
  await query(
    `INSERT INTO teams (team_id, team_name, bu_id, team_type)
     VALUES ($1, $2, $3, 'Owner')
     ON CONFLICT DO NOTHING`,
    [defaultTeamId, `${data.name} Default Team`, buId]
  );

  return res.rows[0];
};

export const updateBusinessUnit = async (buId: string, data: {
  name?: string;
  parentBuId?: string;
  category?: string;
  unitHeadId?: string;
  status?: string;
}) => {
  const res = await query(
    `UPDATE business_units
     SET name = COALESCE($1, name),
         parent_bu_id = $2,
         category = COALESCE($3, category),
         unit_head_id = $4,
         status = COALESCE($5, status),
         updated_at = NOW()
     WHERE bu_id = $6
     RETURNING *`,
    [data.name, data.parentBuId || null, data.category, data.unitHeadId || null, data.status, buId]
  );

  if (res.rows.length === 0) throw new AppError('Business Unit not found', 404);
  return res.rows[0];
};

export const getTeams = async () => {
  const res = await query(`
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

export const createTeam = async (data: {
  teamName: string;
  buId: string;
  teamType?: string;
  teamLeadId?: string;
  roles?: string[];
}) => {
  const countRes = await query('SELECT COUNT(*) FROM teams');
  const num = parseInt(countRes.rows[0].count, 10) + 1;
  const teamId = `TEAM-${String(num).padStart(2, '0')}`;

  const res = await query(
    `INSERT INTO teams (team_id, team_name, bu_id, team_type, team_lead_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [teamId, data.teamName, data.buId, data.teamType || 'Owner', data.teamLeadId || null]
  );

  if (data.roles && data.roles.length > 0) {
    for (const role of data.roles) {
      await query(
        `INSERT INTO team_security_roles (team_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [teamId, role]
      );
    }
  }

  return res.rows[0];
};

export const getTeamMembers = async (teamId: string) => {
  const assignedRes = await query(`
    SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, u.employee_department
    FROM team_members tm
    JOIN users u ON tm.user_id = u.user_id
    WHERE tm.team_id = $1
  `, [teamId]);

  const availableRes = await query(`
    SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, u.employee_department
    FROM users u
    WHERE u.role != 'Patient'
      AND u.user_id NOT IN (SELECT user_id FROM team_members WHERE team_id = $1)
    ORDER BY u.first_name ASC
  `, [teamId]);

  const rolesRes = await query(`SELECT role FROM team_security_roles WHERE team_id = $1`, [teamId]);

  return {
    assignedMembers: assignedRes.rows,
    availableUsers: availableRes.rows,
    securityRoles: rolesRes.rows.map(r => r.role)
  };
};

export const updateTeamMembers = async (teamId: string, memberUserIds: string[]) => {
  await query(`DELETE FROM team_members WHERE team_id = $1`, [teamId]);
  for (const uid of memberUserIds) {
    await query(`INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [teamId, uid]);
  }
  return { success: true, count: memberUserIds.length };
};

export const updateTeamRoles = async (teamId: string, roles: string[]) => {
  await query(`DELETE FROM team_security_roles WHERE team_id = $1`, [teamId]);
  for (const role of roles) {
    await query(`INSERT INTO team_security_roles (team_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [teamId, role]);
  }
  return { success: true, roles };
};
