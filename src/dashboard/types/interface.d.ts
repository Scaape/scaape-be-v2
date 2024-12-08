import {
  AccountStatus,
  AccountType,
  BasicAllScaapeFilter,
  Gender,
  ScaapeParticipantsStatus,
  TargetGroup,
  UserGender,
  VerificationStatus,
} from "./enums";

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
  host_details: IHostDetails;
  distance?: number | null;
};

export type IFetchDashboardScaapesDbRes = {
  scaapes_near_me: IFetchScaapesDbRes[];
  popular_scaapes: IFetchScaapesDbRes[];
  previously_attended_by_you: IFetchScaapesDbRes[];
};

export type IFetchScaapeDetailsByIdDbReqObj = {
  scaape_id: string;
  user_id: string;
  lat: number;
  long: number;
};

export type IFetchScaapeDetailsByIdDbRes = {
  id: string;
  name: string;
  description: string;
  event_start_datetime: string;
  event_end_datetime: string;
  location_address: string;
  distance_in_km: number;
  distance: string;
  price: number;
  number_of_people_attending: number;
  event_tags: string[];
  event_scaape_category: string;
  host_details: IHostDetails;
  is_full: boolean;
  is_created_by_user: boolean;
  number_of_seats: number | null;
};

export type IHostDetails = {
  first_name: string;
  last_name: string;
  verification_status: boolean;
  profile_img_url: string | null;
};

export type ICreateScaapeControllerReqObj = {
  user_id: string;

  // scaape event creation details
  name: string;
  start_date_time: string;
  end_date_time: string;
  event_type_id: string;
  description: string;
  event_target_group: string;
  location: {
    lat: number;
    long: number;
    city: string;
    address_line: string;
    landmark: string | null;
  };
  photo_library_setting: string;
  payment_settings: {
    number_of_seats: number | null;
    is_free_event: boolean;
    cost_breakup: string | null;
    entry_fees: number | null;
    hours_before_cancellation: number;
  };
};

export type IUserDetails = {
  id: string;
  first_name: string;
  last_name: string;
  user_name: string;
  profile_img_url: string;
  otp: string;
  verification_status: VerificationStatus;
  status: AccountStatus; // Adjust ENUM values as necessary
  phone_number: number;
  email: string;
  account_type: AccountType;
  location_range: number;
  age: number;
  gender: Gender;
  created_at: Date;
  created_by: string; // UUID
  updated_at: Date;
  updated_by: string; // UUID
  deleted_at: Date | null;
  deleted_by: string | null; // UUID

  payment_method: IPaymentMethodDetails;
};

export type IPaymentMethodDetails = {
  id: string;
  config_id: string;
  partner: string;
};

export type ICreateScaapeObj = {
  id: string;
  name: string;
  description: string;
  event_start_datetime: string;
  event_end_datetime: string;
  scaape_event_id: string;
  payment_method_id: string;
  photo_library_setting: string;
  target_group: string;
  lat: number;
  long: number;
  city: string;
  address_line: string;
  address_landmark: string | null;
  amount: number | null;
  cost_breakup: string | null;
  hours_before_cancellation: number;
  number_of_seats: number | null;
  attendee_count: number;

  created_at: string;
  created_by: string;
};

export type IAllFetchScaapesDbReqObj = {
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

export type IAllFetchScaapesReqObj = {
  user_id: string;
  basic_filter: BasicAllScaapeFilter;

  lat: number;
  long: number;
  city: string;

  limit: number;
  page: number;
};

export type IMetaData = {
  total_items: number;
  page_no: number;
  items_on_page: number;
};

export type IFetchScaapePendingApprovalsByIdReqObj = {
  id: string; // scaape_id
  page: number;
  limit: number;
};

export type IFetchScaapePendingApprovalsByIdRes = {
  id: string;
  user_details: IPendingUserDetails;
  status: ScaapeParticipantsStatus;
  requested_created_at: string;
};

export type IPendingUserDetails = {
  id: string;
  first_name: string;
  last_name: string;
  verification_status: boolean;
  profile_img_url: string | null;
};

export type IManageApprovalsReqObj = {
  id: string;
  status: ScaapeParticipantsStatus;
  user_id: string; // approver_id
};

export type IFetchScaapeParticipantsDbRes = {
  id: string;
  status: ScaapeParticipantsStatus;
  scaape_details: IFetchScaapeDetailsForParticipants;
  user_details: IFetchScaapeUserDetailsForParticipants;
};

export type IFetchScaapeDetailsForParticipants = {
  id: string;
  target_group: TargetGroup;
  event_start_datetime: string;
  event_end_datetime: string;
  no_of_seats: number | null;
  attendee_count: number;
  created_by: string;
};

export type IFetchScaapeUserDetailsForParticipants = {
  id: string;
  status: ScaapeParticipantsStatus;
  verification_status: boolean;
  deleted_at: string | null;
};

export type IUpdateScaapeParticipantsStatusDbReqObj = {
  id: string;
  status: ScaapeParticipantsStatus;
  accepted_at: string | null;
  rejected_at: string | null;
  updated_at: string;
  updated_by: string;
};

export type IUpdateScaapeAttendeeCountDbReqObj = {
  id: string;
  attendee_count: number;
  updated_at: string;
  updated_by: string;
};

export type IFetchScaapeParticipantsByScaapeIdRes = {
  id: string;
  user_details: IPendingUserDetails;
  status: ScaapeParticipantsStatus;
  requested_created_at: string;
};

export type IFetchScaapeParticipantsByScaapeIdReqObj = {
  id: string; // scaape_id
  page: number;
  limit: number;
};

export type IFetchLocationDetailsReqObj = {
  lat: number;
  long: number;
};

export type IFetchLocationAPIRes = {
  city: string;
  state: string;
  country: string;
  postcode: string;
  street: string;
  district: string;
  suburb: string;
  formatted: string;
};

export type IUpdateScaapeBasicDetailsReqObj = {
  id: string;
  user_id: string;

  name: string;
  description: string;
  event_start_datetime: string;
  event_end_datetime: string;
  scaape_event_id: string;
  target_group: string;
};

export type IFetchBasicScaapeDetailsByIdDBRes = {
  id: string;
  name: string;
  description: string;
  event_start_datetime: string;
  event_end_datetime: string;
  scaape_event_id: string;
  target_group: string;
};

export type IUpdateScaapeBasicDetailsObj = {
  id: string;
  name: string;
  description: string;
  event_start_datetime: string;
  event_end_datetime: string;
  scaape_event_id: string;
  target_group: string;

  updated_at: string;
  updated_by: string;
};

export type IUpdateScaapeLocationDetailsObj = {
  id: string;
  lat: number;
  long: number;
  city: string;
  address_line: string;
  address_landmark: string | null;

  updated_at: string;
  updated_by: string;
};

export type IUpdateScaapeLocationDetailsReqObj = {
  id: string;
  user_id: string;

  lat: number;
  long: number;
  city: string;
  address_line: string;
  address_landmark: string | null;
};

export type IUpdateScaapePaymentDetailsObj = {
  id: string;
  amount: number | null;
  cost_breakup: string | null;
  hours_before_cancellation: number;
  number_of_seats: number | null;

  updated_at: string;
  updated_by: string;
};

export type IUpdateScaapePaymentDetailsReqObj = {
  id: string;
  user_id: string;

  amount: number | null;
  cost_breakup: string | null;
  hours_before_cancellation: number;
  number_of_seats: number | null;
};
