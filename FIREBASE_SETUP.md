# Firebase Authentication Setup

This project now includes Firebase Authentication with email/password and Google sign-in support.

## Configuration

### 1. Environment Variables

The Firebase configuration is stored in `.env.local` at the project root. The following variables are already configured:

```
VITE_FIREBASE_API_KEY=AIzaSyCCNINQEW8Jb4i_TAvp2goqNhplMEUV0hs
VITE_FIREBASE_AUTH_DOMAIN=whome-c5ac3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=whome-c5ac3
VITE_FIREBASE_STORAGE_BUCKET=whome-c5ac3.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=796455732910
VITE_FIREBASE_APP_ID=1:796455732910:web:b9542151ca93f5def98f3f
VITE_FIREBASE_MEASUREMENT_ID=G-E0FNTB53B1
```

**Note:** These credentials are from your existing Firebase project (whome-c5ac3). Make sure to keep `.env.local` in your `.gitignore` file.

### 2. Firebase Console Setup

To enable authentication methods in your Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `whome-c5ac3`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable the following providers:
   - **Email/Password**: Click "Enable" and save
   - **Google**: Click "Enable", add your support email, and save

## Features Implemented

### Authentication Methods

1. **Email/Password Authentication**
   - Sign up with email, password, and display name
   - Sign in with existing credentials
   - Password validation (minimum 6 characters)

2. **Google Sign-In**
   - One-click authentication with Google account
   - Automatic profile information retrieval

3. **Legacy Authentication**
   - Face registration (existing feature)
   - Guest mode (existing feature)

### Components

- **`FirebaseLogin.tsx`**: Email/password login with Google sign-in option
- **`FirebaseSignup.tsx`**: User registration with email/password
- **`AuthContext.tsx`**: React context for authentication state management
- **`firebase.ts`**: Firebase configuration and initialization

### Authentication Flow

1. User sees the main login screen with three options:
   - Sign in with Email (Firebase)
   - Register with Face (existing feature)
   - Continue as Guest

2. Firebase login flow:
   - Click "Sign In with Email"
   - Choose to login or signup
   - Use email/password or Google sign-in
   - Automatically redirected to the app on success

3. User state is managed through:
   - Firebase Authentication for email/Google users
   - localStorage for face registration users
   - Session-only for guest users

## Usage

### Running the App

```bash
pnpm install
pnpm dev
```

The app will start on `http://localhost:3000`

### Authentication Context

The `AuthContext` provides the following methods:

```typescript
const {
  currentUser,      // Firebase User object or null
  loading,          // Authentication state loading
  signup,           // (email, password, displayName?) => Promise<void>
  login,            // (email, password) => Promise<void>
  logout,           // () => Promise<void>
  loginWithGoogle,  // () => Promise<void>
  resetPassword,    // (email) => Promise<void>
} = useAuth();
```

### Example: Using Authentication in Components

```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { currentUser, logout } = useAuth();

  if (currentUser) {
    return (
      <div>
        <p>Welcome, {currentUser.displayName || currentUser.email}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return <p>Please sign in</p>;
}
```

## Security Notes

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Firebase Rules**: Configure Firestore/Storage security rules in Firebase Console
3. **API Keys**: The Firebase API key in `.env.local` is safe to expose in client-side code (it's restricted by Firebase security rules)
4. **Production**: For production deployment, set environment variables in your hosting platform

## Troubleshooting

### "Firebase: Error (auth/popup-blocked)"
- Enable popups for your domain in browser settings
- Try using email/password authentication instead

### "Firebase: Error (auth/unauthorized-domain)"
- Add your domain to authorized domains in Firebase Console
- Go to Authentication → Settings → Authorized domains

### "Firebase: Error (auth/operation-not-allowed)"
- Enable the authentication method in Firebase Console
- Check Authentication → Sign-in method

## Next Steps

1. **Password Reset**: Implement password reset flow using `resetPassword()` method
2. **Email Verification**: Add email verification for new signups
3. **Profile Management**: Create user profile editing functionality
4. **Firestore Integration**: Store user data and orders in Firestore
5. **Social Auth**: Add more providers (Facebook, Twitter, etc.)

## Dependencies

- `firebase`: ^12.8.0 - Firebase SDK
- `@types/react`: ^19.2.9 - TypeScript types for React
- `@types/react-dom`: ^19.2.3 - TypeScript types for React DOM
