import { model, Schema, Types } from "mongoose";



interface IReaction {
    User: String,
    Reaction: "Like" | "Dislike"
}

interface IReply {
    Text: string,
    User: string,
}

interface IComment {
    Text: string,
    User: string,
    Replies: Array<IReply>
}

export interface IPost {
    Text: string,
    Image: String,
    User: string,
    Comment: Array<IComment>,
    Reacctions: Array<IReaction>
}

const ReactionSchema = new Schema<IReaction>({
    User: {type: String, required: true},
    Reaction: {type: String, required: true}
});

const ReplySchema = new Schema<IReply>({
    Text: {type: String, required: true},
    User: {type: String, required: true},
});

const CommentSchema = new Schema<IComment>({
    Text: {type: String, required: true},
    User: {type: String, required: true},
    Replies: {type: [ReplySchema], default: []}
})

const PostSchema = new Schema<IPost>({
    Text: {type: String},
    Image: {type: String},
    User: {type: String, required: true},
    Comment: {type: [CommentSchema], default: []},
    Reacctions: {type: [ReactionSchema], default: []}
}, {strict: true})

const PostSample = {
    Text: "Publication Text Here",
    Image: "An Image URL Here",
    User: "63d1d17dfc98cfe1a37cbc45",
}
const CommentSample = {
    Text: "Comment Text Here",
    User: "63d1d17dfc98cfe1a37cbc45",
}

const Post = model<IPost>('posts', PostSchema);
const Comment = model<IComment>('comment', CommentSchema);

export {
    Post,
    Comment, 
    IComment,
    IReply, 
    IReaction
}
