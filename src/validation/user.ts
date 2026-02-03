import joi from 'joi';
import { User, UserRole } from 'types/resources/auth';

export const isUserRole = (v: string): boolean => Object.values(UserRole).includes(v as UserRole);

const userRoleValidator = (value: any, helpers: joi.CustomHelpers) => (
  isUserRole(value)
    ? value
    : helpers.message({ custom: `Value '${value}' is not a user role` })
);

export const UserSchema = joi.object<User>({
  _id: joi.string().required(),
  email: joi.string().email({ tlds: { allow: false } }).required(),
  // Allow empty strings for name fields to match backend defaults
  first_name: joi.string().allow('').required(),
  last_name: joi.string().allow('').required(),
  full_name: joi.string().required(),
  // Optional fields
  token_balance: joi.number().optional(),
  cash_balance: joi.number().optional(),
  onboarding_version_seen: joi.number().optional(),
  role: joi.string().custom(userRoleValidator),
  is_bot: joi.boolean().optional(),
}).unknown(true);
