import React, { useState } from 'react';
import { ShoppingBag, Truck, ChevronRight, Trash2, Plus, Minus, CheckCircle2, ShieldCheck, Loader2, MapPin, Phone, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { BUSINESS_PHONE } from '../constants';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const CheckoutPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, updateSize, totalPrice, totalItems, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<'cart' | 'shipping'>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shippingDetails, setShippingDetails] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    landmark: ''
  });

  const handleWhatsAppOrder = async () => {
    // Validation
    if (!shippingDetails.firstName || !shippingDetails.phone || !shippingDetails.address || !shippingDetails.city) {
      showToast('Please fill in all required shipping details', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Save to Firestore for record keeping
      const orderData = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price || item.offerPrice,
          size: item.selectedSize || 'N/A'
        })),
        total: totalPrice,
        shippingDetails,
        status: 'pending',
        createdAt: Timestamp.now()
      };
      
      await addDoc(collection(db, 'orders'), orderData);

      // 2. Construct WhatsApp Message
      const businessNumber = BUSINESS_PHONE;
      let message = `*New Order from Khushi*\n\n`;
      message += `*Customer Details:*\n`;
      message += `Name: ${shippingDetails.firstName} ${shippingDetails.lastName}\n`;
      message += `Phone: ${shippingDetails.phone}\n`;
      message += `Address: ${shippingDetails.address}, ${shippingDetails.city} - ${shippingDetails.postalCode}\n`;
      if (shippingDetails.landmark) message += `Landmark: ${shippingDetails.landmark}\n`;
      message += `\n*Order Items:*\n`;
      
      cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} x ${item.quantity} ${item.selectedSize ? `(Size: ${item.selectedSize})` : ''} - ₹${(item.price || item.offerPrice) * item.quantity}\n`;
      });

      message += `\n*Total Amount: ₹${totalPrice}*`;
      message += `\n\nPlease confirm my order. Thank you!`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${businessNumber}?text=${encodedMessage}`;

      // 3. Redirect and Clear
      showToast('Redirecting to WhatsApp...', 'success');
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        clearCart();
        navigate('/');
      }, 1500);

    } catch (err) {
      console.error(err);
      showToast('Error processing order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0 && step === 'cart') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-white">
        <div className="mb-8 opacity-50">
          <ShoppingBag size={64} strokeWidth={1} className="text-slate-900" />
        </div>
        <h2 className="text-3xl md:text-5xl font-display text-slate-900 mb-4 tracking-tight">Your bag is empty</h2>
        <p className="text-slate-500 font-light mb-10 text-center max-w-md">Looks like you haven't added any elegant pieces to your collection yet.</p>
        <Link to="/products" className="bg-slate-900 text-white px-10 py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-colors">
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Progress Header */}
        <div className="flex items-center justify-center mb-20">
          <div className="flex items-center gap-6">
            <div className={`flex flex-col items-center gap-3 ${step === 'cart' ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`size-10 rounded-full flex items-center justify-center text-[11px] font-bold border ${step === 'cart' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200'}`}>1</div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] hidden sm:block">Review Bag</span>
            </div>
            <div className="w-16 h-px bg-slate-200 -mt-5"></div>
            <div className={`flex flex-col items-center gap-3 ${step === 'shipping' ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`size-10 rounded-full flex items-center justify-center text-[11px] font-bold border ${step === 'shipping' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200'}`}>2</div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] hidden sm:block">Shipping</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          {/* Main Content */}
          <div className="lg:col-span-7 xl:col-span-8">
            <AnimatePresence mode="wait">
              {step === 'cart' ? (
                <motion.div 
                  key="cart"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                    <h1 className="text-3xl md:text-5xl font-display text-slate-900 tracking-tight">Your Selection</h1>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {cart.map((item) => (
                      <div key={`${item.id}-${item.selectedSize}`} className="flex gap-6 py-8 group">
                        <div className="size-28 sm:size-40 bg-slate-50 overflow-hidden shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex flex-col flex-1 py-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-[15px] font-medium text-slate-900 hover:text-slate-600 transition-colors line-clamp-2 pr-6">{item.name}</h3>
                            <button 
                              onClick={() => removeFromCart(item.id, item.selectedSize)}
                              className="text-slate-300 hover:text-slate-900 transition-colors p-1 -mr-2"
                            >
                              <Trash2 size={16} strokeWidth={1.5} />
                            </button>
                          </div>
                          
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                            {item.category}
                          </p>
                          
                          {/* Size Selector in Cart */}
                          {item.sizes && item.sizes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                              {item.sizes.map(size => (
                                <button
                                  key={size}
                                  onClick={() => updateSize(item.id, item.selectedSize, size)}
                                  className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest border transition-all ${
                                    item.selectedSize === size
                                      ? 'bg-slate-900 text-white border-slate-900'
                                      : 'border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900'
                                  }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                            <div className="flex items-center border border-slate-200 h-10 w-28">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize)}
                                className="px-3 h-full hover:bg-slate-50 transition-colors text-slate-500"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="flex-1 text-center text-[11px] font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize)}
                                className="px-3 h-full hover:bg-slate-50 transition-colors text-slate-500"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <span className="font-medium text-[15px] text-slate-900">₹{(item.price || item.offerPrice || 0) * item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="shipping"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                  <div className="border-b border-slate-100 pb-8">
                    <h1 className="text-3xl md:text-5xl font-display text-slate-900 tracking-tight">Shipping Details</h1>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">First Name *</label>
                      <input 
                        className="w-full border-b border-slate-200 bg-transparent px-0 py-3 text-[13px] focus:ring-0 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300" 
                        placeholder="Enter first name" 
                        value={shippingDetails.firstName}
                        onChange={e => setShippingDetails({...shippingDetails, firstName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Name</label>
                      <input 
                        className="w-full border-b border-slate-200 bg-transparent px-0 py-3 text-[13px] focus:ring-0 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300" 
                        placeholder="Enter last name" 
                        value={shippingDetails.lastName}
                        onChange={e => setShippingDetails({...shippingDetails, lastName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">WhatsApp Number *</label>
                      <input 
                        className="w-full border-b border-slate-200 bg-transparent px-0 py-3 text-[13px] focus:ring-0 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300" 
                        placeholder="Enter 10-digit number" 
                        value={shippingDetails.phone}
                        onChange={e => setShippingDetails({...shippingDetails, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">City *</label>
                      <input 
                        className="w-full border-b border-slate-200 bg-transparent px-0 py-3 text-[13px] focus:ring-0 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300" 
                        placeholder="Enter city" 
                        value={shippingDetails.city}
                        onChange={e => setShippingDetails({...shippingDetails, city: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Full Address *</label>
                      <textarea 
                        className="w-full border-b border-slate-200 bg-transparent px-0 py-3 text-[13px] focus:ring-0 focus:border-slate-900 outline-none transition-all min-h-[80px] resize-none placeholder:text-slate-300" 
                        placeholder="House No, Street, Area..." 
                        value={shippingDetails.address}
                        onChange={e => setShippingDetails({...shippingDetails, address: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Postal Code</label>
                      <input 
                        className="w-full border-b border-slate-200 bg-transparent px-0 py-3 text-[13px] focus:ring-0 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300" 
                        placeholder="6-digit PIN" 
                        value={shippingDetails.postalCode}
                        onChange={e => setShippingDetails({...shippingDetails, postalCode: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Landmark</label>
                      <input 
                        className="w-full border-b border-slate-200 bg-transparent px-0 py-3 text-[13px] focus:ring-0 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300" 
                        placeholder="Near school, hospital..." 
                        value={shippingDetails.landmark}
                        onChange={e => setShippingDetails({...shippingDetails, landmark: e.target.value})}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-5 xl:col-span-4 mt-8 lg:mt-0">
            <div className="sticky top-32 bg-slate-50 p-8 border border-slate-100">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-8 border-b border-slate-200 pb-4">Order Details</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500 font-light">Subtotal</span>
                  <span className="font-medium text-slate-900">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500 font-light">Shipping</span>
                  <span className="text-slate-900 font-medium">Complimentary</span>
                </div>
                <div className="pt-6 border-t border-slate-200 flex justify-between items-end mt-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Total</span>
                  <span className="text-2xl font-medium text-slate-900">₹{totalPrice}</span>
                </div>
              </div>

              {step === 'cart' ? (
                <button 
                  onClick={() => setStep('shipping')}
                  className="w-full bg-slate-900 text-white h-14 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 group"
                >
                  Proceed to Checkout
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <div className="space-y-4">
                  <button 
                    onClick={handleWhatsAppOrder}
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 text-white h-14 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (
                      <>
                        Place Order via WhatsApp
                        <CheckCircle2 size={14} />
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setStep('cart')}
                    className="w-full py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors border-b border-transparent hover:border-slate-900"
                  >
                    Return to Bag
                  </button>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  <ShieldCheck size={14} strokeWidth={1.5} className="text-slate-900" />
                  Secure Order Processing
                </div>
                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  <Truck size={14} strokeWidth={1.5} className="text-slate-900" />
                  Express Delivery Available
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
