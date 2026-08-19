import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { registerUser, loginUser } from "../services/auth.service";

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const result = await registerUser({
      name,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Registration failed";

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await loginUser({
      email,
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Login failed";

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response
) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

export const adminTest = async (
  req: AuthRequest,
  res: Response
) => {
  return res.status(200).json({
    success: true,
    message: "Admin access granted",
    data: {
      user: req.user,
    },
  });
};