export type IFetchDashboardScaapeReqObj = {
  lat: number;
  long: number;
  city: string;

  user_id: string;
};

export type IFetchUserDetailsWithInterestsDbRes = {
  id: string;
  location_range: number;
  gender: string; //ENUM (male, female)
  user_event_interests: IUserEventInterestsObj[];
};

export type IUserEventInterestsObj = {
  id: string;
  scaape_event_id: string;
  user_id: string;
};

export type IFetchScaapesDbReqObj = {
  scaape_event_ids: string[];
};
