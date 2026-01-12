# Project Management App

A comprehensive project management solution featuring a React frontend and a modular Node.js backend with DynamoDB storage.

## 🏗 Structure

- **`app-web/`**: The frontend application built with React and Vite.
- **`backend/`**: The backend REST API built with Node.js, Express, and TypeScript.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- AWS Account (for DynamoDB and Cognito)

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    - Copy `.env.example` to `.env`.
    - Fill in `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, and AWS credentials/Region.
    - Review DynamoDB table names.
4.  Start the server:
    ```bash
    npm run dev
    ```

### Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd app-web
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    - Ensure `.env` points to your backend (default is `http://localhost:3001`).
    - Set `VITE_USE_MOCK_API=false`.
4.  Start the development server:
    ```bash
    npm run dev
    ```

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Vite, CSS Modules.
- **Backend**: Node.js, Express, TypeScript, AWS SDK v3.
- **Database**: AWS DynamoDB.
- **Authentication**: AWS Cognito.
