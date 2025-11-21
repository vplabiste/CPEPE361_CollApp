# COLLAPP: College Application Platform

COLLAPP is a comprehensive web platform designed to streamline the college application process for students, school representatives, and administrators.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI**: React, ShadCN UI, Tailwind CSS
- **Backend Services**: Firebase (Authentication, Firestore), Cloudinary (File Storage)
- **Form Management**: React Hook Form with Zod for validation

---

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

- **[Node.js](https://nodejs.org/)**: Version 20.x or newer is recommended. Installing Node.js will also install `npm`.
- **[A code editor](https://code.visualstudio.com/)**: Visual Studio Code is highly recommended.

---

## Getting Started

Follow these steps to set up and run the project on your local machine.

### 1. Clone the Repository

First, clone the project repository to your local machine using git:

```bash
git clone <your-repository-url>
cd collapp
```

### 2. Install Dependencies

Once you are in the project directory, install all the necessary dependencies using `npm`:

```bash
npm install
```

### 3. Set Up Environment Variables

This project requires credentials for Firebase and Cloudinary to function correctly.

1.  Create a new file named `.env.local` in the root of your project.
2.  Copy the contents of the example below into your new `.env.local` file.
3.  Replace the placeholder values (`your_...`) with your actual credentials from your Firebase and Cloudinary accounts.

```env
# .env.local

# Firebase Public Variables (for client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Firebase Admin Variables (for server-side actions)
# You get these from your Firebase project's service account settings
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_client_email
FIREBASE_PRIVATE_KEY=your_firebase_service_account_private_key

# Cloudinary Variables (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Important**: The `FIREBASE_PRIVATE_KEY` often contains newline characters. When you copy it into the `.env.local` file, make sure it is enclosed in double quotes (`"`) to preserve the formatting, like this:
`FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

### 4. Run the Development Server

Now you are ready to start the local development server:

```bash
npm run dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

- `npm run dev`: Starts the application in development mode.
- `npm run build`: Creates an optimized production build of the application.
- `npm run start`: Starts the application in production mode (requires a build first).
- `npm run lint`: Runs the linter to check for code quality issues.
- `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
