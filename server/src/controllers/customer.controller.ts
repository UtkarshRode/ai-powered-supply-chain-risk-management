import { Request, Response } from "express";
import * as customerService from "../services/customer.service";

export const createCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const customer = await customerService.createCustomer(
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: { customer },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCustomers = async (
  _req: Request,
  res: Response
) => {
  try {
    const customers = await customerService.getCustomers();

    res.status(200).json({
      success: true,
      data: { customers },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCustomerById = async (
  req: Request,
  res: Response
) => {
  try {
    const customer =
      await customerService.getCustomerById(
        String(req.params.id)
      );

    res.status(200).json({
      success: true,
      data: { customer },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const customer =
      await customerService.updateCustomer(
        String(req.params.id),
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: { customer },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};