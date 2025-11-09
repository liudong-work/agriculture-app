import { AddressRepository } from '../repositories/address.repository';
import type { Address, AddressPayload } from '../types/address';

const addressRepository = new AddressRepository();

export class AddressService {
  async listAddresses(userId: string): Promise<Address[]> {
    return addressRepository.listByUser(userId);
  }

  async createAddress(userId: string, payload: AddressPayload): Promise<Address> {
    return addressRepository.create(userId, payload);
  }

  async updateAddress(userId: string, addressId: string, payload: AddressPayload): Promise<Address> {
    return addressRepository.update(userId, addressId, payload);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    await addressRepository.remove(userId, addressId);
  }
}


