import customErrorHandler from "../utils/custom.error.handler";
import FavoriteScaapeService from "./service";
import { Request, Response } from "express";

export default class FavoriteScaapesController extends FavoriteScaapeService {
  public fetchFavoriteScaapesController = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { user_id } = req.body,
        { long, lat, page, limit } = req.query;

      const { data, meta_data } =
        await this.fetchFavoriteScaapesByUserIdService({
          user_id: user_id as string,
          lat: parseFloat(lat as string),
          long: parseFloat(long as string),
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        });

      res.status(200).send({
        success: true,
        data,
        meta_data,
      });
    } catch (err) {
      customErrorHandler(res, err);
    }
  };

  public updateFavoriteScaapeController = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { user_id, is_favorite } = req.body,
        { scaape_id } = req.params;

      await this.updateFavoriteScaapeService({
        user_id: user_id as string,
        scaape_id: scaape_id as string,
        is_favorite: is_favorite as boolean,
      });

      res.status(200).send({
        success: true,
        message: "Favorite scaape updated successfully",
      });
    } catch (err) {
      customErrorHandler(res, err);
    }
  };
}
