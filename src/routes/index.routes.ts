import { Router } from "express";
import dashboardRouter from "../dashboard/routes";
import favouriteScaapesRouter from "../favourite_scaapes/routes";

const router: Router = Router();

router.use("/dashboard", dashboardRouter);
router.use("/favourite-scaapes", favouriteScaapesRouter);

export default router;
