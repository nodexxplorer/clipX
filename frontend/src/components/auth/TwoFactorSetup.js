/**
 * TwoFactorSetup — 2FA TOTP Setup & Management Component
 * Shows QR code, manual secret, verify step, and backup codes
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShield, FiCopy, FiCheck, FiX, FiAlertTriangle, FiLock } from 'react-icons/fi';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  SETUP_2FA_MUTATION,
  VERIFY_2FA_MUTATION,
  DISABLE_2FA_MUTATION,
  GET_2FA_STATUS,
} from '@/graphql/mutations/authMutation';

export default function TwoFactorSetup() {
  const [step, setStep] = useState('idle'); // idle | setup | verify | backup | enabled
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef([]);

  const { data: statusData, refetch: refetchStatus } = useQuery(GET_2FA_STATUS, {
    fetchPolicy: 'network-only',
  });
  const is2FAEnabled = statusData?.my2FAStatus || false;

  const [setup2FA, { loading: setupLoading }] = useMutation(SETUP_2FA_MUTATION);
  const [verify2FA, { loading: verifyLoading }] = useMutation(VERIFY_2FA_MUTATION);
  const [disable2FA, { loading: disableLoading }] = useMutation(DISABLE_2FA_MUTATION);

  const handleSetup = async () => {
    setError('');
    try {
      const { data } = await setup2FA();
      if (data?.setup2FA) {
        setSetupData(data.setup2FA);
        setStep('setup');
      }
    } catch (err) {
      setError(err.message || 'Failed to start 2FA setup');
    }
  };

  const handleVerify = async () => {
    setError('');
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    try {
      const { data } = await verify2FA({ variables: { code } });
      if (data?.verify2FA?.success) {
        setStep('backup');
        refetchStatus();
      }
    } catch (err) {
      setError(err.message || 'Invalid code');
    }
  };

  const handleDisable = async () => {
    setError('');
    try {
      const { data } = await disable2FA({ variables: { password: disablePassword || null } });
      if (data?.disable2FA?.success) {
        setStep('idle');
        setSetupData(null);
        setDisablePassword('');
        refetchStatus();
      }
    } catch (err) {
      setError(err.message || 'Failed to disable 2FA');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // OTP digit input handler
  const handleCodeChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const newCode = code.split('');
    newCode[idx] = val;
    const joined = newCode.join('').slice(0, 6);
    setCode(joined);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleCodeKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  // ─── Already enabled: show status + disable button ───
  if (is2FAEnabled && step === 'idle') {
    return (
      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <FiShield className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Two-Factor Authentication</h3>
            <p className="text-green-400 text-sm font-medium">Enabled ✓</p>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Your account is protected with TOTP-based two-factor authentication.
        </p>

        {error && (
          <p className="text-red-400 text-sm mb-3 flex items-center gap-1">
            <FiAlertTriangle className="w-4 h-4" /> {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <input
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Password to disable"
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-red-500/50"
          />
          <button
            onClick={handleDisable}
            disabled={disableLoading}
            className="px-4 py-2.5 bg-red-600/20 border border-red-500/30 text-red-400 font-bold text-sm rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
          >
            {disableLoading ? 'Disabling...' : 'Disable 2FA'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Backup codes step ───
  if (step === 'backup' && setupData) {
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
            <FiCheck className="w-7 h-7 text-green-400" />
          </div>
          <h3 className="text-xl font-black text-white">2FA Enabled! 🎉</h3>
          <p className="text-gray-400 text-sm mt-1">Save these backup codes in a safe place.</p>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-500 font-bold mb-3 uppercase tracking-wider">Backup Recovery Codes</p>
          <div className="grid grid-cols-2 gap-2">
            {setupData.backupCodes.map((bc, i) => (
              <code key={i} className="text-primary-400 bg-white/5 rounded px-3 py-1.5 text-sm text-center font-mono">
                {bc}
              </code>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            copyToClipboard(setupData.backupCodes.join('\n'));
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-medium hover:bg-white/10 transition-colors mb-3"
        >
          {copied ? <FiCheck className="w-4 h-4 text-green-400" /> : <FiCopy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy All Codes'}
        </button>

        <button
          onClick={() => { setStep('idle'); setSetupData(null); }}
          className="w-full py-2.5 text-sm text-primary-400 font-bold rounded-lg bg-primary-600/10 hover:bg-primary-600/20 transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  // ─── Verify step ───
  if (step === 'setup' && setupData) {
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">Set Up Two-Factor Authentication</h3>
        <p className="text-sm text-gray-400 mb-5">
          Scan this QR code with Google Authenticator, Authy, or any TOTP app.
        </p>

        {/* QR Code (using Google Chart API as fallback) */}
        <div className="flex justify-center mb-5">
          <div className="bg-white p-3 rounded-xl">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qrUri)}`}
              alt="2FA QR Code"
              className="w-48 h-48"
            />
          </div>
        </div>

        {/* Manual entry secret */}
        <div className="bg-black/30 border border-white/5 rounded-lg p-3 mb-5">
          <p className="text-xs text-gray-500 mb-1 font-bold">Can't scan? Enter manually:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-primary-400 text-sm font-mono break-all">{setupData.secret}</code>
            <button
              onClick={() => copyToClipboard(setupData.secret)}
              className="p-1.5 text-gray-500 hover:text-white transition-colors"
            >
              {copied ? <FiCheck className="w-4 h-4 text-green-400" /> : <FiCopy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 6-digit verification */}
        <p className="text-sm text-gray-300 font-medium mb-3">Enter the 6-digit code from your app:</p>
        <div className="flex gap-2 justify-center mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={code[i] || ''}
              onChange={(e) => handleCodeChange(i, e.target.value)}
              onKeyDown={(e) => handleCodeKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-3 flex items-center gap-1">
            <FiAlertTriangle className="w-4 h-4" /> {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => { setStep('idle'); setSetupData(null); setCode(''); setError(''); }}
            className="flex-1 py-2.5 text-sm text-gray-400 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={verifyLoading || code.length !== 6}
            className="flex-1 py-2.5 text-sm text-white bg-primary-600 rounded-lg font-bold hover:bg-primary-500 transition-colors disabled:opacity-50"
          >
            {verifyLoading ? 'Verifying...' : 'Verify & Enable'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Idle: show enable button ───
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
          <FiShield className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">Two-Factor Authentication</h3>
          <p className="text-gray-500 text-sm">Add an extra layer of security</p>
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        Protect your account with a TOTP authenticator app. You'll need to enter a code from your phone every time you log in.
      </p>

      {error && (
        <p className="text-red-400 text-sm mb-3 flex items-center gap-1">
          <FiAlertTriangle className="w-4 h-4" /> {error}
        </p>
      )}

      <button
        onClick={handleSetup}
        disabled={setupLoading}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors disabled:opacity-50"
      >
        <FiLock className="w-4 h-4" />
        {setupLoading ? 'Setting up...' : 'Enable 2FA'}
      </button>
    </div>
  );
}
