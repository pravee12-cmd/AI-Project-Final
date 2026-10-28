import React, { useState, useRef, useEffect } from 'react';
import { ActiveUser, CandidateAnalysis, ScreenId } from '../types';
import {
  buildClientResumeAnalysis,
  getUserHistoryLocal,
  getUserLogsLocal,
  recordLocalResumeUploadAndAnalysis,
} from '../utils/userHistoryStore';
import { validateResumeContent, ResumeValidationResult } from '../utils/resumeValidator';
import { HistoryItem } from './HistoryScreen';

interface UploadResumeScreenProps {
  activeUser: ActiveUser;
  onAnalysisComplete: (
    presetKey: 'stateA' | 'stateB' | 'stateC',
    customRole?: string,
    fileName?: string,
    dynamicAnalysis?: CandidateAnalysis
  ) => void;
  onNavigate: (screen: ScreenId) => void;
}

interface PresetConfig {
  key: 'poor' | 'average' | 'senior';
  stateKey: 'stateA' | 'stateB' | 'stateC';
  name: string;
  size: string;
  sizeBytes: number;
  skills: number;
  atsScore: number;
  role: string;
  scoreClass: string;
}

const PRESET_CONFIGS: Record<'poor' | 'average' | 'senior', PresetConfig> = {
  poor: {
    key: 'poor',
    stateKey: 'stateA',
    name: 'basic_fresher_entry_resume.pdf',
    size: '0.38 MB',
    sizeBytes: 398000,
    skills: 3,
    atsScore: 34,
    role: 'Junior Software Developer',
    scoreClass: 'bg-error-container text-on-error-container font-bold',
  },
  average: {
    key: 'average',
    stateKey: 'stateB',
    name: 'mid_level_frontend_resume.docx',
    size: '1.15 MB',
    sizeBytes: 1205000,
    skills: 6,
    atsScore: 66,
    role: 'Lead Frontend Architect (Next.js, TypeScript)',
    scoreClass: 'bg-secondary-container text-on-secondary-container font-bold',
  },
  senior: {
    key: 'senior',
    stateKey: 'stateC',
    name: 'senior_staff_fullstack_resume.pdf',
    size: '2.10 MB',
    sizeBytes: 2202000,
    skills: 10,
    atsScore: 93,
    role: 'Senior Full-Stack Engineer (React, Node, Cloud)',
    scoreClass: 'bg-tertiary-fixed text-on-tertiary-fixed font-bold',
  },
};

