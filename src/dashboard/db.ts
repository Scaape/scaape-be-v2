import db from "../config/postgres";
import {
  IFetchDashboardScaapesDbRes,
  IFetchScaapesDbReqObj,
  IFetchScaapesDbRes,
  IFetchUserDetailsWithInterestsDbRes,
} from "./types/interface";

export default class DashboardDb {
  protected fetchUserDetailsWithInterestsDb = async (
    user_id: string
  ): Promise<IFetchUserDetailsWithInterestsDbRes | null> => {
    const query = `
              SELECT
                users.id,
                users.location_range,
                users.gender,
                ARRAY_AGG(user_event_interests.scaape_event_id) AS scaape_event_ids
              FROM
                users 
                LEFT JOIN
                    user_event_interests 
                    ON user_event_interests.user_id = users.id 
              WHERE
                users.id = $1
                AND user_event_interests.deleted_at IS NULL 
                AND users.deleted_at IS NULL 
              GROUP BY
                users.id;`;

    const { rows } = await db.query(query, [user_id]);
    return rows?.length ? rows[0] : null;
  };

  protected fetchScaapesDb = async (
    filterObj: IFetchScaapesDbReqObj
  ): Promise<IFetchScaapesDbRes[]> => {
    const {
      page,
      limit,
      user_id,
      lat,
      long,
      location_range,
      scaape_event_ids,
      city,
      target_group,
    } = filterObj;

    const offset = page * limit;

    const query = `
          WITH nearby_scaapes AS (
            SELECT
              s.id,
              s.name,
              s.start_datetime,
              s.amount AS entry_fees,
              s.address_line AS location_address,
              JSON_BUILD_OBJECT(
                'first_name', u.first_name,
                'last_name', u.last_name,
                'verification_status', u.verification_status,
                'profile_img_url', u.profile_img_url
              ) AS host_details,
              (
                6371 * ACOS(
                  COS(RADIANS($1)) * COS(RADIANS(s.lat)) *
                  COS(RADIANS(s.long) - RADIANS($2)) +
                  SIN(RADIANS($1)) * SIN(RADIANS(s.lat))
                )
              ) AS distance,
              (s.attendee_count >= COALESCE(s.number_of_seats, s.attendee_count + 1)) AS is_full
            FROM
              scaapes s
            JOIN users u ON s.created_by = u.id
            WHERE
              s.target_group IN ('all', $3)
              AND s.scaape_event_id = ANY($4)
              AND s.created_by != $5
              AND s.deleted_at IS NULL
          ),
          city_scaapes AS (
            SELECT
              s.id,
              s.name,
              s.start_datetime,
              s.amount AS entry_fees,
              s.address_line AS location_address,
              JSON_BUILD_OBJECT(
                'first_name', u.first_name,
                'last_name', u.last_name,
                'verification_status', u.verification_status,
                'profile_img_url', u.profile_img_url
              ) AS host_details,
              NULL AS distance,
              (s.attendee_count >= COALESCE(s.number_of_seats, s.attendee_count + 1)) AS is_full
            FROM
              scaapes s
            JOIN users u ON s.created_by = u.id
            WHERE
              s.city = $6
              AND s.target_group IN ('all', $3)
              AND s.scaape_event_id = ANY($4)
              AND s.created_by != $5
              AND s.deleted_at IS NULL
          )
          SELECT *
          FROM (
            SELECT *
            FROM nearby_scaapes
            WHERE distance <= $7
            ORDER BY distance ASC
            UNION ALL
            SELECT *
            FROM city_scaapes
            WHERE id NOT IN (SELECT id FROM nearby_scaapes)
          ) AS combined_scaapes
          ORDER BY
            is_full ASC, -- Non-full Scaapes take priority
            CASE
              WHEN distance IS NOT NULL THEN 1
              ELSE 2
            END,
            distance ASC NULLS LAST
          LIMIT $8 OFFSET $9;`;

    const { rows } = await db.query(query, [
      lat, // $1
      long, // $2
      target_group, // $3
      scaape_event_ids, // $4
      user_id, // $5
      city, // $6
      location_range, // $7
      limit, // $8
      offset, // $9
    ]);

    return rows || [];
  };

