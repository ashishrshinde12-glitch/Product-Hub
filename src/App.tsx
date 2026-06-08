import { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import AdminDashboard from './components/AdminDashboard';
import ProductPage from './components/ProductPage';
import AccessCodeGenerator from './components/AccessCodeGenerator';
import { Product } from './types';
import { ChevronDown, Instagram, Send, MessageCircle, Play, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'shop' | 'admin' | 'product' | 'access-code-generator'>('shop');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [shopTitle, setShopTitle] = useState('Ashiieditzx');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState({ whatsapp: '', telegram: '', instagram: '' });
  const [purchasedProductIds, setPurchasedProductIds] = useState<string[]>([]);
  const [isPurchasesModalOpen, setIsPurchasesModalOpen] = useState(false);
  const [howToAccessLink, setHowToAccessLink] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('purchased_products');
    if (saved) {
      try {
        setPurchasedProductIds(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading purchases:', e);
      }
    }
  }, []);

  const handlePurchase = (productId: string) => {
    setPurchasedProductIds(prev => {
      if (prev.includes(productId)) return prev;
      const next = [...prev, productId];
      localStorage.setItem('purchased_products', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setShopTitle(data.shopTitle || 'Ashiieditzx');
        setProfileImageUrl(data.profileImageUrl || '');
        setSocialLinks({
          whatsapp: data.whatsapp || '',
          telegram: data.telegram || '',
          instagram: data.instagram || ''
        });
        setHowToAccessLink(data.howToAccessLink || data.howToAccessVideo || '');
      }
    }, (err) => {
      console.error('Settings Snapshot Error:', err);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Hidden route detection: Check URL query param for emergency access
    const params = new URLSearchParams(window.location.search);
    if (params.get('access') === 'admin' || params.get('admin') === '1') {
      setView('admin');
    }
    if (params.get('view') === 'code' || params.get('code') === '1' || params.get('view') === 'utr') {
      setView('access-code-generator');
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // Sort by packNumber (ascending), then by createdAt (descending)
      const sortedProducts = [...productsData].sort((a, b) => {
        const packA = a.packNumber || 0;
        const packB = b.packNumber || 0;
        if (packA !== packB) return packA - packB;
        
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });

      setProducts(sortedProducts);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('product');
    window.scrollTo(0, 0);
  };

  if (view === 'admin') {
    return <AdminDashboard setView={setView} />;
  }

  if (view === 'access-code-generator') {
    return <AccessCodeGenerator onBack={() => setView('admin')} />;
  }

  if (view === 'product' && selectedProduct) {
    return (
      <ProductPage 
        product={selectedProduct} 
        onBack={() => setView('shop')} 
        onPurchase={handlePurchase}
        purchasedCount={purchasedProductIds.length}
        onCartClick={() => setIsPurchasesModalOpen(true)}
        shopTitle={shopTitle}
      />
    );
  }

  const purchasedProducts = products.filter(p => purchasedProductIds.includes(p.id));

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-green-500 selection:text-black">
      <Header 
        onSecretClick={() => setView('admin')} 
        purchasedCount={purchasedProductIds.length}
        onCartClick={() => setIsPurchasesModalOpen(true)}
        profileImageUrl={profileImageUrl}
        shopTitle={shopTitle}
      />
      
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-gray-500 text-xs mb-6">
          <a href="/" className="hover:text-white transition-colors">Home</a>
        </nav>

        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-bold text-green-500 tracking-tight mb-6 uppercase font-display"
        >
          {shopTitle}
        </motion.h1>

        {/* Filters and Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 mb-6 border-b border-white/5 pb-6">
          {howToAccessLink && (
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={howToAccessLink}
              target="_blank"
              rel="noopener noreferrer"
              className="relative group px-6 py-2.5 bg-green-500 text-black font-black rounded-full text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all overflow-hidden inline-flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              <div className="flex items-center gap-2">
                <Play className="w-3 h-3 fill-black" />
                How To Access
              </div>
            </motion.a>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[4/5] bg-white/5 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No products found. Add some from the admin panel!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard 
                  product={product} 
                  onClick={() => handleProductClick(product)}
                />
              </motion.div>
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-10 py-12 px-6 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-6">
            {socialLinks.whatsapp && (
              <a 
                href={`https://wa.me/${socialLinks.whatsapp}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-green-500/10 rounded-full text-green-500 hover:bg-green-500 hover:text-black transition-all shadow-lg"
                title="WhatsApp"
              >
                <MessageCircle className="w-6 h-6" />
              </a>
            )}
            {socialLinks.telegram && (
              <a 
                href={`https://t.me/${socialLinks.telegram}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-blue-500/10 rounded-full text-blue-500 hover:bg-blue-500 hover:text-black transition-all shadow-lg"
                title="Telegram"
              >
                <Send className="w-6 h-6" />
              </a>
            )}
            {socialLinks.instagram && (
              <a 
                href={`https://instagram.com/${socialLinks.instagram}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-pink-500/10 rounded-full text-pink-500 hover:bg-pink-500 hover:text-black transition-all shadow-lg"
                title="Instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
            )}
          </div>
          
            <p className="text-gray-500 text-xs cursor-default select-none">
              © 2026 {shopTitle}. All rights reserved.
            </p>
        </div>
      </footer>

      {/* My Purchases Modal */}
      <AnimatePresence>
        {isPurchasesModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPurchasesModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold tracking-tight font-display">My Purchases</h2>
                  <button 
                    onClick={() => setIsPurchasesModalOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <ChevronDown className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {purchasedProducts.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-500 text-sm">You haven't purchased any bundles yet.</p>
                    </div>
                  ) : (
                    purchasedProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                        <img 
                          src={product.image} 
                          alt={product.title} 
                          className="w-16 h-16 object-cover rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold truncate font-display">{product.title}</h3>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{product.category}</p>
                          <a 
                            href={product.successLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-green-500 text-[10px] font-bold mt-2 hover:text-green-400 transition-colors"
                          >
                            Access Bundle
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setIsPurchasesModalOpen(false)}
                  className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-3 rounded-xl mt-6 transition-colors text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
