# Denver E-Bike Navigator

This project is an application for e-bike riders in Denver to plan routes with custom speed calculations, check weather, find charging stations, and share their location with friends in real-time.

## Getting Started: From Web App to Android APK

This guide provides all the necessary steps to get your Firebase backend running and build a native Android application from this web project.

### Prerequisites

- [Node.js and npm](https://nodejs.org/en/download/) installed on your machine.
- [Android Studio](https://developer.android.com/studio) installed for building the native app.

---

### Step 1: Project Setup

First, open a terminal in the project's root directory and install the required dependencies defined in `package.json`.

```bash
npm install
```

---

### Step 2: Firebase Configuration

The application uses Firebase for authentication, database, and real-time features. The code is already written, but you must connect it to your own Firebase project.

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and follow the on-screen instructions to create a new project.

2.  **Create a Web App in Firebase:**
    *   Inside your new project, click the Web icon (`</>`) to add a new web application.
    *   Give it a nickname (e.g., "E-Bike Navigator Web") and register the app.
    *   Firebase will provide you with a `firebaseConfig` object. **Copy these credentials.**

3.  **Add Configuration to the Project:**
    *   Open the `services/firebase.ts` file in your code editor.
    *   Replace the placeholder values in the `firebaseConfig` object with the keys you copied from the Firebase console.

    **Example `services/firebase.ts`:**
    ```typescript
    // ... imports

    // BEFORE:
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
      // ... other placeholder keys
    };

    // AFTER (replace with your actual keys):
    const firebaseConfig = {
      apiKey: "AIzaSyB...rest_of_your_key",
      authDomain: "your-project-id.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project-id.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:abcdef123456"
    };

    // ... rest of the file
    ```

4.  **Enable Firebase Services:**
    *   In the Firebase Console, go to the **Authentication** section, click the "Sign-in method" tab, and enable the **Google** provider.
    *   Go to the **Firestore Database** section, click "Create database," start in **production mode**, and choose a location (e.g., `us-central`). This will enable the database for storing user and location data.

---

### Step 3: Build the Android App with Capacitor

Capacitor will take your web code and package it into a native Android project, which you can then open in Android Studio.

1.  **Initialize the Android Platform:**
    Run the following command in your terminal. This creates an `android` directory in your project, containing the native Android shell.

    ```bash
    npx cap add android
    ```

2.  **Sync Your Web Code:**
    This command copies your web assets (HTML, CSS, JavaScript, images) into the native Android project.

    ```bash
    npx cap sync
    ```
    *You should run this command anytime you make changes to your web code.*

3.  **Open in Android Studio:**
    This command will automatically open your project in Android Studio.

    ```bash
    npx cap open android
    ```

4.  **Build the APK in Android Studio:**
    *   Once the project is open and has finished indexing, go to the menu bar and select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
    *   Android Studio will build the application. When it's finished, a notification will appear with a link to locate the generated `.apk` file on your computer.

You can now install this APK on an Android device or emulator for testing.
