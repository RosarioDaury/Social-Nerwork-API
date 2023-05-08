import CommentController from "../Controllers/Comment.Controller";
import { Router } from "express";

const CommentRoutes = Router();


CommentRoutes.post('/post/comment', CommentController.AddComment);
CommentRoutes.delete('/post/comment/delete', CommentController.DeleteComment);
CommentRoutes.post('/post/comment/reply', CommentController.ReplyComment);


export default CommentRoutes;
