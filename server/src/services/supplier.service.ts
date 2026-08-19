import prisma from "../config/database";

interface CreateSupplierInput {
  name: string;
  email?: string;
  phone?: string;
  reliability?: number;
}

interface UpdateSupplierInput {
  name?: string;
  email?: string;
  phone?: string;
  reliability?: number;
}

interface AddSupplierProductInput {
  productId: string;
  unitCost: number;
  leadTimeDays: number;
}

export const createSupplier = async (input: CreateSupplierInput) => {
  return prisma.supplier.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      reliability: input.reliability ?? 0,
    },
  });
};

export const getSuppliers = async () => {
  return prisma.supplier.findMany({
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getSupplierById = async (id: string) => {
  return prisma.supplier.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: true,
        },
      },
      shipments: true,
    },
  });
};

export const updateSupplier = async (
  id: string,
  input: UpdateSupplierInput
) => {
  return prisma.supplier.update({
    where: { id },
    data: input,
  });
};

export const deleteSupplier = async (id: string) => {
  return prisma.supplier.delete({
    where: { id },
  });
};

export const addSupplierProduct = async (
  supplierId: string,
  input: AddSupplierProductInput
) => {
  return prisma.supplierProduct.create({
    data: {
      supplierId,
      productId: input.productId,
      unitCost: input.unitCost,
      leadTimeDays: input.leadTimeDays,
    },
    include: {
      supplier: true,
      product: true,
    },
  });
};

export const getSupplierProducts = async (supplierId: string) => {
  return prisma.supplierProduct.findMany({
    where: { supplierId },
    include: {
      product: true,
    },
  });
};