import ErrorHandler from "../utils/error.handler";
import DashboardHelper from "./helper";
import {
  IFetchDashboardScaapeReqObj,
  IFetchScaapesDbReqObj,
} from "./types/interface";

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
      scaape_event_ids,
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
}
