import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import app from '../config/firebase';

const db = getFirestore(app);

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

    const docRef = await addDoc(usersRef, {
      ...userData,
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
