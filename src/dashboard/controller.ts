import { Request, Response } from "express";
import DashboardService from "./service";
import customErrorHandler from "../utils/custom.error.handler";

export default class DashboardController extends DashboardService {
  public fetchScaapesForDashboardController = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { user_id } = req.body,
        { long, lat, city } = req.query;

      const scaapes = await this.fetchScaapesForDashboardService({
        long: parseFloat(long as string),
        lat: parseFloat(lat as string),
        city: city as string,
        user_id: user_id as string,
      });

      res.status(200).send({
        success: true,
        data: scaapes,
      });
    } catch (err) {
      customErrorHandler(res, err);
    }
  };

  public fetchScaapeDetailsByIdController = async (
    req: Request,
    res: Response
  ) => {
    //
  };
}
