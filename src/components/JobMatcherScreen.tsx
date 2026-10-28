import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { ActiveUser } from '../types';

interface CareerPathPrediction {
  id: string;
  futureJobTitle: string;
  horizon: string;
  readinessScore: number;
  salaryBand: string;
  trajectoryRationale: string;
  skillsToBridge: string[];
  milestoneAction: string;
}

interface JobMatcherScreenProps {
  activeUser: ActiveUser;
}

interface ResumePreset {
  candidate: string;
  file: string;
  skills: string[];
  verified: string;
}

interface JobTemplate {
  title: string;
  reqId: string;
  description: string;
  skills: string[];
}

const JOB_DATA: Record<string, JobTemplate> = {
  senior_fullstack: {
    title: 'Senior Full Stack Engineer',
    reqId: 'REQ-2026-FSD',
    description:
      'We are seeking a Senior Full Stack Engineer proficient in JavaScript, Node.js, MongoDB, React, HTML, CSS, and building scalable REST APIs.',
    skills: ['JavaScript', 'Node.js', 'MongoDB', 'React', 'HTML', 'CSS', 'REST API'],
  },
  junior_web: {
    title: 'Junior Web Intern',
    reqId: 'REQ-2026-INT',
    description:
      'Entry level position for modern web styling. Required: HTML, CSS, JavaScript baseline.',
    skills: ['HTML', 'CSS', 'JavaScript'],
  },
  frontend_react: {
    title: 'Frontend React Developer',
    reqId: 'REQ-2026-FRT',
    description:
      'Looking for an expert React developer skilled in React, TypeScript, JavaScript, HTML, CSS, and REST API consumption.',
    skills: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'REST API'],
  },
  python_analyst: {
    title: 'Python Data Analyst',
    reqId: 'REQ-2026-DAT',
    description:
      'Candidate should have deep background with Python, SQL, Pandas, Machine Learning, and PowerBI visualization.',
    skills: ['Python', 'SQL', 'Pandas', 'Machine Learning', 'PowerBI'],
  },
  cloud_devops: {
    title: 'Cloud DevOps Architect',
    reqId: 'REQ-2026-OPS',
    description:
      'Seeking cloud infra leader with AWS, Docker, Kubernetes, Python, Node.js, and CI/CD pipelines expertise.',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Python', 'Node.js', 'REST API'],
  },
};

const COMMON_SKILLS_DICTIONARY = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Node.js',
  'React',
  'MongoDB',
  'HTML',
  'CSS',
  'REST API',
  'GraphQL',
  'Docker',
  'AWS',
  'Kubernetes',
  'SQL',
  'PostgreSQL',
  'Pandas',
  'Machine Learning',
  'PowerBI',
  'Tailwind CSS',
  'Next.js',
  'Java',
  'C++',
  'Go',
  'Git',
  'Redis',
  'Angular',
  'Vue',
];

function extractSkillsFromText(text: string): string[] {
  if (!text || text.trim() === '') return [];
  const textLower = text.toLowerCase();
  const found: string[] = [];

  COMMON_SKILLS_DICTIONARY.forEach((skill) => {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9#+])${escaped}([^a-z0-9#+]|$)`, 'i');
    if (regex.test(textLower)) {
      found.push(skill);
    }
  });

  const commaParts = text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  commaParts.forEach((part) => {
    if (part.length < 30 && !found.some((f) => f.toLowerCase() === part.toLowerCase())) {
      const formatted = part.replace(/\b\w/g, (c) => c.toUpperCase());
      if (
        formatted.length > 1 &&
        !/^(required|preferred|looking|we|are|seeking|for|with|and)$/i.test(formatted)
      ) {
        found.push(formatted);
      }
    }
  });

  return Array.from(new Set(found));
}

