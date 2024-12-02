import Router from "express";
import DashboardController from "./controller";
import { validateFetchScaapesForDashboard } from "./middleware";

const router = Router();

const { fetchScaapesForDashboardController } = new DashboardController();

/**
 * API to get All the Scaapes for the DASHBOARD for a user
 * @req_body user_id - The id of the user
 * @query_param long - The longitude of the user
 * @query_param lat - The latitude of the user
 * @query_param city - The city of the user
 * @returns JSON response with the scaapes
 */
router.get(
  "/",
  validateFetchScaapesForDashboard,
  fetchScaapesForDashboardController
);

// API to get all scaapes with query filter -> all, attending, created_by_me
router.get("/scaapes");

// API to get the city & details from the lat & long
router.get("/location");

// API to get Scaape details by id
router.get("/scaapes/:id");

// API to get the participants for the Scaape
router.get("/scaapes/participants");

//

/**
 * SELECT *
FROM events
WHERE city = (
    SELECT city
    FROM events
    WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), 10000)
    LIMIT 1
)
AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), :radius);
 */

export default router;

/**
 * GET /near (scaapes near by)
GET /getScaapes
Scaape table
Name
Event_date
Event_type_id
Payment method id
Photo library setting
Target group
Lat
Long
Address line description
Landmark
Price
Cost breakup
Hours before cancellation
Attendee count
Payments table
Config id
User id
Partner
Media
Scaape id
Url
Metadata
Scaape_Tags
Tag id
Name
Filters
Search
Pagination
Notification create
Get /getScaapeDetails
Get /getNotification
Post /joinScaape
Participant
Scaape id
User id
Status
Transaction id
Id
Transaction status
Get /getMyScaape
Filter : all | Created by me | attending
Post / createScaape
PUT /editScaape
DELETE /deleteScaape
POST /manageScaapeParticipant
GET /getParticipants
scaapeId
GET /getAttendance
PUT /reportScaape

 */
