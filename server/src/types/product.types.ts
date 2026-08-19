export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  unitPrice: number;
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string;
  unitPrice?: number;
}