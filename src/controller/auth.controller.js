import Hospital from "../modules/hospital.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  });
};

export const signup = async (req, res) => {
  try {
    const { hospitalName, email, password, phone, location } = req.body;

    // Validate required fields
    if (!hospitalName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Validate location coordinates
    const coordinates = location?.coordinates;
    const longitude = Array.isArray(coordinates) ? Number(coordinates[0]) : NaN;
    const latitude = Array.isArray(coordinates) ? Number(coordinates[1]) : NaN;

    if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid longitude and latitude values",
      });
    }

    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180 and latitude between -90 and 90",
      });
    }

    // Check if hospital already exists
    const existingHospital = await Hospital.findOne({ email });
    if (existingHospital) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new hospital
    const hospital = new Hospital({
      hospitalName,
      email,
      password: hashedPassword,
      phone,
      location,
      isActive: true,
    });

    await hospital.save();

    // Generate token
    const token = generateToken(hospital._id);

    res.status(201).json({
      success: true,
      message: "Hospital registered successfully",
      data: {
        hospitalId: hospital._id,
        hospitalName: hospital.hospitalName,
        email: hospital.email,
        phone: hospital.phone,
        location: hospital.location,
        token,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Error during signup",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find hospital by email
    const hospital = await Hospital.findOne({ email });
    if (!hospital) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, hospital.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(hospital._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        hospitalId: hospital._id,
        hospitalName: hospital.hospitalName,
        email: hospital.email,
        phone: hospital.phone,
        location: hospital.location,
        specialties: hospital.specialties,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
};
