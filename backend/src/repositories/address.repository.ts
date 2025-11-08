import { randomUUID } from 'crypto';

import type { Address, AddressPayload } from '../types/address';

const addresses = new Map<string, Address[]>();

export class AddressRepository {
  async listByUser(userId: string): Promise<Address[]> {
    return addresses.get(userId) ?? [];
  }

  async create(userId: string, payload: AddressPayload): Promise<Address> {
    const newAddress: Address = {
      id: randomUUID(),
      userId,
      ...payload,
    };

    const userAddresses = await this.listByUser(userId);
    userAddresses.push(newAddress);
    addresses.set(userId, userAddresses);

    return newAddress;
  }

  async update(userId: string, addressId: string, payload: AddressPayload): Promise<Address> {
    const userAddresses = await this.listByUser(userId);
    const target = userAddresses.find((address) => address.id === addressId);
    if (!target) {
      const error = new Error('收货地址不存在');
      (error as any).status = 404;
      throw error;
    }

    Object.assign(target, payload);
    return target;
  }

  async remove(userId: string, addressId: string): Promise<void> {
    const userAddresses = await this.listByUser(userId);
    const next = userAddresses.filter((address) => address.id !== addressId);
    addresses.set(userId, next);
  }

  async clearDefaultFlag(userId: string): Promise<void> {
    const userAddresses = await this.listByUser(userId);
    userAddresses.forEach((address) => {
      address.isDefault = false;
    });
  }
}


