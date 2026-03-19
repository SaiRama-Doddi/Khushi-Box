import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  doc, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  ShoppingBag, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Phone,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'orders'>('categories');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Form States
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catSubcats, setCatSubcats] = useState(''); // New state for comma-separated subcats
  
  const [prodName, setProdName] = useState('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodSubcategory, setProdSubcategory] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodImages, setProdImages] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodSizes, setProdSizes] = useState<string[]>([]);
  const [prodDetails, setProdDetails] = useState('');
  const [prodKeyFeatures, setProdKeyFeatures] = useState('');
  const [prodInStock, setProdInStock] = useState(true);
  const [prodRating, setProdRating] = useState('5');
  const [prodReviews, setProdReviews] = useState('0');
  const [orderFilter, setOrderFilter] = useState<'all' | 'today' | '24h' | '7d' | '30d'>('all');

  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'all') return true;
    const orderDate = (order.createdAt as any)?.toDate();
    if (!orderDate) return false;
    
    const now = new Date();
    if (orderFilter === 'today') {
      return orderDate.toDateString() === now.toDateString();
    }
    if (orderFilter === '24h') {
      return now.getTime() - orderDate.getTime() <= 24 * 60 * 60 * 1000;
    }
    if (orderFilter === '7d') {
      return now.getTime() - orderDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
    }
    if (orderFilter === '30d') {
      return now.getTime() - orderDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrdersCount = filteredOrders.length;

  // Edit States
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showSubcatForm, setShowSubcatForm] = useState<string | null>(null);
  const [newSubcatName, setNewSubcatName] = useState('');
  const [newSubcatSlug, setNewSubcatSlug] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isAlert?: boolean;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isAlert: false
  });

  const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId: string | undefined;
      email: string | null | undefined;
      emailVerified: boolean | undefined;
      isAnonymous: boolean | undefined;
      tenantId: string | null | undefined;
      providerInfo: {
        providerId: string;
        displayName: string | null;
        email: string | null;
        photoUrl: string | null;
      }[];
    }
  }

  const handleFirestoreError = (err: any, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: err instanceof Error ? err.message : String(err),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    const jsonErr = JSON.stringify(errInfo, null, 2);
    console.error('Firestore Error:', jsonErr);
    setError(jsonErr);
    throw new Error(jsonErr);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (!auth.currentUser) return;
      
      // Hardcoded check for the primary admin emails
      const adminEmails = ['prasannaofficial1712@gmail.com', 'hellokhushibox@gmail.com'];
      if (adminEmails.includes(auth.currentUser.email || '')) {
        setIsAdmin(true);
        return;
      }

      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        console.log("Admin check user data:", userSnap.data());
        if (userSnap.exists() && userSnap.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          console.warn("User is not an admin or role missing in Firestore");
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Admin check failed:', err);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [activeTab, isAdmin]);

  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      if (activeTab === 'categories') {
        const snap = await getDocs(query(collection(db, 'categories'), orderBy('createdAt', 'desc')));
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else if (activeTab === 'products') {
        const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        // Also need categories for the dropdown
        const catSnap = await getDocs(collection(db, 'categories'));
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else if (activeTab === 'orders') {
        const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, activeTab);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const subcats = catSubcats.split(',').map(s => s.trim()).filter(s => s).map(s => ({
      id: Math.random().toString(36).substr(2, 9),
      name: s,
      slug: s.toLowerCase().replace(/\s+/g, '-')
    }));

    try {
      await addDoc(collection(db, 'categories'), {
        name: catName,
        slug: catSlug || catName.toLowerCase().replace(/\s+/g, '-'),
        image: catImage,
        children: subcats,
        createdAt: Timestamp.now()
      });
      setCatName('');
      setCatSlug('');
      setCatImage('');
      setCatSubcats('');
      setError(null);
      fetchData();
    } catch (err) { 
      handleFirestoreError(err, OperationType.CREATE, 'categories');
    }
  };

  const seedRequirements = async () => {
    setConfirmModal({
      show: true,
      title: 'Seed Requirements',
      message: 'This will add the standard categories and subcategories. Continue?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        setLoading(true);
        const requirements = [
          {
            name: "Personalised Gifts",
            slug: "personalised-gifts",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9ZDUoYg5Ce-s06T1krOVEPlXlKyjassnD-v9loxBd56zFEHN-ENoC_xv6hCF0pm5EtUmLAfqMHsbPHdE8VZHLwf8afASzjAksIOk5fRGeB-4aBXpDSDZs47jazMjM-Ut9ERGwoGjL-zpIaxAie_MwvigMXBFBbXeKvvfyr6WyIXjX5XEm6-6LyMR-WYpygCZDqyRjxmdbgYpO4WiewqLVveGXvZhLdm_XnM36BItq22w2Af3wAVbI-CF0Qu72qVEiFyiMOfYqmXE",
            children: [
              { name: "Mugs", slug: "mugs" },
              { name: "Waterbottles & Sippers", slug: "waterbottles-sippers" },
              { name: "Photoframes", slug: "photoframes" },
              { name: "Clocks", slug: "clocks" },
              { name: "LED Photoframes", slug: "led-photoframes" },
              { name: "LED Rotating Photoframes", slug: "led-rotating-photoframes" },
              { name: "Key Chains", slug: "key-chains" },
              { name: "Cushions", slug: "cushions" },
              { name: "Sash Roll", slug: "sash-roll" },
              { name: "Mouse Pad", slug: "mouse-pad" }
            ]
          },
          {
            name: "Wearables",
            slug: "wearables",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGhxyCbVoDGAVA40IuylZRsiPluHljNMAWp1U0CiEog4sZy3d4xMvuJnRO51wsJfc4rvistJGjqSyIiLfE_AUgUJ4dvzUc3-5PhmDwwCTcjzo8Y2HC0X0YhWoPzXR6OIwTbpDUN8x-3ODX4pTmejiELYc9JFVjucv1vzYFsGsbnvMFhk56uClRwDZ7P4K697JoNQVQjRefnnGp0thuPgD7CPvf1vmmDMawEsSSrXUA5a7oMED890NdE1QVZH_AnfzS1GZ_Id20ei4",
            children: [
              { name: "T-Shirts", slug: "t-shirts" },
              { name: "Oversized T Shirts", slug: "oversized-t-shirts" },
              { name: "Hoodies", slug: "hoodies" },
              { name: "SweatShirts", slug: "sweatshirts" },
              { name: "Collar Zipper", slug: "collar-zipper" },
              { name: "Track Suits", slug: "track-suits" },
              { name: "Caps", slug: "caps" }
            ]
          },
          {
            name: "Magnets",
            slug: "magnets",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB7gyU5osPNRbOxQYt9KESZxNYx9F1Wv8yTesv7DrJidByw3u8UKY-7B8o6yh4jX6pbN8Zyf9xDuwv2PadVvWkwMNwGB5h-Wc5hyIbphEf4kUt_mh3gga0GOJgXFDaDQrju8uVYfpeRdyT-X1PP_PdTQUDgSTqRZGLOpXGpafhvnsqqhrPIwh0E7pEqA2Ha2ls7IcFE64pKdvKUz1Kkcpt4Cy29Y88DtwgBXXu_GqFmGY0IIe8x_TexvXKL3MiTx03sZLts2gdJTLQ",
            children: [
              { name: "Personalized", slug: "personalized-magnets" },
              { name: "Funky", slug: "funky-magnets" }
            ]
          }
        ];

        try {
          for (const req of requirements) {
            await addDoc(collection(db, 'categories'), {
              ...req,
              children: req.children.map(c => ({ ...c, id: Math.random().toString(36).substr(2, 9) })),
              createdAt: Timestamp.now()
            });
          }
          fetchData();
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const seedProducts = async () => {
    setConfirmModal({
      show: true,
      title: 'Seed Products',
      message: 'This will add sample products to your store. Continue?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        setLoading(true);
        const sampleProducts = [
          {
            name: "Custom Ceramic Coffee Mug",
            originalPrice: 1499,
            price: 899,
            category: "personalised-gifts",
            subcategory: "mugs",
            image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=1000&auto=format&fit=crop",
            images: ["https://images.unsplash.com/photo-1572113173140-5e5e73757a1d?q=80&w=1000&auto=format&fit=crop"],
            description: "A high-quality ceramic mug that can be personalized with your favorite photo or text. Perfect for morning coffee or as a thoughtful gift.",
            sizes: [],
            rating: 5,
            reviews: 0,
            inStock: true,
            details: "Microwave and dishwasher safe ceramic mug. High-quality print that lasts.",
            keyFeatures: ["Microwave safe", "Dishwasher safe", "11 oz Capacity"],
            createdAt: Timestamp.now()
          },
          {
            name: "Premium Cotton Graphic T-Shirt",
            originalPrice: 1299,
            price: 799,
            category: "wearables",
            subcategory: "t-shirts",
            image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop",
            images: ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop"],
            description: "Soft, breathable 100% cotton t-shirt with a custom print. Durable and comfortable for everyday wear.",
            sizes: ["S", "M", "L", "XL"],
            rating: 4.8,
            reviews: 0,
            inStock: true,
            details: "180 GSM Pre-shrunk cotton fabric. Regular fit.",
            keyFeatures: ["100% Cotton", "Breathable fabric", "Durable print"],
            createdAt: Timestamp.now()
          },
          {
            name: "Personalized Photo Fridge Magnet",
            originalPrice: 499,
            price: 299,
            category: "magnets",
            subcategory: "personalized-magnets",
            image: "https://images.unsplash.com/photo-1590534247854-e97d5e3feef6?q=80&w=1000&auto=format&fit=crop",
            images: [],
            description: "Turn your favorite memories into beautiful fridge magnets. High-gloss finish and strong magnetic backing.",
            sizes: [],
            rating: 4.9,
            reviews: 0,
            inStock: true,
            details: "Water-resistant surface fridge magnet. Strong magnetic grip.",
            keyFeatures: ["Water resistant", "Strong magnet", "3x3 inches"],
            createdAt: Timestamp.now()
          }
        ];

        try {
          for (const prod of sampleProducts) {
            await addDoc(collection(db, 'products'), prod);
          }
          fetchData();
          setConfirmModal({
            show: true,
            title: 'Success',
            message: 'Sample products added successfully!',
            isAlert: true,
            onConfirm: () => setConfirmModal(prev => ({ ...prev, show: false }))
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'products');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'products'), {
        name: prodName,
        originalPrice: parseFloat(prodOriginalPrice) || 0,
        price: parseFloat(prodPrice) || 0,
        category: prodCat,
        subcategory: prodSubcategory,
        image: prodImage,
        images: prodImages.split(',').map(s => s.trim()).filter(s => s),
        description: prodDesc,
        sizes: prodSizes,
        rating: parseFloat(prodRating) || 5,
        reviews: parseInt(prodReviews) || 0,
        inStock: prodInStock,
        details: prodDetails,
        keyFeatures: prodKeyFeatures.split(',').map(s => s.trim()).filter(s => s),
        createdAt: Timestamp.now()
      });
      setProdName('');
      setProdOriginalPrice('');
      setProdPrice('');
      setProdCat('');
      setProdSubcategory('');
      setProdImage('');
      setProdImages('');
      setProdDesc('');
      setProdSizes([]);
      setProdDetails('');
      setProdKeyFeatures('');
      setProdInStock(true);
      setProdRating('5');
      setProdReviews('0');
      setError(null);
      fetchData();
      setConfirmModal({
        show: true,
        title: 'Success',
        message: 'Product listed successfully!',
        isAlert: true,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, show: false }))
      });
    } catch (err) { 
      handleFirestoreError(err, OperationType.CREATE, 'products');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (col: string, id: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          await deleteDoc(doc(db, col, id));
          setError(null);
          fetchData();
        } catch (err) { 
          handleFirestoreError(err, OperationType.DELETE, `${col}/${id}`);
        }
      }
    });
  };

  const updateItem = async (col: string, id: string, data: any) => {
    try {
      await updateDoc(doc(db, col, id), data);
      setEditingItem(null);
      setError(null);
      fetchData();
    } catch (err) { 
      handleFirestoreError(err, OperationType.UPDATE, `${col}/${id}`);
    }
  };

  const addSubcategory = async (catId: string, currentChildren: any[]) => {
    if (!newSubcatName) return;
    
    const names = newSubcatName.split(',').map(s => s.trim()).filter(s => s);
    const newChildren = names.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      slug: name.toLowerCase().replace(/\s+/g, '-')
    }));
    
    try {
      await updateDoc(doc(db, 'categories', catId), {
        children: [...(currentChildren || []), ...newChildren]
      });
      setNewSubcatName('');
      setNewSubcatSlug('');
      setShowSubcatForm(null);
      setError(null);
      fetchData();
    } catch (err) { 
      handleFirestoreError(err, OperationType.UPDATE, `categories/${catId}`);
    }
  };

  const deleteSubcategory = async (catId: string, subcatId: string, currentChildren: any[]) => {
    setConfirmModal({
      show: true,
      title: 'Delete Subcategory',
      message: 'Are you sure you want to delete this subcategory?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          await updateDoc(doc(db, 'categories', catId), {
            children: currentChildren.filter(c => c.id !== subcatId)
          });
          setError(null);
          fetchData();
        } catch (err) { 
          handleFirestoreError(err, OperationType.UPDATE, `categories/${catId}`);
        }
      }
    });
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] px-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#1E293B] rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-800/50"
        >
          <div className="size-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <LogOut size={40} />
          </div>
          <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Security Alert</h2>
          <p className="text-slate-400 mb-10 leading-relaxed font-medium">This terminal is restricted. You do not have the required clearance level to access the management portal.</p>
          <button 
            onClick={() => signOut(auth)}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
          >
            Terminal Exit
          </button>
        </motion.div>
      </div>
    );
  }

  if (isAdmin === null || loading && categories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
            <Loader2 className="animate-spin text-primary relative z-10" size={48} />
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Initializing Pulse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex font-sans selection:bg-primary/30">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileSidebar(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`w-72 bg-[#0F172A] border-r border-slate-800/50 flex flex-col fixed h-screen z-50 shadow-2xl transition-transform duration-300 lg:translate-x-0 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white">Khushi Admin</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Management Portal</p>
            </div>
          </div>
          <button 
            onClick={() => setShowMobileSidebar(false)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 ml-2">Console</p>
          {[
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'categories', label: 'Categories', icon: Tags },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setShowMobileSidebar(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200 uppercase tracking-widest'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'animate-pulse' : ''} />
              {item.label}
              {activeTab === item.id && (
                <motion.div layoutId="activeTab" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800/50">
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-all duration-300 group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-30 bg-[#020617]/80 backdrop-blur-xl border-b border-slate-800/50 px-6 md:px-12 py-6 md:py-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-xl md:text-3xl font-black text-white tracking-tight capitalize leading-none">{activeTab}</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                {isAdmin ? 'System Pulse • Active' : 'Restricted Access'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-bold text-white tracking-tight">{auth.currentUser?.email}</p>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Master Control</span>
            </div>
            <div className="size-10 md:size-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/20 flex items-center justify-center font-black text-white text-lg md:text-xl uppercase tracking-tighter shadow-inner">
              {auth.currentUser?.email?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 lg:p-12 max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Management Terminal</p>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter capitalize">{activeTab}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              {categories.length === 0 && (
                <button 
                  onClick={seedRequirements}
                  className="bg-primary/10 text-primary px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5"
                >
                  Regenerate Core Matrix
                </button>
              )}
              {activeTab === 'products' && products.length === 0 && (
                <button 
                  onClick={seedProducts}
                  className="bg-primary/10 text-primary px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5"
                >
                  Inject Sample Data
                </button>
              )}
              <div className="bg-emerald-500/10 text-emerald-500 px-3 md:px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 shadow-sm animate-pulse whitespace-nowrap">
                {loading ? 'Synchronizing...' : 'Network Stable'}
              </div>
            </div>
          </div>

        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-3xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-red-800 font-bold uppercase tracking-widest text-xs">System Error</h3>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X size={16} />
              </button>
            </div>
            <pre className="text-[10px] text-red-600 font-mono overflow-x-auto whitespace-pre-wrap">
              {error}
            </pre>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'categories' && (
            <motion.div key="cat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 md:space-y-12">
              <form onSubmit={addCategory} className="bg-[#1E293B] p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-slate-800/50 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="md:col-span-2 flex items-center justify-between">
                  <h3 className="text-lg md:text-xl font-black text-white tracking-tight">Establish New Category</h3>
                  <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                    <Plus size={20} />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Category Designation</label>
                  <input value={catName} onChange={e => setCatName(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-slate-700 outline-none border" placeholder="e.g. LUXURY APPAREL" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">URL Identifier (Slug)</label>
                  <input value={catSlug} onChange={e => setCatSlug(e.target.value)} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-slate-700 outline-none border" placeholder="e.g. luxury-apparel" />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Sub-Matrices (Comma separated)</label>
                  <input value={catSubcats} onChange={e => setCatSubcats(e.target.value)} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-slate-700 outline-none border" placeholder="e.g. Mugs, Frames, Clocks" />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Visual Asset URL</label>
                  <input value={catImage} onChange={e => setCatImage(e.target.value)} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-slate-700 outline-none border" placeholder="https://source.unsplash.com/assets/..." />
                </div>
                <button type="submit" className="md:col-span-2 bg-primary text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-[0.98] flex items-center justify-center gap-3">
                  <Plus size={20} /> Initialize Category
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-[#1E293B] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-slate-800/50 group relative flex flex-col shadow-xl hover:border-primary/30 transition-all duration-500">
                    <div className="h-40 md:h-48 bg-[#0F172A] relative overflow-hidden">
                      <img src={cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] to-transparent opacity-60"></div>
                      <div className="absolute top-4 right-4 flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 lg:group-hover:translate-y-0">
                        <button 
                          onClick={() => setEditingItem({ type: 'category', ...cat })}
                          className="p-2.5 md:p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-primary transition-colors border border-white/10"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteItem('categories', cat.id)} 
                          className="p-2.5 md:p-3 bg-white/10 backdrop-blur-md rounded-xl text-rose-400 hover:bg-rose-500 hover:text-white transition-colors border border-white/10"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="p-6 md:p-8 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 overflow-hidden pr-2">
                          <h4 className="text-lg md:text-xl font-black text-white tracking-tight truncate">{cat.name}</h4>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 block truncate">{cat.slug}</span>
                        </div>
                        <div className="bg-primary/10 text-primary px-2 md:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20 shrink-0">
                          {cat.children?.length || 0} Layers
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-[#0F172A]/50 p-2 rounded-xl border border-slate-800/30">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2">Sub-Matrices</h4>
                          <button 
                            onClick={() => setShowSubcatForm(showSubcatForm === cat.id ? null : cat.id)}
                            className="size-8 bg-primary rounded-lg flex items-center justify-center text-white hover:bg-primary-dark transition-colors shadow-lg shadow-primary/10"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        {showSubcatForm === cat.id && (
                          <div className="p-4 bg-[#0F172A] rounded-2xl space-y-3 border border-slate-800 shadow-inner">
                            <textarea 
                              value={newSubcatName} 
                              onChange={e => setNewSubcatName(e.target.value)}
                              placeholder="Matrices (comma separated)"
                              className="w-full text-xs px-4 py-3 rounded-xl bg-[#1E293B] border-slate-800 text-white h-20 placeholder:text-slate-700 outline-none border"
                            />
                            <button 
                              onClick={() => addSubcategory(cat.id, cat.children)}
                              className="w-full bg-white text-[#020617] text-[10px] font-black py-3 rounded-xl uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all"
                            >
                              Sync Matrices
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {cat.children?.map((child: any) => (
                            <div key={child.id} className="flex items-center gap-2 bg-[#0F172A] px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl border border-slate-800/50 group/sub hover:border-primary/40 transition-all">
                              <span className="text-[9px] md:text-[10px] font-black text-slate-400 group-hover/sub:text-slate-200 uppercase tracking-widest">{child.name}</span>
                              <button 
                                onClick={() => deleteSubcategory(cat.id, child.id, cat.children)}
                                className="text-slate-600 hover:text-rose-500 lg:opacity-0 lg:group-hover/sub:opacity-100 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          {(!cat.children || cat.children.length === 0) && (
                            <div className="w-full py-4 border border-dashed border-slate-800 rounded-xl text-center">
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Matrix Empty</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div key="prod" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <form onSubmit={addProduct} className="bg-[#1E293B] p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-slate-800/50 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="md:col-span-2 flex items-center justify-between">
                  <h3 className="text-lg md:text-xl font-black text-white tracking-tight">Index New Product</h3>
                  <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                    <Plus size={20} />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Product Title</label>
                  <input value={prodName} onChange={e => setProdName(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium outline-none border" placeholder="E.G. SIGNATURE COLLECTION" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">MSRP (₹)</label>
                    <input type="number" step="1" value={prodOriginalPrice} onChange={e => setProdOriginalPrice(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none border" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Listing Price (₹)</label>
                    <input type="number" step="1" value={prodPrice} onChange={e => setProdPrice(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/10 transition-all outline-none border" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Core Matrix (Category)</label>
                  <select value={prodCat} onChange={e => setProdCat(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/10 transition-all font-medium appearance-none outline-none border">
                    <option value="" className="bg-[#0F172A]">Select Domain</option>
                    {categories.map(c => <option key={c.id} value={c.slug} className="bg-[#0F172A]">{c.name}</option>)}
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Sub-Matrix (Subcategory)</label>
                  <select value={prodSubcategory} onChange={e => setProdSubcategory(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/10 appearance-none outline-none border">
                    <option value="" className="bg-[#0F172A]">Select Protocol</option>
                    {categories.find(c => c.slug === prodCat)?.children?.map((child: any) => (
                      <option key={child.id} value={child.slug} className="bg-[#0F172A]">{child.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Primary Asset URL</label>
                  <input value={prodImage} onChange={e => setProdImage(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/10 outline-none border" placeholder="HTTPS://..." />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Gallery Images (comma separated URLs)</label>
                  <input value={prodImages} onChange={e => setProdImages(e.target.value)} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/10 outline-none border" placeholder="https://... , https://..." />
                  <p className="text-[10px] text-slate-500">Add 2-4 image links for the product gallery (optional, comma-separated).</p>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Description</label>
                  <textarea value={prodDesc} onChange={e => setProdDesc(e.target.value)} rows={3} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/10 outline-none border" placeholder="Add the product description" />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Details / Specifications</label>
                  <textarea value={prodDetails} onChange={e => setProdDetails(e.target.value)} rows={3} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/10 outline-none border" placeholder="Key details (e.g. size, material, usage)" />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Key Features (comma separated)</label>
                  <input value={prodKeyFeatures} onChange={e => setProdKeyFeatures(e.target.value)} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/10 outline-none border" placeholder="Personalized Design, Non-slip Base, Stitched Edges" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 md:col-span-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Rating</label>
                    <input type="number" min="0" max="5" step="0.1" value={prodRating} onChange={e => setProdRating(e.target.value)} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/10 outline-none border" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Reviews Count</label>
                    <input type="number" min="0" step="1" value={prodReviews} onChange={e => setProdReviews(e.target.value)} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/10 outline-none border" />
                  </div>
                </div>

                <div className="flex items-center gap-3 md:col-span-2">
                  <input id="inStock" type="checkbox" checked={prodInStock} onChange={e => setProdInStock(e.target.checked)} className="accent-primary" />
                  <label htmlFor="inStock" className="text-sm text-slate-300">In Stock</label>
                </div>

                <button type="submit" className="md:col-span-2 bg-primary text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-[0.98] flex items-center justify-center gap-3">
                   {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                   {loading ? 'Processing...' : 'Deploy Product'}
                </button>
              </form>

              <div className="bg-[#1E293B] rounded-3xl md:rounded-[2.5rem] border border-slate-800/50 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left min-w-[800px] md:min-w-0">
                    <thead className="bg-[#0F172A] border-b border-slate-800/50">
                      <tr>
                        <th className="px-6 md:px-10 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Asset Profile</th>
                        <th className="px-6 md:px-10 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hidden sm:table-cell">Matrix Mapping</th>
                        <th className="px-6 md:px-10 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Valuation</th>
                        <th className="px-6 md:px-10 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Rating</th>
                        <th className="px-6 md:px-10 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-right">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {products.map(prod => (
                        <tr key={prod.id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="px-6 md:px-10 py-5 md:py-6">
                            <div className="flex items-center gap-4 md:gap-6">
                              <div className="size-12 md:size-16 rounded-xl md:rounded-2xl bg-[#0F172A] border border-slate-800/50 overflow-hidden shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <img src={prod.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-black text-white tracking-tight truncate max-w-[150px] md:max-w-none">{prod.name}</span>
                                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${prod.inStock !== false ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}`}>
                                  {prod.inStock !== false ? 'Online' : 'Offline'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 md:px-10 py-5 md:py-6 hidden sm:table-cell">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{prod.category}</span>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{prod.subcategory || prod.childCategory}</span>
                            </div>
                          </td>
                          <td className="px-6 md:px-10 py-5 md:py-6">
                            <div className="flex flex-col">
                              <span className="text-base md:text-lg font-black text-white">₹{prod.price || prod.offerPrice}</span>
                              {(prod.originalPrice || prod.actualPrice) && (
                                <span className="text-[9px] md:text-[10px] text-slate-500 line-through tracking-widest font-bold uppercase truncate">₹{prod.originalPrice || prod.actualPrice}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 md:px-10 py-5 md:py-6">
                            <span className="text-[11px] font-black text-slate-200">{(prod.rating || 0).toFixed(1)} ⭐</span>
                            <p className="text-[9px] text-slate-500">({prod.reviews || 0} reviews)</p>
                          </td>
                          <td className="px-6 md:px-10 py-5 md:py-6 text-right">
                            <div className="flex gap-2 md:gap-4 justify-end">
                              <button 
                                onClick={() => setEditingItem({ type: 'product', ...prod })}
                                className="size-9 md:size-10 bg-slate-800/50 rounded-lg md:rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-all border border-slate-700/50 shadow-lg"
                              >
                                <Edit2 size={16} className="md:w-[18px] md:h-[18px]" />
                              </button>
                              <button onClick={() => deleteItem('products', prod.id)} className="size-9 md:size-10 bg-slate-800/50 rounded-lg md:rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-slate-700/50 shadow-lg">
                                <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div key="ord" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              {/* Stats Overview */}
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                <div className="bg-[#1E293B] p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-800/50 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 p-4 md:p-8 text-primary/10 group-hover:text-primary/20 transition-colors">
                    <ShoppingBag size={80} className="md:w-[120px] md:h-[120px]" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 md:mb-4">Total Orders Volume</p>
                  <div className="flex items-baseline gap-2 md:gap-3">
                    <span className="text-4xl md:text-6xl font-black text-white tracking-tighter">{totalOrdersCount}</span>
                    <span className="text-[10px] md:text-sm font-bold text-emerald-500 uppercase tracking-widest leading-none">Active Entries</span>
                  </div>
                </div>
                <div className="bg-[#1E293B] p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-800/50 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 p-4 md:p-8 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
                    <LayoutDashboard size={80} className="md:w-[120px] md:h-[120px]" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 md:mb-4">Cumulative Revenue</p>
                  <div className="flex items-baseline gap-2 md:gap-3">
                    <span className="text-3xl md:text-6xl font-black text-white tracking-tighter">₹{totalRevenue.toLocaleString()}</span>
                    <span className="text-[10px] md:text-sm font-bold text-primary uppercase tracking-widest italic leading-none">INR Net</span>
                  </div>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="overflow-x-auto custom-scrollbar -mx-4 px-4 py-2 md:mx-0 md:px-0 md:py-0">
                <div className="flex items-center gap-3 md:gap-4 bg-[#0F172A] p-2 md:p-3 rounded-2xl md:rounded-3xl border border-slate-800/50 w-max md:w-fit min-w-full md:min-w-0">
                  {[
                    { id: 'all', label: 'All Records' },
                    { id: 'today', label: 'Today Only' },
                    { id: '24h', label: 'Last 24h' },
                    { id: '7d', label: '7 Days' },
                    { id: '30d', label: '30 Days' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setOrderFilter(f.id as any)}
                      className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap ${
                        orderFilter === f.id 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                          : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-6 md:space-y-8">
                {filteredOrders.map(order => (
                  <div key={order.id} className="bg-[#1E293B] p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-800/50 shadow-2xl flex flex-col xl:flex-row justify-between gap-8 md:gap-12 group hover:border-primary/30 transition-all duration-500">
                    <div className="flex-1 space-y-6 md:space-y-8">
                      <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        <div className="px-3 md:px-4 py-1.5 md:py-2 bg-primary/10 border border-primary/20 rounded-lg md:rounded-xl">
                          <span className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.3em]">O-ID: {order.id.slice(-8).toUpperCase()}</span>
                        </div>
                        <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] ${
                          order.status === 'Shipped' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                        }`}>
                          {order.status || 'Processing'}
                        </span>
                        <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest sm:ml-auto w-full sm:w-auto">
                          {(order.createdAt as any)?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        <div className="space-y-3 md:space-y-4">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Client Profile</p>
                          <div className="bg-[#0F172A] p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800/50 space-y-3">
                            <p className="text-base md:text-lg font-black text-white">{order.shippingDetails?.firstName} {order.shippingDetails?.lastName}</p>
                            <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed font-medium">
                              {order.shippingDetails?.address}, {order.shippingDetails?.city}<br/>
                              <span className="text-slate-500">{order.shippingDetails?.postalCode && `PIN ${order.shippingDetails.postalCode}`}</span>
                              {order.shippingDetails?.landmark && <span className="block italic mt-1 text-primary/60 text-[10px] uppercase tracking-widest font-black line-clamp-1">Near: {order.shippingDetails.landmark}</span>}
                            </p>
                            {order.shippingDetails?.phone && (
                              <div className="pt-3 border-t border-slate-800/50 flex items-center gap-3">
                                <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                  <Phone size={14} />
                                </div>
                                <span className="text-sm font-black text-white tracking-widest break-all">{order.shippingDetails.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Manifest Items</p>
                          <div className="space-y-3">
                            {order.items?.map((item: any, i: number) => (
                              <div key={i} className="flex items-center gap-3 md:gap-4 bg-[#0F172A] p-3 rounded-xl md:rounded-2xl border border-slate-800/50 group/item hover:border-primary/20 transition-all">
                                <div className="size-12 md:size-14 rounded-lg md:rounded-xl bg-[#1E293B] border border-slate-800/50 overflow-hidden shrink-0 shadow-inner">
                                  <img src={item.image || (item.imageUrl)} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] md:text-xs font-black text-white truncate">{item.name}</p>
                                  <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                    Qty: {item.quantity} {item.size && item.size !== 'N/A' && <span className="mx-1.5 text-primary">• {item.size}</span>}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-black text-white">₹{(item.price || 0) * (item.quantity || 1)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full xl:w-64 flex flex-col sm:flex-row xl:flex-col justify-between items-stretch sm:items-end xl:items-end border-t xl:border-t-0 xl:border-l border-slate-800/50 pt-8 xl:pt-0 xl:pl-8 gap-6">
                      <div className="text-left sm:text-right space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Net Settlement</p>
                        <p className="text-3xl md:text-4xl font-black text-white tracking-tighter">₹{order.total?.toLocaleString()}</p>
                      </div>
                      
                      {order.status !== 'Shipped' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'Shipped')}
                          className="flex-1 sm:flex-none sm:min-w-[180px] bg-white text-[#020617] px-6 md:px-8 py-4 md:py-5 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-xl hover:bg-primary hover:text-white transition-all transform active:scale-95 duration-300"
                        >
                          Dispatch Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredOrders.length === 0 && (
                  <div className="text-center py-32 bg-[#1E293B] rounded-[3rem] border border-dashed border-slate-800">
                    <div className="size-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
                      <ShoppingBag size={40} />
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">No active manifests found</p>
                    <p className="text-slate-600 text-[10px] font-bold mt-2">Adjust your filters or standby for new transmissions</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmModal.show && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="bg-[#1E293B] w-full max-w-md rounded-3xl md:rounded-[2.5rem] border border-slate-800 shadow-2xl p-6 md:p-10 text-center"
              >
                <div className={`size-16 md:size-20 mx-auto mb-6 md:mb-8 rounded-full flex items-center justify-center ${confirmModal.isAlert ? 'bg-primary/10 text-primary border-primary/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'} border`}>
                  {confirmModal.isAlert ? <LayoutDashboard size={28} className="md:w-8 md:h-8" /> : <Trash2 size={28} className="md:w-8 md:h-8" />}
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white mb-3 uppercase tracking-tight">{confirmModal.title}</h3>
                <p className="text-slate-400 mb-8 md:mb-10 text-xs md:text-sm font-medium leading-relaxed">{confirmModal.message}</p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  {!confirmModal.isAlert && (
                    <button 
                      onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                      className="flex-1 px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-slate-500 hover:text-white hover:bg-slate-800 transition-all uppercase tracking-[0.2em] text-[10px]"
                    >
                      Dismiss
                    </button>
                  )}
                  <button 
                    onClick={confirmModal.onConfirm}
                    className={`flex-1 px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-white transition-all uppercase tracking-[0.2em] text-[10px] shadow-xl ${
                      confirmModal.isAlert ? 'bg-primary shadow-primary/20 hover:bg-primary-dark' : 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600'
                    }`}
                  >
                    {confirmModal.isAlert ? 'Acknowledged' : 'Execute Action'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {editingItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 40 }}
                className="bg-[#1E293B] w-full max-w-2xl rounded-3xl md:rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-5 md:p-8 border-b border-slate-800/50 flex justify-between items-center bg-[#0F172A]/50">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="size-9 md:size-10 bg-primary/10 rounded-lg md:rounded-xl flex items-center justify-center text-primary border border-primary/20">
                      <Edit2 size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-white uppercase tracking-[0.2em] text-[10px] md:text-xs">
                        Refine {editingItem.type}
                      </h3>
                      <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Authorized Modification Portal</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingItem(null)} className="size-9 md:size-10 flex items-center justify-center rounded-lg md:rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-slate-700/50">
                    <X size={18} className="md:w-5 md:h-5" />
                  </button>
                </div>

                <div className="p-6 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
                  {editingItem.type === 'category' ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const subcatString = formData.get('subcategories') as string;
                        const subcats = subcatString.split(',').map(s => s.trim()).filter(s => s).map(s => {
                          const existing = editingItem.children?.find((c: any) => c.name.toLowerCase() === s.toLowerCase());
                          return {
                            id: existing?.id || Math.random().toString(36).substr(2, 9),
                            name: s,
                            slug: s.toLowerCase().replace(/\s+/g, '-')
                          };
                        });

                        updateItem('categories', editingItem.id, {
                          name: formData.get('name'),
                          slug: formData.get('slug'),
                          image: formData.get('image'),
                          children: subcats
                        });
                      }}
                      className="space-y-6 md:space-y-8"
                    >
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Category Designation</label>
                        <input name="name" defaultValue={editingItem.name} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Matrix Slug (URL)</label>
                        <input name="slug" defaultValue={editingItem.slug} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Asset Reference (Image URL)</label>
                        <input name="image" defaultValue={editingItem.image} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Sub-Matrices (Comma Separated)</label>
                        <textarea name="subcategories" defaultValue={editingItem.children?.map((c: any) => c.name).join(', ')} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 font-medium h-32 outline-none border" />
                      </div>
                      <button type="submit" className="w-full bg-primary text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-[0.98]">
                        Synchronize Matrix Changes
                      </button>
                    </form>
                  ) : (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const sizes = Array.from(formData.getAll('sizes')) as string[];
                        const images = (formData.get('images') as string).split(',').map(s => s.trim()).filter(s => s);
                        
                        updateItem('products', editingItem.id, {
                          name: formData.get('name'),
                          originalPrice: parseFloat(formData.get('originalPrice') as string),
                          price: parseFloat(formData.get('price') as string),
                          category: formData.get('category'),
                          subcategory: formData.get('subcategory'),
                          image: formData.get('image'),
                          images: images,
                          sizes: sizes,
                          rating: parseFloat(formData.get('rating') as string) || 5,
                          reviews: parseInt(formData.get('reviews') as string) || 0,
                          inStock: formData.get('inStock') === 'on',
                          description: formData.get('description'),
                          details: formData.get('details'),
                          keyFeatures: (formData.get('keyFeatures') as string).split(',').map(s => s.trim()).filter(s => s)
                        });
                      }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:gap-y-8"
                    >
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Asset Identity (Name)</label>
                        <input name="name" defaultValue={editingItem.name} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">MSRP</label>
                          <input name="originalPrice" type="number" step="1" defaultValue={editingItem.originalPrice || editingItem.actualPrice} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">LIST</label>
                          <input name="price" type="number" step="1" defaultValue={editingItem.price || editingItem.offerPrice} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Domain Path (Category)</label>
                        <select name="category" defaultValue={editingItem.category} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 font-medium appearance-none outline-none border">
                          {categories.map(c => <option key={c.id} value={c.slug} className="bg-[#0F172A]">{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Protocol Type (Subcategory)</label>
                        <input name="subcategory" defaultValue={editingItem.subcategory || editingItem.childCategory} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Master Asset URL</label>
                        <input name="image" defaultValue={editingItem.image} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                      </div>
                      <div className="flex items-center gap-4 py-4 bg-[#0F172A] px-6 rounded-2xl border border-slate-800/50">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            name="inStock"
                            defaultChecked={editingItem.inStock !== false}
                            className="size-5 rounded border-slate-800 bg-[#1E293B] text-primary focus:ring-primary/20"
                          />
                          <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-200 uppercase tracking-widest transition-colors">Operational Logic (In Stock)</span>
                        </label>
                      </div>
                      <div className="md:col-span-2 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Variant Matrix (Sizes)</label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                          {AVAILABLE_SIZES.map(size => (
                            <label key={size} className="flex items-center justify-center p-3 rounded-xl border border-slate-800 bg-[#0F172A] cursor-pointer hover:border-primary/50 transition-all has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                              <input 
                                type="checkbox" 
                                name="sizes"
                                value={size}
                                defaultChecked={editingItem.sizes?.includes(size)}
                                className="hidden"
                              />
                                <span className="text-[10px] font-black text-slate-400 peer-checked:text-primary transition-colors">{size}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Brief Description</label>
                        <textarea name="description" defaultValue={editingItem.description} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[#0F172A] border-slate-800 text-white text-sm focus:ring-2 focus:ring-primary/20 font-medium h-24 outline-none border" />
                      </div>
                      <button type="submit" className="md:col-span-2 bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-[0.98]">
                        Authorize Global Update
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
