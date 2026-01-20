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

create_table() {
    local table_name=$1
    local partition_key=$2
    
    echo "Creating Table: $table_name..."
    aws dynamodb create-table \
        --table-name "$table_name" \
        --attribute-definitions AttributeName="$partition_key",AttributeType=S \
        --key-schema AttributeName="$partition_key",KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --tags $TAGS \
        --region "$REGION" > /dev/null
}

# 1. Tasks
create_table "sm-tasks" "id"

# 2. Notifications (Has GSI)
echo "Creating Table: sm-notifications..."
aws dynamodb create-table \
    --table-name "sm-notifications" \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=userId,AttributeType=S \
        AttributeName=createdAt,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"UserIdIndex\",
                \"KeySchema\": [{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"}
            }
        ]" \
    --billing-mode PAY_PER_REQUEST \
    --tags $TAGS \
    --region "$REGION" > /dev/null

# 3. Users
create_table "sm-users" "id"

# 4. Workspaces
create_table "sm-workspaces" "id"

# 5. Labels
create_table "sm-labels" "id"

# 6. Invitations
create_table "sm-invitations" "id"

# 7. Settings (PK: userId)
create_table "sm-settings" "userId"

# 8. Calendars (PK: userId)
create_table "sm-calendars" "userId"

echo "Done! All resources created."
