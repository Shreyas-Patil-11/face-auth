# Face Recognition Authentication

## Overview
This project implements a face recognition authentication system using **Node.js**, **Express**, **MongoDB**, and **React**. It allows users to register and log in using facial recognition.

## Features
- **User Registration**: Users can register by capturing their face and storing an encrypted face descriptor.
- **Face Authentication**: Users can log in using their face, which is matched with the stored encrypted descriptor.
- **Secure Storage**: Face descriptors are encrypted before being stored in the database.
- **Real-time Face Detection**: Uses `face-api.js` to capture and recognize faces in real-time.

## Tech Stack
- **Frontend**: React, face-api.js, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Security**: AES-256-GCM encryption for face descriptors

## Installation

### Prerequisites
- Node.js & npm installed
- MongoDB running

### Steps to Run
1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/face-authentication.git
   cd face-authentication
   ```
2. **Backend Setup**
   ```bash
   cd server
   npm install
   ```
   - Create a `.env` file in the `server` folder and add:
     ```env
     MONGO_URI=your_mongo_connection_string
     ENCRYPTION_KEY=your_32_byte_hex_key
     PORT=5000
     ```
   - Start the backend server:
     ```bash
     node index.js
     ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   ```
   - Create a `.env` file in `client` and add:
     ```env
     VITE_SERVER_URL_REGISTER=http://localhost:5000/register
     VITE_SERVER_URL_LOGIN=http://localhost:5000/login
     ```
   - Start the frontend:
     ```bash
     npm run dev
     ```

## Usage
1. Open the frontend in your browser.
2. Start the camera and capture your face.
3. Register with a username.
4. Log in by capturing your face again.

## Future Enhancements
- Improve facial recognition accuracy.
- Allow users to delete or update their face data.
- Implement multi-factor authentication.
- Deploy the project to a cloud server.

## License
MIT License

