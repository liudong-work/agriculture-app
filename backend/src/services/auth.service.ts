import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { UserRepository } from '../repositories/user.repository';
import type { AuthTokens, AuthUser, LoginInput, RegisterInput } from '../types/auth';

const userRepository = new UserRepository();

function toAuthUser(storedUser: { passwordHash: string } & AuthUser): AuthUser {
  const { passwordHash: _ignored, ...rest } = storedUser;
  return rest;
}

export class AuthService {
  async registerUser(input: RegisterInput): Promise<AuthTokens & { user: AuthUser }> {
    const exists = await userRepository.findByPhone(input.phone);
    if (exists) {
      const error = new Error('手机号已注册');
      (error as any).status = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const storedUser = await userRepository.create({
      phone: input.phone,
      passwordHash: hashedPassword,
      ...(input.name ? { name: input.name } : {}),
      role: 'customer',
    });

    const user = toAuthUser(storedUser);
    const tokens = this.generateTokens(user);

    return { user, ...tokens };
  }

  async login(input: LoginInput): Promise<AuthTokens & { user: AuthUser }> {
    const storedUser = await userRepository.findByPhone(input.phone);
    if (!storedUser) {
      const error = new Error('手机号或密码错误');
      (error as any).status = 401;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(input.password, storedUser.passwordHash);
    if (!isPasswordValid) {
      const error = new Error('手机号或密码错误');
      (error as any).status = 401;
      throw error;
    }

    const user = toAuthUser(storedUser);
    const tokens = this.generateTokens(user);

    return { user, ...tokens };
  }

  verifyAccessToken(token: string): AuthUser {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    return payload;
  }

  private generateTokens(user: AuthUser): AuthTokens {
    const accessToken = jwt.sign(user, env.JWT_SECRET, { expiresIn: '2h' });
    return { accessToken };
  }
}

