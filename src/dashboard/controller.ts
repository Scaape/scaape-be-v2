import { Request, Response } from "express";
import DashboardService from "./service";
import customErrorHandler from "../utils/custom.error.handler";
import { BasicAllScaapeFilter } from "./types/enums";

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
    try {
      const { user_id } = req.body,
        { long, lat } = req.query,
        { id } = req.params;

      const scaapeDetails = await this.fetchScaapeDetailsByIdService({
        scaape_id: id,
        user_id: user_id as string,
        lat: parseFloat(lat as string),
        long: parseFloat(long as string),
      });

      res.status(200).send({
        success: true,
        data: scaapeDetails,
      });
    } catch (err) {
      customErrorHandler(res, err);
    }
  };

  /**
   *
   * @param req {
   * user_id: string;
   * name: string;
   * start_date_time: string;
   * end_date_time: string;
   * event_type_id: string;
   * description: string;
   * event_target_group: string;
   * location: {
   *  lat: number;
   *  long: number;
   *  address_line: string;
   *  landmark: string | null;
   * };
   * photo_library_setting: string; ENUM (anyone_can_post, deny_all)
   * payment_settings: {
   *  number_of_seats: number | null;
   *  is_free_event: boolean;
   *  cost_breakup: string | null;
   *  entry_fees: number | null;
   *  hours_before_cancellation: number;
   * }
   *
   *
   *
   * }
   * @param res
   */
  public createScaapeController = async (req: Request, res: Response) => {
    try {
      const {
        user_id,
        name,
        start_date_time,
        end_date_time,
        event_type_id,
        description,
        event_target_group,
        location,
        photo_library_setting,
        payment_settings,
      } = req.body;

      await this.createScaapeService({
        user_id,
        name,
        start_date_time,
        end_date_time,
        event_type_id,
        description,
        event_target_group,
        location,
        photo_library_setting,
        payment_settings,
      });

      res.status(200).send({
        success: true,
        message: "Scaape created successfully",
      });
    } catch (err) {
      customErrorHandler(res, err);
    }
  };

  /**
   *
   * @param req.query {
   *   basic_filter: near_me, all, recommended, popular, previously_attended
   *   city: string;
   *   long: number;
   *   lat: number;
   *   page: number;
   *   limit: number;
   * }
   * @param res
   */
  public fetchScaapesController = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.body,
        { long, lat, city, limit, page, basic_filter } = req.query;

      const { data, meta_data } = await this.fetchScaapesService({
        user_id: user_id as string,
        long: parseFloat(long as string),
        lat: parseFloat(lat as string),
        city: city as string,
        page: parseInt(page as string) || 0,
        limit: parseInt(limit as string) || 10,
        basic_filter: basic_filter as BasicAllScaapeFilter,
      });

      res.status(200).send({
        success: true,
        meta_data,
        data,
      });
    } catch (err) {
      customErrorHandler(res, err);
    }
  };

  public fetchScaapeParticipantsController = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { scaape_id } = req.params,
        { page, limit } = req.query;

      const { data, meta_data } = await this.fetchScaapePendingApprovalsService(
        {
          id: scaape_id,
          page: parseInt(page as string) || 0,
          limit: parseInt(limit as string) || 10,
        }
      );

      res.status(200).send({
        success: true,
        meta_data,
        data,
      });
    } catch (err) {
      customErrorHandler(res, err);
    }
  };

  /**
   * things to check for joining a scaape
   * / paid
   *    - check if the user has paid
   *    - transaction_id
   *    - check if the event is women OR men ONLY event
   *    - check if the user is of the same
   *    -
   * / un-paid
   */

  public manageApprovalsController = async (req: Request, res: Response) => {
    try {
      const { status, user_id } = req.body,
        { scaape_id: id } = req.params;

      await this.manageApprovalsService({
        id,
        status,
        user_id,
      });

      res.status(200).send({
        success: true,
        message: "Approval status updated successfully",
      });
    } catch (err) {
      customErrorHandler(res, err);
    }
  };

  public fetchScaapeParticipantsByScaapeIdController = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { scaape_id } = req.params,
        { page, limit } = req.query;
      const { data, meta_data } =
        await this.fetchScaapeParticipantsByScaapeIdService({
          id: scaape_id,
          page: parseInt(page as string) || 0,
          limit: parseInt(limit as string) || 10,
        });

      res.status(200).send({
        success: true,
        meta_data,
        data,
      });
    } catch (err) {
      customErrorHandler(res, err);
    }
  };

  public fetchLocationDetailsController = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { lat, long } = req.query;

      const locationDetails = await this.fetchLocationDetailsService({
        lat: parseFloat(lat as string),
        long: parseFloat(long as string),
      });

      res.status(200).send({
        success: true,
        data: locationDetails,
      });
    } catch (err) {
      customErrorHandler(res, err);
    }
  };
}
