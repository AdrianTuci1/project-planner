import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export class DBClient {
    private static instance: DynamoDBDocumentClient;

    private constructor() { }

    public static getInstance(): DynamoDBDocumentClient {
        if (!DBClient.instance) {
            const client = new DynamoDBClient({
                region: process.env.AWS_REGION || "us-east-1",
            });
            DBClient.instance = DynamoDBDocumentClient.from(client, {
                marshallOptions: {
                    removeUndefinedValues: true
                }
            });
        }
        return DBClient.instance;
    }
}
