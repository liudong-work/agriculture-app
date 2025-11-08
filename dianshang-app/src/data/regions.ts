import regionsData from './regions.json';

export type RegionNode = {
  code: string;
  name: string;
  children?: RegionNode[];
};

export const provinces: RegionNode[] = regionsData as RegionNode[];

export function findProvinceByName(name: string): RegionNode | undefined {
  return provinces.find((province) => province.name === name);
}

export function findCityByName(province: RegionNode, cityName: string): RegionNode | undefined {
  return province.children?.find((city) => city.name === cityName);
}

export function findDistrictByName(city: RegionNode, districtName: string): RegionNode | undefined {
  return city.children?.find((district) => district.name === districtName);
}


