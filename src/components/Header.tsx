import { ShoppingCart, Menu, X, MessageCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onSecretClick?: () => void;
  purchasedCount?: number;
  onCartClick?: () => void;
  profileImageUrl?: string;
  shopTitle?: string;
}

export default function Header({ onSecretClick, purchasedCount = 0, onCartClick, profileImageUrl, shopTitle = 'Ashiieditzx' }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const clickCount = useRef(0);
  const lastClick = useRef(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClick.current < 1000) {
      clickCount.current++;
    } else {
      clickCount.current = 1;
    }
    lastClick.current = now;

    if (clickCount.current === 5) {
      onSecretClick?.();
      clickCount.current = 0;
    }
  };

  const supportLink = "https://wa.me/919623508870?text=Hello%20I%20need%20support";

  return (
    <header className="bg-black border-b border-white/10 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3 cursor-default select-none" onClick={handleLogoClick}>
        {profileImageUrl && (
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-lg">
            <img src={profileImageUrl} alt="Admin" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="text-white font-black text-lg tracking-tighter leading-none font-display flex flex-col items-start">
          <span className="text-yellow-500 uppercase tracking-widest text-[10px] mb-0.5">Official</span>
          <span>{shopTitle}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer group" onClick={onCartClick}>
          <ShoppingCart className="text-yellow-500 w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            {purchasedCount}
          </span>
        </div>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-yellow-500 p-1.5 rounded-sm hover:bg-yellow-400 transition-colors"
        >
          {isMenuOpen ? <X className="text-black w-6 h-6" /> : <Menu className="text-black w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-64 bg-[#111] border-l border-white/10 z-50 p-6 shadow-2xl"
            >
              <div className="flex justify-end mb-8">
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="text-white w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <a 
                  href={supportLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full bg-green-500/10 hover:bg-green-500/20 text-green-500 font-bold p-4 rounded-xl transition-all border border-green-500/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  Support Customer
                </a>
              </div>

              <div className="absolute bottom-8 left-6 right-6 text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                  © 2026 {shopTitle}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
