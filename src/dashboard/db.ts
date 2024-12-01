import db from "../config/postgres";
import { IFetchUserDetailsWithInterestsDbRes } from "./types/interface";

export default class DashboardDb {
  protected fetchUserDetailsWithInterestsDb = async (
    user_id: string
  ): Promise<IFetchUserDetailsWithInterestsDbRes | null> => {
    const query = `
              SELECT
                users.id,
                users.location_range,
                users.gender,
                jsonb_agg(user_event_interests.*) AS user_event_interests 
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

  protected fetchScaapesDb = async () => {
    const query = `
    WITH nearby_scaapes AS (
      SELECT
        *,
        (
          6371 * ACOS(
            COS(RADIANS($1)) * COS(RADIANS(lat)) *
            COS(RADIANS(long) - RADIANS($2)) +
            SIN(RADIANS($1)) * SIN(RADIANS(lat))
          )
        ) AS distance
      FROM
        scaapes
      WHERE
        target_group IN ('all', $3)
        AND scaape_event_id = ANY($4)
    ),
    city_scaapes AS (
      SELECT *
      FROM scaapes
      WHERE
        city = $5 -- Match city
        AND target_group IN ('all', $3)
        AND scaape_event_id = ANY($4)
    )
    SELECT DISTINCT *
    FROM (
      SELECT *
      FROM nearby_scaapes
      WHERE distance <= $6
      ORDER BY distance ASC
      UNION ALL
      SELECT *
      FROM city_scaapes
      WHERE id NOT IN (SELECT id FROM nearby_scaapes)
    ) AS combined_scaapes
    ORDER BY
      CASE
        WHEN scaape_event_id = ANY($4) THEN 1
        WHEN distance IS NOT NULL THEN 2
        ELSE 3
      END,
      distance ASC NULLS LAST
    LIMIT $7 OFFSET $8;
  `;
  };
}