export const UploadResumeScreen: React.FC<UploadResumeScreenProps> = ({
  activeUser,
  onAnalysisComplete,
  onNavigate,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<'poor' | 'average' | 'senior' | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    sizeFormatted: string;
    sizeBytes: number;
    rawTextContent: string;
    isPreset: boolean;
  } | null>(null);
  const [customResumePaste, setCustomResumePaste] = useState('');
  const [targetRole, setTargetRole] = useState('Senior Full-Stack Engineer (React, Node, Cloud)');
  const [customJobInput, setCustomJobInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ResumeValidationResult | null>(null);

  // Per-user upload & password reset counters and uploaded files list
  const [userUploadedFiles, setUserUploadedFiles] = useState<HistoryItem[]>([]);
  const [userUploadCount, setUserUploadCount] = useState(0);
  const [userPasswordResetCount, setUserPasswordResetCount] = useState(0);

  const refreshUserCounters = () => {
    const localHistory = getUserHistoryLocal(activeUser);
    const localLogs = getUserLogsLocal(activeUser);
    const localUploads = Math.max(
      localHistory.length,
      localLogs.filter((l) => l.category === 'resume_upload').length
    );
    const localResets = localLogs.filter((l) => l.category === 'password_change').length;
    setUserUploadedFiles(localHistory);
    setUserUploadCount(localUploads);
    setUserPasswordResetCount(localResets);
  };

  useEffect(() => {
    refreshUserCounters();
  }, [activeUser.email, activeUser.name]);

  // Live API progress states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressTitle, setProgressTitle] = useState('Executing Live Parser API...');
  const [step1Status, setStep1Status] = useState<'pending' | 'active' | 'done'>('pending');
  const [step2Status, setStep2Status] = useState<'pending' | 'active' | 'done'>('pending');
  const [step3Status, setStep3Status] = useState<'pending' | 'active' | 'done'>('pending');
  const [showMetricsPreview, setShowMetricsPreview] = useState(false);
  const [detectedSkillsCount, setDetectedSkillsCount] = useState(0);
  const [estimatedAtsScore, setEstimatedAtsScore] = useState(0);
  const [scoreBadgeClass, setScoreBadgeClass] = useState(
    'bg-tertiary-fixed text-on-tertiary-fixed font-bold'
  );

  const applyPreset = (presetKey: 'poor' | 'average' | 'senior') => {
    setErrorBanner(null);
    setValidationResult(null);
    setSelectedPreset(presetKey);
    const data = PRESET_CONFIGS[presetKey];
    const dynamicFileName =
      presetKey === 'senior'
        ? `${activeUser.name.toLowerCase().replace(/\s+/g, '_')}_senior_fullstack_resume.pdf`
        : presetKey === 'poor'
        ? `${activeUser.name.toLowerCase().replace(/\s+/g, '_')}_basic_resume.pdf`
        : `${activeUser.name.toLowerCase().replace(/\s+/g, '_')}_midlevel_resume.docx`;

    setSelectedFile({
      name: dynamicFileName,
      sizeFormatted: `${data.size} · Sample`,
      sizeBytes: data.sizeBytes,
      rawTextContent: '',
      isPreset: true,
    });
    setTargetRole(data.role);
    setCustomJobInput(data.role);
  };

  // Extract printable ASCII/UTF-8 text strings from uploaded PDF/DOCX/TXT so real resume keywords are scored
  const extractPrintableText = async (file: File): Promise<string> => {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer.slice(0, 350000));
      let extracted = '';
      let chunk = '';
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
          chunk += String.fromCharCode(b);
        } else {
          if (chunk.length >= 3) {
            extracted += ' ' + chunk;
          }
          chunk = '';
        }
      }
      if (chunk.length >= 3) {
        extracted += ' ' + chunk;
      }
      return extracted.slice(0, 20000);
    } catch {
      return '';
    }
  };

  const handleFileSelection = async (file: File) => {
    setErrorBanner(null);
    setValidationResult(null);
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!validExtensions.includes(ext)) {
      setErrorBanner('Please upload a valid PDF, DOCX, or TXT resume file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorBanner('File size exceeds the 5MB maximum limit.');
      return;
    }

    const extractedText = await extractPrintableText(file);
    const validation = validateResumeContent(extractedText, file.name);
    setValidationResult(validation);

    if (!validation.isValid) {
      setSelectedFile(null);
      setSelectedPreset(null);
      setErrorBanner(
        `Upload Rejected: ${validation.rejectionReason}`
      );
      return;
    }

    setSelectedPreset(null);
    setSelectedFile({
      name: file.name,
      sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      sizeBytes: file.size,
      rawTextContent: extractedText,
      isPreset: false,
    });
  };

  const handleUploadAnalyze = async () => {
    setErrorBanner(null);
    let activeFile = selectedFile;
    let activePreset = selectedPreset;

    if (!activeFile && !customResumePaste.trim() && !activePreset) {
      setErrorBanner(
        'Please upload a valid Resume or CV file (PDF, DOCX, TXT) or select one of the verified sample resumes below.'
      );
      return;
    }

    if (customResumePaste.trim() && !activeFile && !activePreset) {
      const pasteValidation = validateResumeContent(customResumePaste, 'pasted_resume.txt');
      setValidationResult(pasteValidation);
      if (!pasteValidation.isValid) {
        setErrorBanner(`Pasted Content Rejected: ${pasteValidation.rejectionReason}`);
        return;
      }
    }

    setIsAnalyzing(true);
    setShowMetricsPreview(false);
    setProgressPercent(20);
    setProgressTitle('Stage 1: File & Schema Validation...');
    setStep1Status('active');
    setStep2Status('pending');
    setStep3Status('pending');

    setTimeout(() => {
      setProgressPercent(56);
      setProgressTitle('Stage 2: Text Buffer & Skill Keyword Extraction...');
      setStep1Status('done');
      setStep2Status('active');
    }, 300);

    setTimeout(async () => {
      setProgressPercent(88);
      setProgressTitle('Stage 3: Computing Dynamic Resume Score & Job Match...');
      setStep2Status('done');
      setStep3Status('active');

      const combinedText = `${activeFile?.rawTextContent || ''} ${customResumePaste}`.trim();
      const effectiveFileName =
        activeFile?.name ||
        (customResumePaste.trim().length < 250
          ? 'basic_pasted_resume.txt'
          : 'custom_pasted_resume.txt');
      const effectiveRole = customJobInput.trim() || targetRole;
      const effectiveSize = activeFile?.sizeBytes || customResumePaste.length * 12;

      let finalAnalysis: CandidateAnalysis | undefined;

      try {
        const res = await fetch('/api/v1/resume/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName: activeUser.name,
            candidateEmail: activeUser.email,
            candidatePhone: activeUser.contactNumber,
            fileName: effectiveFileName,
            fileSize: effectiveSize,
            rawTextContent: combinedText,
            targetRole: effectiveRole,
            presetKey: activePreset || undefined,
          }),
        });
        if (res.status === 422) {
          const errData = await res.json();
          setErrorBanner(errData.error || 'The uploaded file was rejected because it is not a valid resume.');
          if (errData.validation) setValidationResult(errData.validation);
          setIsAnalyzing(false);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data?.analysis) {
            finalAnalysis = data.analysis;
          }
        }
      } catch {
        // Offline / file:// or local mode — fall back seamlessly to client-side resume analysis engine
      }

      if (!finalAnalysis) {
        finalAnalysis = buildClientResumeAnalysis({
          candidateName: activeUser.name,
          candidateEmail: activeUser.email,
          candidatePhone: activeUser.contactNumber,
          fileName: effectiveFileName,
          fileSize: effectiveSize,
          rawTextContent: combinedText,
          targetRole: effectiveRole,
          presetKey: activePreset || undefined,
        });
      }

      // Persist this upload & analysis in local per-user storage so History & counters always reflect it
      recordLocalResumeUploadAndAnalysis(finalAnalysis, effectiveSize);
      refreshUserCounters();

      const computedScore = finalAnalysis.score ?? 42;
      const computedSkillsCount = finalAnalysis.skillsDetected?.length ?? 3;
      const badgeStyle =
        computedScore < 52
          ? 'bg-error-container text-on-error-container font-bold'
          : computedScore < 78
          ? 'bg-secondary-container text-on-secondary-container font-bold'
          : 'bg-tertiary-fixed text-on-tertiary-fixed font-bold';

      setProgressPercent(100);
      setProgressTitle(
        `Uploaded "${effectiveFileName}"! Resume Score: ${computedScore}/100`
      );
      setStep3Status('done');
      setDetectedSkillsCount(computedSkillsCount);
      setEstimatedAtsScore(computedScore);
      setScoreBadgeClass(badgeStyle);
      setShowMetricsPreview(true);

      const mappedStateKey: 'stateA' | 'stateB' | 'stateC' =
        computedScore < 52 ? 'stateA' : computedScore < 78 ? 'stateB' : 'stateC';

      setTimeout(() => {
        setIsAnalyzing(false);
        onAnalysisComplete(
          mappedStateKey,
          effectiveRole,
          effectiveFileName,
          finalAnalysis
        );
      }, 650);
    }, 600);
  };

  const renderStepIcon = (status: 'pending' | 'active' | 'done') => {
    if (status === 'active') {
      return (
        <span className="material-symbols-outlined text-[18px] text-primary animate-spin">
          hourglass_top
        </span>
      );
    }
    if (status === 'done') {
      return (
        <span className="material-symbols-outlined text-[18px] text-tertiary">
          check_circle
        </span>
      );
    }
    return (
      <span className="material-symbols-outlined text-[18px] text-secondary">
        radio_button_unchecked
      </span>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-space-md sm:py-space-xl flex flex-col items-center">
      {/* Top Step / Workflow Header */}
      <div className="flex items-center gap-space-xs px-space-md py-space-2xs mb-space-lg rounded-full bg-surface-container shadow-sm text-secondary">
        <span
          className="material-symbols-outlined text-[18px] text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          cloud_upload
        </span>
        <span className="text-xs font-semibold tracking-wide uppercase text-on-surface-variant">
          Step 1 · Dynamic Document Ingestion &amp; Real-Time Resume Scoring
        </span>
      </div>

      {/* API Integration Status Badge Bar */}
      <div className="w-full mb-space-md flex flex-wrap items-center justify-between gap-space-sm px-space-md py-space-xs rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface">
        <div className="flex items-center gap-space-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
          <span className="text-xs font-semibold">Engine: Dynamic Content Scorer Live</span>
          <span className="text-secondary text-xs">
            · Candidate Session: <strong className="text-on-surface">{activeUser.name}</strong> (
            {activeUser.contactNumber})
          </span>
        </div>
        <div className="flex items-center gap-space-xs text-xs text-secondary">
          <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
          <span className="font-mono text-xs bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/30 text-on-surface-variant">
            Multi-Tier Rubric Active
          </span>
        </div>
      </div>

      {/* Main Upload Workspace Card */}
      <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md sm:p-space-2xl transition-all">
        {/* Card Header */}
        <div className="flex flex-col items-start gap-space-2xs text-left pb-space-lg">
          <h1 className="text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
            Upload Your Resume
          </h1>
          <p className="text-sm text-on-surface-variant max-w-2xl">
            Upload any PDF, DOCX, or TXT resume file — or paste your resume content below. Each resume is dynamically parsed and scored based on its actual skills, content depth, and alignment with the target role for{' '}
            <strong className="text-on-surface">{activeUser.name}</strong>.
          </p>
        </div>

        {errorBanner && (
          <div className="mb-space-md p-space-sm rounded-lg bg-error-container text-on-error-container text-xs font-semibold flex items-center justify-between">
            <span>{errorBanner}</span>
            <button type="button" onClick={() => setErrorBanner(null)} className="underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Drag & Drop Dropzone Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileSelection(e.dataTransfer.files[0]);
            }
          }}
          className={`relative w-full rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-space-xl sm:p-space-2xl text-center group hover:bg-surface-container hover:shadow-sm ${
            isDragging ? 'bg-surface-container-high' : 'bg-surface-container-low'
          }`}
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none opacity-50"></div>
          <input
            ref={fileInputRef}
            accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelection(e.target.files[0]);
              }
            }}
          />

          <div className="w-16 h-16 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center mb-space-md group-hover:scale-105 transition-transform duration-200">
            <span className="material-symbols-outlined text-[36px] text-primary">
              cloud_upload
            </span>
          </div>

          <p className="text-base text-on-surface font-semibold mb-space-2xs">
            Drag &amp; drop your resume file here
          </p>
          <span className="text-xs text-on-surface-variant mb-space-md">or</span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-space-lg py-space-xs rounded-lg bg-primary-container text-on-primary text-sm font-medium shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-space-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">folder_open</span>
            <span>Choose Resume File</span>
          </button>

          {/* Non-Resume Rejection Alert Card */}
          {validationResult && !validationResult.isValid && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-space-md w-full max-w-xl p-space-md rounded-xl bg-error-container/20 border border-error/40 flex flex-col gap-2 text-left"
            >
              <div className="flex items-center gap-2 text-error font-bold text-sm">
                <span className="material-symbols-outlined text-[22px]">gpp_bad</span>
                <span>Non-Resume Document Rejected: {validationResult.detectedDocumentType}</span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium">
                {validationResult.rejectionReason}
              </p>
              {validationResult.missingSections.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                  <span className="text-secondary font-semibold">Missing Sections:</span>
                  {validationResult.missingSections.map((sec) => (
                    <span
                      key={sec}
                      className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-semibold"
                    >
                      ✕ {sec}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-1 p-2 rounded bg-surface-container-lowest text-[11px] text-secondary border border-outline-variant/30">
                💡 <strong>Only Resumes Accepted:</strong> Our AI Resume Analyzer requires professional sections like Experience, Education, or Technical Skills. Invoices, recipes, medical records, or generic notes cannot be analyzed.
              </div>
            </div>
          )}

          {/* Selected File Feedback */}
          {selectedFile && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-space-md flex flex-col items-center gap-space-2xs px-space-md py-space-xs rounded-lg bg-surface-container-high text-on-surface border border-outline-variant/50"
            >
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-tertiary">
                  check_circle
                </span>
                <span className="text-sm font-semibold truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </span>
                <span className="font-mono text-xs text-on-surface-variant">
                  ({selectedFile.sizeFormatted})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setSelectedPreset(null);
                    setValidationResult(null);
                  }}
                  className="ml-space-xs text-error hover:opacity-80 p-0.5 rounded cursor-pointer"
                  title="Clear selection"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                </button>
              </div>

              {/* Verified Resume Indicators */}
              {validationResult && validationResult.isValid && !selectedFile.isPreset && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 text-xs">
                  <span className="flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    Resume Verified ({validationResult.confidenceScore}% Confidence)
                  </span>
                  {validationResult.detectedSections.map((sec) => (
                    <span
                      key={sec}
                      className="px-2 py-0.5 rounded-full bg-surface-container-lowest text-on-surface-variant text-[11px] border border-outline-variant/30"
                    >
                      ✓ {sec}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-secondary mt-space-lg">
            Supported formats:{' '}
            <span className="font-semibold text-on-surface">PDF, DOCX, TXT</span> &nbsp;|&nbsp; Max
            size: <span className="font-semibold text-on-surface">5MB</span>
          </p>
        </div>

        {/* Per-User Upload Count, Password Reset Count & Uploaded Documents Summary */}
        <div className="mt-space-md p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-space-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-space-xs border-b border-outline-variant/25">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[19px]">
                folder_shared
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                {activeUser.name}&apos;s Document Uploads &amp; Password Reset Counters
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer self-start sm:self-center"
            >
              View Full History ({userUploadCount} Uploads) →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs">
            <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/25 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase text-secondary">
                  Documents Uploaded
                </div>
                <div className="text-xs text-on-surface-variant">
                  Times {activeUser.name} uploaded a resume
                </div>
              </div>
              <span className="text-xl font-extrabold font-mono text-primary">
                {userUploadCount}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/25 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase text-secondary">
                  Password Resets
                </div>
                <div className="text-xs text-on-surface-variant">
                  Times {activeUser.name} reset password
                </div>
              </div>
              <span className="text-xl font-extrabold font-mono text-amber-700">
                {userPasswordResetCount}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/25 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="text-[11px] font-semibold uppercase text-secondary">
                  Latest Uploaded File
                </div>
                <div className="text-xs font-mono font-semibold text-on-surface truncate">
                  {userUploadedFiles[0]?.fileName || selectedFile?.name || 'No file uploaded yet'}
                </div>
              </div>
              <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0">
                description
              </span>
            </div>
          </div>

          {userUploadedFiles.length > 0 && (
            <div className="pt-1 flex flex-col gap-1.5">
              <div className="text-[11px] font-mono uppercase font-semibold text-secondary">
                Documents Uploaded by {activeUser.name} ({userUploadedFiles.length}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {userUploadedFiles.slice(0, 6).map((item, idx) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-mono text-on-surface"
                  >
                    <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold text-[10px]">
                      #{userUploadedFiles.length - idx}
                    </span>
                    <span className="font-semibold">{item.fileName}</span>
                    <span className="text-tertiary font-bold">({item.score}/100)</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Presets / Test Cases Bar */}
        <div className="mt-space-lg p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-xs border-b border-outline-variant/20 gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[18px] text-primary">science</span>
              <span className="text-xs font-semibold text-on-surface uppercase tracking-wide">
                Test Different Resume Profiles (Compare Scores)
              </span>
            </div>
            <span className="text-xs text-secondary">
              Each resume type generates a distinct score &amp; diagnostic
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs pt-space-sm">
            <button
              type="button"
              onClick={() => applyPreset('poor')}
              className={`text-left p-space-xs sm:p-space-sm rounded-lg bg-surface-container-lowest border transition-all flex flex-col gap-1 cursor-pointer ${
                selectedPreset === 'poor'
                  ? 'ring-2 ring-primary bg-primary/5 border-primary'
                  : 'border-outline-variant/40 hover:border-primary hover:bg-primary/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">warning</span> Basic / Fresher Resume
                </span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-medium">
                  34 / 100
                </span>
              </div>
              <span className="text-xs text-on-surface-variant">
                Entry-Level PDF · 3 Basic Skills · Low Match
              </span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('average')}
              className={`text-left p-space-xs sm:p-space-sm rounded-lg bg-surface-container-lowest border transition-all flex flex-col gap-1 cursor-pointer ${
                selectedPreset === 'average'
                  ? 'ring-2 ring-primary bg-primary/5 border-primary'
                  : 'border-outline-variant/40 hover:border-primary hover:bg-primary/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">tune</span> Mid-Level Resume
                </span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-medium">
                  66 / 100
                </span>
              </div>
              <span className="text-xs text-on-surface-variant">
                Standard DOCX · 6 Core Skills · Moderate Match
              </span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('senior')}
              className={`text-left p-space-xs sm:p-space-sm rounded-lg bg-surface-container-lowest border transition-all flex flex-col gap-1 cursor-pointer ${
                selectedPreset === 'senior'
                  ? 'ring-2 ring-primary bg-primary/5 border-primary'
                  : 'border-primary/30 hover:border-primary hover:bg-primary/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-tertiary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span> Senior Full-Stack
                </span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                  93 / 100
                </span>
              </div>
              <span className="text-xs text-on-surface-variant">
                Staff Engineer · 10+ Cloud Skills · High Match
              </span>
            </button>
          </div>
        </div>

        {/* Optional: Paste Resume Content or Skills to Test Custom Scoring */}
        <div className="mt-space-md p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <label
              htmlFor="customResumePaste"
              className="text-xs font-semibold text-on-surface flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px] text-primary">
                description
              </span>
              <span>Optional: Paste Resume Text / Skills for Live Content Scoring</span>
            </label>
            <span className="text-[11px] text-secondary">
              Try pasting basic skills (e.g. HTML, CSS) vs full-stack skills
            </span>
          </div>
          <textarea
            id="customResumePaste"
            rows={2}
            value={customResumePaste}
            onChange={(e) => {
              setCustomResumePaste(e.target.value);
              setSelectedPreset(null);
            }}
            placeholder="Paste resume summary or skills here (e.g. 'HTML, CSS, basic C' for a basic score, or 'React, Node.js, TypeScript, MongoDB, Docker, AWS, SQL' for a high score)..."
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-space-sm py-2 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Target Job Role / Job Matcher Pairing Section */}
        <div className="mt-space-md p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex flex-col gap-space-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[20px] text-primary">fact_check</span>
              <h3 className="text-base font-semibold text-on-surface">
                Target Job Context (Job Matcher Pairing)
              </h3>
            </div>
            <span className="text-xs text-secondary font-semibold">
              Dynamically adjusts Job Match %
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-on-surface-variant font-medium" htmlFor="targetRoleSelect">
                Predefined Target Role
              </label>
              <select
                id="targetRoleSelect"
                value={targetRole}
                onChange={(e) => {
                  setTargetRole(e.target.value);
                  if (e.target.value !== 'custom') {
                    setCustomJobInput(e.target.value);
                  } else {
                    setCustomJobInput('');
                  }
                }}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-space-sm py-2 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Senior Full-Stack Engineer (React, Node, Cloud)">
                  Senior Full-Stack Engineer (React, Node, Cloud)
                </option>
                <option value="Lead Frontend Architect (Next.js, TypeScript)">
                  Lead Frontend Architect (Next.js, TypeScript)
                </option>
                <option value="AI / ML Engineer (Python, PyTorch, LLMs)">
                  AI / ML Engineer (Python, PyTorch, LLMs)
                </option>
                <option value="Junior Software Developer">Junior Software Developer</option>
                <option value="custom">-- Custom Job Role / Paste Description --</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-on-surface-variant font-medium" htmlFor="customJobInput">
                Custom Role Title or Keywords
              </label>
              <input
                id="customJobInput"
                type="text"
                value={customJobInput}
                onChange={(e) => setCustomJobInput(e.target.value)}
                placeholder="e.g. Staff Platform Engineer, Kubernetes, Go"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-space-sm py-2 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Live Simulated API Extraction Progress Banner */}
        {(isAnalyzing || showMetricsPreview) && (
          <div className="mt-space-lg p-space-md rounded-xl bg-surface-container border border-primary/40 flex flex-col gap-space-sm transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span
                  className={`material-symbols-outlined text-primary text-[22px] ${
                    isAnalyzing ? 'animate-spin' : ''
                  }`}
                >
                  {isAnalyzing ? 'refresh' : 'check_circle'}
                </span>
                <span className="text-base font-semibold text-on-surface">{progressTitle}</span>
              </div>
              <span className="font-mono text-xs text-primary font-semibold">
                {progressPercent}%
              </span>
            </div>

            <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs pt-space-xs text-xs">
              <div className="flex items-center gap-space-xs">
                {renderStepIcon(step1Status)}
                <span className="text-on-surface-variant truncate">
                  1. Format &amp; MIME validation
                </span>
              </div>
              <div className="flex items-center gap-space-xs">
                {renderStepIcon(step2Status)}
                <span className="text-on-surface-variant truncate">2. Text buffer parsing</span>
              </div>
              <div className="flex items-center gap-space-xs">
                {renderStepIcon(step3Status)}
                <span className="text-on-surface-variant truncate">
                  3. Dynamic rubric scoring
                </span>
              </div>
            </div>

            {showMetricsPreview && (
              <div className="mt-space-2xs p-space-sm rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-space-md">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">
                      psychology
                    </span>
                    <span className="text-xs text-on-surface-variant">Skills Detected:</span>
                    <span className="font-mono text-xs font-semibold text-on-surface">
                      {detectedSkillsCount} detected
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      analytics
                    </span>
                    <span className="text-xs text-on-surface-variant">Resume Score:</span>
                    <span className={`font-mono text-xs px-2 py-0.5 rounded ${scoreBadgeClass}`}>
                      {estimatedAtsScore}/100
                    </span>
                  </div>
                </div>
                <span className="text-xs text-tertiary font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check</span> Scored
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-space-lg">
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={handleUploadAnalyze}
            className="w-full py-space-sm px-space-lg rounded-lg bg-primary-container text-on-primary text-base font-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-space-sm group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px] group-hover:rotate-12 transition-transform">
              bolt
            </span>
            <span>{isAnalyzing ? 'Scoring Uploaded Resume...' : 'Upload & Analyze Resume'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
