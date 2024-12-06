import { Router } from "express";
import dashboardRouter from "../dashboard/routes";

const router: Router = Router();

router.use("/dashboard", dashboardRouter);

export default router;
