/**
 * PromoCodeInput — Coupon/Promo code input with validation
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGift, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import { useMutation } from '@apollo/client/react';
import { APPLY_PROMO_CODE_MUTATION } from '@/graphql/mutations/authMutation';

export default function PromoCodeInput({ onApplied }) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [applyPromo, { loading }] = useMutation(APPLY_PROMO_CODE_MUTATION);

  const handleApply = async () => {
    if (!code.trim()) return;
    setResult(null);
    try {
      const { data } = await applyPromo({ variables: { code: code.trim() } });
      const res = data?.applyPromoCode;
      setResult(res);
      if (res?.success && onApplied) {
        onApplied(res);
      }
    } catch (err) {
      setResult({ success: false, message: err.message || 'Failed to apply code' });
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <FiGift className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-bold text-white">Have a promo code?</span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null); }}
          placeholder="Enter code"
          maxLength={20}
          className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm font-mono tracking-wider focus:outline-none focus:border-purple-500/50 uppercase"
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-5 py-2.5 bg-purple-600 text-white font-bold text-sm rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-40 flex items-center gap-2"
        >
          {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : 'Apply'}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-3 flex items-center gap-2 text-sm ${
              result.success ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {result.success ? <FiCheck className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
            <span>{result.message}</span>
            {result.discountPercent > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                -{result.discountPercent}%
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