export const JobMatcherScreen: React.FC<JobMatcherScreenProps> = ({ activeUser }) => {
  const [resumeKey, setResumeKey] = useState<string>('mid_fsd');
  const [jobKey, setJobKey] = useState<string>('senior_fullstack');
  const [customJobText, setCustomJobText] = useState<string>('');
  const [activeCustomSkills, setActiveCustomSkills] = useState<string[] | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [exportBanner, setExportBanner] = useState<string | null>(null);
  const [appliedAdjustments, setAppliedAdjustments] = useState<string[]>([]);

  // Dynamically construct resume presets including the active user's profile
  const resumeDataMap: Record<string, ResumePreset> = {
    active_user: {
      candidate: `${activeUser.name} (Active Session)`,
      file: `${activeUser.name.toLowerCase().replace(/\s+/g, '_')}_resume.pdf`,
      skills: [
        'JavaScript',
        'React',
        'Node.js',
        'MongoDB',
        'HTML',
        'CSS',
        ...appliedAdjustments,
      ],
      verified: `${6 + appliedAdjustments.length} / ${6 + appliedAdjustments.length} verified`,
    },
    mid_fsd: {
      candidate: 'Divya S. (Mid-Level)',
      file: 'resume_divya_v2.pdf',
      skills: ['Python', 'JavaScript', 'MongoDB', 'HTML', 'CSS', ...appliedAdjustments],
      verified: `${5 + appliedAdjustments.length} / ${5 + appliedAdjustments.length} verified`,
    },
    poor_junior: {
      candidate: 'Alex K. (Entry Level)',
      file: 'resume_junior.pdf',
      skills: ['HTML', 'CSS', ...appliedAdjustments],
      verified: `${2 + appliedAdjustments.length} / ${2 + appliedAdjustments.length} verified`,
    },
    frontend_dev: {
      candidate: 'Sarah Chen (React Lead)',
      file: 'resume_frontend_sarah.pdf',
      skills: [
        'React',
        'JavaScript',
        'TypeScript',
        'CSS',
        'HTML',
        'REST API',
        'Tailwind CSS',
        ...appliedAdjustments,
      ],
      verified: `${7 + appliedAdjustments.length} / ${7 + appliedAdjustments.length} verified`,
    },
    senior_architect: {
      candidate: 'Marcus Vance (Staff Architect)',
      file: 'resume_marcus_architect.pdf',
      skills: [
        'JavaScript',
        'Node.js',
        'MongoDB',
        'React',
        'HTML',
        'CSS',
        'REST API',
        'Docker',
        'AWS',
        'Python',
        'Kubernetes',
        ...appliedAdjustments,
      ],
      verified: `${11 + appliedAdjustments.length} / ${11 + appliedAdjustments.length} verified`,
    },
    data_analyst: {
      candidate: 'Priya Patel (Data Analyst)',
      file: 'resume_priya_data.pdf',
      skills: ['Python', 'SQL', 'Pandas', 'Machine Learning', 'PowerBI', 'HTML', ...appliedAdjustments],
      verified: `${6 + appliedAdjustments.length} / ${6 + appliedAdjustments.length} verified`,
    },
  };

  const currentResume = resumeDataMap[resumeKey] || resumeDataMap.mid_fsd;
  const uniqueResumeSkills = Array.from(new Set(currentResume.skills));

  const currentJob =
    activeCustomSkills && activeCustomSkills.length > 0
      ? {
          title: 'Custom Job Requisition',
          reqId: 'REQ-CUSTOM-USR',
          skills: activeCustomSkills,
        }
      : JOB_DATA[jobKey] || JOB_DATA.senior_fullstack;

  const resumeSkillSet = new Set(uniqueResumeSkills.map((s) => s.toLowerCase().trim()));
  const matched: string[] = [];
  const missing: string[] = [];

  currentJob.skills.forEach((reqSkill) => {
    if (resumeSkillSet.has(reqSkill.toLowerCase().trim())) {
      matched.push(reqSkill);
    } else {
      missing.push(reqSkill);
    }
  });

  const totalRequired = currentJob.skills.length;
  const matchCount = matched.length;
  const matchPercent = totalRequired > 0 ? Math.round((matchCount / totalRequired) * 100) : 0;

  const circumference = 301.6;
  const strokeOffset = circumference - (circumference * matchPercent) / 100;

  const handleAnalyzeCustomText = (textOverride?: string) => {
    const raw = (textOverride !== undefined ? textOverride : customJobText).trim();
    if (!raw) {
      setActiveCustomSkills(null);
      if (jobKey === 'custom') {
        setJobKey('senior_fullstack');
      }
      return;
    }
    const extracted = extractSkillsFromText(raw);
    setActiveCustomSkills(
      extracted.length > 0 ? extracted : ['JavaScript', 'Python', 'Problem Solving']
    );
    setJobKey('custom');
  };

  const handleApplySkillSuggestion = (skillsToAdd: string[]) => {
    setAppliedAdjustments((prev) => Array.from(new Set([...prev, ...skillsToAdd])));
    setExportBanner(
      `Applied ${skillsToAdd.join(', ')} to ${currentResume.candidate}'s profile — Match % recalculated!`
    );
    setTimeout(() => setExportBanner(null), 3500);
  };

  // AI Career Path Predictor state & trajectory computation
  const [aiCareerPredictions, setAiCareerPredictions] = useState<CareerPathPrediction[] | null>(
    null
  );
  const [isPredictingPaths, setIsPredictingPaths] = useState(false);
  const [careerPredictorSource, setCareerPredictorSource] = useState<string>(
    'ai-trajectory-engine'
  );

  useEffect(() => {
    setAiCareerPredictions(null);
  }, [resumeKey, jobKey, activeCustomSkills]);

  const defaultCareerPredictions: CareerPathPrediction[] = (() => {
    const lowerSkills = uniqueResumeSkills.join(' ').toLowerCase();
    const lowerRole = currentJob.title.toLowerCase();
    const primarySkill = uniqueResumeSkills[0] || 'JavaScript';
    const secondarySkill = uniqueResumeSkills[1] || 'React';
    const primaryGap = missing[0] || 'Kubernetes';
    const secondaryGap = missing[1] || 'AWS Cloud';

    if (lowerRole.includes('data') || lowerRole.includes('python') || lowerSkills.includes('pandas')) {
      return [
        {
          id: 'path_1',
          futureJobTitle: 'Senior Machine Learning & Data Platform Engineer',
          horizon: '6–12 Months (Next Step)',
          readinessScore: Math.min(94, Math.max(68, matchPercent + 8)),
          salaryBand: '$145k – $180k / yr',
          trajectoryRationale: `Builds directly on ${currentResume.candidate}'s verified ${uniqueResumeSkills.slice(0, 3).join(', ')} foundation while transitioning from analytics into production ML pipelines.`,
          skillsToBridge: [primaryGap, 'MLOps Pipelines', 'Feature Stores'],
          milestoneAction: `Deploy an end-to-end model serving API using ${primarySkill} and ${primaryGap} with automated drift monitoring.`,
        },
        {
          id: 'path_2',
          futureJobTitle: 'AI Systems & LLM Solutions Architect',
          horizon: '12–24 Months (Growth Track)',
          readinessScore: Math.min(89, Math.max(58, matchPercent - 2)),
          salaryBand: '$170k – $215k / yr',
          trajectoryRationale: `Combines your data modeling strengths with RAG orchestration, vector databases, and enterprise AI evaluation frameworks.`,
          skillsToBridge: [secondaryGap, 'Vector Databases', 'LLM Orchestration'],
          milestoneAction: `Integrate vector search and evaluation telemetry into an existing ${primarySkill} data workflow.`,
        },
        {
          id: 'path_3',
          futureJobTitle: 'Principal Data & Decision Intelligence Lead',
          horizon: '24–36 Months (Leadership Track)',
          readinessScore: Math.min(84, Math.max(52, matchPercent - 8)),
          salaryBand: '$195k – $245k / yr',
          trajectoryRationale: `Positions ${currentResume.candidate} to lead cross-functional data architecture, governance, and executive product analytics strategy.`,
          skillsToBridge: ['Distributed Data Mesh', 'Cloud Cost Governance', primaryGap],
          milestoneAction: `Lead a cross-team data reliability initiative that establishes SLAs across analytics and engineering.`,
        },
      ];
    }

    if (lowerRole.includes('cloud') || lowerRole.includes('devops') || lowerSkills.includes('kubernetes')) {
      return [
        {
          id: 'path_1',
          futureJobTitle: 'Staff Site Reliability & Cloud Platform Architect',
          horizon: '6–12 Months (Next Step)',
          readinessScore: Math.min(95, Math.max(70, matchPercent + 7)),
          salaryBand: '$160k – $195k / yr',
          trajectoryRationale: `Extends ${currentResume.candidate}'s ${uniqueResumeSkills.slice(0, 3).join(', ')} capabilities into multi-region high-availability infrastructure and automated SLO governance.`,
          skillsToBridge: [primaryGap, 'Terraform IaC', 'Multi-Region Failover'],
          milestoneAction: `Automate zero-downtime canary deployments and error-budget alerts using ${primaryGap}.`,
        },
        {
          id: 'path_2',
          futureJobTitle: 'Principal Internal Developer Platform (IDP) Lead',
          horizon: '12–24 Months (Growth Track)',
          readinessScore: Math.min(88, Math.max(60, matchPercent - 3)),
          salaryBand: '$180k – $225k / yr',
          trajectoryRationale: `Combines your infrastructure automation and ${primarySkill} scripting to build self-service golden paths for product engineering teams.`,
          skillsToBridge: [secondaryGap, 'Service Mesh (Istio)', 'Developer Experience Portals'],
          milestoneAction: `Build a self-service CI/CD provisioning template that reduces service onboarding time by 50%.`,
        },
        {
          id: 'path_3',
          futureJobTitle: 'Head of Cloud Infrastructure & DevSecOps',
          horizon: '24–36 Months (Leadership Track)',
          readinessScore: Math.min(82, Math.max(54, matchPercent - 9)),
          salaryBand: '$205k – $260k / yr',
          trajectoryRationale: `Elevates your operational track record into executive ownership of cloud security posture, FinOps efficiency, and global reliability.`,
          skillsToBridge: ['Zero-Trust Security', 'Cloud FinOps', primaryGap],
          milestoneAction: `Spearhead an organization-wide security and container hardening audit across production clusters.`,
        },
      ];
    }

    if (lowerRole.includes('frontend') || lowerRole.includes('react') || lowerRole.includes('junior')) {
      return [
        {
          id: 'path_1',
          futureJobTitle: 'Senior Full-Stack Product Engineer (React & Node.js)',
          horizon: '6–12 Months (Next Step)',
          readinessScore: Math.min(95, Math.max(68, matchPercent + 9)),
          salaryBand: '$135k – $170k / yr',
          trajectoryRationale: `Naturally expands ${currentResume.candidate}'s ${uniqueResumeSkills.slice(0, 3).join(', ')} UI foundation into end-to-end API design and database ownership by closing the ${primaryGap} gap.`,
          skillsToBridge: [primaryGap, secondaryGap, 'API Schema Design'],
          milestoneAction: `Ship a full-stack feature combining ${primarySkill} with ${primaryGap} and end-to-end integration tests.`,
        },
        {
          id: 'path_2',
          futureJobTitle: 'Lead Frontend Design Systems & Performance Architect',
          horizon: '12–24 Months (Specialist Track)',
          readinessScore: Math.min(90, Math.max(62, matchPercent + 2)),
          salaryBand: '$160k – $195k / yr',
          trajectoryRationale: `Capitalizes on your component engineering strengths to own Core Web Vitals, micro-frontends, and multi-product design tokens.`,
          skillsToBridge: ['TypeScript Generics', 'Web Vitals Profiling', primaryGap],
          milestoneAction: `Architect a shared, accessible UI component library with automated visual regression testing.`,
        },
        {
          id: 'path_3',
          futureJobTitle: 'Staff Product Engineering Lead',
          horizon: '24–36 Months (Leadership Track)',
          readinessScore: Math.min(84, Math.max(55, matchPercent - 6)),
          salaryBand: '$185k – $230k / yr',
          trajectoryRationale: `Blends full-stack technical depth with product roadmap strategy, mentoring engineers, and leading cross-functional launches.`,
          skillsToBridge: ['System Architecture', primaryGap, secondaryGap],
          milestoneAction: `Lead the technical RFC and cross-team delivery for a high-visibility customer-facing product module.`,
        },
      ];
    }

    return [
      {
        id: 'path_1',
        futureJobTitle: 'Staff Full-Stack & Distributed Systems Architect',
        horizon: '6–12 Months (Next Step)',
        readinessScore: Math.min(96, Math.max(72, matchPercent + 8)),
        salaryBand: '$165k – $205k / yr',
        trajectoryRationale: `Directly leverages ${currentResume.candidate}'s verified ${uniqueResumeSkills.slice(0, 4).join(', ')} stack while closing the ${primaryGap} gap to own multi-service system architecture.`,
        skillsToBridge: [primaryGap, secondaryGap, 'Event-Driven Microservices'],
        milestoneAction: `Integrate ${primaryGap} and distributed caching into your ${primarySkill}/${secondarySkill} portfolio to demonstrate high-scale readiness.`,
      },
      {
        id: 'path_2',
        futureJobTitle: 'AI-Native Full-Stack Solutions Lead',
        horizon: '12–24 Months (High-Growth Track)',
        readinessScore: Math.min(91, Math.max(64, matchPercent + 1)),
        salaryBand: '$175k – $220k / yr',
        trajectoryRationale: `Combines your production ${primarySkill} and ${secondarySkill} engineering skills with LLM API orchestration, streaming telemetry, and intelligent automation.`,
        skillsToBridge: ['LLM API Integration', primaryGap, 'Streaming WebSockets'],
        milestoneAction: `Build and deploy an AI-augmented workflow module with structured JSON schemas and sub-second latency.`,
      },
      {
        id: 'path_3',
        futureJobTitle: 'Principal Engineering Manager / Technical Director',
        horizon: '24–36 Months (Executive Track)',
        readinessScore: Math.min(85, Math.max(56, matchPercent - 5)),
        salaryBand: '$195k – $250k / yr',
        trajectoryRationale: `Positions ${currentResume.candidate} to transition from hands-on full-stack architecture into leading multi-squad engineering execution and cloud governance.`,
        skillsToBridge: [primaryGap, 'System Design Governance', 'Engineering KPIs & SLOs'],
        milestoneAction: `Establish architectural RFC standards, automated CI/CD quality gates, and mentorship tracks across teams.`,
      },
    ];
  })();

  const handlePredictCareerPathsWithAi = async () => {
    setIsPredictingPaths(true);
    try {
      const res = await fetch('/api/v1/career/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: currentResume.candidate,
          currentRole: currentJob.title,
          matchPercentage: matchPercent,
          skillsDetected: uniqueResumeSkills,
          missingSkills: missing,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.predictions) && data.predictions.length >= 3) {
        setAiCareerPredictions(data.predictions);
        setCareerPredictorSource(data.source || 'gemini-3.8-flash');
      }
    } catch {
      // Fallback to instant trajectory predictions
    } finally {
      setIsPredictingPaths(false);
    }
  };

  const activeCareerPredictions = aiCareerPredictions || defaultCareerPredictions;

  // ---------------------------------------------------------------------------
  // MARKET SALARY INSIGHTS & DISTRIBUTION ENGINE (Resume Skills + Industry Trends)
  // ---------------------------------------------------------------------------
  const [salaryRegion, setSalaryRegion] = useState<'us_national' | 'tier1_hub' | 'india_tech'>(
    'us_national'
  );

  // Per-skill market valuation premiums (in USD $k / yr equivalent)
  const SKILL_MARKET_PREMIUMS: Record<string, { usdBonusK: number; demandTag: string }> = {
    'Machine Learning': { usdBonusK: 18, demandTag: '+24% YoY AI Surge' },
    AWS: { usdBonusK: 15, demandTag: '+19% Cloud Infra' },
    Kubernetes: { usdBonusK: 16, demandTag: '+21% Platform Eng' },
    Docker: { usdBonusK: 11, demandTag: '+14% DevOps Core' },
    TypeScript: { usdBonusK: 12, demandTag: '+18% Enterprise Web' },
    React: { usdBonusK: 12, demandTag: '+16% Frontend Lead' },
    'Node.js': { usdBonusK: 13, demandTag: '+15% Distributed API' },
    Python: { usdBonusK: 14, demandTag: '+20% AI & Data Stack' },
    MongoDB: { usdBonusK: 10, demandTag: '+13% NoSQL Scale' },
    SQL: { usdBonusK: 9, demandTag: '+12% Data Modeling' },
    PostgreSQL: { usdBonusK: 11, demandTag: '+14% Relational DB' },
    GraphQL: { usdBonusK: 11, demandTag: '+13% API Federation' },
    'Next.js': { usdBonusK: 12, demandTag: '+17% SSR Architecture' },
    'REST API': { usdBonusK: 8, demandTag: '+11% Core Backend' },
    Pandas: { usdBonusK: 10, demandTag: '+15% Analytics' },
    PowerBI: { usdBonusK: 8, demandTag: '+10% BI Reporting' },
    JavaScript: { usdBonusK: 9, demandTag: '+12% Full-Stack Base' },
    HTML: { usdBonusK: 4, demandTag: 'Baseline Web' },
    CSS: { usdBonusK: 5, demandTag: 'UI Styling' },
  };

  const salaryInsights = (() => {
    const lowerTitle = currentJob.title.toLowerCase();
    let roleBaseUsdK = 98;
    if (lowerTitle.includes('senior') || lowerTitle.includes('architect') || lowerTitle.includes('cloud')) {
      roleBaseUsdK = 118;
    } else if (lowerTitle.includes('junior') || lowerTitle.includes('intern')) {
      roleBaseUsdK = 72;
    } else if (lowerTitle.includes('data') || lowerTitle.includes('python')) {
      roleBaseUsdK = 104;
    }

    // Sum verified skill bonuses from the candidate's uploaded/selected resume
    const rawSkillBonusK = uniqueResumeSkills.reduce((acc, sk) => {
      const entry = SKILL_MARKET_PREMIUMS[sk];
      return acc + (entry ? entry.usdBonusK : 6);
    }, 0);

    // Apply diminishing returns so total stays realistic
    const effectiveSkillBonusK = Math.round(Math.min(76, rawSkillBonusK * 0.62));
    const matchMultiplier = 0.88 + (matchPercent / 100) * 0.24;

    const regionalMultiplier =
      salaryRegion === 'tier1_hub' ? 1.18 : salaryRegion === 'india_tech' ? 0.26 : 1.0;

    const expectedMedianK = Math.round(
      (roleBaseUsdK + effectiveSkillBonusK) * matchMultiplier * regionalMultiplier
    );
    const p10K = Math.round(expectedMedianK * 0.74);
    const p25K = Math.round(expectedMedianK * 0.86);
    const p75K = Math.round(expectedMedianK * 1.14);
    const p90K = Math.round(expectedMedianK * 1.29);

    // Potential upside if missing skills are bridged
    const missingUpsideRawK = missing.slice(0, 3).reduce((acc, sk) => {
      const entry = SKILL_MARKET_PREMIUMS[sk];
      return acc + (entry ? entry.usdBonusK * 0.55 : 5);
    }, 0);
    const potentialUpsideK = Math.max(
      4,
      Math.round(missingUpsideRawK * regionalMultiplier)
    );

    const formatComp = (valK: number) => {
      if (salaryRegion === 'india_tech') {
        return `₹${valK} LPA`;
      }
      return `$${valK}k`;
    };

    // Build 7-bucket bell-curve market salary distribution for the chart
    // Candidate's bucket is highlighted based on their matchPercent & verified skill count
    const candidateBucketIndex =
      matchPercent >= 85 ? 4 : matchPercent >= 65 ? 3 : matchPercent >= 45 ? 2 : 1;

    const buckets = [
      {
        band: formatComp(Math.round(expectedMedianK * 0.7)),
        percentile: '10th %ile (Entry)',
        marketShare: 9,
        benchmarkDensity: 11,
        salaryValue: Math.round(expectedMedianK * 0.7),
        isCandidateBand: (candidateBucketIndex as number) === 0,
        isUpsideBand: false,
      },
      {
        band: formatComp(p10K),
        percentile: '20th %ile',
        marketShare: 16,
        benchmarkDensity: 18,
        salaryValue: p10K,
        isCandidateBand: candidateBucketIndex === 1,
        isUpsideBand: false,
      },
      {
        band: formatComp(p25K),
        percentile: '25th %ile (Lower Mid)',
        marketShare: 24,
        benchmarkDensity: 25,
        salaryValue: p25K,
        isCandidateBand: candidateBucketIndex === 2,
        isUpsideBand: candidateBucketIndex === 1,
      },
      {
        band: formatComp(expectedMedianK),
        percentile: '50th %ile (Market Median)',
        marketShare: 34,
        benchmarkDensity: 34,
        salaryValue: expectedMedianK,
        isCandidateBand: candidateBucketIndex === 3,
        isUpsideBand: candidateBucketIndex === 2,
      },
      {
        band: formatComp(p75K),
        percentile: '75th %ile (Strong Match)',
        marketShare: 26,
        benchmarkDensity: 24,
        salaryValue: p75K,
        isCandidateBand: candidateBucketIndex === 4,
        isUpsideBand: candidateBucketIndex === 3,
      },
      {
        band: formatComp(p90K),
        percentile: '90th %ile (Top Tier)',
        marketShare: 14,
        benchmarkDensity: 13,
        salaryValue: p90K,
        isCandidateBand: false,
        isUpsideBand: candidateBucketIndex === 4,
      },
      {
        band: formatComp(Math.round(expectedMedianK * 1.4)),
        percentile: '95th+ %ile (Principal)',
        marketShare: 7,
        benchmarkDensity: 6,
        salaryValue: Math.round(expectedMedianK * 1.4),
        isCandidateBand: false,
        isUpsideBand: false,
      },
    ];

    const topValueSkills = uniqueResumeSkills
      .map((sk) => ({
        skill: sk,
        bonusFormatted:
          salaryRegion === 'india_tech'
            ? `+₹${Math.max(2, Math.round((SKILL_MARKET_PREMIUMS[sk]?.usdBonusK || 6) * 0.26))} LPA`
            : `+$${SKILL_MARKET_PREMIUMS[sk]?.usdBonusK || 6}k/yr`,
        demandTag: SKILL_MARKET_PREMIUMS[sk]?.demandTag || '+10% Market Demand',
        weight: SKILL_MARKET_PREMIUMS[sk]?.usdBonusK || 6,
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);

    return {
      expectedRangeText: `${formatComp(p25K)} – ${formatComp(p75K)} / yr`,
      medianText: `${formatComp(expectedMedianK)} / yr`,
      p10Text: formatComp(p10K),
      p90Text: formatComp(p90K),
      upsideText:
        salaryRegion === 'india_tech'
          ? `+₹${potentialUpsideK} LPA`
          : `+$${potentialUpsideK}k / yr`,
      candidatePercentileLabel:
        buckets[candidateBucketIndex]?.percentile || '50th %ile (Market Median)',
      candidateBandLabel: buckets[candidateBucketIndex]?.band || formatComp(expectedMedianK),
      buckets,
      topValueSkills,
    };
  })();

  // Build dynamic AI Suggestions
  const suggestions =
    missing.length === 0
      ? [
          {
            title: 'Tailor Portfolio Projects',
            icon: 'folder_special',
            badge: 'Optimization',
            badgeClass: 'bg-surface-container-high text-primary',
            desc: `Since all required skills are verified, emphasize real-world architectures in ${matched
              .slice(0, 3)
              .join(', ')} directly in summary bullets.`,
            addSkills: [] as string[],
          },
          {
            title: 'Include Production Metrics',
            icon: 'query_stats',
            badge: 'High Impact',
            badgeClass: 'bg-emerald-100 text-tertiary',
            desc: `Elevate ATS weighting by incorporating quantitative metrics (e.g. 'reduced latency by 35% using ${
              matched[0] || 'tech'
            }').`,
            addSkills: [] as string[],
          },
          {
            title: 'Prepare for Behavioral Screens',
            icon: 'record_voice_over',
            badge: 'Interview Prep',
            badgeClass: 'bg-surface-container-high text-secondary',
            desc: `Focus on leadership and cross-functional team execution for ${currentJob.title} interviews.`,
            addSkills: [] as string[],
          },
        ]
      : [
          {
            title: `Add ${missing.slice(0, 2).join(' & ')} Credentials`,
            icon: 'school',
            badge: 'Priority Action',
            badgeClass: 'bg-error-container text-error',
            desc: `Incorporate demonstrated projects or certifications showcasing ${missing
              .slice(0, 2)
              .join(' and ')} to directly close the largest ATS qualification gaps.`,
            addSkills: missing.slice(0, 2),
          },
          missing.length > 2
            ? {
                title: `Surface Secondary Skills (${missing.slice(2, 4).join(', ')})`,
                icon: 'code_blocks',
                badge: 'Keyword Rebalancing',
                badgeClass: 'bg-amber-100 text-amber-800',
                desc: `Integrate mentions of ${missing
                  .slice(2, 4)
                  .join(', ')} into your prior work experience descriptions or GitHub repo links.`,
                addSkills: missing.slice(2, 4),
              }
            : {
                title: 'Synthesize Cross-Stack Synergy',
                icon: 'integration_instructions',
                badge: 'Bridge Gap',
                badgeClass: 'bg-secondary-container text-on-secondary-container',
                desc: `Bridge your known proficiency in ${
                  matched.slice(0, 2).join(' & ') || 'core skills'
                } to demonstrate rapid ramp-up in ${missing[0]}.`,
                addSkills: [missing[0]],
              },
          {
            title: 'Re-target ATS Vocabulary',
            icon: 'manage_search',
            badge: 'ATS Strategy',
            badgeClass: 'bg-surface-container-high text-primary',
            desc: `Ensure exact phrasing from the requisition (${missing[0]}) appears at least 2-3 times across your bullet points and technical skills section.`,
            addSkills: [missing[0]],
          },
        ];

  return (
    <div className="max-w-[1240px] w-full mx-auto pb-space-2xl">
      {/* Top Action & Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-xl">
        <div>
          <div className="flex items-center gap-space-2xs text-secondary mb-space-2xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Analytics Engine
            </span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-xs font-semibold text-primary">Compatibility Diagnostics</span>
          </div>
          <h1 className="text-2xl sm:text-[28px] text-on-surface font-extrabold tracking-tight">
            Resume vs Job Matching
          </h1>
          <p className="text-sm text-on-surface-variant mt-space-2xs">
            Comparing extracted technical profile against target job requisition:{' '}
            <span className="font-semibold text-on-surface">{currentJob.title}</span>
          </p>
        </div>

        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              setIsSpinning(true);
              setAppliedAdjustments([]);
              setTimeout(() => setIsSpinning(false), 400);
            }}
            className="flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-lowest text-secondary hover:text-on-surface shadow-sm rounded-lg text-sm font-medium transition-all active:scale-95 cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                isSpinning ? 'animate-spin' : ''
              }`}
            >
              cached
            </span>
            <span>Re-evaluate</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setExportBanner(
                `Compatibility Audit exported for ${currentResume.candidate} (${matchPercent}% Match against ${currentJob.reqId}).`
              );
              setTimeout(() => setExportBanner(null), 3500);
            }}
            className="flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-lowest text-secondary hover:text-on-surface shadow-sm rounded-lg text-sm font-medium transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span>Export Audit</span>
          </button>
        </div>
      </div>

      {exportBanner && (
        <div className="mb-space-md px-space-md py-space-xs rounded-xl bg-tertiary-fixed/40 border border-tertiary/30 text-on-tertiary-fixed text-xs font-semibold flex items-center justify-between">
          <span>{exportBanner}</span>
          <span className="font-mono">200 OK</span>
        </div>
      )}

      {/* Dynamic Control Panel: Interactive Profile & Job Configurator */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg mb-space-xl border border-outline-variant/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-space-md border-b border-surface-variant gap-space-sm mb-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[22px]">tune</span>
            <h3 className="text-base font-bold text-on-surface">
              Dynamic Analysis Control Center
            </h3>
            <span className="px-space-xs py-0.5 rounded-full bg-tertiary-fixed/40 text-tertiary text-xs font-semibold">
              Live Reactive Mode
            </span>
          </div>
          <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Instant recalculation enabled
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg mb-space-md">
          {/* Resume Source Selector */}
          <div className="flex flex-col gap-space-2xs">
            <label
              className="text-xs font-semibold text-secondary flex items-center justify-between"
              htmlFor="resumeSelect"
            >
              <span>Select Candidate Resume:</span>
              <span className="font-normal text-on-surface-variant">
                {currentResume.candidate}
              </span>
            </label>
            <div className="relative">
              <select
                id="resumeSelect"
                value={resumeKey}
                onChange={(e) => {
                  setResumeKey(e.target.value);
                  setAppliedAdjustments([]);
                }}
                className="w-full bg-surface text-on-surface text-sm border border-outline-variant rounded-lg px-space-md py-2.5 focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="active_user">
                  {activeUser.name} — Active Session (JS, React, Node.js, MongoDB, HTML, CSS)
                </option>
                <option value="mid_fsd">
                  Mid-level Full Stack (Python, JS, MongoDB, HTML, CSS)
                </option>
                <option value="poor_junior">Poor Resume (HTML, CSS only)</option>
                <option value="frontend_dev">
                  Frontend React Developer (React, JavaScript, TypeScript, CSS, HTML, REST API)
                </option>
                <option value="senior_architect">
                  Senior Architect (JS, Node.js, MongoDB, React, HTML, CSS, REST API, Docker, AWS)
                </option>
                <option value="data_analyst">
                  Python Data Analyst (Python, SQL, Pandas, Machine Learning, PowerBI)
                </option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-secondary pointer-events-none text-[20px]">
                arrow_drop_down
              </span>
            </div>
          </div>

          {/* Job Requisition Selector */}
          <div className="flex flex-col gap-space-2xs">
            <label
              className="text-xs font-semibold text-secondary flex items-center justify-between"
              htmlFor="jobRoleSelect"
            >
              <span>Select Target Job Template:</span>
              <span className="font-normal text-on-surface-variant font-mono">
                {currentJob.reqId}
              </span>
            </label>
            <div className="relative">
              <select
                id="jobRoleSelect"
                value={jobKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setJobKey(val);
                  if (val !== 'custom' && JOB_DATA[val]) {
                    setActiveCustomSkills(null);
                    setCustomJobText(JOB_DATA[val].description);
                  }
                }}
                className="w-full bg-surface text-on-surface text-sm border border-outline-variant rounded-lg px-space-md py-2.5 focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="senior_fullstack">
                  Senior Full Stack Engineer (REQ-2026-FSD)
                </option>
                <option value="junior_web">Junior Web Intern (REQ-2026-INT)</option>
                <option value="frontend_react">Frontend React Developer (REQ-2026-FRT)</option>
                <option value="python_analyst">Python Data Analyst (REQ-2026-DAT)</option>
                <option value="cloud_devops">Cloud DevOps Architect (REQ-2026-OPS)</option>
                <option value="custom">-- Custom Job Description (Enter below) --</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-secondary pointer-events-none text-[20px]">
                arrow_drop_down
              </span>
            </div>
          </div>
        </div>

        {/* Custom Job Description Area */}
        <div className="pt-space-xs">
          <div className="flex items-center justify-between mb-space-2xs">
            <label
              className="text-xs font-semibold text-on-surface flex items-center gap-1.5"
              htmlFor="customJobText"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
              Analyze Custom Job Description / Requisition Text
            </label>
            <button
              type="button"
              onClick={() => {
                const sample =
                  'Senior Cloud Architect needed. Must have strong hands-on experience in AWS, Kubernetes, Docker, Node.js, REST API, Python, and Microservices architecture.';
                setCustomJobText(sample);
                handleAnalyzeCustomText(sample);
              }}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Load sample JD text
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-space-sm items-stretch">
            <textarea
              id="customJobText"
              rows={2}
              value={customJobText}
              onChange={(e) => setCustomJobText(e.target.value)}
              placeholder="Paste custom job description or list skills separated by commas (e.g., Required: React, TypeScript, Node.js, GraphQL, PostgreSQL)..."
              className="w-full bg-surface border border-outline-variant rounded-lg px-space-md py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            />
            <button
              type="button"
              onClick={() => handleAnalyzeCustomText()}
              className="shrink-0 flex items-center justify-center gap-space-xs px-space-lg py-2.5 bg-primary-container text-on-primary hover:bg-primary font-semibold text-sm rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Re-calculate Match %</span>
            </button>
          </div>
        </div>
      </div>

      {/* Skill Matrices Comparison: Side-by-Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg mb-space-xl">
        {/* Left Panel: Your Resume Skills */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-space-md">
            <div className="flex items-center gap-space-xs">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">person_pin</span>
              </div>
              <div>
                <h2 className="text-base text-on-surface font-bold">Your Resume Skills</h2>
                <span className="text-xs text-on-surface-variant">
                  Parsed from profile source ({uniqueResumeSkills.length} discovered)
                </span>
              </div>
            </div>
            <span className="px-space-xs py-space-2xs bg-surface-container text-secondary text-xs rounded-md font-mono">
              {currentResume.file}
            </span>
          </div>

          <div className="p-space-md bg-surface rounded-lg min-h-[148px] flex flex-wrap content-start gap-space-xs">
            {uniqueResumeSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-space-2xs px-space-sm py-1 bg-surface-container-low text-primary text-sm font-medium rounded-full shadow-sm hover:bg-surface-container-high transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-space-md flex items-center justify-between text-xs text-on-surface-variant">
            <span className="flex items-center gap-space-2xs">
              <span className="material-symbols-outlined text-[16px] text-tertiary">
                check_circle
              </span>
              <span>High confidence semantic extraction</span>
            </span>
            <span className="font-mono text-xs text-secondary">{currentResume.verified}</span>
          </div>
        </div>

        {/* Right Panel: Job Required Skills */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-space-md">
            <div className="flex items-center gap-space-xs">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[20px]">
                  assignment_turned_in
                </span>
              </div>
              <div>
                <h2 className="text-base text-on-surface font-bold">Job Required Skills</h2>
                <span className="text-xs text-on-surface-variant">
                  Target role specifications ({currentJob.skills.length} required)
                </span>
              </div>
            </div>
            <span className="px-space-xs py-space-2xs bg-surface-container text-secondary text-xs rounded-md font-mono">
              {currentJob.reqId}
            </span>
          </div>

          <div className="p-space-md bg-surface rounded-lg min-h-[148px] flex flex-wrap content-start gap-space-xs">
            {currentJob.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-space-2xs px-space-sm py-1 bg-surface-container-low text-primary text-sm font-medium rounded-full shadow-sm hover:bg-surface-container-high transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-space-md flex items-center justify-between text-xs text-on-surface-variant">
            <span className="flex items-center gap-space-2xs">
              <span className="material-symbols-outlined text-[16px] text-secondary">info</span>
              <span>Core stack weighting prioritized</span>
            </span>
            <span className="font-mono text-xs text-secondary">
              {currentJob.skills.length} criteria flagged
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Results Box */}
      <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg lg:p-space-xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-space-lg mb-space-lg bg-surface-container-lowest border-b border-surface-variant/40">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-primary">
              Synthesis Overview
            </span>
            <h2 className="text-xl text-on-surface font-bold">Matching Diagnostics Breakdown</h2>
          </div>
          <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 bg-surface rounded-full text-secondary text-xs font-semibold border border-outline-variant/30">
            <span
              className={`w-2 h-2 rounded-full ${
                matchPercent >= 75
                  ? 'bg-tertiary'
                  : matchPercent >= 45
                  ? 'bg-amber-500'
                  : 'bg-error'
              }`}
            ></span>
            <span>
              ATS Pass Projection:{' '}
              {matchPercent >= 75 ? 'High' : matchPercent >= 45 ? 'Moderate' : 'Low Risk'}
            </span>
          </div>
        </div>

        {/* 3-Column Diagnostic Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-lg items-center">
          {/* Column 1: Match Score Circular Gauge */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-space-lg bg-surface rounded-xl text-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  className="text-surface-container-high"
                  cx="60"
                  cy="60"
                  fill="none"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="9"
                ></circle>
                <circle
                  className={`${
                    matchPercent >= 75
                      ? 'text-tertiary'
                      : matchPercent >= 45
                      ? 'text-tertiary-container'
                      : 'text-amber-500'
                  } transition-all duration-700 ease-out`}
                  cx="60"
                  cy="60"
                  fill="none"
                  r="48"
                  stroke="currentColor"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  strokeWidth="9"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-on-surface leading-none font-mono tabular-nums">
                  {matchPercent}%
                </span>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                  Job Match
                </span>
              </div>
            </div>
            <p className="text-sm font-semibold text-on-surface mt-space-sm">
              Job Match Percentage
            </p>
            <p className="text-xs text-on-surface-variant max-w-[220px]">
              {matchCount} out of {totalRequired} core specifications matched from submitted resume.
            </p>
          </div>

          {/* Column 2: Matched Skills List */}
          <div className="md:col-span-4 flex flex-col justify-between h-full p-space-lg bg-surface-container-low/60 rounded-xl">
            <div>
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </span>
                  <h3 className="text-base font-bold text-on-surface">Matched Skills</h3>
                </div>
                <span className="px-space-xs py-0.5 bg-surface-container-high rounded text-xs font-semibold text-tertiary">
                  {matched.length} Present
                </span>
              </div>

              <ul className="flex flex-col gap-space-sm max-h-[260px] overflow-y-auto pr-1">
                {matched.length === 0 ? (
                  <li className="p-space-sm rounded-lg bg-surface-container text-xs text-secondary text-center">
                    No matching skills detected for this requisition.
                  </li>
                ) : (
                  matched.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-space-sm p-space-xs rounded-lg bg-surface-container-lowest shadow-sm"
                    >
                      <span className="material-symbols-outlined text-tertiary text-[20px]">
                        check_circle
                      </span>
                      <span className="text-sm font-semibold text-on-surface">{item}</span>
                      <span className="ml-auto text-xs text-on-surface-variant font-mono">
                        100%
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="pt-space-md mt-space-md border-t border-surface-container-high/40">
              <span className="text-xs text-tertiary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>
                  {matched.length >= 4
                    ? 'Strong technical alignment identified'
                    : `Baseline fundamentals captured (${matched.length} matched)`}
                </span>
              </span>
            </div>
          </div>

          {/* Column 3: Missing Skills List */}
          <div className="md:col-span-4 flex flex-col justify-between h-full p-space-lg bg-error-container/30 rounded-xl">
            <div>
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <span className="w-6 h-6 rounded-full bg-error text-on-error flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </span>
                  <h3 className="text-base font-bold text-on-surface">Missing Skills</h3>
                </div>
                <span className="px-space-xs py-0.5 bg-error-container rounded text-xs font-semibold text-error">
                  {missing.length} Deficits
                </span>
              </div>

              <ul className="flex flex-col gap-space-sm max-h-[220px] overflow-y-auto pr-1">
                {missing.length === 0 ? (
                  <li className="p-space-sm rounded-lg bg-emerald-50 text-xs text-tertiary text-center font-medium">
                    All specified criteria met! No missing skills identified.
                  </li>
                ) : (
                  missing.map((item, idx) => {
                    const priority = idx === 0 ? 'Critical' : idx === 1 ? 'High' : 'Standard';
                    return (
                      <li
                        key={item}
                        className="flex items-center gap-space-sm p-space-xs rounded-lg bg-surface-container-lowest shadow-sm"
                      >
                        <span className="material-symbols-outlined text-error text-[20px]">
                          cancel
                        </span>
                        <span className="text-sm font-semibold text-on-surface">{item}</span>
                        <span className="ml-auto text-xs text-error bg-error-container/60 px-space-2xs rounded">
                          {priority}
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>

              <div className="mt-space-md p-space-sm rounded-lg bg-surface-container-lowest shadow-sm">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {missing.length > 0 ? (
                    <>
                      <strong className="text-on-surface">Impact:</strong> Adding verified project experience for{' '}
                      {missing.slice(0, 2).join(' and ')} can increase score to{' '}
                      <strong className="text-tertiary">
                        {Math.min(
                          100,
                          matchPercent + Math.round((missing.length / totalRequired) * 100 * 0.7)
                        )}
                        %
                      </strong>
                      .
                    </>
                  ) : (
                    <>
                      <strong className="text-on-surface">Perfect Match:</strong> Profile covers 100% of the target job keywords with optimum ATS ranking index.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-space-md mt-space-md border-t border-error-container/40">
              <span
                className={`text-xs flex items-center gap-1 ${
                  missing.length > 0 ? 'text-error' : 'text-tertiary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {missing.length > 0 ? 'warning' : 'check_circle'}
                </span>
                <span>
                  {missing.length > 0
                    ? 'May trigger automated ATS screenouts'
                    : 'Candidate passes ATS filters smoothly'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic AI Suggestions Section */}
        <div className="mt-space-xl pt-space-lg border-t border-surface-variant">
          <div className="flex items-center justify-between mb-space-md">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[24px]">
                psychology_alt
              </span>
              <h3 className="text-base font-bold text-on-surface">
                Dynamic AI Improvement Suggestions
              </h3>
            </div>
            <span className="text-xs font-semibold text-primary">Targeted for current gaps</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {suggestions.map((item, idx) => (
              <div
                key={idx}
                className="p-space-md rounded-xl bg-surface border border-outline-variant/30 flex flex-col justify-between hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <div className="flex items-center gap-space-xs text-primary">
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <h4 className="text-[15px] font-bold text-on-surface">{item.title}</h4>
                    </div>
                    <span
                      className={`px-space-2xs py-0.5 rounded text-[11px] font-semibold ${item.badgeClass}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-space-sm mt-space-sm flex items-center justify-between text-xs text-primary font-medium border-t border-surface-container-high/40">
                  <button
                    type="button"
                    onClick={() =>
                      item.addSkills.length > 0 && handleApplySkillSuggestion(item.addSkills)
                    }
                    className="hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>
                      {item.addSkills.length > 0
                        ? `Apply ${item.addSkills.join(' + ')} to resume`
                        : 'Applied to resume'}
                    </span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Salary Insights Module (Expected Compensation Ranges & Salary Distribution Chart) */}
      <div className="mt-space-xl bg-surface-container-lowest rounded-xl shadow-md p-space-lg lg:p-space-xl border border-outline-variant/30 flex flex-col gap-space-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm pb-space-md border-b border-outline-variant/25">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-on-surface">
                  Market Salary Insights &amp; Distribution
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-tertiary-fixed/40 text-tertiary">
                  2026 Industry Compensation Benchmark
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                Expected compensation range for{' '}
                <strong className="text-on-surface">{currentResume.candidate}</strong> targeting{' '}
                <strong className="text-primary">{currentJob.title}</strong> based on{' '}
                {uniqueResumeSkills.length} verified resume skills and current market trends.
              </p>
            </div>
          </div>

          {/* Market Region Benchmark Selector */}
          <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-lg border border-outline-variant/30 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setSalaryRegion('us_national')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                salaryRegion === 'us_national'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              US National (USD)
            </button>
            <button
              type="button"
              onClick={() => setSalaryRegion('tier1_hub')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                salaryRegion === 'tier1_hub'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              SF / NYC Tech Hub
            </button>
            <button
              type="button"
              onClick={() => setSalaryRegion('india_tech')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                salaryRegion === 'india_tech'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              India Tech Hub (INR)
            </button>
          </div>
        </div>

        {/* Top KPI Compensation Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/25 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-secondary">
              Expected Compensation Range (P25–P75)
            </span>
            <div className="text-2xl font-extrabold font-mono text-on-surface mt-1">
              {salaryInsights.expectedRangeText}
            </div>
            <div className="text-xs text-tertiary font-semibold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">trending_up</span>
              <span>Grounded in {uniqueResumeSkills.length} verified skills</span>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-primary-fixed/25 border border-primary/25 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
              Your Resume Market Position
            </span>
            <div className="text-2xl font-extrabold font-mono text-primary mt-1">
              {salaryInsights.candidateBandLabel} / yr
            </div>
            <div className="text-xs text-on-surface-variant mt-1 font-medium">
              Placed at <strong className="text-on-surface">{salaryInsights.candidatePercentileLabel}</strong> ({matchPercent}% role match)
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/25 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-secondary">
              Market 10th – 90th Spread
            </span>
            <div className="text-xl font-bold font-mono text-on-surface mt-1">
              {salaryInsights.p10Text} – {salaryInsights.p90Text}
            </div>
            <div className="text-xs text-secondary mt-1">
              Median Benchmark: <strong className="text-on-surface">{salaryInsights.medianText}</strong>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-tertiary-fixed/20 border border-tertiary/30 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-tertiary font-bold">
              Skill-Gap Upside Potential
            </span>
            <div className="text-2xl font-extrabold font-mono text-tertiary mt-1">
              {salaryInsights.upsideText}
            </div>
            <div className="text-xs text-on-surface-variant mt-1">
              {missing.length > 0
                ? `Unlock by adding ${missing.slice(0, 2).join(' & ')}`
                : 'Maximum skill premium unlocked!'}
            </div>
          </div>
        </div>

        {/* Interactive Salary Distribution Chart + Skill Premium Drivers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
          {/* Left 8 Cols: Recharts Salary Distribution Bell Curve & Bar Chart */}
          <div className="lg:col-span-8 p-space-md sm:p-space-lg rounded-xl bg-surface border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-space-md">
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  Industry Salary Distribution Curve ({currentJob.title})
                </h3>
                <p className="text-xs text-secondary">
                  Visualizing candidate density (%) across compensation brackets. Your estimated bracket is highlighted in{' '}
                  <strong className="text-primary">Indigo</strong>; upside bracket in{' '}
                  <strong className="text-tertiary">Emerald</strong>.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#3525cd] inline-block"></span>
                  Your Bracket
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#006e4b] inline-block"></span>
                  Gap-Bridged Target
                </span>
              </div>
            </div>

            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={salaryInsights.buckets}
                  margin={{ top: 12, right: 16, left: -12, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="salaryCurveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3525cd" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#3525cd" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="band"
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    unit="%"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: unknown, name?: unknown) => [
                      `${value}% of market offers`,
                      name === 'marketShare' ? 'Offer Distribution' : 'Industry Curve',
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      if (!item) return String(label);
                      return `${label}/yr · ${item.percentile}${
                        item.isCandidateBand
                          ? ' (Your Current Resume Bracket)'
                          : item.isUpsideBand
                          ? ' (Target After Closing Skill Gaps)'
                          : ''
                      }`;
                    }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '10px',
                      fontSize: '12px',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="benchmarkDensity"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#salaryCurveGrad)"
                  />
                  <Bar dataKey="marketShare" radius={[6, 6, 0, 0]} barSize={36}>
                    {salaryInsights.buckets.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={
                          entry.isCandidateBand
                            ? '#3525cd'
                            : entry.isUpsideBand
                            ? '#006e4b'
                            : '#94a3b8'
                        }
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 mt-2 border-t border-outline-variant/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-secondary">
              <span>
                Active Profile:{' '}
                <strong className="text-on-surface">{currentResume.candidate}</strong> (
                {currentResume.file})
              </span>
              <span className="font-mono text-[11px] text-primary">
                Recalculates live when you add skills or switch job templates above
              </span>
            </div>
          </div>

          {/* Right 4 Cols: High-Value Resume Skill Premium Breakdown */}
          <div className="lg:col-span-4 p-space-md sm:p-space-lg rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between gap-space-md">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Skill Value Drivers
                </span>
                <span className="text-[11px] font-mono text-secondary">2026 Market Impact</span>
              </div>
              <h3 className="text-base font-bold text-on-surface">
                Top Compensation Boosters in Your Resume
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5 mb-space-md">
                Verified skills from your resume contributing the highest market value premium:
              </p>

              <div className="flex flex-col gap-2.5">
                {salaryInsights.topValueSkills.map((item) => (
                  <div
                    key={item.skill}
                    className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div>
                      <div className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                        {item.skill}
                      </div>
                      <span className="text-[11px] text-secondary">{item.demandTag}</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-tertiary-fixed/35 text-tertiary font-mono text-xs font-bold shrink-0">
                      {item.bonusFormatted}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {missing.length > 0 && (
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">
                    Unlock {salaryInsights.upsideText} More
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                    High ROI Gap
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Bridging <strong className="text-on-surface">{missing.slice(0, 2).join(' & ')}</strong> shifts your offer bracket from{' '}
                  <strong className="text-primary">{salaryInsights.candidateBandLabel}</strong> into the top{' '}
                  <strong className="text-tertiary">75th–90th percentile</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => handleApplySkillSuggestion(missing.slice(0, 2))}
                  className="w-full py-1.5 px-3 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 transition-all cursor-pointer"
                >
                  + Simulate Adding {missing.slice(0, 2).join(' & ')} to See Salary Jump
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI-Powered Career Path Predictor Module (3 Future Job Titles Based on Resume Trajectory & Missing Skill Gaps) */}
      <div className="mt-space-xl bg-surface-container-lowest rounded-xl shadow-md p-space-lg lg:p-space-xl border border-outline-variant/30 flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-md border-b border-outline-variant/25">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]">conversion_path</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-on-surface">
                  AI Career Path Predictor
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-primary-fixed text-on-primary-fixed">
                  {careerPredictorSource === 'gemini-3.8-flash'
                    ? 'Gemini 3.8 Flash Live'
                    : 'Trajectory & Gap AI Engine'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                Three AI-predicted future job titles based on{' '}
                <strong className="text-on-surface">{currentResume.candidate}</strong>&apos;s current resume trajectory ({uniqueResumeSkills.length} verified skills) and{' '}
                <strong className="text-error">{missing.length} missing skill gap(s)</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePredictCareerPathsWithAi}
            disabled={isPredictingPaths}
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-semibold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-center shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isPredictingPaths ? 'sync' : 'auto_awesome'}
            </span>
            <span>
              {isPredictingPaths ? 'Predicting via Gemini AI...' : 'Recalculate AI Career Paths'}
            </span>
          </button>
        </div>

        {/* 3 Future Job Title Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
          {activeCareerPredictions.map((path, index) => (
            <div
              key={path.id}
              className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between gap-space-md hover:border-primary/50 transition-all"
            >
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-[11px] font-bold">
                    Path 0{index + 1} · {path.horizon}
                  </span>
                  <span className="text-xs font-mono font-bold text-tertiary">
                    {path.salaryBand}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-on-surface mt-1 leading-snug">
                  {path.futureJobTitle}
                </h3>

                {/* Trajectory Readiness Bar */}
                <div className="mt-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary font-medium">Trajectory Readiness</span>
                    <span className="font-mono font-bold text-primary">
                      {path.readinessScore}% Ready
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${path.readinessScore}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  {path.trajectoryRationale}
                </p>

                {/* Skill Gaps to Bridge */}
                <div className="mt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-secondary block mb-1.5">
                    Skill Gaps to Unlock Role:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {path.skillsToBridge.map((gapSkill) => (
                      <span
                        key={gapSkill}
                        className="px-2 py-0.5 rounded-md bg-surface-container-lowest border border-outline-variant/40 text-xs font-semibold text-on-surface flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                        {gapSkill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Milestone Action & One-Click Target Switch */}
              <div className="pt-space-sm border-t border-outline-variant/25 flex flex-col gap-2">
                <div className="p-2.5 rounded-lg bg-surface-container-lowest text-xs text-on-surface-variant leading-relaxed">
                  <strong className="text-primary">Next Milestone: </strong>
                  {path.milestoneAction}
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleApplySkillSuggestion(path.skillsToBridge.slice(0, 2))}
                    className="text-xs font-semibold text-tertiary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">add_task</span>
                    <span>Simulate Bridging Gaps</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const customDesc = `${path.futureJobTitle} — Required skills: ${[
                        ...uniqueResumeSkills.slice(0, 4),
                        ...path.skillsToBridge,
                      ].join(', ')}`;
                      setCustomJobText(customDesc);
                      handleAnalyzeCustomText(customDesc);
                    }}
                    className="px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Test Match →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contextual Enhancement Card: Visual Job Match Spectrum */}
      <div className="mt-space-lg p-space-lg rounded-xl bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-sm">
        <div className="flex items-center gap-space-md">
          <div className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[28px]">insights</span>
          </div>
          <div>
            <h4 className="text-base text-on-surface font-bold">Resume Alignment Trajectory</h4>
            <p className="text-xs text-on-surface-variant">
              Benchmark against 142 successful candidate profiles applying for this position.
            </p>
          </div>
        </div>
        <div className="w-full md:w-72 flex flex-col gap-1">
          <div className="flex justify-between text-xs text-secondary">
            <span>Current ({matchPercent}%)</span>
            <span className="font-semibold text-primary">Target: &gt; 75%</span>
          </div>
          <div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container rounded-full transition-all duration-500"
              style={{ width: `${matchPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
