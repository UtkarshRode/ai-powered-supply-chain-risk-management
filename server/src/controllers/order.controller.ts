import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as orderService from "../services/order.service";

export const createOrder = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const order = await orderService.createOrder(
      req.body,
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { order },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOrders = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const orders = await orderService.getOrders();

    res.status(200).json({
      success: true,
      data: { orders },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOrderById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const order = await orderService.getOrderById(
      String(req.params.id)
    );

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const order =
      await orderService.updateOrderStatus(
        String(req.params.id),
        req.body.status
      );

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: { order },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOrderRiskAnalysis = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const orderId = String(req.params.id);

    const analyses =
      await orderService.getOrderRiskAnalysis(orderId);

    res.status(200).json({
      success: true,
      data: {
        analyses,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};