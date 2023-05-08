import { model, Schema, Types } from "mongoose";

interface Name {
    firstName: string,
    lastName: string
}

export interface IUser {
    Name: Name,
    Username: string,
    Email: string,
    Password: string,
    Friends: Array<String>,
}

const UserNameSchema = new Schema<Name>({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true}
})

const UserSchema = new Schema<IUser>({
    Name: {type: UserNameSchema, required: true},
    Username: {type: String, required: true},
    Email: { type: String, required: true},
    Password: { type: String, required: true},
    Friends: { type: [String], default: []}
}, {strict: true})  

export const Users= model<IUser>('users', UserSchema);
