import { Router } from "express";

import DashboardController from "./controller";
import {
  validateCreateScaape,
  validateFetchScaapeParticipantsByScaapeId,
  validateFetchScaapePendingApprovalsByScaapeId,
  validateFetchScaapesForDashboard,
  validateManageApprovals,
  validateUpdateScaapeBasicDetails,
  validateUpdateScaapeLocation,
  validateUpdateScaapePaymentSettings,
} from "./middleware";

const router: Router = Router();

const {
  fetchScaapesForDashboardController,
  fetchScaapeDetailsByIdController,
  createScaapeController,
  fetchScaapesController,
  fetchScaapeParticipantsController,
  manageApprovalsController,
  fetchScaapeParticipantsByScaapeIdController,
  fetchLocationDetailsController,
  updateScaapeBasicDetailsController,
  updateScaapeLocationController,
  updateScaapePaymentSettingsController,
} = new DashboardController();

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

// API to create a new Scaape
router.post("/scaapes", validateCreateScaape, createScaapeController);

// API to get all scaapes with query filter -> all, attending, created_by_me
router.get("/scaapes", fetchScaapesController);

// API to get the city & details from the lat & long
router.get("/location", fetchLocationDetailsController);

// API to get Scaape details by id
router.get("/scaapes/:id", fetchScaapeDetailsByIdController);

// API to get the participants for the Scaape
router.get(
  "/scaapes/pending-approvals/:scaape_id",
  validateFetchScaapePendingApprovalsByScaapeId,
  fetchScaapeParticipantsController
);

// API to manage approvals
router.patch(
  "/scaapes/manage-approvals/:scaape_id",
  validateManageApprovals,
  manageApprovalsController
);

// API to get event attendance (show people who are approved)
router.get(
  "/scaapes/participants/:scaape_id",
  validateFetchScaapeParticipantsByScaapeId,
  fetchScaapeParticipantsByScaapeIdController
);

router.patch(
  "/scaapes/basic/:scaape_id",
  validateUpdateScaapeBasicDetails,
  updateScaapeBasicDetailsController
);

router.patch(
  "/scaapes/location/:scaape_id",
  validateUpdateScaapeLocation,
  updateScaapeLocationController
);

router.patch(
  "/scaapes/payment/:scaape_id",
  validateUpdateScaapePaymentSettings,
  updateScaapePaymentSettingsController
);

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
