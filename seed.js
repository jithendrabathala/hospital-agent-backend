import dotenv from "dotenv";
import mongoose from "mongoose";
import Hospital from "./src/modules/hospital.model.js";
import bcrypt from "bcryptjs";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hospital-booking-agent";

// Sample hospital data
const hospitals = [
  {
    hospitalName: "City General Hospital",
    email: "info@citygeneralhospital.com",
    phone: "+1-555-0101",
    location: {
      type: "Point",
      coordinates: [-71.0589, 42.3601], // Boston, MA
      address: "123 Medical Center Drive",
      city: "Boston",
      state: "MA",
      zipCode: "02115",
      country: "USA",
    },
    specialties: ["Cardiology", "Neurology", "Orthopedics", "Emergency Medicine", "Internal Medicine"],
    departments: [
      { name: "Emergency", phone: "+1-555-0102" },
      { name: "Cardiology", phone: "+1-555-0103" },
      { name: "Neurology", phone: "+1-555-0104" },
    ],
    availability: "24/7",
    rating: 4.5,
    totalReviews: 1250,
    isActive: true,
  },
  {
    hospitalName: "St. Mary's Medical Center",
    email: "contact@stmaryshospital.com",
    phone: "+1-555-0201",
    location: {
      type: "Point",
      coordinates: [-118.2437, 34.0522], // Los Angeles, CA
      address: "456 Healthcare Boulevard",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90012",
      country: "USA",
    },
    specialties: ["Pediatrics", "Obstetrics", "Gynecology", "Oncology", "General Surgery"],
    departments: [
      { name: "Pediatrics", phone: "+1-555-0202" },
      { name: "Maternity", phone: "+1-555-0203" },
      { name: "Surgery", phone: "+1-555-0204" },
    ],
    availability: "24/7",
    rating: 4.7,
    totalReviews: 2100,
    isActive: true,
  },
  {
    hospitalName: "Metropolitan Heart Institute",
    email: "info@metroheartinstitute.com",
    phone: "+1-555-0301",
    location: {
      type: "Point",
      coordinates: [-87.6298, 41.8781], // Chicago, IL
      address: "789 Cardiac Care Way",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA",
    },
    specialties: ["Cardiology", "Cardiovascular Surgery", "Cardiac Rehabilitation", "Vascular Surgery"],
    departments: [
      { name: "Cardiology", phone: "+1-555-0302" },
      { name: "Cardiac Surgery", phone: "+1-555-0303" },
      { name: "Rehabilitation", phone: "+1-555-0304" },
    ],
    availability: "24/7",
    rating: 4.8,
    totalReviews: 980,
    isActive: true,
  },
  {
    hospitalName: "Riverside Community Hospital",
    email: "info@riversidecommunityhospital.com",
    phone: "+1-555-0401",
    location: {
      type: "Point",
      coordinates: [-73.935242, 40.73061], // New York, NY
      address: "321 Riverside Avenue",
      city: "New York",
      state: "NY",
      zipCode: "10002",
      country: "USA",
    },
    specialties: ["Family Medicine", "Emergency Medicine", "Internal Medicine", "Radiology", "Laboratory Services"],
    departments: [
      { name: "Emergency", phone: "+1-555-0402" },
      { name: "Family Medicine", phone: "+1-555-0403" },
      { name: "Radiology", phone: "+1-555-0404" },
    ],
    availability: "24/7",
    rating: 4.3,
    totalReviews: 870,
    isActive: true,
  },
  {
    hospitalName: "Sunshine Children's Hospital",
    email: "care@sunshinechildrens.com",
    phone: "+1-555-0501",
    location: {
      type: "Point",
      coordinates: [-122.4194, 37.7749], // San Francisco, CA
      address: "555 Pediatric Lane",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      country: "USA",
    },
    specialties: ["Pediatrics", "Neonatology", "Pediatric Surgery", "Child Psychology", "Pediatric Cardiology"],
    departments: [
      { name: "Pediatrics", phone: "+1-555-0502" },
      { name: "NICU", phone: "+1-555-0503" },
      { name: "Pediatric Surgery", phone: "+1-555-0504" },
    ],
    availability: "24/7",
    rating: 4.9,
    totalReviews: 1560,
    isActive: true,
  },
  {
    hospitalName: "Western Orthopedic Center",
    email: "contact@westernortho.com",
    phone: "+1-555-0601",
    location: {
      type: "Point",
      coordinates: [-122.3321, 47.6062], // Seattle, WA
      address: "888 Bone and Joint Road",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      country: "USA",
    },
    specialties: ["Orthopedics", "Sports Medicine", "Physical Therapy", "Joint Replacement", "Spine Surgery"],
    departments: [
      { name: "Orthopedics", phone: "+1-555-0602" },
      { name: "Sports Medicine", phone: "+1-555-0603" },
      { name: "Physical Therapy", phone: "+1-555-0604" },
    ],
    availability: "business-hours",
    rating: 4.6,
    totalReviews: 720,
    isActive: true,
  },
  {
    hospitalName: "Central Cancer Treatment Center",
    email: "info@centralcancercenter.com",
    phone: "+1-555-0701",
    location: {
      type: "Point",
      coordinates: [-84.388, 33.749], // Atlanta, GA
      address: "777 Hope Drive",
      city: "Atlanta",
      state: "GA",
      zipCode: "30303",
      country: "USA",
    },
    specialties: ["Oncology", "Radiation Therapy", "Chemotherapy", "Surgical Oncology", "Palliative Care"],
    departments: [
      { name: "Medical Oncology", phone: "+1-555-0702" },
      { name: "Radiation", phone: "+1-555-0703" },
      { name: "Surgery", phone: "+1-555-0704" },
    ],
    availability: "business-hours",
    rating: 4.7,
    totalReviews: 650,
    isActive: true,
  },
  {
    hospitalName: "Harbor View Medical Center",
    email: "info@harborviewmedical.com",
    phone: "+1-555-0801",
    location: {
      type: "Point",
      coordinates: [-80.1918, 25.7617], // Miami, FL
      address: "999 Ocean Boulevard",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      country: "USA",
    },
    specialties: ["Emergency Medicine", "Trauma Surgery", "Internal Medicine", "Neurology", "Cardiology"],
    departments: [
      { name: "Emergency", phone: "+1-555-0802" },
      { name: "Trauma", phone: "+1-555-0803" },
      { name: "ICU", phone: "+1-555-0804" },
    ],
    availability: "24/7",
    rating: 4.4,
    totalReviews: 1100,
    isActive: true,
  },
  {
    hospitalName: "University Medical Center",
    email: "contact@universitymedical.com",
    phone: "+1-555-0901",
    location: {
      type: "Point",
      coordinates: [-71.0636, 42.3605], // Boston, MA (near City General)
      address: "111 University Avenue",
      city: "Boston",
      state: "MA",
      zipCode: "02116",
      country: "USA",
    },
    specialties: ["Teaching Hospital", "Research", "All Specialties", "Neurology", "Gastroenterology"],
    departments: [
      { name: "Neurology", phone: "+1-555-0902" },
      { name: "Gastroenterology", phone: "+1-555-0903" },
      { name: "Research", phone: "+1-555-0904" },
    ],
    availability: "24/7",
    rating: 4.8,
    totalReviews: 2400,
    isActive: true,
  },
  {
    hospitalName: "Valley Wellness Center",
    email: "info@valleywellness.com",
    phone: "+1-555-1001",
    location: {
      type: "Point",
      coordinates: [-112.074, 33.4484], // Phoenix, AZ
      address: "222 Wellness Way",
      city: "Phoenix",
      state: "AZ",
      zipCode: "85001",
      country: "USA",
    },
    specialties: ["Primary Care", "Urgent Care", "Preventive Medicine", "Women's Health", "Men's Health"],
    departments: [
      { name: "Primary Care", phone: "+1-555-1002" },
      { name: "Urgent Care", phone: "+1-555-1003" },
      { name: "Women's Health", phone: "+1-555-1004" },
    ],
    availability: "business-hours",
    rating: 4.2,
    totalReviews: 540,
    isActive: true,
  },
];

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    console.log("\nClearing existing data...");
    await Hospital.deleteMany({});
    console.log("Existing data cleared");

    // Hash password for all hospitals
    console.log("\nHashing passwords...");
    const defaultPassword = "Hospital@123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Add password to each hospital
    const hospitalsWithPassword = hospitals.map((hospital) => ({
      ...hospital,
      password: hashedPassword,
    }));

    // Insert hospitals with authentication
    console.log("\nInserting hospitals...");
    const insertedHospitals = await Hospital.insertMany(hospitalsWithPassword);
    console.log(`${insertedHospitals.length} hospitals inserted successfully`);

    console.log("\n✅ Database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - ${insertedHospitals.length} hospitals with authentication`);
    console.log(`\n🔑 Default password for all hospitals: ${defaultPassword}`);
    console.log("\n🏥 Sample Hospitals by City:");
    const cities = [...new Set(hospitals.map((h) => h.location.city))];
    cities.forEach((city) => {
      const count = hospitals.filter((h) => h.location.city === city).length;
      console.log(`   - ${city}: ${count} hospital(s)`);
    });
    console.log("\n📧 Sample Login Credentials:");
    console.log(`   Email: ${hospitals[0].email}`);
    console.log(`   Password: ${defaultPassword}`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
