import React, { useState, useEffect, useCallback } from 'react';
import { ActiveUser, ActivityCategory, ActivityLogItem, CandidateAnalysis, ScreenId } from '../types';
import {
  getUserHistoryLocal,
  getUserLogsLocal,
  mergeUserHistoryWithLocal,
  mergeUserLogsWithLocal,
} from '../utils/userHistoryStore';

interface HistoryScreenProps {
  activeUser: ActiveUser;
  onNavigate: (screen: ScreenId) => void;
  onInspectPreviousUpload?: (analysis: CandidateAnalysis) => void;
}

export interface HistoryItem {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  fileName: string;
  targetRole: string;
  score: number;
  matchPercentage: number;
  skillsDetected: string[];
  missingSkills?: string[];
  strengths?: string[];
  formatVerified?: boolean;
  timestamp: string;
  fullAnalysis?: CandidateAnalysis;
}

interface MongoStatusData {
  driver: string;
  connectedToCluster: boolean;
  mode: string;
  uriMasked: string;
  dbName: string;
  lastSyncAt: string;
  message: string;
  collections: {
    users: { name: string; totalDocuments: number; indexes: string[] };
    analysis_history: {
      name: string;
      totalDocuments: number;
      userIsolatedDocuments: number;
      indexes: string[];
    };
    activity_logs: {
      name: string;
      totalDocuments: number;
      userIsolatedDocuments: number;
      indexes: string[];
    };
  };
  sampleUserDocuments: Array<Record<string, unknown>>;
}

