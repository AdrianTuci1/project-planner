import { google } from 'googleapis';

export const getGoogleAuthClient = (refreshToken?: string) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
        console.error("Missing Google Auth Environment Variables!");
        console.error("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Set" : "Missing");
        console.error("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Missing");
        console.error("GOOGLE_REDIRECT_URI:", process.env.GOOGLE_REDIRECT_URI ? "Set" : "Missing");
        throw new Error("Google Auth Config Missing. Check your backend .env file.");
    }

    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    if (refreshToken) {
        oAuth2Client.setCredentials({ refresh_token: refreshToken });
    }

    return oAuth2Client;
};
