import prisma from "../config/database";
import {
  CreateProductInput,
  UpdateProductInput,
} from "../types/product.types";

export const createProduct = async (
  input: CreateProductInput
) => {
  const { sku, name, description, unitPrice } = input;

  if (!sku || !name) {
    throw new Error("SKU and name are required");
  }

  if (unitPrice <= 0) {
    throw new Error("Unit price must be greater than 0");
  }

  const existingProduct = await prisma.product.findUnique({
    where: { sku },
  });

  if (existingProduct) {
    throw new Error("Product with this SKU already exists");
  }

  return prisma.product.create({
    data: {
      sku,
      name,
      description,
      unitPrice,
    },
  });
};

export const getProducts = async () => {
  return prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

export const updateProduct = async (
  id: string,
  input: UpdateProductInput
) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new Error("Product not found");
  }

  if (
    input.unitPrice !== undefined &&
    input.unitPrice <= 0
  ) {
    throw new Error("Unit price must be greater than 0");
  }

  if (input.sku && input.sku !== existingProduct.sku) {
    const skuExists = await prisma.product.findUnique({
      where: { sku: input.sku },
    });

    if (skuExists) {
      throw new Error("Product with this SKU already exists");
    }
  }

  return prisma.product.update({
    where: { id },
    data: input,
  });
};

export const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          inventory: true,
          orderItems: true,
          supplierProducts: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const hasDependencies =
    product._count.inventory > 0 ||
    product._count.orderItems > 0 ||
    product._count.supplierProducts > 0;

  if (hasDependencies) {
    throw new Error(
      "Cannot delete product because it is being used by inventory, orders, or suppliers"
    );
  }

  return prisma.product.delete({
    where: { id },
  });
};