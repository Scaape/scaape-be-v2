import { Request, Response } from "express";
import DashboardService from "./service";
import customErrorHandler from "../utils/custom.error.handler";

export default class DashboardController extends DashboardService {
  public fetchScaapesForDashboardController = async (
    req: Request,
    res: Response
  ) => {
    try {
      //
    } catch (err) {
      customErrorHandler(res, err);
    }
  };
}
