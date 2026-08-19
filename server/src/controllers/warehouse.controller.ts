import { Request, Response } from "express";
import * as warehouseService from "../services/warehouse.service";

export const createWarehouse = async (
  req: Request,
  res: Response
) => {
  try {
    const warehouse =
      await warehouseService.createWarehouse(req.body);

    res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
      data: { warehouse },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getWarehouses = async (
  _req: Request,
  res: Response
) => {
  try {
    const warehouses =
      await warehouseService.getWarehouses();

    res.status(200).json({
      success: true,
      data: { warehouses },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getWarehouseById = async (
  req: Request,
  res: Response
) => {
  try {
    const warehouse =
      await warehouseService.getWarehouseById(
        String(req.params.id)
      );

    res.status(200).json({
      success: true,
      data: { warehouse },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateWarehouse = async (
  req: Request,
  res: Response
) => {
  try {
    const warehouse =
      await warehouseService.updateWarehouse(
        String(req.params.id),
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Warehouse updated successfully",
      data: { warehouse },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteWarehouse = async (
  req: Request,
  res: Response
) => {
  try {
    await warehouseService.deleteWarehouse(
      String(req.params.id)
    );

    res.status(200).json({
      success: true,
      message: "Warehouse deleted successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};