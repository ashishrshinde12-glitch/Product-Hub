import React, { useState } from 'react';
import { Product } from '../types';
import { ChevronLeft, Play, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductPageProps {
  product: Product;
  onBack: () => void;
  onPurchase?: (productId: string) => void;
  purchasedCount?: number;
  onCartClick?: () => void;
  shopTitle?: string;
}

export default function ProductPage({ product, onBack }: ProductPageProps) {
  const handleProceedToPayment = () => {
    if (product.buttonLink) {
      window.open(product.buttonLink, '_blank');
    }
  };

  const validDemoVideos = product.demoVideoLinks?.filter(link => link.trim() !== '') || [];
  const [previewsHidden, setPreviewsHidden] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white font-sans pb-32 relative">
      {/* Dynamic Header */}
      <header className="p-4 flex items-center gap-4 fixed top-0 w-full z-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <button onClick={onBack} className="p-2.5 bg-black/40 backdrop-blur-md rounded-full pointer-events-auto border border-white/10 hover:bg-black/60 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      </header>
      
      <div className="pt-24 px-4 sm:px-6 max-w-2xl mx-auto space-y-6">
        
        {/* Title */}
        <motion.div
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
        >
           <h1 className="text-2xl sm:text-3xl font-black text-center uppercase tracking-wider font-display">
             {product.title}
           </h1>
        </motion.div>

        {/* Banner Image */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.03)] border border-white/5 relative"
        >
          <img 
            src={product.image} 
            alt={product.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Description Section */}
        {product.description && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-[11px] font-black text-gray-500 mb-4 tracking-[0.2em] uppercase">Description</h2>
            <div className="text-[14px] sm:text-[15px] leading-relaxed text-gray-300 font-medium whitespace-pre-wrap">
              {product.description}
            </div>
          </motion.div>
        )}

        {/* Video Previews */}
        {validDemoVideos.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <h2 className="text-[11px] font-black text-gray-500 mb-4 tracking-[0.2em] uppercase">Watch Sample Previews</h2>
            <div className="space-y-3">
              {validDemoVideos.map((link, idx) => (
                <motion.a 
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  animate={{ 
                    boxShadow: ['0px 0px 15px rgba(59,130,246,0.3)', '0px 0px 30px rgba(59,130,246,0.6)', '0px 0px 15px rgba(59,130,246,0.3)'],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="group relative flex items-center justify-between bg-[#111116] hover:bg-[#1A1A24] border border-blue-500/30 hover:border-blue-500/60 p-4 sm:p-5 rounded-2xl transition-all overflow-hidden"
                >
                  <motion.div 
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-purple-500/10" 
                  />
                  
                  <div className="relative flex items-center gap-4">
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="bg-blue-600 p-3.5 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.6)] transition-transform"
                    >
                      <Play className="w-5 h-5 text-white fill-white" />
                    </motion.div>
                    <div className="text-left">
                      <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none mb-1.5 transition-colors">Demo Video #{idx + 1}</div>
                      <div className="text-sm sm:text-base font-black text-white tracking-tight">CLICK TO WATCH PREVIEW</div>
                    </div>
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="relative bg-blue-500/20 p-2.5 rounded-full transition-colors hidden sm:block"
                  >
                     <ArrowRight className="w-5 h-5 text-blue-400" />
                  </motion.div>
                </motion.a>
              ))}
            </div>
            <div className="text-center mt-5 mb-1 text-[9px] text-gray-500 uppercase tracking-widest font-black font-mono">
              Links open safely in a new tab
            </div>
          </motion.div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-[#111116] border-t border-white/[0.05] p-4 sm:p-5 z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5 ml-0.5">Amount Total</div>
            <div className="flex items-end gap-2.5">
              <span className="text-3xl font-black leading-none tracking-tight">₹{product.salePrice}</span>
              <span className="text-sm font-bold text-gray-600 line-through pb-1">₹{product.originalPrice}</span>
            </div>
          </div>

          <motion.button
            onClick={handleProceedToPayment}
            animate={{ scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatDelay: 5,
              ease: "easeInOut"
            }}
            className="bg-[#FFC93A] hover:bg-[#FACC15] text-black px-6 sm:px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-xs sm:text-sm tracking-widest shadow-[0_0_20px_rgba(250,204,21,0.2)] flex-shrink-0"
          >
            {product.buttonText || 'ACCESS NOW'} ⚡
          </motion.button>
        </div>
      </div>
    </div>
  );
}

