import { Router } from "express";

const router = Router();

// Example user route
router.get("/", (req, res) => {
  res.status(200).json({ message: "User route is working!" });
});

export default router;
