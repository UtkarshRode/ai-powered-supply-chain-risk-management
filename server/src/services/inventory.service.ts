import prisma from "../config/database";

interface CreateInventoryInput {
  warehouseId: string;
  productId: string;
  quantity: number;
}

interface UpdateInventoryInput {
  quantity?: number;
}

export const createInventory = async (
  input: CreateInventoryInput
) => {
  if (!input.warehouseId || !input.productId) {
    throw new Error("Warehouse and product are required");
  }

  if (input.quantity < 0) {
    throw new Error("Quantity cannot be negative");
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: input.warehouseId },
  });

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const existing = await prisma.inventory.findUnique({
    where: {
      warehouseId_productId: {
        warehouseId: input.warehouseId,
        productId: input.productId,
      },
    },
  });

  if (existing) {
    throw new Error(
      "Inventory already exists for this product in this warehouse"
    );
  }

  if (input.quantity > warehouse.capacity) {
    throw new Error(
      "Initial quantity exceeds warehouse capacity"
    );
  }

  return prisma.inventory.create({
    data: {
      warehouseId: input.warehouseId,
      productId: input.productId,
      quantity: input.quantity,
    },
    include: {
      warehouse: true,
      product: true,
    },
  });
};

export const getInventory = async () => {
  return prisma.inventory.findMany({
    include: {
      warehouse: true,
      product: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
};

export const getInventoryById = async (id: string) => {
  const inventory = await prisma.inventory.findUnique({
    where: { id },
    include: {
      warehouse: true,
      product: true,
    },
  });

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  return inventory;
};

export const updateInventory = async (
  id: string,
  input: UpdateInventoryInput
) => {
  const inventory = await prisma.inventory.findUnique({
    where: { id },
    include: {
      warehouse: true,
    },
  });

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  if (input.quantity === undefined) {
    throw new Error("Quantity is required");
  }

  if (input.quantity < inventory.reserved) {
    throw new Error(
      "Quantity cannot be less than reserved stock"
    );
  }

  if (input.quantity > inventory.warehouse.capacity) {
    throw new Error("Quantity exceeds warehouse capacity");
  }

  return prisma.inventory.update({
    where: { id },
    data: {
      quantity: input.quantity,
    },
    include: {
      warehouse: true,
      product: true,
    },
  });
};

export const reserveInventory = async (
  id: string,
  amount: number
) => {
  if (amount <= 0) {
    throw new Error("Reservation amount must be greater than 0");
  }

  return prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      throw new Error("Inventory not found");
    }

    const available =
      inventory.quantity - inventory.reserved;

    if (amount > available) {
      throw new Error(
        `Insufficient available stock. Available: ${available}`
      );
    }

    return tx.inventory.update({
      where: { id },
      data: {
        reserved: {
          increment: amount,
        },
      },
      include: {
        warehouse: true,
        product: true,
      },
    });
  });
};

export const releaseInventory = async (
  id: string,
  amount: number
) => {
  if (amount <= 0) {
    throw new Error(
      "Release amount must be greater than 0"
    );
  }

  return prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      throw new Error("Inventory not found");
    }

    if (amount > inventory.reserved) {
      throw new Error(
        `Cannot release ${amount}. Reserved stock: ${inventory.reserved}`
      );
    }

    return tx.inventory.update({
      where: { id },
      data: {
        reserved: {
          decrement: amount,
        },
      },
      include: {
        warehouse: true,
        product: true,
      },
    });
  });
};