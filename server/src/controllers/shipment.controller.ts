import { Request, Response } from "express";
import * as shipmentService from "../services/shipment.service";

export const createShipment = async (
  req: Request,
  res: Response
) => {
  try {
    const shipment =
      await shipmentService.createShipment(req.body);

    res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      data: { shipment },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getShipments = async (
  _req: Request,
  res: Response
) => {
  try {
    const shipments =
      await shipmentService.getShipments();

    res.status(200).json({
      success: true,
      data: { shipments },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getShipmentById = async (
  req: Request,
  res: Response
) => {
  try {
    const shipment =
      await shipmentService.getShipmentById(
        String(req.params.id)
      );

    res.status(200).json({
      success: true,
      data: { shipment },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateShipmentStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const shipment =
      await shipmentService.updateShipmentStatus(
        String(req.params.id),
        req.body.status,
        req.body.actualDate
      );

    res.status(200).json({
      success: true,
      message: "Shipment status updated successfully",
      data: { shipment },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};