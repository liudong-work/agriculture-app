export type Address = {
  id: string;
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

export type UpsertAddressPayload = {
  contactName: string;
  contactPhone: string;
  province: string;
  city: string;
  district: string;
  street: string;
  detail?: string;
  postalCode?: string;
  isDefault?: boolean;
  tag?: string;
};


