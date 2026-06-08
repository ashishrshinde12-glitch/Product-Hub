import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, getDocs, where, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Sparkles, 
  TrendingUp, 
  Lock, 
  Check, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  Layers, 
  DollarSign, 
  Flame, 
  Volume2, 
  ChevronDown, 
  CheckCircle,
  HelpCircle,
  MessageSquare,
  ArrowRight,
  Maximize2,
  X,
  VolumeX,
  Star
} from 'lucide-react';
import { Product, PreviewVideo, Testimonial, FAQ, EarningsProof } from '../types';

interface LandingPageProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  shopTitle: string;
  onSecretClick: () => void;
  onCartClick: () => void;
  purchasedCount: number;
  profileImageUrl?: string;
  onPurchase: (productId: string) => void;
  socialLinks: { whatsapp: string; telegram: string; instagram: string };
  howToAccessLink?: string;
}

export default function LandingPage({
  products,
  shopTitle,
  onSecretClick,
  onCartClick,
  purchasedCount,
  profileImageUrl,
  onPurchase,
  socialLinks,
  howToAccessLink
}: LandingPageProps) {
  // Collection States
  const [previewVideos, setPreviewVideos] = useState<PreviewVideo[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [proofs, setProofs] = useState<EarningsProof[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // UI States
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);
  const [videoMuted, setVideoMuted] = useState(true);

  // Checkout States
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minute timer default
  
  // Load main highlighted product
  useEffect(() => {
    if (products.length > 0) {
      // Find a featured or first product to showcase on the main landing page
      setSelectedProduct(products[0]);
      if (products[0].isTimerEnabled) {
        setTimeLeft((products[0].timerDuration || 30) * 60);
      }
    }
  }, [products]);

  // Read preview videos, testimonials, faqs, proofs from Firestore
  useEffect(() => {
    const qVideos = query(collection(db, 'preview_videos'), orderBy('createdAt', 'desc'));
    const unsubscribeVideos = onSnapshot(qVideos, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as PreviewVideo[];
      setPreviewVideos(list);
    }, (err) => console.error('Error fetching preview videos:', err));

    const qTestimonials = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
    const unsubscribeTestimonials = onSnapshot(qTestimonials, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Testimonial[];
      setTestimonials(list);
    }, (err) => console.error('Error fetching testimonials:', err));

    const qFaqs = query(collection(db, 'faqs'), orderBy('order', 'asc'));
    const unsubscribeFaqs = onSnapshot(qFaqs, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as FAQ[];
      setFaqs(list);
    }, (err) => console.error('Error fetching FAQs:', err));

    const qProofs = query(collection(db, 'earnings_proof'), orderBy('createdAt', 'desc'));
    const unsubscribeProofs = onSnapshot(qProofs, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as EarningsProof[];
      setProofs(list);
    }, (err) => console.error('Error fetching earnings proofs:', err));

    return () => {
      unsubscribeVideos();
      unsubscribeTestimonials();
      unsubscribeFaqs();
      unsubscribeProofs();
    };
  }, []);

  // Timer Ticking
  useEffect(() => {
    if (!selectedProduct || !selectedProduct.isTimerEnabled || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedProduct, timeLeft]);

  // Format Timer Duration
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Checkout handling
  const handleProceedToPayment = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'payment_alerts'), {
        type: 'PAYMENT_INTENT',
        productId: selectedProduct.id,
        productTitle: selectedProduct.title,
        buyerName: 'Guest User',
        buyerPhone: 'Not Provided',
        message: 'Clicked Checkout Payment Now Button on Landing Page',
        status: 'pending_payment',
        createdAt: Timestamp.now(),
      });
      window.open(selectedProduct.buttonLink, '_blank');
    } catch (err) {
      console.error('Error tracking payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccessWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const trimmed = accessCode.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const qCode = query(collection(db, 'valid_utrs'), where('code', '==', trimmed));
      const codeSnapshot = await getDocs(qCode);

      if (codeSnapshot.empty) {
        setSubmitError('INVALID_CODE');
        const alertData = {
          type: 'FAILURE',
          productId: selectedProduct.id,
          productTitle: selectedProduct.title,
          accessCode: trimmed,
          message: 'Access Code verification failed on Landing Page',
          createdAt: Timestamp.now()
        };
        await addDoc(collection(db, 'payment_alerts'), alertData);
        setIsSubmitting(false);
        
        // WhatsApp Redirect For Fast Issue Solve
        const message = encodeURIComponent(`Hello, I tried to unlock the pack on your page with my Access Code: ${trimmed}, but it says invalid.`);
        window.open(`https://wa.me/919623508870?text=${message}`, '_blank');
        return;
      }

      const codeDoc = codeSnapshot.docs[0];
      const codeData = codeDoc.data();

      // Check if already used
      const currentUsageCount = codeData.usageCount || 0;
      const usageLimit = codeData.usageLimit || 1;

      if (codeData.used || currentUsageCount >= usageLimit) {
        setSubmitError('CODE_ALREADY_USED');
        await addDoc(collection(db, 'payment_alerts'), {
          type: 'FAILURE',
          productId: selectedProduct.id,
          productTitle: selectedProduct.title,
          accessCode: trimmed,
          message: 'Access code already used verification attempt',
          createdAt: Timestamp.now()
        });
        setIsSubmitting(false);
        return;
      }

      // Update code state as used
      const nextUsage = currentUsageCount + 1;
      await updateDoc(doc(db, 'valid_utrs', codeDoc.id), {
        usageCount: nextUsage,
        used: nextUsage >= usageLimit,
        lastUsedAt: Timestamp.now()
      });

      // Track successful purchase
      await addDoc(collection(db, 'payments'), {
        productId: selectedProduct.id,
        productTitle: selectedProduct.title,
        accessCode: trimmed,
        amount: selectedProduct.salePrice,
        status: 'completed',
        createdAt: Timestamp.now()
      });

      await addDoc(collection(db, 'payment_alerts'), {
        type: 'SUCCESS',
        productId: selectedProduct.id,
        productTitle: selectedProduct.title,
        accessCode: trimmed,
        amount: selectedProduct.salePrice,
        message: 'Successfully unlocked with access code',
        createdAt: Timestamp.now()
      });

      setSubmitSuccess(true);
      onPurchase(selectedProduct.id);
      setAccessCode('');
    } catch (err: any) {
      console.error('Error unlocking product code:', err);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Predefined Fallbacks when collections are empty
  const defaultVideos = [
    { id: 'v1', title: 'Viral Glow Montage', url: 'https://assets.mixkit.co/videos/preview/mixkit-holding-a-glowing-neon-sign-40439-large.mp4' },
    { id: 'v2', title: 'Premium Cyberpunk Aesthetic', url: 'https://assets.mixkit.co/videos/preview/mixkit-neon-lights-of-shinjuku-tokyo-at-night-42456-large.mp4' },
    { id: 'v3', title: 'Editing Glow Techniques', url: 'https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-young-woman-with-glowing-face-makeup-and-led-42611-large.mp4' }
  ];

  const defaultTestimonials = [
    { id: 't1', name: 'Ashish R.', role: 'YouTube Creator (120k+)', text: 'The editing pack from ASHX GROW changed my editing game completely. Absolute value for money. Highly recommended!', rating: 5 },
    { id: 't2', name: 'Dev R.', role: 'Professional Video Editor', text: 'This is easily a ₹1 Lakh custom workflow. The neat transitions, LUTs, and presets are incredibly sharp and modern. Worth every penny!', rating: 5 },
    { id: 't3', name: 'Kabir Shinde', role: 'Instagram Influencer', text: 'Viral hacks actually work! My views jumped to 340k in a week after switching to these premium dark-glow styles.', rating: 5 }
  ];

  const defaultFaqs = [
    { question: 'What is included in the package?', answer: 'The pack includes premium LUTs, preset glow graphics, light overlay filters, transitions, and detailed video access instructions for Adobe Premiere Pro, After Effects, and CapCut.' },
    { question: 'How will I receive the files after payment?', answer: 'Once you make the payment, you will receive an Access Code. Type it in the Access panel on this page, and your high-speed direct Google Drive link will be unlocked instantly.' },
    { question: 'Which editing software is supported?', answer: 'We fully support Adobe Premiere Pro, After Effects, VN, and CapCut. Detailed instructions are included for both desktop and mobile app editors.' },
    { question: 'Is this refundable?', answer: 'Due to the non-tangible digital nature of the products, all sales are final. However, we offer full support to make sure you successfully access and import all presets.' }
  ];

  const defaultProofs = [
    { id: 'p1', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=600', caption: 'Student Earnings (₹45,000/Month Editing Client)' },
    { id: 'p2', image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=600', caption: 'Viral Breakdown Analytics' },
    { id: 'p3', image: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=600', caption: 'Payment Invoice Successfully Fulfilled' }
  ];

  const listVideos = previewVideos.length > 0 ? previewVideos : defaultVideos.map(v => ({ id: v.id, title: v.title, videoUrl: v.url, createdAt: Timestamp.now() }));
  const listTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials.map(t => ({ id: t.id, name: t.name, role: t.role, text: t.text, rating: t.rating, createdAt: Timestamp.now() }));
  const listFaqs = faqs.length > 0 ? faqs : defaultFaqs.map((f, idx) => ({ id: `faq-${idx}`, question: f.question, answer: f.answer, order: idx, createdAt: Timestamp.now() }));
  const listProofs = proofs.length > 0 ? proofs : defaultProofs.map((p, idx) => ({ id: `proof-${idx}`, imageUrl: p.image, caption: p.caption, createdAt: Timestamp.now() }));

  // Scroll smoothly to target section
  const scrollToPricing = () => {
    const el = document.getElementById('pricing-checkout');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSecretClickCount = () => {
    onSecretClick();
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white font-sans overflow-x-hidden relative selection:bg-purple-600 selection:text-white">
      
      {/* Decorative Neon Lighting Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-[30vh] right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[70vh] left-0 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Floating Sparkly Vector Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.02]">
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
        <div className="absolute top-[55vh] right-1/4 w-3 h-3 bg-cyan-400 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[80vh] left-10 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping" style={{ animationDuration: '4s' }} />
      </div>

      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-[60] bg-[#0B0B0F]/80 backdrop-blur-md border-b border-white/[0.05] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleSecretClickCount}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full blur opacity-75 animate-pulse" />
              <div className="relative w-10 h-10 bg-black rounded-full overflow-hidden flex items-center justify-center border border-white/20">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="w-5 h-5 text-purple-400" />
                )}
              </div>
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest leading-none mb-1 font-display">OFFICIAL SITE</span>
              <span className="text-xl font-black font-display tracking-wider bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent uppercase">
                {shopTitle === 'Ashiieditzx' ? 'ASHX GROW' : shopTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {howToAccessLink && (
              <a 
                href={howToAccessLink} 
                target="_blank" 
                rel="no-referrer" 
                className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider text-gray-300 transition-all font-display"
              >
                <Play className="w-3 h-3 fill-white" /> How to Access
              </a>
            )}
            <button 
              onClick={scrollToPricing}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all font-display duration-300"
            >
              Get Access Now
            </button>
            <div className="relative cursor-pointer hover:opacity-80 transition-opacity ml-1" onClick={onCartClick}>
              <div className="absolute -top-1.5 -right-1.5 bg-purple-600 text-white text-[9px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full">
                {purchasedCount}
              </div>
              <div className="p-2.5 bg-white/[0.03] border border-white/10 rounded-full">
                <CheckCircle className="w-4 h-4 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 md:pt-32 pb-20 md:pb-28 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-widest mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" /> Direct High-Speed Download Enabled
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black font-display tracking-tight uppercase leading-[0.95] mb-6"
          >
            Create Sensational <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              Viral Videos
            </span> In Seconds
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base mb-10 leading-relaxed font-sans"
          >
            Transform your content with the ultimate, high-converting digital editing vault used by top global creators. Instant setups, high-performance assets, zero lag.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              onClick={scrollToPricing}
              className="group relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 font-extrabold text-sm uppercase tracking-widest rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_40px_rgba(147,51,234,0.6)] duration-300 flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span>Get full bundle now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <a
              href="#video-gallery"
              className="w-full sm:w-auto px-10 py-5 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-white font-bold text-sm uppercase tracking-widest rounded-2xl duration-300 flex items-center justify-center gap-2 font-display"
            >
              <Play className="w-4 h-4 text-purple-400 fill-purple-400" /> Watch Previews
            </a>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="pt-10 border-t border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          >
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-black text-white font-display">15,000+</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Happy Creators</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-black text-purple-400 font-display">99.4%</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Direct Satisfaction</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-black text-blue-400 font-display">ZIP FILES</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Instant Google Drive Link</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-black text-cyan-400 font-display">24/7 SUPPORT</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Expert WhatsApp Help</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Video Previews Section */}
      <section id="video-gallery" className="py-20 md:py-28 px-6 bg-black/40 relative border-y border-white/[0.03]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs text-purple-400 font-black tracking-widest uppercase mb-2 block font-display">LIVE DEMONSTRATION</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-display uppercase">PREVIEW REAL OUTPUTS</h2>
            <p className="text-gray-400 max-w-lg mx-auto text-xs sm:text-sm mt-3">
              Play these raw previews to see the quality you can achieve. Toggle sound, play full screen anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listVideos.map((vid, idx) => (
              <motion.div
                key={vid.id || idx}
                whileHover={{ y: -6 }}
                className="group relative bg-[#0E0E13] border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between"
              >
                {/* Floating Tags */}
                <div className="absolute top-6 left-6 z-20">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-[10px] font-black text-purple-400 uppercase rounded-xl tracking-widest border border-white/10">
                    Live Demo {idx + 1}
                  </span>
                </div>

                {/* HTML5 Player Card component */}
                <div className="relative aspect-[9/16] bg-black rounded-2xl overflow-hidden mb-4 border border-white/[0.05]">
                  <video 
                    src={vid.videoUrl}
                    className="w-full h-full object-cover lazyload"
                    playsInline
                    loop
                    muted={videoMuted}
                    preload="metadata"
                  />
                  {/* Invisible Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/20 opacity-100 group-hover:from-black/90 transition-all flex flex-col justify-between p-4 duration-300">
                    <div className="self-end flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setVideoMuted(!videoMuted);
                        }}
                        className="p-2.5 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-neutral-800 border border-white/10"
                      >
                        {videoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveVideoModal(vid.videoUrl);
                        }}
                        className="p-2.5 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-neutral-800 border border-white/10"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={(e) => {
                          const v = (e.currentTarget.parentElement?.parentElement?.previousElementSibling as HTMLVideoElement);
                          if (v) {
                            if (v.paused) {
                              v.play();
                            } else {
                              v.pause();
                            }
                          }
                        }}
                        className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white self-center mb-6 shadow-glow hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </button>
                      
                      <h3 className="text-white font-bold text-sm tracking-tight capitalize">{vid.title || 'Premium Viral Asset'}</h3>
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest font-display">Auto-optimized playback</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={scrollToPricing}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-xl border border-white/10 transition-colors"
                >
                  Use this preset
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Product Benefits (Bento Box Design) */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs text-blue-400 font-black tracking-widest uppercase mb-2 block font-display">WHY ASHX GROW?</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-display uppercase">ENGINEERED FOR CONVERSION</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative col-span-1 md:col-span-2 bg-[#0E0E13] border border-white/[0.05] rounded-3xl p-8 overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="flex items-center justify-center w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight font-display uppercase mb-2">PRO-TIER VECTOR ELEMENTS</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
                Stop wasting hours looking for safe overlays. Get access to fully optimized MP4 glow trails, transitions, neon circles, lightning vectors, and cinematic sound effect files.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400">100% ROYALTY FREE</span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400">4K HIGH RES</span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400">TRANSITIONS INCLUDED</span>
              </div>
            </div>

            <div className="bg-[#0E0E13] border border-white/[0.05] rounded-3xl p-8 overflow-hidden relative group flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-62 h-62 bg-cyan-600/10 rounded-full blur-[60px] pointer-events-none" />
              <div>
                <div className="flex items-center justify-center w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl mb-6">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black tracking-tight font-display uppercase mb-2">INSTANT VERIFIED UNLOCK</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  No automated delays. Once your order code is confirmed, our high speed cloud instantly validates and unlocks your Drive folder.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/5 text-[11px] text-gray-500 font-display uppercase tracking-widest">
                DIRECT DRIVE ACCESSIBILITY
              </div>
            </div>

            <div className="bg-[#0E0E13] border border-white/[0.05] rounded-3xl p-8 overflow-hidden relative group flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-62 h-62 bg-blue-600/10 rounded-full blur-[60px] pointer-events-none" />
              <div>
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl mb-6">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black tracking-tight font-display uppercase mb-2">LIFETIME UPDATES</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Every product title, design and asset list is updated monthly directly on Drive. You buy once, you get free viral packs forever.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/5 text-[11px] text-gray-500 font-display uppercase tracking-widest">
                LATEST CRITERIA COMPLIANCE
              </div>
            </div>

            <div className="relative col-span-1 md:col-span-2 bg-[#0E0E13] border border-white/[0.05] rounded-3xl p-8 overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight font-display uppercase mb-2">ALGORITHMIC DOMINANCE</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
                The visual retainment rate of dark glow styling, hyper-saturated borders, and modern sans display fonts has been proven to increase Instagram Reels retention rate by 42%. Use it to crush competitors.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400">INSTAGRAM VIRAL HACK</span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400">YOUTUBE SHORTS</span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400">HIGH ENGAGEMENT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Grid */}
      <section className="py-20 bg-black/25 relative border-y border-white/[0.03]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs text-cyan-400 font-black tracking-widest uppercase mb-2 block font-display">WHAT IS IN THE VAULT</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-display uppercase">ULTRA PREMIUM ASSETS GRID</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { title: 'Cinematic SFX', desc: 'Swooshes, Risers, Impacts, WHOOSH', color: 'border-purple-500/20 text-purple-400' },
              { title: 'Dynamic LUTs', desc: 'Premium Color Grading Profiles', color: 'border-blue-500/20 text-blue-400' },
              { title: 'Cyber Glows', desc: 'Aura borders & electric highlights', color: 'border-cyan-500/20 text-cyan-400' },
              { title: 'Fast Transitions', desc: 'Seamless high impact presets', color: 'border-indigo-500/20 text-indigo-400' },
              { title: 'Sound Design Kit', desc: 'Acoustics, ambient texture tones', color: 'border-cyan-500/20 text-cyan-400' },
              { title: 'Text Animations', desc: 'Presets for Capcut and Premiere', color: 'border-indigo-500/20 text-indigo-400' },
              { title: 'Tutorial Library', desc: 'Frictionless step-by-step videos', color: 'border-purple-500/20 text-purple-400' },
              { title: 'High Frame Overlays', desc: 'Real particles, lens bokeh, glares', color: 'border-blue-500/20 text-blue-400' }
            ].map((f, i) => (
              <div 
                key={i}
                className="bg-[#0E0E13]/80 border border-white/[0.05] rounded-2xl p-6 hover:border-white/15 transition-all text-center flex flex-col justify-center items-center"
              >
                <div className={`p-3 bg-white/[0.02] border rounded-xl mb-4 ${f.color}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-white font-bold text-sm mb-1 tracking-tight">{f.title}</h4>
                <p className="text-gray-500 text-xs tracking-normal leading-normal">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Testimonials Section */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs text-purple-400 font-black tracking-widest uppercase mb-2 block font-display">COMMUNITY VOICES</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-display uppercase">WHAT CREATORS ARE SAYING</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listTestimonials.map((t, index) => (
              <motion.div
                key={t.id || index}
                whileHover={{ y: -5 }}
                className="bg-[#0E0E13] border border-white/[0.06] rounded-2xl p-6 flex flex-col justify-between relative shadow-xl"
              >
                <div className="flex items-center gap-1 mb-4 text-purple-400">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current text-yellow-500" />
                  ))}
                </div>
                
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6 font-sans italic">
                  "{t.text}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.05]">
                  <div className="w-10 h-10 rounded-full bg-purple-600/30 font-bold flex items-center justify-center text-sm border border-purple-500/20 overflow-hidden">
                    {t.avatarUrl ? (
                      <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{t.name?.[0] || 'U'}</span>
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white font-bold text-xs">{t.name}</span>
                    <span className="text-gray-500 text-[10px] font-display uppercase tracking-wider">{t.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Earnings Proof Gallery */}
      <section className="py-20 bg-black/45 relative border-y border-white/[0.03]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs text-cyan-400 font-black tracking-widest uppercase mb-2 block font-display">TRANSPARENCY & RESULTS</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-display uppercase">EARNINGS PROOF GALLERY</h2>
            <p className="text-gray-400 max-w-lg mx-auto text-xs sm:text-sm mt-3">
              Real analytics and payment receipts achieved directly after utilizing presets in actual client workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listProofs.map((p, index) => (
              <motion.div
                key={p.id || index}
                whileHover={{ scale: 1.02 }}
                onClick={() => setLightboxImage(p.imageUrl)}
                className="group relative h-80 rounded-3xl overflow-hidden border border-white/[0.05] cursor-pointer shadow-xl bg-[#0E0E13]"
              >
                <img 
                  src={p.imageUrl} 
                  alt={p.caption} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest leading-none mb-1.5 font-display block">Click to zoom</span>
                  <p className="text-white font-black text-sm uppercase tracking-tight leading-snug">{p.caption}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Pricing & Direct Access Code Checkout Section */}
      <section id="pricing-checkout" className="py-24 px-6 relative bg-gradient-to-b from-black via-[#0B0B0F] to-black">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs text-purple-400 font-black tracking-widest uppercase mb-2 block font-display">LIFETIME ACCESS</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-display uppercase">INSTANT DOWNLOAD VAULT</h2>
          </div>

          {selectedProduct ? (
            <div className="relative bg-[#0E0E13] border border-white/[0.08] rounded-[2.5rem] p-6 sm:p-12 shadow-3xl overflow-hidden hover:border-purple-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/[0.03] rounded-full blur-[100px] pointer-events-none" />
              
              {/* Limited Offer Badge / Sale Banner */}
              {selectedProduct.isSale && (
                <div className="absolute top-6 right-6 z-20">
                  <span className="px-4 py-1.5 bg-yellow-500 text-black text-[10px] font-black uppercase rounded-full tracking-widest leading-none block">
                    Limited Time Promo Sale
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Main Product Info & Price Box */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  <span className="px-3.5 py-1 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black tracking-widest text-gray-400 uppercase font-display">
                    {selectedProduct.category}
                  </span>
                  
                  <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display uppercase text-white leading-tight">
                    {selectedProduct.title}
                  </h3>

                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-md font-sans">
                    {selectedProduct.description || 'Access high fidelity vectors, electric lines, cinematic risers, transitions, LUT presets, audio loops, and instructions compiled specially for professional editors.'}
                  </p>

                  <div className="flex items-baseline gap-3 pt-2">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Pricing:</span>
                    <span className="text-gray-500 line-through text-lg">
                      ₹{selectedProduct.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-white font-display">
                      ₹{selectedProduct.salePrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-green-500 font-black tracking-wider uppercase ml-1">
                      {Math.round(((selectedProduct.originalPrice - selectedProduct.salePrice) / selectedProduct.originalPrice) * 100)}% off!
                    </span>
                  </div>

                  {/* Included Badges list */}
                  <div className="space-y-2 pt-4">
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Direct Access High-speed Google Drive files</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>No monthly subscriptions. Just buy once, access forever</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Mobile and Desktop editing formats are fully verified</span>
                    </div>
                  </div>
                </div>

                {/* Secure Integrated Instant Checkout Box (Right Side) */}
                <div className="lg:col-span-5 bg-black/60 border border-white/[0.05] rounded-3xl p-6 sm:p-8 relative">
                  
                  {/* Real-time Countdown Timer */}
                  {selectedProduct.isTimerEnabled && (
                    <div className="flex items-center justify-between gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mb-6 text-xs font-bold leading-none uppercase">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-red-400 animate-pulse" />
                        <span>PRICE DROPS BACK SOON:</span>
                      </div>
                      <span className="font-mono text-sm leading-none tracking-tight">{formatTime(timeLeft)}</span>
                    </div>
                  )}

                  {submitSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 space-y-4"
                    >
                      <div className="mx-auto w-12 h-12 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 animate-bounce" />
                      </div>
                      <h4 className="text-xl font-black font-display uppercase tracking-tight">Access Verified</h4>
                      <p className="text-gray-400 text-xs">Your purchase is confirmed. Direct high-speed Drive access link unlocked!</p>
                      
                      {selectedProduct.successLink && (
                        <a
                          href={selectedProduct.successLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full justify-center py-3.5 bg-green-500 hover:bg-green-400 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                        >
                          DOWNLOAD THE PACK NOW
                        </a>
                      )}
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {/* Pricing Primary CTA Buy Button */}
                      <button
                        onClick={handleProceedToPayment}
                        disabled={isSubmitting}
                        className="relative w-full py-4.5 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <span>Working...</span>
                        ) : (
                          <>
                            <span>{selectedProduct.buttonText || 'PAY NOW & UNLOCK'}</span>
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center text-center justify-center my-4">
                        <div className="border-t border-white/5 flex-1" />
                        <span className="px-3 text-gray-500 text-[10px] uppercase font-bold tracking-widest">Already Bought?</span>
                        <div className="border-t border-white/5 flex-1" />
                      </div>

                      {/* Clean Frictionless Access Code Verification Form (No Name / Phone Fields as requested) */}
                      <form onSubmit={handleAccessWithCode} className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-left">
                          Enter Access Code To Download:
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            placeholder="Type Code (Optional)"
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 uppercase tracking-widest focus:border-purple-500 outline-none transition-colors"
                          />
                        </div>

                        {submitError && (
                          <p className="text-red-500 text-xs text-left leading-relaxed mt-1 font-semibold">
                            {submitError === 'INVALID_CODE' ? 'Access Code invalid. Redirected to custom help WhatsApp...' : 'This code has reached usage limit.'}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting || !accessCode.trim()}
                          className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Verify & Access Pack
                        </button>
                      </form>

                      {/* Payment Guarantee trust badges */}
                      <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                          <span>Direct Instant Vault</span>
                        </span>
                        <span className="text-gray-400">100% Secure Transaction</span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-[#0E0E13] border border-white/5 rounded-3xl">
              <p className="text-gray-500 font-sans text-xs">No active pack defined. Go to Admin to initialize any Product.</p>
            </div>
          )}
        </div>
      </section>

      {/* 9. FAQ Section */}
      <section className="py-20 md:py-28 px-6 bg-black/30 relative border-t border-white/[0.03]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs text-purple-400 font-black tracking-widest uppercase mb-2 block font-display">FAQ MODULE</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-display uppercase">FREQUENTLY ASKED QUESTIONS</h2>
          </div>

          <div className="space-y-4">
            {listFaqs.map((faq, idx) => (
              <div 
                key={faq.id || idx}
                className="bg-[#0E0E13]/85 border border-white/[0.06] rounded-2.5xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus:ring-0"
                >
                  <span className="text-white font-extrabold text-sm sm:text-base capitalize tracking-tight font-display">
                    {faq.question}
                  </span>
                  <div className={`p-1 bg-white/5 border border-white/10 rounded-full transition-transform duration-300 ${activeFaq === faq.id ? 'rotate-180 text-purple-400' : 'text-gray-400'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                
                <AnimatePresence>
                  {activeFaq === faq.id && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-white/[0.05] bg-black/20"
                    >
                      <div className="px-6 py-5 text-gray-400 text-xs sm:text-sm font-sans leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Final CTA Section */}
      <section className="py-24 px-6 text-center relative overflow-hidden border-t border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-blue-900/10 to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto relative z-10 space-y-6">
          <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-3.5 py-1.5 rounded-full inline-block font-display">
            Fast Response Window
          </span>
          <h2 className="text-3xl sm:text-6xl font-black tracking-tight font-display uppercase leading-tight">
            ACCELERATE YOUR VIDEO GROWTH
          </h2>
          <p className="text-gray-400 text-sm max-w-lg mx-auto font-sans leading-normal">
            No technical skills or visual presets sourcing issues. Tap into our production assets vault and instantly achieve professional visual aesthetics.
          </p>
          <div className="pt-6">
            <button
              onClick={scrollToPricing}
              className="px-10 py-5 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white font-extrabold text-sm uppercase tracking-widest rounded-2xl hover:scale-105 duration-300 shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all font-display"
            >
              Unlock Vault Instantly
            </button>
          </div>
        </div>
      </section>

      {/* 11. Custom Footer */}
      <footer className="bg-black/80 border-t border-white/[0.05] py-16 px-6 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
            <span className="text-xl font-bold font-display uppercase tracking-widest bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              {shopTitle === 'Ashiieditzx' ? 'ASHX GROW' : shopTitle}
            </span>
            <p className="text-gray-500 text-xs font-sans max-w-xs leading-normal">
              High fidelity digital download center helping edits achieve viral aesthetics in single clicks.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex items-center gap-4">
              {socialLinks.whatsapp && (
                <a 
                  href={`https://wa.me/${socialLinks.whatsapp}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-white/[0.03] hover:bg-green-500 hover:text-black hover:scale-110 rounded-full text-gray-400 transition-all border border-white/10"
                >
                  <MessageSquare className="w-5 h-5" />
                </a>
              )}
              {socialLinks.telegram && (
                <a 
                  href={`https://t.me/${socialLinks.telegram}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-white/[0.03] hover:bg-blue-500 hover:text-black hover:scale-110 rounded-full text-gray-400 transition-all border border-white/10"
                >
                  <ArrowRight className="w-5 h-5 -rotate-45" />
                </a>
              )}
              {socialLinks.instagram && (
                <a 
                  href={`https://instagram.com/${socialLinks.instagram}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-white/[0.03] hover:bg-pink-500 hover:text-black hover:scale-110 rounded-full text-gray-400 transition-all border border-white/10"
                >
                  <Star className="w-5 h-5" />
                </a>
              )}
            </div>
            
            <p className="text-gray-600 text-[10px] uppercase tracking-widest font-display">
              © 2026 {shopTitle === 'Ashiieditzx' ? 'ASHX GROW' : shopTitle}. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Lightbox / Interactive Modal for Screenshots / Proof Click-to-preview */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxImage(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl w-full max-h-[85vh] z-10 flex flex-col items-center"
            >
              <button 
                onClick={() => setLightboxImage(null)} 
                className="absolute -top-12 right-0 p-2.5 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img 
                src={lightboxImage} 
                className="w-full h-full max-h-[75vh] object-contain rounded-2xl border border-white/10 shadow-3xl" 
                alt="Proof Preview"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full screen Video Preview Modal */}
      <AnimatePresence>
        {activeVideoModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveVideoModal(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-md w-full aspect-[9/16] z-10 bg-black rounded-3xl overflow-hidden border border-white/10 shadow-3xl"
            >
              <button 
                onClick={() => setActiveVideoModal(null)} 
                className="absolute top-4 right-4 z-20 p-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <video 
                src={activeVideoModal}
                className="w-full h-full object-cover"
                autoplay
                controls
                playsInline
                loop
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
