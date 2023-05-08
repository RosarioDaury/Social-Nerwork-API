import FriendController from "../Controllers/Friend.Controller";
import { Router } from "express";

const FriendRoutes =  Router();

FriendRoutes.post('/friend/send/request', FriendController.SendFriendRequest);
FriendRoutes.post('/friend/get/request', FriendController.GetFriendRequests);
FriendRoutes.post('/friend/accept/request', FriendController.AcceptFriendRequest);
FriendRoutes.post('/friend/reject/request', FriendController.RejectFriendRequest);

export default FriendRoutes;


