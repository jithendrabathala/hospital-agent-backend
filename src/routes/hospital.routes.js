import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createHospital,
  getAllHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
  searchNearbyHospitals,
  searchHospitalsByLocationName,
  searchHospitalsBySpecialty,
} from "../controller/hospital.controller.js";

const router = express.Router();

// Public search endpoints
router.get("/search/nearby", searchNearbyHospitals);
router.get("/search/location", searchHospitalsByLocationName);
router.get("/search/specialty", searchHospitalsBySpecialty);

// Protected routes
router.post("/", verifyToken, createHospital);
router.get("/", getAllHospitals);
router.get("/:id", getHospitalById);
router.put("/:id", verifyToken, updateHospital);
router.delete("/:id", verifyToken, deleteHospital);

export default router;
