import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import emailRouter from "./email";
import stripeRouter from "./stripe";
import paypalRouter from "./paypal";
import couponsRouter from "./coupons";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(emailRouter);
router.use(stripeRouter);
router.use(paypalRouter);
router.use(couponsRouter);

export default router;
