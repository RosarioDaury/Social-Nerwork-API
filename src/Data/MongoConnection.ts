import mongoose from "mongoose";

export const ConnectToMongo = async () => {
    try {
        console.log('CONNECTING TO MONGODB....')
        await mongoose.connect('mongodb://0.0.0.0:27017/SocialNetwork');
        console.log('[SUCCESS] CONNECTED TO MONGODB');
    } catch (error) {
        console.log('[ERROR] AT CONNECTING TO MONGO CLIENT');
    }   
}

export const DisconnectMongo = async () => {
    try {
        await mongoose.connection.close();
        console.log('[CLOSED] MONGO CONNECTION CLOSED');
    } catch (error) {
        console.log('[ERROR] ERROR AT CLOSING MONGO CONNECTION');
    }   
}
