import db from "../config/postgres";
import {
  ICreateFavoriteScaapeReqObj,
  IFetchFavoriteScaapeByIdAndUserIdDbRes,
  IFetchFavoriteScaapeByUserIdReqObj,
  IFetchFavoriteScaapesDbRes,
  IUpdateFavoriteScaapeObj,
  IUpdateFavoriteScaapeReqObj,
} from "./types/interface";

export default class FavoriteScaapeDb {
  protected fetchFavoriteScaapesByUserIdDb = async (
    filterObj: IFetchFavoriteScaapeByUserIdReqObj
  ) => {
    const { user_id, lat, long, limit, page } = filterObj;

    const offset = page * limit;

    const query = `
        SELECT
          scaapes.id,
          scaapes.name,
          scaapes.event_start_datetime,
          scaapes.event_end_datetime,
          scaapes.amount AS entry_fees,
          scaapes.address_line AS location_address,
          JSON_BUILD_OBJECT(
            'first_name', u.first_name,
            'last_name', u.last_name,
            'verification_status', u.verification_status,
            'profile_img_url', u.profile_img_url
          ) AS host_details,
          (
            6371 * ACOS(
              COS(RADIANS($2)) * COS(RADIANS(scaapes.lat)) *
              COS(RADIANS(scaapes.long) - RADIANS($3)) +
              SIN(RADIANS($2)) * SIN(RADIANS(scaapes.lat))
            )
          ) AS distance
        FROM
            favourite_scaapes
        INNER JOIN
            scaapes
            ON favourite_scaapes.scaape_id = scaapes.id
        INNER JOIN
            users u
            ON scaapes.user_id = u.id
        WHERE
            user_id = $1
            AND favourite_scaapes.deleted_at IS NULL
            AND scaapes.deleted_at IS NULL
        ORDER BY
            scaapes.event_start_datetime DESC
        LIMIT $4
        OFFSET $5
    `;

    const { rows } = await db.query(query, [user_id, lat, long, limit, offset]);
    return rows as unknown as IFetchFavoriteScaapesDbRes[];
  };

  protected fetchTotalFavoriteScaapesByUserIdDb = async (
    filterObj: IFetchFavoriteScaapeByUserIdReqObj
  ) => {
    const { user_id } = filterObj;

    const query = `
        SELECT
          COUNT(*)
        FROM
            favourite_scaapes
        INNER JOIN
            scaapes
            ON favourite_scaapes.scaape_id = scaapes.id
        WHERE
            user_id = $1
            AND favourite_scaapes.deleted_at IS NULL
            AND scaapes.deleted_at IS NULL
    `;

    const { rows } = await db.query(query, [user_id]);
    return rows[0].count;
  };

  protected fetchFavoriteScaapeByIdAndUserIdDb = async (
    filterObj: IUpdateFavoriteScaapeReqObj
  ): Promise<IFetchFavoriteScaapeByIdAndUserIdDbRes | null> => {
    const { user_id, scaape_id } = filterObj;

    const query = `
        SELECT
            id, user_id, scaape_id, deleted_at
        FROM
            favourite_scaapes
        WHERE
            user_id = $1
            AND scaape_id = $2
        LIMIT 1;`;

    const { rows } = await db.query(query, [user_id, scaape_id]);
    return rows.length ? rows[0] : null;
  };

  protected updateFavoriteScaapeDb = async (
    filterObj: IUpdateFavoriteScaapeObj
  ) => {
    const { id, ...rest } = filterObj;

    const query = db.format(
      `UPDATE favourite_scaapes SET ? WHERE id = $1`,
      rest
    );

    await db.query(query, [id]);
  };

  protected insertFavoriteScaapeDb = async (
    filterObj: ICreateFavoriteScaapeReqObj
  ) => {
    const query = db.format(`INSERT INTO favourite_scaapes ? `, filterObj);
    await db.query(query);
  };
}
