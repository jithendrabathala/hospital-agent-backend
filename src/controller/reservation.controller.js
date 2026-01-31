import mongoose from "mongoose";
import Reservation from "../modules/reservation.model.js";
import CallLog from "../modules/calllog.model.js";

// Helper function to get date range based on filter type
const getDateRange = (filterType, customStartDate, customEndDate) => {
    const now = new Date();
    const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
    );
    const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
    );

    let startDate, endDate;

    switch (filterType) {
        case "today":
            startDate = startOfDay;
            endDate = endOfDay;
            break;

        case "this-week":
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startDate = new Date(now.getFullYear(), now.getMonth(), diff);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;

        case "this-month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;

        case "custom":
            if (!customStartDate || !customEndDate) {
                // Return null to indicate custom date filter was requested but dates are missing
                return null;
            }
            try {
                startDate = new Date(customStartDate);
                endDate = new Date(customEndDate);
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    return null;
                }
                endDate.setHours(23, 59, 59, 999);
            } catch (error) {
                return null;
            }
            break;

        default:
            startDate = new Date(0);
            endDate = endOfDay;
    }

    return { startDate, endDate };
};

// Get all reservations with filtering
export const getReservations = async (req, res) => {
    try {
        const {
            dateFilter = "all",
            startDate,
            endDate,
            status,
            hospitalId,
        } = req.query;
        const userId = req.userId;

        let query = { hospitalId: hospitalId || userId };

        // Apply date filtering
        if (dateFilter !== "all") {
            const dateRange = getDateRange(dateFilter, startDate, endDate);

            // If custom filter is requested but dates are missing, use today's date as fallback
            if (dateRange === null) {
                const now = new Date();
                const startOfDay = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                );
                const endOfDay = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    23,
                    59,
                    59,
                    999,
                );
                query.reservationDate = {
                    $gte: startOfDay,
                    $lte: endOfDay,
                };
            } else {
                query.reservationDate = {
                    $gte: dateRange.startDate,
                    $lte: dateRange.endDate,
                };
            }
        }

        // Apply status filtering
        if (status) {
            query.status = status;
        }

        const reservations = await Reservation.find(query)
            .populate("customerId", "name phone")
            .populate("hospitalId", "hospitalName")
            .populate("callLogId")
            .sort({ reservationDate: -1 });

        res.status(200).json({
            success: true,
            message: "Reservations fetched successfully",
            data: {
                count: reservations.length,
                reservations,
            },
        });
    } catch (error) {
        console.error("Get reservations error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching reservations",
            error: error.message,
        });
    }
};

// Get single reservation
export const getReservationById = async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findById(id)
            .populate("customerId", "name phone")
            .populate("hospitalId")
            .populate("callLogId");

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Reservation fetched successfully",
            data: reservation,
        });
    } catch (error) {
        console.error("Get reservation error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching reservation",
            error: error.message,
        });
    }
};

// Get call logs with filtering
export const getCallLogs = async (req, res) => {
    try {
        const {
            dateFilter = "all",
            startDate,
            endDate,
            callStatus,
            customerId,
        } = req.query;
        const userId = req.userId;

        let query = {};

        // Add user context - assuming callLogs are linked to hospital through customer or directly
        if (customerId) {
            query.customerId = customerId;
        }

        // Apply date filtering
        if (dateFilter !== "all") {
            const dateRange = getDateRange(dateFilter, startDate, endDate);

            // If custom filter is requested but dates are missing, use today's date as fallback
            if (dateRange === null) {
                const now = new Date();
                const startOfDay = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                );
                const endOfDay = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    23,
                    59,
                    59,
                    999,
                );
                query.startTime = {
                    $gte: startOfDay,
                    $lte: endOfDay,
                };
            } else {
                query.startTime = {
                    $gte: dateRange.startDate,
                    $lte: dateRange.endDate,
                };
            }
        }

        // Apply call status filtering
        if (callStatus) {
            query.callStatus = callStatus;
        }

        const callLogs = await CallLog.find(query)
            .populate("customerId", "name phone")
            .populate("reservationId")
            .sort({ startTime: -1 });

        res.status(200).json({
            success: true,
            message: "Call logs fetched successfully",
            data: {
                count: callLogs.length,
                callLogs,
            },
        });
    } catch (error) {
        console.error("Get call logs error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching call logs",
            error: error.message,
        });
    }
};

// Get single call log
export const getCallLogById = async (req, res) => {
    try {
        const { id } = req.params;

        const callLog = await CallLog.findById(id)
            .populate("customerId")
            .populate("reservationId");

        if (!callLog) {
            return res.status(404).json({
                success: false,
                message: "Call log not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Call log fetched successfully",
            data: callLog,
        });
    } catch (error) {
        console.error("Get call log error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching call log",
            error: error.message,
        });
    }
};

