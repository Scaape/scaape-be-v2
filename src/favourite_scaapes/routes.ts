import { Router } from "express";
import FavoriteScaapesController from "./controller";

const router: Router = Router();

const { updateFavoriteScaapeController, fetchFavoriteScaapesController } =
  new FavoriteScaapesController();

/**
 * This Would be responsible for all the routes related to the Favorite Scaapes
 * - GET / - Get all the favorite scaapes for the current user
 * - PUT /:scaape_id - Modify the favorite status of a scaape
 */

router.get("/", fetchFavoriteScaapesController);
router.put("/:scaape_id", updateFavoriteScaapeController);

export default router;
