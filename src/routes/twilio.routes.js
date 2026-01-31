import { Router } from "express";
import { incomingCall } from "../controller/twilio.controller.js";

const router = Router();

// Example user route
router.post("/", incomingCall);

export default router;
