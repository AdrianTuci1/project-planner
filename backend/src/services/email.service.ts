import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { awsConfig } from "../config/aws.config";
import * as fs from 'fs';
import * as path from 'path';

export class EmailService {
    private sesClient: SESClient;
    private fromEmail: string;

    constructor() {
        this.sesClient = new SESClient({ region: awsConfig.region });
        this.fromEmail = awsConfig.ses.fromEmail;
    }

    async sendWelcomeEmail(toEmail: string, name: string) {
        try {
            const templatePath = path.join(__dirname, '../../templates/welcome.html');
            let htmlContent = fs.readFileSync(templatePath, 'utf-8');
            htmlContent = htmlContent.replace('{{name}}', name);

            const command = new SendEmailCommand({
                Source: this.fromEmail,
                Destination: {
                    ToAddresses: [toEmail]
                },
                Message: {
                    Subject: {
                        Data: "Welcome to Simplu - Let's get started!"
                    },
                    Body: {
                        Html: {
                            Data: htmlContent
                        },
                        Text: {
                            Data: `Welcome on board, ${name}!\n\nWe are thrilled to have you join Simplu.\nGet ready to boost your productivity.\n\nBest,\nThe Simplu Team`
                        }
                    }
                }
            });

            const response = await this.sesClient.send(command);
            console.log(`[EmailService] Welcome email sent to ${toEmail}. MessageId: ${response.MessageId}`);
            return response;
        } catch (error) {
            console.error(`[EmailService] Failed to send email to ${toEmail}`, error);
            // Don't throw to avoid blocking user flow, just log
        }
    }

    async sendPasswordResetEmail(toEmail: string, tempPassword: string) {
        try {
            const command = new SendEmailCommand({
                Source: this.fromEmail,
                Destination: { ToAddresses: [toEmail] },
                Message: {
                    Subject: { Data: "Password Reset Request - Simplu" },
                    Body: {
                        Html: {
                            Data: `
                                <h1>Password Reset</h1>
                                <p>You requested a password reset. Here is your temporary password:</p>
                                <h2>${tempPassword}</h2>
                                <p>Please log in and change your password immediately.</p>
                            `
                        },
                        Text: { Data: `Password Reset\n\nTemporary Password: ${tempPassword}\n\nPlease log in and change it immediately.` }
                    }
                }
            });
            await this.sesClient.send(command);
            console.log(`[EmailService] Reset email sent to ${toEmail}`);
        } catch (error) {
            console.error(`[EmailService] Failed to send reset email to ${toEmail}`, error);
        }
    }
}
