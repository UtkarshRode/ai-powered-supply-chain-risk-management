import { Request, Response } from "express";
import * as inventoryService from "../services/inventory.service";

export const createInventory = async (
  req: Request,
  res: Response
) => {
  try {
    const inventory =
      await inventoryService.createInventory(req.body);

    res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      data: { inventory },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInventory = async (
  _req: Request,
  res: Response
) => {
  try {
    const inventory =
      await inventoryService.getInventory();

    res.status(200).json({
      success: true,
      data: { inventory },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInventoryById = async (
  req: Request,
  res: Response
) => {
  try {
    const inventory =
      await inventoryService.getInventoryById(
        String(req.params.id)
      );

    res.status(200).json({
      success: true,
      data: { inventory },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateInventory = async (
  req: Request,
  res: Response
) => {
  try {
    const inventory =
      await inventoryService.updateInventory(
        String(req.params.id),
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: { inventory },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const reserveInventory = async (
  req: Request,
  res: Response
) => {
  try {
    const inventory =
      await inventoryService.reserveInventory(
        String(req.params.id),
        Number(req.body.amount)
      );

    res.status(200).json({
      success: true,
      message: "Inventory reserved successfully",
      data: { inventory },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const releaseInventory = async (
  req: Request,
  res: Response
) => {
  try {
    const inventory =
      await inventoryService.releaseInventory(
        String(req.params.id),
        Number(req.body.amount)
      );

    res.status(200).json({
      success: true,
      message: "Inventory released successfully",
      data: { inventory },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};