import { v4 } from "uuid";
import ErrorHandler from "../utils/error.handler";
import DashboardHelper from "./helper";
import {
  AccountType,
  BasicAllScaapeFilter,
  ScaapeParticipantsStatus,
} from "./types/enums";
import {
  IAllFetchScaapesDbReqObj,
  IAllFetchScaapesReqObj,
  ICreateScaapeControllerReqObj,
  ICreateScaapeObj,
  IFetchDashboardScaapeReqObj,
  IFetchLocationDetailsReqObj,
  IFetchScaapeDetailsByIdDbReqObj,
  IFetchScaapeDetailsByIdDbRes,
  IFetchScaapeParticipantsByScaapeIdReqObj,
  IFetchScaapePendingApprovalsByIdReqObj,
  IFetchScaapesDbReqObj,
  IFetchScaapesDbRes,
  IManageApprovalsReqObj,
  IMetaData,
  IUpdateScaapeAttendeeCountDbReqObj,
  IUpdateScaapeBasicDetailsObj,
  IUpdateScaapeBasicDetailsReqObj,
  IUpdateScaapeLocationDetailsObj,
  IUpdateScaapeLocationDetailsReqObj,
  IUpdateScaapeParticipantsStatusDbReqObj,
  IUpdateScaapePaymentDetailsObj,
  IUpdateScaapePaymentDetailsReqObj,
} from "./types/interface";
import moment from "moment";

export default class DashboardService extends DashboardHelper {
  /**
   * service to fetch the scaape
   * - input: lat, long & city
   *
   */
  protected fetchScaapesForDashboardService = async (
    reqObj: IFetchDashboardScaapeReqObj
  ) => {
    const { long, lat, city, user_id } = reqObj;

    /**
     * fetch the user interests accordingly to the user profile
     * fetch the events on the basis of user -> location (city, range & geo) + user interests
     */

    const userDetails = await this.fetchUserDetailsWithInterestsDb(user_id);

    if (!userDetails) {
      throw new ErrorHandler({
        status_code: 400,
        message: "Sadly you are not a part of Scaape",
      });
    }

    const { scaape_event_ids } = userDetails;

    const filterObj: IFetchScaapesDbReqObj = {
      scaape_event_ids: scaape_event_ids.filter((id) => id !== null),
      user_id,
      lat,
      long,
      city,
      location_range: userDetails.location_range,
      limit: 5, // this for the dashboard API
      page: 0,
      target_group: this.getTargetGroup(userDetails.gender),
    };

    const scaapes = await this.fetchDashboardScaapesDb(filterObj);

    /**
     * TODO: We need to attach the IMAGE fetching service
     */

    return scaapes;
  };

  protected fetchScaapeDetailsByIdService = async (
    reqObj: IFetchScaapeDetailsByIdDbReqObj
  ): Promise<IFetchScaapeDetailsByIdDbRes> => {
    const { scaape_id, user_id, long, lat } = reqObj;

    const scaapeDetails = await this.fetchScaapeDetailsByIdDb({
      scaape_id,
      user_id,
      long,
      lat,
    });

    if (!scaapeDetails) {
      throw new ErrorHandler({
        status_code: 400,
        message: "Scaape not found",
      });
    }

    return scaapeDetails;
  };

  protected createScaapeService = async (
    reqObj: ICreateScaapeControllerReqObj
  ) => {
    const { user_id } = reqObj;

    const userDetails = await this.fetchUserDetailsWithPaymentMethodByUserId(
      user_id
    );

    if (!userDetails) {
      throw new ErrorHandler({
        status_code: 400,
        message: "User not found",
      });
    }

    this.userStatusCheck(userDetails.status);

    const { payment_settings } = reqObj;

    if (
      !payment_settings?.is_free_event &&
      userDetails.account_type === AccountType.User
    ) {
      throw new ErrorHandler({
        status_code: 400,
        message: "You can't create paid events",
      });
    }

    const scaapeObj: ICreateScaapeObj = {
      id: v4(),
      name: reqObj?.name,
      description: reqObj?.description,
      event_start_datetime: reqObj?.start_date_time,
      event_end_datetime: reqObj?.end_date_time,
      scaape_event_id: reqObj?.event_type_id,
      payment_method_id: userDetails?.payment_method?.id ?? null,
      photo_library_setting: reqObj?.photo_library_setting,
      target_group: reqObj?.event_target_group,
      lat: reqObj?.location?.lat,
      long: reqObj?.location?.long,
      city: reqObj?.location?.city,
      address_line: reqObj?.location?.address_line,
      address_landmark: reqObj?.location?.landmark,
      amount: payment_settings?.entry_fees ?? null,
      cost_breakup: payment_settings?.cost_breakup ?? null,
      hours_before_cancellation:
        payment_settings?.hours_before_cancellation ?? null,
      number_of_seats: payment_settings?.number_of_seats ?? null,
      attendee_count: 0,
      created_by: user_id,
      created_at: moment().format(),
    };

    return this.insertScaapeDb(scaapeObj);
  };

