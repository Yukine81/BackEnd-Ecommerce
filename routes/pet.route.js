import express from "express";
import {
    getAllPets,
    getPetbyId,
    createPet,
    updatePet,
    deletePet
} from "../controllers/pet.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
    .get(getAllPets) 
    .put(protectRoute, adminRoute, updatePet)
    .post(protectRoute,adminRoute,createPet)
    .delete(protectRoute,adminRoute,deletePet)

router.route("/:id")
    .get(getPetbyId)
    

export default router;
