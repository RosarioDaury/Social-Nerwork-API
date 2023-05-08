import nodeMailer from 'nodemailer';
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname +'/.env' });


export default class Mailer {
    transporter: nodeMailer.SentMessageInfo;
    
    constructor() {
        
        this.transporter = nodeMailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            auth: {
                user: process.env.USERNAME,
                pass: process.env.PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        })
    }

    SendEmail(options) {
        this.transporter.sendMail({
            from: 'dauryjoserosariocaba@gmail.com',
            to: options.to,
            subject: 'Reset Your Password',
            html: options.message
        }, (err, info) => {
            if(err) {
                console.log(err);
                return
            }
            console.log(info.envelope);
            console.log(info.messageId);
        });
    }
}