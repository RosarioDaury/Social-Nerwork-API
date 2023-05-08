import express, { Response, Request, NextFunction } from "express";
import bodyParser from "body-parser";
import UserRoutes from "./Routes/User.routes";
import PostRoutes from "./Routes/Post.routes";
import CommentRoutes from "./Routes/Comment.routes";
import FriendRoutes from "./Routes/Friend.routes";

const App: express.Application = express();

App.use(bodyParser.json());

App.use(UserRoutes);
App.use(PostRoutes);
App.use(CommentRoutes);
App.use(FriendRoutes);


App.listen(3000, () => {
    console.log('SERVER RUNNING ON PORT 3005');
});