// Get call logs statistics
export const getCallLogsStats = async (req, res) => {
    try {
        const { dateFilter = "all", startDate, endDate } = req.query;

        let matchQuery = {};

        if (dateFilter !== "all") {
            const dateRange = getDateRange(dateFilter, startDate, endDate);

            // If custom filter is requested but dates are missing, use today's date as fallback
            if (dateRange === null) {
                const now = new Date();
                const startOfDay = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                );
                const endOfDay = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    23,
                    59,
                    59,
                    999,
                );
                matchQuery.startTime = {
                    $gte: startOfDay,
                    $lte: endOfDay,
                };
            } else {
                matchQuery.startTime = {
                    $gte: dateRange.startDate,
                    $lte: dateRange.endDate,
                };
            }
        }

        const stats = await CallLog.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalCalls: { $sum: 1 },
                    completedCalls: {
                        $sum: {
                            $cond: [
                                { $eq: ["$callStatus", "completed"] },
                                1,
                                0,
                            ],
                        },
                    },
                    missedCalls: {
                        $sum: {
                            $cond: [{ $eq: ["$callStatus", "missed"] }, 1, 0],
                        },
                    },
                    failedCalls: {
                        $sum: {
                            $cond: [{ $eq: ["$callStatus", "failed"] }, 1, 0],
                        },
                    },
                    totalDuration: { $sum: "$duration" },
                    avgDuration: { $avg: "$duration" },
                    avgQualityScore: { $avg: "$qualityScore" },
                    reservationsMade: {
                        $sum: {
                            $cond: [
                                { $eq: ["$callOutcome", "reservation_made"] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            message: "Call logs statistics fetched successfully",
            data: stats[0] || {
                totalCalls: 0,
                completedCalls: 0,
                missedCalls: 0,
                failedCalls: 0,
                totalDuration: 0,
                avgDuration: 0,
                avgQualityScore: 0,
                reservationsMade: 0,
            },
        });
    } catch (error) {
        console.error("Get call logs stats error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching call logs statistics",
            error: error.message,
        });
    }
};

// Get current user's call logs
export const getCurrentUserCallLogs = async (req, res) => {
    try {
        const {
            dateFilter = "all",
            startDate,
            endDate,
            callStatus,
        } = req.query;
        const userId = req.userId;

        let query = { agentId: userId };

        // Apply date filtering
        if (dateFilter !== "all") {
            const dateRange = getDateRange(dateFilter, startDate, endDate);

            // If custom filter is requested but dates are missing, use today's date as fallback
            if (dateRange === null) {
                const now = new Date();
                const startOfDay = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                );
                const endOfDay = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    23,
                    59,
                    59,
                    999,
                );
                query.startTime = {
                    $gte: startOfDay,
                    $lte: endOfDay,
                };
            } else {
                query.startTime = {
                    $gte: dateRange.startDate,
                    $lte: dateRange.endDate,
                };
            }
        }

        // Apply call status filtering
        if (callStatus) {
            query.callStatus = callStatus;
        }

        const callLogs = await CallLog.find(query)
            .populate("customerId", "name phone")
            .populate("reservationId")
            .sort({ startTime: -1 });

        res.status(200).json({
            success: true,
            message: "Current user call logs fetched successfully",
            data: {
                count: callLogs.length,
                callLogs,
            },
        });
    } catch (error) {
        console.error("Get current user call logs error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching current user call logs",
            error: error.message,
        });
    }
};

// Get customers linked to the current hospital's reservations
export const getCustomers = async (req, res) => {
    try {
        const userId = req.userId;

        const customers = await Reservation.aggregate([
            { $match: { hospitalId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: "$customerId",
                    totalReservations: { $sum: 1 },
                    lastReservation: { $max: "$reservationDate" },
                },
            },
            {
                $lookup: {
                    from: "customers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "customer",
                },
            },
            { $unwind: "$customer" },
            {
                $project: {
                    _id: 0,
                    customerId: "$customer._id",
                    name: "$customer.name",
                    phone: "$customer.phone",
                    totalReservations: 1,
                    lastReservation: 1,
                },
            },
            { $sort: { lastReservation: -1 } },
        ]);

        res.status(200).json({
            success: true,
            message: "Customers fetched successfully",
            data: {
                count: customers.length,
                customers,
            },
        });
    } catch (error) {
        console.error("Get customers error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching customers",
            error: error.message,
        });
    }
};
