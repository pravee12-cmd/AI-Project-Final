import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { ActiveUser, CandidateAnalysis, ScreenId } from '../types';

interface AnalysisResultScreenProps {
  activeUser: ActiveUser;
  initialCaseKey?: 'stateA' | 'stateB' | 'stateC';
  customAnalysis?: CandidateAnalysis | null;
  onUpdateActiveUser: (name: string, email: string, role?: string) => Promise<void>;
  onNavigate: (screen: ScreenId) => void;
}

const CIRCUMFERENCE = 263.89; // 2 * PI * 42

export const AnalysisResultScreen: React.FC<AnalysisResultScreenProps> = ({
  activeUser,
  initialCaseKey = 'stateC',
  customAnalysis = null,
  onUpdateActiveUser,
  onNavigate,
}) => {
  const [selectedCase, setSelectedCase] = useState<'uploaded' | 'stateA' | 'stateB' | 'stateC'>(
    customAnalysis ? 'uploaded' : initialCaseKey
  );
  const [activeTab, setActiveTab] = useState<
    | 'skills'
    | 'refinement'
    | 'xai'
    | 'education'
    | 'experience'
    | 'projects'
    | 'certifications'
    | 'copilot'
  >('skills');
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Innovative Feature 1: Interactive STAR Impact Bullet Optimizer
  const [rawBulletInput, setRawBulletInput] = useState(
    'Worked on backend APIs and frontend pages for user dashboard'
  );
  const [selectedMetricTone, setSelectedMetricTone] = useState<'latency' | 'scale' | 'revenue'>(
    'latency'
  );
  const [copiedBulletIdx, setCopiedBulletIdx] = useState<number | null>(null);

  // Innovative Feature 2: Skill-Gap Technical Interview Question & Answer Simulator
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(0);
  const [simulatedBoostSkills, setSimulatedBoostSkills] = useState<string[]>([]);

  useEffect(() => {
    if (customAnalysis) {
      setSelectedCase('uploaded');
    } else {
      setSelectedCase(initialCaseKey);
    }
    setSimulatedBoostSkills([]);
  }, [customAnalysis, initialCaseKey]);

  // Dynamic Candidate Cases that incorporate the active user's identity dynamically
  const candidateCases: Record<'stateA' | 'stateB' | 'stateC', CandidateAnalysis> = {
    stateA: {
      id: 'stateA',
      fileName: 'basic_fresher_entry_resume.pdf',
      candidateName: activeUser.name || 'Alex Rivera',
      candidateEmail: activeUser.email || 'alex.rivera@gmail.com',
      greeting: `Showing Basic Resume diagnostic for ${activeUser.name.split(' ')[0]} (Needs Revision)`,
      targetRole: 'Full Stack Software Engineer',
      score: 34,
      scoreStatus: 'Needs Improvement',
      scoreStatusColor: 'bg-error/15 text-error',
      scoreIcon: 'error',
      gaugeStrokeColor: '#ba1a1a',
      summaryText:
        'Basic / entry-level resume lacks core full-stack stack proficiencies and project depth. Major gaps in API & backend systems.',
      formatVerified: false,
      formatStatusText: 'ATS parse issues & sparse structure warnings found',
      percentileText: 'Bottom 30% of applicants',
      matchPercentage: 28,
      matchCircleColor: '#ba1a1a',
      matchedCount: 2,
      missingCount: 6,
      totalReqCount: 8,
      skillsDetected: ['HTML5', 'CSS3', 'Git Basics'],
      missingSkills: ['Node.js', 'React', 'MongoDB', 'REST APIs', 'TypeScript', 'SQL'],
      strengths: [
        'Basic foundational understanding of semantic HTML/CSS markup',
        'Includes version control and source code repository links',
        'Passes baseline length requirement (< 2 pages)',
      ],
      education: [
        {
          degree: 'B.S. in Information Technology (In Progress)',
          institution: 'State Technical Institute',
          year: '2025',
          gpa: '3.1 / 4.0',
        },
      ],
      experience: [
        {
          title: 'Web Content Intern',
          company: 'Local Retail Studio',
          duration: 'Summer 2024 (3 mos)',
          impact: 'Updated static HTML/CSS landing pages and product tables.',
        },
      ],
      projects: [
        {
          name: 'Personal Portfolio Webpage',
          stack: 'HTML5, CSS3, GitHub Pages',
          outcome: 'Responsive static layout without backend API bindings.',
        },
      ],
      certifications: [
        {
          name: 'Responsive Web Design Fundamentals',
          issuer: 'freeCodeCamp',
          year: '2024',
        },
      ],
      showCriticalWarning: true,
      criticalWarningText:
        'Critical ATS Warning: Basic resume is missing 6 required core technologies for Full Stack Software Engineer. High probability of automatic gatekeeper rejection.',
      remediationTip:
        'Adding verified projects in Node.js and React will boost your score from 34 to 68.',
      actionBtnText: 'View Urgent Fixes',
    },
    stateB: {
      id: 'stateB',
      fileName: 'mid_level_frontend_resume.docx',
      candidateName: activeUser.name || 'Divya Sharma',
      candidateEmail: activeUser.email || 'divya@gmail.com',
      greeting: `Showing Mid-Level Resume diagnostic for ${activeUser.name.split(' ')[0]} (Moderate Match)`,
      targetRole: 'Full Stack Software Engineer',
      score: 66,
      scoreStatus: 'Moderate / Fair',
      scoreStatusColor: 'bg-amber-100 text-amber-700',
      scoreIcon: 'check_circle',
      gaugeStrokeColor: '#d97706',
      summaryText:
        'Solid foundational development profile with moderate stack alignment. Ready for technical screener with minor polishing.',
      formatVerified: true,
      formatStatusText: 'Formatting integrity verified & validated',
      percentileText: 'Top 34% of candidates',
      matchPercentage: 58,
      matchCircleColor: '#4f46e5',
      matchedCount: 5,
      missingCount: 3,
      totalReqCount: 8,
      skillsDetected: ['JavaScript', 'HTML5', 'CSS3', 'SQL', 'Git', 'REST APIs'],
      missingSkills: ['React', 'Node.js', 'Docker / Cloud'],
      strengths: [
        'Good technical skill coverage in front-end and SQL fundamentals',
        'Clear academic achievements & validated degree in Computer Science',
        'Clean layout with quantified impact across coursework',
      ],
      education: [
        {
          degree: 'B.Tech in Computer Science & Engineering',
          institution: 'VIT University',
          year: '2024',
          gpa: '8.7 / 10.0',
        },
      ],
      experience: [
        {
          title: 'Junior Software Engineer',
          company: 'NovaSoft Solutions',
          duration: '2024 – Present',
          impact: 'Built interactive UI modules and optimized SQL reporting queries by 28%.',
        },
      ],
      projects: [
        {
          name: 'Campus Event Analytics Portal',
          stack: 'JavaScript, SQL, HTML/CSS',
          outcome: 'Managed registrations for 1,200+ students with automated receipts.',
        },
      ],
      certifications: [
        {
          name: 'SQL & Relational Database Engineering',
          issuer: 'Coursera / Stanford Online',
          year: '2024',
        },
      ],
      showCriticalWarning: false,
      remediationTip:
        'Adding full-stack React & Node.js backend integrations will increase your score from 66 to 85.',
      actionBtnText: 'View Skill Roadmap',
    },
    stateC: {
      id: 'stateC',
      fileName: 'senior_staff_fullstack_resume.pdf',
      candidateName: activeUser.name || 'Elena Rostova',
      candidateEmail: activeUser.email || 'elena.rostova@gmail.com',
      greeting: `Showing Senior Resume diagnostic for ${activeUser.name.split(' ')[0]} (Senior Level)`,
      targetRole: 'Full Stack Software Engineer',
      score: 93,
      scoreStatus: 'Exceptional',
      scoreStatusColor: 'bg-tertiary-fixed/30 text-tertiary',
      scoreIcon: 'verified',
      gaugeStrokeColor: '#006e4b',
      summaryText:
        'Superb alignment with target architecture. Contains quantified deliverables, robust stack, and advanced cloud proficiency.',
      formatVerified: true,
      formatStatusText: 'Formatting integrity verified (100% ATS score)',
      percentileText: 'Top 5% of candidates',
      matchPercentage: 91,
      matchCircleColor: '#3525cd',
      matchedCount: 7,
      missingCount: 1,
      totalReqCount: 8,
      skillsDetected: [
        'Python',
        'JavaScript',
        'TypeScript',
        'React',
        'Node.js',
        'MongoDB',
        'SQL',
        'Docker',
        'AWS / Cloud',
      ],
      missingSkills: ['Kubernetes Cluster Ops'],
      strengths: [
        'Extensive production full-stack engineering track record',
        'Quantified business impacts and high-throughput systems design',
        'Strong programming background with cloud and distributed DBs',
      ],
      education: [
        {
          degree: 'M.S. in Computer Science (Distributed Systems)',
          institution: 'National Institute of Technology',
          year: '2022',
          gpa: '3.94 / 4.0',
        },
      ],
      experience: [
        {
          title: 'Lead Full-Stack Architect',
          company: 'CloudScale Telemetry Inc.',
          duration: '2022 – Present',
          impact:
            'Architected React + Node.js microservices handling 45,000 req/sec with 99.98% uptime.',
        },
        {
          title: 'Full Stack Software Engineer',
          company: 'FinCore Systems',
          duration: '2020 – 2022',
          impact:
            'Reduced API p99 latency by 42% using MongoDB indexing and Docker container orchestration.',
        },
      ],
      projects: [
        {
          name: 'ResuMetric AI Telemetry Engine',
          stack: 'React, TypeScript, Node.js, Express, MongoDB, Docker',
          outcome: 'Real-time NLP parsing and cryptographic 6-digit SMS OTP verification pipeline.',
        },
      ],
      certifications: [
        {
          name: 'AWS Certified Solutions Architect – Professional',
          issuer: 'Amazon Web Services',
          year: '2025',
        },
      ],
      showCriticalWarning: false,
      remediationTip: 'Addressing Kubernetes orchestration will boost your match index to 99%.',
      actionBtnText: 'Explore Senior Roles',
    },
  };

  const baseData: CandidateAnalysis =
    selectedCase === 'uploaded' && customAnalysis
      ? customAnalysis
      : candidateCases[selectedCase === 'uploaded' ? initialCaseKey : selectedCase];

  // Dynamically compute boosted score when user simulates adding missing skills in the Career Co-Pilot
  const boostedScore = Math.min(99, baseData.score + simulatedBoostSkills.length * 6);
  const boostedMatch = Math.min(99, baseData.matchPercentage + simulatedBoostSkills.length * 9);
  const data: CandidateAnalysis = {
    ...baseData,
    score: boostedScore,
    matchPercentage: boostedMatch,
    skillsDetected: Array.from(new Set([...baseData.skillsDetected, ...simulatedBoostSkills])),
    missingSkills: baseData.missingSkills.filter((s) => !simulatedBoostSkills.includes(s)),
  };

  const scoreOffset = CIRCUMFERENCE - (data.score / 100) * CIRCUMFERENCE;
  const matchOffset = CIRCUMFERENCE - (data.matchPercentage / 100) * CIRCUMFERENCE;

  // Generate 3 high-impact STAR-formatted resume bullets from any weak user bullet
  const generateStarBullets = (rawText: string, tone: 'latency' | 'scale' | 'revenue') => {
    const clean = rawText.trim() || 'Developed web application features and API endpoints';
    const primaryTech = data.skillsDetected.slice(0, 3).join(', ') || 'React, Node.js, and SQL';
    const gapTech = baseData.missingSkills[0] || 'Docker';

    if (tone === 'latency') {
      return [
        `Architected and optimized ${clean.toLowerCase()} utilizing ${primaryTech}, reducing P99 API response latency by 41% and improving ATS keyword density.`,
        `Engineered fault-tolerant ${clean.toLowerCase()} with ${primaryTech} and ${gapTech} caching, cutting page load times from 1.8s to 420ms across 10k+ daily sessions.`,
        `Spearheaded performance refactoring for ${clean.toLowerCase()}, eliminating N+1 query bottlenecks and boosting system throughput by 2.4x.`,
      ];
    }
    if (tone === 'scale') {
      return [
        `Designed and scaled ${clean.toLowerCase()} using ${primaryTech} to support 50,000+ concurrent users with 99.95% production uptime.`,
        `Built modular, horizontally scalable ${clean.toLowerCase()} integrated with ${gapTech}, handling 1.2M daily requests with zero data loss.`,
        `Delivered end-to-end ${clean.toLowerCase()} across distributed environments, accelerating release velocity by 35% via automated CI/CD checks.`,
      ];
    }
    return [
      `Delivered customer-facing ${clean.toLowerCase()} powered by ${primaryTech}, increasing user onboarding conversion by 28% in Q1.`,
      `Automated core workflows within ${clean.toLowerCase()} using ${primaryTech} and ${gapTech}, saving 14 engineering hours per sprint.`,
      `Revamped ${clean.toLowerCase()} with responsive UI telemetry, lifting candidate engagement scores by 32% across enterprise accounts.`,
    ];
  };

  const starVariations = generateStarBullets(rawBulletInput, selectedMetricTone);

  // Generate tailored technical interview questions targeting the candidate's missing & core skills
  const interviewPrepDeck = [
    ...baseData.missingSkills.slice(0, 3).map((gapSkill) => ({
      type: 'Skill-Gap Probe',
      badgeColor: 'bg-error/15 text-error',
      skill: gapSkill,
      question: `Your resume targets ${data.targetRole}, where ${gapSkill} is a core requirement. How would you architect or integrate ${gapSkill} into a production stack alongside ${data.skillsDetected[0] || 'JavaScript'}?`,
      talkingPoint: `Frame your answer using the Bridge Method: acknowledge your strong foundation in ${data.skillsDetected.slice(0, 2).join(' & ') || 'web fundamentals'}, explain the architectural problem ${gapSkill} solves (scalability, data consistency, or deployment), and cite a concrete prototype where you applied similar patterns.`,
    })),
    ...data.skillsDetected.slice(0, 2).map((coreSkill) => ({
      type: 'Core Strength Deep-Dive',
      badgeColor: 'bg-tertiary-fixed/40 text-tertiary',
      skill: coreSkill,
      question: `You listed ${coreSkill} as a verified strength on your resume. Walk me through the hardest production bottleneck or edge case you resolved using ${coreSkill}.`,
      talkingPoint: `Structure your response with STAR: Situation (traffic spike or state bug), Task (maintain <200ms SLA), Action (specific ${coreSkill} optimization, profiling, or indexing), and Result (quantified % improvement).`,
    })),
  ];

  // Explainable AI (XAI) Weighted Rubric Breakdown (Sums to data.score out of 100)
  const xaiRubricBreakdown = (() => {
    const totalScore = data.score;
    const skillPoints = Math.min(35, Math.max(8, Math.round(totalScore * 0.35)));
    const expPoints = Math.min(25, Math.max(5, Math.round(totalScore * 0.25)));
    const projectPoints = Math.min(20, Math.max(4, Math.round(totalScore * 0.2)));
    const atsFormatPoints = Math.max(2, totalScore - (skillPoints + expPoints + projectPoints));

    return [
      {
        pillar: 'Technical Skill & Keyword Density',
        earned: skillPoints,
        max: 35,
        weightLabel: '35% Weight',
        confidence: data.skillsDetected.length >= 6 ? '98.4%' : '91.2%',
        evidence: `Matched ${data.skillsDetected.length} verified skills (${data.skillsDetected.slice(0, 5).join(', ')}) against ${data.targetRole} taxonomy.`,
        colorClass: 'bg-primary',
      },
      {
        pillar: 'Quantified Experience & Impact Depth',
        earned: expPoints,
        max: 25,
        weightLabel: '25% Weight',
        confidence: data.experience.length >= 2 ? '96.8%' : '88.5%',
        evidence: `Parsed ${data.experience.length} role entry(s) with action-verb density and measurable deliverable statements.`,
        colorClass: 'bg-tertiary',
      },
      {
        pillar: 'Architecture & Project Complexity',
        earned: projectPoints,
        max: 20,
        weightLabel: '20% Weight',
        confidence: '94.1%',
        evidence: `Evaluated ${data.projects.length} technical project(s) (${data.projects[0]?.name || 'Portfolio Project'}) for production stack integration.`,
        colorClass: 'bg-indigo-600',
      },
      {
        pillar: 'ATS Schema, Education & Formatting Integrity',
        earned: atsFormatPoints,
        max: 20,
        weightLabel: '20% Weight',
        confidence: '99.2%',
        evidence: `${data.formatStatusText} · ${data.education.length} degree(s) & ${data.certifications.length} certification(s) verified.`,
        colorClass: data.formatVerified ? 'bg-emerald-600' : 'bg-amber-600',
      },
    ];
  })();

  // Explainable AI (XAI) SHAP-Style Feature Contributions (+ Positive vs - Negative Drivers)
  const xaiShapContributions = [
    ...data.skillsDetected.slice(0, 4).map((skill, idx) => ({
      feature: `Verified Skill: ${skill}`,
      delta: `+${Math.max(4, 9 - idx)} pts`,
      numericDelta: Math.max(4, 9 - idx),
      type: 'positive' as const,
      reason: `Direct semantic match with core ${data.targetRole} requisition requirements.`,
    })),
    {
      feature: data.formatVerified ? 'ATS Single-Column Schema Verified' : 'Sparse Section Formatting Warning',
      delta: data.formatVerified ? '+8 pts' : '-9 pts',
      numericDelta: data.formatVerified ? 8 : -9,
      type: data.formatVerified ? ('positive' as const) : ('negative' as const),
      reason: data.formatVerified
        ? 'Zero parser obstructions; machine-readable headings and chronological dates.'
        : 'Missing standard section headers or sparse bullet density reduces automated parser recall.',
    },
    ...data.missingSkills.slice(0, 3).map((gap, idx) => ({
      feature: `Missing Core Skill: ${gap}`,
      delta: `-${Math.max(5, 8 - idx)} pts`,
      numericDelta: -Math.max(5, 8 - idx),
      type: 'negative' as const,
      reason: `Required by ${data.targetRole} benchmark rubric but absent from parsed resume tokens.`,
    })),
  ];

  // AI-Powered Resume Refinement Assistant: Section-by-Section Actionable Bullet Points
  interface RefinementSection {
    sectionId: string;
    sectionTitle: string;
    icon: string;
    currentDiagnosis: string;
    estimatedScoreLift: string;
    actionableBullets: string[];
  }

  const defaultRefinementSections: RefinementSection[] = (() => {
    const cleanFile = data.fileName || 'uploaded_resume.pdf';
    const primarySkill = data.skillsDetected[0] || 'JavaScript';
    const secondarySkill = data.skillsDetected[1] || 'React';
    const primaryGap = data.missingSkills[0] || 'Kubernetes';
    const secondaryGap = data.missingSkills[1] || 'CI/CD Automation';
    const expTitle = data.experience[0]?.title || data.targetRole;
    const expCompany = data.experience[0]?.company || 'Production Engineering Team';
    const projName = data.projects[0]?.name || 'Full-Stack Web Platform';
    const eduDegree = data.education[0]?.degree || 'B.Tech / B.S. in Computer Science';
    const certName = data.certifications[0]?.name || 'Cloud & Full-Stack Engineering Credential';

    return [
      {
        sectionId: 'summary',
        sectionTitle: '1. Executive Summary & ATS Branding',
        icon: 'badge',
        currentDiagnosis: `Your current summary in "${cleanFile}" scores ${data.score}/100 against ${data.targetRole} and omits explicit mention of ${primaryGap}.`,
        estimatedScoreLift: '+5 pts',
        actionableBullets: [
          `Open with a quantified headline: "Results-driven ${data.targetRole} with verified proficiency in ${data.skillsDetected.slice(0, 4).join(', ')} and a track record of delivering low-latency production systems."`,
          `Embed high-priority ATS keywords (${primaryGap} and ${secondaryGap}) directly in the first 3 lines so automated parsers rank "${cleanFile}" in the top 10% for ${data.targetRole}.`,
          `Replace generic objective statements with a 2-sentence value proposition highlighting system scale, API throughput, and cross-functional delivery.`,
        ],
      },
      {
        sectionId: 'skills',
        sectionTitle: '2. Technical Skills & Keyword Taxonomy',
        icon: 'psychology',
        currentDiagnosis: `Detected ${data.skillsDetected.length} skills (${data.skillsDetected.slice(0, 4).join(', ')}), but missing ${data.missingSkills.length} core role requirements (${data.missingSkills.join(', ') || 'None'}).`,
        estimatedScoreLift: '+8 pts',
        actionableBullets: [
          `Group your ${data.skillsDetected.length} skills into structured ATS categories: "Languages & Frameworks (${primarySkill}, ${secondarySkill})", "Databases & APIs", and "Cloud & DevOps (${primaryGap})".`,
          `Bridge the missing skill gap by adding "${primaryGap}" and "${secondaryGap}" alongside the exact tools or coursework where you applied them.`,
          `Include both canonical names and industry acronyms (e.g., "RESTful APIs (OpenAPI/JSON)", "CI/CD Pipelines (GitHub Actions / Docker)") to maximize lexical and semantic matching.`,
        ],
      },
      {
        sectionId: 'experience',
        sectionTitle: `3. Work Experience (${expTitle})`,
        icon: 'work',
        currentDiagnosis: `Evaluated "${expTitle}" at ${expCompany}; bullets need stronger STAR-format metrics (latency %, scale, or engineering hours saved).`,
        estimatedScoreLift: '+9 pts',
        actionableBullets: [
          `Rewrite your lead bullet as: "Architected and scaled ${primarySkill} & ${secondarySkill} modules at ${expCompany}, reducing P95 API response latency by 38% across 25,000+ daily requests."`,
          `Add a reliability & deployment bullet: "Automated build, test, and container deployment workflows using ${primaryGap}, cutting release rollbacks by 45%."`,
          `Quantify cross-team impact: "Collaborated with product and QA engineers to resolve critical data bottlenecks, improving sprint delivery velocity by 22%."`,
        ],
      },
      {
        sectionId: 'projects',
        sectionTitle: `4. Technical Projects (${projName})`,
        icon: 'code_blocks',
        currentDiagnosis: `Project "${projName}" lists stack tokens but lacks architectural depth, benchmark outcomes, and live verification details.`,
        estimatedScoreLift: '+6 pts',
        actionableBullets: [
          `Upgrade "${projName}" description: "Engineered an end-to-end ${data.targetRole} solution using ${data.skillsDetected.slice(0, 3).join(', ')}, supporting concurrent user sessions with 99.9% uptime."`,
          `Highlight problem-solving depth: "Implemented indexed database queries, schema validation, and ${primaryGap} integration to eliminate N+1 query bottlenecks."`,
          `Include verifiable links (GitHub repository, live demo URL, or architectural README) and state test coverage percentage (e.g., "85%+ unit/integration test coverage").`,
        ],
      },
      {
        sectionId: 'education',
        sectionTitle: '5. Education & Industry Certifications',
        icon: 'school',
        currentDiagnosis: `Reviewed "${eduDegree}" and "${certName}"; can be strengthened with targeted coursework and verification IDs for ${data.targetRole}.`,
        estimatedScoreLift: '+4 pts',
        actionableBullets: [
          `Under "${eduDegree}", add a single line of role-aligned coursework: "Relevant Coursework: Distributed Systems, Data Structures & Algorithms, Database Internals, and Cloud Computing."`,
          `Format "${certName}" with issuing body, completion year, and credential verification ID so ATS parsers validate active certification status.`,
          `Add any technical hackathons, open-source contributions, or capstone distinctions tied to ${primarySkill} and ${primaryGap}.`,
        ],
      },
    ];
  })();

  const [aiRefinementSections, setAiRefinementSections] = useState<RefinementSection[] | null>(null);
  const [isRefiningWithAi, setIsRefiningWithAi] = useState(false);
  const [refinementSource, setRefinementSource] = useState<string>('ai-refinement-engine');
  const [copiedRefinementKey, setCopiedRefinementKey] = useState<string | null>(null);
  const [appliedBullets, setAppliedBullets] = useState<string[]>([]);

  const handleGenerateAiRefinements = async () => {
    setIsRefiningWithAi(true);
    try {
      const res = await fetch('/api/v1/resume/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: data.candidateName,
          fileName: data.fileName,
          targetRole: data.targetRole,
          score: data.score,
          skillsDetected: data.skillsDetected,
          missingSkills: data.missingSkills,
          education: data.education,
          experience: data.experience,
          projects: data.projects,
          certifications: data.certifications,
        }),
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.sections) && json.sections.length > 0) {
        setAiRefinementSections(json.sections);
        setRefinementSource(json.source || 'gemini-3.8-flash');
      }
    } catch {
      // Fallback to instant section refinements
    } finally {
      setIsRefiningWithAi(false);
    }
  };

  useEffect(() => {
    setAiRefinementSections(null);
    setAppliedBullets([]);
  }, [selectedCase, customAnalysis]);

  const activeRefinementSections = aiRefinementSections || defaultRefinementSections;

  const handleSelectScenario = (key: 'uploaded' | 'stateA' | 'stateB' | 'stateC') => {
    setSelectedCase(key);
    setSimulatedBoostSkills([]);
    if (key !== 'uploaded') {
      const chosen = candidateCases[key];
      onUpdateActiveUser(chosen.candidateName, chosen.candidateEmail, chosen.targetRole);
    }
  };

  const handleExportSummary = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let y = 16;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - 18) {
        doc.addPage();
        y = 18;
      }
    };

    // 1. Top Styled Indigo Header Banner
    doc.setFillColor(19, 27, 46); // Deep navy/indigo header
    doc.rect(0, 0, pageWidth, 38, 'F');

    doc.setTextColor(195, 192, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('RESUMETRIC AI TELEMETRY PLATFORM · EXECUTIVE ATS DIAGNOSTIC REPORT', margin, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`Candidate Report: ${data.candidateName}`, margin, 22);

    doc.setTextColor(218, 226, 253);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const metaLine = `Email: ${data.candidateEmail}   |   Contact: ${
      activeUser.contactNumber || '+91 9876543210'
    }   |   Target Role: ${data.targetRole}`;
    doc.text(metaLine, margin, 30);

    y = 46;

    // 2. Executive KPI Score Cards (Resume Score & Job Match %)
    doc.setFillColor(244, 246, 252);
    doc.setDrawColor(210, 215, 230);
    doc.roundedRect(margin, y, contentWidth / 2 - 3, 28, 3, 3, 'FD');
    doc.roundedRect(margin + contentWidth / 2 + 3, y, contentWidth / 2 - 3, 28, 3, 3, 'FD');

    // Left Box: Resume Score
    doc.setTextColor(90, 98, 120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('OVERALL ATS RESUME SCORE', margin + 5, y + 7);

    if (data.score >= 80) {
      doc.setTextColor(0, 110, 75);
    } else if (data.score >= 55) {
      doc.setTextColor(180, 105, 14);
    } else {
      doc.setTextColor(186, 26, 26);
    }
    doc.setFontSize(18);
    doc.text(`${data.score} / 100`, margin + 5, y + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 68, 88);
    doc.text(`Status: ${data.scoreStatus} (${data.percentileText})`, margin + 5, y + 24);

    // Right Box: Job Match Percentage
    const rightX = margin + contentWidth / 2 + 8;
    doc.setTextColor(90, 98, 120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('TARGET ROLE ALIGNMENT & MATCH', rightX, y + 7);

    doc.setTextColor(53, 37, 205);
    doc.setFontSize(18);
    doc.text(`${data.matchPercentage}% Match`, rightX, y + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 68, 88);
    doc.text(
      `Matched ${data.matchedCount} of ${data.totalReqCount} Core Role Requirements`,
      rightX,
      y + 24
    );

    y += 35;

    // 3. Executive Summary Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(19, 27, 46);
    doc.text('1. Executive Diagnostic Summary', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(55, 65, 81);
    const summaryLines = doc.splitTextToSize(
      `${data.summaryText} (${data.formatStatusText}). File analyzed: ${
        data.fileName || 'active_candidate_resume.pdf'
      }.`,
      contentWidth
    );
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 4.8 + 5;

    // 4. Detected Skills vs Missing Skill Gaps
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(19, 27, 46);
    doc.text(`2. Verified Technical Skills (${data.skillsDetected.length} Detected)`, margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 110, 75);
    const detectedText =
      data.skillsDetected.length > 0 ? data.skillsDetected.join('  •  ') : 'None detected';
    const detectedLines = doc.splitTextToSize(detectedText, contentWidth);
    doc.text(detectedLines, margin, y);
    y += detectedLines.length * 4.8 + 4;

    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(186, 26, 26);
    doc.text(`3. Missing Role Skill Gaps (${data.missingSkills.length} Identified)`, margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(140, 30, 30);
    const missingText =
      data.missingSkills.length > 0
        ? data.missingSkills.join('  •  ')
        : 'All core requirements satisfied!';
    const missingLines = doc.splitTextToSize(missingText, contentWidth);
    doc.text(missingLines, margin, y);
    y += missingLines.length * 4.8 + 5;

    // 5. Key Resume Strengths
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(19, 27, 46);
    doc.text('4. Key Candidate Strengths', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(55, 65, 81);
    data.strengths.forEach((str) => {
      const bulletLines = doc.splitTextToSize(`•  ${str}`, contentWidth - 4);
      checkPageBreak(bulletLines.length * 4.8 + 2);
      doc.text(bulletLines, margin + 2, y);
      y += bulletLines.length * 4.8 + 1.5;
    });
    y += 4;

    // 6. Work Experience & Projects
    if (data.experience.length > 0) {
      checkPageBreak(35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(19, 27, 46);
      doc.text('5. Parsed Work Experience & Impact', margin, y);
      y += 5;

      data.experience.forEach((exp) => {
        checkPageBreak(18);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(53, 37, 205);
        doc.text(`${exp.title} — ${exp.company} (${exp.duration})`, margin + 2, y);
        y += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(55, 65, 81);
        const expLines = doc.splitTextToSize(exp.impact, contentWidth - 4);
        doc.text(expLines, margin + 2, y);
        y += expLines.length * 4.5 + 3;
      });
    }

    if (data.projects.length > 0) {
      checkPageBreak(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(19, 27, 46);
      doc.text('6. Technical Architecture Projects', margin, y);
      y += 5;

      data.projects.forEach((proj) => {
        checkPageBreak(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(19, 27, 46);
        doc.text(`${proj.name}  [${proj.stack}]`, margin + 2, y);
        y += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(55, 65, 81);
        const projLines = doc.splitTextToSize(proj.outcome, contentWidth - 4);
        doc.text(projLines, margin + 2, y);
        y += projLines.length * 4.5 + 3;
      });
    }

    // 7. Education & Certifications
    if (data.education.length > 0 || data.certifications.length > 0) {
      checkPageBreak(28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(19, 27, 46);
      doc.text('7. Education & Industry Certifications', margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      data.education.forEach((edu) => {
        checkPageBreak(8);
        doc.text(
          `•  ${edu.degree}, ${edu.institution} (Class of ${edu.year} · GPA: ${edu.gpa})`,
          margin + 2,
          y
        );
        y += 5;
      });
      data.certifications.forEach((cert) => {
        checkPageBreak(8);
        doc.text(`•  Certification: ${cert.name} — ${cert.issuer} (${cert.year})`, margin + 2, y);
        y += 5;
      });
      y += 3;
    }

    // 8. Actionable Remediation Box
    checkPageBreak(24);
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(99, 102, 241);
    doc.roundedRect(margin, y, contentWidth, 18, 2.5, 2.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(53, 37, 205);
    doc.text('RECOMMENDED ATS REMEDIATION ACTION:', margin + 4, y + 6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const tipLines = doc.splitTextToSize(data.remediationTip, contentWidth - 8);
    doc.text(tipLines, margin + 4, y + 12);

    // Footer with timestamp
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 138, 155);
    doc.text(
      `Generated by ResuMetric AI Resume Analyzer on ${new Date().toLocaleString()} · Verified Session: ${
        data.candidateEmail
      }`,
      margin,
      pageHeight - 8
    );

    const safeCandidateSlug = data.candidateName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');
    const pdfFileName = `${safeCandidateSlug}_resume_analysis_report.pdf`;
    doc.save(pdfFileName);

    setExportMessage(
      `Downloaded styled PDF report "${pdfFileName}" for ${data.candidateName} (Score: ${data.score}/100 · ${data.matchPercentage}% Match)`
    );
    setTimeout(() => setExportMessage(null), 4500);
  };

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-space-lg pb-space-2xl">
      {/* Interactive Switch Candidate / Resume Test Case Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
            <span className="text-base font-semibold text-on-surface">
              Switch Candidate / Resume Test Case
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed">
              Interactive Testing Mode
            </span>
          </div>
          <span className="text-xs text-secondary">
            Dynamically simulates real-time engine evaluation
          </span>
        </div>

        <div
          className={`grid grid-cols-1 ${
            customAnalysis ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
          } gap-space-xs pt-space-2xs`}
        >
          {customAnalysis && (
            <button
              type="button"
              onClick={() => handleSelectScenario('uploaded')}
              className={`flex flex-col items-start p-space-sm rounded-lg text-left transition-all cursor-pointer ${
                selectedCase === 'uploaded'
                  ? 'border-2 border-primary bg-primary-fixed/20 shadow-sm'
                  : 'border border-outline-variant/60 hover:border-primary/60 bg-surface-container-low/40'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-sm font-semibold text-primary flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Uploaded Resume
                </span>
                <span className="text-xs font-bold text-primary font-mono">
                  {customAnalysis.score} pts
                </span>
              </div>
              <span className="text-xs text-secondary truncate w-full">
                {customAnalysis.fileName || 'Custom Upload'} • {customAnalysis.matchPercentage}% Match
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSelectScenario('stateA')}
            className={`flex flex-col items-start p-space-sm rounded-lg text-left transition-all cursor-pointer ${
              selectedCase === 'stateA'
                ? 'border-2 border-primary bg-primary-fixed/20 shadow-sm'
                : 'border border-outline-variant/60 hover:border-error/60 bg-surface-container-low/40'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-sm font-semibold text-error flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                Basic / Needs Work
              </span>
              <span className="text-xs font-bold text-error font-mono">34 pts</span>
            </div>
            <span className="text-xs text-secondary">
              Basic Entry Resume • 28% Match
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectScenario('stateB')}
            className={`flex flex-col items-start p-space-sm rounded-lg text-left transition-all cursor-pointer ${
              selectedCase === 'stateB'
                ? 'border-2 border-primary bg-primary-fixed/20 shadow-sm'
                : 'border border-outline-variant/60 hover:border-amber-500/60 bg-surface-container-low/40'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-sm font-semibold text-amber-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Moderate / Mid-Level
              </span>
              <span className="text-xs font-bold text-amber-600 font-mono">66 pts</span>
            </div>
            <span className="text-xs text-secondary">
              Mid-Level SWE • 58% Match
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectScenario('stateC')}
            className={`flex flex-col items-start p-space-sm rounded-lg text-left transition-all cursor-pointer ${
              selectedCase === 'stateC'
                ? 'border-2 border-primary bg-primary-fixed/20 shadow-sm'
                : 'border border-outline-variant/60 hover:border-tertiary/60 bg-surface-container-low/40'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-sm font-semibold text-tertiary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                Senior / High Match
              </span>
              <span className="text-xs font-bold text-tertiary font-mono">93 pts</span>
            </div>
            <span className="text-xs text-secondary">
              {candidateCases.stateC.candidateName} • Lead Engineer • 91% Match
            </span>
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="px-space-md py-space-xs rounded-lg bg-tertiary-fixed/40 border border-tertiary/30 text-on-tertiary-fixed text-xs font-semibold flex items-center justify-between">
          <span>{exportMessage}</span>
          <span className="font-mono">200 OK</span>
        </div>
      )}

      {/* Header / Overview Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-secondary text-xs font-semibold tracking-wider uppercase mb-space-2xs flex-wrap">
            <span>Analysis Workspace</span>
            <span className="text-outline-variant">•</span>
            <span className="text-primary font-semibold">Active Session</span>
            <span className="text-outline-variant">•</span>
            <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface font-semibold text-[11px]">
              Candidate: {data.candidateName}
            </span>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
              Resume Analysis Result
            </h1>
            <span className="text-xs text-secondary">• {data.greeting}</span>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          <button
            type="button"
            onClick={handleExportSummary}
            className="flex items-center gap-space-xs px-space-md py-space-xs bg-primary-container text-on-primary text-sm font-semibold rounded-lg shadow-sm hover:opacity-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>Export PDF Report</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-high text-primary text-sm font-medium rounded-lg hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>Re-analyze</span>
          </button>
        </div>
      </div>

      {/* Rubric Extraction Transparency Note */}
      <div className="bg-surface-container-low/70 border border-outline-variant/30 rounded-lg px-space-md py-space-xs flex items-center gap-space-xs text-secondary text-xs">
        <span className="material-symbols-outlined text-primary text-[18px] shrink-0">info</span>
        <span>
          Calculated dynamically via REST API extraction &amp; scoring engine rubric (Skills: 30pts, Experience: 25pts, Projects: 15pts, Education: 15pts, Certifications: 10pts, Format: 5pts).
        </span>
      </div>

      {/* Top Two Metric Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* Card 1: Resume Score */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300">
          <div className="flex items-start justify-between gap-space-md">
            <div className="flex items-center gap-space-lg">
              {/* Circular Gauge */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    className="text-surface-container fill-none"
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="8"
                  ></circle>
                  <circle
                    className="transition-all duration-700 ease-out"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="42"
                    stroke={data.gaugeStrokeColor}
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={scoreOffset}
                    strokeLinecap="round"
                    strokeWidth="8"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[28px] font-bold text-on-surface leading-none font-mono tabular-nums">
                    {data.score}
                  </span>
                  <span className="text-xs text-secondary font-medium">/100</span>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col gap-space-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Diagnostic Evaluation
                </span>
                <div className="flex items-center gap-space-xs flex-wrap">
                  <h2 className="text-xl font-semibold text-on-surface">Resume Score</h2>
                  <span
                    className={`inline-flex items-center gap-1 px-space-xs py-space-2xs text-xs rounded-full font-semibold ${data.scoreStatusColor}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {data.scoreIcon}
                    </span>
                    <span>{data.scoreStatus}</span>
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant max-w-sm">{data.summaryText}</p>
              </div>
            </div>
          </div>

          {/* Subtle Quality Bar */}
          <div className="mt-space-md pt-space-md bg-surface-container-low/50 -mx-space-lg -mb-space-lg px-space-lg py-space-sm flex items-center justify-between text-secondary text-xs">
            <span className="flex items-center gap-1">
              <span
                className={`material-symbols-outlined text-[16px] ${
                  data.formatVerified ? 'text-tertiary' : 'text-error'
                }`}
              >
                {data.formatVerified ? 'verified' : 'warning'}
              </span>
              <span>{data.formatStatusText}</span>
            </span>
            <span className="font-semibold text-on-surface">{data.percentileText}</span>
          </div>
        </div>

        {/* Card 2: Job Match Percentage */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300">
          <div className="flex items-start justify-between gap-space-md">
            <div className="flex items-center gap-space-lg w-full">
              {/* Donut Gauge */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    className="text-surface-container fill-none"
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="8"
                  ></circle>
                  <circle
                    className="transition-all duration-700 ease-out"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="42"
                    stroke={data.matchCircleColor}
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={matchOffset}
                    strokeLinecap="round"
                    strokeWidth="8"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[28px] font-bold text-on-surface leading-none font-mono tabular-nums">
                    {data.matchPercentage}%
                  </span>
                  <span className="text-xs text-secondary font-medium">Match</span>
                </div>
              </div>

              {/* Breakdown Legend */}
              <div className="flex flex-col gap-space-xs flex-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Target Alignment
                </span>
                <h2 className="text-xl font-semibold text-on-surface">Job Match Percentage</h2>
                <div className="grid grid-cols-3 gap-space-xs mt-space-2xs">
                  <div className="p-space-xs bg-surface-container-low rounded-lg flex flex-col">
                    <span className="text-secondary text-xs">Matched</span>
                    <span className="text-base text-tertiary font-bold font-mono">
                      {data.matchedCount}
                    </span>
                  </div>
                  <div className="p-space-xs bg-surface-container-low rounded-lg flex flex-col">
                    <span className="text-secondary text-xs">Missing</span>
                    <span className="text-base text-error font-bold font-mono">
                      {data.missingCount}
                    </span>
                  </div>
                  <div className="p-space-xs bg-surface-container-low rounded-lg flex flex-col">
                    <span className="text-secondary text-xs">Total Req.</span>
                    <span className="text-base text-on-surface font-bold font-mono">
                      {data.totalReqCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Target Posting Sub-meta */}
          <div className="mt-space-md pt-space-md bg-surface-container-low/50 -mx-space-lg -mb-space-lg px-space-lg py-space-sm flex items-center justify-between text-secondary text-xs">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">target</span>
              Matched against:{' '}
              <strong className="text-on-surface font-medium">{data.targetRole}</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('matcher')}
              className="text-primary text-xs font-semibold cursor-pointer hover:underline"
            >
              Change Job
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container with Tabs & Diagnostics */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Interactive Navigation Tabs */}
        <div className="bg-surface-container-low px-space-lg pt-space-xs flex items-center gap-space-xs overflow-x-auto">
          {(
            [
              { id: 'skills', label: 'Skills', icon: 'psychology' },
              {
                id: 'refinement',
                label: 'AI Resume Refinement Assistant',
                icon: 'auto_fix_high',
              },
              { id: 'xai', label: 'Explainable AI (XAI)', icon: 'neurology' },
              { id: 'education', label: 'Education', icon: 'school' },
              { id: 'experience', label: 'Experience', icon: 'work' },
              { id: 'projects', label: 'Projects', icon: 'code_blocks' },
              { id: 'certifications', label: 'Certifications', icon: 'card_membership' },
              { id: 'copilot', label: 'Career Co-Pilot & Interview Prep', icon: 'auto_awesome' },
            ] as const
          ).map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-space-lg py-space-sm text-sm rounded-t-lg flex items-center gap-space-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'font-semibold text-primary bg-surface-container-lowest shadow-sm'
                    : 'font-medium text-secondary hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="p-space-lg flex flex-col gap-space-xl">
          {activeTab === 'skills' && (
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-base text-on-surface font-semibold flex items-center gap-space-xs">
                  <span>Skills Detected</span>
                  <span className="text-xs bg-surface-container-high text-primary font-bold px-space-xs py-0.5 rounded-full">
                    {data.skillsDetected.length} Found
                  </span>
                </h3>
                <span className="text-xs text-secondary">Synthesized via Semantic Parsing</span>
              </div>

              <div className="flex flex-wrap items-center gap-space-xs pt-space-2xs">
                {data.skillsDetected.map((skill) => (
                  <div
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-space-sm py-1.5 rounded-full bg-surface-container text-primary text-sm font-medium hover:bg-surface-container-high transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'refinement' && (
            <div className="flex flex-col gap-space-lg">
              {/* Header Banner for AI Resume Refinement Assistant */}
              <div className="p-space-md rounded-xl bg-surface-container-low border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <span className="material-symbols-outlined text-[22px]">auto_fix_high</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-on-surface">
                        AI-Powered Resume Refinement Assistant
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-primary-fixed text-on-primary-fixed">
                        {refinementSource === 'gemini-3.8-flash'
                          ? 'Gemini 3.8 Flash Live'
                          : 'Section-by-Section AI Engine'}
                      </span>
                      {appliedBullets.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                          {appliedBullets.length} Improvements Marked Done
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Specific, actionable bullet points tailored to improve every section of{' '}
                      <strong className="text-on-surface">
                        {data.fileName || 'your uploaded resume'}
                      </strong>{' '}
                      for <strong className="text-primary">{data.targetRole}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleGenerateAiRefinements}
                    disabled={isRefiningWithAi}
                    className="px-3.5 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-semibold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isRefiningWithAi ? 'sync' : 'bolt'}
                    </span>
                    <span>
                      {isRefiningWithAi
                        ? 'Refining with Gemini AI...'
                        : 'Regenerate AI Section Bullets'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Section-by-Section Actionable Bullet Cards */}
              <div className="grid grid-cols-1 gap-space-md">
                {activeRefinementSections.map((sec) => (
                  <div
                    key={sec.sectionId}
                    className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-space-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-space-xs border-b border-outline-variant/20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">{sec.icon}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-on-surface">{sec.sectionTitle}</h4>
                          <p className="text-xs text-on-surface-variant">{sec.currentDiagnosis}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-tertiary-fixed/50 text-tertiary font-mono text-xs font-extrabold shrink-0 self-start sm:self-center">
                        Potential Impact: {sec.estimatedScoreLift}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      {sec.actionableBullets.map((bullet, bIdx) => {
                        const bulletKey = `${sec.sectionId}_${bIdx}`;
                        const isCopied = copiedRefinementKey === bulletKey;
                        const isApplied = appliedBullets.includes(bulletKey);

                        return (
                          <div
                            key={bulletKey}
                            className={`p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                              isApplied
                                ? 'bg-tertiary-fixed/20 border-tertiary/40'
                                : 'bg-surface-container-lowest border-outline-variant/30'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setAppliedBullets((prev) =>
                                    prev.includes(bulletKey)
                                      ? prev.filter((k) => k !== bulletKey)
                                      : [...prev, bulletKey]
                                  )
                                }
                                className="mt-0.5 text-primary hover:text-tertiary cursor-pointer shrink-0"
                                title="Mark this refinement bullet as applied"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {isApplied ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                              </button>
                              <p
                                className={`text-xs sm:text-sm leading-relaxed ${
                                  isApplied
                                    ? 'text-on-surface font-medium'
                                    : 'text-on-surface'
                                }`}
                              >
                                {bullet}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(bullet);
                                  setCopiedRefinementKey(bulletKey);
                                  setTimeout(() => setCopiedRefinementKey(null), 2000);
                                }}
                                className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  {isCopied ? 'check' : 'content_copy'}
                                </span>
                                <span>{isCopied ? 'Copied' : 'Copy Bullet'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'xai' && (
            <div className="flex flex-col gap-space-lg">
              {/* XAI Header Banner */}
              <div className="p-space-md rounded-xl bg-surface-container-low border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[22px]">neurology</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-on-surface">
                        Explainable AI (XAI) Decision Transparency &amp; Feature Attribution
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-primary-fixed text-on-primary-fixed">
                        Glass-Box Rubric v2.4
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Inspect the exact mathematical weights, SHAP feature contributions, and counterfactual decision trace behind <strong className="text-on-surface">{data.candidateName}</strong>&apos;s{' '}
                      <strong className="text-primary font-mono">{data.score}/100</strong> Resume Score and{' '}
                      <strong className="text-tertiary font-mono">{data.matchPercentage}%</strong> Job Match.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-right font-mono">
                    <div className="text-[10px] text-secondary uppercase">Model Confidence</div>
                    <div className="text-sm font-bold text-tertiary">96.4% Verified</div>
                  </div>
                </div>
              </div>

              {/* 1. Weighted Rubric Decomposition (100-Point Glass-Box Breakdown) */}
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      stacked_bar_chart
                    </span>
                    <span>1. 100-Point Weighted Rubric Decomposition</span>
                  </h4>
                  <span className="text-xs font-mono text-secondary">
                    Sum of Pillars = {data.score} / 100 pts
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                  {xaiRubricBreakdown.map((item) => {
                    const pct = Math.min(100, Math.round((item.earned / item.max) * 100));
                    return (
                      <div
                        key={item.pillar}
                        className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/25 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-on-surface">{item.pillar}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-mono text-secondary">
                              {item.weightLabel}
                            </span>
                            <span className="font-mono text-sm font-extrabold text-primary">
                              {item.earned}/{item.max} pts
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.colorClass} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-0.5">
                          <span>{item.evidence}</span>
                          <span className="font-mono text-tertiary font-semibold shrink-0 ml-2">
                            Conf: {item.confidence}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. SHAP-Style Feature Attribution Waterfall (+ Boosters vs - Penalties) */}
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">
                      align_horizontal_center
                    </span>
                    <span>2. SHAP Feature Attribution (+ Positive Boosters vs. - Skill Gap Penalties)</span>
                  </h4>
                  <span className="text-xs font-mono text-secondary">Token-Level Impact</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {xaiShapContributions.map((item, idx) => {
                    const isPos = item.type === 'positive';
                    const barWidth = Math.min(100, Math.abs(item.numericDelta) * 9);
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-xs font-extrabold shrink-0 ${
                              isPos
                                ? 'bg-tertiary-fixed/50 text-tertiary'
                                : 'bg-error-container text-on-error-container'
                            }`}
                          >
                            {item.delta}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-on-surface">
                              {item.feature}
                            </div>
                            <div className="text-xs text-on-surface-variant">{item.reason}</div>
                          </div>
                        </div>

                        <div className="w-full sm:w-40 flex items-center gap-2 shrink-0">
                          <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isPos ? 'bg-tertiary' : 'bg-error'
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] uppercase font-semibold text-secondary w-14 text-right">
                            {isPos ? 'Booster' : 'Penalty'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Counterfactual Explanations & Bias / Fairness Audit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-low border border-primary/25 flex flex-col justify-between gap-space-sm">
                  <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <span className="material-symbols-outlined text-[18px]">alt_route</span>
                      <span>3. Counterfactual Path to 95+ Score</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      <strong>Why didn&apos;t this resume score 100/100?</strong> The XAI model identified{' '}
                      <strong className="text-on-surface">{data.missingSkills.length} missing requirement(s)</strong>{' '}
                      ({data.missingSkills.join(', ') || 'None'}). Adding evidence for{' '}
                      <strong className="text-primary">{data.missingSkills[0] || 'Kubernetes'}</strong>{' '}
                      and 2 quantified latency/scale metrics will raise your score from{' '}
                      <strong className="font-mono">{data.score}</strong> to{' '}
                      <strong className="font-mono text-tertiary">
                        {Math.min(99, data.score + 12)}/100
                      </strong>
                      .
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('copilot')}
                    className="self-start px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95 cursor-pointer"
                  >
                    Simulate Counterfactual in Co-Pilot →
                  </button>
                </div>

                <div className="p-space-md rounded-xl bg-surface-container-low border border-tertiary/25 flex flex-col justify-between gap-space-sm">
                  <div>
                    <div className="flex items-center gap-2 text-tertiary font-bold text-sm">
                      <span className="material-symbols-outlined text-[18px]">shield_lock</span>
                      <span>4. Algorithmic Fairness &amp; De-Biased Evaluation</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Identity attributes (<strong className="text-on-surface">{data.candidateName}</strong>,{' '}
                      <strong className="text-on-surface">{data.candidateEmail}</strong>, gender, age, and institution prestige) are <strong>masked</strong> during scoring. 100% of the score is derived strictly from verifiable technical skills, project architecture, and ATS structure.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-tertiary font-semibold">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    <span>PII-Masked Scoring · Deterministic Audit Trail</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'education' && (
            <div className="flex flex-col gap-space-sm">
              <h3 className="text-base font-semibold text-on-surface">
                Verified Academic Credentials
              </h3>
              <div className="grid grid-cols-1 gap-space-sm">
                {data.education.map((edu, i) => (
                  <div
                    key={i}
                    className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-on-surface">{edu.degree}</div>
                      <div className="text-xs text-on-surface-variant">{edu.institution}</div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <div className="text-primary font-bold">Class of {edu.year}</div>
                      <div className="text-secondary">GPA: {edu.gpa}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="flex flex-col gap-space-sm">
              <h3 className="text-base font-semibold text-on-surface">
                Parsed Work Experience &amp; Deliverable Impact
              </h3>
              <div className="grid grid-cols-1 gap-space-sm">
                {data.experience.map((exp, i) => (
                  <div key={i} className="p-space-md rounded-xl bg-surface-container-low">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-on-surface">
                        {exp.title} · <span className="text-primary">{exp.company}</span>
                      </span>
                      <span className="text-xs font-mono text-secondary">{exp.duration}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{exp.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="flex flex-col gap-space-sm">
              <h3 className="text-base font-semibold text-on-surface">
                Technical Architecture Projects
              </h3>
              <div className="grid grid-cols-1 gap-space-sm">
                {data.projects.map((proj, i) => (
                  <div key={i} className="p-space-md rounded-xl bg-surface-container-low">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-on-surface">{proj.name}</span>
                      <span className="text-xs font-mono text-primary font-semibold">
                        {proj.stack}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{proj.outcome}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'certifications' && (
            <div className="flex flex-col gap-space-sm">
              <h3 className="text-base font-semibold text-on-surface">
                Industry Certifications &amp; Licenses
              </h3>
              <div className="grid grid-cols-1 gap-space-sm">
                {data.certifications.map((cert, i) => (
                  <div
                    key={i}
                    className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-on-surface">{cert.name}</div>
                      <div className="text-xs text-on-surface-variant">{cert.issuer}</div>
                    </div>
                    <span className="font-mono text-xs text-tertiary font-bold">
                      Issued {cert.year}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'copilot' && (
            <div className="flex flex-col gap-space-lg">
              {/* Co-Pilot Feature 1: Interactive Score What-If Simulator */}
              <div className="p-space-md rounded-xl bg-surface-container-low border border-primary/20 flex flex-col gap-space-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      trending_up
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-on-surface">
                        1. Interactive &ldquo;What-If&rdquo; ATS Score Booster
                      </h3>
                      <p className="text-xs text-secondary">
                        Click any missing skill below to simulate adding it to your resume and watch your live Resume Score &amp; Job Match gauges update immediately.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary font-mono text-xs font-bold shrink-0">
                    Simulated Score: {data.score}/100 ({data.matchPercentage}% Match)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {baseData.missingSkills.map((skill) => {
                    const isAdded = simulatedBoostSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          setSimulatedBoostSkills((prev) =>
                            prev.includes(skill)
                              ? prev.filter((s) => s !== skill)
                              : [...prev, skill]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-tertiary text-white shadow-sm'
                            : 'bg-surface-container-lowest border border-outline-variant text-on-surface hover:border-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {isAdded ? 'check_circle' : 'add_circle'}
                        </span>
                        <span>{skill}</span>
                        <span className="font-mono text-[10px] opacity-80">+6 pts</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Co-Pilot Feature 2: STAR Resume Bullet Impact Rewriter */}
              <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      edit_note
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-on-surface">
                        2. STAR-Format Resume Bullet Optimizer
                      </h3>
                      <p className="text-xs text-secondary">
                        Transform a basic task description into quantified, ATS-optimized STAR achievement bullets tailored to {data.targetRole}.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg">
                    {(
                      [
                        { id: 'latency', label: 'Speed & Latency' },
                        { id: 'scale', label: 'System Scale' },
                        { id: 'revenue', label: 'Product Impact' },
                      ] as const
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSelectedMetricTone(mode.id)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                          selectedMetricTone === mode.id
                            ? 'bg-primary-container text-on-primary'
                            : 'text-secondary hover:text-on-surface'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
                    Your Draft Resume Bullet
                  </label>
                  <input
                    type="text"
                    value={rawBulletInput}
                    onChange={(e) => setRawBulletInput(e.target.value)}
                    placeholder="e.g. Built REST APIs and frontend pages for user dashboard"
                    className="w-full px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 gap-space-xs">
                  {starVariations.map((bullet, idx) => (
                    <div
                      key={idx}
                      className="p-space-sm rounded-lg bg-surface-container-lowest border border-outline-variant/40 flex items-start justify-between gap-space-sm"
                    >
                      <div className="flex items-start gap-2">
                        <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-mono text-[10px] font-bold mt-0.5 shrink-0">
                          STAR v{idx + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
                          {bullet}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(bullet);
                          setCopiedBulletIdx(idx);
                          setTimeout(() => setCopiedBulletIdx(null), 2000);
                        }}
                        className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {copiedBulletIdx === idx ? 'check' : 'content_copy'}
                        </span>
                        <span>{copiedBulletIdx === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Co-Pilot Feature 3: Skill-Gap Technical Interview Simulator */}
              <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-space-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">
                    quiz
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">
                      3. Personalized Technical Interview Prep Deck
                    </h3>
                    <p className="text-xs text-secondary">
                      Auto-generated interview questions targeting your missing skills and core strengths for {data.targetRole}.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-space-xs pt-1">
                  {interviewPrepDeck.map((item, idx) => {
                    const isOpen = expandedQuestionIdx === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-lg bg-surface-container-lowest border border-outline-variant/40 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedQuestionIdx(isOpen ? null : idx)}
                          className="w-full p-space-sm text-left flex items-center justify-between gap-2 hover:bg-surface-container/40 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.badgeColor}`}
                            >
                              {item.type}: {item.skill}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-on-surface">
                              {item.question}
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
                            {isOpen ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-space-md pb-space-sm pt-1 border-t border-outline-variant/20 bg-surface-container-low/40 text-xs text-on-surface-variant leading-relaxed">
                            <strong className="text-primary">Recommended Talking Point: </strong>
                            {item.talkingPoint}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Warning Banner for Poor State */}
          {data.showCriticalWarning && (
            <div className="p-space-md rounded-xl bg-error-container/60 border border-error/30 text-on-error-container flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-xs text-error font-semibold text-sm">
                <span className="material-symbols-outlined text-[20px]">report</span>
                <span>Critical ATS &amp; Alignment Red Flags Detected</span>
              </div>
              <p className="text-xs">{data.criticalWarningText}</p>
            </div>
          )}

          {/* Two-column Evaluation Breakdown (Strengths vs Missing Skills) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg pt-space-xs">
            {/* Column 1: Strengths */}
            <div className="bg-surface-container-low/60 rounded-xl p-space-md flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-xs text-tertiary">
                <span className="material-symbols-outlined text-[20px] text-tertiary">
                  task_alt
                </span>
                <h4 className="text-base font-semibold text-on-surface">Strengths</h4>
              </div>
              <ul className="flex flex-col gap-space-xs pl-space-xs">
                {data.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">
                      check
                    </span>
                    <span className="text-sm text-on-surface">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Missing Skills */}
            <div className="bg-surface-container-low/60 rounded-xl p-space-md flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-xs text-error">
                <span className="material-symbols-outlined text-[20px] text-error">warning</span>
                <h4 className="text-base font-semibold text-on-surface">Missing Skills</h4>
              </div>
              <ul className="flex flex-col gap-space-xs pl-space-xs">
                {data.missingSkills.map((skill, idx) => (
                  <li key={idx} className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">
                      close
                    </span>
                    <span className="text-sm text-on-surface">{skill}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Action Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md pt-space-md mt-space-xs border-t border-outline-variant/30">
            <div className="flex items-center gap-space-xs text-secondary text-xs">
              <span className="material-symbols-outlined text-[18px] text-primary">lightbulb</span>
              <span>{data.remediationTip}</span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('matcher')}
              className="inline-flex items-center gap-space-xs px-space-lg py-space-sm bg-primary-container text-on-primary text-sm font-semibold rounded-lg shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>{data.actionBtnText}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
