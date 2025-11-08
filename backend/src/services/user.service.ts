import type { AuthUser } from '../types/auth';

export class UserService {
  async getProfile(userId: string): Promise<AuthUser & { addressCount: number }> {
    // TODO: 查询数据库获取真实用户信息
    return {
      id: userId,
      phone: '138****8888',
      name: '示例用户',
      role: 'customer',
      addressCount: 2,
    };
  }
}

