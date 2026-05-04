import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import emailRouter from "./email";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(emailRouter);
router.use(stripeRouter);

export default router;
