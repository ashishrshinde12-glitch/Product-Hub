import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { ChevronLeft, Plus, Trash2, Copy, CheckCircle, RefreshCw, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ValidAccessCode {
  id: string;
  code: string;
  used: boolean;
  usageLimit?: number;
  usageCount?: number;
  createdAt: any;
}

export default function AccessCodeGenerator({ onBack }: { onBack: () => void }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('admin_auth') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [codes, setCodes] = useState<ValidAccessCode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [usageLimit, setUsageLimit] = useState<number | string>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // We keep using the collection 'valid_utrs' to avoid breaking existing data, 
    // but rename it in the UI and state as 'Access Codes'
    const q = query(collection(db, 'valid_utrs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ValidAccessCode[];
      setCodes(data);
    }, (err) => {
      console.error('Access Code Snapshot Error:', err);
    });
    return () => unsubscribe();
  }, []);

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      // Generate a random 12-digit numeric code
      let code = "";
      for (let i = 0; i < 12; i++) {
        code += Math.floor(Math.random() * 10).toString();
      }

      await addDoc(collection(db, 'valid_utrs'), {
        code,
        used: false,
        usageLimit: Number(usageLimit) || 1,
        usageCount: 0,
        createdAt: Timestamp.now()
      });
    } catch (err) {
      console.error('Error generating Access Code:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteCode = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'valid_utrs', id));
    } catch (err) {
      console.error('Error deleting Access Code:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'ashish12') {
      setIsLoggedIn(true);
      sessionStorage.setItem('admin_auth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="bg-yellow-500 p-4 rounded-2xl mb-4">
              <Key className="text-black w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Login</h1>
            <p className="text-gray-500 text-sm">Enter password to access Access Code Generator</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter Password"
                className={`w-full bg-black border ${loginError ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-4 text-white focus:border-yellow-500 outline-none transition-all`}
                autoFocus
              />
              {loginError && <p className="text-red-500 text-xs text-center">Incorrect password. Please try again.</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl transition-all active:scale-95"
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full text-gray-500 text-sm hover:text-white transition-colors"
            >
              Back
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black text-white p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/10 pb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 truncate">
                <Key className="text-yellow-500 w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                Access Code Generator
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate">Generate multi-use access codes</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex items-center justify-between sm:justify-start gap-2 bg-[#111] border border-white/10 p-1 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3">Usage Limit:</span>
              <input 
                type="number" 
                min="1"
                max="100"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                className="w-16 bg-black border border-white/10 rounded-lg px-2 py-2 text-sm text-center font-bold text-yellow-500 outline-none focus:border-yellow-500 transition-all"
              />
            </div>
            <button
              onClick={generateCode}
              disabled={isGenerating}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Generate New Code
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {codes.map((code) => (
              <motion.div
                key={code.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-[#111] border ${code.used || (code.usageCount !== undefined && code.usageLimit !== undefined && code.usageCount >= code.usageLimit) ? 'border-red-500/20 opacity-60' : 'border-white/10'} rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition-all overflow-hidden`}
              >
                <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${code.used || (code.usageCount !== undefined && code.usageLimit !== undefined && code.usageCount >= code.usageLimit) ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    <Key className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-lg sm:text-xl font-mono font-bold tracking-wider truncate">{code.code}</span>
                      <div className="flex items-center gap-2">
                        {(code.used || (code.usageCount !== undefined && code.usageLimit !== undefined && code.usageCount >= code.usageLimit)) ? (
                          <span className="text-[9px] sm:text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest whitespace-nowrap">Used</span>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest whitespace-nowrap">Active</span>
                        )}
                        {code.usageLimit !== undefined && (
                          <span className="text-[9px] sm:text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest whitespace-nowrap">
                            {code.usageCount || 0}/{code.usageLimit}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-500 text-[10px] sm:text-xs">
                      {code.createdAt?.toDate().toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                  <button
                    onClick={() => copyToClipboard(code.code, code.id)}
                    className="p-2 sm:p-3 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white flex items-center gap-2"
                    title="Copy Code"
                  >
                    {copiedId === code.id ? <CheckCircle className="w-4 h-4 sm:w-5 h-5 text-green-500" /> : <Copy className="w-4 h-4 sm:w-5 h-5" />}
                    <span className="text-[10px] font-bold uppercase sm:hidden">Copy</span>
                  </button>
                  <button
                    onClick={() => deleteCode(code.id)}
                    className="p-2 sm:p-3 hover:bg-red-500/10 rounded-xl transition-colors text-gray-500 hover:text-red-500 flex items-center gap-2"
                    title="Delete Code"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase sm:hidden">Delete</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {codes.length === 0 && (
            <div className="text-center py-20 bg-[#111] border border-dashed border-white/10 rounded-3xl">
              <Key className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">No Access Codes generated yet. Click the button above to start.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
