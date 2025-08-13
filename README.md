# HealthLink Connect

A comprehensive healthcare appointment and management system. This backend server handles user authentication, data management, and file uploads, providing a robust API for the frontend client.

## ✨ Features

- **RESTful API**: A well-structured API for managing health-related data.
- **Secure User Authentication**: Handles user registration and login using JSON Web Tokens (JWT).
- **Password Hashing**: Uses `bcryptjs` to securely hash and compare user passwords.
- **Request Validation**: Leverages `express-validator` to validate and sanitize incoming request data.
- **File Uploads**: Functionality to upload and manage files using `multer`.
- **Database Integration**: Uses `mongoose` to model and manage data in a MongoDB database.
- **Secure Configuration**: Manages environment variables using `dotenv`.
- **HTTP Request Logging**: Uses `morgan` for logging HTTP requests during development.

---

## 🛠️ Technologies Used

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web application framework for Node.js.
- **MongoDB**: NoSQL database for storing application data.
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB and Node.js.
- **jsonwebtoken**: For implementing user authentication.
- **bcryptjs**: For hashing passwords.
- **multer**: Middleware for handling `multipart/form-data`.
- **express-validator**: For request data validation.
- **dotenv**: For loading environment variables from a `.env` file.
- **morgan**: HTTP request logger middleware.
- **nodemon**: A tool that automatically restarts the server on file changes.

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v16 or newer recommended)
- MongoDB installed and running locally or a connection URI to a cloud instance (e.g., MongoDB Atlas).

### Installation & Setup

1.  **Clone the repository** (if it's on Git)
    ```bash
    git clone <your-repository-url>
    cd Health/Backend
    ```

2.  **Install NPM packages**
    ```bash
    npm install
    ```

3.  **Create a `.env` file**
    Create a file named `.env` in the root of the `Backend` directory. This file will hold your secret and environment-specific configurations. You can copy `.env.example` if one exists, or use the template below.

    ```env
    # Server Configuration
    PORT=3000

    # MongoDB Connection URI
    # Replace with your actual MongoDB connection string
    MONGODB_URI=mongodb://127.0.0.1:27017/healthlink-connect

    # JWT Secret Key
    # Use a long, random, and secret string for production
    JWT_SECRET=your_super_secret_and_long_jwt_key
    JWT_EXPIRES_IN=1d
    ```

---

## 🏃 Running the Application

The project includes scripts defined in `package.json` for running the application:

1.  **Development Mode**
    This command uses `nodemon` to start the server. It will automatically restart when you make changes to the code.
    ```bash
    npm run dev
    ```

2.  **Production Mode**
    This command runs the application using `node`.
    ```bash
    npm start
    ```

3.  **Seed the Database**
    This command runs a script to populate the database with initial data, which is useful for development and testing.
    ```bash
    npm run seed
    ```

---

## 📝 API Endpoints

*(This is a placeholder section. You should document your main API routes here.)*

-   **Auth Routes**
    -   `POST /api/auth/register` - Register a new user.
    -   `POST /api/auth/login` - Log in a user and get a JWT.
-   **User Routes**
    -   `GET /api/users/profile` - Get the profile of the logged-in user.
-   ...etc.
