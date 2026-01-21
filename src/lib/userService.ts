import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  updateDoc,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadString, deleteObject, getDownloadURL } from 'firebase/storage';
import app from '../config/firebase';

const db = getFirestore(app);
const storage = getStorage(app);

export interface User {
  id?: string;
  name: string;
  email: string;
  phone: string;
  faceData: string;
  faceImageUrl?: string;
  profilePhotoUrl?: string;
  registeredAt: Timestamp;
  lastGreeted?: Timestamp;
}

export async function registerUser(userData: Omit<User, 'id' | 'registeredAt'>): Promise<string> {
  try {
    const usersRef = collection(db, 'users');
    
    const existingUserQuery = query(usersRef, where('email', '==', userData.email));
    const existingUsers = await getDocs(existingUserQuery);
    
    if (!existingUsers.empty) {
      throw new Error('User with this email already exists');
    }

    let faceImageUrl = userData.faceImageUrl;

    // Upload face image to Firebase Storage if provided
    if (userData.faceImageUrl && userData.faceImageUrl.startsWith('data:')) {
      const timestamp = Date.now();
      const storageRef = ref(storage, `face-images/${timestamp}_${userData.email.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`);
      await uploadString(storageRef, userData.faceImageUrl, 'data_url');
      faceImageUrl = await getDownloadURL(storageRef);
      console.log('Face image uploaded to Firebase Storage:', faceImageUrl);
    }

    const docRef = await addDoc(usersRef, {
      ...userData,
      faceImageUrl,
      registeredAt: Timestamp.now(),
    });

    console.log('User registered with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const users: User[] = [];
    snapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      } as User);
    });

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as User;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
}

export async function findUserById(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
    } as User;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
}

export async function updateUserLastGreeted(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastGreeted: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating last greeted:', error);
    throw error;
  }
}

export async function updateUserProfile(
  userId: string, 
  updates: Partial<Omit<User, 'id' | 'registeredAt'>>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    // Get user data first to delete face image from storage
    const user = await findUserById(userId);
    
    if (user && user.faceImageUrl && user.faceImageUrl.includes('firebase')) {
      try {
        // Extract path from Firebase Storage URL and delete the image
        const imageUrl = new URL(user.faceImageUrl);
        const pathMatch = imageUrl.pathname.match(/\/o\/(.+?)\?/);
        if (pathMatch) {
          const imagePath = decodeURIComponent(pathMatch[1]);
          const imageRef = ref(storage, imagePath);
          await deleteObject(imageRef);
          console.log('Face image deleted from Firebase Storage');
        }
      } catch (storageError) {
        console.warn('Could not delete face image from storage:', storageError);
      }
    }

    // Delete user document from Firestore
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    
    console.log('User deleted successfully:', userId);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}
