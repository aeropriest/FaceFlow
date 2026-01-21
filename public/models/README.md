# Face Recognition Models

This directory contains the pre-trained models required for face recognition.

## Required Models

You need to download the following model files from the face-api.js repository:

### 1. SSD MobileNet V1 (Face Detection)
- `ssd_mobilenetv1_model-shard1` (4.2 MB)
- `ssd_mobilenetv1_model-shard2` (1.4 MB)
- `ssd_mobilenetv1_model-weights_manifest.json`

### 2. Face Landmark 68 Point Model
- `face_landmark_68_model-shard1` (357 KB)
- `face_landmark_68_model-weights_manifest.json`

### 3. Face Recognition Model
- `face_recognition_model-shard1` (4.2 MB)
- `face_recognition_model-shard2` (2.2 MB)
- `face_recognition_model-weights_manifest.json`

## How to Download

### Option 1: From GitHub Repository
Download from: https://github.com/vladmandic/face-api/tree/master/model

### Option 2: Using wget (if you have the source project)
```bash
# If you have access to /Users/ashokjaiswal/WhoMeWeb/public/models/
cp /Users/ashokjaiswal/WhoMeWeb/public/models/* /Users/ashokjaiswal/Downloads/FaceFlow/public/models/
```

### Option 3: Download via CDN (for testing)
The models will be loaded from CDN if local files are not found, but local files are recommended for production.

## Verification

After downloading, you should have 8 files total in this directory:
- 3 files for SSD MobileNet V1
- 2 files for Face Landmark 68
- 3 files for Face Recognition

Total size: ~12 MB
