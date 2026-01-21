import { useState, useEffect } from 'react';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { OrderHistory } from './components/OrderHistory';
import { PaymentModal } from './components/PaymentModal';
import { LoginScreen } from './components/LoginScreen';
import { FaceRegistration } from './components/FaceRegistration';
import { PastOrders } from './components/PastOrders';
import { FirebaseLogin } from './components/FirebaseLogin';
import { FirebaseSignup } from './components/FirebaseSignup';
import { LandingScreen } from './components/LandingScreen';
import { RecommendedOrders } from './components/RecommendedOrders';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { User } from 'lucide-react';
import type { User as FaceUser } from './lib/userService';
import { deleteUser } from './lib/userService';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'coffee' | 'pastry' | 'other';
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  timestamp: Date;
  paymentMethod: string;
  userId?: string;
}

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  faceImageUrl?: string;
}

function AppContent() {
  const { currentUser: firebaseUser, loading: authLoading, logout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showFaceLogin, setShowFaceLogin] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showFirebaseLogin, setShowFirebaseLogin] = useState(false);
  const [showFirebaseSignup, setShowFirebaseSignup] = useState(false);
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [showPastOrders, setShowPastOrders] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);

  // Handle Firebase auth state
  useEffect(() => {
    if (firebaseUser) {
      const user: UserProfile = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        phone: '',
      };
      setCurrentUser(user);
      setIsAuthenticated(true);
      setShowFirebaseLogin(false);
      setShowFirebaseSignup(false);
    }
  }, [firebaseUser]);

  // Load user and orders from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedOrders = localStorage.getItem('orders');
    
    if (savedUser && !firebaseUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
    
    if (savedOrders) {
      const parsedOrders = JSON.parse(savedOrders).map((order: any) => ({
        ...order,
        timestamp: new Date(order.timestamp),
      }));
      setOrders(parsedOrders);
    }
  }, [firebaseUser]);

  // Save orders to localStorage
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('orders', JSON.stringify(orders));
    }
  }, [orders]);

  const handleFaceLoginSuccess = (user: FaceUser) => {
    const userProfile: UserProfile = {
      id: user.id || '',
      name: user.name,
      email: user.email,
      phone: user.phone,
      faceImageUrl: user.faceImageUrl,
    };
    setCurrentUser(userProfile);
    localStorage.setItem('currentUser', JSON.stringify(userProfile));
    setIsAuthenticated(true);
    setShowFaceLogin(false);
  };

  const handleFaceLoginRegisterRedirect = () => {
    setShowFaceLogin(false);
    setShowRegistration(true);
  };

  const handleFaceLoginSkip = () => {
    setShowFaceLogin(false);
    setShowLoginOptions(true);
  };

  const handleContinueAsGuest = () => {
    setIsAuthenticated(true);
    setShowLoginOptions(false);
  };

  const handleStartRegistration = () => {
    setShowLoginOptions(false);
    setShowRegistration(true);
  };

  const handleCompleteRegistration = (userData: { name: string; phone: string; email: string }) => {
    const newUser: UserProfile = {
      id: `USER-${Date.now()}`,
      ...userData,
    };
    setCurrentUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    setShowRegistration(false);
    setIsAuthenticated(true);
    setShowPastOrders(true);
  };

  const handleCancelRegistration = () => {
    setShowRegistration(false);
  };

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      setShowPayment(true);
    }
  };

  const completeOrder = (paymentMethod: string) => {
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      items: [...cartItems],
      total: getTotal(),
      timestamp: new Date(),
      paymentMethod,
      userId: currentUser?.id,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setCartItems([]);
    setShowPayment(false);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const handleReorder = (items: CartItem[]) => {
    setCartItems(items);
    setShowPastOrders(false);
    setActiveTab('pos');
  };

  const handleLogout = async () => {
    if (firebaseUser) {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear user data
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    
    // Reset authentication state
    setIsAuthenticated(false);
    
    // Clear cart and orders display
    setCartItems([]);
    setShowPastOrders(false);
    setShowRecommendations(true);
    
    // Reset all modal/screen states
    setShowUserDropdown(false);
    setShowPayment(false);
    setShowRegistration(false);
    setShowFirebaseLogin(false);
    setShowFirebaseSignup(false);
    setShowLoginOptions(false);
    
    // Return to landing screen
    setShowFaceLogin(true);
    setActiveTab('pos');
    
    console.log('User logged out successfully');
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete your account?\n\nThis will permanently remove:\n- Your face recognition data\n- Your profile information\n- All your order history\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      // Delete from Firestore if user has an ID
      if (currentUser.id) {
        await deleteUser(currentUser.id);
        console.log('Account deleted from Firestore');
      }

      // Clear localStorage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('orders');

      // Reset all state
      setCurrentUser(null);
      setIsAuthenticated(false);
      setCartItems([]);
      setOrders([]);
      setShowPastOrders(false);
      setShowRecommendations(true);
      setShowUserDropdown(false);
      setShowPayment(false);
      setShowRegistration(false);
      setShowFirebaseLogin(false);
      setShowFirebaseSignup(false);
      setShowLoginOptions(false);
      setShowFaceLogin(true);
      setActiveTab('pos');

      alert('Your account has been successfully deleted.');
      console.log('Account deleted successfully');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert(`Failed to delete account: ${error.message}`);
    }
  };

  const handleShowFirebaseLogin = () => {
    setShowLoginOptions(false);
    setShowFirebaseLogin(true);
  };

  const handleFirebaseLoginSuccess = () => {
    setShowFirebaseLogin(false);
  };

  const handleSwitchToSignup = () => {
    setShowFirebaseLogin(false);
    setShowFirebaseSignup(true);
  };

  const handleSwitchToLogin = () => {
    setShowFirebaseSignup(false);
    setShowFirebaseLogin(true);
  };

  const handleBackToOptions = () => {
    setShowFirebaseLogin(false);
    setShowFirebaseSignup(false);
    setShowLoginOptions(true);
  };

  // Get user's orders
  const userOrders = currentUser
    ? orders.filter((order) => order.userId === currentUser.id)
    : orders;

  // Calculate recommended orders based on frequency
  const getRecommendedOrders = () => {
    if (!currentUser || userOrders.length === 0) return [];

    const orderMap = new Map<string, { items: CartItem[]; frequency: number; lastOrdered: Date }>();

    userOrders.forEach((order) => {
      const orderKey = order.items
        .map((item) => `${item.id}-${item.quantity}`)
        .sort()
        .join('|');

      if (orderMap.has(orderKey)) {
        const existing = orderMap.get(orderKey)!;
        existing.frequency += 1;
        if (order.timestamp > existing.lastOrdered) {
          existing.lastOrdered = order.timestamp;
        }
      } else {
        orderMap.set(orderKey, {
          items: order.items,
          frequency: 1,
          lastOrdered: order.timestamp,
        });
      }
    });

    return Array.from(orderMap.values())
      .filter((rec) => rec.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);
  };

  const recommendedOrders = getRecommendedOrders();

  const handleSelectRecommendedOrder = (items: CartItem[]) => {
    setCartItems(items);
    setShowRecommendations(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-600 rounded-full mb-4">
            <span className="text-4xl">☕</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showFaceLogin) {
      return (
        <LandingScreen
          onSuccess={handleFaceLoginSuccess}
        />
      );
    }

    if (showFirebaseLogin) {
      return (
        <FirebaseLogin
          onSuccess={handleFirebaseLoginSuccess}
          onSwitchToSignup={handleSwitchToSignup}
          onBack={handleBackToOptions}
        />
      );
    }

    if (showFirebaseSignup) {
      return (
        <FirebaseSignup
          onSuccess={handleFirebaseLoginSuccess}
          onSwitchToLogin={handleSwitchToLogin}
          onBack={handleBackToOptions}
        />
      );
    }

    if (showLoginOptions) {
      return (
        <>
          <LoginScreen
            onContinueAsGuest={handleContinueAsGuest}
            onRegister={handleStartRegistration}
            onFirebaseLogin={handleShowFirebaseLogin}
          />
          {showRegistration && (
            <FaceRegistration
              onComplete={handleCompleteRegistration}
              onCancel={handleCancelRegistration}
            />
          )}
        </>
      );
    }

    if (showRegistration) {
      return (
        <FaceRegistration
          onComplete={handleCompleteRegistration}
          onCancel={handleCancelRegistration}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="FaceFlow Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('pos')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'pos'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Point of Sale
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'history'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Order History
                </button>
              </div>
              {currentUser && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 hover:border-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                  >
                    {currentUser.faceImageUrl ? (
                      <img 
                        src={currentUser.faceImageUrl} 
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-amber-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-amber-600" />
                      </div>
                    )}
                  </button>
                  {showUserDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowUserDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                          <p className="text-xs text-gray-600">{currentUser.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Logout
                        </button>
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            handleDeleteAccount();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200"
                        >
                          Delete Account
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Recommended Orders */}
      {currentUser && showRecommendations && recommendedOrders.length > 0 && activeTab === 'pos' && (
        <RecommendedOrders
          recommendations={recommendedOrders}
          onSelectOrder={handleSelectRecommendedOrder}
          onClose={() => setShowRecommendations(false)}
        />
      )}

      {/* Past Orders Banner */}
      {currentUser && showPastOrders && userOrders.length > 0 && activeTab === 'pos' && (
        <PastOrders
          orders={userOrders}
          onReorder={handleReorder}
          onClose={() => setShowPastOrders(false)}
        />
      )}

      {/* Main Content */}
      {activeTab === 'pos' ? (
        <div className="flex h-[calc(100vh-73px)]">
          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <ProductGrid onAddToCart={addToCart} />
          </div>

          {/* Cart Sidebar */}
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            <Cart
              items={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onCheckout={handleCheckout}
              onClear={clearCart}
              total={getTotal()}
            />
          </div>
        </div>
      ) : (
        <div className="p-6">
          <OrderHistory orders={currentUser ? userOrders : orders} />
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={getTotal()}
          onComplete={completeOrder}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}