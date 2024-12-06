import ErrorHandler from "../utils/error.handler";
import DashboardDb from "./db";
import {
  AccountStatus,
  ScaapeParticipantsStatus,
  TargetGroup,
  UserGender,
} from "./types/enums";
import axios from "axios";
import {
  IFetchLocationAPIRes,
  IFetchLocationDetailsReqObj,
} from "./types/interface";

export default class DashboardHelper extends DashboardDb {
  /**
   * Determines the target group based on the user's gender.
   *
   * @param gender - The gender of the user (UserGender enum).
   * @returns The target group (TargetGroup enum).
   */
  protected getTargetGroup = (gender: UserGender): TargetGroup => {
    switch (gender) {
      case UserGender.Male:
        return TargetGroup.MaleOnly;
      case UserGender.Female:
        return TargetGroup.FemaleOnly;
      default:
        return TargetGroup.All;
    }
  };

  protected userStatusCheck = (user_status: AccountStatus) => {
    if (user_status === AccountStatus.Inactive) {
      throw new ErrorHandler({
        status_code: 400,
        message: "Your account is inactive. Please contact support.",
      });
    } else if (user_status === AccountStatus.Suspended) {
      throw new ErrorHandler({
        status_code: 400,
        message: "Your account is suspended. Please contact support.",
      });
    }

    return true;
  };

  protected isLimitedSeatScaape = (
    number_of_seats: number | null | undefined
  ): boolean => {
    if (
      number_of_seats === null ||
      number_of_seats === undefined ||
      number_of_seats === 0
    ) {
      return false;
    } else if (number_of_seats > 0) {
      return true;
    } else {
      return false;
    }
  };

  protected isAccepted = (status: string): boolean => {
    if (status === ScaapeParticipantsStatus.Accepted) {
      return true;
    }

    return false;
  };

  protected fetchLocationDetailsAPIHelper = async (
    reqObj: IFetchLocationDetailsReqObj
  ): Promise<IFetchLocationAPIRes | null> => {
    const { lat, long } = reqObj;
    const API_URL = process.env.LOCATION_API_URL,
      API_KEY = process.env.LOCATION_API_KEY;

    // TODO: We need to replace this with GOOGLE APIs, this ins't accurate
    const response = await axios.get(
      `${API_URL}?lat=${lat}&lon=${long}&apiKey=${API_KEY}`
    );

    if (response.status !== 200) {
      throw new ErrorHandler({
        status_code: 500,
        message: "Error fetching location details",
      });
    } else {
      const { data } = response;
      const properties = data?.features[0]?.properties ?? null;
      if (properties) {
        return {
          city: properties?.city,
          country: properties?.country,
          state: properties?.state,
          district: properties?.district,
          suburb: properties?.suburb,
          street: properties?.street,
          formatted: properties?.formatted,
          postcode: properties?.postcode,
        };
      }
    }
    return null;
  };
}
