import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";

@Injectable()
export class EmailService {
    private async send(to: string, subject: string, text: string) {
        try {
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
                    to: [to],
                    subject,
                    text,
                }),
            });
            if (!response.ok) {
                console.error("Error sending email", await response.text());
            }
        } catch (e) {
            console.error("Error sending email", e);
        }
    }

    async sendVerificationEmail(user: User) {
        await this.send(
            user.email,
            "Verification code",
            `Hello ${user.name} Your verification code is ${user.activation_code}`,
        );
    }

    async sendResetPasswordEmail(user: User) {
        await this.send(
            user.email,
            "Verification code",
            `Hello ${user.name} Your reset password code is ${user.reset_password_code}`,
        );
    }
}