  protected fetchDashboardScaapesDb = async (
    filterObj: IFetchScaapesDbReqObj
  ): Promise<IFetchDashboardScaapesDbRes> => {
    const {
      user_id,
      lat,
      long,
      location_range,
      target_group,
      scaape_event_ids,
      city,
    } = filterObj;

    const query = `
      WITH scaapes_near_me AS (
        SELECT
          s.id,
          s.name,
          s.event_start_datetime,
          s.amount AS entry_fees,
          s.address_line AS location_address,
          JSON_BUILD_OBJECT(
            'first_name', u.first_name,
            'last_name', u.last_name,
            'verification_status', u.verification_status,
            'profile_img_url', u.profile_img_url
          ) AS host_details,
          (
            6371 * ACOS(
              COS(RADIANS($1)) * COS(RADIANS(s.lat)) *
              COS(RADIANS(s.long) - RADIANS($2)) +
              SIN(RADIANS($1)) * SIN(RADIANS(s.lat))
            )
          ) AS distance
        FROM
          scaapes s
        JOIN users u ON s.created_by = u.id
        WHERE
          s.target_group IN ('all', $3)
          AND s.scaape_event_id = ANY($4)
          AND s.city = $5
          AND s.deleted_at IS NULL
          AND (
            6371 * ACOS(
              COS(RADIANS($1)) * COS(RADIANS(s.lat)) *
              COS(RADIANS(s.long) - RADIANS($2)) +
              SIN(RADIANS($1)) * SIN(RADIANS(s.lat))
            ) <= $6
          )
        ORDER BY distance ASC
        LIMIT 5
      ),
      popular_scaapes AS (
        SELECT
          s.id,
          s.name,
          s.event_start_datetime,
          s.amount AS entry_fees,
          s.address_line AS location_address,
          JSON_BUILD_OBJECT(
            'first_name', u.first_name,
            'last_name', u.last_name,
            'verification_status', u.verification_status,
            'profile_img_url', u.profile_img_url
          ) AS host_details,
          COUNT(*) AS participant_count,
          AVG(EXTRACT(EPOCH FROM (p.joined_at - p.requested_at))) AS avg_join_time
        FROM
          scaapes s
        JOIN users u ON s.created_by = u.id
        LEFT JOIN participants p ON p.scaape_id = s.id AND p.status = 'accepted'
        WHERE
          s.target_group IN ('all', $3)
          AND s.scaape_event_id = ANY($4)
          AND s.city = $5
          AND s.deleted_at IS NULL
        GROUP BY
          s.id, u.first_name, u.last_name, u.verification_status, u.profile_img_url
        ORDER BY
          participant_count DESC,
          avg_join_time ASC,
          s.event_start_datetime ASC
        LIMIT 5
      ),
      previously_attended_by_you AS (
        SELECT
          s.id,
          s.name,
          s.event_start_datetime,
          s.amount AS entry_fees,
          s.address_line AS location_address,
          JSON_BUILD_OBJECT(
            'first_name', u.first_name,
            'last_name', u.last_name,
            'verification_status', u.verification_status,
            'profile_img_url', u.profile_img_url
          ) AS host_details
        FROM
          scaapes s
        JOIN users u ON s.created_by = u.id
        JOIN participants p ON p.scaape_id = s.id AND p.status = 'accepted'
        WHERE
          p.user_id = $7
          AND s.target_group IN ('all', $3)
          AND s.scaape_event_id = ANY($4)
          AND s.city = $5
          AND s.deleted_at IS NULL
        GROUP BY
          s.id, u.first_name, u.last_name, u.verification_status, u.profile_img_url
        LIMIT 5
      )
      SELECT
        JSON_AGG(scaapes_near_me.*) AS scaapes_near_me,
        JSON_AGG(popular_scaapes.*) AS popular_scaapes,
        JSON_AGG(previously_attended_by_you.*) AS previously_attended_by_you
      FROM
        scaapes_near_me, popular_scaapes, previously_attended_by_you;
    `;

    const { rows } = await db.query(query, [
      lat, // $1: User's latitude
      long, // $2: User's longitude
      target_group, // $3: User's target group
      scaape_event_ids, // $4: Scaape event IDs array
      city, // $5: User's city
      location_range, // $6: Location range in km
      user_id, // $7: Current user ID
    ]);

    return (
      rows[0] || {
        scaapes_near_me: [],
        popular_scaapes: [],
        previously_attended_by_you: [],
      }
    );
  };
}
