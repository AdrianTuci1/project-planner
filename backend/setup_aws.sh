#!/bin/bash

# Configuration
REGION="eu-central-1"
bucket_name="sm-productivity-bucket"
TAGS="Key=Project,Value=ManagementApp Key=Environment,Value=Dev"

echo "Creating resources in region: $REGION"
echo "Bucket Name: $bucket_name"

# --- S3 Bucket ---
echo "Creating S3 Bucket..."
aws s3api create-bucket \
    --bucket "$bucket_name" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"

echo "Applying CORS policy..."
aws s3api put-bucket-cors --bucket "$bucket_name" --cors-configuration file://cors.json

echo "Tagging Bucket..."
aws s3api put-bucket-tagging --bucket "$bucket_name" --tagging "TagSet=[{Key=Project,Value=ManagementApp},{Key=Environment,Value=Dev}]"


# --- DynamoDB Tables ---

echo "Creating Table: sm-single-table..."
aws dynamodb create-table \
    --table-name "sm-single-table" \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=userId,AttributeType=S \
        AttributeName=createdAt,AttributeType=S \
        AttributeName=workspaceId,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"UserIdIndex\",
                \"KeySchema\": [{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"}
            },
            {
                \"IndexName\": \"WorkspaceIndex\",
                \"KeySchema\": [{\"AttributeName\":\"workspaceId\",\"KeyType\":\"HASH\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"}
            }
        ]" \
    --billing-mode PAY_PER_REQUEST \
    --tags $TAGS \
    --region "$REGION" > /dev/null

echo "Done! All resources created."
