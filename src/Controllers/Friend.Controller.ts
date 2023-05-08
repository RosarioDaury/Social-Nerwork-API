import { IFriendRequest, FriendRequests} from "../Data/Models/Friend";
import { Response, Request } from "express";
import { ConnectToMongo, DisconnectMongo } from "../Data/MongoConnection";
import { Users } from "../Data/Models/Users";

const PENDING = "PENDING";
const ACCEPTED = "ACCEPTED";
const REJECTED = "REJECTED";

// ROUTE: /friend/get/request
// BODY: {UserId}
// QUERY: filter: "APPROVED" || "REJECTED" || "PENDING"
const GetFriendRequests = async (req: Request, res: Response) => {
    const {filter} = req.query;
    const {UserId} = req.body;

    await ConnectToMongo();
    
    FriendRequests.find({To: UserId, Status: filter}, (err, doc) =>  {
        if(err){
            res.status(500).json({
                Message: "ERROR AT GETTING FRIEND REQUEST",
                Success: false,
                err
            });
            DisconnectMongo();
            return
        }

        res.status(200).json({
            doc
        })
    }) 
}

// ROUTE: /friend/send/request
// BODY: {From: UserId, To: UserId}
const SendFriendRequest = async (req: Request, res: Response) => {
    const {From, To} = req.body;
    const FR: IFriendRequest = {
        From,
        To,
        Date: new Date().toLocaleDateString("en-US"),
        Status: PENDING
    }
    const newFR = new FriendRequests(FR);
    await ConnectToMongo();
    let Validation = newFR.validateSync();

    if(Validation){
        res.status(500).json({
            FRequestValidation: Validation
        })
        DisconnectMongo(); 
        return
    }

    const User1 = await Users.findOne({_id: From});
    const User2 =  await Users.findOne({_id: To});
    const ifExist =  await FriendRequests.findOne({To: To, From: From});
    const ifExist2 =  await FriendRequests.findOne({To: From, From: To});

    if(!User1 || !User2 || ifExist || ifExist2) {
        res.status(500).json({
            Error: true,
            Message: "ERROR AT SENDING FR"
        })
        DisconnectMongo(); 
        return
    }

    newFR.save(async (err) => {
        if(err){
            res.status(500).json({
                Message: "ERROR AT CREATING NEW FRIEND REQUEST",
                Success: false,
                err
            });
            DisconnectMongo();
            return
        }

        res.status(201).json({
            From: User1, 
            To: User2,
            Message: "NEW FRIEND REQUEST SUCCESFULLY CREATED",
            Success: true
        })
        DisconnectMongo();

    })


}

// ROUTE: /friend/accept/request
// BODY: {RequestId: Friend Request ID, UserId}
const AcceptFriendRequest = async (req: Request, res: Response) => {
    const{ RequestId, UserId} = req.body;
    await ConnectToMongo();
    FriendRequests.findOne({_id: RequestId, To: UserId}, (err, doc) => {
        if(err){
            res.status(500).json({
                Message: "ERROR AT ACCEPTING FRIEND REQUEST",
                Success: false,
                err
            });
            DisconnectMongo();
            return
        }
        if(!doc) {
            res.status(500).json({
                Message: "ERROR AT ACCEPTING FRIEND REQUEST [FR DOES NOT EXIST]",
                Success: false,
                err
            });
            DisconnectMongo();
            return
        }
        const {To, From} = doc;

        Users.updateOne({_id: To}, {$push: {"Friends": From}}, (err, doc) => {
            if(err){
                res.status(500).json({
                    Message: "ERROR AT ADDING FRIENDS",
                    Success: false,
                    err
                });
                DisconnectMongo();
                return
            }

            Users.updateOne({_id: From}, {$push: {"Friends": To}}, (err, doc) => {
                if(err){
                    res.status(500).json({
                        Message: "ERROR AT ADDING FRIENDS",
                        Success: false,
                        err
                    });
                    DisconnectMongo();
                    return
                }

                

                FriendRequests.updateOne({_id: RequestId}, {Status: ACCEPTED}, (err, doc) => {
                    if(err){
                        res.status(500).json({
                            Message: "ERROR AT UPDATING FRIEND REQUEST STATUS",
                            Success: false,
                            err
                        });
                        DisconnectMongo();
                        return
                    }

                    res.status(201).json({
                        Message: "FRIEND REQUEST ACCEPTED AND FRIEND ADDED [BOTH SIDES]",
                        Success: true
                    })
                    
                    DisconnectMongo();
                })

            })

        })


    })
}

// ROUTE: /friend/reject/request
// BODY: {RequestId: Friend Request ID, UserId}
const RejectFriendRequest = async (req: Request, res: Response) => {
    const {RequestId, UserId} = req.body 
    await ConnectToMongo();
    const FR = await FriendRequests.findOne({_id: RequestId});

    if(FR && FR.Status === REJECTED){
        res.status(500).json({
            Message: "FRIEND REQUEST ALREADY REJECTED",
            Success: false,
        });
        DisconnectMongo();
        return
    }
    
    FriendRequests.updateOne({_id: RequestId, To: UserId}, {Status: REJECTED}, (err, doc) => {
        if(err){
            res.status(500).json({
                Message: "ERROR AT REJECTING (UPDATING) FRIEND REQUEST",
                Success: false,
                err
            });
            DisconnectMongo();
            return
        }

        if(!doc.modifiedCount){
            res.status(500).json({
                Message: "FRIEND REQUEST DO NOT EXIST TO CHANGE STATUS",
                Success: true,
                doc
            })  
        }

        res.status(201).json({
            Message: "FRIEND REQUEST REJECTED",
            Success: true,
            doc
        })
    })  
}



export default {
    SendFriendRequest,
    AcceptFriendRequest,
    RejectFriendRequest,
    GetFriendRequests
}