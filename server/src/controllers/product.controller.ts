import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as productService from "../services/product.service";

export const createProduct = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const product = await productService.createProduct(req.body);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        product,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProducts = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const products = await productService.getProducts();

    return res.status(200).json({
      success: true,
      data: {
        products,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProductById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const product = await productService.getProductById(
  req.params.id as string
);
    return res.status(200).json({
      success: true,
      data: {
        product,
      },
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const product = await productService.updateProduct(
  req.params.id as string,
  req.body
);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: {
        product,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    await productService.deleteProduct(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};