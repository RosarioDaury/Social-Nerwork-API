import { Users } from "../Data/Models/Users";
import { Post } from "../Data/Models/Post";

import { ConnectToMongo, DisconnectMongo } from "../Data/MongoConnection";
import { Response, Request } from "express";
import bcrypt from 'bcrypt';
import * as dotenv from "dotenv";
import * as jwt from 'jsonwebtoken';
import Mailer from "../Services/MailSender";

dotenv.config({ path: __dirname +'/.env' });


// Route: /users
const GetAllUsers = async (req: Request, res: Response) => {
    await ConnectToMongo() 
    Users.find(async (err, docs) => {
        if(err){
            res.status(500).send('ERROR AT FIND USERS');
            DisconnectMongo();
            return;
        }
        await res.status(200).json(docs);
        DisconnectMongo();
    })
    
}

// ROUTE:/user/auth                
// BODY: {Username, Password}
const AuthUser = async (req: Request, res: Response) => {
    const {Username, Password} = req.body;
    //CONNECT TO MONGO CLIENT AT FIRST
    await ConnectToMongo();

    Users.findOne({Username: Username}, async (err: any, doc: any) => {
        if(err){
            res.status(500).send('ERROR AT FIND USERS');
            //DISCONNECT FROM MONGO CLIENT
            DisconnectMongo();
            return;
        }

        // CHECK IS THERE IS AN USER FIRST
        if(doc){
            //CHECK IS THE PASSWORD MATCH
            bcrypt.compare(Password, doc.Password, async (err, result) => {
                if(err) {
                    await res.status(500).json({
                        Auth: false,
                        Message: 'ERROR AT AUTHENTICATING',
                        err
                    });
                    return;
                }

                if(result){
                    await res.status(202).json({
                        Auth: true,
                        Message: "AUTHENTICATED",
                        UserId: doc._id
                    });
                }else {
                    //INCORRECT PASSWORD
                    await res.status(404).json({
                        Auth: false,
                        Message: "INCORRECT PASSWORD"
                    });
                }

            })
        }else{
            //USER DOESNT EVEN EXIST HERE
            await res.status(404).json({
                Auth: false,
                Message: "USER DOES NOT EXIST"
            }); 
            
        }
        
        //DISCONNECT FROM MONGO CLIENT
        DisconnectMongo();
    })  
}

// ROUTE: /user/create
// BODY: {firstName, lastName, Username, Password, Email}
const CreateUser = async (req: Request, res: Response) => {
    const {firstName, lastName, Username, Password, Email} = req.body;
    await ConnectToMongo();
    if(!Password){
        res.status(500).json({
            Message: "PASSWORD IS REQUIRED",
            Success: false
        })
        DisconnectMongo(); 
        return
    }
    const pass = bcrypt.hashSync(Password, 10);
    const newUser = new Users({Name: {firstName, lastName}, Username, Email, Password: pass});

    const Validation =  newUser.validateSync();

    if(Validation){
        res.status(500).json({
            Validation
        })
        DisconnectMongo(); 
    }else{
        Users.findOne({Username: Username}, (err, doc) => {
            if(err) {
                res.status(500).json({
                    Error: true,
                    Message: "ERROR AT CHECKING IF USERNAME ALREADY EXIST",
                    Success: false
                })
            }

            if(doc){
                res.status(500).json({
                    Error: true,
                    Message: "USERNAME ALREADY EXIST",
                    Success: false
                })
                DisconnectMongo();
                return;
            }

            newUser.save( async (err) => {
                if(err) {
                    res.status(500).json({
                        Message: "ERROR AT CREATING NEW USE, MIGHT HAVE TO CHECK SCHEMA",
                        Success: false,
                        err
                    });
                    DisconnectMongo();
                    return
                }
                res.status(201).json({
                    Message: "NEW USER SUCCESFULLY CREATED",
                    Success: true
                })
                DisconnectMongo();
            }) 
        })
        
    }

}

// ROUTE: /forgotpassword
// BODY: {Username}
const ForgotPassword = async (req: Request, res: Response) => {
    const {Username} = req.body;

    await ConnectToMongo();

    Users.findOne({Username: Username}, async (err, doc) => {
        if(err) {
            res.status(500).send('ERROR AT FIND USER TO RESET PASS');
            DisconnectMongo();
            return;
        }

        if(doc){
            const token = await jwt.sign({doc}, String(process.env.SECRETKEY), {expiresIn: "1000s"})
            const MailService = new Mailer();

            MailService.SendEmail({   
                message:`<h2>CLICK HERE TO CHANGE YOUR PASSWORD <a href="http://localhost:3000/resetpassword?token=${token}">CLICK</a></h2>`, 
                to: doc.Email
            })

            res.status(202).json({
                Url: `http://localhost:3000/resetpassword?token=${token}`,
                Success: true
            });
        }else{
            res.status(404).json({
                Message: "THERE IS NOT EMAIL WITH THIS USER RELATED",
                Success: false
            })
        }

        DisconnectMongo();

    })

    
}

// ROUTE: /resetpassword
// QUERY VALUE: {Token}, BODY: {newPassword}
const ResetPassword = async (req: Request, res: Response) => {
    const {token} = req.query; 
    const {newPassword} = req.body;
    // MailService.SendEmail();
    jwt.verify(String(token), String(process.env.SECRETKEY), async (err, data: any ) => {
        if(err) {
            console.log(err);
            res.status(504).json({
                message: "ERROR READING TOKEN",
                err
            });
            return;
        }

        await ConnectToMongo();
        const pass = bcrypt.hashSync(newPassword, 10);
        await Users.updateOne({Username: data.doc.Username}, {Password: pass}, async (err, doc) => {
            if(err){
                console.log('[ERROR] AT FINDING USER TO UPDATE', err);
                res.status(504).json({
                    message: "FINDING USER TO UPDATE",
                    err
                });
                DisconnectMongo();
                return;
            }

            res.status(202).json({
                message: "USER'S PASSWORD CHANGED",
                user: data,
                doc
            })
        }).clone();

        DisconnectMongo(); 
    })

}

// ROUTE: /user/delete
// BODY: {User: UserId}
// DELETING USER AND ALL POST RELATED WITH THE USER
const DeleteUser = async (req: Request, res: Response) => {
    const {User} = req.body

    await ConnectToMongo();

    Post.deleteMany({User: User}, async (err) => {
        if(err){
            res.status(500).json({
                Message: "ERROR AT DELETING POSTS RELATED WITH THIS USER",
                Success: false,
                err
            });
            DisconnectMongo();
            return
        }

        Users.deleteOne({_id: User}, async (err) => {
            if(err){
                res.status(500).json({
                    Message: "ERROR AT DELETING USER",
                    Success: false,
                    err
                });
                DisconnectMongo();
                return
            }

            res.status(201).json({
                Message: "USER DELETED AND ALL POST RELATED WITH IT",
                Success: false,
                UserId: User
            });
            DisconnectMongo();
        })
    })

}




export default {
    GetAllUsers,
    AuthUser,
    CreateUser,
    ForgotPassword,
    ResetPassword,
    DeleteUser
}