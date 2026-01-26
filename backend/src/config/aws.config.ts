export const awsConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    cognito: {
        userPoolId: process.env.COGNITO_USER_POOL_ID || '',
        clientId: process.env.COGNITO_CLIENT_ID || ''
    },
    ses: {
        fromEmail: process.env.SES_FROM_EMAIL || 'no-reply@simplu-debug.com'
    }
};
