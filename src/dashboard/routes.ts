import Router from "express";

const router = Router();

/**
 * ROUTER
 */

router.get("/near");

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