  protected fetchScaapesService = async (reqObj: IAllFetchScaapesReqObj) => {
    const { user_id, long, lat, city, limit, page, basic_filter } = reqObj;
    const userDetails = await this.fetchUserDetailsWithInterestsDb(user_id);

    if (!userDetails) {
      throw new ErrorHandler({
        status_code: 400,
        message: "Sadly you are not a part of Scaape",
      });
    }

    const { scaape_event_ids } = userDetails;

    const filterObj: IAllFetchScaapesDbReqObj = {
      scaape_event_ids: scaape_event_ids.filter((id) => id !== null),
      user_id,
      lat,
      long,
      city,
      location_range: userDetails.location_range,
      limit,
      page,
      target_group: this.getTargetGroup(userDetails.gender),
    };

    let scaapes: IFetchScaapesDbRes[] = [];
    const metaData: IMetaData = {
      total_items: 0,
      page_no: page,
      items_on_page: 0,
    };

    switch (basic_filter) {
      case BasicAllScaapeFilter.NEAR_ME:
        scaapes = await this.fetchScaapesNearMeDb(filterObj);
        metaData.total_items = await this.fetchTotalScaapesNearMeDb(filterObj);
        metaData.items_on_page = scaapes.length;

      case BasicAllScaapeFilter.POPULAR:
        scaapes = await this.fetchPopularScaapesDb(filterObj);
        metaData.total_items = await this.fetchTotalPopularScaapesDb(filterObj);
        metaData.items_on_page = scaapes.length;

      case BasicAllScaapeFilter.RECOMMENDED:
        scaapes = await this.fetchRecommendedScaapesDb(filterObj);
        metaData.total_items = await this.fetchTotalRecommendedScaapesDb(
          filterObj
        );
        metaData.items_on_page = scaapes.length;

      case BasicAllScaapeFilter.PREVIOUSLY_ATTENDED:
        scaapes = await this.fetchPreviouslyAttendedScaapesDb(filterObj);
        metaData.total_items = await this.fetchTotalPreviouslyAttendedScaapesDb(
          filterObj
        );
        metaData.items_on_page = scaapes.length;
      default:
        scaapes = [];
    }

    return { data: scaapes, meta_data: metaData };
  };

  protected fetchScaapePendingApprovalsService = async (
    reqObj: IFetchScaapePendingApprovalsByIdReqObj
  ) => {
    const [pendingList, totalCount] = await Promise.all([
      this.fetchScaapePendingApprovalsByIdDb(reqObj),
      this.fetchTotalScaapePendingApprovalsByIdDb(reqObj),
    ]);

    const metaData: IMetaData = {
      total_items: totalCount,
      page_no: reqObj.page,
      items_on_page: pendingList.length,
    };

    return { data: pendingList, meta_data: metaData };
  };

  protected manageApprovalsService = async (reqObj: IManageApprovalsReqObj) => {
    /**
     * 1. Check if the user is the creator of the event
     * 2. Check the user status & scaape Status
     * 3. Check if the user is already approved
     */

    const { id, status } = reqObj;

    const scaapeParticipationDetails = await this.fetchScaapeParticipantsByIdDb(
      id
    );

    if (!scaapeParticipationDetails) {
      throw new ErrorHandler({
        status_code: 400,
        message: "Scaape not found",
      });
    }

    const {
      status: currentStatus,
      scaape_details,
      user_details,
    } = scaapeParticipationDetails;

    if (user_details?.id === scaape_details?.created_by) {
      throw new ErrorHandler({
        status_code: 400,
        message: "You can't approve your own event",
      });
    }

    if (user_details.deleted_at) {
      throw new ErrorHandler({
        status_code: 400,
        message: "User is deleted",
      });
    }

    if (currentStatus !== ScaapeParticipantsStatus.Pending) {
      throw new ErrorHandler({
        status_code: 400,
        message: `You have already ${currentStatus} the event`,
      });
    }

    const { no_of_seats, attendee_count } = scaape_details;

    const isLimitedSeatScaape = this.isLimitedSeatScaape(no_of_seats);

    if (isLimitedSeatScaape && no_of_seats) {
      if (
        attendee_count >= no_of_seats &&
        status === ScaapeParticipantsStatus.Accepted
      ) {
        throw new ErrorHandler({
          status_code: 400,
          message: `Scaape is already full!`,
        });
      }
    }

    const isUserAccepted = this.isAccepted(status);

    const executionPromises: any = [];

    const updateParticipationStatusObj: IUpdateScaapeParticipantsStatusDbReqObj =
      {
        id,
        status,
        accepted_at: isUserAccepted ? moment().format() : null,
        rejected_at: !isUserAccepted ? moment().format() : null,
        updated_at: moment().format(),
        updated_by: reqObj.user_id,
      };

    executionPromises.push(
      this.updateScaapeParticipantsDb(updateParticipationStatusObj)
    );

    if (isUserAccepted) {
      const updateScaapeAttendeeCountObj: IUpdateScaapeAttendeeCountDbReqObj = {
        id: scaape_details.id,
        attendee_count: attendee_count + 1,
        updated_at: moment().format(),
        updated_by: reqObj.user_id,
      };

      executionPromises.push(
        this.updateScaapesDb(updateScaapeAttendeeCountObj)
      );
    }

    return Promise.all(executionPromises);

    /**
     * TODO: AFTER the approval
     * - Notify the user about the approval
     * - Add them to the event group/chat
     */
  };

