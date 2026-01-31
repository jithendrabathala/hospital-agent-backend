import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key",
        );
        req.hospitalId = decoded.userId; // userId is still used in token for backward compatibility
        req.userId = decoded.userId; // Keep for existing code
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token has expired",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid token",
            error: error.message,
        });
    }
};
