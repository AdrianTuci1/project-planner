# Setup Guide

This project requires **AWS DynamoDB** tables for data storage. Below is the required schema configuration.

## DynamoDB Tables

You need to create the following tables in your AWS Region (default: `us-east-1`).

### 1. Settings Table
Stores user preferences and application settings.

- **Table Name**: `settings` (or as configured in `.env` `TABLE_SETTINGS`)
- **Partition Key (PK)**: `userId` (String)
- **Sort Key (SK)**: None

### 2. Groups Table
Stores project groups or categories.

- **Table Name**: `groups` (or as configured in `.env` `TABLE_GROUPS`)
- **Partition Key (PK)**: `id` (String)
- **Sort Key (SK)**: None

### 3. Tasks Table
Stores individual tasks and todo items.

- **Table Name**: `tasks` (or as configured in `.env` `TABLE_TASKS`)
- **Partition Key (PK)**: `id` (String)
- **Sort Key (SK)**: None
    - *Optional GSI*: You may want to add a Global Secondary Index on `startDate` (String) or `groupId` (String) for efficient querying in the future, although the current backend implementation uses `Scan`.

### 4. Labels Table
Stores tags/labels for tasks.

- **Table Name**: `labels` (or as configured in `.env` `TABLE_LABELS`)
- **Partition Key (PK)**: `id` (String)
- **Sort Key (SK)**: None

## Environment Variables

Ensure your `backend/.env` file matches your table names:

```ini
AWS_REGION=us-east-1

TABLE_GROUPS=groups
TABLE_TASKS=tasks
TABLE_LABELS=labels
TABLE_SETTINGS=settings
```

## Authentication

This project expects **AWS Cognito** for user authentication.

- **User Pool**: A User Pool is required.
- **App Client**: An App Client (without client secret for frontend usage) is required.

Update `backend/.env` with:
```ini
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1
```
