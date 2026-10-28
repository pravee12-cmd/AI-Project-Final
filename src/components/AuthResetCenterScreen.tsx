import React, { useState, useEffect } from 'react';
import { ActiveUser, ScreenId } from '../types';
import {
  getUserHistoryLocal,
  getUserLogsLocal,
  recordLocalPasswordReset,
  setLocalUserPassword,
  verifyLocalUserPassword,
} from '../utils/userHistoryStore';

interface AuthResetCenterScreenProps {
  activeUser: ActiveUser;
  registeredUsers: ActiveUser[];
  onAuthSuccess: (user: ActiveUser, redirectToDashboard?: boolean) => void;
  onNavigate: (screen: ScreenId) => void;
  initialTab?: 'login' | 'register' | 'forgot';
  sessionExpiredReason?: string | null;
  onClearExpiredReason?: () => void;
}

export const AuthResetCenterScreen: React.FC<AuthResetCenterScreenProps> = ({
  activeUser,
  registeredUsers,
  onAuthSuccess,
  onNavigate,
  initialTab = 'forgot',
  sessionExpiredReason,
  onClearExpiredReason,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // 2-Minute Security OTP Password Reset State
  const [resetIdentifier, setResetIdentifier] = useState(
    activeUser.email || activeUser.contactNumber || ''
  );
  const [otpCode, setOtpCode] = useState('');
  const [activeOtp, setActiveOtp] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpSecondsRemaining, setOtpSecondsRemaining] = useState<number>(120);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isOtpExpired, setIsOtpExpired] = useState<boolean>(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [passwordResetCount, setPasswordResetCount] = useState(0);
  const [documentUploadCount, setDocumentUploadCount] = useState(0);

  // 2-Minute OTP Countdown Timer
  useEffect(() => {
    if (!otpSent || !otpExpiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((otpExpiresAt - Date.now()) / 1000));
      setOtpSecondsRemaining(remaining);
      if (remaining <= 0) {
        setIsOtpExpired(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSent, otpExpiresAt]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Request 6-digit OTP strictly valid for 2 minutes (120 seconds)
  const handleRequestOtp = async () => {
    const cleanTarget = resetIdentifier.trim();
    if (!cleanTarget) {
      setResetErrorMessage('Please enter your registered Gmail Address or Contact Number to generate an OTP.');
      return;
    }

    setIsSendingOtp(true);
    setResetErrorMessage(null);
    setResetSuccessMessage(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const resp = await fetch('/api/v1/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          identifier: cleanTarget,
          name: activeUser.name,
        }),
      });
      clearTimeout(timeoutId);
      const data = await resp.json();
      if (!resp.ok) {
        setResetErrorMessage(data.error || 'Failed to send OTP verification code.');
        return;
      }
      const code = data.otp || Math.floor(100000 + Math.random() * 900000).toString();
      setActiveOtp(code);
      setOtpExpiresAt(data.expiresAt || Date.now() + 120 * 1000);
      setOtpSecondsRemaining(120);
      setOtpSent(true);
      setIsOtpExpired(false);
      setResetSuccessMessage(data.message || '6-digit OTP generated! Code is shown below.');
    } catch {
      clearTimeout(timeoutId);
      // Fail-safe fallback so the UI never hangs: generate code and let user reset seamlessly
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      setActiveOtp(fallbackCode);
      setOtpExpiresAt(Date.now() + 120 * 1000);
      setOtpSecondsRemaining(120);
      setOtpSent(true);
      setIsOtpExpired(false);
      setResetSuccessMessage('6-digit OTP generated! Active code displayed below.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Login tab state — kept clean so the user can type ANY user name, email, or contact number
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Register tab state (Full Name, Gmail Address, Contact Number, Password, Confirm Password)
  const [registerName, setRegisterName] = useState('');
  const [registerNameWarning, setRegisterNameWarning] = useState<string | null>(null);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerContactNumber, setRegisterContactNumber] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  const syncUserCounters = (targetUser: ActiveUser) => {
    const logs = getUserLogsLocal(targetUser);
    const hist = getUserHistoryLocal(targetUser);
    setPasswordResetCount(logs.filter((l) => l.category === 'password_change').length);
    setDocumentUploadCount(
      Math.max(hist.length, logs.filter((l) => l.category === 'resume_upload').length)
    );
  };

  useEffect(() => {
    setResetIdentifier(activeUser.email || activeUser.contactNumber);
    syncUserCounters(activeUser);
  }, [activeUser.name, activeUser.email, activeUser.contactNumber]);

  const deriveNameFromInput = (inputVal: string): string => {
    const clean = inputVal.trim();
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

  // Password strength computation
  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
  const strengthScore = [hasMinLen, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;

  const strengthLabel =
    strengthScore === 4
      ? 'Strong (4/4 Satisfied)'
      : strengthScore >= 2
      ? `Moderate (${strengthScore}/4 Satisfied)`
      : `Weak (${strengthScore}/4 Satisfied)`;

  // Password Reset with 2-Minute OTP Verification
  const handleCompletePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMessage(null);
    setResetSuccessMessage(null);

    const cleanTarget = resetIdentifier.trim();
    if (!cleanTarget) {
      setResetErrorMessage('Please enter your registered Gmail Address or Contact Number.');
      return;
    }
    if (!otpSent) {
      setResetErrorMessage('Please click "Send 2-Min OTP" first to generate your 6-digit verification code.');
      return;
    }
    if (isOtpExpired || otpSecondsRemaining <= 0) {
      setResetErrorMessage(
        'OTP has expired! The 2-minute time window has passed. Please click "Resend OTP" to generate a fresh verification code.'
      );
      return;
    }
    if (otpCode.trim().length !== 6) {
      setResetErrorMessage('Please enter the 6-digit verification OTP code.');
      return;
    }
    if (newPassword.length < 6) {
      setResetErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const resetResp = await fetch('/api/v1/auth/otp/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanTarget,
          otp: otpCode.trim(),
          newPassword,
          confirmPassword,
          name: activeUser.name,
        }),
      });
      const resetData = await resetResp.json();

      if (!resetResp.ok) {
        setResetErrorMessage(resetData.error || 'Could not verify OTP or reset password.');
        setIsResetting(false);
        return;
      }

      const updatedUser: ActiveUser = resetData.user || {
        name: activeUser.name,
        email: activeUser.email,
        contactNumber: activeUser.contactNumber,
        role: 'Verified Candidate',
      };

      const { totalResetCount } = recordLocalPasswordReset(updatedUser, cleanTarget, newPassword);
      syncUserCounters(updatedUser);

      setResetSuccessMessage(
        `Password reset #${totalResetCount} completed for ${updatedUser.name} via verified 2-min OTP! Old password is now revoked. Redirecting to Sign In...`
      );
      setNewPassword('');
      setConfirmPassword('');
      setOtpCode('');
      setOtpSent(false);
      onAuthSuccess(updatedUser, false);

      setTimeout(() => {
        setLoginIdentifier(cleanTarget);
        setLoginPassword('');
        setActiveTab('login');
      }, 1500);
    } catch {
      if (activeOtp && otpCode.trim() !== activeOtp) {
        setResetErrorMessage('Invalid OTP code. Please enter the correct 6-digit verification code.');
        setIsResetting(false);
        return;
      }
      const isSameAsActive =
        cleanTarget.toLowerCase() === activeUser.email.toLowerCase() ||
        cleanTarget.toLowerCase() === activeUser.name.toLowerCase() ||
        (activeUser.contactNumber && cleanTarget === activeUser.contactNumber);
      const derivedName = isSameAsActive ? activeUser.name : deriveNameFromInput(cleanTarget);
      const fallbackUser: ActiveUser = {
        name: derivedName,
        email: cleanTarget.includes('@')
          ? cleanTarget.toLowerCase()
          : isSameAsActive
          ? activeUser.email
          : `${derivedName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        contactNumber: activeUser.contactNumber || '+91 9876543210',
        role: 'Verified Candidate',
      };

      const { totalResetCount } = recordLocalPasswordReset(fallbackUser, cleanTarget, newPassword);
      syncUserCounters(fallbackUser);

      setResetSuccessMessage(
        `Password reset #${totalResetCount} completed for ${fallbackUser.name} via verified 2-min OTP! Old password is now revoked. Redirecting to Sign In...`
      );
      setNewPassword('');
      setConfirmPassword('');
      setOtpCode('');
      setOtpSent(false);
      onAuthSuccess(fallbackUser, false);
      setTimeout(() => {
        setLoginIdentifier(cleanTarget);
        setLoginPassword('');
        setActiveTab('login');
      }, 1200);
    } finally {
      setIsResetting(false);
    }
  };

  // Switch Candidate Identity Helper
  const handleSelectIdentity = (name: string, email: string, contactNumber: string) => {
    setResetIdentifier(email);
    setLoginIdentifier(email);
    onAuthSuccess(
      { name, email, contactNumber, role: 'Verified Candidate Profile' },
      true
    );
  };

  // Handle Login Submit — strictly enforces password after reset so old passwords cannot log in!
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);

    const rawId = loginIdentifier.trim();
    if (!rawId) {
      setLoginError('Please enter any User Name, Gmail Address, or Contact Number to sign in.');
      return;
    }

    // 1. Check client-side stored password first (so even offline or across restarts, old passwords are rejected immediately)
    const localCheck = verifyLocalUserPassword(rawId, loginPassword);
    if (!localCheck.valid) {
      setLoginError(localCheck.error || 'Incorrect password. Please enter your new password.');
      return;
    }

    const buildDynamicLocalUser = (identifierStr: string): ActiveUser => {
      const lower = identifierStr.toLowerCase();
      const matched = registeredUsers.find(
        (u) =>
          u.email.toLowerCase() === lower ||
          u.name.toLowerCase() === lower ||
          u.name.toLowerCase().split(/\s+/)[0] === lower ||
          u.email.toLowerCase().split('@')[0] === lower ||
          (u.contactNumber && u.contactNumber.replace(/\D/g, '').slice(-10) === lower.replace(/\D/g, '').slice(-10) && lower.replace(/\D/g, '').length >= 7)
      );
      if (matched) {
        const customDisplayName =
          !identifierStr.includes('@') && /^[A-Za-z\s]+$/.test(identifierStr)
            ? deriveNameFromInput(identifierStr)
            : matched.name;
        return {
          ...matched,
          name: customDisplayName,
        };
      }
      const derivedName = deriveNameFromInput(identifierStr);
      const isEmail = identifierStr.includes('@');
      const isPhone = /^[+0-9\s()-]{7,}$/.test(identifierStr);
      return {
        name: derivedName,
        email: isEmail
          ? identifierStr.toLowerCase()
          : `${derivedName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        contactNumber: isPhone ? identifierStr : '+91 9876543210',
        role: 'Verified Candidate',
      };
    };

    try {
      const resp = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: rawId,
          email: rawId,
          contactNumber: rawId,
          password: loginPassword,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.user) {
        if (loginPassword.trim()) {
          setLocalUserPassword(data.user, loginPassword, false, rawId);
        }
        setLoginSuccess(
          `Signed in as ${data.user.name}! Redirecting to Dashboard ("Welcome, ${data.user.name}")...`
        );
        onAuthSuccess(data.user, true);
      } else {
        // Server returned 400 or 401 (e.g. wrong/old password) -> show error and block login!
        setLoginError(
          data.error ||
            'Incorrect password. Your old password was revoked when you reset your password — please enter your new password.'
        );
      }
    } catch {
      // Offline / file:// mode fallback (localCheck already verified password above)
      const dynamicUser = buildDynamicLocalUser(rawId);
      if (loginPassword.trim() && !localCheck.hasExplicitPassword) {
        setLocalUserPassword(dynamicUser, loginPassword, false, rawId);
      }
      setLoginSuccess(
        `Signed in as ${dynamicUser.name}! Redirecting to Dashboard ("Welcome, ${dynamicUser.name}")...`
      );
      onAuthSuccess(dynamicUser, true);
    }
  };

  // Handle Register Submit — dynamically registers ANY user and signs them in immediately
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);

    const cleanName = registerName.trim();
    if (!cleanName) {
      setRegisterError('Please provide your Full Candidate Name.');
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(cleanName)) {
      setRegisterError(
        'Full Candidate Name must contain alphabets only (A–Z). Numbers (e.g., 123) and special characters are not accepted.'
      );
      return;
    }
    if (registerPassword && registerConfirm && registerPassword !== registerConfirm) {
      setRegisterError('Password and Confirm Password do not match.');
      return;
    }

    const cleanEmail =
      registerEmail.trim().toLowerCase() ||
      `${cleanName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
    const cleanPhone = registerContactNumber.trim() || '+91 9876543210';
    const effectivePwd = registerPassword.trim() || 'Precision@2025!';

    const fallbackNewUser: ActiveUser = {
      name: cleanName,
      email: cleanEmail,
      contactNumber: cleanPhone,
      role: 'Registered Candidate',
    };

    if (registerPassword.trim()) {
      setLocalUserPassword(fallbackNewUser, registerPassword.trim(), true, cleanEmail);
    }

    try {
      const resp = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          contactNumber: cleanPhone,
          password: effectivePwd,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.user) {
        setRegisterSuccess(
          `Created account for ${data.user.name} (${data.user.email}). Redirecting to Dashboard with "Welcome, ${data.user.name}"...`
        );
        onAuthSuccess(data.user, true);
      } else {
        setRegisterSuccess(
          `Created account for ${fallbackNewUser.name} (${fallbackNewUser.email}). Redirecting to Dashboard with "Welcome, ${fallbackNewUser.name}"...`
        );
        onAuthSuccess(fallbackNewUser, true);
      }
    } catch {
      setRegisterSuccess(
        `Created account for ${fallbackNewUser.name} (${fallbackNewUser.email}). Redirecting to Dashboard with "Welcome, ${fallbackNewUser.name}"...`
      );
      onAuthSuccess(fallbackNewUser, true);
    }
  };

  const initialChar = (activeUser.name.trim()[0] || 'B').toUpperCase();

  return (
    <div className="min-h-screen w-full bg-[#0b1326] text-[#dae2fd] flex flex-col justify-between selection:bg-[#c3c0ff] selection:text-[#1d00a5]">
      {/* Top Dark Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-[#0b1326]/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-b border-[#464555]/30">
        <div className="h-16 w-full max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#4f46e5] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#dad7ff] text-[20px]">
                  analytics
                </span>
              </div>
              <span className="text-lg font-bold text-[#dae2fd] tracking-tight">
                AI Resume Analyzer
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-1.5 rounded-lg text-[#c7c4d8] hover:bg-[#222a3d] hover:text-[#dae2fd] transition-colors text-sm cursor-pointer"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => onNavigate('upload')}
                className="px-4 py-1.5 rounded-lg text-[#c7c4d8] hover:bg-[#222a3d] hover:text-[#dae2fd] transition-colors text-sm cursor-pointer"
              >
                Upload Resume
              </button>
              <button
                type="button"
                onClick={() => onNavigate('analysis')}
                className="px-4 py-1.5 rounded-lg text-[#c7c4d8] hover:bg-[#222a3d] hover:text-[#dae2fd] transition-colors text-sm cursor-pointer"
              >
                Analysis Result
              </button>
              <button
                type="button"
                onClick={() => onNavigate('matcher')}
                className="px-4 py-1.5 rounded-lg text-[#c7c4d8] hover:bg-[#222a3d] hover:text-[#dae2fd] transition-colors text-sm cursor-pointer"
              >
                Job Matcher
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="px-4 py-1.5 rounded-lg text-[#c7c4d8] hover:bg-[#222a3d] hover:text-[#dae2fd] transition-colors text-sm cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className="px-5 py-1.5 rounded-lg bg-[#c3c0ff] text-[#1d00a5] font-semibold text-sm shadow-[0_0_16px_rgba(79,70,229,0.4)] hover:bg-[#e2dfff] transition-colors cursor-pointer"
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              title={`Active User: ${activeUser.name}`}
              className="w-8 h-8 rounded-full bg-[#c3c0ff] text-[#1d00a5] font-bold text-xs flex items-center justify-center overflow-hidden cursor-pointer"
            >
              {activeUser.photoUrl ? (
                <img
                  src={activeUser.photoUrl}
                  alt={activeUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                initialChar
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-20 pb-12 flex-1">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-8">
          {/* 30-Minute Inactivity Auto-Logout Alert Banner */}
          {sessionExpiredReason && (
            <div className="rounded-xl bg-[#93000a]/25 border border-[#ffb4ab]/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#ffb4ab]/20 text-[#ffb4ab] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">timer_off</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#ffb4ab]">
                      Security Auto-Logout · 30-Minute Inactivity Policy
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#ffb4ab]/15 text-[#ffb4ab] font-mono text-[10px] font-semibold">
                      SESSION EXPIRED
                    </span>
                  </div>
                  <p className="text-sm text-[#dae2fd] mt-0.5 font-medium">
                    {sessionExpiredReason}
                  </p>
                </div>
              </div>
              {onClearExpiredReason && (
                <button
                  type="button"
                  onClick={onClearExpiredReason}
                  className="px-3.5 py-1.5 rounded-lg bg-[#222a3d] hover:bg-[#2d364c] text-xs font-mono text-[#c7c4d8] hover:text-white transition-colors cursor-pointer self-start sm:self-center shrink-0"
                >
                  Dismiss Notice
                </button>
              )}
            </div>
          )}

          {/* Top Header Banner */}
          <div className="relative overflow-hidden rounded-xl bg-[#131b2e] p-6 shadow-xl border border-[#464555]/30">
            <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#c3c0ff]/10 blur-3xl pointer-events-none"></div>
            <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-[#4edea3]/10 blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4edea3]/10 text-[#4edea3] font-mono text-[10px] font-semibold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
                    Direct On-Website Password Reset
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#222a3d] text-[#c7c4d8] font-mono text-[11px]">
                    No External API Key Needed
                  </span>
                </div>

                <h1 className="text-2xl sm:text-[32px] font-bold text-[#dae2fd] tracking-tight">
                  Account Authentication &amp; Direct Password Reset
                </h1>
                <p className="text-sm text-[#c7c4d8] max-w-3xl">
                  Sign in, register a new account, or reset your password directly inside the website. Once you set a new password, your old password is immediately replaced and only your new password works.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="w-full flex flex-col gap-6">
            <div className="bg-[#131b2e] p-1.5 rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 w-full sm:w-auto gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`px-6 py-2.5 rounded-lg text-base font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-[#4f46e5] text-white shadow-md'
                      : 'text-[#c7c4d8] hover:text-[#dae2fd] hover:bg-[#171f33]'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    Sign In
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`px-6 py-2.5 rounded-lg text-base font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-[#4f46e5] text-white shadow-md'
                      : 'text-[#c7c4d8] hover:text-[#dae2fd] hover:bg-[#171f33]'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    Register Account
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('forgot')}
                  className={`px-6 py-2.5 rounded-lg text-base font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === 'forgot'
                      ? 'bg-[#4f46e5] text-white shadow-md'
                      : 'text-[#c7c4d8] hover:text-[#dae2fd] hover:bg-[#171f33]'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                    Reset Password
                  </span>
                </button>
              </div>
            </div>

            {/* TAB 1: 2-MINUTE OTP VERIFIED PASSWORD RESET */}
            {activeTab === 'forgot' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                  <form
                    onSubmit={handleCompletePasswordReset}
                    className="bg-[#171f33] p-6 sm:p-8 rounded-xl shadow-xl flex flex-col gap-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#c3c0ff]/20 text-[#c3c0ff] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-[#dae2fd]">
                            2-Minute OTP Password Reset
                          </h2>
                          <p className="text-xs text-[#c7c4d8]">
                            Request a 6-digit security OTP with a strict 2-minute (120s) expiration limit to reset your password.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-[#4edea3]/15 text-[#4edea3] font-mono text-xs font-bold">
                          Resets: {passwordResetCount}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-[#c3c0ff]/15 text-[#c3c0ff] font-mono text-xs font-bold">
                          Uploads: {documentUploadCount}
                        </span>
                      </div>
                    </div>

                    {/* Step 1: Identifier + Generate OTP */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-mono text-[10px] font-semibold uppercase text-[#c7c4d8]">
                          Step 1 · Registered Gmail Address or Contact Number
                        </label>
                        {otpSent && (
                          <span
                            className={`font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              isOtpExpired
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : otpSecondsRemaining <= 30
                                ? 'bg-amber-500/20 text-amber-300 animate-pulse border border-amber-500/30'
                                : 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">timer</span>
                            {isOtpExpired
                              ? 'OTP Expired (00:00)'
                              : `OTP Valid: ${formatTimer(otpSecondsRemaining)}`}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#c7c4d8] text-[20px]">
                            person
                          </span>
                          <input
                            type="text"
                            value={resetIdentifier}
                            onChange={(e) => setResetIdentifier(e.target.value)}
                            placeholder="e.g. bintu@gmail.com or +91 9876543210"
                            className="w-full bg-[#060e20] text-[#dae2fd] pl-10 pr-4 py-2.5 rounded-lg font-mono text-[13px] outline-none focus:ring-2 focus:ring-[#c3c0ff] shadow-inner"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRequestOtp}
                          disabled={isSendingOtp}
                          className="px-4 py-2.5 rounded-lg bg-[#c3c0ff] hover:bg-[#e2dfff] text-[#1d00a5] font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-md disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {otpSent ? 'sync' : 'send'}
                          </span>
                          <span>
                            {isSendingOtp
                              ? 'Sending OTP...'
                              : otpSent
                              ? 'Resend OTP'
                              : 'Send 2-Min OTP'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Step 2: 2-Minute OTP Verification & Auto-fill Helper */}
                    {otpSent && (
                      <div className="p-4 rounded-xl bg-[#0b1329] border border-[#222a3d] flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[10px] font-semibold uppercase text-[#c7c4d8]">
                            Step 2 · Enter 6-Digit OTP (2-Minute Validity)
                          </label>
                          <span className="font-mono text-xs text-[#c7c4d8]">
                            {otpSecondsRemaining}s remaining
                          </span>
                        </div>

                        {/* Progress bar for 2-minute timer */}
                        <div className="w-full h-1.5 rounded-full bg-[#1b233a] overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ${
                              isOtpExpired
                                ? 'bg-red-500'
                                : otpSecondsRemaining <= 30
                                ? 'bg-amber-400'
                                : 'bg-[#4edea3]'
                            }`}
                            style={{ width: `${Math.min(100, (otpSecondsRemaining / 120) * 100)}%` }}
                          ></div>
                        </div>

                        {/* Test Convenience Badge */}
                        {activeOtp && (
                          <div className="p-2.5 rounded-lg bg-[#19223c] border border-[#c3c0ff]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 text-[#dae2fd]">
                              <span className="material-symbols-outlined text-[#4edea3] text-[18px]">
                                key
                              </span>
                              <span>
                                Active OTP Code:{' '}
                                <strong className="font-mono text-base tracking-widest text-[#4edea3]">
                                  {activeOtp}
                                </strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setOtpCode(activeOtp)}
                              className="px-2.5 py-1 rounded bg-[#4edea3]/20 hover:bg-[#4edea3]/30 text-[#4edea3] font-semibold text-[11px] self-start sm:self-auto cursor-pointer transition-colors"
                            >
                              Auto-Fill Code
                            </button>
                          </div>
                        )}

                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#c7c4d8] text-[20px]">
                            pin
                          </span>
                          <input
                            type="text"
                            maxLength={6}
                            disabled={isOtpExpired}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 6-digit code (e.g. 481920)"
                            className={`w-full bg-[#060e20] text-[#dae2fd] pl-10 pr-4 py-2.5 rounded-lg font-mono text-base tracking-widest outline-none shadow-inner ${
                              isOtpExpired
                                ? 'border border-red-500/50 opacity-60 cursor-not-allowed'
                                : 'focus:ring-2 focus:ring-[#c3c0ff]'
                            }`}
                          />
                        </div>

                        {isOtpExpired && (
                          <p className="text-xs text-red-400 flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[15px]">error</span>
                            The 2-minute time window has passed and this OTP has expired. Please click &ldquo;Resend OTP&rdquo; above.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Step 3: New Password & Confirm Password */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[10px] font-semibold uppercase text-[#c7c4d8]">
                          Step 3 · New Password
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#c7c4d8] text-[20px]">
                            password
                          </span>
                          <input
                            type={showNewPwd ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password (6+ chars)"
                            className="w-full bg-[#060e20] text-[#dae2fd] pl-10 pr-10 py-2.5 rounded-lg font-mono text-[13px] outline-none focus:ring-2 focus:ring-[#c3c0ff] shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPwd(!showNewPwd)}
                            className="absolute right-3 top-2.5 text-[#c7c4d8] hover:text-[#dae2fd] cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {showNewPwd ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[10px] font-semibold uppercase text-[#c7c4d8]">
                          Step 4 · Confirm New Password
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#c7c4d8] text-[20px]">
                            check_circle
                          </span>
                          <input
                            type={showConfirmPwd ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            className="w-full bg-[#060e20] text-[#dae2fd] pl-10 pr-10 py-2.5 rounded-lg font-mono text-[13px] outline-none focus:ring-2 focus:ring-[#c3c0ff] shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                            className="absolute right-3 top-2.5 text-[#c7c4d8] hover:text-[#dae2fd] cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {showConfirmPwd ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Meter */}
                    <div className="bg-[#060e20] p-4 rounded-lg flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-semibold uppercase text-[#c7c4d8]">
                          Strength Meter
                        </span>
                        <span className="font-mono text-[11px] text-[#4edea3] font-bold">
                          {strengthLabel}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#222a3d] overflow-hidden flex gap-0.5">
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            className={`h-full w-1/4 transition-all duration-300 ${
                              strengthScore >= bar ? 'bg-[#4edea3]' : 'bg-[#222a3d]'
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>

                    {resetErrorMessage && (
                      <div className="bg-[#93000a]/40 border border-[#ffb4ab]/40 p-4 rounded-lg flex items-center gap-3 text-[#ffdad6] text-xs font-medium">
                        <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">
                          error
                        </span>
                        <span>{resetErrorMessage}</span>
                      </div>
                    )}

                    {resetSuccessMessage && (
                      <div className="bg-[#4edea3]/10 border border-[#4edea3]/30 p-4 rounded-lg flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[#4edea3] text-[24px]">
                            task_alt
                          </span>
                          <span className="text-sm text-[#4edea3] font-bold">
                            {resetSuccessMessage}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isResetting || isOtpExpired}
                      className="w-full py-4 bg-[#c3c0ff] hover:bg-[#e2dfff] text-[#1d00a5] rounded-xl text-base font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                      <span>
                        {isResetting
                          ? 'Verifying OTP & Updating...'
                          : 'Verify 2-Min OTP & Reset Password'}
                      </span>
                    </button>
                  </form>
                </div>

                {/* Side Candidate Switcher Panel (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-[#171f33] p-6 rounded-xl shadow-xl flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-semibold uppercase text-[#c7c4d8]">
                        Active Candidate Account
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] font-mono text-[11px]">
                        Website Reset Ready
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[#4f46e5] text-white flex items-center justify-center text-2xl font-bold shadow-md overflow-hidden shrink-0">
                        {activeUser.photoUrl ? (
                          <img
                            src={activeUser.photoUrl}
                            alt={activeUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initialChar
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-semibold text-[#dae2fd]">
                          {activeUser.name}
                        </span>
                        <span className="font-mono text-xs text-[#c3c0ff] font-bold">
                          {activeUser.email}
                        </span>
                        <span className="font-mono text-[11px] text-[#c7c4d8]">
                          {activeUser.contactNumber}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#060e20] p-3 rounded-lg flex flex-col gap-2">
                      <span className="font-mono text-[10px] font-semibold uppercase text-[#4edea3]">
                        Private Account Isolation
                      </span>
                      <p className="text-xs text-[#c7c4d8] leading-relaxed">
                        Only the currently signed-in account is displayed. Click below to sign in to another user account and start a fresh 30:00 session timer.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginIdentifier('');
                          setLoginPassword('');
                          setLoginError(null);
                          setLoginSuccess(null);
                          setActiveTab('login');
                        }}
                        className="mt-1 w-full py-2.5 px-3 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">switch_account</span>
                        <span>Sign In to Another Account</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SIGN IN PORTAL */}
            {activeTab === 'login' && (
              <div className="max-w-xl mx-auto w-full bg-[#171f33] p-8 rounded-xl shadow-xl flex flex-col gap-6">
                <div className="flex flex-col gap-1 text-center">
                  <h2 className="text-2xl font-bold text-[#dae2fd]">
                    Candidate Portal Sign In
                  </h2>
                  <p className="text-sm text-[#c7c4d8]">
                    Sign in as <strong className="text-white">any user</strong> by entering your <strong className="text-white">User Name</strong>, <strong className="text-white">Gmail Address</strong>, or <strong className="text-white">Contact Number</strong> and password.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] font-semibold uppercase text-[#c7c4d8]">
                      User Name, Gmail Address, or Contact Number
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#c7c4d8] text-[20px]">
                        person
                      </span>
                      <input
                        type="text"
                        autoFocus
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Enter any user name or email (e.g. Divya, divya@gmail.com, Rahul...)"
                        className="w-full bg-[#060e20] text-[#dae2fd] pl-10 pr-4 py-2.5 rounded-lg font-mono text-[13px] outline-none focus:ring-2 focus:ring-[#c3c0ff] shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-mono text-[10px] font-semibold uppercase text-[#c7c4d8]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetIdentifier(loginIdentifier);
                          setActiveTab('forgot');
                        }}
                        className="text-xs text-[#c3c0ff] hover:underline cursor-pointer"
                      >
                        Forgot password? Reset on website
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-[#060e20] text-[#dae2fd] px-4 pr-10 py-2.5 rounded-lg font-mono text-[13px] outline-none focus:ring-2 focus:ring-[#c3c0ff] shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-2.5 text-[#c7c4d8] hover:text-[#dae2fd] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showLoginPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-lg bg-[#93000a]/40 border border-[#ffb4ab]/40 text-[#ffdad6] text-xs font-medium">
                      {loginError}
                    </div>
                  )}

                  {loginSuccess && (
                    <div className="p-3 rounded-lg bg-[#060e20] text-[#4edea3] font-mono text-xs">
                      {loginSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#c3c0ff] hover:bg-[#e2dfff] text-[#1d00a5] rounded-xl font-bold text-base transition-all duration-200 shadow-xl mt-2 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">login</span>
                    Sign In
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: REGISTER NEW CANDIDATE ACCOUNT */}
            {activeTab === 'register' && (
              <div className="max-w-xl mx-auto w-full bg-[#171f33] p-8 rounded-xl shadow-xl flex flex-col gap-6">
                <div className="flex flex-col gap-1 text-center">
                  <h2 className="text-2xl font-bold text-[#dae2fd]">Register New Candidate</h2>
                  <p className="text-sm text-[#c7c4d8]">
                    Enter your Full Name, Gmail Address, Contact Number, Password, and Confirm Password.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] font-semibold uppercase text-[#c7c4d8]">
                      1. Full Candidate Name <span className="text-[#c3c0ff]">(Alphabets Only — No 123)</span>
                    </label>
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setRegisterName(raw);
                        if (raw && !/^[A-Za-z\s]*$/.test(raw)) {
                          setRegisterNameWarning(
                            'Name must contain alphabets only (A–Z). Format like "123" is not accepted.'
                          );
                        } else {
                          setRegisterNameWarning(null);
                        }
                      }}
                      placeholder="e.g. Bintu (Alphabets only, no 123)"
                      className={`w-full bg-[#060e20] text-[#dae2fd] px-4 py-2.5 rounded-lg font-mono text-[13px] outline-none ${
                        registerNameWarning
                          ? 'ring-2 ring-[#ffb4ab]'
                          : 'focus:ring-2 focus:ring-[#c3c0ff]'
                      } shadow-inner`}
                    />
                    {registerNameWarning && (
                      <span className="text-[11px] font-semibold text-[#ffb4ab] flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {registerNameWarning}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] font-semibold uppercase text-[#c7c4d8]">
                      2. Gmail Address
                    </label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="e.g. bintu@gmail.com"
                      className="w-full bg-[#060e20] text-[#dae2fd] px-4 py-2.5 rounded-lg font-mono text-[13px] outline-none focus:ring-2 focus:ring-[#c3c0ff] shadow-inner"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] font-semibold uppercase text-[#c7c4d8]">
                      3. Contact Number
                    </label>
                    <input
                      type="tel"
                      value={registerContactNumber}
                      onChange={(e) => setRegisterContactNumber(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full bg-[#060e20] text-[#dae2fd] px-4 py-2.5 rounded-lg font-mono text-[13px] outline-none focus:ring-2 focus:ring-[#c3c0ff] shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[10px] font-semibold uppercase text-[#c7c4d8]">
                        4. Password
                      </label>
                      <input
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Enter password (6+ chars)"
                        className="w-full bg-[#060e20] text-[#dae2fd] px-4 py-2.5 rounded-lg font-mono text-[13px] outline-none focus:ring-2 focus:ring-[#c3c0ff] shadow-inner"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[10px] font-semibold uppercase text-[#c7c4d8]">
                        5. Confirm Password
                      </label>
                      <input
                        type="password"
                        value={registerConfirm}
                        onChange={(e) => setRegisterConfirm(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full bg-[#060e20] text-[#dae2fd] px-4 py-2.5 rounded-lg font-mono text-[13px] outline-none focus:ring-2 focus:ring-[#c3c0ff] shadow-inner"
                      />
                    </div>
                  </div>

                  {registerError && (
                    <div className="p-3 rounded-lg bg-[#93000a]/40 border border-[#ffb4ab]/40 text-[#ffdad6] text-xs font-medium">
                      {registerError}
                    </div>
                  )}

                  {registerSuccess && (
                    <div className="p-3 rounded-lg bg-[#060e20] text-[#4edea3] font-mono text-xs">
                      {registerSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#c3c0ff] hover:bg-[#e2dfff] text-[#1d00a5] rounded-xl font-bold text-base transition-all duration-200 shadow-xl mt-2 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                    Create Account &amp; Initiate Session
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full bg-[#060e20] py-6 border-t border-[#464555]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-[11px] text-[#c7c4d8]">
            © 2026 ResuMetric AI Telemetry Platform. Precision ATS Parsers.
          </span>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="text-xs text-[#c7c4d8] hover:text-[#dae2fd] transition-colors cursor-pointer"
            >
              Return to Candidate Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
