import { Router } from "express";
import UserController from "../Controllers/User.Controller";

const UserRoutes = Router();

UserRoutes.get('/users', UserController.GetAllUsers);
UserRoutes.post('/user/auth', UserController.AuthUser);
UserRoutes.post('/user/create', UserController.CreateUser);
UserRoutes.post('/forgotpassword', UserController.ForgotPassword);
UserRoutes.post('/resetpassword', UserController.ResetPassword);
UserRoutes.delete('/user/delete', UserController.DeleteUser);

export default UserRoutes;