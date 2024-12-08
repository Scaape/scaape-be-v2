export type IFetchFavoriteScaapeByUserIdReqObj = {
  user_id: string;

  lat: number;
  long: number;
  page: number;
  limit: number;
};

export type IFetchFavoriteScaapesDbRes = {
  id: string;
  name: string;
  event_date: string;
  entry_fees: number | null;
  location_address: string | null;
  host_details: IHostDetails;
  distance?: number | null;
};

export type IHostDetails = {
  first_name: string;
  last_name: string;
  verification_status: boolean;
  profile_img_url: string | null;
};

export type IMetaData = {
  total_items: number;
  page_no: number;
  items_on_page: number;
};

export type IUpdateFavoriteScaapeReqObj = {
  user_id: string;
  scaape_id: string;
  is_favorite: boolean;
};

export type IFetchFavoriteScaapeByIdAndUserIdDbRes = {
  id: string;
  scaape_id: string;
  user_id: string;
  deleted_at: string | null;
};

export type IUpdateFavoriteScaapeObj = {
  id: string;
  is_favourite: boolean;
  updated_at: string;
  updated_by: string;
};

export type ICreateFavoriteScaapeReqObj = {
  id: string;
  user_id: string;
  scaape_id: string;

  created_at: string;
  created_by: string;
};
