import * as faceapi from '@vladmandic/face-api';
import type { User } from './userService';

let modelsLoaded = false;

export async function loadFaceRecognitionModels(): Promise<void> {
  if (modelsLoaded) return;

  try {
    const MODEL_URL = '/models';
    
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
    console.log('Face recognition models loaded successfully');
  } catch (error) {
    console.error('Failed to load face recognition models:', error);
    throw new Error('Failed to load face recognition models');
  }
}

export async function detectSingleFace(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
  if (!modelsLoaded) {
    await loadFaceRecognitionModels();
  }

  return await faceapi
    .detectSingleFace(input)
    .withFaceLandmarks()
    .withFaceDescriptor();
}

export async function detectAllFaces(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
  if (!modelsLoaded) {
    await loadFaceRecognitionModels();
  }

  return await faceapi
    .detectAllFaces(input)
    .withFaceLandmarks()
    .withFaceDescriptors();
}

export function getFaceDescriptor(detection: faceapi.WithFaceDescriptor<any>): Float32Array {
  return detection.descriptor;
}

export function compareFaceDescriptors(
  descriptor1: Float32Array,
  descriptor2: Float32Array
): number {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  return 1 - distance;
}

export function descriptorToString(descriptor: Float32Array): string {
  return JSON.stringify(Array.from(descriptor));
}

export function stringToDescriptor(str: string): Float32Array {
  return new Float32Array(JSON.parse(str));
}

export async function captureFaceImage(video: HTMLVideoElement): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
}

export async function recognizeFace(
  videoElement: HTMLVideoElement,
  users: User[]
): Promise<User | null> {
  try {
    const detection = await detectSingleFace(videoElement);
    
    if (!detection) {
      return null;
    }

    const currentDescriptor = getFaceDescriptor(detection);
    const RECOGNITION_THRESHOLD = 0.6;

    let bestMatch: User | null = null;
    let bestSimilarity = 0;

    for (const user of users) {
      try {
        const storedDescriptor = stringToDescriptor(user.faceData);
        const similarity = compareFaceDescriptors(currentDescriptor, storedDescriptor);

        if (similarity > bestSimilarity && similarity > RECOGNITION_THRESHOLD) {
          bestSimilarity = similarity;
          bestMatch = user;
        }
      } catch (error) {
        console.error(`Error comparing with user ${user.name}:`, error);
      }
    }

    if (bestMatch) {
      console.log(`Recognized: ${bestMatch.name} (${(bestSimilarity * 100).toFixed(1)}% match)`);
    }

    return bestMatch;
  } catch (error) {
    console.error('Error in face recognition:', error);
    return null;
  }
}

export function isModelsLoaded(): boolean {
  return modelsLoaded;
}
