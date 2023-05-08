import { Router } from "express";
import PostController from '../Controllers/Post.Controller';

const PostRoutes = Router();

PostRoutes.get('/post', PostController.GetAllPosts);
PostRoutes.post('/post/create', PostController.CreatePost);
PostRoutes.delete('/post/delete', PostController.DeletePost);
PostRoutes.post('/post/reaction', PostController.ReactionPost);

export default PostRoutes;