import Hospital from "../modules/hospital.model.js";
import { getNearbyHospitals, getHospitalsByLocation, getHospitalsBySpecialty } from "../utils/hospitalUtils.js";

// Create a new hospital
export const createHospital = async (req, res) => {
  try {
    const hospitalData = req.body;

    const hospital = new Hospital(hospitalData);
    await hospital.save();

    res.status(201).json({
      success: true,
      message: "Hospital created successfully",
      data: hospital,
    });
  } catch (error) {
    console.error("Create hospital error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating hospital",
      error: error.message,
    });
  }
};

// Get all hospitals
export const getAllHospitals = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const hospitals = await Hospital.find({ isActive: true })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Hospital.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        hospitals,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count,
      },
    });
  } catch (error) {
    console.error("Get all hospitals error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching hospitals",
      error: error.message,
    });
  }
};

// Get hospital by ID
export const getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findById(id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    console.error("Get hospital error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching hospital",
      error: error.message,
    });
  }
};

// Update hospital
export const updateHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const hospital = await Hospital.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Hospital updated successfully",
      data: hospital,
    });
  } catch (error) {
    console.error("Update hospital error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating hospital",
      error: error.message,
    });
  }
};

// Delete hospital (soft delete)
export const deleteHospital = async (req, res) => {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Hospital deleted successfully",
    });
  } catch (error) {
    console.error("Delete hospital error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting hospital",
      error: error.message,
    });
  }
};

// Search nearby hospitals
export const searchNearbyHospitals = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5000, limit = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const hospitals = await getNearbyHospitals(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(maxDistance),
      parseInt(limit),
    );

    res.status(200).json({
      success: true,
      data: {
        count: hospitals.length,
        hospitals,
      },
    });
  } catch (error) {
    console.error("Search nearby hospitals error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching nearby hospitals",
      error: error.message,
    });
  }
};

// Search hospitals by location name
export const searchHospitalsByLocationName = async (req, res) => {
  try {
    const { city, state, zipCode } = req.query;

    if (!city && !state && !zipCode) {
      return res.status(400).json({
        success: false,
        message: "At least one location parameter (city, state, or zipCode) is required",
      });
    }

    const hospitals = await getHospitalsByLocation(city, state, zipCode);

    res.status(200).json({
      success: true,
      data: {
        count: hospitals.length,
        hospitals,
      },
    });
  } catch (error) {
    console.error("Search hospitals by location error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching hospitals by location",
      error: error.message,
    });
  }
};

// Search hospitals by specialty
export const searchHospitalsBySpecialty = async (req, res) => {
  try {
    const { specialty, latitude, longitude, maxDistance = 10000 } = req.query;

    if (!specialty) {
      return res.status(400).json({
        success: false,
        message: "Specialty is required",
      });
    }

    const hospitals = await getHospitalsBySpecialty(
      specialty,
      longitude ? parseFloat(longitude) : null,
      latitude ? parseFloat(latitude) : null,
      parseInt(maxDistance),
    );

    res.status(200).json({
      success: true,
      data: {
        count: hospitals.length,
        hospitals,
      },
    });
  } catch (error) {
    console.error("Search hospitals by specialty error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching hospitals by specialty",
      error: error.message,
    });
  }
};
