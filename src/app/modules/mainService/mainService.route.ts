import express from "express";
import { MainServiceController } from "./mainService.controller";



const router = express.Router();

router.post("/create", MainServiceController.createMainService);
router.get("/getAll", MainServiceController.getAllMainServices);

export const MainServiceRoutes = router;
