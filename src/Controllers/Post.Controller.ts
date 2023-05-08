import { Response, Request } from "express";
import { Comment, Post, IReaction } from "../Data/Models/Post";
import { Users } from "../Data/Models/Users";
import { ConnectToMongo, DisconnectMongo } from "../Data/MongoConnection";

// ROUTE: /post
const GetAllPosts = async (req: Request, res: Response) => {
    await ConnectToMongo();
    Post.find(async (err, docs) => {
        if(err) {
            res.status(500).send('ERROR AT FIND USERS');
            DisconnectMongo();
            return;
        }
        await res.status(200).json(docs);
        DisconnectMongo();
    })  
}

// ROUTE: /post/create
// BODY: {Text, Image, User}
const CreatePost = async (req: Request, res: Response) => {
    const {Text, Image, User} = req.body;

    if(!Text && !Image) {
        res.status(500).json({
            Message: "POST MUST TO HAVE EITHER TEXT OR IMAGE",
            Success: false,
        });
        return
    }

    const PostSample = {
        Text: Text || '',
        Image: Image || '',
        User: User
    }

    await ConnectToMongo();

    Users.findOne({_id: User}, async (err, doc) => {
        if(err){
            res.status(500).json({
                Message: "ERROR AT CREATING NEW POST",
                Success: false,
                err
            });
            DisconnectMongo();
            return
        }
        if(!doc){
            res.status(500).json({
                Message: "USER DOESN'T EXIST",
                Success: false
            })
            DisconnectMongo();
            return
        }

        const newPost =  new Post(PostSample);
        const Validation = newPost.validateSync();

        if(Validation){
            res.status(500).json({
                Validation
            })
            DisconnectMongo(); 
        } else {
            newPost.save(async (err) => {
                if(err){
                    res.status(500).json({
                        Message: "ERROR AT CREATING NEW POST, MIGHT HAVE TO CHECK SCHEMA",
                        Success: false,
                        err
                    });
                    DisconnectMongo();
                    return
                }
        
                res.status(201).json({
                    Message: "NEW POST SUCCESFULLY CREATED",
                    Success: true
                })
                DisconnectMongo();
            })
        }
    })
    
}

// ROUTE: /post/delete
// BODY: {UserId, PostId}
const DeletePost =  async (req: Request, res: Response) => {
    const {UserId, PostId} = req.body;

    await ConnectToMongo();

    Post.findOne({_id: PostId}, async (err, doc) => {
        if(err){
            res.status(504).json({
                Message: "ERROR AT FINDING POST TO DELETE",
                Success: false,
                err
            });
            DisconnectMongo();
            return;
        }

        if(doc && doc.User === UserId) {
            Post.deleteOne({_id: PostId}, (err, doc) => {
                if(err) {
                    res.status(504).json({
                        Message: "ERROR AT FINDING POST TO DELETE",
                        Success: false,
                        err
                    });
                    DisconnectMongo();
                    return;
                }

                res.status(200).json({
                    Message: "POST SUCCESFULLY DELETED",
                    Success: true
                });
                DisconnectMongo();
            })
        }else {
            res.json({
                Message: "USER IS NOT POST OWNER OR POST DOESN'T EXIST",
                Success: false
            });
        }

        
    })
}

// ROUTE: /post/reaction
// BODY: {Reaction: "Like" || "Dislike", UserId, PostId}
const ReactionPost = async (req: Request, res: Response) => {
    const {Reaction, UserId, PostId} = req.body;

    if(!Reaction || !UserId || !PostId){
        res.status(500).json({
            Message: "VALUES MISSING IN BODY",
            Route: '/post/reaction',
            Success: false,
        });
        return
    }
    
    const newReaction: IReaction = {
        User: UserId, 
        Reaction
    }

    await ConnectToMongo();

    const User =  await Users.findOne({_id: UserId});

    if(!User){
        res.status(500).json({
            Message: "USER SENDING REACTION DOESNT EXIST",
            Success: false,
        });
        DisconnectMongo();
        return;
    }

    const IfExist = await Post.findOne({_id: PostId, "Reacctions.User": UserId});

    if(IfExist){

        let Current: any = IfExist.Reacctions.filter(el => el.User === UserId);
        if(Current[0].Reaction != Reaction) {

            Post.updateOne({_id: PostId, "Reacctions.User": UserId}, {$set: {"Reacctions.$.Reaction": Reaction}}, async (err, doc) => {
                if(err){
                    res.status(500).json({
                        Message: "ERROR AT ADDING REACTION",
                        Success: false,
                        err
                    });
                    DisconnectMongo();
                    return;
                }

                if(doc.modifiedCount){
                    res.status(202).json({
                        Message: "REACTION ADDED TO POST",
                        Success: true,
                        doc
                    });
                    DisconnectMongo(); 
                    return; 
                }
        
                res.status(202).json({
                    Message: "NOT POST'S REACTION CHANGED",
                    Success: false,
                    doc
                });
                DisconnectMongo(); 
                return
            })

        }else{
            res.status(500).json({
                Message: "USER ALREADY REACTED TO THIS POST",
                Success: false,
                Post: IfExist,
                Current
            });
            DisconnectMongo();
            return;
        }

    } else{
        Post.updateOne({_id: PostId}, {$push: {"Reacctions": newReaction}}, async (err, doc) => {
        if(err){
            res.status(500).json({
                Message: "ERROR AT ADDING REACTION",
                Success: false,
                err
            });
            DisconnectMongo();
            return;
        }
        
        if(doc.modifiedCount){
            res.status(202).json({
                Message: "REACTION ADDED TO POST",
                Success: true,
                doc
            });
            DisconnectMongo(); 
            return; 
        }

        res.status(202).json({
            Message: "THERE IS NOT SUCH POST TO ADD REACTION TO",
            Success: false,
            doc
        });
        DisconnectMongo(); 
    })
    }


    


}


export default {
    GetAllPosts,
    CreatePost,  
    DeletePost,
    ReactionPost
}