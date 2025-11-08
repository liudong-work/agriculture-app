import bcrypt from 'bcrypt';
import type { AuthUser } from '../types/auth';

type StoredUser = AuthUser & {
  passwordHash: string;
};

const users = new Map<string, StoredUser>();
let isSeeded = false;

function seedDefaultUsers() {
  if (isSeeded) {
    return;
  }

  const defaults: Array<{ phone: string; password: string; name: string; role: AuthUser['role'] }> = [
    { phone: '18800000001', password: 'farmer123', name: '示例农户一号', role: 'farmer' },
    { phone: '18800000002', password: 'farmer123', name: '示例农户二号', role: 'farmer' },
    { phone: '18800000003', password: 'farmer123', name: '农技支持', role: 'farmer' },
  ];

  defaults.forEach((item) => {
    const user: StoredUser = {
      id: `seed-${item.phone}`,
      phone: item.phone,
      name: item.name,
      role: item.role,
      passwordHash: bcrypt.hashSync(item.password, 10),
    };
    users.set(user.phone, user);
  });

  isSeeded = true;
}

export class UserRepository {
  constructor() {
    seedDefaultUsers();
  }

  async create(user: StoredUser): Promise<StoredUser> {
    users.set(user.phone, user);
    return user;
  }

  async findByPhone(phone: string): Promise<StoredUser | undefined> {
    return users.get(phone);
  }
}

