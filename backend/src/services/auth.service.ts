import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    InitiateAuthCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { UserService } from "./user.service";
import { EmailService } from "./email.service";
import { awsConfig } from "../config/aws.config";

export class AuthService {
    private client: CognitoIdentityProviderClient;
    private userPoolId: string;
    private clientId: string;
    private userService: UserService;
    private emailService: EmailService;

    constructor() {
        this.client = new CognitoIdentityProviderClient({ region: awsConfig.region });
        this.userPoolId = awsConfig.cognito.userPoolId;
        this.clientId = awsConfig.cognito.clientId;
        this.userService = new UserService();
        this.emailService = new EmailService();

        if (!this.userPoolId || !this.clientId) {
            console.warn("[AuthService] COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID is missing from env!");
        }
    }

    async register(email: string, password: string, name: string, onboarding: any) {
        try {
            console.log(`[AuthService] Registering user: ${email}`);

            // 1. Create User (AdminCreateUser)
            // MessageAction: SUPPRESS prevents sending the default confirmation code email
            const createCommand = new AdminCreateUserCommand({
                UserPoolId: this.userPoolId,
                Username: email,
                UserAttributes: [
                    { Name: "email", Value: email },
                    { Name: "name", Value: name },
                    { Name: "email_verified", Value: "true" } // Auto-verify email
                ],
                MessageAction: "SUPPRESS"
            });

            const createUserResponse = await this.client.send(createCommand);
            const sub = createUserResponse.User?.Attributes?.find(a => a.Name === 'sub')?.Value;

            if (!sub) {
                throw new Error("Failed to retrieve user ID (sub) from Cognito");
            }

            // 2. Set Password & Confirm User (AdminSetUserPassword)
            // Permanent: true marks the status as CONFIRMED
            const setPasswordCommand = new AdminSetUserPasswordCommand({
                UserPoolId: this.userPoolId,
                Username: email,
                Password: password,
                Permanent: true
            });

            await this.client.send(setPasswordCommand);

            // 3. Login to get tokens (InitiateAuth)
            const loginCommand = new InitiateAuthCommand({
                AuthFlow: "USER_PASSWORD_AUTH",
                ClientId: this.clientId,
                AuthParameters: {
                    USERNAME: email,
                    PASSWORD: password
                }
            });

            const authResponse = await this.client.send(loginCommand);
            const tokens = {
                AccessToken: authResponse.AuthenticationResult?.AccessToken,
                RefreshToken: authResponse.AuthenticationResult?.RefreshToken,
                IdToken: authResponse.AuthenticationResult?.IdToken,
                ExpiresIn: authResponse.AuthenticationResult?.ExpiresIn
            };

            // 4. Sync User Data & Send Welcome Email
            await this.userService.syncUser(sub, email, name, onboarding);

            return {
                tokens,
                user: {
                    sub,
                    email,
                    name,
                    ...onboarding
                }
            };

        } catch (error: any) {
            console.error("[AuthService] Registration failed", error);
            throw error;
        }
    }

    async resetPassword(email: string) {
        try {
            console.log(`[AuthService] Resetting password for: ${email}`);

            // Generate random temp password
            const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!1`;

            // Set temporary password (Permanent=false forces change on next login)
            const command = new AdminSetUserPasswordCommand({
                UserPoolId: this.userPoolId,
                Username: email,
                Password: tempPassword,
                Permanent: false
            });

            await this.client.send(command);

            // Send email
            await this.emailService.sendPasswordResetEmail(email, tempPassword);

            return { message: "Password reset email sent" };
        } catch (error: any) {
            console.error("[AuthService] Password reset failed", error);
            throw error;
        }
    }
}
