import prisma from "../config/database";

interface CreateCustomerInput {
  name: string;
  email: string;
}

interface UpdateCustomerInput {
  name?: string;
  email?: string;
}

export const createCustomer = async (
  input: CreateCustomerInput
) => {
  if (!input.name || !input.email) {
    throw new Error("Name and email are required");
  }

  return prisma.customer.create({
    data: {
      name: input.name,
      email: input.email,
    },
  });
};

export const getCustomers = async () => {
  return prisma.customer.findMany({
    include: {
      orders: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getCustomerById = async (id: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: true,
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
};

export const updateCustomer = async (
  id: string,
  input: UpdateCustomerInput
) => {
  return prisma.customer.update({
    where: { id },
    data: input,
  });
};