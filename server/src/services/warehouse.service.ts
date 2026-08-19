import prisma from "../config/database";

interface CreateWarehouseInput {
  name: string;
  location: string;
  capacity: number;
}

interface UpdateWarehouseInput {
  name?: string;
  location?: string;
  capacity?: number;
}

export const createWarehouse = async (
  input: CreateWarehouseInput
) => {
  if (!input.name || !input.location) {
    throw new Error("Name and location are required");
  }

  if (input.capacity <= 0) {
    throw new Error("Capacity must be greater than 0");
  }

  return prisma.warehouse.create({
    data: {
      name: input.name,
      location: input.location,
      capacity: input.capacity,
    },
  });
};

export const getWarehouses = async () => {
  return prisma.warehouse.findMany({
    include: {
      inventory: {
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

export const getWarehouseById = async (id: string) => {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      inventory: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  return warehouse;
};

export const updateWarehouse = async (
  id: string,
  input: UpdateWarehouseInput
) => {
  const existing = await prisma.warehouse.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Warehouse not found");
  }

  if (
    input.capacity !== undefined &&
    input.capacity <= 0
  ) {
    throw new Error("Capacity must be greater than 0");
  }

  return prisma.warehouse.update({
    where: { id },
    data: input,
  });
};

export const deleteWarehouse = async (id: string) => {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          inventory: true,
        },
      },
    },
  });

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  if (warehouse._count.inventory > 0) {
    throw new Error(
      "Cannot delete warehouse because it contains inventory"
    );
  }

  return prisma.warehouse.delete({
    where: { id },
  });
};