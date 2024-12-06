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

export const validateCreateScaape = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string().required().uuid(),

      name: Joi.string().required(),
      start_date_time: Joi.string().required(),
      end_date_time: Joi.string().required(),
      event_type_id: Joi.string().required(),
      description: Joi.string().required(),
      event_target_group: Joi.string().required(),
      location: Joi.object({
        lat: Joi.number().required(),
        long: Joi.number().required(),
        city: Joi.string().required(),
        address_line: Joi.string().required(),
        landmark: Joi.string().allow(null).optional(),
      }),
      photo_library_setting: Joi.string().required(),
      payment_settings: Joi.object({
        is_free_event: Joi.boolean().required(),
        entry_fees: Joi.number().optional().allow(null),
        cost_breakup: Joi.string().optional(),
        hours_before_cancellation: Joi.number().required(),
        number_of_seats: Joi.number().optional().allow(null),
      }),
    });

    req.body = await schema.validateAsync(req.body);
    next();
  } catch (error: any) {
    res.status(400).send({
      success: false,
      message: "Validation failed",
      errors: error.details.map((detail) => detail.message),
    });
  }
};

export const validateManageApprovals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schema = Joi.object({
      user_id: Joi.string().required().uuid(),
      status: Joi.boolean().required(),
    });

    const paramsSchema = Joi.object({
      scaape_id: Joi.string().required().uuid(),
    });

    req.body = await schema.validateAsync(req.body);
    req.params = await paramsSchema.validateAsync(req.params);
    next();
  } catch (error: any) {
    res.status(400).send({
      success: false,
      message: "Validation failed",
      errors: error.details.map((detail) => detail.message),
    });
  }
};

export const validateFetchScaapeParticipantsByScaapeId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schema = Joi.object({
      scaape_id: Joi.string().required().uuid(),
    });

    const queryParams = Joi.object({
      page: Joi.number().optional().default(0),
      limit: Joi.number().optional().default(10),
    });

    req.params = await schema.validateAsync(req.params);
    req.query = await queryParams.validateAsync(req.query);
    next();
  } catch (error: any) {
    res.status(400).send({
      success: false,
      message: "Validation failed",
      errors: error.details.map((detail) => detail.message),
    });
  }
};

export const validateFetchScaapePendingApprovalsByScaapeId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schema = Joi.object({
      scaape_id: Joi.string().required().uuid(),
    });

    const queryParams = Joi.object({
      page: Joi.number().optional().default(0),
      limit: Joi.number().optional().default(10),
    });

    req.params = await schema.validateAsync(req.params);
    req.query = await queryParams.validateAsync(req.query);
    next();
  } catch (error: any) {
    res.status(400).send({
      success: false,
      message: "Validation failed",
      errors: error.details.map((detail) => detail.message),
    });
  }
};
