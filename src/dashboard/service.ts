import DashboardHelper from "./helper";
import { IFetchDashboardScaapeReqObj } from "./types/interface";

export default class DashboardService extends DashboardHelper {
  /**
   * service to fetch the scaape
   * - input: lat, long & city
   *
   */
  protected fetchScaapesForDashboardService = async (
    reqObj: IFetchDashboardScaapeReqObj
  ) => {
    //
  };
}
