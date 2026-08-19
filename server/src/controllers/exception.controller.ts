import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as exceptionService from "../services/exception.service";

export const getExceptions = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const exceptions =
      await exceptionService.getExceptions();

    res.status(200).json({
      success: true,
      data: { exceptions },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getExceptionById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const exception =
      await exceptionService.getExceptionById(
        String(req.params.id)
      );

    res.status(200).json({
      success: true,
      data: { exception },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const resolveException = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const exception =
      await exceptionService.resolveException(
        String(req.params.id)
      );

    res.status(200).json({
      success: true,
      message: "Exception resolved successfully",
      data: { exception },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const runDetection = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const result =
      await exceptionService.runExceptionDetection();

    res.status(200).json({
      success: true,
      message: "Exception detection completed",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};