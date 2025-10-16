import express from 'express';
import { blockorUnblockUser, createUser, getAllUsers, getUser, googleLogin, loginUser } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.post("/", createUser)

userRouter.post("/login", loginUser)

userRouter.get("/me", getUser)

userRouter.post("/google-login", googleLogin);

userRouter.get("/all-users", getAllUsers);

userRouter.put("/block/:email", blockorUnblockUser);

export default userRouter;