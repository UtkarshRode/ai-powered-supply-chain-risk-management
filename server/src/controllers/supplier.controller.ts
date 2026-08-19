import { Request, Response } from "express";
import * as supplierService from "../services/supplier.service";

export const createSupplier = async (
  req: Request,
  res: Response
) => {
  try {
    const supplier = await supplierService.createSupplier(req.body);

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: { supplier },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSuppliers = async (
  _req: Request,
  res: Response
) => {
  try {
    const suppliers = await supplierService.getSuppliers();

    res.status(200).json({
      success: true,
      data: { suppliers },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSupplierById = async (
  req: Request,
  res: Response
) => {
  try {
    const supplier = await supplierService.getSupplierById(
  String(req.params.id)
);

    if (!supplier) {
      res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { supplier },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSupplier = async (
  req: Request,
  res: Response
) => {
  try {
    const supplier = await supplierService.updateSupplier(
  String(req.params.id),
  req.body
);

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: { supplier },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteSupplier = async (
  req: Request,
  res: Response
) => {
  try {
    await supplierService.deleteSupplier(
  String(req.params.id)
);

    res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const addSupplierProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const supplierProduct =
  await supplierService.addSupplierProduct(
    String(req.params.id),
    req.body
  );

    res.status(201).json({
      success: true,
      message: "Product added to supplier successfully",
      data: { supplierProduct },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSupplierProducts = async (
  req: Request,
  res: Response
) => {
  try {
    const products = await supplierService.getSupplierProducts(
  String(req.params.id)
);
    res.status(200).json({
      success: true,
      data: { products },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};