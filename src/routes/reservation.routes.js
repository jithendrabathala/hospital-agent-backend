import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  getReservations,
  getReservationById,
  getCallLogs,
  getCallLogById,
  getCallLogsStats,
  getCurrentUserCallLogs,
  getCustomers,
} from "../controller/reservation.controller.js";

const router = express.Router();

// Protected routes
router.use(verifyToken);

// Reservation routes
router.get("/reservations", getReservations);
router.get("/reservations/:id", getReservationById);

// Call log routes
router.get("/call-logs", getCallLogs);
router.get("/call-logs/:id", getCallLogById);
router.get("/call-logs/stats/overview", getCallLogsStats);
router.get("/me/call-logs", getCurrentUserCallLogs);

// Customers
router.get("/customers", getCustomers);

export default router;
