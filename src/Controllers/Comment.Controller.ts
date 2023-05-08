import { ConnectToMongo, DisconnectMongo } from "../Data/MongoConnection";
import { Response, Request } from "express";
import { Comment, Post, IComment, IReply } from "../Data/Models/Post";


// ROUTE: /post/comment
// BODY: {PostId, Text, UserId}
const AddComment = async (req: Request, res: Response) => {
    const {PostId, Text, UserId} = req.body
    const CommentSample: IComment = {
        Text,
        User: UserId,
        Replies: []
    }
    const NComment = new Comment(CommentSample);

    await ConnectToMongo();

    let CommentValidation = NComment.validateSync();

    if(CommentValidation) {
        res.status(500).json({
            CommentValidation
        })
        DisconnectMongo(); 
    }else{
        Post.updateOne({_id: PostId}, {$push: {"Comment": NComment}}, async (err, doc) => {
            if(err){
                res.status(500).json({
                    Message: "ERROR AT ADDING COMMENT",
                    Success: false,
                    err
                });
                DisconnectMongo();
                return;
            }
            
            if(doc.modifiedCount){
                res.status(202).json({
                    Message: "COMMENT ADDED TO POST",
                    Success: true,
                    doc
                });
                DisconnectMongo(); 
                return; 
            }

            res.status(202).json({
                Message: "THERE IS NOT SUCH POST TO ADD COMMENT TO",
                Success: false,
                doc
            });
            DisconnectMongo(); 
        
        })
    }
}

// ROUTE: /post/comment/delete
// BODY: {PostId, CommentId}
const DeleteComment = async (req: Request, res: Response) => {
    const {PostId, CommentId} = req.body;

    await ConnectToMongo();
    Post.updateOne({_id: PostId}, {$pull: {"Comment": {"_id": CommentId}}}, (err, doc) => {
        if(err){
            res.status(500).json({
                Message: "ERROR AT DELETING COMMENT",
                Success: false,
                err
            });
            DisconnectMongo();
            return;
        }

        if(doc.modifiedCount){
            res.status(202).json({
                Message: "COMMENT SUCCESFULLY DELETED",
                Success: true,
                doc
            })
            DisconnectMongo();
            return
        }

        res.status(202).json({
            Message: "THERE IS NOT SUCH COMMENT TO DELETE",
            Success: false,
            doc
        })
        DisconnectMongo();
        
    })
}

// ROUTE: /post/comment/reply
// BODY: {PostId, CommentId, Text, UserId}
const ReplyComment =  async (req: Request, res: Response) => {
    const {PostId, CommentId, Text, UserId } = req.body;

    if(!Text || !UserId || !PostId || !CommentId){
        res.status(500).json({
            Message: "VALUES MISSING IN BODY",
            Route: "/post/comment/reply",
            Success: false,
        });
        return
    }
    const NewReply: IReply =  {
        Text,
        User: UserId
    }

    await ConnectToMongo();
    Post.updateOne(
        {"_id": PostId, "Comment._id": CommentId}, 
        {$push: 
            {"Comment.$[i].Replies": NewReply}
        },
        {
            arrayFilters: [
                {"i._id": CommentId},
            ],
        },
        async (err, doc) => {
            if(err){
                res.status(500).json({
                    Message: "ERROR AT ADDING REPLY TO COMMENT",
                    Success: false,
                    err
                });
                DisconnectMongo();
                return;
            }

            if(doc.modifiedCount){
                res.status(202).json({
                    Message: "REPLY ADDED TO COMMENT",
                    Success: true,
                    doc
                });
                DisconnectMongo(); 
                return; 
            }

            res.status(202).json({
                Message: "THERE IS NOT SUCH POST/COMMENT TO ADD REPLY  TO",
                Success: false,
                doc
            });
            DisconnectMongo(); 
        }
    )
}

export default {
    AddComment,
    DeleteComment,
    ReplyComment
}