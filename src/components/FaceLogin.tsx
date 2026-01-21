import { useState, useEffect, useRef } from 'react';
import { Camera, Loader2, AlertCircle, UserCheck } from 'lucide-react';
import { loadFaceRecognitionModels, recognizeFace } from '../lib/faceRecognition';
import { getAllUsers, User } from '../lib/userService';

interface FaceLoginProps {
  onSuccess: (user: User) => void;
  onRegisterRedirect: () => void;
  onSkip: () => void;
}

export function FaceLogin({ onSuccess, onRegisterRedirect, onSkip }: FaceLoginProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [scanStatus, setStatus] = useState<string>('Initializing camera...');
  const [scanAttempts, setScanAttempts] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_SCAN_ATTEMPTS = 10;
  const SCAN_INTERVAL = 2000;

  useEffect(() => {
    initializeFaceRecognition();

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const initializeFaceRecognition = async () => {
    try {
      setStatus('Loading face recognition models...');
      await loadFaceRecognitionModels();

      setStatus('Loading registered users...');
      const allUsers = await getAllUsers();
      setUsers(allUsers);

      if (allUsers.length === 0) {
        setError('No registered users found. Please register first.');
        setIsLoading(false);
        setTimeout(() => {
          onRegisterRedirect();
        }, 2000);
        return;
      }

      setStatus('Starting camera...');
      await startCamera();

      setStatus('Ready to scan. Please look at the camera...');
      setIsLoading(false);

      startScanning();
    } catch (err: any) {
      console.error('Initialization error:', err);
      setError(err.message || 'Failed to initialize face recognition');
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              resolve();
            };
          }
        });
      }

      setStream(mediaStream);
    } catch (err: any) {
      console.error('Camera error:', err);
      throw new Error('Unable to access camera. Please grant camera permissions.');
    }
  };

  const startScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(async () => {
      await scanForFace();
    }, SCAN_INTERVAL);
  };

  const scanForFace = async () => {
    if (!videoRef.current || isLoading) return;

    try {
      setScanAttempts(prev => {
        const newAttempts = prev + 1;
        
        if (newAttempts >= MAX_SCAN_ATTEMPTS) {
          setStatus('No face recognized. Redirecting to registration...');
          cleanup();
          setTimeout(() => {
            onRegisterRedirect();
          }, 2000);
          return newAttempts;
        }

        setStatus(`Scanning... (Attempt ${newAttempts}/${MAX_SCAN_ATTEMPTS})`);
        return newAttempts;
      });

      const recognizedUser = await recognizeFace(videoRef.current, users);

      if (recognizedUser) {
        setStatus(`Welcome back, ${recognizedUser.name}!`);
        cleanup();
        
        setTimeout(() => {
          onSuccess(recognizedUser);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-600 rounded-full mb-4">
            <span className="text-4xl">☕</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Face Recognition Login</h1>
          <p className="text-gray-600">Look at the camera to sign in automatically</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-3" />
                  <p className="text-white text-sm">{scanStatus}</p>
                </div>
              </div>
            )}

            {!isLoading && !error && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    {scanAttempts < MAX_SCAN_ATTEMPTS ? (
                      <>
                        <Camera className="w-5 h-5 text-green-400 animate-pulse" />
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{scanStatus}</p>
                          <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-green-400 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${(scanAttempts / MAX_SCAN_ATTEMPTS) * 100}%` }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5 text-amber-400" />
                        <p className="text-white text-sm font-medium">{scanStatus}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Camera active - Position your face in the frame</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onSkip}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Use Other Login Methods
              </button>
              <button
                onClick={onRegisterRedirect}
                className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                Register New Face
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tips for best results:</strong>
            </p>
            <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Ensure good lighting on your face</li>
              <li>Look directly at the camera</li>
              <li>Keep your face 1-2 feet from the screen</li>
              <li>Remove glasses if recognition fails</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
