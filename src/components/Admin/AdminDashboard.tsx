import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { WEARABLE_SIZES } from '../../constants';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  doc, 
  query, 
  orderBy,
  where,
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
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'products' | 'orders'>('overview');
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
  
  // New detail states
  const [prodMaterial, setProdMaterial] = useState('');
  const [prodWeight, setProdWeight] = useState('');
  const [prodSizeDetail, setProdSizeDetail] = useState('');
  const [prodAbout, setProdAbout] = useState('');

  const [orderFilter, setOrderFilter] = useState<'all' | 'today' | '24h' | '7d' | '30d' | 'custom'>('all');
  const [orderSearchDate, setOrderSearchDate] = useState('');

  const filteredOrders = orders.filter(order => {
    const orderDate = (order.createdAt as any)?.toDate();
    if (!orderDate) return false;
    
    if (orderFilter === 'custom' && orderSearchDate) {
      return orderDate.toISOString().split('T')[0] === orderSearchDate;
    }

    if (orderFilter === 'all') return true;
    
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

  // Analytics Helpers
  const getRevenueData = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const total = orders
        .filter(o => {
          const oDate = (o.createdAt as any)?.toDate();
          return oDate && oDate.toISOString().split('T')[0] === date;
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);
      return { date, total };
    });
  };

  const getOrderStatusData = () => {
    const statuses = ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    return statuses.map(status => {
      const count = orders.filter(o => (o.status || 'Processing') === status).length;
      return { status, count };
    });
  };

  const revenueData = getRevenueData();
  const statusData = getOrderStatusData();
  const todayRevenue = revenueData[revenueData.length - 1]?.total || 0;
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

  const AVAILABLE_SIZES = WEARABLE_SIZES;

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

  const wipeAndSync = async () => {
    setConfirmModal({
      show: true,
      title: 'Wipe & Resync Database',
      message: 'This will DELETE ALL categories and products from Firebase and re-load them from local constants. Are you absolutely sure?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        setLoading(true);
        try {
          // 1. Wipe Collections
          const catSnap = await getDocs(collection(db, 'categories'));
          for (const d of catSnap.docs) await deleteDoc(doc(db, 'categories', d.id));
          
          const prodSnap = await getDocs(collection(db, 'products'));
          for (const d of prodSnap.docs) await deleteDoc(doc(db, 'products', d.id));

          // 2. Load from constants
          const { CATEGORIES, PRODUCTS } = await import('../../constants');
          
          for (const cat of CATEGORIES) {
            await addDoc(collection(db, 'categories'), { 
              ...cat, 
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now() 
            });
          }

          for (const prod of PRODUCTS) {
            await addDoc(collection(db, 'products'), { 
              ...prod, 
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now() 
            });
          }

          setConfirmModal({
            show: true,
            title: 'Database Reset Complete',
            message: 'All previous data removed and fresh catalog deployed.',
            isAlert: true,
            onConfirm: () => setConfirmModal(prev => ({ ...prev, show: false }))
          });
          fetchData();
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, 'wipe-sync');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const syncWithConstants = async () => {
    setLoading(true);
    try {
      const { CATEGORIES, PRODUCTS } = await import('../../constants');
      
      // 1. Sync Categories
      for (const cat of CATEGORIES) {
        const catQuery = query(collection(db, 'categories'), where('slug', '==', cat.slug));
        const catSnap = await getDocs(catQuery);
        
        const catData = {
          name: cat.name,
          slug: cat.slug,
          children: cat.children,
          updatedAt: Timestamp.now()
        };

        if (catSnap.empty) {
          await addDoc(collection(db, 'categories'), { ...catData, createdAt: Timestamp.now() });
        } else {
          await updateDoc(doc(db, 'categories', catSnap.docs[0].id), catData);
        }
      }

      // 2. Sync Products
      for (const prod of PRODUCTS) {
        const prodQuery = query(collection(db, 'products'), where('id', '==', prod.id));
        const prodSnap = await getDocs(prodQuery);
        
        const prodData = {
          ...prod,
          updatedAt: Timestamp.now()
        };

        if (prodSnap.empty) {
          await addDoc(collection(db, 'products'), { ...prodData, createdAt: Timestamp.now() });
        } else {
          await updateDoc(doc(db, 'products', prodSnap.docs[0].id), prodData);
        }
      }

      setConfirmModal({
        show: true,
        title: 'Sync Complete',
        message: 'Successfully synchronized categories and products from constants.',
        isAlert: true,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, show: false }))
      });
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'sync');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      if (activeTab === 'categories') {
        const snap = await getDocs(query(collection(db, 'categories'), orderBy('createdAt', 'desc')));
        setCategories(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      } else if (activeTab === 'products') {
        const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
        setProducts(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        // Also need categories for the dropdown
        const catSnap = await getDocs(collection(db, 'categories'));
        setCategories(catSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      } else if (activeTab === 'orders') {
        const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        setOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
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
        price: parseFloat(prodPrice) || 0,
        originalPrice: parseFloat(prodOriginalPrice) || 0,
        category: prodCat,
        childCategory: prodSubcategory,
        image: prodImage,
        images: prodImages.split(',').map(s => s.trim()).filter(s => s),
        description: prodDesc,
        sizes: prodSizes,
        rating: parseFloat(prodRating) || 5,
        details: {
          material: prodMaterial,
          weight: prodWeight,
          size: prodSizeDetail,
          aboutProduct: prodAbout
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Reset form
      setProdName('');
      setProdOriginalPrice('');
      setProdPrice('');
      setProdCat('');
      setProdSubcategory('');
      setProdImage('');
      setProdImages('');
      setProdDesc('');
      setProdSizes([]);
      setProdMaterial('');
      setProdWeight('');
      setProdSizeDetail('');
      setProdAbout('');
      
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
      <div className="min-h-screen flex items-center justify-center bg-background-cream px-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-background-tan"
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
      <div className="min-h-screen flex items-center justify-center bg-background-cream font-sans">
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
    <div className="min-h-screen bg-white text-text-dark flex font-sans selection:bg-primary/30">
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
      <aside className={`w-72 bg-white border-r border-background-tan flex flex-col fixed h-screen z-50 shadow-2xl transition-transform duration-300 lg:translate-x-0 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-background-tan flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://res.cloudinary.com/dq7hun84m/image/upload/v1773765618/logo-main_jwi3jb.png"
              alt="Khushi Logo"
              className="size-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-black tracking-tighter text-text-dark">Khushi Admin</h1>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest italic">Management Portal</p>
            </div>
          </div>
            <button 
              onClick={() => setShowMobileSidebar(false)}
              className="lg:hidden text-black/40 hover:text-black transition-colors"
            >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-black text-black/60 uppercase tracking-[0.3em] mb-4 ml-2">Console</p>
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
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
                  : 'text-black/60 hover:bg-black/5 hover:text-black uppercase tracking-widest'
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

        <div className="p-6 border-t border-black/5">
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
      <main className="flex-1 lg:ml-72 min-h-screen bg-white text-text-dark">
        <header className="sticky top-0 z-30 bg-white border-b border-background-tan px-6 md:px-10 py-6 md:py-7 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-xl md:text-3xl font-black text-text-dark tracking-tight capitalize leading-none">{activeTab}</h2>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">
                {isAdmin ? 'System Pulse • Active' : 'Restricted Access'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-bold text-text-dark tracking-tight">{auth.currentUser?.email}</p>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Master Control</span>
            </div>
            <div className="size-10 md:size-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/20 flex items-center justify-center font-black text-white text-lg md:text-xl uppercase tracking-tighter shadow-inner">
              {auth.currentUser?.email?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 lg:p-10 max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-2">Management Terminal</p>
              <h2 className="text-3xl md:text-5xl font-black text-text-dark tracking-tighter leading-none uppercase">
                Khushi <span className="text-primary/40 italic">Box</span>
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <button 
                onClick={wipeAndSync}
                className="bg-rose-500/10 text-rose-500 px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Wipe & Hard Reset
              </button>
              <button 
                onClick={syncWithConstants}
                className="bg-primary/10 text-primary px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5 flex items-center gap-2"
              >
                <CheckCircle2 size={14} />
                Update & Patch
              </button>
              <div className="bg-secondary/10 text-secondary px-3 md:px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-secondary/20 shadow-sm animate-pulse whitespace-nowrap">
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
          {activeTab === 'overview' && (
            <motion.div key="ov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString()}`, sub: "Live Inflow", icon: ChevronUp, color: "text-emerald-500", bg: "bg-emerald-500/5" },
                  { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, sub: "INR Cumulative", icon: ShoppingBag, color: "text-primary", bg: "bg-primary/5" },
                  { label: "Total Orders", value: orders.length, sub: "Life-time Manifests", icon: Package, color: "text-blue-500", bg: "bg-blue-500/5" },
                  { label: "Avg. Ticket Size", value: `₹${Math.round(totalRevenue / (orders.length || 1)).toLocaleString()}`, sub: "Per Transaction", icon: Tags, color: "text-amber-500", bg: "bg-amber-500/5" },
                ].map((s, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-all">
                    <p className="text-[9px] font-bold text-black/40 uppercase tracking-[0.3em] mb-4">{s.label}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <h4 className="text-2xl font-black text-black tracking-tight">{s.value}</h4>
                        <p className="text-[10px] font-bold text-black/30 uppercase mt-1 tracking-widest">{s.sub}</p>
                      </div>
                      <div className={`size-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>
                        <s.icon size={18} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Bar Chart - Revenue Trend */}
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-sm font-black text-black uppercase tracking-widest">Revenue Analytics</h3>
                      <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest mt-1">Rolling 7-Day Performance</p>
                    </div>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
                    {revenueData.map((d, i) => {
                      const maxTotal = Math.max(...revenueData.map(r => r.total), 1);
                      const height = (d.total / maxTotal) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                          <motion.div 
                            initial={{ height: 0 }} 
                            animate={{ height: `${height}%` }}
                            className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 relative overflow-hidden ${i === revenueData.length - 1 ? 'bg-primary' : 'bg-primary/20 hover:bg-primary/40'}`}
                          >
                            {/* SVG Pattern for texture */}
                            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <line x1="0" y1="0" x2="100" y2="100" stroke="white" strokeWidth="2" />
                            </svg>
                          </motion.div>
                          <p className="text-[8px] font-bold text-black/40 uppercase mt-3 tracking-tighter whitespace-nowrap overflow-hidden max-w-full">
                            {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                          {/* Tooltip */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            ₹{d.total.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pie Chart - Status Mix */}
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-black/5 shadow-sm flex flex-col">
                  <h3 className="text-sm font-black text-black uppercase tracking-widest mb-2">Order Matrix</h3>
                  <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-8">Status Distribution</p>
                  
                  <div className="relative size-48 mx-auto mb-8">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {statusData.map((d, i) => {
                        const total = orders.length || 1;
                        const prevTotal = statusData.slice(0, i).reduce((sum, curr) => sum + curr.count, 0);
                        const start = (prevTotal / total) * 100;
                        const length = (d.count / total) * 100;
                        const colors = ['#800000', '#D4AF37', '#059669', '#3B82F6', '#F43F5E'];
                        
                        return (
                          <motion.circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={colors[i]}
                            strokeWidth="12"
                            strokeDasharray={`${length} ${100 - length}`}
                            strokeDashoffset={-start}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="transition-all hover:stroke-[15] cursor-help"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-black leading-none">{orders.length}</span>
                      <span className="text-[8px] font-bold text-black/30 uppercase tracking-widest mt-1">Volume</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {statusData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full" style={{ backgroundColor: ['#800000', '#D4AF37', '#059669', '#3B82F6', '#F43F5E'][i] }} />
                          <span className="text-[9px] font-bold text-black/60 uppercase tracking-widest">{d.status}</span>
                        </div>
                        <span className="text-[9px] font-black text-black">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'categories' && (
            <motion.div key="cat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 md:space-y-12">
              <form onSubmit={addCategory} className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-black/5 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="md:col-span-2 lg:col-span-3 flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-black tracking-tight">Expand the Catalog</h3>
                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-[0.3em] mt-1">Register new matrix entry</p>
                  </div>
                  <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                    <Plus size={24} />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 ml-1">Designation</label>
                  <input value={catName} onChange={e => setCatName(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-black/10 text-black text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium outline-none border" placeholder="e.g. LUXURY APPAREL" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 ml-1">Matrix Slug</label>
                  <input value={catSlug} onChange={e => setCatSlug(e.target.value)} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-black/10 text-black text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium outline-none border" placeholder="e.g. luxury-apparel" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 ml-1">Asset URL</label>
                  <input value={catImage} onChange={e => setCatImage(e.target.value)} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-black/10 text-black text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium outline-none border" placeholder="https://..." />
                </div>
                <div className="space-y-3 md:col-span-2 lg:col-span-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 ml-1">Initial Sub-Matrices (Comma separated)</label>
                  <textarea value={catSubcats} onChange={e => setCatSubcats(e.target.value)} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-black/10 text-black text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium h-24 outline-none border resize-none" placeholder="e.g. Mugs, Frames, Clocks" />
                </div>
                <button type="submit" className="md:col-span-2 lg:col-span-3 bg-primary text-white py-4 md:py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-[0.98] flex items-center justify-center gap-3">
                  Initialize Category Matrix
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-black/5 flex flex-col md:flex-row shadow-sm hover:shadow-xl transition-all duration-500 group min-h-[300px]">
                    {/* Visual Side */}
                    <div className="w-full md:w-2/5 relative overflow-hidden bg-slate-100">
                      <img src={cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute bottom-6 left-6">
                        <h4 className="text-xl font-black text-white tracking-tight">{cat.name}</h4>
                        <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.2em] mt-1">{cat.slug}</p>
                      </div>
                      
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => setEditingItem({ type: 'category', ...cat })}
                          className="size-10 bg-white rounded-xl text-black hover:bg-primary hover:text-white transition-all flex items-center justify-center shadow-xl"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteItem('categories', cat.id)} 
                          className="size-10 bg-white rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-xl"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Content Side */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col bg-white">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest">Sub-Matrix Inventory</p>
                          <p className="text-sm font-black text-black">{cat.children?.length || 0} ACTIVE LAYERS</p>
                        </div>
                        <button 
                          onClick={() => setShowSubcatForm(showSubcatForm === cat.id ? null : cat.id)}
                          className={`size-10 rounded-xl flex items-center justify-center transition-all ${showSubcatForm === cat.id ? 'bg-black text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-[160px] custom-scrollbar mb-4">
                        <div className="flex flex-wrap gap-2">
                          {cat.children?.map((child: any) => (
                            <div key={child.id} className="group/item flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-black/5 hover:border-primary/20 transition-all">
                              <span className="text-[10px] font-bold text-black/60 group-hover/item:text-primary transition-colors">{child.name}</span>
                              <button 
                                onClick={() => deleteSubcategory(cat.id, child.id, cat.children)}
                                className="text-black/20 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-all"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          {(!cat.children || cat.children.length === 0) && (
                            <div className="w-full py-8 border border-dashed border-black/10 rounded-2xl flex flex-col items-center justify-center gap-2 opacity-40">
                              <ImageIcon size={20} />
                              <span className="text-[9px] font-bold uppercase tracking-widest">No Sub-Matrices</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {showSubcatForm === cat.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 border-t border-black/5 flex flex-col gap-3">
                              <textarea 
                                value={newSubcatName} 
                                onChange={e => setNewSubcatName(e.target.value)}
                                placeholder="Enter matrices (comma separated)..."
                                className="w-full text-xs px-4 py-3 rounded-xl bg-slate-50 border border-black/10 text-black h-20 outline-none focus:ring-2 focus:ring-primary/10"
                              />
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setShowSubcatForm(null)}
                                  className="flex-1 bg-slate-100 text-black/60 text-[10px] font-bold py-3 rounded-xl uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => addSubcategory(cat.id, cat.children)}
                                  className="flex-1 bg-primary text-white text-[10px] font-bold py-3 rounded-xl uppercase tracking-widest shadow-lg shadow-primary/10 hover:bg-primary-dark transition-all"
                                >
                                  Register
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div key="prod" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <form onSubmit={addProduct} className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-black/5 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="md:col-span-2 flex items-center justify-between">
                  <h3 className="text-lg md:text-xl font-black text-black tracking-tight">Index New Product</h3>
                  <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                    <Plus size={20} />
                  </div>
                </div>
                
                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 ml-1">Product Title</label>
                  <input value={prodName} onChange={e => setProdName(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-black/10 text-black text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium outline-none border" placeholder="E.G. SIGNATURE COLLECTION" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 md:col-span-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 ml-1">MSRP (₹)</label>
                    <input type="number" step="1" value={prodOriginalPrice} onChange={e => setProdOriginalPrice(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-black/10 text-black text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none border" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 ml-1">Listing Price (₹)</label>
                    <input type="number" step="1" value={prodPrice} onChange={e => setProdPrice(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-black/10 text-black text-sm focus:ring-2 focus:ring-primary/10 transition-all outline-none border" />
                  </div>
                </div>
                
                <div className="space-y-3 md:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 ml-1">Core Matrix (Category)</label>
                  <select value={prodCat} onChange={e => setProdCat(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-black/10 text-black text-sm focus:ring-2 focus:ring-primary/10 transition-all font-medium appearance-none outline-none border">
                    <option value="" className="bg-white">Select Domain</option>
                    {categories.map(c => <option key={c.id} value={c.slug} className="bg-white">{c.name}</option>)}
                  </select>
                </div>
                
                <div className="space-y-3 md:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 ml-1">Sub-Matrix (Subcategory)</label>
                  <select value={prodSubcategory} onChange={e => setProdSubcategory(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-black/10 text-black text-sm focus:ring-2 focus:ring-primary/10 appearance-none outline-none border">
                    <option value="" className="bg-white">Select Protocol</option>
                    {categories.find(c => c.slug === prodCat)?.children?.map((child: any) => (
                      <option key={child.id} value={child.slug} className="bg-white">{child.name}</option>
                    ))}
                  </select>
                </div>

                {prodCat === 'wearables' && (
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 ml-1">Variant Matrix (Sizes)</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {WEARABLE_SIZES.map(size => (
                        <label key={size} className="flex items-center justify-center p-3 rounded-xl border border-black/5 bg-white cursor-pointer hover:border-primary/50 transition-all">
                          <input
                            type="checkbox"
                            value={size}
                            checked={prodSizes.includes(size)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setProdSizes(prev => checked ? [...prev, size] : prev.filter(s => s !== size));
                            }}
                            className="hidden"
                          />
                          <span className={`text-[10px] font-black transition-colors ${prodSizes.includes(size) ? 'text-primary' : 'text-black/40'}`}>
                            {size}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 ml-1">Primary Asset URL</label>
                  <input value={prodImage} onChange={e => setProdImage(e.target.value)} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-black/10 text-black text-sm focus:ring-2 focus:ring-primary/10 outline-none border" placeholder="HTTPS://..." />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 ml-1">Gallery Images (comma separated URLs)</label>
                  <input value={prodImages} onChange={e => setProdImages(e.target.value)} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-black/10 text-black text-sm focus:ring-2 focus:ring-primary/10 outline-none border" placeholder="https://... , https://..." />
                  <p className="text-[10px] text-black/40">Add 2-4 image links for the product gallery (optional, comma-separated).</p>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 ml-1">Description</label>
                  <textarea value={prodDesc} onChange={e => setProdDesc(e.target.value)} rows={3} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-black/10 text-black text-sm focus:ring-2 focus:ring-primary/10 outline-none border" placeholder="Add the product description" />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 ml-1">Specifications (Details Object)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input value={prodMaterial} onChange={e => setProdMaterial(e.target.value)} className="w-full px-5 py-3.5 rounded-xl bg-white border-black/10 text-black text-sm outline-none border" placeholder="Material (e.g. Magnetic)" />
                    <input value={prodWeight} onChange={e => setProdWeight(e.target.value)} className="w-full px-5 py-3.5 rounded-xl bg-white border-black/10 text-black text-sm outline-none border" placeholder="Weight (e.g. 15 Grams)" />
                    <input value={prodSizeDetail} onChange={e => setProdSizeDetail(e.target.value)} className="w-full px-5 py-3.5 rounded-xl bg-white border-black/10 text-black text-sm outline-none border" placeholder="Size (e.g. 3 inch)" />
                    <input value={prodRating} onChange={e => setProdRating(e.target.value)} type="number" step="0.1" className="w-full px-5 py-3.5 rounded-xl bg-white border-black/10 text-black text-sm outline-none border" placeholder="Rating (0-5)" />
                  </div>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 ml-1">About Product</label>
                  <textarea value={prodAbout} onChange={e => setProdAbout(e.target.value)} rows={3} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-black/10 text-black text-sm focus:ring-2 focus:ring-primary/10 outline-none border" placeholder="Detailed product story..." />
                </div>

                <button type="submit" className="md:col-span-2 bg-primary text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-[0.98] flex items-center justify-center gap-3">
                   {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                   {loading ? 'Processing...' : 'Deploy Product'}
                </button>
              </form>

              <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-black/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left min-w-[800px] md:min-w-0">
                    <thead className="bg-background-cream border-b border-black/5">
                      <tr>
                        <th className="px-6 md:px-10 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.3em] text-black/40">Asset Profile</th>
                        <th className="px-6 md:px-10 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.3em] text-black/40 hidden sm:table-cell">Matrix Mapping</th>
                        <th className="px-6 md:px-10 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.3em] text-black/40">Valuation</th>
                        <th className="px-6 md:px-10 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.3em] text-black/40">Rating</th>
                        <th className="px-6 md:px-10 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.3em] text-black/40 text-right">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {products.map(prod => (
                        <tr key={prod.id} className="hover:bg-background-cream transition-colors group">
                          <td className="px-6 md:px-10 py-5 md:py-6">
                            <div className="flex items-center gap-4 md:gap-6">
                              <div className="size-12 md:size-16 rounded-xl md:rounded-2xl bg-white border border-black/5 overflow-hidden shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <img src={prod.image} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-black text-black tracking-tight truncate max-w-[150px] md:max-w-none">{prod.name}</span>
                                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${prod.inStock !== false ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}`}>
                                  {prod.inStock !== false ? 'Online' : 'Offline'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 md:px-10 py-5 md:py-6 hidden sm:table-cell">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-black/20 uppercase tracking-widest">{prod.category}</span>
                              <span className="text-[10px] text-black/40 font-bold uppercase tracking-[0.2em] mt-1">{prod.subcategory || prod.childCategory}</span>
                            </div>
                          </td>
                          <td className="px-6 md:px-10 py-5 md:py-6">
                            <div className="flex flex-col">
                              <span className="text-base md:text-lg font-black text-black">₹{prod.price || prod.offerPrice}</span>
                              {(prod.originalPrice || prod.actualPrice) && (
                                <span className="text-[9px] md:text-[10px] text-black/40 line-through tracking-widest font-bold uppercase truncate">₹{prod.originalPrice || prod.actualPrice}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 md:px-10 py-5 md:py-6">
                            <span className="text-[11px] font-black text-black">{(prod.rating || 0).toFixed(1)} ⭐</span>
                            <p className="text-[9px] text-black/40">({prod.reviews || 0} reviews)</p>
                          </td>
                          <td className="px-6 md:px-10 py-5 md:py-6 text-right">
                            <div className="flex gap-2 md:gap-4 justify-end">
                              <button 
                                onClick={() => setEditingItem({ type: 'product', ...prod })}
                                className="size-9 md:size-10 bg-background-cream rounded-lg md:rounded-xl flex items-center justify-center text-black/40 hover:text-primary hover:bg-primary/10 transition-all border border-black/5 shadow-sm"
                              >
                                <Edit2 size={16} className="md:w-[18px] md:h-[18px]" />
                              </button>
                              <button onClick={() => deleteItem('products', prod.id)} className="size-9 md:size-10 bg-slate-100 rounded-lg md:rounded-xl flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-rose-100 transition-all border border-slate-200 shadow-sm">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-200 shadow-lg relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 p-4 md:p-8 text-slate-100 group-hover:text-slate-200 transition-colors">
                    <ShoppingBag size={80} className="md:w-[120px] md:h-[120px]" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-2 md:mb-4">Today's Activity</p>
                  <div className="flex items-baseline gap-2 md:gap-3">
                    <span className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">₹{todayRevenue.toLocaleString()}</span>
                    <span className="text-[10px] md:text-sm font-bold text-emerald-500 uppercase tracking-widest leading-none">Payments</span>
                  </div>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-200 shadow-lg relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 p-4 md:p-8 text-slate-100 group-hover:text-slate-200 transition-colors">
                    <LayoutDashboard size={80} className="md:w-[120px] md:h-[120px]" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-2 md:mb-4">Total Revenue</p>
                  <div className="flex items-baseline gap-2 md:gap-3">
                    <span className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">₹{totalRevenue.toLocaleString()}</span>
                    <span className="text-[10px] md:text-sm font-bold text-primary uppercase tracking-widest leading-none">Net Gross</span>
                  </div>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-200 shadow-lg relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 p-4 md:p-8 text-slate-100 group-hover:text-slate-200 transition-colors">
                    <Package size={80} className="md:w-[120px] md:h-[120px]" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-2 md:mb-4">Order Volume</p>
                  <div className="flex items-baseline gap-2 md:gap-3">
                    <span className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">{orders.length}</span>
                    <span className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Records</span>
                  </div>
                </div>
              </div>

              {/* Filter Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white p-3 rounded-2xl md:rounded-3xl border border-slate-200">
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 flex-1 md:flex-none">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'today', label: 'Today' },
                      { id: '7d', label: '7d' },
                      { id: '30d', label: '30d' },
                      { id: 'custom', label: 'Custom' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setOrderFilter(f.id as any)}
                        className={`px-4 md:px-5 py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] transition-all whitespace-nowrap ${
                          orderFilter === f.id 
                            ? 'bg-primary text-white shadow-md' 
                            : 'text-slate-500 hover:text-primary'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {orderFilter === 'custom' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex-1 max-w-xs">
                      <input 
                        type="date" 
                        value={orderSearchDate}
                        onChange={(e) => setOrderSearchDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                      />
                    </motion.div>
                  )}
                  
                  <div className="flex-1 text-right hidden md:block">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Displaying {filteredOrders.length} of {orders.length} Transmissions
                    </p>
                  </div>
                </div>

              {/* Orders List */}
              <div className="space-y-6 md:space-y-8">
                {filteredOrders.map(order => (
                  <div key={order.id} className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-200 shadow-lg flex flex-col xl:flex-row justify-between gap-8 md:gap-12 group hover:border-primary/30 transition-all duration-500">
                    <div className="flex-1 space-y-6 md:space-y-8">
                      <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        <div className="px-3 md:px-4 py-1.5 md:py-2 bg-primary/10 border border-primary/20 rounded-lg md:rounded-xl">
                          <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-[0.3em]">ID: {order.id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="relative group/status">
                          <select 
                            value={order.status || 'Processing'}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`pl-3 pr-8 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] appearance-none cursor-pointer outline-none transition-all ${
                              order.status === 'Shipped' || order.status === 'Delivered' 
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                                : order.status === 'Cancelled'
                                  ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            }`}
                          >
                            <option value="Processing">Processing</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                        </div>
                        <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest sm:ml-auto w-full sm:w-auto">
                          {(order.createdAt as any)?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        <div className="space-y-3 md:space-y-4">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Client Profile</p>
                          <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 space-y-3">
                            <p className="text-base md:text-lg font-black text-slate-900">{order.shippingDetails?.firstName} {order.shippingDetails?.lastName}</p>
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
                              <div key={i} className="flex items-center gap-3 md:gap-4 bg-white p-3 rounded-xl md:rounded-2xl border border-slate-200 group/item hover:border-primary/20 transition-all">
                                <div className="size-12 md:size-14 rounded-lg md:rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                                  <img src={item.image || (item.imageUrl)} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] md:text-xs font-black text-slate-900 truncate">{item.name}</p>
                                  <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                    Qty: {item.quantity} {item.size && item.size !== 'N/A' && <span className="mx-1.5 text-primary">• {item.size}</span>}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-black text-slate-900">₹{(item.price || 0) * (item.quantity || 1)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full xl:w-64 flex flex-col sm:flex-row xl:flex-col justify-between items-stretch sm:items-end xl:items-end border-t xl:border-t-0 xl:border-l border-slate-800/50 pt-8 xl:pt-0 xl:pl-8 gap-6">
                      <div className="text-left sm:text-right space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Order Total</p>
                        <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">₹{order.total?.toLocaleString()}</p>
                      </div>
                      
                      <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                        order.status === 'Shipped' || order.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {order.status || 'Processing'}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredOrders.length === 0 && (
                  <div className="text-center py-32 bg-slate-100 rounded-[3rem] border border-dashed border-slate-300">
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="bg-white w-full max-w-md rounded-3xl md:rounded-[2.5rem] border border-slate-200 shadow-2xl p-6 md:p-10 text-center"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 40 }}
                className="bg-white w-full max-w-2xl rounded-3xl md:rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-5 md:p-8 border-b border-slate-200 flex justify-between items-center bg-white">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="size-9 md:size-10 bg-primary/10 rounded-lg md:rounded-xl flex items-center justify-center text-primary border border-primary/20">
                      <Edit2 size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px] md:text-xs">
                        Refine {editingItem.type}
                      </h3>
                      <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Authorized Modification Portal</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingItem(null)} className="size-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-primary hover:text-white transition-all border border-slate-200 shadow-sm group">
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
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
                        <input name="name" defaultValue={editingItem.name} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Matrix Slug (URL)</label>
                        <input name="slug" defaultValue={editingItem.slug} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Asset Reference (Image URL)</label>
                        <input name="image" defaultValue={editingItem.image} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Sub-Matrices (Comma Separated)</label>
                        <textarea name="subcategories" defaultValue={editingItem.children?.map((c: any) => c.name).join(', ')} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-primary/20 font-medium h-32 outline-none border" />
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
                          price: parseFloat(formData.get('price') as string),
                          originalPrice: parseFloat(formData.get('originalPrice') as string),
                          category: formData.get('category'),
                          childCategory: formData.get('subcategory'),
                          image: formData.get('image'),
                          images: images,
                          rating: parseFloat(formData.get('rating') as string) || 5,
                          description: formData.get('description'),
                          sizes: sizes,
                          details: {
                            material: formData.get('material') as string,
                            weight: formData.get('weight') as string,
                            size: formData.get('size') as string,
                            aboutProduct: formData.get('aboutProduct') as string
                          },
                          updatedAt: Timestamp.now()
                        });
                      }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 md:gap-y-8"
                    >
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Asset Identity (Name)</label>
                        <input name="name" defaultValue={editingItem.name} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">MSRP</label>
                          <input name="originalPrice" type="number" step="1" defaultValue={editingItem.originalPrice || editingItem.actualPrice} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">LIST</label>
                          <input name="price" type="number" step="1" defaultValue={editingItem.price || editingItem.offerPrice} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Domain Path (Category)</label>
                        <select name="category" defaultValue={editingItem.category} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-primary/20 font-medium appearance-none outline-none border">
                          {categories.map(c => <option key={c.id} value={c.slug} className="bg-white">{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Protocol Type (Subcategory)</label>
                        <input name="subcategory" defaultValue={editingItem.subcategory || editingItem.childCategory} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Master Asset URL</label>
                        <input name="image" defaultValue={editingItem.image} required className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Gallery Images (comma separated URLs)</label>
                        <input name="images" defaultValue={editingItem.images?.join(', ')} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-primary/20 font-medium outline-none border" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Material</label>
                          <input name="material" defaultValue={editingItem.details?.material} className="w-full px-5 py-3.5 rounded-xl bg-white border-slate-200 text-slate-900 text-sm outline-none border" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Weight</label>
                          <input name="weight" defaultValue={editingItem.details?.weight} className="w-full px-5 py-3.5 rounded-xl bg-white border-slate-200 text-slate-900 text-sm outline-none border" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Size Spec</label>
                          <input name="size" defaultValue={editingItem.details?.size} className="w-full px-5 py-3.5 rounded-xl bg-white border-slate-200 text-slate-900 text-sm outline-none border" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Rating</label>
                          <input name="rating" type="number" step="0.1" defaultValue={editingItem.rating} className="w-full px-5 py-3.5 rounded-xl bg-white border-slate-200 text-slate-900 text-sm outline-none border" />
                        </div>
                      </div>
                      
                      {editingItem.category === 'wearables' && (
                        <div className="md:col-span-2 space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Variant Matrix (Sizes)</label>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {WEARABLE_SIZES.map(size => (
                              <label key={size} className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-primary/50 transition-all">
                                <input
                                  type="checkbox"
                                  name="sizes"
                                  value={size}
                                  defaultChecked={editingItem.sizes?.includes(size)}
                                  className="accent-primary"
                                />
                                <span className="text-[10px] font-bold text-slate-700">{size}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">About Product (Detailed)</label>
                        <textarea name="aboutProduct" defaultValue={editingItem.details?.aboutProduct} className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white border-slate-200 text-slate-800 text-sm focus:ring-2 focus:ring-primary/20 font-medium h-32 outline-none border" />
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
