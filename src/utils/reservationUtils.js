import Reservation from "../modules/reservation.model.js";
import Customer from "../modules/customer.model.js";
import Hospital from "../modules/hospital.model.js";

// Create a new reservation
export const createReservation = async (
  customerName,
  customerPhone,
  hospitalName,
  appointmentType,
  reservationDate,
  timeSlot,
  reason,
) => {
  try {
    // Create or find customer
    let customer = await Customer.findOne({
      name: new RegExp(customerName, "i"),
    });

    if (!customer) {
      customer = new Customer({
        name: customerName,
        phone: customerPhone || "N/A",
      });
      await customer.save();
      console.log("Created new customer:", customer._id);
    }

    // Find hospital by name
    const hospital = await Hospital.findOne({
      hospitalName: new RegExp(hospitalName, "i"),
    });

    if (!hospital) {
      throw new Error(`Hospital "${hospitalName}" not found`);
    }

    // Create reservation
    const reservation = new Reservation({
      customerId: customer._id,
      hospitalId: hospital._id,
      appointmentType,
      reservationDate: new Date(reservationDate),
      timeSlot,
      reason: reason || "",
      status: "confirmed",
    });

    await reservation.save();
    console.log("Reservation created:", reservation._id);

    return {
      success: true,
      message: `Reservation confirmed for ${customerName} at ${hospital.hospitalName} on ${reservationDate} at ${timeSlot}`,
      reservationId: reservation._id,
      details: {
        customerName,
        hospitalName: hospital.hospitalName,
        appointmentType,
        reservationDate,
        timeSlot,
      },
    };
  } catch (error) {
    console.error("Create reservation error:", error);
    return {
      success: false,
      error: "Failed to create reservation",
      message: error.message,
    };
  }
};

// Format reservation data for voice response
export const formatReservationResponse = (reservation) => {
  if (!reservation) {
    return "No reservation found.";
  }

  const date = new Date(reservation.reservationDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `Your reservation is confirmed for ${date} at ${reservation.timeSlot}. Appointment type: ${reservation.appointmentType}. Status: ${reservation.status}.`;
};

// Get reservation details with populated fields
export const getReservationDetails = async (reservationId) => {
  try {
    const reservation = await Reservation.findById(reservationId)
      .populate("customerId", "name phone")
      .populate("hospitalId", "hospitalName phone location specialties");

    return reservation;
  } catch (error) {
    console.error("Get reservation details error:", error);
    throw error;
  }
};

// Get all reservations for a customer
export const getCustomerReservations = async (customerName) => {
  try {
    const customer = await Customer.findOne({
      name: new RegExp(customerName, "i"),
    });

    if (!customer) {
      return [];
    }

    const reservations = await Reservation.find({ customerId: customer._id })
      .populate("hospitalId", "hospitalName phone location")
      .sort({ reservationDate: -1 });

    return reservations;
  } catch (error) {
    console.error("Get customer reservations error:", error);
    throw error;
  }
};

// Cancel a reservation
export const cancelReservation = async (reservationId) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(reservationId, { status: "cancelled" }, { new: true });

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    return {
      success: true,
      message: "Reservation cancelled successfully",
      reservationId: reservation._id,
    };
  } catch (error) {
    console.error("Cancel reservation error:", error);
    return {
      success: false,
      error: "Failed to cancel reservation",
      message: error.message,
    };
  }
};

// Reschedule a reservation
export const rescheduleReservation = async (reservationId, newDate, newTimeSlot) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      reservationId,
      {
        reservationDate: new Date(newDate),
        timeSlot: newTimeSlot,
        status: "confirmed",
      },
      { new: true },
    );

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    return {
      success: true,
      message: `Reservation rescheduled to ${newDate} at ${newTimeSlot}`,
      reservationId: reservation._id,
      newDate,
      newTimeSlot,
    };
  } catch (error) {
    console.error("Reschedule reservation error:", error);
    return {
      success: false,
      error: "Failed to reschedule reservation",
      message: error.message,
    };
  }
};

// Validate reservation data
export const validateReservationData = (data) => {
  const errors = [];

  if (!data.customerName || data.customerName.trim() === "") {
    errors.push("Customer name is required");
  }

  if (!data.hospitalName || data.hospitalName.trim() === "") {
    errors.push("Hospital name is required");
  }

  if (!data.appointmentType) {
    errors.push("Appointment type is required");
  }

  const validAppointmentTypes = ["consultation", "surgery", "checkup", "emergency", "follow-up"];
  if (data.appointmentType && !validAppointmentTypes.includes(data.appointmentType)) {
    errors.push(`Invalid appointment type. Must be one of: ${validAppointmentTypes.join(", ")}`);
  }

  if (!data.reservationDate) {
    errors.push("Reservation date is required");
  } else {
    const date = new Date(data.reservationDate);
    if (isNaN(date.getTime())) {
      errors.push("Invalid reservation date format");
    } else if (date < new Date()) {
      errors.push("Reservation date cannot be in the past");
    }
  }

  if (!data.timeSlot || data.timeSlot.trim() === "") {
    errors.push("Time slot is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Get reservation summary for customer
export const getReservationSummary = async (reservationId) => {
  try {
    const reservation = await Reservation.findById(reservationId)
      .populate("customerId", "name phone")
      .populate("hospitalId", "hospitalName phone location");

    if (!reservation) {
      return null;
    }

    const date = new Date(reservation.reservationDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return {
      customerName: reservation.customerId.name,
      hospitalName: reservation.hospitalId.hospitalName,
      hospitalPhone: reservation.hospitalId.phone,
      appointmentType: reservation.appointmentType,
      date,
      timeSlot: reservation.timeSlot,
      status: reservation.status,
      reason: reservation.reason,
    };
  } catch (error) {
    console.error("Get reservation summary error:", error);
    throw error;
  }
};
