import { prisma } from '../lib/prisma';
import type { Address, AddressPayload } from '../types/address';

function mapAddress(record: any): Address {
  return {
    id: record.id,
    userId: record.userId,
    contactName: record.contactName,
    contactPhone: record.contactPhone,
    province: record.province,
    city: record.city,
    district: record.district,
    street: record.street,
    detail: record.detail ?? undefined,
    postalCode: record.postalCode ?? undefined,
    tag: record.tag ?? undefined,
    isDefault: record.isDefault,
    ...(record.longitude !== null ? { longitude: record.longitude } : {}),
    ...(record.latitude !== null ? { latitude: record.latitude } : {}),
  };
}

export class AddressRepository {
  async listByUser(userId: string): Promise<Address[]> {
    const records = await prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }] });
    return records.map(mapAddress);
  }

  async create(userId: string, payload: AddressPayload): Promise<Address> {
    if (payload.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const record = await prisma.address.create({
      data: {
        userId,
        contactName: payload.contactName,
        contactPhone: payload.contactPhone,
        province: payload.province,
        city: payload.city,
        district: payload.district,
        street: payload.street,
        detail: payload.detail ?? null,
        postalCode: payload.postalCode ?? null,
        tag: payload.tag ?? null,
        isDefault: payload.isDefault ?? false,
        longitude: payload.longitude ?? null,
        latitude: payload.latitude ?? null,
      },
    });

    return mapAddress(record);
  }

  async update(userId: string, addressId: string, payload: AddressPayload): Promise<Address> {
    const existing = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!existing) {
      const error = new Error('收货地址不存在');
      (error as any).status = 404;
      throw error;
    }

    if (payload.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const record = await prisma.address.update({
      where: { id: addressId },
      data: {
        contactName: payload.contactName,
        contactPhone: payload.contactPhone,
        province: payload.province,
        city: payload.city,
        district: payload.district,
        street: payload.street,
        detail: payload.detail ?? null,
        postalCode: payload.postalCode ?? null,
        tag: payload.tag ?? null,
        isDefault: payload.isDefault ?? existing.isDefault,
        longitude: payload.longitude ?? null,
        latitude: payload.latitude ?? null,
      },
    });

    return mapAddress(record);
  }

  async remove(userId: string, addressId: string): Promise<void> {
    const existing = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!existing) {
      const error = new Error('收货地址不存在');
      (error as any).status = 404;
      throw error;
    }

    await prisma.address.delete({ where: { id: addressId } });
  }

  async clearDefaultFlag(userId: string): Promise<void> {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
}


