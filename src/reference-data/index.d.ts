export interface SampleProduct {
  name: string;
  price: number;
  configs: string[];
  cx?: boolean;
}

export const sampleProducts: SampleProduct[];
