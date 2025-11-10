import express from "express";
import { authenticate, authorizeRole } from "../middlewares/auth.js";
import {
  createSalesperson,
  getSalespersons,
  getSalespersonById,
  updateSalesperson,
  deleteSalesperson,
} from "../controllers/salesPersonController.js";

const router = express.Router();

router.post("/register-salesperson", authenticate, authorizeRole("ADMIN"), createSalesperson);
router.get("/register-salesperson", authenticate, authorizeRole("ADMIN"), getSalespersons);
router.get("/register-salesperson/:id", authenticate, authorizeRole("ADMIN"), getSalespersonById);
router.put("/register-salesperson/:id", authenticate, authorizeRole("ADMIN"), updateSalesperson);
router.delete("/register-salesperson/:id", authenticate, authorizeRole("ADMIN"), deleteSalesperson);

export default router;
