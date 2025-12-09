import joi from 'joi';
import { AuthUserResponseData, BalanceHistoryResponseData, JwtSignInResponseData } from 'types/resources/auth';

import { UserSchema } from 'validation/user';

export const AuthUserResponseSchema = joi.object<AuthUserResponseData>({
  user: UserSchema.required(),
  token: joi.string().required(),
});

export const JwtSignInResponseSchema = joi.object<JwtSignInResponseData>({
  user: UserSchema.required(),
});

const BalanceHistoryItemSchema = joi.object({
  _id: joi.string().required(),
  user_id: joi.string().required(),
  amount: joi.number().required(),
  balance: joi.number().required(),
  currency: joi.string().valid('BET', 'USDT').optional(),
  reason: joi.string().required(),
  reference_id: joi.string().optional(),
  reference_type: joi.string().optional(),
  created_at: joi.string().required(),
  updated_at: joi.string().required()
}).unknown(true);

export const BalanceHistoryResponseSchema = joi.array().items(BalanceHistoryItemSchema);
