import db from "../config/postgres";
import { ScaapeParticipantsStatus } from "./types/enums";
import {
  IAllFetchScaapesDbReqObj,
  ICreateScaapeObj,
  IFetchDashboardScaapesDbRes,
  IFetchScaapeDetailsByIdDbReqObj,
  IFetchScaapeDetailsByIdDbRes,
  IFetchScaapeParticipantsByScaapeIdReqObj,
  IFetchScaapeParticipantsByScaapeIdRes,
  IFetchScaapeParticipantsDbRes,
  IFetchScaapePendingApprovalsByIdReqObj,
  IFetchScaapePendingApprovalsByIdRes,
  IFetchScaapesDbReqObj,
  IFetchScaapesDbRes,
  IFetchUserDetailsWithInterestsDbRes,
  IUpdateScaapeAttendeeCountDbReqObj,
  IUpdateScaapeParticipantsStatusDbReqObj,
  IUserDetails,
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

    // Ensure scaape_event_ids is either a valid array or null
    const eventIds =
      Array.isArray(scaape_event_ids) && scaape_event_ids.length > 0
        ? scaape_event_ids
        : null;

    const query = `
      WITH scaapes_near_me AS (
        SELECT
          s.id,
          s.name,
          s.event_start_datetime,
          s.event_end_datetime,
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
          AND s.created_by != $7
          AND (
            $4::UUID[] IS NULL OR s.scaape_event_id = ANY($4::UUID[])
          )
          AND s.city = $5
          AND s.event_end_datetime > NOW()
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
          s.event_end_datetime,
          s.amount AS entry_fees,
          s.address_line AS location_address,
          JSON_BUILD_OBJECT(
            'first_name', u.first_name,
            'last_name', u.last_name,
            'verification_status', u.verification_status,
            'profile_img_url', u.profile_img_url
          ) AS host_details,
          COUNT(*) AS participant_count,
          AVG(EXTRACT(EPOCH FROM (p.accepted_at - p.created_at))) AS avg_join_time
        FROM
          scaapes s
        JOIN users u ON s.created_by = u.id
        LEFT JOIN scaape_participants p ON p.scaape_id = s.id AND p.status = 'accepted'
        WHERE
          s.target_group IN ('all', $3)
          AND s.created_by != $7
          AND (
            $4::UUID[] IS NULL OR s.scaape_event_id = ANY($4::UUID[])
          )
          AND s.event_end_datetime > NOW()
          AND s.city ILIKE $5
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
          s.event_end_datetime,
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
        JOIN scaape_participants p ON p.scaape_id = s.id AND p.status = 'accepted'
        WHERE
          p.user_id = $7
          AND u.id != $7
          AND s.target_group IN ('all', $3)
          AND s.event_end_datetime > NOW()          
          AND (
            $4::UUID[] IS NULL OR s.scaape_event_id = ANY($4::UUID[])
          )
          AND s.city ILIKE $5
          AND s.deleted_at IS NULL
        GROUP BY
          s.id, u.first_name, u.last_name, u.verification_status, u.profile_img_url
        LIMIT 5
      )
      SELECT
        COALESCE(JSON_AGG(scaapes_near_me.*)
          FILTER (WHERE scaapes_near_me.id IS NOT NULL), '[]'::JSON
        ) AS scaapes_near_me,
        COALESCE(JSON_AGG(popular_scaapes.*)
          FILTER (WHERE popular_scaapes.id IS NOT NULL), '[]'::JSON
        ) AS popular_scaapes,
        COALESCE(JSON_AGG(previously_attended_by_you.*) FILTER (
          WHERE previously_attended_by_you.id IS NOT NULL
        ), '[]'::JSON) AS previously_attended_by_you
      FROM
        scaapes_near_me
        FULL OUTER JOIN popular_scaapes ON TRUE
        FULL OUTER JOIN previously_attended_by_you ON TRUE;
    `;

    const { rows } = await db.query(query, [
      lat, // $1: User's latitude
      long, // $2: User's longitude
      target_group, // $3: User's target group
      eventIds, // $4: Scaape event IDs array
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

  public fetchScaapeDetailsByIdDb = async (
    filterObj: IFetchScaapeDetailsByIdDbReqObj
  ): Promise<IFetchScaapeDetailsByIdDbRes> => {
    const { scaape_id, user_id, lat, long } = filterObj;

    const query = `
              SELECT
          s.id AS id,
          s.name,
          s.description,
          s.event_start_datetime,
          s.event_end_datetime,
          CONCAT(s.address_line, ', ', s.city) AS location_address,
          (
            6371 * ACOS(
              COS(RADIANS($1)) * COS(RADIANS(s.lat)) *
              COS(RADIANS(s.long) - RADIANS($2)) +
              SIN(RADIANS($1)) * SIN(RADIANS(s.lat))
            )
          ) AS distance_in_km,
          s.amount AS price,
          COALESCE(s.attendee_count, 0) AS number_of_people_attending,
          COALESCE(
            JSON_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '[]'::JSON
          ) AS event_tags,
          st.name AS event_scaape_category,
          JSON_BUILD_OBJECT(
            'first_name', u.first_name,
            'last_name', u.last_name,
            'verification_status', u.verification_status,
            'profile_img_url', u.profile_img_url
          ) AS host_details,
          CASE
            WHEN s.number_of_seats IS NOT NULL AND s.attendee_count >= s.number_of_seats THEN TRUE
            ELSE FALSE
          END AS is_full,
          s.number_of_seats,
          CASE
            WHEN s.created_by = $3 THEN TRUE
            ELSE FALSE
          END AS is_created_by_user
        FROM
          scaapes s
        LEFT JOIN users u ON s.created_by = u.id
        LEFT JOIN scaape_event_tags et ON s.id = et.scaape_id
        LEFT JOIN scaape_tags t ON et.scaape_tags_id = t.id
        LEFT JOIN scaape_types st ON s.scaape_event_id = st.id
        WHERE
          s.id = $4
          AND s.deleted_at IS NULL
        GROUP BY
          s.id, u.first_name, u.last_name, u.verification_status, u.profile_img_url, st.name;`;

    const { rows } = await db.query(query, [lat, long, user_id, scaape_id]);
    return rows[0] as unknown as IFetchScaapeDetailsByIdDbRes;
  };

  protected fetchUserDetailsWithPaymentMethodByUserId = async (
    user_id: string
  ): Promise<IUserDetails> => {
    const query = `
      SELECT users.*, JSON_BUILD_OBJECT(
        'id', payments_method.id,
        'config_id', payments_method.config_id,
        'partner', payments_method.partner
      ) AS payment_method
      FROM users 
      LEFT JOIN payments_method ON users.id = payments_method.user_id AND payments_method.deleted_at IS NULL
      WHERE users.id = $1 AND users.deleted_at IS NULL;`;

    const { rows } = await db.query(query, [user_id]);
    return rows[0] as unknown as IUserDetails;
  };

  protected insertScaapeDb = async (scaapeObj: ICreateScaapeObj) => {
    const query = db.format(`INSERT INTO scaapes ?`, scaapeObj);
    await db.query(query);
  };

  protected fetchScaapesNearMeDb = async (
    filterObj: IAllFetchScaapesDbReqObj
  ) => {
    const {
      user_id,
      lat,
      long,
      location_range,
      target_group,
      scaape_event_ids,
      city,
      limit,
      page,
    } = filterObj;

    // Ensure scaape_event_ids is either a valid array or null
    const eventIds =
      Array.isArray(scaape_event_ids) && scaape_event_ids.length > 0
        ? scaape_event_ids
        : null;

    const offset = page * limit;

    const query = `
          SELECT
          s.id,
          s.name,
          s.event_start_datetime,
          s.event_end_datetime,
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
          AND s.created_by != $9
          AND (
            $4::UUID[] IS NULL OR s.scaape_event_id = ANY($4::UUID[])
          )
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
        LIMIT $7
        OFFSET $8;`;

    const { rows } = await db.query(query, [
      lat, // $1: User's latitude
      long, // $2: User's longitude
      target_group, // $3: User's target group
      eventIds, // $4: Scaape event IDs array
      city, // $5: User's city
      location_range, // $6: Location range in km
      limit, // $7: Limit
      offset, // $8: Offset
      user_id, // $9: User ID
    ]);

    return rows as unknown as IFetchScaapesDbRes[];
  };

  protected fetchPopularScaapesDb = async (
    filterObj: IAllFetchScaapesDbReqObj
  ) => {
    const {
      user_id,
      lat,
      long,
      location_range,
      target_group,
      scaape_event_ids,
      city,
      limit,
      page,
    } = filterObj;

    // Ensure scaape_event_ids is either a valid array or null
    const eventIds =
      Array.isArray(scaape_event_ids) && scaape_event_ids.length > 0
        ? scaape_event_ids
        : null;

    const offset = page * limit;

    const query = `
              SELECT
          s.id,
          s.name,
          s.event_start_datetime,
          s.event_end_datetime,
          s.amount AS entry_fees,
          s.address_line AS location_address,
          JSON_BUILD_OBJECT(
            'first_name', u.first_name,
            'last_name', u.last_name,
            'verification_status', u.verification_status,
            'profile_img_url', u.profile_img_url
          ) AS host_details,
          COUNT(*) AS participant_count,
          AVG(EXTRACT(EPOCH FROM (p.accepted_at - p.created_at))) AS avg_join_time
        FROM
          scaapes s
        JOIN users u ON s.created_by = u.id
        LEFT JOIN scaape_participants p ON p.scaape_id = s.id AND p.status = 'accepted'
        WHERE
          s.target_group IN ('all', $3)
          AND s.created_by != $7
          AND (
            $4::UUID[] IS NULL OR s.scaape_event_id = ANY($4::UUID[])
          )
          AND s.city ILIKE $5
          AND s.deleted_at IS NULL
        GROUP BY
          s.id, u.first_name, u.last_name, u.verification_status, u.profile_img_url
        ORDER BY
          participant_count DESC,
          avg_join_time ASC,
          s.event_start_datetime ASC
        LIMIT $6
        OFFSET $8;`;

    const { rows } = await db.query(query, [
      lat, // $1: User's latitude
      long, // $2: User's longitude
      target_group, // $3: User's target group
      eventIds, // $4: Scaape event IDs array
      city, // $5: User's city
      limit, // $6: Limit
      user_id, // $7: User ID
      offset, // $8: Offset
    ]);

    return rows as unknown as IFetchScaapesDbRes[];
  };

  protected fetchPreviouslyAttendedScaapesDb = async (
    filterObj: IAllFetchScaapesDbReqObj
  ) => {
    const {
      user_id,
      lat,
      long,
      target_group,
      scaape_event_ids,
      city,
      limit,
      page,
    } = filterObj;

    // Ensure scaape_event_ids is either a valid array or null
    const eventIds =
      Array.isArray(scaape_event_ids) && scaape_event_ids.length > 0
        ? scaape_event_ids
        : null;

    const offset = page * limit;

    const query = `
              SELECT
          s.id,
          s.name,
          s.event_start_datetime,
          s.event_end_datetime,
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
        JOIN scaape_participants p ON p.scaape_id = s.id AND p.status = 'accepted'
        WHERE
          p.user_id = $7
          AND s.created_by != $7
          AND s.target_group IN ('all', $3)
          AND (
            $4::UUID[] IS NULL OR s.scaape_event_id = ANY($4::UUID[])
          )
          AND s.city ILIKE $5
          AND s.deleted_at IS NULL
        GROUP BY
          s.id, u.first_name, u.last_name, u.verification_status, u.profile_img_url
        LIMIT $6
        OFFSET $8;`;

    const { rows } = await db.query(query, [
      lat, // $1: User's latitude
      long, // $2: User's longitude
      target_group, // $3: User's target group
      eventIds, // $4: Scaape event IDs array
      city, // $5: User's city
      limit, // $6: Limit
      user_id, // $7: User ID
      offset, // $8: Offset
    ]);

    return rows as unknown as IFetchScaapesDbRes[];
  };

  protected fetchRecommendedScaapesDb = async (
    filterObj: IAllFetchScaapesDbReqObj
  ) => {
    const {
      user_id,
      lat,
      long,
      location_range,
      target_group,
      city,
      limit,
      page,
    } = filterObj;

    const offset = page * limit;

    const query = `

        SELECT
          s.id,
          s.name,
          s.event_start_datetime,
          s.event_end_datetime,
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
          COUNT(p.id) AS participant_count
        FROM
          scaapes s
        JOIN users u ON s.created_by = u.id
        LEFT JOIN scaape_participants p ON p.scaape_id = s.id AND p.status = 'accepted'
        LEFT JOIN user_event_interests ui ON ui.scaape_event_id = s.scaape_event_id
        WHERE
          ui.user_id = $7
          AND s.created_by != $7
          AND s.target_group IN ('all', $3)
          AND s.deleted_at IS NULL
          AND s.event_end_datetime > NOW()
          AND (
            6371 * ACOS(
              COS(RADIANS($1)) * COS(RADIANS(s.lat)) *
              COS(RADIANS(s.long) - RADIANS($2)) +
              SIN(RADIANS($1)) * SIN(RADIANS(s.lat))
            ) <= $4
            OR s.city ILIKE $5
          )
        GROUP BY
          s.id, u.first_name, u.last_name, u.verification_status, u.profile_img_url
        ORDER BY
          distance ASC,
          participant_count DESC
        LIMIT $6 OFFSET $8
    `;

    const { rows } = await db.query(query, [
      lat, // $1: User's latitude
      long, // $2: User's longitude
      target_group, // $3: User's target group
      location_range, // $4: Location range in km
      city, // $5: User's city
      limit, // $6: Limit
      user_id, // $7: User ID
      offset, // $8: Offset
    ]);

    return rows as unknown as IFetchScaapesDbRes[];
  };

  protected fetchTotalScaapesNearMeDb = async (
    filterObj: IAllFetchScaapesDbReqObj
  ): Promise<number> => {
    const {
      user_id,
      lat,
      long,
      location_range,
      target_group,
      scaape_event_ids,
      city,
    } = filterObj;

    const eventIds =
      Array.isArray(scaape_event_ids) && scaape_event_ids.length > 0
        ? scaape_event_ids
        : null;

    const query = `
      SELECT COUNT(*) AS total_count
      FROM scaapes s
      WHERE
        s.target_group IN ('all', $1)
        AND s.created_by != $2
        AND (
          $3::UUID[] IS NULL OR s.scaape_event_id = ANY($3::UUID[])
        )
        AND s.city = $4
        AND s.deleted_at IS NULL
        AND (
          6371 * ACOS(
            COS(RADIANS($5)) * COS(RADIANS(s.lat)) *
            COS(RADIANS(s.long) - RADIANS($6)) +
            SIN(RADIANS($5)) * SIN(RADIANS(s.lat))
          ) <= $7
        );
    `;

    const { rows } = await db.query(query, [
      target_group, // $1: User's target group
      user_id, // $2: User ID
      eventIds, // $3: Scaape event IDs array
      city, // $4: User's city
      lat, // $5: User's latitude
      long, // $6: User's longitude
      location_range, // $7: Location range in km
    ]);

    return rows[0]?.total_count || 0;
  };

  protected fetchTotalPopularScaapesDb = async (
    filterObj: IAllFetchScaapesDbReqObj
  ): Promise<number> => {
    const { user_id, target_group, scaape_event_ids, city } = filterObj;

    const eventIds =
      Array.isArray(scaape_event_ids) && scaape_event_ids.length > 0
        ? scaape_event_ids
        : null;

    const query = `
      SELECT COUNT(*) AS total_count
      FROM scaapes s
      LEFT JOIN scaape_participants p ON p.scaape_id = s.id AND p.status = 'accepted'
      WHERE
        s.target_group IN ('all', $1)
        AND s.created_by != $2
        AND (
          $3::UUID[] IS NULL OR s.scaape_event_id = ANY($3::UUID[])
        )
        AND s.city ILIKE $4
        AND s.deleted_at IS NULL;
    `;

    const { rows } = await db.query(query, [
      target_group, // $1: User's target group
      user_id, // $2: User ID
      eventIds, // $3: Scaape event IDs array
      city, // $4: User's city
    ]);

    return rows[0]?.total_count || 0;
  };

  protected fetchTotalPreviouslyAttendedScaapesDb = async (
    filterObj: IAllFetchScaapesDbReqObj
  ): Promise<number> => {
    const { user_id, target_group, scaape_event_ids, city } = filterObj;

    const eventIds =
      Array.isArray(scaape_event_ids) && scaape_event_ids.length > 0
        ? scaape_event_ids
        : null;

    const query = `
      SELECT COUNT(*) AS total_count
      FROM scaapes s
      JOIN scaape_participants p ON p.scaape_id = s.id AND p.status = 'accepted'
      WHERE
        p.user_id = $1
        AND s.created_by != $1
        AND s.target_group IN ('all', $2)
        AND (
          $3::UUID[] IS NULL OR s.scaape_event_id = ANY($3::UUID[])
        )
        AND s.city ILIKE $4
        AND s.deleted_at IS NULL;
    `;

    const { rows } = await db.query(query, [
      user_id, // $1: User ID
      target_group, // $2: User's target group
      eventIds, // $3: Scaape event IDs array
      city, // $4: User's city
    ]);

    return rows[0]?.total_count || 0;
  };

  protected fetchTotalRecommendedScaapesDb = async (
    filterObj: IAllFetchScaapesDbReqObj
  ): Promise<number> => {
    const { user_id, lat, long, location_range, target_group, city } =
      filterObj;

    const query = `
      SELECT COUNT(*) AS total_count
      FROM scaapes s
      LEFT JOIN user_event_interests ui ON ui.scaape_event_id = s.scaape_event_id
      WHERE
        ui.user_id = $1
        AND s.created_by != $1
        AND s.target_group IN ('all', $2)
        AND s.deleted_at IS NULL
        AND s.event_end_datetime > NOW()
        AND (
          6371 * ACOS(
            COS(RADIANS($3)) * COS(RADIANS(s.lat)) *
            COS(RADIANS(s.long) - RADIANS($4)) +
            SIN(RADIANS($3)) * SIN(RADIANS(s.lat))
          ) <= $5
          OR s.city ILIKE $6
        );
    `;

    const { rows } = await db.query(query, [
      user_id, // $1: User ID
      target_group, // $2: User's target group
      lat, // $3: User's latitude
      long, // $4: User's longitude
      location_range, // $5: Location range in km
      city, // $6: User's city
    ]);

    return rows[0]?.total_count || 0;
  };

  protected fetchScaapePendingApprovalsByIdDb = async (
    filterObj: IFetchScaapePendingApprovalsByIdReqObj
  ): Promise<IFetchScaapePendingApprovalsByIdRes[]> => {
    const { id, page, limit } = filterObj;
    const offset = page * limit;

    const query = `
            SELECT
            sp.id,
            JSON_BUILD_OBJECT(
              'id', sp.user_id,
              'first_name', u.first_name,
              'last_name', u.last_name,
              'profile_img_url', u.profile_img_url,
              'verification_status', u.verification_status
            ) AS user_details,
            sp.status AS request_status,
            sp.created_at AS request_created_at
          FROM
            scaape_participants sp
          JOIN users u ON sp.user_id = u.id
          WHERE
            sp.scaape_id = $1
            AND sp.status = $2
            AND sp.deleted_at IS NULL
          ORDER BY
            sp.created_at DESC
          LIMIT $3 
          OFFSET $4;`;

    const { rows } = await db.query(query, [
      id,
      ScaapeParticipantsStatus.Pending,
      limit,
      offset,
    ]);
    return rows as unknown as IFetchScaapePendingApprovalsByIdRes[];
  };

  protected fetchTotalScaapePendingApprovalsByIdDb = async (
    filterObj: IFetchScaapePendingApprovalsByIdReqObj
  ): Promise<number> => {
    const { id: scaape_id } = filterObj;
    const query = `
      SELECT COUNT(*) AS total_count
      FROM scaape_participants
      WHERE
        scaape_id = $1
        AND status = $2
        AND deleted_at IS NULL;
    `;

    const { rows } = await db.query(query, [
      scaape_id,
      ScaapeParticipantsStatus.Pending,
    ]);

    return rows[0]?.total_count || 0;
  };

  protected fetchScaapeParticipantsByIdDb = async (id: string) => {
    const query = `
        SELECT
        scaape_participants.id,
        scaape_participants.status,
        json_build_object( 
          'id', scaapes.id, 
          'target_group', scaapes.target_group, 
          'event_start_datetime', scaapes.event_start_datetime, 
          'event_end_datetime', scaapes.event_end_datetime, 
          'no_of_seats', scaapes.number_of_seats, 
          'attendee_count', scaapes.attendee_count,
          'created_by', scaapes.created_by
        ) AS scaape_details,
        json_build_object( 
          'id', users.id, 
          'status', users.status, 
          'verification_status', users.verification_status, 
          'deleted_at', users.deleted_at 
        ) AS user_details 
      FROM
        scaape_participants 
        LEFT JOIN
            scaapes 
            ON scaape_participants.scaape_id = scaapes.id 
        LEFT JOIN
            users 
            ON users.id = scaape_participants.user_id 
      WHERE
        scaape_participants.id = $1
        AND scaape_participants.deleted_at IS NULL;`;

    const { rows } = await db.query(query, [id]);

    return rows[0] as unknown as IFetchScaapeParticipantsDbRes;
  };

  protected updateScaapeParticipantsDb = async (
    obj: IUpdateScaapeParticipantsStatusDbReqObj
  ) => {
    const { id, ...rest } = obj;
    const query = db.format(
      `UPDATE scaape_participants SET ? WHERE id = $1`,
      rest
    );
    await db.query(query, [id]);
  };

  protected updateScaapesDb = async (
    scaapeObj: IUpdateScaapeAttendeeCountDbReqObj
  ) => {
    const { id, ...rest } = scaapeObj;
    const query = db.format(`UPDATE scaapes SET ? WHERE id = $1`, rest);
    await db.query(query, [id]);
  };

  protected fetchScaapeParticipantsByScaapeIdDb = async (
    filterObj: IFetchScaapeParticipantsByScaapeIdReqObj
  ): Promise<IFetchScaapeParticipantsByScaapeIdRes[]> => {
    const { id, page, limit } = filterObj;
    const offset = page * limit;

    const query = `
            SELECT
            sp.id,
            JSON_BUILD_OBJECT(
              'id', sp.user_id,
              'first_name', u.first_name,
              'last_name', u.last_name,
              'profile_img_url', u.profile_img_url,
              'verification_status', u.verification_status
            ) AS user_details,
            sp.status AS request_status,
            sp.created_at AS request_created_at
          FROM
            scaape_participants sp
          JOIN users u ON sp.user_id = u.id
          WHERE
            sp.scaape_id = $1
            AND sp.status = $2
            AND sp.deleted_at IS NULL
          ORDER BY
            sp.created_at DESC
          LIMIT $3 
          OFFSET $4;`;

    const { rows } = await db.query(query, [
      id,
      ScaapeParticipantsStatus.Accepted,
      limit,
      offset,
    ]);
    return rows as unknown as IFetchScaapeParticipantsByScaapeIdRes[];
  };

  protected fetchTotalScaapeParticipantsByScaapeIdDb = async (
    filterObj: IFetchScaapeParticipantsByScaapeIdReqObj
  ): Promise<number> => {
    const { id: scaape_id } = filterObj;
    const query = `
      SELECT COUNT(*) AS total_count
      FROM scaape_participants
      WHERE
        scaape_id = $1
        AND status = $2
        AND deleted_at IS NULL;
    `;

    const { rows } = await db.query(query, [
      scaape_id,
      ScaapeParticipantsStatus.Pending,
    ]);

    return rows[0]?.total_count || 0;
  };
}
