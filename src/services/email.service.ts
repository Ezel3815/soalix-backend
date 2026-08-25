import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";

@Injectable()
export class EmailService {
    constructor(private mailService: MailerService) {}

    async sendVerificationEmail(user: User) {
        try {
            await this.mailService.sendMail({
                from: "flash-cards@gmail.com",
                to: user.email,
                subject: "Verification code",
                text: `Hello ${user.name} Your verification code is ${user.activation_code}`,
            });
        } catch (e) {
            console.error("Error sending email", e);
        }
    }

    async sendResetPasswordEmail(user: User) {
        try {
            await this.mailService.sendMail({
                from: "flash-cards@gmail.com",
                to: user.email,
                subject: "Verification code",
                text: `Hello ${user.name} Your reset password code is ${user.reset_password_code}`,
            });
        } catch (e) {
            console.error("Error sending email", e);
        }
    }
}
