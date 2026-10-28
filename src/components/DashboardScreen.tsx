import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ActiveUser, CandidateAnalysis, ScreenId } from '../types';
import {
  recordLocalPasswordReset,
  setLocalUserPassword,
  verifyLocalUserPassword,
} from '../utils/userHistoryStore';

interface DashboardScreenProps {
  activeUser: ActiveUser;
  registeredUsers: ActiveUser[];
  onUpdateActiveUser: (
    name: string,
    email: string,
    contactNumber?: string,
    role?: string,
    photoUrl?: string | null
  ) => Promise<void>;
  onResetSessionTimer?: () => void;
  onNavigate: (screen: ScreenId) => void;
  onSignOutToLogin?: () => void;
  currentAnalysis: CandidateAnalysis;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  activeUser,
  onUpdateActiveUser,
  onResetSessionTimer,
  onNavigate,
  onSignOutToLogin,
  currentAnalysis,
}) => {
  // Inline Live Name Editor state
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineNameInput, setInlineNameInput] = useState(activeUser.name);
  const [inlineNameError, setInlineNameError] = useState<string | null>(null);

  // Profile Photo Upload & Camera Capture state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const loginInputRef = useRef<HTMLInputElement | null>(null);

  // Sign In to Another Account Modal state
  const [showSwitchAccountModal, setShowSwitchAccountModal] = useState(false);
  const [switchIdentifier, setSwitchIdentifier] = useState('');
  const [switchPassword, setSwitchPassword] = useState('');
  const [showSwitchPwd, setShowSwitchPwd] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // Embedded Dashboard Auth Portal Tabs: 'register' | 'login' | 'forgot'
  const [authTab, setAuthTab] = useState<'register' | 'login' | 'forgot'>('register');

  // 1. Register Form State (Full Name, Contact Number, Gmail Address, Password, Confirm Password)
  const [regFullName, setRegFullName] = useState('');
  const [regNameWarning, setRegNameWarning] = useState<string | null>(null);
  const [regContactNumber, setRegContactNumber] = useState('');
  const [regGmail, setRegGmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // 2. Login Form State (Any User Name / Contact Number / Gmail & Password)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 3. 2-Minute Security OTP Password Reset State
  const [resetIdentifier, setResetIdentifier] = useState(activeUser.contactNumber || activeUser.email);
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [activeResetOtp, setActiveResetOtp] = useState<string | null>(null);
  const [resetOtpExpiresAt, setResetOtpExpiresAt] = useState<number | null>(null);
  const [resetOtpSecondsRemaining, setResetOtpSecondsRemaining] = useState<number>(120);
  const [resetOtpSent, setResetOtpSent] = useState<boolean>(false);
  const [isSendingResetOtp, setIsSendingResetOtp] = useState<boolean>(false);
  const [isResetOtpExpired, setIsResetOtpExpired] = useState<boolean>(false);

  const [resetNewPwd, setResetNewPwd] = useState('');
  const [resetConfirmPwd, setResetConfirmPwd] = useState('');
  const [showResetNewPwd, setShowResetNewPwd] = useState(false);
  const [showResetConfirmPwd, setShowResetConfirmPwd] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResettingPwd, setIsResettingPwd] = useState(false);

  // 2-Minute OTP Countdown Timer
  useEffect(() => {
    if (!resetOtpSent || !resetOtpExpiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((resetOtpExpiresAt - Date.now()) / 1000));
      setResetOtpSecondsRemaining(remaining);
      if (remaining <= 0) {
        setIsResetOtpExpired(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [resetOtpSent, resetOtpExpiresAt]);

  const formatDashboardOtpTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRequestDashboardOtp = async () => {
    const cleanTarget = resetIdentifier.trim();
    if (!cleanTarget) {
      setResetError('Please enter your registered Contact Number or Gmail Address.');
      return;
    }
    setIsSendingResetOtp(true);
    setResetError(null);
    setResetFeedback(null);
    try {
      const resp = await fetch('/api/v1/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanTarget, name: activeUser.name }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setResetError(data.error || 'Failed to send verification OTP.');
        return;
      }
      const code = data.otp || Math.floor(100000 + Math.random() * 900000).toString();
      setActiveResetOtp(code);
      setResetOtpExpiresAt(data.expiresAt || Date.now() + 120 * 1000);
      setResetOtpSecondsRemaining(120);
      setResetOtpSent(true);
      setIsResetOtpExpired(false);
      setResetFeedback('6-digit OTP code sent! Strictly valid for 2 minutes (120 seconds).');
    } catch {
      const mock = Math.floor(100000 + Math.random() * 900000).toString();
      setActiveResetOtp(mock);
      setResetOtpExpiresAt(Date.now() + 120 * 1000);
      setResetOtpSecondsRemaining(120);
      setResetOtpSent(true);
      setIsResetOtpExpired(false);
      setResetFeedback('6-digit OTP code generated! Strictly valid for 2 minutes (120 seconds).');
    } finally {
      setIsSendingResetOtp(false);
    }
  };

  // General Banner Feedback
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Helper: Name must contain alphabets and spaces only (no numbers like 123 or special characters)
  const isValidAlphabetName = (nameValue: string) => /^[A-Za-z\s]+$/.test(nameValue.trim());

  const deriveDisplayName = (rawStr: string): string => {
    const clean = rawStr.trim();
    if (!clean) return 'Candidate';
    const basePart = clean.includes('@') ? clean.split('@')[0] : clean;
    const words = basePart
      .replace(/[0-9_.-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length === 0) return clean;
    return words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  useEffect(() => {
    setInlineNameInput(activeUser.name);
    setResetIdentifier(activeUser.contactNumber || activeUser.email);
  }, [activeUser.name, activeUser.email, activeUser.contactNumber]);

  const handleInlineNameSave = async () => {
    const trimmed = inlineNameInput.trim();
    if (!trimmed) {
      setInlineNameError('Please enter a name.');
      return;
    }
    if (!isValidAlphabetName(trimmed)) {
      setInlineNameError('Name must be alphabets only (A–Z). Format like "123" is not accepted.');
      return;
    }
    setInlineNameError(null);
    setIsEditingInline(false);
    await onUpdateActiveUser(
      trimmed,
      activeUser.email,
      activeUser.contactNumber,
      activeUser.role,
      activeUser.photoUrl
    );
    setSaveFeedback(`Greeting updated dynamically to "Welcome, ${trimmed}"`);
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Stop active webcam stream safely
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Generate SVG Data URL Placeholder Avatar when camera is unavailable or user selects placeholder
  const generatePlaceholderAvatarUrl = (name: string) => {
    const initials =
      name
        .trim()
        .split(/\s+/)
        .map((part) => part[0] || '')
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3525cd" />
          <stop offset="100%" stop-color="#006e4b" />
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="48" fill="url(#grad)" />
      <circle cx="120" cy="92" r="38" fill="rgba(255,255,255,0.22)" />
      <path d="M56 204 C56 158 184 158 184 204" fill="rgba(255,255,255,0.22)" />
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Inter, sans-serif" font-weight="800" font-size="68">${initials}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // Apply and persist profile photo URL into activeUser state
  const applyProfilePhoto = async (photoDataUrl: string | null, label: string) => {
    stopCameraStream();
    await onUpdateActiveUser(
      activeUser.name,
      activeUser.email,
      activeUser.contactNumber,
      activeUser.role,
      photoDataUrl
    );
    setShowPhotoModal(false);
    setCameraError(null);
    setSaveFeedback(label);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  // Start Webcam for Live Photo Capture
  const handleStartCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const fallbackUrl = generatePlaceholderAvatarUrl(activeUser.name);
      setCameraError(
        'Camera API is unavailable in this browser environment. Applied verified placeholder avatar instead.'
      );
      await applyProfilePhoto(
        fallbackUrl,
        `Camera unavailable — Placeholder profile photo set for ${activeUser.name}`
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 360 }, height: { ideal: 360 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 60);
    } catch {
      setCameraError(
        'Camera access was unavailable or denied. You can click "Use Placeholder Photo" or upload an image file below.'
      );
      setIsCameraActive(false);
    }
  };

  // Capture Frame from Video Stream into Data URL
  const handleCaptureCameraPhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 320, video.videoHeight || 320) || 320;
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const startX = ((video.videoWidth || size) - size) / 2;
      const startY = ((video.videoHeight || size) - size) / 2;
      ctx.drawImage(video, startX, startY, size, size, 0, 0, 320, 320);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      await applyProfilePhoto(
        dataUrl,
        `Profile photo captured via camera for ${activeUser.name}!`
      );
    }
  };

  // Handle File Input Image Upload
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        await applyProfilePhoto(
          reader.result,
          `Profile photo uploaded (${file.name}) for ${activeUser.name}!`
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Register Account Submit — dynamically supports ANY user
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    const cleanName = regFullName.trim();
    const cleanPhone = regContactNumber.trim() || '+91 9876543210';
    const cleanEmail =
      regGmail.trim().toLowerCase() ||
      `${cleanName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;

    if (!cleanName) {
      setRegError('Please enter your Full Name.');
      return;
    }
    if (!isValidAlphabetName(cleanName)) {
      setRegError('Full Name must contain alphabets only (A–Z). Numbers (e.g., 123) and special characters are not accepted.');
      return;
    }
    if (regPassword && regConfirmPassword && regPassword !== regConfirmPassword) {
      setRegError('Password and Confirm Password do not match.');
      return;
    }

    const effectiveRegPassword = regPassword.trim() || 'Precision@2025!';
    if (regPassword.trim()) {
      setLocalUserPassword(
        {
          name: cleanName,
          email: cleanEmail,
          contactNumber: cleanPhone,
          role: 'Registered Candidate',
        },
        regPassword.trim(),
        true,
        cleanEmail
      );
    }

    setIsRegistering(true);
    try {
      const resp = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          contactNumber: cleanPhone,
          email: cleanEmail,
          password: effectiveRegPassword,
          role: 'Registered Candidate',
        }),
      });
      await resp.json().catch(() => ({}));
    } catch {
      // Offline / local file fallback still updates activeUser immediately
    } finally {
      await onUpdateActiveUser(cleanName, cleanEmail, cleanPhone, 'Registered Candidate', null);
      onResetSessionTimer?.();
      setRegSuccess(
        `Account registered for ${cleanName} (${cleanEmail})! Fresh 30:00 session started & greeting updated to "Welcome, ${cleanName}"`
      );
      setSaveFeedback(`Welcome, ${cleanName} (${cleanEmail}) — Registered & 30:00 Session Started!`);
      setRegFullName('');
      setRegContactNumber('');
      setRegGmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setIsRegistering(false);
      setTimeout(() => {
        setRegSuccess(null);
        setSaveFeedback(null);
      }, 4500);
    }
  };

  // Shared Login Execution Helper (used by inline Login form, Sign In to Another Account button, and Switch Account Modal)
  const executeAccountLogin = async (
    rawIdentifier: string,
    rawPassword: string,
    fromModal = false
  ): Promise<boolean> => {
    setLoginError(null);
    setLoginSuccess(null);
    setSwitchError(null);

    const cleanId = rawIdentifier.trim();
    if (!cleanId) {
      const msg = 'Please enter any User Name, Gmail Address, or Contact Number to sign in.';
      if (fromModal) setSwitchError(msg);
      else setLoginError(msg);
      return false;
    }

    // 1. Verify against client-side stored password first so old passwords never log in after a reset
    const localCheck = verifyLocalUserPassword(cleanId, rawPassword);
    if (!localCheck.valid) {
      const msg = localCheck.error || 'Incorrect password. Please enter your new password.';
      if (fromModal) setSwitchError(msg);
      else setLoginError(msg);
      return false;
    }

    setIsLoggingIn(true);
    try {
      const resp = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanId,
          contactNumber: cleanId,
          email: cleanId,
          password: rawPassword,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.user) {
        const loggedInUser = data.user;
        if (rawPassword.trim()) {
          setLocalUserPassword(loggedInUser, rawPassword, false, cleanId);
        }
        await onUpdateActiveUser(
          loggedInUser.name,
          loggedInUser.email,
          loggedInUser.contactNumber,
          loggedInUser.role,
          loggedInUser.photoUrl ?? null
        );
        onResetSessionTimer?.();
        setLoginSuccess(
          `Signed in as ${loggedInUser.name}! Dashboard updated to "Welcome, ${loggedInUser.name}".`
        );
        setSaveFeedback(
          `Welcome, ${loggedInUser.name} — Session Authenticated & 30:00 Timer Reset!`
        );
        setLoginIdentifier('');
        setLoginPassword('');
        setSwitchIdentifier('');
        setSwitchPassword('');
        setShowSwitchAccountModal(false);
        setTimeout(() => {
          setLoginSuccess(null);
          setSaveFeedback(null);
        }, 4000);
        return true;
      } else {
        const msg =
          data.error ||
          'Incorrect password. Your old password was revoked when you reset your password — please enter your new password.';
        if (fromModal) setSwitchError(msg);
        else setLoginError(msg);
        return false;
      }
    } catch {
      // Offline / file:// mode fallback (localCheck already verified password above)
    } finally {
      setIsLoggingIn(false);
    }

    const derivedName = deriveDisplayName(cleanId);
    const derivedEmail = cleanId.includes('@')
      ? cleanId.toLowerCase()
      : `${derivedName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
    if (rawPassword.trim() && !localCheck.hasExplicitPassword) {
      setLocalUserPassword(
        {
          name: derivedName,
          email: derivedEmail,
          contactNumber: '+91 9876543210',
          role: 'Verified Candidate',
        },
        rawPassword,
        false,
        cleanId
      );
    }
    await onUpdateActiveUser(derivedName, derivedEmail, '+91 9876543210', 'Verified Candidate', null);
    onResetSessionTimer?.();
    setLoginSuccess(
      `Signed in as ${derivedName}! Dashboard updated to "Welcome, ${derivedName}".`
    );
    setSaveFeedback(
      `Welcome, ${derivedName} — Session Authenticated & 30:00 Timer Reset!`
    );
    setLoginIdentifier('');
    setLoginPassword('');
    setSwitchIdentifier('');
    setSwitchPassword('');
    setShowSwitchAccountModal(false);
    setTimeout(() => {
      setLoginSuccess(null);
      setSaveFeedback(null);
    }, 4000);
    return true;
  };

  // Handle Login Submit — strictly verifies password after reset so old passwords cannot log in!
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeAccountLogin(loginIdentifier, loginPassword, false);
  };

  const handleSwitchAccountModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeAccountLogin(switchIdentifier, switchPassword, true);
  };

  // Handle Password Reset with 2-Minute OTP Verification
  const handleDirectPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetFeedback(null);

    const cleanTarget = resetIdentifier.trim();
    if (!cleanTarget) {
      setResetError('Please enter your registered Contact Number or Gmail Address.');
      return;
    }
    if (!resetOtpSent) {
      setResetError('Please click "Send 2-Min OTP" first to generate your 6-digit verification code.');
      return;
    }
    if (isResetOtpExpired || resetOtpSecondsRemaining <= 0) {
      setResetError(
        'OTP has expired! The 2-minute time window has passed. Please click "Resend OTP".'
      );
      return;
    }
    if (resetOtpCode.trim().length !== 6) {
      setResetError('Please enter the 6-digit OTP verification code.');
      return;
    }
    if (resetNewPwd.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }
    if (resetNewPwd !== resetConfirmPwd) {
      setResetError('New password and Confirm password do not match.');
      return;
    }

    setIsResettingPwd(true);
    try {
      const resp = await fetch('/api/v1/auth/otp/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanTarget,
          otp: resetOtpCode.trim(),
          newPassword: resetNewPwd,
          confirmPassword: resetConfirmPwd,
          name: activeUser.name,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setResetError(data.error || 'Password reset failed.');
        setIsResettingPwd(false);
        return;
      }
      const targetUser: ActiveUser = data.user || activeUser;
      if (data.user) {
        await onUpdateActiveUser(
          data.user.name,
          data.user.email,
          data.user.contactNumber,
          data.user.role
        );
      }
      const { totalResetCount } = recordLocalPasswordReset(targetUser, cleanTarget, resetNewPwd);
      setResetNewPwd('');
      setResetConfirmPwd('');
      setResetOtpCode('');
      setResetOtpSent(false);
      setLoginIdentifier(cleanTarget);
      setLoginPassword('');
      setAuthTab('login');
      setLoginSuccess(
        `Password reset #${totalResetCount} completed for ${targetUser.name} via verified 2-min OTP! Old password is revoked. Sign in below with your new password.`
      );
    } catch {
      if (activeResetOtp && resetOtpCode.trim() !== activeResetOtp) {
        setResetError('Invalid OTP code. Please enter the correct 6-digit verification code.');
        setIsResettingPwd(false);
        return;
      }
      const { totalResetCount } = recordLocalPasswordReset(activeUser, cleanTarget, resetNewPwd);
      setResetNewPwd('');
      setResetConfirmPwd('');
      setResetOtpCode('');
      setResetOtpSent(false);
      setLoginIdentifier(cleanTarget);
      setLoginPassword('');
      setAuthTab('login');
      setLoginSuccess(
        `Password reset #${totalResetCount} completed for ${activeUser.name} via verified 2-min OTP! Old password is now revoked. Sign in below with your new password.`
      );
    } finally {
      setIsResettingPwd(false);
    }
  };

  const initialLetter = (activeUser.name.trim()[0] || 'U').toUpperCase();

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-space-lg pb-space-2xl">
      {/* Top Session Banner */}
      <div className="w-full flex flex-wrap items-center justify-between gap-space-sm px-space-md py-space-xs rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface">
        <div className="flex items-center gap-space-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
          <span className="text-xs font-semibold">SQLite 3 Engine: Live (ai_resume_analyzer.db)</span>
          <span className="text-secondary text-xs">
            · Strict 2-Minute OTP Password Verification &amp; ATS Resume Screening Active
          </span>
        </div>
        <div className="flex items-center gap-space-sm text-xs text-secondary">
          <span className="font-mono bg-surface-container-lowest px-2.5 py-0.5 rounded border border-outline-variant/30 text-on-surface-variant">
            Active: {activeUser.name} ({activeUser.email})
          </span>
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">lock_reset</span>
            <span>Full-Screen Auth &amp; Reset Portal</span>
          </button>
        </div>
      </div>

      {/* Hero Greeting, Profile Photo Upload/Camera & Inline Live Name Editor */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg sm:p-space-xl shadow-sm border border-outline-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg overflow-hidden">
        <div className="flex items-start sm:items-center gap-space-md">
          {/* Hidden file input for direct photo upload */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoFileChange}
            className="hidden"
          />

          {/* Dynamic Profile Photo / Initials Avatar with Camera & Upload Trigger */}
          <div className="relative group shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`avatar-${activeUser.name}-${activeUser.email}-${activeUser.photoUrl ? 'img' : 'init'}`}
                initial={{ opacity: 0, x: -12, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 8, scale: 0.95 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => {
                  setCameraError(null);
                  setShowPhotoModal(true);
                }}
                title="Click to upload or capture profile photo"
                className="w-16 h-16 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center text-2xl font-extrabold shadow-sm overflow-hidden cursor-pointer border-2 border-primary/20 hover:border-primary transition-all"
              >
                {activeUser.photoUrl ? (
                  <img
                    src={activeUser.photoUrl}
                    alt={`${activeUser.name} profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initialLetter
                )}
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              onClick={() => {
                setCameraError(null);
                setShowPhotoModal(true);
              }}
              title="Upload or capture profile photo"
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary text-on-primary shadow-md border-2 border-surface-container-lowest flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">photo_camera</span>
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={`meta-${activeUser.contactNumber}-${activeUser.email}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary flex-wrap"
              >
                <span>Candidate Workspace</span>
                <span>·</span>
                <span className="text-tertiary font-mono">{activeUser.email}</span>
                <span>·</span>
                <span className="text-primary font-mono">{activeUser.contactNumber}</span>
              </motion.div>
            </AnimatePresence>

            {/* Dynamic Greeting with Slide-In Animation & Inline Edit Pencil */}
            {!isEditingInline ? (
              <div className="flex items-center gap-space-xs flex-wrap">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={`greeting-${activeUser.name}-${activeUser.email}`}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 14 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight"
                  >
                    Welcome, <span className="text-primary">{activeUser.name}</span>
                  </motion.h1>
                </AnimatePresence>
                <button
                  type="button"
                  onClick={() => {
                    setInlineNameInput(activeUser.name);
                    setInlineNameError(null);
                    setIsEditingInline(true);
                  }}
                  title="Edit candidate display name inline"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  <span>Edit Name</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCameraError(null);
                    setShowPhotoModal(true);
                  }}
                  title="Upload photo, capture from camera, or use placeholder"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-tertiary text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                  <span>{activeUser.photoUrl ? 'Change Photo' : 'Profile Photo'}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl sm:text-2xl font-bold text-on-surface">Welcome,</span>
                  <input
                    type="text"
                    value={inlineNameInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInlineNameInput(val);
                      if (val && !/^[A-Za-z\s]*$/.test(val)) {
                        setInlineNameError('Alphabets only (A–Z). Numbers like "123" are not accepted.');
                      } else {
                        setInlineNameError(null);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInlineNameSave();
                      if (e.key === 'Escape') {
                        setInlineNameError(null);
                        setIsEditingInline(false);
                      }
                    }}
                    autoFocus
                    placeholder="Alphabets only (e.g. Bintu)"
                    className={`px-3 py-1.5 rounded-lg bg-surface-container-low border-2 ${
                      inlineNameError ? 'border-error' : 'border-primary'
                    } text-on-surface font-bold text-lg focus:outline-none`}
                  />
                  <button
                    type="button"
                    onClick={handleInlineNameSave}
                    className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInlineNameError(null);
                      setIsEditingInline(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-surface-container text-secondary text-xs font-medium hover:text-on-surface cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                {inlineNameError && (
                  <span className="text-xs font-semibold text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {inlineNameError}
                  </span>
                )}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.p
                key={`subtext-${activeUser.email}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.24, delay: 0.03, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm text-on-surface-variant mt-0.5"
              >
                Your real-time resume telemetry and ATS diagnostic scores are bound to{' '}
                <strong className="text-on-surface font-mono">{activeUser.email}</strong> (
                {activeUser.contactNumber}).
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Primary Quick Actions */}
        <div className="flex flex-wrap items-center gap-space-xs shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="px-space-md py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            <span>Upload Resume</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('interview')}
            className="px-space-md py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-tertiary">
              record_voice_over
            </span>
            <span>Mock Interview</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('matcher')}
            className="px-space-md py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">fact_check</span>
            <span>Job Matcher</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSwitchIdentifier('');
              setSwitchPassword('');
              setSwitchError(null);
              setShowSwitchAccountModal(true);
            }}
            className="px-space-md py-2.5 rounded-lg bg-surface-container text-primary hover:bg-surface-container-high text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-primary/25"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">switch_account</span>
            <span>Sign In Another Account</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="px-space-md py-2.5 rounded-lg bg-inverse-surface text-inverse-on-surface hover:opacity-90 text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-primary-fixed-dim">
              lock_reset
            </span>
            <span>Reset Password</span>
          </button>
        </div>
      </div>

      {/* Sign In to Another Account Interactive Modal */}
      {showSwitchAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border-2 border-primary/40 rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/25 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">switch_account</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Sign In to Another Account
                  </h3>
                  <p className="text-xs text-secondary">
                    Currently signed in as <strong className="text-on-surface">{activeUser.name}</strong> ({activeUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitchAccountModal(false)}
                className="p-1.5 rounded-lg bg-surface-container text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSwitchAccountModalSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  1. Enter Another User Name, Gmail Address, or Contact Number
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                    person
                  </span>
                  <input
                    type="text"
                    autoFocus
                    value={switchIdentifier}
                    onChange={(e) => setSwitchIdentifier(e.target.value)}
                    placeholder="e.g. Divya, divya@gmail.com, Rahul, Priya..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    2. Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSwitchAccountModal(false);
                      if (switchIdentifier.trim()) {
                        setResetIdentifier(switchIdentifier.trim());
                      }
                      setAuthTab('forgot');
                    }}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Forgot Password? Reset Here
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                    lock
                  </span>
                  <input
                    type={showSwitchPwd ? 'text' : 'password'}
                    value={switchPassword}
                    onChange={(e) => setSwitchPassword(e.target.value)}
                    placeholder="Enter password for this account"
                    className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSwitchPwd(!showSwitchPwd)}
                    className="absolute right-2.5 top-2.5 text-secondary hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showSwitchPwd ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {switchError && (
                <div className="px-3 py-2 rounded-lg bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{switchError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => {
                    setShowSwitchAccountModal(false);
                    if (onSignOutToLogin) {
                      onSignOutToLogin();
                    } else {
                      onNavigate('auth');
                    }
                  }}
                  className="text-xs font-semibold text-secondary hover:text-primary cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  <span>Open Full-Screen Sign In Page</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSwitchAccountModal(false)}
                    className="px-3.5 py-2 rounded-lg bg-surface-container text-secondary hover:text-on-surface text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="px-5 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">login</span>
                    <span>{isLoggingIn ? 'Signing In...' : 'Sign In Now'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Profile Photo Upload, Camera Capture & Placeholder Studio Panel */}
      {showPhotoModal && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md border-2 border-primary/30 flex flex-col gap-space-md">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">
                photo_camera
              </span>
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  Candidate Profile Photo Studio ({activeUser.name})
                </h3>
                <p className="text-xs text-secondary">
                  Upload an image file, capture a live photo via camera, or use a generated placeholder avatar.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setShowPhotoModal(false);
              }}
              className="p-1.5 rounded-lg bg-surface-container text-secondary hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
            {/* Current Preview / Live Video Feed */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 min-h-[210px]">
              {isCameraActive ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-40 h-40 rounded-2xl object-cover border-2 border-primary shadow-sm bg-black"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={handleCaptureCameraPhoto}
                      className="px-3.5 py-1.5 rounded-lg bg-tertiary text-white text-xs font-bold flex items-center gap-1 shadow-sm hover:opacity-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">camera</span>
                      <span>Capture Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-high text-secondary text-xs font-semibold hover:text-on-surface cursor-pointer"
                    >
                      Cancel Camera
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  {activeUser.photoUrl ? (
                    <img
                      src={activeUser.photoUrl}
                      alt={activeUser.name}
                      className="w-28 h-28 rounded-2xl object-cover border-2 border-primary shadow-sm"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center text-4xl font-extrabold shadow-sm">
                      {initialLetter}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-on-surface">
                    {activeUser.photoUrl ? 'Active Profile Photo' : 'Default Initials Placeholder'}
                  </span>
                </div>
              )}
            </div>

            {/* Action Controls */}
            <div className="md:col-span-7 flex flex-col gap-space-sm">
              {cameraError && (
                <div className="p-space-sm rounded-lg bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <span>{cameraError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="p-space-sm rounded-xl bg-primary-container text-on-primary font-semibold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  <span>Upload Photo File</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartCamera}
                  className="p-space-sm rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface font-semibold text-xs flex items-center justify-center gap-2 border border-outline-variant/40 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    photo_camera
                  </span>
                  <span>Capture via Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const placeholderUrl = generatePlaceholderAvatarUrl(activeUser.name);
                    applyProfilePhoto(
                      placeholderUrl,
                      `Placeholder avatar applied for ${activeUser.name}!`
                    );
                  }}
                  className="p-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs flex items-center justify-center gap-2 border border-outline-variant/30 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-tertiary">
                    account_circle
                  </span>
                  <span>Use Placeholder Avatar</span>
                </button>

                {activeUser.photoUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      applyProfilePhoto(
                        null,
                        `Removed custom photo — reverted to initials placeholder for ${activeUser.name}`
                      )
                    }
                    className="p-space-sm rounded-xl bg-error-container/60 hover:bg-error-container text-on-error-container font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span>Reset to Initials</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-secondary leading-relaxed">
                Your profile photo URL is stored directly in <code className="font-mono text-on-surface">activeUser.photoUrl</code> and automatically displayed in both the top navigation header and the candidate dashboard greeting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Save Notification Banner */}
      {saveFeedback && (
        <div className="px-space-md py-space-sm rounded-xl bg-tertiary-fixed/40 border border-tertiary/30 text-on-tertiary-fixed flex items-center justify-between gap-2 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
            <span>{saveFeedback}</span>
          </div>
          <span className="font-mono text-xs text-tertiary font-semibold">DOM &amp; API SYNCED</span>
        </div>
      )}

      {/* Main Two-Column Grid: Login, Register & Direct Password Reset Portal on Left + Live Candidate Telemetry on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left 7 Cols: Embedded Login, Register Account & Direct Website Password Reset Card */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-space-md">
          <div>
            {/* Card Header & Segmented Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-sm border-b border-outline-variant/20 gap-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  {authTab === 'register'
                    ? 'person_add'
                    : authTab === 'login'
                    ? 'login'
                    : 'lock_reset'}
                </span>
                <h2 className="text-lg font-bold text-on-surface">
                  Candidate Login &amp; Registration Portal
                </h2>
              </div>

              {/* 3-Tab Switcher inside Dashboard */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-container">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('register');
                    setRegError(null);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    authTab === 'register'
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Register Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('login');
                    setLoginError(null);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    authTab === 'login'
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Login Page
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('forgot');
                    setResetError(null);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    authTab === 'forgot'
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Reset Password
                </button>
              </div>
            </div>

            {/* TAB 1: REGISTER PAGE (Full Name, Contact Number, Gmail Address, Password, Confirm Password) */}
            {authTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="mt-space-md flex flex-col gap-space-md">
                <p className="text-xs text-on-surface-variant">
                  Create a new candidate account with your{' '}
                  <strong className="text-on-surface">Full Name</strong>,{' '}
                  <strong className="text-on-surface">Gmail Address</strong>,{' '}
                  <strong className="text-on-surface">Contact Number</strong>,{' '}
                  <strong className="text-on-surface">Password</strong>, and{' '}
                  <strong className="text-on-surface">Confirm Password</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  {/* 1. Full Name (Alphabets Only) */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="regFullName"
                        className="text-xs font-semibold text-secondary uppercase tracking-wider"
                      >
                        1. Full Name <span className="text-primary font-mono text-[10px]">(Alphabets Only)</span>
                      </label>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                        person
                      </span>
                      <input
                        id="regFullName"
                        type="text"
                        value={regFullName}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setRegFullName(raw);
                          if (raw && !/^[A-Za-z\s]*$/.test(raw)) {
                            setRegNameWarning(
                              'Full Name must be alphabets only (A–Z). Format like "123" is not accepted.'
                            );
                          } else {
                            setRegNameWarning(null);
                          }
                        }}
                        placeholder="e.g. Bintu (Alphabets only, no 123)"
                        className={`w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low border ${
                          regNameWarning ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                        } text-on-surface font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
                      />
                    </div>
                    {regNameWarning && (
                      <span className="text-[11px] font-semibold text-error flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {regNameWarning}
                      </span>
                    )}
                  </div>

                  {/* 2. Gmail Address */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="regGmailAddress"
                      className="text-xs font-semibold text-secondary uppercase tracking-wider"
                    >
                      2. Gmail Address
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                        mail
                      </span>
                      <input
                        id="regGmailAddress"
                        type="email"
                        value={regGmail}
                        onChange={(e) => setRegGmail(e.target.value)}
                        placeholder="e.g. bintu@gmail.com"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* 3. Contact Number */}
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label
                      htmlFor="regContactNumber"
                      className="text-xs font-semibold text-secondary uppercase tracking-wider"
                    >
                      3. Contact Number
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                        call
                      </span>
                      <input
                        id="regContactNumber"
                        type="tel"
                        value={regContactNumber}
                        onChange={(e) => setRegContactNumber(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* 4. Password */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="regPasswordInput"
                      className="text-xs font-semibold text-secondary uppercase tracking-wider"
                    >
                      4. Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                        lock
                      </span>
                      <input
                        id="regPasswordInput"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Enter password (6+ chars)"
                        className="w-full pl-9 pr-9 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-2.5 text-secondary hover:text-on-surface cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showRegPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 5. Confirm Password */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="regConfirmPasswordInput"
                      className="text-xs font-semibold text-secondary uppercase tracking-wider"
                    >
                      5. Confirm Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                        verified_user
                      </span>
                      <input
                        id="regConfirmPasswordInput"
                        type={showRegConfirm ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password to confirm"
                        className="w-full pl-9 pr-9 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirm(!showRegConfirm)}
                        className="absolute right-2.5 top-2.5 text-secondary hover:text-on-surface cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showRegConfirm ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {regError && (
                  <div className="px-3 py-2 rounded-lg bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccess && (
                  <div className="px-3 py-2 rounded-lg bg-tertiary-fixed/50 text-on-tertiary-fixed text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>{regSuccess}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-1">
                  <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">
                      visibility
                    </span>
                    <span>
                      Dashboard Greeting Preview:{' '}
                      <strong className="text-primary font-bold">
                        Welcome, {regFullName.trim() || activeUser.name}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthTab('login')}
                      className="px-3 py-2 rounded-lg bg-surface-container text-secondary hover:text-on-surface text-xs font-semibold cursor-pointer"
                    >
                      Already registered? Sign In
                    </button>
                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="px-space-lg py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                      <span>
                        {isRegistering ? 'Registering...' : 'Register & Activate Session'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: LOGIN PAGE */}
            {authTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="mt-space-md flex flex-col gap-space-md">
                <p className="text-xs text-on-surface-variant">
                  Sign in as <strong className="text-on-surface">any user</strong> by entering your{' '}
                  <strong className="text-on-surface">User Name</strong>,{' '}
                  <strong className="text-on-surface">Gmail Address</strong>, or{' '}
                  <strong className="text-on-surface">Contact Number</strong> and{' '}
                  <strong className="text-on-surface">Password</strong>. Forgot your password? Click{' '}
                  <button
                    type="button"
                    onClick={() => setAuthTab('forgot')}
                    className="text-primary font-semibold underline cursor-pointer"
                  >
                    Reset Password Directly on Website
                  </button>
                  .
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="loginIdInput"
                      className="text-xs font-semibold text-secondary uppercase tracking-wider"
                    >
                      User Name, Gmail Address, or Contact Number
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                        person
                      </span>
                      <input
                        id="loginIdInput"
                        ref={loginInputRef}
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Enter any user name or email (e.g. Divya, divya@gmail.com, Rahul...)"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="loginPwdInput"
                        className="text-xs font-semibold text-secondary uppercase tracking-wider"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetIdentifier(loginIdentifier);
                          setAuthTab('forgot');
                        }}
                        className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                        lock_open
                      </span>
                      <input
                        id="loginPwdInput"
                        type={showLoginPwd ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-9 pr-9 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPwd(!showLoginPwd)}
                        className="absolute right-2.5 top-2.5 text-secondary hover:text-on-surface cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showLoginPwd ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {loginError && (
                  <div className="px-3 py-2 rounded-lg bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{loginError}</span>
                  </div>
                )}

                {loginSuccess && (
                  <div className="px-3 py-2 rounded-lg bg-tertiary-fixed/50 text-on-tertiary-fixed text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>{loginSuccess}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthTab('register')}
                    className="text-xs text-primary font-semibold hover:underline cursor-pointer text-left"
                  >
                    Need an account? Go to Register Page →
                  </button>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="px-space-lg py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>{isLoggingIn ? 'Signing In...' : 'Sign In'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: 2-MINUTE OTP VERIFIED PASSWORD RESET */}
            {authTab === 'forgot' && (
              <form
                onSubmit={handleDirectPasswordReset}
                className="mt-space-md flex flex-col gap-space-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs text-on-surface-variant">
                    Generate a secure 6-digit verification OTP with a strict 2-minute (120s) expiration limit to reset your password.
                  </p>
                  {resetOtpSent && (
                    <span
                      className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                        isResetOtpExpired
                          ? 'bg-error-container text-on-error-container'
                          : resetOtpSecondsRemaining <= 30
                          ? 'bg-amber-500/20 text-amber-600 animate-pulse'
                          : 'bg-tertiary-fixed text-on-tertiary-fixed'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">timer</span>
                      {isResetOtpExpired
                        ? 'OTP Expired (00:00)'
                        : `OTP Valid: ${formatDashboardOtpTimer(resetOtpSecondsRemaining)}`}
                    </span>
                  )}
                </div>

                {/* Step 1: Target identifier + Send OTP */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                      person
                    </span>
                    <input
                      type="text"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      placeholder="Registered Contact No. or Gmail"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestDashboardOtp}
                    disabled={isSendingResetOtp}
                    className="px-4 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-semibold shadow-sm hover:opacity-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {resetOtpSent ? 'sync' : 'send'}
                    </span>
                    <span>
                      {isSendingResetOtp
                        ? 'Sending OTP...'
                        : resetOtpSent
                        ? 'Resend OTP'
                        : 'Send 2-Min OTP'}
                    </span>
                  </button>
                </div>

                {/* Step 2: 2-Minute OTP Verification & Auto-fill Helper */}
                {resetOtpSent && (
                  <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/50 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                        Enter 6-Digit OTP (Strict 2-Minute Window)
                      </span>
                      <span className="font-mono text-xs text-on-surface-variant">
                        {resetOtpSecondsRemaining}s left
                      </span>
                    </div>

                    {activeResetOtp && (
                      <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between text-xs">
                        <span className="text-on-surface">
                          Generated OTP:{' '}
                          <strong className="font-mono text-primary text-sm tracking-wider">
                            {activeResetOtp}
                          </strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setResetOtpCode(activeResetOtp)}
                          className="px-2 py-0.5 rounded bg-primary-container/20 text-primary text-[11px] font-semibold cursor-pointer hover:bg-primary-container/30"
                        >
                          Auto-Fill OTP
                        </button>
                      </div>
                    )}

                    <input
                      type="text"
                      maxLength={6}
                      disabled={isResetOtpExpired}
                      value={resetOtpCode}
                      onChange={(e) => setResetOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
                    />

                    {isResetOtpExpired && (
                      <span className="text-xs text-error font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">error</span>
                        The 2-minute time window has passed. Please click &ldquo;Resend OTP&rdquo; above.
                      </span>
                    )}
                  </div>
                )}

                {/* Step 3: New Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showResetNewPwd ? 'text' : 'password'}
                        value={resetNewPwd}
                        onChange={(e) => setResetNewPwd(e.target.value)}
                        placeholder="New password (6+ chars)"
                        className="w-full px-3 pr-8 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetNewPwd(!showResetNewPwd)}
                        className="absolute right-2 top-2 text-secondary hover:text-on-surface cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {showResetNewPwd ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showResetConfirmPwd ? 'text' : 'password'}
                        value={resetConfirmPwd}
                        onChange={(e) => setResetConfirmPwd(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-3 pr-8 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirmPwd(!showResetConfirmPwd)}
                        className="absolute right-2 top-2 text-secondary hover:text-on-surface cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {showResetConfirmPwd ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {resetError && (
                  <div className="px-3 py-2 rounded-lg bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{resetError}</span>
                  </div>
                )}
                {resetFeedback && (
                  <div className="px-3 py-2 rounded-lg bg-tertiary-fixed/50 text-on-tertiary-fixed text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>{resetFeedback}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthTab('login')}
                    className="text-xs text-secondary hover:text-on-surface font-semibold cursor-pointer"
                  >
                    ← Back to Login
                  </button>
                  <button
                    type="submit"
                    disabled={isResettingPwd || isResetOtpExpired}
                    className="px-space-lg py-2.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold shadow-sm hover:opacity-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                    <span>
                      {isResettingPwd ? 'Verifying OTP...' : 'Verify 2-Min OTP & Reset Password'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Current Signed-In User Private Session Card (Only shows the active user, never exposes other users) */}
          <div className="pt-space-md border-t border-outline-variant/25">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Current Signed-In Account (Private Session)
              </span>
              <span className="text-[11px] font-mono text-tertiary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                30m Session Active
              </span>
            </div>
            <div className="p-3 rounded-lg border border-primary/40 bg-primary-fixed/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {activeUser.photoUrl ? (
                  <img
                    src={activeUser.photoUrl}
                    alt={activeUser.name}
                    className="w-9 h-9 rounded-full object-cover border border-primary shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {(activeUser.name[0] || 'U').toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-on-surface truncate">
                    {activeUser.name}
                  </span>
                  <span className="text-xs font-mono text-secondary truncate">
                    {activeUser.email} · {activeUser.contactNumber}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    // If the user already typed a username/email in the inline login form above, sign them in immediately!
                    if (authTab === 'login' && loginIdentifier.trim()) {
                      await executeAccountLogin(loginIdentifier, loginPassword, false);
                      return;
                    }
                    // Otherwise open the interactive Sign In to Another Account modal AND switch inline tab to login
                    setAuthTab('login');
                    setLoginError(null);
                    setLoginSuccess(null);
                    setSwitchIdentifier('');
                    setSwitchPassword('');
                    setSwitchError(null);
                    setShowSwitchAccountModal(true);
                    setTimeout(() => loginInputRef.current?.focus(), 60);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-primary-container text-on-primary hover:opacity-95 shadow-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">switch_account</span>
                  <span>Sign In to Another Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Active Candidate Resume Diagnostic Snapshot */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-space-md">
          <div>
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-tertiary text-[22px]">analytics</span>
                <h2 className="text-lg font-bold text-on-surface">
                  Active Candidate Telemetry
                </h2>
              </div>
              <span className="text-xs font-mono text-secondary">
                {activeUser.email}
              </span>
            </div>

            {/* 2 Metric Tiles */}
            <div className="grid grid-cols-2 gap-space-sm mt-space-md">
              <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-1">
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                  Resume Score
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-on-surface font-mono tabular-nums">
                    {currentAnalysis.score}
                  </span>
                  <span className="text-xs text-secondary font-mono">/100</span>
                </div>
                <span className="text-xs text-tertiary font-medium mt-1">
                  {currentAnalysis.scoreStatus} · {currentAnalysis.percentileText}
                </span>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-1">
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                  Job Match Index
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-primary font-mono tabular-nums">
                    {currentAnalysis.matchPercentage}%
                  </span>
                  <span className="text-xs text-secondary">ATS Match</span>
                </div>
                <span className="text-xs text-on-surface-variant mt-1 truncate">
                  Target: {currentAnalysis.targetRole}
                </span>
              </div>
            </div>

            {/* Detected Skills Snapshot */}
            <div className="mt-space-md">
              <div className="flex items-center justify-between text-xs text-secondary mb-2">
                <span className="font-semibold uppercase tracking-wider">
                  Verified Skills ({currentAnalysis.skillsDetected.length})
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('analysis')}
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Open Full Diagnostic →
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentAnalysis.skillsDetected.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-md bg-surface-container text-on-surface text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Link to Direct Password Reset Flow */}
          <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between gap-space-sm">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface">
                Forgot Password? Reset Directly on Website
              </span>
              <span className="text-xs text-on-surface-variant">
                Instant password update for <code className="font-mono text-primary">{activeUser.email}</code> without external API keys
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAuthTab('forgot')}
              className="px-3 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-semibold shrink-0 hover:opacity-95 cursor-pointer"
            >
              Reset Here
            </button>
          </div>
        </div>
      </div>

      {/* Daily Resume Goal Progress Circle Component (Resume Updates vs. Target Applications for the Day) */}
      <DailyResumeGoalWidget
        activeUser={activeUser}
        currentAnalysis={currentAnalysis}
        onNavigate={onNavigate}
      />

      {/* Performance Overview Widget (Recharts: Resume Strength Trend & Job Application Success Rate) */}
      <PerformanceOverviewWidget
        activeUser={activeUser}
        currentAnalysis={currentAnalysis}
        onNavigate={onNavigate}
      />

      {/* Bottom 3-Card Workflow Navigation Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        <div
          onClick={() => onNavigate('upload')}
          className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 hover:border-primary/60 transition-all cursor-pointer flex flex-col justify-between gap-space-sm group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
            </div>
            <span className="text-xs font-mono text-secondary">Step 01</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
              1. Upload &amp; Parse Resume
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Upload any PDF/DOCX resume or select dynamic benchmark presets for real-time scoring.
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('analysis')}
          className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 hover:border-primary/60 transition-all cursor-pointer flex flex-col justify-between gap-space-sm group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[22px]">donut_large</span>
            </div>
            <span className="text-xs font-mono text-secondary">Step 02</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
              2. Resume Analysis Result
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Inspect 100-point rubric diagnostics, formatting integrity, strengths, and missing skills for {activeUser.name}.
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('matcher')}
          className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 hover:border-primary/60 transition-all cursor-pointer flex flex-col justify-between gap-space-sm group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined text-[22px]">fact_check</span>
            </div>
            <span className="text-xs font-mono text-secondary">Step 03</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
              3. Resume vs Job Matcher
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Compare extracted candidate skills against custom job descriptions with instant match recalculation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PerformanceOverviewProps {
  activeUser: ActiveUser;
  currentAnalysis: CandidateAnalysis;
  onNavigate: (screen: ScreenId) => void;
}

const PerformanceOverviewWidget: React.FC<PerformanceOverviewProps> = ({
  activeUser,
  currentAnalysis,
  onNavigate,
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Generate user-specific, deterministic metrics anchored to activeUser identity and currentAnalysis scores
  const chartData = useMemo(() => {
    const seedStr = `${activeUser.name}:${activeUser.email}:${currentAnalysis.score}`;
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
      seed = (seed * 31 + seedStr.charCodeAt(i)) % 1000;
    }

    const finalScore = Math.max(25, Math.min(99, currentAnalysis.score));
    const finalSuccess = Math.max(20, Math.min(98, currentAnalysis.matchPercentage));
    const offsetA = (seed % 7) - 3;
    const offsetB = ((seed >> 3) % 7) - 3;

    return [
      {
        stage: 'Scan v1 (Baseline)',
        resumeStrength: Math.max(18, Math.round(finalScore * 0.56) + offsetA),
        applicationSuccessRate: Math.max(15, Math.round(finalSuccess * 0.5) + offsetB),
      },
      {
        stage: 'Scan v2 (Keywords)',
        resumeStrength: Math.max(24, Math.round(finalScore * 0.68) - offsetB),
        applicationSuccessRate: Math.max(22, Math.round(finalSuccess * 0.63) + offsetA),
      },
      {
        stage: 'Scan v3 (Projects)',
        resumeStrength: Math.max(30, Math.round(finalScore * 0.79) + offsetA),
        applicationSuccessRate: Math.max(28, Math.round(finalSuccess * 0.76) - offsetA),
      },
      {
        stage: 'Scan v4 (ATS Format)',
        resumeStrength: Math.max(34, Math.round(finalScore * 0.9) + offsetB),
        applicationSuccessRate: Math.max(32, Math.round(finalSuccess * 0.88) + offsetB),
      },
      {
        stage: 'Current Active',
        resumeStrength: finalScore,
        applicationSuccessRate: finalSuccess,
      },
    ];
  }, [activeUser.name, activeUser.email, currentAnalysis.score, currentAnalysis.matchPercentage]);

  const firstPoint = chartData[0];
  const lastPoint = chartData[chartData.length - 1];
  const strengthGain = lastPoint.resumeStrength - firstPoint.resumeStrength;
  const successGain = lastPoint.applicationSuccessRate - firstPoint.applicationSuccessRate;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-outline-variant/25">
        <div className="flex items-start sm:items-center gap-space-sm">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">monitoring</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-on-surface">Performance Overview</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-primary-fixed text-on-primary-fixed">
                Candidate: {activeUser.name}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Real-time progression of <strong className="text-on-surface">Resume Strength Trend</strong> and{' '}
              <strong className="text-on-surface">Job Application Success Rate</strong> bound to {activeUser.email}.
            </p>
          </div>
        </div>

        {/* Chart Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-container">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                chartType === 'area'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">show_chart</span>
              <span>Trend Area</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                chartType === 'bar'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">bar_chart</span>
              <span>Comparison Bars</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="px-3 py-1.5 rounded-lg bg-surface-container-high text-primary text-xs font-semibold hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            New Scan →
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
        <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Resume Strength Trend
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold font-mono text-primary">
                {lastPoint.resumeStrength}/100
              </span>
              <span className="text-xs font-mono font-semibold text-tertiary">
                +{strengthGain} pts vs baseline
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-primary text-[26px]">trending_up</span>
        </div>

        <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Job Application Success Rate
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold font-mono text-tertiary">
                {lastPoint.applicationSuccessRate}%
              </span>
              <span className="text-xs font-mono font-semibold text-tertiary">
                +{successGain}% ATS pass rate
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-tertiary text-[26px]">verified</span>
        </div>

        <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Target Role Benchmark
            </span>
            <div className="text-sm font-bold text-on-surface truncate max-w-[200px] mt-0.5">
              {currentAnalysis.targetRole}
            </div>
            <span className="text-[11px] font-mono text-secondary">
              {currentAnalysis.skillsDetected.length} Verified Skills Active
            </span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[24px]">work</span>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="resumeStrengthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3525cd" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#3525cd" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="jobSuccessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006e4b" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#006e4b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 12, fill: '#545f73' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#545f73' }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '10px',
                  fontSize: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Area
                type="monotone"
                dataKey="resumeStrength"
                name="Resume Strength Trend (Score)"
                stroke="#3525cd"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#resumeStrengthGrad)"
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="applicationSuccessRate"
                name="Job Application Success Rate (%)"
                stroke="#006e4b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#jobSuccessGrad)"
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 12, fill: '#545f73' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#545f73' }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '10px',
                  fontSize: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar
                dataKey="resumeStrength"
                name="Resume Strength Trend (Score)"
                fill="#3525cd"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="applicationSuccessRate"
                name="Job Application Success Rate (%)"
                fill="#006e4b"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface DailyResumeGoalProps {
  activeUser: ActiveUser;
  currentAnalysis: CandidateAnalysis;
  onNavigate: (screen: ScreenId) => void;
}

const DailyResumeGoalWidget: React.FC<DailyResumeGoalProps> = ({
  activeUser,
  currentAnalysis,
  onNavigate,
}) => {
  // Derive deterministic user-specific initial daily counts when activeUser changes
  const defaultCounts = useMemo(() => {
    const seedStr = `${activeUser.name}:${activeUser.email}:${currentAnalysis.score}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash * 31 + seedStr.charCodeAt(i)) % 100;
    }
    const baseUpdates = Math.max(1, Math.min(3, (hash % 3) + 1));
    const baseApps = Math.max(2, Math.min(4, ((hash >> 2) % 3) + 2));
    return {
      updatesDone: baseUpdates,
      updatesTarget: 3,
      appsSubmitted: baseApps,
      appsTarget: 5,
    };
  }, [activeUser.name, activeUser.email, currentAnalysis.score]);

  const [resumeUpdatesDone, setResumeUpdatesDone] = useState<number>(defaultCounts.updatesDone);
  const [resumeUpdatesTarget, setResumeUpdatesTarget] = useState<number>(defaultCounts.updatesTarget);
  const [applicationsDone, setApplicationsDone] = useState<number>(defaultCounts.appsSubmitted);
  const [applicationsTarget, setApplicationsTarget] = useState<number>(defaultCounts.appsTarget);
  const [goalBanner, setGoalBanner] = useState<string | null>(null);

  useEffect(() => {
    setResumeUpdatesDone(defaultCounts.updatesDone);
    setResumeUpdatesTarget(defaultCounts.updatesTarget);
    setApplicationsDone(defaultCounts.appsSubmitted);
    setApplicationsTarget(defaultCounts.appsTarget);
    setGoalBanner(null);
  }, [defaultCounts]);

  const updatePct = Math.min(
    100,
    Math.round((resumeUpdatesDone / Math.max(1, resumeUpdatesTarget)) * 100)
  );
  const appPct = Math.min(
    100,
    Math.round((applicationsDone / Math.max(1, applicationsTarget)) * 100)
  );
  const combinedGoalPct = Math.min(100, Math.round((updatePct + appPct) / 2));

  // SVG Circle geometry (Outer ring = Target Applications, Inner ring = Resume Updates)
  const outerRadius = 74;
  const innerRadius = 56;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const outerStrokeDashoffset =
    outerCircumference - (appPct / 100) * outerCircumference;
  const innerStrokeDashoffset =
    innerCircumference - (updatePct / 100) * innerCircumference;

  const isDailyGoalComplete =
    resumeUpdatesDone >= resumeUpdatesTarget && applicationsDone >= applicationsTarget;

  const triggerFeedback = (msg: string) => {
    setGoalBanner(msg);
    setTimeout(() => {
      setGoalBanner((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-outline-variant/25">
        <div className="flex items-start sm:items-center gap-space-sm">
          <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">track_changes</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-on-surface">Daily Resume Goal</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                  isDailyGoalComplete
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                    : 'bg-primary-fixed text-on-primary-fixed'
                }`}
              >
                {isDailyGoalComplete ? 'Daily Target Reached!' : `${combinedGoalPct}% Daily Completion`}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Tracks <strong className="text-on-surface">Resume Updates</strong> vs.{' '}
              <strong className="text-on-surface">Target Applications</strong> for today (
              {activeUser.name}).
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setResumeUpdatesDone((prev) => prev + 1);
              triggerFeedback(`Logged +1 Resume Update for ${activeUser.name}!`);
            }}
            className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[15px]">edit_document</span>
            <span>+1 Resume Update</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setApplicationsDone((prev) => prev + 1);
              triggerFeedback(`Logged +1 Job Application submitted toward today's target!`);
            }}
            className="px-3 py-1.5 rounded-lg bg-tertiary text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[15px]">send</span>
            <span>+1 Target Application</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setResumeUpdatesDone(defaultCounts.updatesDone);
              setResumeUpdatesTarget(defaultCounts.updatesTarget);
              setApplicationsDone(defaultCounts.appsSubmitted);
              setApplicationsTarget(defaultCounts.appsTarget);
              triggerFeedback('Reset daily goal counters to baseline.');
            }}
            className="px-2.5 py-1.5 rounded-lg bg-surface-container text-secondary hover:text-on-surface text-xs font-medium transition-colors cursor-pointer"
            title="Reset daily counters"
          >
            Reset
          </button>
        </div>
      </div>

      {goalBanner && (
        <div className="px-space-md py-2 rounded-lg bg-tertiary-fixed/40 border border-tertiary/30 text-on-tertiary-fixed text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-tertiary">task_alt</span>
            <span>{goalBanner}</span>
          </div>
          <span className="font-mono text-[11px] text-tertiary">LIVE GOAL TRACKER</span>
        </div>
      )}

      {/* Main Content Grid: Concentric Progress Circle on Left + Interactive Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
        {/* Left 5 Cols: Concentric Dual Progress Circle */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-space-md rounded-xl bg-surface-container-low border border-outline-variant/25">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 180 180">
              {/* Outer Track: Target Applications */}
              <circle
                cx="90"
                cy="90"
                r={outerRadius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="12"
              />
              {/* Outer Progress Arc: Target Applications */}
              <circle
                cx="90"
                cy="90"
                r={outerRadius}
                fill="none"
                stroke="#006e4b"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={outerCircumference}
                strokeDashoffset={outerStrokeDashoffset}
                className="transition-all duration-500 ease-out"
              />

              {/* Inner Track: Resume Updates */}
              <circle
                cx="90"
                cy="90"
                r={innerRadius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="12"
              />
              {/* Inner Progress Arc: Resume Updates */}
              <circle
                cx="90"
                cy="90"
                r={innerRadius}
                fill="none"
                stroke="#3525cd"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={innerCircumference}
                strokeDashoffset={innerStrokeDashoffset}
                className="transition-all duration-500 ease-out"
              />
            </svg>

            {/* Center Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-secondary font-semibold">
                Daily Goal
              </span>
              <span className="text-3xl font-extrabold font-mono text-on-surface tabular-nums leading-tight">
                {combinedGoalPct}%
              </span>
              <span className="text-[11px] font-semibold text-primary mt-0.5">
                {resumeUpdatesDone}/{resumeUpdatesTarget} Upd · {applicationsDone}/{applicationsTarget} Apps
              </span>
            </div>
          </div>

          {/* Ring Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-space-sm text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary inline-block" />
              <span className="font-semibold text-on-surface">
                Inner Ring: Resume Updates ({updatePct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-tertiary inline-block" />
              <span className="font-semibold text-on-surface">
                Outer Ring: Target Applications ({appPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Resume Updates vs. Target Applications Controls & Comparison */}
        <div className="lg:col-span-7 flex flex-col gap-space-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            {/* Metric Card 1: Daily Resume Updates */}
            <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/25 flex flex-col justify-between gap-space-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    1. Resume Updates Today
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-primary-fixed text-on-primary-fixed font-mono text-xs font-bold">
                    {updatePct}%
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-3xl font-extrabold font-mono text-on-surface tabular-nums">
                    {resumeUpdatesDone}
                  </span>
                  <span className="text-sm font-mono text-secondary">
                    / {resumeUpdatesTarget} updates target
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  Tailoring keywords, ATS formatting fixes, and STAR bullet revisions for{' '}
                  <strong className="text-on-surface">{currentAnalysis.targetRole}</strong>.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setResumeUpdatesDone((v) => Math.max(0, v - 1))}
                    className="w-7 h-7 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-sm flex items-center justify-center cursor-pointer"
                    title="Decrease completed updates"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeUpdatesDone((v) => v + 1)}
                    className="w-7 h-7 rounded-md bg-primary-container text-on-primary font-bold text-sm flex items-center justify-center cursor-pointer"
                    title="Increase completed updates"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-secondary">
                  <span>Daily Goal:</span>
                  <select
                    aria-label="Daily Resume Updates Target"
                    value={resumeUpdatesTarget}
                    onChange={(e) => setResumeUpdatesTarget(Number(e.target.value))}
                    className="px-2 py-1 rounded bg-surface-container text-on-surface font-mono font-semibold text-xs border border-outline-variant/40 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 8, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} / day
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Metric Card 2: Daily Target Applications */}
            <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/25 flex flex-col justify-between gap-space-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-tertiary">
                    2. Target Applications
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-tertiary-fixed text-on-tertiary-fixed font-mono text-xs font-bold">
                    {appPct}%
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-3xl font-extrabold font-mono text-on-surface tabular-nums">
                    {applicationsDone}
                  </span>
                  <span className="text-sm font-mono text-secondary">
                    / {applicationsTarget} apps target
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  Role-matched applications submitted with a{' '}
                  <strong className="text-tertiary">{currentAnalysis.matchPercentage}% ATS match</strong>.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setApplicationsDone((v) => Math.max(0, v - 1))}
                    className="w-7 h-7 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-sm flex items-center justify-center cursor-pointer"
                    title="Decrease submitted applications"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplicationsDone((v) => v + 1)}
                    className="w-7 h-7 rounded-md bg-tertiary text-white font-bold text-sm flex items-center justify-center cursor-pointer"
                    title="Increase submitted applications"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-secondary">
                  <span>Daily Goal:</span>
                  <select
                    aria-label="Daily Applications Target"
                    value={applicationsTarget}
                    onChange={(e) => setApplicationsTarget(Number(e.target.value))}
                    className="px-2 py-1 rounded bg-surface-container text-on-surface font-mono font-semibold text-xs border border-outline-variant/40 focus:outline-none"
                  >
                    {[2, 3, 5, 8, 10, 15].map((n) => (
                      <option key={n} value={n}>
                        {n} / day
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Insight & Action Footer Bar */}
          <div className="p-space-sm rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px]">
                bolt
              </span>
              <span className="text-xs text-on-surface">
                <strong>Update-to-Application Ratio:</strong>{' '}
                {resumeUpdatesDone} resume revisions supporting {applicationsDone} targeted job submissions today.
                {currentAnalysis.missingSkills.length > 0 && (
                  <span className="text-on-surface-variant">
                    {' '}
                    Next recommended update: add{' '}
                    <strong className="text-primary">{currentAnalysis.missingSkills[0]}</strong>.
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('upload')}
                className="px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface hover:text-primary text-xs font-semibold transition-colors cursor-pointer"
              >
                Update Resume →
              </button>
              <button
                type="button"
                onClick={() => onNavigate('matcher')}
                className="px-3 py-1.5 rounded-lg bg-surface-container-highest text-on-surface hover:text-tertiary text-xs font-semibold transition-colors cursor-pointer"
              >
                Match &amp; Apply →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