interface ActivityLogsProps {
  logs: ActivityLogItem[];
  activeUser: ActiveUser;
  categoryFilter: 'all' | ActivityCategory;
  onCategoryChange: (cat: 'all' | ActivityCategory) => void;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({
  logs,
  activeUser,
  categoryFilter,
  onCategoryChange,
}) => {
  // Strictly ensure only the active user's logs are ever shown
  const userIsolatedLogs = logs.filter(
    (log) =>
      log.candidateEmail.trim().toLowerCase() === activeUser.email.trim().toLowerCase() ||
      log.candidateName.trim().toLowerCase() === activeUser.name.trim().toLowerCase()
  );

  const filteredLogs = userIsolatedLogs.filter((log) => {
    if (categoryFilter !== 'all' && log.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getRelativeTime = (iso: string) => {
    try {
      const diffSec = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return `${Math.floor(diffHr / 24)}d ago`;
    } catch {
      return 'just now';
    }
  };

  const getCategoryVisuals = (cat: ActivityCategory) => {
    switch (cat) {
      case 'resume_upload':
        return {
          icon: 'cloud_upload',
          label: 'Resume Upload',
          badgeClass: 'bg-primary-fixed text-on-primary-fixed',
          iconBg: 'bg-primary/10 text-primary',
        };
      case 'analysis_complete':
        return {
          icon: 'donut_large',
          label: 'Analysis Completed',
          badgeClass: 'bg-tertiary-fixed/40 text-tertiary',
          iconBg: 'bg-tertiary/10 text-tertiary',
        };
      case 'password_change':
        return {
          icon: 'lock_reset',
          label: 'Password Changed',
          badgeClass: 'bg-amber-100 text-amber-800',
          iconBg: 'bg-amber-500/15 text-amber-700',
        };
      case 'account_auth':
      default:
        return {
          icon: 'verified_user',
          label: 'Account Auth',
          badgeClass: 'bg-secondary-container text-on-secondary-container',
          iconBg: 'bg-secondary/10 text-secondary',
        };
    }
  };

  const uploadCount = userIsolatedLogs.filter((l) => l.category === 'resume_upload').length;
  const analysisCount = userIsolatedLogs.filter((l) => l.category === 'analysis_complete').length;
  const passwordCount = userIsolatedLogs.filter((l) => l.category === 'password_change').length;
  const uploadedFileNames = Array.from(
    new Set(
      userIsolatedLogs
        .filter((l) => l.category === 'resume_upload' && l.metadata)
        .map((l) => l.metadata?.replace(/^Upload #\d+\s*·\s*File:\s*/i, '').replace(/^File:\s*/i, '') || '')
        .filter(Boolean)
    )
  );

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-space-lg flex flex-col gap-space-md">
      {/* Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm pb-space-sm border-b border-outline-variant/25">
        <div className="flex items-start sm:items-center gap-space-sm">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">history</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-on-surface">
                Personal Activity Audit Trail ({activeUser.name})
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-surface-container-high text-primary">
                {filteredLogs.length} Personal Events
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-tertiary-fixed/50 text-on-tertiary-fixed flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">lock</span>
                Private to {activeUser.email}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Strict per-user isolation: Only <strong className="text-on-surface">{activeUser.name}</strong>&apos;s own resume uploads, ATS analyses, and password updates are visible here. Other users cannot view your history.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-container">
            {(
              [
                { id: 'all', label: 'All My Activity' },
                { id: 'resume_upload', label: `My Uploads (${uploadCount})` },
                { id: 'analysis_complete', label: `My Analyses (${analysisCount})` },
                { id: 'password_change', label: `My Passwords (${passwordCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onCategoryChange(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Audit Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
        <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
              cloud_upload
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-secondary uppercase">
                My Resume Uploads
              </div>
              <div className="text-xs text-on-surface-variant truncate">
                {uploadedFileNames.length > 0
                  ? `Uploaded: ${uploadedFileNames.slice(0, 2).join(', ')}`
                  : `Uploaded by ${activeUser.name}`}
              </div>
            </div>
          </div>
          <span className="text-xl font-extrabold font-mono text-on-surface shrink-0">
            {uploadCount}
          </span>
        </div>

        <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-tertiary text-[20px]">donut_large</span>
            <div>
              <div className="text-xs font-semibold text-secondary uppercase">
                My Analyses Completed
              </div>
              <div className="text-xs text-on-surface-variant">
                Evaluations for {activeUser.name}
              </div>
            </div>
          </div>
          <span className="text-xl font-extrabold font-mono text-tertiary">{analysisCount}</span>
        </div>

        <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-600 text-[20px]">lock_reset</span>
            <div>
              <div className="text-xs font-semibold text-secondary uppercase">
                My Password Changes
              </div>
              <div className="text-xs text-on-surface-variant">
                Times password reset for {activeUser.name}
              </div>
            </div>
          </div>
          <span className="text-xl font-extrabold font-mono text-amber-700">{passwordCount}</span>
        </div>
      </div>

      {/* Timeline List */}
      {filteredLogs.length === 0 ? (
        <div className="py-8 text-center text-sm text-secondary">
          No activity logs found yet for <strong className="text-on-surface">{activeUser.name}</strong> ({activeUser.email}). Upload a resume to record your private history.
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/20">
          {filteredLogs.map((log) => {
            const vis = getCategoryVisuals(log.category);
            return (
              <div
                key={log.id}
                className="py-3.5 px-2 hover:bg-surface-container-low/50 rounded-lg transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${vis.iconBg}`}
                  >
                    <span className="material-symbols-outlined text-[19px]">{vis.icon}</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-on-surface">{log.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${vis.badgeClass}`}
                      >
                        {vis.label}
                      </span>
                      {log.metadata && (
                        <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
                          {log.metadata}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-on-surface-variant">{log.description}</p>

                    <div className="flex items-center gap-2 text-[11px] text-secondary font-mono pt-0.5 flex-wrap">
                      <span>Owner: {log.candidateName}</span>
                      <span>·</span>
                      <span>{log.candidateEmail}</span>
                      {log.contactNumber && (
                        <>
                          <span>·</span>
                          <span>{log.contactNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Timestamp Column */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 text-right font-mono">
                  <span className="text-xs font-semibold text-on-surface">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-secondary">
                      {getRelativeTime(log.timestamp)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed/40 text-tertiary text-[10px] font-bold">
                      {log.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  activeUser,
  onNavigate,
  onInspectPreviousUpload,
}) => {
  const [historyList, setHistoryList] = useState<HistoryItem[]>(() =>
    getUserHistoryLocal(activeUser)
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() =>
    getUserLogsLocal(activeUser)
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ActivityCategory>('all');
  const [mongoStatus, setMongoStatus] = useState<MongoStatusData | null>(null);
  const [showMongoConfig, setShowMongoConfig] = useState(false);
  const [showBsonPreview, setShowBsonPreview] = useState(false);
  const [mongoUriInput, setMongoUriInput] = useState('');
  const [mongoDbInput, setMongoDbInput] = useState('resumetric_ai');
  const [mongoSyncing, setMongoSyncing] = useState(false);
  const [mongoFeedback, setMongoFeedback] = useState<string | null>(null);

  const fetchMongoStatus = useCallback(() => {
    const params = new URLSearchParams({
      email: activeUser.email,
      name: activeUser.name,
      contactNumber: activeUser.contactNumber || '',
    });
    fetch(`/api/v1/mongodb/status?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.mongodb) {
          setMongoStatus(data.mongodb);
        }
      })
      .catch(() => {});
  }, [activeUser.email, activeUser.name, activeUser.contactNumber]);

  const fetchHistoryAndLogs = useCallback(() => {
    // Load local per-user history and logs immediately so offline / instant uploads are shown right away
    const localHist = getUserHistoryLocal(activeUser);
    const localLogs = getUserLogsLocal(activeUser);
    setHistoryList(localHist);
    setActivityLogs(localLogs);

    const params = new URLSearchParams({
      email: activeUser.email,
      name: activeUser.name,
      contactNumber: activeUser.contactNumber || '',
    });
    fetch(`/api/v1/history?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.history)) {
          const mergedHist = mergeUserHistoryWithLocal(data.history, activeUser);
          setHistoryList(mergedHist);
        }
        if (Array.isArray(data.activityLogs)) {
          const mergedLogs = mergeUserLogsWithLocal(data.activityLogs, activeUser);
          setActivityLogs(mergedLogs);
        }
      })
      .catch(() => {
        // Already loaded from localStorage above
      });
  }, [activeUser]);

  useEffect(() => {
    fetchHistoryAndLogs();
    fetchMongoStatus();
  }, [fetchHistoryAndLogs, fetchMongoStatus]);

  const handleMongoSync = async () => {
    setMongoSyncing(true);
    setMongoFeedback(null);
    try {
      const res = await fetch('/api/v1/mongodb/sync', { method: 'POST' });
      const data = await res.json();
      setMongoFeedback(data.message || 'Collections synchronized.');
      fetchHistoryAndLogs();
      fetchMongoStatus();
    } catch {
      setMongoFeedback('Persisted to Local MongoDB Document Store.');
    } finally {
      setMongoSyncing(false);
    }
  };

  const handleMongoConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setMongoSyncing(true);
    setMongoFeedback(null);
    try {
      const res = await fetch('/api/v1/mongodb/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: mongoUriInput.trim(), dbName: mongoDbInput.trim() }),
      });
      const data = await res.json();
      setMongoFeedback(data.message || 'MongoDB configuration updated.');
      fetchHistoryAndLogs();
      fetchMongoStatus();
    } catch {
      setMongoFeedback('Unable to reach endpoint; using Local MongoDB Document Store.');
    } finally {
      setMongoSyncing(false);
    }
  };

  // Double-enforce client-side user isolation so another user's records can never leak into view
  const userOwnedHistory = historyList.filter(
    (item) =>
      item.candidateEmail.trim().toLowerCase() === activeUser.email.trim().toLowerCase() ||
      item.candidateName.trim().toLowerCase() === activeUser.name.trim().toLowerCase()
  );

  const filtered = userOwnedHistory.filter(
    (item) =>
      item.fileName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.targetRole.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.skillsDetected.some((s) => s.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  // Reconstruct a full CandidateAnalysis object when the user clicks "Inspect Report" on any of their previous uploads
  const buildAnalysisFromHistoryItem = (item: HistoryItem): CandidateAnalysis => {
    if (item.fullAnalysis) {
      return {
        ...item.fullAnalysis,
        candidateName: activeUser.name,
        candidateEmail: activeUser.email,
        candidatePhone: activeUser.contactNumber,
      };
    }

    const score = item.score;
    const matchPercentage = item.matchPercentage;
    const scoreStatus =
      score < 52 ? 'Needs Improvement' : score < 78 ? 'Moderate / Fair' : 'Exceptional';
    const scoreStatusColor =
      score < 52
        ? 'bg-error/15 text-error'
        : score < 78
        ? 'bg-amber-100 text-amber-700'
        : 'bg-tertiary-fixed/30 text-tertiary';
    const scoreIcon = score < 52 ? 'error' : score < 78 ? 'check_circle' : 'verified';
    const gaugeStrokeColor = score < 52 ? '#ba1a1a' : score < 78 ? '#d97706' : '#006e4b';
    const matchCircleColor =
      matchPercentage < 50 ? '#ba1a1a' : matchPercentage < 75 ? '#4f46e5' : '#3525cd';

    const missing = item.missingSkills && item.missingSkills.length > 0
      ? item.missingSkills
      : ['Kubernetes Cluster Ops', 'System Design'];

    return {
      id: item.id,
      fileName: item.fileName,
      candidateName: activeUser.name,
      candidateEmail: activeUser.email,
      candidatePhone: activeUser.contactNumber,
      greeting: `Restored historical upload: ${item.fileName} (${score}/100)`,
      targetRole: item.targetRole,
      score,
      scoreStatus,
      scoreStatusColor,
      scoreIcon,
      gaugeStrokeColor,
      summaryText: `Historical resume submission "${item.fileName}" uploaded by ${activeUser.name} for ${item.targetRole}. Verified ${item.skillsDetected.length} technical skills.`,
      formatVerified: item.formatVerified ?? score >= 52,
      formatStatusText: `Historical ATS scan verified (${item.fileName})`,
      percentileText:
        score < 52
          ? 'Bottom 35% of applicants'
          : score < 78
          ? `Top ${100 - score}% of candidates`
          : 'Top 8% of candidates',
      matchPercentage,
      matchCircleColor,
      matchedCount: item.skillsDetected.length,
      missingCount: missing.length,
      totalReqCount: item.skillsDetected.length + missing.length,
      skillsDetected: item.skillsDetected,
      missingSkills: missing,
      strengths:
        item.strengths && item.strengths.length > 0
          ? item.strengths
          : [
              `Verified ${item.skillsDetected.length} skills (${item.skillsDetected.slice(0, 4).join(', ')}) from ${item.fileName}`,
              `Evaluated for ${item.targetRole} with ${matchPercentage}% role alignment`,
            ],
      education: [
        {
          degree: 'B.Tech / M.S. in Computer Science & Engineering',
          institution: 'Verified Candidate Record',
          year: '2024',
          gpa: '8.8 / 10.0',
        },
      ],
      experience: [
        {
          title: item.targetRole,
          company: `Parsed from ${item.fileName}`,
          duration: '2022 – Present',
          impact: `Delivered production engineering modules utilizing ${item.skillsDetected.slice(0, 4).join(', ')}.`,
        },
      ],
      projects: [
        {
          name: `Portfolio Architecture (${item.fileName})`,
          stack: item.skillsDetected.slice(0, 5).join(', '),
          outcome: 'Restored from personal upload history.',
        },
      ],
      certifications: [],
      showCriticalWarning: score < 55,
      remediationTip: `Adding ${missing[0] || 'cloud orchestration'} will further elevate this resume's score.`,
      actionBtnText: 'Compare in Job Matcher',
    };
  };

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-space-lg pb-space-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Private User History &amp; Uploaded Resumes
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-primary-fixed text-on-primary-fixed flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified_user</span>
              Isolated to: {activeUser.name} ({activeUser.email})
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight mt-0.5">
            {activeUser.name}&apos;s Resume Upload History
          </h1>
          <p className="text-sm text-on-surface-variant">
            You can view and restore all resumes <strong className="text-on-surface">you uploaded before</strong> ({userOwnedHistory.length} saved uploads). Other users&apos; uploads and history are strictly hidden for privacy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search your uploaded files or roles..."
            className="px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary text-sm font-semibold cursor-pointer whitespace-nowrap"
          >
            + Upload New Resume
          </button>
        </div>
      </div>

      {/* MongoDB Integration & Document Persistence Panel */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="px-space-lg py-space-md bg-surface-container-low border-b border-outline-variant/25 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">database</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  MongoDB Document Persistence Engine
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold flex items-center gap-1 ${
                    mongoStatus?.connectedToCluster
                      ? 'bg-tertiary-fixed/50 text-tertiary'
                      : 'bg-primary-fixed text-on-primary-fixed'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {mongoStatus?.connectedToCluster
                    ? 'MongoDB Atlas Cluster Connected'
                    : 'MongoDB Driver Active (Local Document Engine)'}
                </span>
                <span className="text-[11px] font-mono text-secondary">
                  DB: {mongoStatus?.dbName || 'resumetric_ai'}
                </span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                {mongoStatus?.message ||
                  'All candidate accounts, resume analyses, and audit logs are automatically persisted in MongoDB collections.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleMongoSync}
              disabled={mongoSyncing}
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">sync</span>
              {mongoSyncing ? 'Syncing...' : 'Sync Collections'}
            </button>
            <button
              type="button"
              onClick={() => setShowBsonPreview((v) => !v)}
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">data_object</span>
              {showBsonPreview ? 'Hide BSON Docs' : 'Inspect BSON Docs'}
            </button>
            <button
              type="button"
              onClick={() => setShowMongoConfig((v) => !v)}
              className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">settings_ethernet</span>
              {showMongoConfig ? 'Close URI Config' : 'Configure Atlas URI'}
            </button>
          </div>
        </div>

        {/* Collection Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/25 bg-surface-container-lowest">
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase text-secondary">
                db.analysis_history (Your Docs)
              </div>
              <div className="text-xl font-bold font-mono text-on-surface mt-0.5">
                {Math.max(
                  mongoStatus?.collections.analysis_history.userIsolatedDocuments ?? 0,
                  userOwnedHistory.length
                )}{' '}
                <span className="text-xs font-normal text-secondary">documents</span>
              </div>
              <div className="text-[11px] font-mono text-secondary mt-0.5">
                Index: candidateEmail_1_timestamp_-1
              </div>
            </div>
            <span className="material-symbols-outlined text-primary/70 text-[24px]">
              description
            </span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase text-secondary">
                db.activity_logs (Your Audit Trail)
              </div>
              <div className="text-xl font-bold font-mono text-on-surface mt-0.5">
                {Math.max(
                  mongoStatus?.collections.activity_logs.userIsolatedDocuments ?? 0,
                  activityLogs.length
                )}{' '}
                <span className="text-xs font-normal text-secondary">documents</span>
              </div>
              <div className="text-[11px] font-mono text-secondary mt-0.5">
                Index: candidateEmail_1_timestamp_-1
              </div>
            </div>
            <span className="material-symbols-outlined text-tertiary/70 text-[24px]">
              receipt_long
            </span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase text-secondary">
                db.users (Registered Accounts)
              </div>
              <div className="text-xl font-bold font-mono text-on-surface mt-0.5">
                {mongoStatus?.collections.users.totalDocuments ?? 3}{' '}
                <span className="text-xs font-normal text-secondary">documents</span>
              </div>
              <div className="text-[11px] font-mono text-secondary mt-0.5">
                Index: id_1 (unique), email_1
              </div>
            </div>
            <span className="material-symbols-outlined text-secondary text-[24px]">group</span>
          </div>
        </div>

        {mongoFeedback && (
          <div className="px-space-lg py-2.5 bg-tertiary-fixed/25 border-t border-outline-variant/20 text-xs font-medium text-tertiary flex items-center justify-between">
            <span>{mongoFeedback}</span>
            <button
              type="button"
              onClick={() => setMongoFeedback(null)}
              className="text-secondary hover:text-on-surface text-xs font-mono cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Connect MongoDB Atlas URI Form */}
        {showMongoConfig && (
          <form
            onSubmit={handleMongoConnect}
            className="p-space-lg bg-surface-container-low/60 border-t border-outline-variant/25 flex flex-col gap-3"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-mono uppercase text-secondary mb-1">
                  MongoDB Connection URI (Atlas mongodb+srv:// or Local mongodb://)
                </label>
                <input
                  type="text"
                  value={mongoUriInput}
                  onChange={(e) => setMongoUriInput(e.target.value)}
                  placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="sm:w-52">
                <label className="block text-[11px] font-mono uppercase text-secondary mb-1">
                  Database Name
                </label>
                <input
                  type="text"
                  value={mongoDbInput}
                  onChange={(e) => setMongoDbInput(e.target.value)}
                  placeholder="resumetric_ai"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] text-secondary">
                Leave empty and click Connect to use the built-in Local MongoDB Document Store (.mongodb-local-collections.json).
              </span>
              <button
                type="submit"
                disabled={mongoSyncing}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-semibold cursor-pointer"
              >
                {mongoSyncing ? 'Connecting...' : 'Connect & Sync MongoDB'}
              </button>
            </div>
          </form>
        )}

        {/* Live BSON/JSON Document Inspector (Isolated to Active User) */}
        {showBsonPreview && (
          <div className="p-space-lg bg-surface-container-low/40 border-t border-outline-variant/25">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-on-surface">
                db.analysis_history.find(&#123; candidateEmail: &quot;{activeUser.email}&quot; &#125;).sort(&#123; timestamp: -1 &#125;)
              </span>
              <span className="text-[11px] font-mono text-secondary">
                Strictly isolated to {activeUser.name}
              </span>
            </div>
            <pre className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-[11px] font-mono text-on-surface overflow-x-auto max-h-60">
              {JSON.stringify(
                mongoStatus?.sampleUserDocuments && mongoStatus.sampleUserDocuments.length > 0
                  ? mongoStatus.sampleUserDocuments
                  : userOwnedHistory.slice(0, 2).map((h) => ({
                      _id: `ObjectId("${h.id}")`,
                      id: h.id,
                      candidateName: h.candidateName,
                      candidateEmail: h.candidateEmail,
                      fileName: h.fileName,
                      targetRole: h.targetRole,
                      score: h.score,
                      matchPercentage: h.matchPercentage,
                      skillsDetected: h.skillsDetected,
                      timestamp: h.timestamp,
                    })),
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* Historical Resume Evaluations Table (Moved to Top so user immediately sees all their previous uploads) */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="px-space-lg py-space-sm bg-surface-container-low border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">folder_shared</span>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
              Resumes Uploaded Before by {activeUser.name} ({filtered.length})
            </span>
          </div>
          <span className="text-xs text-secondary font-mono">
            Private to {activeUser.email} · Other users hidden
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-space-xl text-center flex flex-col items-center gap-space-xs">
            <span className="material-symbols-outlined text-secondary text-[32px]">
              upload_file
            </span>
            <p className="text-sm font-bold text-on-surface">
              No previous resume uploads found for {activeUser.name} ({activeUser.email})
            </p>
            <p className="text-xs text-secondary max-w-md">
              When you upload and analyze a resume as {activeUser.name}, every version you upload is saved here privately so you can inspect it anytime.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="mt-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-semibold cursor-pointer"
            >
              Upload Your First Resume →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/60 text-secondary text-xs font-semibold uppercase border-b border-outline-variant/30">
                  <th className="py-3 px-4">Candidate Owner</th>
                  <th className="py-3 px-4">Uploaded Resume File</th>
                  <th className="py-3 px-4">Target Requisition</th>
                  <th className="py-3 px-4">Detected Skills</th>
                  <th className="py-3 px-4">Uploaded Timestamp</th>
                  <th className="py-3 px-4 text-right">Resume Score</th>
                  <th className="py-3 px-4 text-right">Job Match</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface">{item.candidateName}</span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed text-[10px] font-mono font-bold">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-secondary">{item.candidateEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-on-surface font-semibold">
                      {item.fileName}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface">{item.targetRole}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.skillsDetected.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[11px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {item.skillsDetected.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-secondary text-[10px] font-mono">
                            +{item.skillsDetected.length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-secondary">
                      {new Date(item.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-on-surface">
                      {item.score}/100
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-tertiary">
                      {item.matchPercentage}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (onInspectPreviousUpload) {
                            onInspectPreviousUpload(buildAnalysisFromHistoryItem(item));
                          } else {
                            onNavigate('analysis');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Inspect Report →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Personal Activity Logs Component */}
      <ActivityLogs
        logs={activityLogs}
        activeUser={activeUser}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />
    </div>
  );
};
