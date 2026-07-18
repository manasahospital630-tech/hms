import bcrypt from 'bcryptjs';
import { query } from '../../config/database';
import { generateToken } from '../../config/jwt';
import { RegisterInput, LoginInput } from './auth.schema';
import { AppError } from '../../middleware/errorHandler';

const SALT_ROUNDS = 12;

export const registerUser = async (input: RegisterInput) => {
  // Check if email already exists
  const existingUser = await query('SELECT user_id FROM users WHERE email = $1', [input.email]);
  if (existingUser.rows.length > 0) {
    throw new AppError('A user with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const result = await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING user_id, email, first_name, last_name, phone, role, is_active, created_at, updated_at`,
    [input.email, passwordHash, input.firstName, input.lastName, input.phone || null, input.role]
  );

  return result.rows[0];
};

export const loginUser = async (input: LoginInput) => {
  const result = await query(
    'SELECT user_id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
    [input.email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password.', 401);
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new AppError('Your account has been deactivated. Please contact an administrator.', 403);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = generateToken({
    userId: user.user_id,
    role: user.role,
    email: user.email,
  });

  return {
    token,
    user: {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    },
  };
};

export const getUserProfile = async (userId: string) => {
  const result = await query(
    `SELECT user_id, email, first_name, last_name, phone, role, is_active, created_at, updated_at
     FROM users WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  return result.rows[0];
};
