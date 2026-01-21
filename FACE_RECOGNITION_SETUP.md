# Face Recognition Setup - FaceFlow

## Overview

FaceFlow now includes face recognition as the **default authentication method**. When the app opens, the camera automatically starts to scan and recognize users' faces. This provides a seamless, touchless login experience.

## Features Implemented

### 1. **Automatic Face Login (Default)**
- Camera starts automatically when app opens
- Scans for faces every 2 seconds
- Recognizes registered users with 60% similarity threshold
- After 10 failed attempts, redirects to registration
- Users can skip to other login methods

### 2. **Face Registration**
- Captures face during registration
- Extracts 128-dimensional face descriptor
- Stores descriptor in Firebase Firestore
- Captures face image for profile

### 3. **Multiple Authentication Options**
- **Face Recognition** (Default)
- Email/Password (Firebase Auth)
- Google Sign-In
- Face Registration
- Guest Mode

## Architecture

### Core Files

#### Face Recognition Library
**File:** `src/lib/faceRecognition.ts`

**Functions:**
- `loadFaceRecognitionModels()` - Loads pre-trained models
- `detectSingleFace(video)` - Detects one face in video stream
- `recognizeFace(video, users)` - Matches face against registered users
- `captureFaceImage(video)` - Captures face image from video
- `descriptorToString()` / `stringToDescriptor()` - Converts descriptors for storage

**Recognition Threshold:** 0.6 (60% similarity)

#### User Service
**File:** `src/lib/userService.ts`

**Functions:**
- `registerUser(userData)` - Stores user with face descriptor in Firestore
- `getAllUsers()` - Retrieves all registered users
- `findUserByEmail(email)` - Finds specific user
- `updateUserLastGreeted(userId)` - Updates last login timestamp

**User Data Structure:**
```typescript
interface User {
  id?: string;
  name: string;
  email: string;
  phone: string;
  faceData: string;              // 128-dim descriptor as JSON string
  faceImageUrl?: string;          // Base64 image
  registeredAt: Timestamp;
  lastGreeted?: Timestamp;
}
```

### Components

#### FaceLogin Component
**File:** `src/components/FaceLogin.tsx`

**Features:**
- Auto-starts camera on mount
- Loads all registered users from Firestore
- Scans every 2 seconds (configurable)
- Shows progress indicator (attempts/max attempts)
- Provides skip and register options
- Displays helpful tips for best results

**Flow:**
1. Initialize camera and load models
2. Load registered users from Firestore
3. Start scanning loop (2-second interval)
4. On recognition: authenticate user
5. After 10 failed attempts: redirect to registration

#### FaceRegistration Component
**File:** `src/components/FaceRegistration.tsx`

**Features:**
- Captures face using camera
- Detects face and extracts descriptor
- Stores face data in Firestore
- Collects user information (name, email, phone)
- Option to skip face capture

**Flow:**
1. Start camera
2. User positions face in frame
3. Capture and process face
4. Extract 128-dimensional descriptor
5. Collect user details
6. Store in Firestore

### Models

**Location:** `public/models/`

**Required Files (8 total, ~12 MB):**
- `ssd_mobilenetv1_model-shard1` (4.2 MB)
- `ssd_mobilenetv1_model-shard2` (1.4 MB)
- `ssd_mobilenetv1_model-weights_manifest.json`
- `face_landmark_68_model-shard1` (357 KB)
- `face_landmark_68_model-weights_manifest.json`
- `face_recognition_model-shard1` (4.2 MB)
- `face_recognition_model-shard2` (2.2 MB)
- `face_recognition_model-weights_manifest.json`

**Status:** ✅ Models copied from WhoMeWeb project

## Configuration

### Environment Variables

Already configured in `.env.local`:
```
VITE_FIREBASE_API_KEY=AIzaSyCCNINQEW8Jb4i_TAvp2goqNhplMEUV0hs
VITE_FIREBASE_AUTH_DOMAIN=whome-c5ac3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=whome-c5ac3
VITE_FIREBASE_STORAGE_BUCKET=whome-c5ac3.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=796455732910
VITE_FIREBASE_APP_ID=1:796455732910:web:b9542151ca93f5def98f3f
VITE_FIREBASE_MEASUREMENT_ID=G-E0FNTB53B1
```

### Firebase Firestore Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `whome-c5ac3`
3. Navigate to **Firestore Database**
4. Create collection: `users`
5. Set security rules (example):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;  // Allow reading for face recognition
      allow write: if request.auth != null;  // Require auth for writes
    }
  }
}
```

## Usage

### Running the Application

```bash
# Install dependencies (if not already done)
pnpm install

# Start development server
pnpm dev
```

The app will open at `http://localhost:3000`

### User Flow

#### First Time User:
1. App opens → Camera starts automatically
2. No face recognized after 10 attempts
3. Redirected to registration
4. Capture face and enter details
5. User registered in Firestore
6. Redirected to app

#### Returning User:
1. App opens → Camera starts automatically
2. Face recognized within seconds
3. Automatically logged in
4. Access to personalized features

#### Alternative Login:
1. App opens → Camera starts
2. Click "Use Other Login Methods"
3. Choose from:
   - Email/Password
   - Google Sign-In
   - Face Registration
   - Guest Mode

## Performance Tuning

### Scan Interval

**Current Setting:** 2000ms (2 seconds)

