import Joi from "joi";
import { Request, Response, NextFunction } from "express";

// Middleware function
export const validateFetchScaapesForDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bodySchema = Joi.object({
      user_id: Joi.string().required(),
    });

    const querySchema = Joi.object({
      long: Joi.string().required(),
      lat: Joi.string().required(),
      city: Joi.string().required(),
    });

    req.body = await bodySchema.validateAsync(req.body);
    req.query = await querySchema.validateAsync(req.query);
    next();
  } catch (error: any) {
    res.status(400).send({
      success: false,
      message: "Validation failed",
      errors: error.details.map((detail) => detail.message),
    });
  }
};
