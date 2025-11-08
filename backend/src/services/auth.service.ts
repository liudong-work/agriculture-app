import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { UserRepository } from '../repositories/user.repository';
import type { AuthTokens, AuthUser, LoginInput, RegisterInput } from '../types/auth';

const userRepository = new UserRepository();

export class AuthService {
  async registerUser(input: RegisterInput): Promise<AuthTokens & { user: AuthUser }> {
    // TODO: 接入数据库，校验手机验证码等逻辑
    const exists = await userRepository.findByPhone(input.phone);
    if (exists) {
      const error = new Error('手机号已注册');
      (error as any).status = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user: AuthUser = {
      id: randomUUID(),
      phone: input.phone,
      role: 'customer',
      ...(input.name ? { name: input.name } : {}),
    };

    const tokens = this.generateTokens(user);
    await userRepository.create({ ...user, passwordHash: hashedPassword });

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

    const { passwordHash, ...user } = storedUser;

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

