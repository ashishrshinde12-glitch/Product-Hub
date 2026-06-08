import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp, 
  setDoc,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Product, PaymentSubmission, Testimonial, FAQ, EarningsProof, PreviewVideo } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Package, 
  Image as ImageIcon, 
  IndianRupee, 
  CheckCircle, 
  XCircle, 
  Video, 
  Clock, 
  Palette, 
  Layout,
  LogOut,
  Key,
  ExternalLink,
  Settings,
  RefreshCw,
  HelpCircle,
  MessageSquare,
  Star,
  Sparkles,
  DollarSign,
  TrendingUp,
  TrendingDown,
  User,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  setView: (view: 'shop' | 'admin' | 'product' | 'access-code-generator') => void;
}

export default function AdminDashboard({ setView }: AdminDashboardProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('admin_auth') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // Collections data
  const [products, setProducts] = useState<Product[]>([]);
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [previewVideos, setPreviewVideos] = useState<PreviewVideo[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [proofs, setProofs] = useState<EarningsProof[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'payments' | 'alerts' | 'videos' | 'testimonials' | 'faqs' | 'proofs' | 'analytics' | 'settings'>('analytics');
  
  const [siteSettings, setSiteSettings] = useState({ 
    shopTitle: 'ASHX GROW',
    whatsapp: '',
    telegram: '',
    instagram: '',
    howToAccessLink: '',
    profileImageUrl: '',
    adminPassword: 'Ashish12@@',
    heroHeadline: '',
    heroSubheadline: ''
  });

  // Upload limits and stats
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals management
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<PreviewVideo | null>(null);

  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);

  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [editingProof, setEditingProof] = useState<EarningsProof | null>(null);

  // Product Form Data
  const [productForm, setProductForm] = useState({
    title: '',
    category: 'DIGITAL PRODUCT',
    image: '',
    description: '',
    originalPrice: 0,
    salePrice: 0,
    isSale: true,
    buttonText: 'GET FULL BUNDLE NOW',
    buttonLink: '',
    successLink: '',
    timerDuration: 30,
    isTimerEnabled: true,
    demoVideoLinks: ['', '', ''],
    packNumber: 0,
    customization: {
      themeColor: '#A855F7',
      headingText: '',
      showTimer: true,
      showVideos: true,
    }
  });

  // Other Sub-forms
  const [videoForm, setVideoForm] = useState({ title: '', videoUrl: '' });
  const [testimonialForm, setTestimonialForm] = useState({ name: '', role: '', avatarUrl: '', text: '', rating: 5 });
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', order: 0 });
  const [proofForm, setProofForm] = useState({ imageUrl: '', caption: '' });

  // Read Site Settings
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSiteSettings({
          shopTitle: data.shopTitle || 'ASHX GROW',
          whatsapp: data.whatsapp || '',
          telegram: data.telegram || '',
          instagram: data.instagram || '',
          howToAccessLink: data.howToAccessLink || data.howToAccessVideo || '',
          profileImageUrl: data.profileImageUrl || '',
          adminPassword: data.adminPassword || 'Ashish12@@',
          heroHeadline: data.heroHeadline || '',
          heroSubheadline: data.heroSubheadline || ''
        });
      }
    }, (err) => {
      console.error('Settings Snapshot Error:', err);
    });
    return () => unsubscribe();
  }, []);

  // Sync Snapshot Listeners for Collections
  useEffect(() => {
    setLoading(true);

    const qProd = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProd = onSnapshot(qProd, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(list.sort((a, b) => (a.packNumber || 0) - (b.packNumber || 0)));
      setLoading(false);
    }, (err) => console.error('Products Error:', err));

    const qSub = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const unsubscribeSub = onSnapshot(qSub, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PaymentSubmission[];
      setSubmissions(list);
    }, (err) => console.error('Payments Error:', err));

    const qAlerts = query(collection(db, 'payment_alerts'), orderBy('createdAt', 'desc'));
    const unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlerts(list);
    }, (err) => console.error('Alerts Error:', err));

    const qVideos = query(collection(db, 'preview_videos'), orderBy('createdAt', 'desc'));
    const unsubscribeVideos = onSnapshot(qVideos, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PreviewVideo[];
      setPreviewVideos(list);
    }, (err) => console.error('Videos Error:', err));

    const qTestimonials = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
    const unsubscribeTestimonials = onSnapshot(qTestimonials, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Testimonial[];
      setTestimonials(list);
    }, (err) => console.error('Testimonials Error:', err));

    const qFaqs = query(collection(db, 'faqs'), orderBy('order', 'asc'));
    const unsubscribeFaqs = onSnapshot(qFaqs, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FAQ[];
      setFaqs(list);
    }, (err) => console.error('FAQs Error:', err));

    const qProofs = query(collection(db, 'earnings_proof'), orderBy('createdAt', 'desc'));
    const unsubscribeProofs = onSnapshot(qProofs, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EarningsProof[];
      setProofs(list);
    }, (err) => console.error('Proofs Error:', err));

    return () => {
      unsubscribeProd();
      unsubscribeSub();
      unsubscribeAlerts();
      unsubscribeVideos();
      unsubscribeTestimonials();
      unsubscribeFaqs();
      unsubscribeProofs();
    };
  }, []);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === siteSettings.adminPassword) {
      setIsLoggedIn(true);
      sessionStorage.setItem('admin_auth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  // General image processor (base64 compress for profile & product previews)
  const handleImageZipUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'product' | 'profile' | 'proof' | 'testimonial') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_SIZE = 900;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', 0.6);
        if (field === 'product') {
          setProductForm(prev => ({ ...prev, image: compressed }));
        } else if (field === 'profile') {
          setSiteSettings(prev => ({ ...prev, profileImageUrl: compressed }));
        } else if (field === 'proof') {
          setProofForm(prev => ({ ...prev, imageUrl: compressed }));
        } else if (field === 'testimonial') {
          setTestimonialForm(prev => ({ ...prev, avatarUrl: compressed }));
        }
        setUploading(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Safe file uploader to Firebase Storage (for high-fidelity previews & videos)
  const handleFirebaseFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'proof') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const folder = type === 'video' ? 'videos' : 'proofs';
      const storageRef = ref(storage, `${folder}/${Date.now()}_val.${fileExt}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(pct);
        },
        (err) => {
          console.error(err);
          setError('Storage Upload Error: ' + err.message);
          setUploading(false);
          setUploadProgress(null);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (type === 'video') {
              setVideoForm(prev => ({ ...prev, videoUrl: downloadUrl }));
            } else if (type === 'proof') {
              setProofForm(prev => ({ ...prev, imageUrl: downloadUrl }));
            }
            setUploading(false);
            setUploadProgress(null);
            setSuccess('File uploaded to storage successfully!');
            setTimeout(() => setSuccess(null), 3000);
          } catch (e: any) {
            console.error(e);
            setError('Error resolving URL: ' + e.message);
            setUploading(false);
            setUploadProgress(null);
          }
        }
      );
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  const handleProductVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const storageRef = ref(storage, `products/videos/${Date.now()}_val.${fileExt}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(pct);
        },
        (err) => {
          console.error(err);
          setError('Storage Upload Error: ' + err.message);
          setUploading(false);
          setUploadProgress(null);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            const newLinks = [...productForm.demoVideoLinks];
            newLinks[index] = downloadUrl;
            setProductForm({ ...productForm, demoVideoLinks: newLinks });
            setUploading(false);
            setUploadProgress(null);
            setSuccess('Product video uploaded successfully!');
            setTimeout(() => setSuccess(null), 3000);
          } catch (e: any) {
             console.error(e);
             setError('Error resolving URL: ' + e.message);
             setUploading(false);
             setUploadProgress(null);
          }
        }
      );
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  // CRUD Actions
  const handleSaveSettings = async () => {
    try {
      setUploading(true);
      await setDoc(doc(db, 'settings', 'site'), {
        ...siteSettings,
        updatedAt: Timestamp.now()
      }, { merge: true });
      setSuccess('Website settings updated successfully.');
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError('Save failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Product submission
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!productForm.title.trim()) return;

    try {
      const data = {
        ...productForm,
        originalPrice: Number(productForm.originalPrice) || 0,
        salePrice: Number(productForm.salePrice) || 0,
        timerDuration: Number(productForm.timerDuration) || 30,
        packNumber: Number(productForm.packNumber) || 0,
        createdAt: editingProduct ? editingProduct.createdAt : Timestamp.now()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
        setSuccess('Product updated!');
      } else {
        await addDoc(collection(db, 'products'), data);
        setSuccess('Product added successfully!');
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({
        title: '', category: 'DIGITAL PRODUCT', image: '', description: '', originalPrice: 0, salePrice: 0,
        isSale: true, buttonText: 'GET FULL BUNDLE NOW', buttonLink: '', successLink: '', timerDuration: 30,
        isTimerEnabled: true, demoVideoLinks: ['', '', ''], packNumber: 0, customization: { themeColor: '#A855F7', headingText: '', showTimer: true, showVideos: true }
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Videos CRUD
  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.title || !videoForm.videoUrl) return;
    try {
      if (editingVideo) {
        await updateDoc(doc(db, 'preview_videos', editingVideo.id), { ...videoForm });
      } else {
        await addDoc(collection(db, 'preview_videos'), { ...videoForm, createdAt: Timestamp.now() });
      }
      setIsVideoModalOpen(false);
      setEditingVideo(null);
      setVideoForm({ title: '', videoUrl: '' });
    } catch (err: any) { setError(err.message); }
  };

  // Testimonials CRUD
  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.name || !testimonialForm.text) return;
    try {
      if (editingTestimonial) {
        await updateDoc(doc(db, 'testimonials', editingTestimonial.id), { ...testimonialForm });
      } else {
        await addDoc(collection(db, 'testimonials'), { ...testimonialForm, createdAt: Timestamp.now() });
      }
      setIsTestimonialModalOpen(false);
      setEditingTestimonial(null);
      setTestimonialForm({ name: '', role: '', avatarUrl: '', text: '', rating: 5 });
    } catch (err: any) { setError(err.message); }
  };

  // FAQ CRUD
  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.question || !faqForm.answer) return;
    try {
      const data = { ...faqForm, order: Number(faqForm.order) || 0 };
      if (editingFaq) {
        await updateDoc(doc(db, 'faqs', editingFaq.id), data);
      } else {
        await addDoc(collection(db, 'faqs'), { ...data, createdAt: Timestamp.now() });
      }
      setIsFaqModalOpen(false);
      setEditingFaq(null);
      setFaqForm({ question: '', answer: '', order: 0 });
    } catch (err: any) { setError(err.message); }
  };

  // Proofs CRUD
  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofForm.imageUrl) return;
    try {
      if (editingProof) {
        await updateDoc(doc(db, 'earnings_proof', editingProof.id), { ...proofForm });
      } else {
        await addDoc(collection(db, 'earnings_proof'), { ...proofForm, createdAt: Timestamp.now() });
      }
      setIsProofModalOpen(false);
      setEditingProof(null);
      setProofForm({ imageUrl: '', caption: '' });
    } catch (err: any) { setError(err.message); }
  };

  const deleteItem = async (col: string, id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, col, id));
      } catch (e: any) {
        console.error(e);
        alert('Failed to delete: ' + e.message);
      }
    }
  };

  const clearAlerts = async () => {
    if (window.confirm('Clear all alerts memory?')) {
      try {
        for (const a of alerts) {
          await deleteDoc(doc(db, 'payment_alerts', a.id));
        }
      } catch (e: any) {
        console.error(e);
        alert('Failed to clear: ' + e.message);
      }
    }
  };

  const updateSubmissionStatus = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'payments', id), { status });
    } catch (e: any) {
      console.error(e);
      alert('Failed to update status: ' + e.message);
    }
  };

  // Compute stats for analytics dashboard
  const analyticsStats = {
    totalRevenue: submissions.reduce((sum, item) => sum + (item.amount || 0), 0),
    totalOrders: submissions.length,
    clickedCount: alerts.filter(a => a.type === 'PAYMENT_INTENT').length,
    failedAttempts: alerts.filter(a => a.type === 'FAILURE').length
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center p-6 text-white font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0E0E13] border border-white/[0.08] p-8 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(168,85,247,0.15)]"
        >
          <div className="text-center mb-8">
            <div className="mx-auto bg-purple-500/10 border border-purple-500/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Key className="text-purple-400 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black font-display uppercase tracking-wider">ASHX GROW</h1>
            <p className="text-gray-500 text-xs mt-1">Admin Panel Security Gate</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter Admin Password"
              className={`w-full bg-black border ${loginError ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3.5 text-xs text-white focus:border-purple-500 outline-none transition-all uppercase tracking-widest text-center`}
              autoFocus
            />
            {loginError && <p className="text-red-500 text-[10px] uppercase font-bold text-center">Incorrect password.</p>}
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] duration-300"
            >
              Authenticate
            </button>
            <button
              type="button"
              onClick={() => setView('shop')}
              className="w-full text-gray-500 text-xs uppercase tracking-widest font-black hover:text-white transition-colors pt-2"
            >
              Back to landing
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Admin Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/[0.05] pb-8 bg-[#0B0B0F]/90 sticky top-0 z-40 py-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="bg-purple-600 p-3 rounded-xl shadow-glowshrink-0">
              <Package className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-display uppercase tracking-wider">ASHX GROW</h1>
              <p className="text-gray-500 text-xs">Aesthetic High-Converting Landing Manager</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setView('access-code-generator')}
              className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 transition-all"
            >
              <Key className="w-4 h-4 text-purple-400" /> Codes
            </button>

            <button
              onClick={() => {
                sessionStorage.removeItem('admin_auth');
                setView('shop');
              }}
              className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" /> Exit
            </button>
          </div>
        </header>

        {/* Dynamic Warning Notification */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex justify-between items-center bg-black/40">
            <span>{error}</span>
            <button onClick={() => setError(null)}><XCircle className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs flex items-center gap-2 bg-black/40">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {/* Navigation Tab Menu */}
        <div className="flex flex-wrap bg-[#0E0E13] border border-white/[0.05] p-1.5 rounded-2xl gap-1">
          {[
            { id: 'analytics', label: 'Analytics' },
            { id: 'products', label: 'Products' },
            { id: 'payments', label: 'Orders' },
            { id: 'alerts', label: 'Clicks Alerts' },
            { id: 'videos', label: 'Previews' },
            { id: 'testimonials', label: 'Testimonials' },
            { id: 'faqs', label: 'FAQs' },
            { id: 'proofs', label: 'Proofs Gallery' },
            { id: 'settings', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all uppercase ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Global loading spinner template */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#0E0E13] border border-white/[0.05] rounded-3xl">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-2" />
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Loading Databases...</span>
          </div>
        ) : (
          <div className="space-y-6">

            {/* TAB: Analytics Dashboard */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-[#0E0E13] border border-white/[0.05] p-6 rounded-2xl text-left">
                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-1">TOTAL REVENUE (₹)</span>
                    <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">₹{analyticsStats.totalRevenue.toLocaleString()}</h3>
                    <div className="text-[9px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Direct confirmed payouts
                    </div>
                  </div>
                  
                  <div className="bg-[#0E0E13] border border-white/[0.05] p-6 rounded-2xl text-left">
                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-1">UNLOCKED ORDERS</span>
                    <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-purple-400">{analyticsStats.totalOrders}</h3>
                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                      <Users className="w-3.5 h-3.5" /> High trust delivery
                    </div>
                  </div>

                  <div className="bg-[#0E0E13] border border-white/[0.05] p-6 rounded-2xl text-left">
                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-1">checkout clks alerts</span>
                    <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-blue-400">{analyticsStats.clickedCount}</h3>
                    <div className="text-[9px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                      <Sparkles className="w-3.5 h-3.5" /> Dynamic visitor leads
                    </div>
                  </div>

                  <div className="bg-[#0E0E13] border border-white/[0.05] p-6 rounded-2xl text-left">
                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-1">failed checks attempts</span>
                    <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-red-400">{analyticsStats.failedAttempts}</h3>
                    <div className="text-[9px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                      <TrendingDown className="w-3.5 h-3.5" /> Invalid inputs logged
                    </div>
                  </div>
                </div>

                {/* Quick stats details panel */}
                <div className="bg-[#0E0E13] border border-white/[0.05] rounded-3xl p-6 sm:p-8 space-y-6">
                  <h3 className="font-bold opacity-80 uppercase text-xs tracking-wider">CREATIVE DASHBOARD OVERVIEW</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-white/5 rounded-2xl p-6 space-y-4">
                      <span className="text-xs text-gray-400 uppercase tracking-wider block font-bold">Store Setup Audit</span>
                      <div className="flex justify-between items-center text-xs py-2 border-b border-white/5">
                        <span className="text-gray-500">Listed Products Count</span>
                        <span className="font-bold">{products.length} active</span>
                      </div>
                      <div className="flex justify-between items-center text-xs py-2 border-b border-white/5">
                        <span className="text-gray-500">Live preview videos</span>
                        <span className="font-bold">{previewVideos.length} uploaded</span>
                      </div>
                      <div className="flex justify-between items-center text-xs py-2">
                        <span className="text-gray-500">Community reviews block</span>
                        <span className="font-bold">{testimonials.length} live</span>
                      </div>
                    </div>

                    <div className="border border-white/5 rounded-2xl p-6 space-y-4">
                      <span className="text-xs text-gray-400 uppercase tracking-wider block font-bold">Payment Intent Success Ratio</span>
                      <div className="flex items-center gap-4 py-4">
                        <div className="flex-1 bg-white/5 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-purple-600 h-full"
                            style={{ 
                              width: `${analyticsStats.clickedCount > 0 ? (analyticsStats.totalOrders / analyticsStats.clickedCount) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-purple-400">
                          {analyticsStats.clickedCount > 0 ? Math.round((analyticsStats.totalOrders / analyticsStats.clickedCount) * 100) : 0}% ratio
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-widest">
                        Ratio of confirmed unlocked access orders compared to raw Checkout Pay button clicks. Showcases relative page strength.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Products Management */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({
                        title: '', category: 'DIGITAL PRODUCT', image: '', description: '', originalPrice: 0, salePrice: 0,
                        isSale: true, buttonText: 'GET FULL BUNDLE NOW', buttonLink: '', successLink: '', timerDuration: 30,
                        isTimerEnabled: true, demoVideoLinks: ['', '', ''], packNumber: products.length + 1, customization: { themeColor: '#A855F7', headingText: '', showTimer: true, showVideos: true }
                      });
                      setIsProductModalOpen(true);
                    }}
                    className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Product Card
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(prod => (
                    <div key={prod.id} className="bg-[#0E0E13] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col group">
                      <div className="aspect-[16/9] relative bg-black">
                        {prod.image && <img src={prod.image} alt="" className="w-full h-full object-cover opacity-80" />}
                        <div className="absolute top-4 left-4 bg-black/60 border border-white/5 px-2.5 py-1 text-[10px] font-black rounded-lg text-purple-400">
                          Pack #{prod.packNumber || 0}
                        </div>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-0.5">{prod.category}</span>
                          <h4 className="font-extrabold text-sm line-clamp-2 uppercase font-display">{prod.title}</h4>
                          <p className="text-gray-500 text-xs line-clamp-3 mt-2">{prod.description}</p>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-gray-500 line-through text-[10px] block">₹{prod.originalPrice}</span>
                            <span className="text-white font-extrabold text-xs">₹{prod.salePrice}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingProduct(prod);
                                setProductForm({
                                  title: prod.title, category: prod.category, image: prod.image, description: prod.description || '',
                                  originalPrice: prod.originalPrice, salePrice: prod.salePrice, isSale: prod.isSale,
                                  buttonText: prod.buttonText || '', buttonLink: prod.buttonLink || '', successLink: prod.successLink || '',
                                  timerDuration: prod.timerDuration || 30, isTimerEnabled: prod.isTimerEnabled ?? true,
                                  demoVideoLinks: prod.demoVideoLinks || ['', '', ''], packNumber: prod.packNumber || 0,
                                  customization: prod.customization || { themeColor: '#A855F7', headingText: '', showTimer: true, showVideos: true }
                                });
                                setIsProductModalOpen(true);
                              }}
                              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-blue-400"
                            >
                              <Edit2 className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => deleteItem('products', prod.id)}
                              className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-red-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Orders Payments List */}
            {activeTab === 'payments' && (
              <div className="bg-[#0E0E13] border border-white/[0.05] rounded-3xl p-6 sm:p-8 space-y-6 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold opacity-80 uppercase text-xs tracking-wider">SUCCESSFUL DIRECT DOWNLOAD OR_ENTRIES</h3>
                  <span className="px-3.5 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl font-bold">
                    {submissions.length} Total Verified
                  </span>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {submissions.length === 0 ? (
                    <p className="text-gray-500 text-xs py-10 text-center">No successful access codes recorded yet.</p>
                  ) : (
                    submissions.map(sub => (
                      <div key={sub.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">{sub.productTitle}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-300 font-bold font-mono uppercase bg-black/40 px-2.5 py-1 border border-white/10 rounded-lg">CODE: {sub.accessCode}</span>
                            <span className="text-xs font-bold text-emerald-400">₹{sub.amount} Confirmed</span>
                          </div>
                          <span className="text-[10px] text-gray-500 uppercase block">Time: {sub.createdAt?.toDate?.().toLocaleString() || 'Instant'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2自-end">
                          <button
                            onClick={() => deleteItem('payments', sub.id)}
                            className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: Clicks Alerts Leads */}
            {activeTab === 'alerts' && (
              <div className="bg-[#0E0E13] border border-white/[0.05] rounded-3xl p-6 sm:p-8 space-y-6 text-left">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-bold opacity-80 uppercase text-xs tracking-wider">VISITOR CHECKS AND PLAY CLICK ALERTS LOGS</h3>
                    <p className="text-gray-500 text-[10px] mt-1">Real-time telemetry showing every time a visitor clicked "PAY" or tried an Access Code</p>
                  </div>
                  <button
                    onClick={clearAlerts}
                    className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-xs font-bold uppercase tracking-widest text-red-400 rounded-lg"
                  >
                    Flush telemetry
                  </button>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {alerts.length === 0 ? (
                    <p className="text-gray-500 text-xs py-10 text-center font-sans">No alerts logged. Telemetry queue is empty.</p>
                  ) : (
                    alerts.map(a => (
                      <div 
                        key={a.id} 
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B0B0F] ${
                          a.type === 'SUCCESS' ? 'border-green-500/20 border-l-4 border-l-green-500' :
                          a.type === 'FAILURE' ? 'border-red-500/20 border-l-4 border-l-red-500' :
                          'border-blue-500/20 border-l-4 border-l-blue-500'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-black uppercase rounded-lg px-2 py-0.5 ${
                              a.type === 'SUCCESS' ? 'bg-green-500/10 text-green-400' :
                              a.type === 'FAILURE' ? 'bg-red-500/10 text-red-400' :
                              'bg-blue-500/10 text-blue-400'
                            }`}>
                              {a.type}
                            </span>
                            <span className="text-xs font-bold text-gray-300">{a.productTitle}</span>
                          </div>
                          
                          <p className="text-xs text-gray-400 mt-1">{a.message || 'Payment action recorded'}</p>
                          {a.accessCode && <span className="text-[10px] text-purple-400 font-bold font-mono">Attempted: {a.accessCode}</span>}
                          <span className="text-[9px] text-gray-600 block pt-1">{a.createdAt?.toDate?.().toLocaleString() || 'Direct trace'}</span>
                        </div>

                        <button 
                          onClick={() => deleteItem('payment_alerts', a.id)}
                          className="p-2 hover:bg-neutral-800 text-gray-500 hover:text-red-400 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: Previews Custom Video Uploads */}
            {activeTab === 'videos' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#0E0E13] p-6 border border-white/[0.05] rounded-2xl">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wide">Video Previews Gallery</h3>
                    <p className="text-gray-500 text-xs mt-1">Direct upload to Firestore/Storage. Max MP4 size limit 100MB.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingVideo(null);
                      setVideoForm({ title: '', videoUrl: '' });
                      setIsVideoModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl"
                  >
                    Add Preview Video
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {previewVideos.map(vid => (
                    <div key={vid.id} className="bg-[#0E0E13] border border-white/[0.05] rounded-2xl overflow-hidden p-4 flex flex-col justify-between">
                      <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden relative mb-4">
                        <video src={vid.videoUrl} className="w-full h-full object-cover" controls playsInline muted preload="metadata" />
                      </div>
                      <div className="space-y-3">
                        <span className="font-bold text-xs text-white block capitalize truncate">{vid.title}</span>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              setEditingVideo(vid);
                              setVideoForm({ title: vid.title, videoUrl: vid.videoUrl });
                              setIsVideoModalOpen(true);
                            }}
                            className="px-4 py-2 bg-white/5 rounded-lg text-blue-400 text-xs font-bold flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => deleteItem('preview_videos', vid.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Testimonials Module */}
            {activeTab === 'testimonials' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#0E0E13] p-6 border border-white/[0.05] rounded-2xl">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wide">Testimonials & Reviews</h3>
                    <p className="text-gray-500 text-xs mt-1">Manage feedback stars and social references</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingTestimonial(null);
                      setTestimonialForm({ name: '', role: '', avatarUrl: '', text: '', rating: 5 });
                      setIsTestimonialModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl"
                  >
                    Add Testimonial
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {testimonials.map(t => (
                    <div key={t.id} className="bg-[#0E0E13] border border-white/[0.05] rounded-2xl p-6 flex flex-col justify-between">
                      <div className="space-y-3 text-left">
                        <div className="flex items-center gap-1 text-yellow-500">
                          {[...Array(t.rating || 5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                        </div>
                        <p className="text-gray-300 text-xs italic">"{t.text}"</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-purple-500/30 flex items-center justify-center font-bold text-sm overflow-hidden text-xs">
                            {t.avatarUrl ? <img src={t.avatarUrl} className="w-full h-full object-cover" /> : t.name[0]}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white block">{t.name}</span>
                            <span className="text-gray-500 text-[10px] block">{t.role}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingTestimonial(t);
                              setTestimonialForm({ name: t.name, role: t.role, avatarUrl: t.avatarUrl || '', text: t.text, rating: t.rating });
                              setIsTestimonialModalOpen(true);
                            }}
                            className="p-2 bg-white/5 rounded-lg text-blue-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteItem('testimonials', t.id)}
                            className="p-2 bg-white/5 text-red-400 rounded-lg hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: FAQs accordion manage */}
            {activeTab === 'faqs' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#0E0E13] p-6 border border-white/[0.05] rounded-2xl">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wide">FAQ Accordions Question Bank</h3>
                    <p className="text-gray-500 text-xs mt-1">Manage support queries and sorting criteria</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingFaq(null);
                      setFaqForm({ question: '', answer: '', order: faqs.length + 1 });
                      setIsFaqModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl"
                  >
                    Add QnA FAQ
                  </button>
                </div>

                <div className="space-y-4">
                  {faqs.map(faq => (
                    <div key={faq.id} className="bg-[#0E0E13] border border-white/[0.05] rounded-xl p-5 flex items-center justify-between gap-6">
                      <div className="text-left space-y-1">
                        <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 rounded px-2 py-0.5 text-purple-400 font-bold uppercase tracking-widest inline-block">Order Rank: {faq.order}</span>
                        <h4 className="text-white font-bold text-sm tracking-tight capitalize">{faq.question}</h4>
                        <p className="text-gray-400 text-xs">{faq.answer}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setEditingFaq(faq);
                            setFaqForm({ question: faq.question, answer: faq.answer, order: faq.order });
                            setIsFaqModalOpen(true);
                          }}
                          className="p-2.5 bg-white/5 rounded-lg text-blue-400 hover:bg-white/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem('faqs', faq.id)}
                          className="p-2.5 bg-white/5 rounded-lg text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Earnings Proofs Portfolio Screenshot Uploader */}
            {activeTab === 'proofs' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#0E0E13] p-6 border border-white/[0.05] rounded-2xl">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wide">Earnings & Analytics Proof Gallery</h3>
                    <p className="text-gray-500 text-xs mt-1">Upload screenshots of payment successful invoices, client analytics or student proof logs</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProof(null);
                      setProofForm({ imageUrl: '', caption: '' });
                      setIsProofModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl"
                  >
                    Add Proof Image
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {proofs.map(p => (
                    <div key={p.id} className="bg-[#0E0E13] border border-white/[0.05] rounded-2xl overflow-hidden p-4 space-y-3">
                      <div className="h-44 rounded-xl overflow-hidden border border-white/5">
                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-xs text-white block capitalize truncate">{p.caption}</span>
                      <div className="flex justify-between pt-2 border-t border-white/5">
                        <button
                          onClick={() => {
                            setEditingProof(p);
                            setProofForm({ imageUrl: p.imageUrl, caption: p.caption });
                            setIsProofModalOpen(true);
                          }}
                          className="px-3.5 py-2 bg-white/5 rounded-lg text-blue-400 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteItem('earnings_proof', p.id)}
                          className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Settings & Custom Security Password changeable */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto bg-[#0E0E13] border border-white/[0.05] rounded-3xl p-6 sm:p-10 space-y-8 text-left shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
                    <Settings className="text-purple-400 w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black font-display uppercase tracking-tight">Website Custom Configuration</h2>
                    <p className="text-gray-500 text-xs">Update passwords, headers and hero alignments</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Shop Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Brand Name</label>
                      <input 
                        type="text"
                        value={siteSettings.shopTitle}
                        onChange={(e) => setSiteSettings({ ...siteSettings, shopTitle: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white uppercase tracking-wider outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-red-400">Admin Security Password</label>
                      <input 
                        type="text"
                        value={siteSettings.adminPassword}
                        onChange={(e) => setSiteSettings({ ...siteSettings, adminPassword: e.target.value })}
                        className="w-full bg-black border border-red-500/15 rounded-xl px-4 py-3 text-xs text-white uppercase tracking-wider outline-none"
                      />
                    </div>
                  </div>

                  {/* Hero Copy customization */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Hero Custom Headline (Optional Overrides)</label>
                    <input 
                      type="text"
                      value={siteSettings.heroHeadline}
                      onChange={(e) => setSiteSettings({ ...siteSettings, heroHeadline: e.target.value })}
                      placeholder="e.g. MASTER THE ART OF AMAZING K-POP EDITS"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none"
                    />
                  </div>

                  {/* Social links handles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">WhatsApp Number</label>
                      <input 
                        type="text"
                        value={siteSettings.whatsapp}
                        onChange={(e) => setSiteSettings({ ...siteSettings, whatsapp: e.target.value })}
                        placeholder="91..."
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-700 outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Telegram Channel handle</label>
                      <input 
                        type="text"
                        value={siteSettings.telegram}
                        onChange={(e) => setSiteSettings({ ...siteSettings, telegram: e.target.value })}
                        placeholder="e.g. Hyyash10"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-700 outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Instagram Username</label>
                      <input 
                        type="text"
                        value={siteSettings.instagram}
                        onChange={(e) => setSiteSettings({ ...siteSettings, instagram: e.target.value })}
                        placeholder="ashish_shinde_70"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-700 outline-none"
                      />
                    </div>
                  </div>

                  {/* Instruction Link */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Access Instruction Link</label>
                    <input 
                      type="url"
                      value={siteSettings.howToAccessLink}
                      onChange={(e) => setSiteSettings({ ...siteSettings, howToAccessLink: e.target.value })}
                      placeholder="YouTube instruction link / Drive links"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none"
                    />
                  </div>

                  {/* Profile / Launcher Logo Icon */}
                  <div className="p-4 bg-[#0B0B0F] border border-white/5 rounded-2xl">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> Launcher Icon Profile Base64 Upload
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold text-center cursor-pointer hover:border-purple-500 duration-200">
                        Select picture from gallery
                        <input type="file" accept="image/*" onChange={(e) => handleImageZipUpload(e, 'profile')} className="hidden" />
                      </label>
                      {siteSettings.profileImageUrl && (
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0">
                          <img src={siteSettings.profileImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={uploading}
                    className="w-full py-4.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-[0.98] duration-200"
                  >
                    {uploading ? 'Updating Site...' : 'COMMIT CHANGES'}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* --- CRUD MODALS --- */}

      {/* MODAL 1: Product Editing */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0E0E13] border border-white/[0.08] rounded-3xl p-6 sm:p-10 w-full max-w-2xl relative z-10 max-h-[85vh] overflow-y-auto scrollbar"
            >
              <h2 className="text-xl font-black font-display uppercase tracking-tight mb-6">{editingProduct ? 'Update Product Entry' : 'Add New Product Card'}</h2>
              
              <form onSubmit={handleProductSubmit} className="space-y-6 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Product Title</label>
                    <input 
                      type="text" 
                      required
                      value={productForm.title} 
                      onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Category Type</label>
                    <input 
                      type="text" 
                      value={productForm.category} 
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Short Description</label>
                  <textarea 
                    value={productForm.description} 
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows={3}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Original Price (₹)</label>
                    <input 
                      type="number" 
                      value={productForm.originalPrice} 
                      onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Sale Price (₹)</label>
                    <input 
                      type="number" 
                      value={productForm.salePrice} 
                      onChange={(e) => setProductForm({ ...productForm, salePrice: Number(e.target.value) })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Sorting Rank (packNumber)</label>
                    <input 
                      type="number" 
                      value={productForm.packNumber} 
                      onChange={(e) => setProductForm({ ...productForm, packNumber: Number(e.target.value) })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-[#0B0B0F] rounded-xl border border-white/5 space-y-3">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Thumbnail Image</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-center cursor-pointer">
                      Select picture
                      <input type="file" accept="image/*" onChange={(e) => handleImageZipUpload(e, 'product')} className="hidden" />
                    </label>
                    {productForm.image && <img src={productForm.image} className="w-12 h-12 object-cover rounded-lg border border-white/10" />}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Button Call action text</label>
                    <input 
                      type="text" 
                      value={productForm.buttonText} 
                      onChange={(e) => setProductForm({ ...productForm, buttonText: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Button Link (Redirect link)</label>
                    <input 
                      type="url" 
                      value={productForm.buttonLink} 
                      onChange={(e) => setProductForm({ ...productForm, buttonLink: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-green-400 font-bold uppercase tracking-wider block">Drive Success Link (Unlocked on Valid Access Code)</label>
                  <input 
                    type="url" 
                    value={productForm.successLink} 
                    onChange={(e) => setProductForm({ ...productForm, successLink: e.target.value })}
                    className="w-full bg-black border border-green-500/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-green-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Countdown Timer Duration (Mins)</label>
                    <input 
                      type="number" 
                      value={productForm.timerDuration} 
                      onChange={(e) => setProductForm({ ...productForm, timerDuration: Number(e.target.value) })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input 
                      type="checkbox" 
                      id="timer_active"
                      checked={productForm.isTimerEnabled} 
                      onChange={(e) => setProductForm({ ...productForm, isTimerEnabled: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <label id="timer_active" className="text-xs text-gray-400 uppercase tracking-wider cursor-pointer font-bold">Countdown Timer Active</label>
                  </div>
                </div>

                <div className="p-4 bg-[#0B0B0F] border border-white/5 rounded-2xl space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Product Demo Video Links</label>
                  {productForm.demoVideoLinks.map((link, index) => (
                    <div key={index} className="space-y-1">
                      <span className="text-[9px] text-gray-600 block uppercase font-bold tracking-widest ml-1">Video {index + 1}</span>
                      <div className="flex gap-2">
                        <input 
                          type="url" 
                          value={link} 
                          onChange={(e) => {
                            const newLinks = [...productForm.demoVideoLinks];
                            newLinks[index] = e.target.value;
                            setProductForm({ ...productForm, demoVideoLinks: newLinks });
                          }}
                          placeholder="Direct .mp4 link (e.g., Firebase Storage URL)"
                          className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500 text-white"
                        />
                        <label className="cursor-pointer bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center transition-colors shadow-lg">
                          Upload MP4
                          <input 
                            type="file" 
                            accept="video/mp4,video/webm" 
                            className="hidden" 
                            onChange={(e) => handleProductVideoUpload(e, index)} 
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-gray-600 tracking-widest uppercase">These videos will be embedded and played natively inside the product page. Use the upload button for guaranteed playback.</p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="flex-1 py-3.5 bg-white/5 rounded-xl text-xs font-bold uppercase"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-black text-xs uppercase"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Video Adding */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90" onClick={() => setIsVideoModalOpen(false)} />
            <motion.div className="bg-[#0E0E13] border border-white/10 p-8 rounded-3xl w-full max-w-md relative z-10 text-left space-y-6">
              <h2 className="text-lg font-black uppercase tracking-tight">{editingVideo ? 'Update Video' : 'Add Preview Video Line'}</h2>
              <form onSubmit={handleVideoSubmit} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Video Title</span>
                  <input 
                    type="text" 
                    value={videoForm.title} 
                    onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white" 
                    required 
                  />
                </div>

                <div className="p-4 bg-[#0B0B0F] border border-white/5 rounded-2xl space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Video Source File</label>
                  <div className="flex flex-col gap-3">
                    <label className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-center cursor-pointer font-bold">
                      Upload Video MP4/WEBM
                      <input type="file" accept="video/*" onChange={(e) => handleFirebaseFileUpload(e, 'video')} className="hidden" />
                    </label>
                    
                    {uploadProgress !== null && (
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div className="bg-purple-600 h-full" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}

                    <input 
                      type="url" 
                      value={videoForm.videoUrl} 
                      onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                      placeholder="Or enter stream URL..."
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white" 
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-xl">
                  Commit Video
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Testimonial Editing */}
      <AnimatePresence>
        {isTestimonialModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90" onClick={() => setIsTestimonialModalOpen(false)} />
            <motion.div className="bg-[#0E0E13] border border-white/10 p-8 rounded-3xl w-full max-w-md relative z-10 text-left space-y-6">
              <h2 className="text-lg font-black uppercase tracking-tight">{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
              <form onSubmit={handleTestimonialSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">Buyer Name</span>
                    <input type="text" value={testimonialForm.name} onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs" required />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">Audience Role</span>
                    <input type="text" value={testimonialForm.role} onChange={(e) => setTestimonialForm({ ...testimonialForm, role: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs" placeholder="e.g. YT Channel" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Review Message</span>
                  <textarea value={testimonialForm.text} onChange={(e) => setTestimonialForm({ ...testimonialForm, text: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-sans" rows={3} required />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Feedback Rating (Stars)</span>
                  <input type="number" min={1} max={5} value={testimonialForm.rating} onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: Number(e.target.value) })} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs" />
                </div>

                <div className="p-4 bg-[#0B0B0F] border border-white/5 rounded-2xl">
                  <span className="text-[10px] text-gray-500 uppercase block font-bold mb-2">Avatar URL or Upload</span>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-center cursor-pointer">
                      Choose pic
                      <input type="file" accept="image/*" onChange={(e) => handleImageZipUpload(e, 'testimonial')} className="hidden" />
                    </label>
                    <input type="url" value={testimonialForm.avatarUrl} onChange={(e) => setTestimonialForm({ ...testimonialForm, avatarUrl: e.target.value })} className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs" placeholder="Or image url" />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-purple-600 text-white font-black text-xs uppercase rounded-xl">Commit Testimonial</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: FAQ Dialog */}
      <AnimatePresence>
        {isFaqModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90" onClick={() => setIsFaqModalOpen(false)} />
            <motion.div className="bg-[#0E0E13] border border-white/10 p-8 rounded-3xl w-full max-w-md relative z-10 text-left space-y-6">
              <h2 className="text-lg font-black uppercase tracking-tight">{editingFaq ? 'Edit FAQ Item' : 'Add FAQ'}</h2>
              <form onSubmit={handleFaqSubmit} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Rank Query Order</span>
                  <input type="number" value={faqForm.order} onChange={(e) => setFaqForm({ ...faqForm, order: Number(e.target.value) })} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Frequently Asked Question</span>
                  <input type="text" value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs" required />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Detailed Answer Response</span>
                  <textarea value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-sans" rows={4} required />
                </div>
                <button type="submit" className="w-full py-4 bg-purple-600 text-white font-black text-xs uppercase rounded-xl">Confirm FAQ</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: Earnings Proof adding */}
      <AnimatePresence>
        {isProofModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90" onClick={() => setIsProofModalOpen(false)} />
            <motion.div className="bg-[#0E0E13] border border-white/10 p-8 rounded-3xl w-full max-w-md relative z-10 text-left space-y-6">
              <h2 className="text-lg font-black uppercase tracking-tight">{editingProof ? 'Edit Proof Card' : 'Add Earnings / Analytics Proof'}</h2>
              <form onSubmit={handleProofSubmit} className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Proof Screenshot</span>
                  <div className="flex flex-col gap-3">
                    <label className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-center cursor-pointer">
                      Select Screenshot (Storage)
                      <input type="file" accept="image/*" onChange={(e) => handleFirebaseFileUpload(e, 'proof')} className="hidden" />
                    </label>

                    {uploadProgress !== null && (
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-purple-600 h-full" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}

                    <input type="url" value={proofForm.imageUrl} onChange={(e) => setProofForm({ ...proofForm, imageUrl: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white" placeholder="Or enter direct url..." />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase block font-bold">Caption description</span>
                  <input type="text" value={proofForm.caption} onChange={(e) => setProofForm({ ...proofForm, caption: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs" placeholder="e.g. Client Payout Proof (₹23,000)" />
                </div>

                <button type="submit" className="w-full py-4 bg-purple-600 text-white font-black text-xs uppercase rounded-xl">Commit Proof</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
