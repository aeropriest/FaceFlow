import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import app from '../config/firebase';
import type { Order } from '../App';

const db = getFirestore(app);

export interface FirestoreOrder {
  id?: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
    image: string;
  }[];
  total: number;
  timestamp: Timestamp;
  paymentMethod: string;
  userId?: string;
}

export async function createOrder(orderData: Omit<Order, 'id'>): Promise<string> {
  try {
    const ordersRef = collection(db, 'orders');
    
    const firestoreOrder: Omit<FirestoreOrder, 'id'> = {
      items: orderData.items,
      total: orderData.total,
      timestamp: Timestamp.fromDate(orderData.timestamp),
      paymentMethod: orderData.paymentMethod,
      userId: orderData.userId,
    };

    const docRef = await addDoc(ordersRef, firestoreOrder);
    console.log('Order created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef, 
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as FirestoreOrder;
      orders.push({
        id: doc.id,
        items: data.items,
        total: data.total,
        timestamp: data.timestamp.toDate(),
        paymentMethod: data.paymentMethod,
        userId: data.userId,
      });
    });

    return orders;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('timestamp', 'desc'));
    
    const snapshot = await getDocs(q);
    
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as FirestoreOrder;
      orders.push({
        id: doc.id,
        items: data.items,
        total: data.total,
        timestamp: data.timestamp.toDate(),
        paymentMethod: data.paymentMethod,
        userId: data.userId,
      });
    });

    return orders;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    throw error;
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return null;
    }

    const data = orderDoc.data() as FirestoreOrder;
    return {
      id: orderDoc.id,
      items: data.items,
      total: data.total,
      timestamp: data.timestamp.toDate(),
      paymentMethod: data.paymentMethod,
      userId: data.userId,
    };
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    throw error;
  }
}
