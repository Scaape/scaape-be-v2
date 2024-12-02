import { UserGender } from "./enums";

export type IFetchDashboardScaapeReqObj = {
  lat: number;
  long: number;
  city: string;

  user_id: string;
};

export type IFetchUserDetailsWithInterestsDbRes = {
  id: string;
  location_range: number;
  gender: UserGender; //ENUM (male, female)
  scaape_event_ids: string[];
};

export type IFetchScaapesDbReqObj = {
  scaape_event_ids: string[];
  user_id: string;
  target_group: string;

  lat: number;
  long: number;
  city: string;
  location_range: number;

  limit: number;
  page: number;
};

export type IFetchScaapesDbRes = {
  id: string;
  name: string;
  event_date: string;
  entry_fees: number | null;
  location_address: string | null;
  host_details: {
    first_name: string;
    last_name: string;
    verification_status: boolean;
    profile_img_url: string | null;
  };
  distance?: number | null;
};

export type IFetchDashboardScaapesDbRes = {
  scaapes_near_me: IFetchScaapesDbRes[];
  popular_scaapes: IFetchScaapesDbRes[];
  previously_attended_by_you: IFetchScaapesDbRes[];
};