**To Adjust:**
Edit `src/components/FaceLogin.tsx`:
```typescript
const SCAN_INTERVAL = 2000; // Change this value

// Faster (more CPU usage)
const SCAN_INTERVAL = 1000;

// Slower (less CPU usage)
const SCAN_INTERVAL = 3000;
```

### Recognition Threshold

**Current Setting:** 0.6 (60% similarity)

**To Adjust:**
Edit `src/lib/faceRecognition.ts`:
```typescript
const RECOGNITION_THRESHOLD = 0.6; // Change this value

// More strict (fewer false positives)
const RECOGNITION_THRESHOLD = 0.7;

// More lenient (more false positives)
const RECOGNITION_THRESHOLD = 0.5;
```

### Max Scan Attempts

**Current Setting:** 10 attempts

**To Adjust:**
Edit `src/components/FaceLogin.tsx`:
```typescript
const MAX_SCAN_ATTEMPTS = 10; // Change this value
```

## Best Practices for Users

### For Best Recognition Results:

1. **Lighting:** Ensure good, even lighting on your face
2. **Position:** Face the camera directly, 1-2 feet away
3. **Expression:** Keep a neutral expression
4. **Stability:** Hold still during scanning
5. **Glasses:** Remove if recognition fails
6. **Background:** Use a simple, uncluttered background

### For Registration:

1. Use the same lighting conditions you'll use for login
2. Face the camera directly
3. Ensure your entire face is visible
4. Don't wear hats or sunglasses
5. Use a neutral expression

## Troubleshooting

### Camera Not Starting

**Issue:** Camera doesn't start when app opens

**Solutions:**
- Grant camera permissions in browser
- Check if another app is using the camera
- Try a different browser
- Ensure HTTPS (required for camera access)

### No Face Detected

**Issue:** "No face detected" error during registration

**Solutions:**
- Improve lighting conditions
- Move closer to camera (1-2 feet)
- Face camera directly
- Remove glasses/hat
- Ensure face is fully visible

### Face Not Recognized

**Issue:** Registered user not recognized

**Solutions:**
- Use similar lighting as during registration
- Face camera at same angle as registration
- Re-register with better quality image
- Lower recognition threshold (not recommended)

### Models Not Loading

**Issue:** "Failed to load face recognition models"

**Solutions:**
- Check that all 8 model files exist in `public/models/`
- Clear browser cache
- Check browser console for 404 errors
- Verify file permissions

### Firebase Errors

**Issue:** "Permission denied" or Firestore errors

**Solutions:**
- Check Firebase security rules
- Verify environment variables in `.env.local`
- Ensure Firestore is enabled in Firebase Console
- Check network connectivity

## Security Considerations

### Data Privacy

1. **Face Descriptors:** Only 128-dimensional vectors are stored, not actual images
2. **Face Images:** Stored as Base64 strings (optional, can be disabled)
3. **Encryption:** All data transmitted over HTTPS
4. **Firebase:** Data stored in secure Firestore database

### Security Best Practices

1. **Threshold:** 60% similarity balances security vs. usability
2. **Firestore Rules:** Restrict write access to authenticated users
3. **HTTPS:** Required for camera access in production
4. **Rate Limiting:** Consider implementing to prevent abuse
5. **Audit Logs:** Track login attempts in production

## Dependencies

```json
{
  "@vladmandic/face-api": "^1.7.15",
  "@tensorflow/tfjs": "^4.22.0",
  "firebase": "^12.8.0"
}
```

## API Reference

### Face Recognition Functions

```typescript
// Load models (call once at startup)
await loadFaceRecognitionModels();

// Detect face in video
const detection = await detectSingleFace(videoElement);

// Get face descriptor
const descriptor = getFaceDescriptor(detection);

// Compare two descriptors
const similarity = compareFaceDescriptors(descriptor1, descriptor2);

// Recognize face against user database
const user = await recognizeFace(videoElement, users);

// Capture face image
const imageUrl = await captureFaceImage(videoElement);
```

### User Service Functions

```typescript
// Register new user
const userId = await registerUser({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  faceData: descriptorString,
  faceImageUrl: imageBase64,
});

// Get all users
const users = await getAllUsers();

// Find user by email
const user = await findUserByEmail('john@example.com');

// Update last greeted timestamp
await updateUserLastGreeted(userId);
```

## Testing Checklist

- [ ] Camera starts automatically on app load
- [ ] Face recognition works for registered users
- [ ] Registration captures and stores face data
- [ ] Can skip to other login methods
- [ ] Redirects to registration after 10 failed attempts
- [ ] Firebase/Email login still works
- [ ] Google sign-in still works
- [ ] Guest mode still works
- [ ] Face data stored in Firestore
- [ ] User can be recognized after registration

## Future Enhancements

1. **Multi-face Detection:** Recognize multiple people simultaneously
2. **Liveness Detection:** Prevent photo spoofing
3. **Face Tracking:** Continuous tracking during use
4. **Emotion Detection:** Detect user mood
5. **Age/Gender Estimation:** Additional user insights
6. **Performance Optimization:** WebGL acceleration
7. **Offline Support:** Local model caching
8. **Analytics:** Track recognition success rates

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Verify Firebase configuration
4. Check model files are present
5. Test camera permissions

## Resources

- **face-api.js:** https://github.com/vladmandic/face-api
- **TensorFlow.js:** https://www.tensorflow.org/js
- **Firebase:** https://firebase.google.com/docs
- **Vite:** https://vitejs.dev/

---

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Project:** FaceFlow Coffee Shop POS
