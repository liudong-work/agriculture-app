export type Address = {
  id: string;
  userId: string;
  contactName: string;
  contactPhone: string;
  province: string;
  city: string;
  district: string;
  street: string;
  detail?: string;
  postalCode?: string;
  isDefault: boolean;
  tag?: string;
};

export type AddressPayload = Omit<Address, 'id' | 'userId'>;


