import { v4 } from "uuid";
import ErrorHandler from "../utils/error.handler";
import FavoriteScaapeHelper from "./helper";
import {
  ICreateFavoriteScaapeReqObj,
  IFetchFavoriteScaapeByUserIdReqObj,
  IMetaData,
  IUpdateFavoriteScaapeReqObj,
} from "./types/interface";
import moment from "moment";

export default class FavoriteScaapeService extends FavoriteScaapeHelper {
  protected fetchFavoriteScaapesByUserIdService = async (
    reqObj: IFetchFavoriteScaapeByUserIdReqObj
  ) => {
    const [favoriteScaapes, totalCount] = await Promise.all([
      this.fetchFavoriteScaapesByUserIdDb(reqObj),
      this.fetchTotalFavoriteScaapesByUserIdDb(reqObj),
    ]);

    const metaData: IMetaData = {
      total_items: totalCount?.count || 0,
      page_no: reqObj.page,
      items_on_page: reqObj.limit,
    };

    return {
      data: favoriteScaapes,
      meta_data: metaData,
    };
  };

  protected updateFavoriteScaapeService = async (
    reqObj: IUpdateFavoriteScaapeReqObj
  ) => {
    // Check if the scaape is already in the favorite list
    const { is_favorite } = reqObj;

    const favoriteScaapeCheck = await this.fetchFavoriteScaapeByIdAndUserIdDb(
      reqObj
    );

    if (
      is_favorite &&
      favoriteScaapeCheck &&
      favoriteScaapeCheck?.deleted_at === null
    ) {
      throw new ErrorHandler({
        message: "Scaape already in favorite list",
        status_code: 400,
      });
    }

    if (!is_favorite && !favoriteScaapeCheck) {
      throw new ErrorHandler({
        message: "Scaape not in favorite list",
        status_code: 400,
      });
    }

    // if scaape is already in favorite list but deleted and is_favorite is true, update the favorite list
    if (is_favorite && favoriteScaapeCheck && favoriteScaapeCheck?.deleted_at) {
      const { id } = favoriteScaapeCheck;
      return this.updateFavoriteScaapeDb({
        id,
        is_favourite: is_favorite,
        updated_at: moment().format(),
        updated_by: reqObj.user_id,
      });
    } else if (!is_favorite && favoriteScaapeCheck) {
      const { id } = favoriteScaapeCheck;
      return this.updateFavoriteScaapeDb({
        id,
        is_favourite: is_favorite,
        updated_at: moment().format(),
        updated_by: reqObj.user_id,
      });
    } else {
      const createObj: ICreateFavoriteScaapeReqObj = {
        id: v4(),
        user_id: reqObj.user_id,
        scaape_id: reqObj.scaape_id,
        created_at: moment().format(),
        created_by: reqObj.user_id,
      };
      return this.insertFavoriteScaapeDb(createObj);
    }
  };
}
