import Hospital from "../modules/hospital.model.js";

// Get nearby hospitals based on coordinates
export const getNearbyHospitals = async (longitude, latitude, maxDistance = 5000, limit = 10) => {
  try {
    const hospitals = await Hospital.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance, // in meters
        },
      },
      isActive: true,
    })
      .limit(limit)
      .select("hospitalName phone location specialties availability rating");

    return hospitals;
  } catch (error) {
    console.error("Get nearby hospitals error:", error);
    throw error;
  }
};

// Get hospitals by city
export const getHospitalsByLocation = async (city, state, zipCode) => {
  try {
    const query = { isActive: true };

    if (city) {
      query["location.city"] = new RegExp(city, "i");
    }

    const hospitals = await Hospital.find(query)
      .limit(20)
      .select("hospitalName phone location specialties availability rating");

    console.log("Hospitals by location query:", query);
    console.log("Found hospitals:", hospitals);

    return hospitals;
  } catch (error) {
    console.error("Get hospitals by location error:", error);
    throw error;
  }
};

// Get hospitals by specialty
export const getHospitalsBySpecialty = async (specialty, longitude, latitude, maxDistance = 10000) => {
  try {
    const query = {
      specialties: new RegExp(specialty, "i"),
      isActive: true,
    };

    let hospitals;

    if (longitude && latitude) {
      hospitals = await Hospital.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
      })
        .limit(10)
        .select("hospitalName phone location specialties availability rating");
    } else {
      hospitals = await Hospital.find(query)
        .limit(10)
        .select("hospitalName phone location specialties availability rating");
    }

    return hospitals;
  } catch (error) {
    console.error("Get hospitals by specialty error:", error);
    throw error;
  }
};

// Get all hospitals
export const getAllHospitals = async (limit = 50) => {
  try {
    const hospitals = await Hospital.find({ isActive: true })
      .limit(limit)
      .select("hospitalName phone location specialties availability rating");

    return hospitals;
  } catch (error) {
    console.error("Get all hospitals error:", error);
    throw error;
  }
};

// Format hospital data for AI response
export const formatHospitalResponse = (hospitals) => {
  if (!hospitals || hospitals.length === 0) {
    return "I couldn't find any hospitals matching your criteria.";
  }

  const hospitalsText = hospitals
    .map((hospital, index) => {
      const distance = hospital.location?.distance
        ? `${(hospital.location.distance / 1000).toFixed(1)} kilometers away`
        : "";
      const rating = hospital.rating ? `Rated ${hospital.rating} out of 5 stars` : "";
      const specialties = hospital.specialties?.length
        ? `Specialties: ${hospital.specialties.slice(0, 3).join(", ")}`
        : "";

      return `${index + 1}. ${hospital.hospitalName}
Phone: ${hospital.phone}
${distance}
${rating}
${specialties}`;
    })
    .join("\n\n");

  return `I found ${hospitals.length} hospital${hospitals.length > 1 ? "s" : ""} for you:\n\n${hospitalsText}`;
};