  protected fetchScaapeParticipantsByScaapeIdService = async (
    reqObj: IFetchScaapeParticipantsByScaapeIdReqObj
  ) => {
    const { page } = reqObj;

    const [participants, totalCount] = await Promise.all([
      this.fetchScaapeParticipantsByScaapeIdDb(reqObj),
      this.fetchTotalScaapeParticipantsByScaapeIdDb(reqObj),
    ]);

    const metaData: IMetaData = {
      total_items: totalCount,
      page_no: page,
      items_on_page: participants.length,
    };

    return { data: participants, meta_data: metaData };
  };

  protected fetchLocationDetailsService = async (
    reqObj: IFetchLocationDetailsReqObj
  ) => {
    const { lat, long } = reqObj;

    const locationDetails = await this.fetchLocationDetailsAPIHelper({
      lat,
      long,
    });

    return {
      lat,
      long,
      ...locationDetails,
    };
  };

  protected updateScaapeBasicDetailsService = async (
    reqObj: IUpdateScaapeBasicDetailsReqObj
  ) => {
    /**
     * Check if Scaape Exists
     */
    const { id } = reqObj;

    const scaapeDetails = await this.fetchBasicScaapeDetailsById(id);

    if (!scaapeDetails) {
      throw new ErrorHandler({
        status_code: 400,
        message: "Scaape not found",
      });
    }

    // Update not allowed if current date time is greater than the event start date time
    if (moment().isAfter(scaapeDetails.event_start_datetime)) {
      throw new ErrorHandler({
        status_code: 400,
        message: "Event has already started! So, you can't update the event",
      });
    }

    const {
      user_id,
      name,
      description,
      event_end_datetime,
      event_start_datetime,
      scaape_event_id,
      target_group,
    } = reqObj;

    const updateObj: IUpdateScaapeBasicDetailsObj = {
      id,
      name,
      description,
      event_end_datetime,
      event_start_datetime,
      scaape_event_id,
      target_group,
      updated_at: moment().format(),
      updated_by: user_id,
    };

    return this.updateScaapesDb(updateObj);
    /**
     * TODO: Do We need to Send Users Notification?
     */
  };

  protected updateScaapeLocationDetailsService = async (
    reqObj: IUpdateScaapeLocationDetailsReqObj
  ) => {
    /**
     * Check if Scaape Exists
     */
    const { id } = reqObj;

    const scaapeDetails = await this.fetchBasicScaapeDetailsById(id);

    if (!scaapeDetails) {
      throw new ErrorHandler({
        status_code: 400,
        message: "Scaape not found",
      });
    }

    // Update not allowed if current date time is greater than the event start date time
    if (moment().isAfter(scaapeDetails.event_start_datetime)) {
      throw new ErrorHandler({
        status_code: 400,
        message: "Event has already started! So, you can't update the event",
      });
    }

    const { user_id, lat, long, city, address_line, address_landmark } = reqObj;

    const updateObj: IUpdateScaapeLocationDetailsObj = {
      id,
      lat,
      long,
      city,
      address_line,
      address_landmark,
      updated_at: moment().format(),
      updated_by: user_id,
    };

    return this.updateScaapesDb(updateObj);
    /**
     * TODO: Do We need to Send Users Notification?
     * - Notify the users about the location change
     * - Update the location in the chat
     * - Update the location in the event details
     *
     */
  };

  protected updateScaapePaymentDetailsService = async (
    reqObj: IUpdateScaapePaymentDetailsReqObj
  ) => {
    /**
     * Check if Scaape Exists
     */
    const { id } = reqObj;

    const scaapeDetails = await this.fetchBasicScaapeDetailsById(id);

    if (!scaapeDetails) {
      throw new ErrorHandler({
        status_code: 400,
        message: "Scaape not found",
      });
    }

    // Update not allowed if current date time is greater than the event start date time
    if (moment().isAfter(scaapeDetails.event_start_datetime)) {
      throw new ErrorHandler({
        status_code: 400,
        message: "Event has already started! So, you can't update the event",
      });
    }

    const {
      user_id,
      amount,
      cost_breakup,
      hours_before_cancellation,
      number_of_seats,
    } = reqObj;

    const updateObj: IUpdateScaapePaymentDetailsObj = {
      id,
      amount,
      cost_breakup,
      hours_before_cancellation,
      number_of_seats,
      updated_at: moment().format(),
      updated_by: user_id,
    };

    return this.updateScaapesDb(updateObj);
  };
}
