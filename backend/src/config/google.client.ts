import { google } from 'googleapis';

export const getGoogleAuthClient = (refreshToken?: string) => {
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
