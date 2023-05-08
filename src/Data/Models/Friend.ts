import { model, Schema, Types } from "mongoose";

interface IFriendRequest {
    From: String,
    To: String,
    Date: String,
    Status: String
}

const FriendRequestSchema = new Schema<IFriendRequest>({
    From:{type: String, required: true},
    To: {type: String, required: true},
    Date: {type: String, required: true},
    Status: {type: String, required: true}
}, {strict: true});

const FriendRequests = model<IFriendRequest>('friendRequests', FriendRequestSchema);

export{
    FriendRequests,
    IFriendRequest
}
