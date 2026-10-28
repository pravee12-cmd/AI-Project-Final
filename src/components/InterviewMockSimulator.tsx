import React, { useState, useEffect, useCallback } from 'react';
import { ActiveUser, CandidateAnalysis, MockInterviewQuestion, ScreenId } from '../types';

interface InterviewMockSimulatorProps {
  activeUser: ActiveUser;
  currentAnalysis: CandidateAnalysis;
  onNavigate?: (screen: ScreenId) => void;
}

export const JOB_TITLE_OPTIONS = [
  'Full Stack Software Engineer',
  'Frontend React Developer',
  'Backend Node.js & API Engineer',
  'Python Data Scientist & ML Engineer',
  'Cloud DevOps & SRE Architect',
  'Product & Technical Engineering Lead',
];

function buildRoleQuestionDeck(
  jobTitle: string,
  candidateName: string,
  skillsDetected: string[],
  missingSkills: string[],
  strengths: string[],
  variationSeed = 0
): MockInterviewQuestion[] {
  const cleanJobTitle = (jobTitle || 'Full Stack Software Engineer').trim();
  const lowerJob = cleanJobTitle.toLowerCase();
  const cleanCandidate = (candidateName || 'Candidate').trim();

  const skillsList =
    skillsDetected && skillsDetected.length > 0
      ? skillsDetected
      : ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL'];
  const gapsList =
    missingSkills && missingSkills.length > 0
      ? missingSkills
      : ['React', 'Node.js', 'SQL', 'Docker'];
  const strengthsList =
    strengths && strengths.length > 0
      ? strengths
      : ['Full-stack engineering and problem solving'];

  const primarySkill = skillsList[variationSeed % skillsList.length] || 'JavaScript';
  const secondarySkill = skillsList[(variationSeed + 1) % skillsList.length] || 'TypeScript';
  const thirdSkill = skillsList[(variationSeed + 2) % skillsList.length] || primarySkill;
  const primaryGap = gapsList[variationSeed % gapsList.length] || 'React';
  const secondaryGap = gapsList[(variationSeed + 1) % gapsList.length] || 'Node.js';

  // 1. FRONTEND REACT DEVELOPER
  if (lowerJob.includes('frontend') || lowerJob.includes('react') || lowerJob.includes('ui')) {
    return [
      {
        id: `fe_tech_1_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Core',
        focusArea: `React & ${primarySkill} Rendering Optimization`,
        question: `In ${cleanCandidate}'s resume, you highlight experience with ${skillsList.slice(0, 3).join(', ')}. As a ${cleanJobTitle}, how do you prevent unnecessary re-renders, stale closures, and state bottlenecks in a data-heavy dashboard?`,
        whyAsked: `Verifies deep practical understanding of React's reconciliation fiber tree, hooks dependencies, and state colocation for ${cleanJobTitle}.`,
        expectedKeyPoints: [
          `Colocate state close to consuming components and split global Context providers`,
          `Use React.memo, useMemo, and useCallback strategically for expensive child subtrees`,
          `Measure actual commit flamegraphs and Interaction to Next Paint (INP) via React DevTools`,
        ],
        sampleAnswerFramework: `Start with a real UI screen you built using ${primarySkill}. Describe the initial rendering lag, how you refactored the component hierarchy or memoized derived state, and quantify the frame-rate or load-time improvement.`,
      },
      {
        id: `fe_tech_2_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Intermediate',
        focusArea: `Type-Safe Component Architecture (${secondarySkill})`,
        question: `When building a design system and asynchronous data-fetching layer in ${secondarySkill} for a ${cleanJobTitle} role, how do you handle race conditions, loading skeletons, and API error boundaries cleanly?`,
        whyAsked: `Evaluates frontend resilience, TypeScript discriminated unions, and production UX polish.`,
        expectedKeyPoints: [
          `Cancel outdated inflight HTTP requests using AbortController on rapid filter changes`,
          `Model async states with strict ${secondarySkill} discriminated unions (idle | loading | success | error)`,
          `Wrap feature widgets in declarative Error Boundaries with one-click retry actions`,
        ],
        sampleAnswerFramework: `Walk through how you type API responses in ${secondarySkill}, prevent out-of-order responses from overwriting newer UI state, and maintain WCAG keyboard accessibility.`,
      },
      {
        id: `fe_tech_3_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Advanced',
        focusArea: `Bridging Skill Gap: ${primaryGap} & ${secondaryGap}`,
        question: `Our ${cleanJobTitle} stack relies heavily on ${primaryGap} and ${secondaryGap}, which are currently flagged as skill gaps on your resume. How would you leverage your existing mastery of ${primarySkill} and ${secondarySkill} to build production features with ${primaryGap}?`,
        whyAsked: `Probes how quickly ${cleanCandidate} can bridge the "${primaryGap}" gap identified by the ATS analyzer.`,
        expectedKeyPoints: [
          `Map ${primaryGap} component/data patterns directly to concepts you already know in ${primarySkill}`,
          `Optimize bundle splitting, lazy loading, and asset caching for fast First Contentful Paint`,
          `Write automated component integration tests (Vitest / Testing Library) to verify behavior`,
        ],
        sampleAnswerFramework: `Use the Bridge Method: emphasize your strong foundation in ${skillsList.slice(0, 2).join(' & ')}, explain the exact architectural role ${primaryGap} plays, and outline how you structure and test it.`,
      },
      {
        id: `fe_behav_1_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Core',
        focusArea: 'Product & Design Trade-off Negotiation',
        question: `Tell me about a time when a designer or product manager requested a complex frontend interaction that risked delaying the sprint or hurting performance. How did you handle it?`,
        whyAsked: `Assesses product empathy, communication clarity, and pragmatic frontend engineering judgment.`,
        expectedKeyPoints: [
          `Demonstrate the performance or timeline impact with objective browser metrics`,
          `Propose a creative 80/20 UI alternative that preserves user delight while shipping on schedule`,
          `Partner with design to validate the final experience with end users`,
        ],
        sampleAnswerFramework: `Use the STAR framework (Situation, Task, Action, Result): show how you collaborated with design using a live prototype in ${primarySkill} to ship on time without sacrificing UX quality.`,
      },
      {
        id: `fe_behav_2_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Intermediate',
        focusArea: 'Debugging Cross-Browser & Production UI Bugs',
        question: `Describe a challenging frontend bug or layout regression you encountered in production. How did you isolate the root cause and prevent it from happening again?`,
        whyAsked: `Evaluates debugging methodology, ownership, and automated testing culture.`,
        expectedKeyPoints: [
          `Reproduce the issue deterministically using network throttling or device emulation`,
          `Trace state mutations and CSS stacking/layout contexts systematically`,
          `Add an automated E2E or component regression test before closing the ticket`,
        ],
        sampleAnswerFramework: `Share a concrete story where a subtle async state or CSS issue occurred, explain how you fixed it using ${primarySkill}, and highlight the guardrail you added to CI.`,
      },
      {
        id: `fe_behav_3_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Advanced',
        focusArea: `Rapidly Mastering ${primaryGap} Under Pressure`,
        question: `Tell me about a time you had to rapidly learn a new frontend framework or tool (like ${primaryGap}) to deliver a high-visibility feature.`,
        whyAsked: `Validates continuous learning velocity and adaptability for ${cleanJobTitle}.`,
        expectedKeyPoints: [
          `Build a focused vertical slice proof-of-concept before writing production code`,
          `Request early architecture review from senior engineers to confirm best practices`,
          `Document reusable patterns for the rest of the frontend team`,
        ],
        sampleAnswerFramework: `Highlight how you combined your ${primarySkill} background with official documentation to ship a production-grade feature ahead of deadline.`,
      },
    ];
  }

  // 2. BACKEND NODE.JS & API ENGINEER
  if (lowerJob.includes('backend') || lowerJob.includes('node') || lowerJob.includes('api')) {
    return [
      {
        id: `be_tech_1_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Core',
        focusArea: `Event-Loop Concurrency & High-Throughput APIs (${primarySkill})`,
        question: `Given ${cleanCandidate}'s background in ${skillsList.slice(0, 3).join(', ')}, how would you design a ${cleanJobTitle} microservice that processes 20,000+ concurrent requests without blocking the event loop or exhausting database connections?`,
        whyAsked: `Tests core backend scalability, non-blocking I/O, and backpressure handling.`,
        expectedKeyPoints: [
          `Offload CPU-heavy work (cryptography, parsing, ML) to Worker Threads or message queues`,
          `Configure connection pooling, cursor-based pagination, and Redis caching`,
          `Enforce rate limiting, request timeouts, and idempotency keys on mutating endpoints`,
        ],
        sampleAnswerFramework: `Explain how you structure stateless API controllers with ${primarySkill}, protect the database layer under burst traffic, and monitor P95/P99 latency.`,
      },
      {
        id: `be_tech_2_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Intermediate',
        focusArea: `Database Indexing, Transactions & ${primaryGap}`,
        question: `Your resume profile highlights ${primaryGap} and ${secondaryGap} as target skills for ${cleanJobTitle}. How do you optimize slow database queries, design composite indexes, and guarantee data integrity across multi-step writes?`,
        whyAsked: `Evaluates database engineering depth, query execution plans, and ACID transaction safety.`,
        expectedKeyPoints: [
          `Inspect query plans (EXPLAIN ANALYZE) to eliminate full-collection/table scans`,
          `Order composite index columns by equality predicates first, then sort/range predicates`,
          `Use database transactions and optimistic locking to prevent race conditions`,
        ],
        sampleAnswerFramework: `Walk through a slow API endpoint you optimized: state the original query time, the index or schema change you applied, and the resulting throughput gain.`,
      },
      {
        id: `be_tech_3_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Advanced',
        focusArea: 'API Security, Auth & Zero-Downtime Migrations',
        question: `As a ${cleanJobTitle}, how do you secure REST endpoints against injection/replay attacks and perform zero-downtime schema migrations on live production tables?`,
        whyAsked: `Probes production security engineering and operational reliability.`,
        expectedKeyPoints: [
          `Hash credentials with salted PBKDF2/Argon2 and validate payloads with strict schemas`,
          `Execute 3-phase Expand -> Backfill -> Contract migrations so old and new code run safely side-by-side`,
          `Emit structured audit logs with correlation IDs for security traceability`,
        ],
        sampleAnswerFramework: `Detail how you separate schema expansion from code deployment to guarantee zero downtime during live traffic.`,
      },
      {
        id: `be_behav_1_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Core',
        focusArea: 'Production Outage & Latency Triage',
        question: `Tell me about a time a backend service or API you maintained experienced an outage, memory leak, or severe latency spike. How did you diagnose and resolve it?`,
        whyAsked: `Assesses incident response calm, systematic debugging, and ownership.`,
        expectedKeyPoints: [
          `Restore service availability first (rollback, circuit breaker, or read-replica routing)`,
          `Correlate application logs, CPU/heap profiles, and slow-query metrics`,
          `Lead a blameless post-mortem and add automated alerting to prevent recurrence`,
        ],
        sampleAnswerFramework: `Use STAR: describe the production symptom, how you isolated the root cause using ${primarySkill}, and the permanent architectural fix you shipped.`,
      },
      {
        id: `be_behav_2_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Intermediate',
        focusArea: 'Cross-Team API Contract Alignment',
        question: `Describe a situation where frontend or mobile consumers needed API changes under a tight deadline. How did you design the contract and avoid breaking existing clients?`,
        whyAsked: `Evaluates API versioning discipline and cross-functional collaboration.`,
        expectedKeyPoints: [
          `Agree on an OpenAPI/JSON contract upfront and provide mock payloads immediately`,
          `Maintain backward compatibility by adding optional fields rather than mutating existing keys`,
          `Communicate deprecation timelines clearly across engineering squads`,
        ],
        sampleAnswerFramework: `Show how you unblocked frontend teammates on day one with a clear API contract while building the backend logic in parallel.`,
      },
      {
        id: `be_behav_3_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Advanced',
        focusArea: 'Refactoring Legacy Backend Systems',
        question: `Share an example of when you identified a brittle backend module or technical debt in ${primarySkill} and successfully led its refactoring.`,
        whyAsked: `Validates architectural stewardship and ability to justify engineering investments.`,
        expectedKeyPoints: [
          `Quantify the business risk (error rates, slow onboarding, or high cloud cost)`,
          `Use feature flags or shadow traffic to verify parity between legacy and refactored code`,
          `Measure the improvement in deployment confidence and latency`,
        ],
        sampleAnswerFramework: `Explain the legacy bottleneck, how you migrated traffic safely in phases, and the measurable reduction in production incidents.`,
      },
    ];
  }

  // 3. PYTHON DATA SCIENTIST & ML ENGINEER
  if (lowerJob.includes('python') || lowerJob.includes('data') || lowerJob.includes('ml') || lowerJob.includes('ai')) {
    return [
      {
        id: `ds_tech_1_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Core',
        focusArea: `Feature Engineering & Leakage Prevention (${primarySkill})`,
        question: `Your resume highlights ${skillsList.slice(0, 3).join(', ')}. For a ${cleanJobTitle} role, how do you build an end-to-end feature engineering pipeline and guarantee zero target or temporal leakage between training and inference?`,
        whyAsked: `Tests core Machine Learning & Data Science rigor, validation splitting, and reproducibility.`,
        expectedKeyPoints: [
          `Fit all scalers, imputers, and embeddings strictly on the training split inside cross-validation pipelines`,
          `Use time-based splitting for temporal data rather than random k-fold shuffling`,
          `Vectorize data transformations to scale cleanly across millions of records`,
        ],
        sampleAnswerFramework: `Reference your resume skill in ${thirdSkill}: explain how you structured your preprocessing pipeline, validated out-of-sample generalization, and prevented train-test contamination.`,
      },
      {
        id: `ds_tech_2_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Intermediate',
        focusArea: 'Model Evaluation Rubrics & Concept Drift',
        question: `When deploying a classification or ranking model for ${cleanJobTitle}, how do you calibrate decision thresholds for imbalanced classes and detect data/concept drift in production?`,
        whyAsked: `Evaluates ability to connect statistical metrics (Precision/Recall, PR-AUC) to real business KPIs.`,
        expectedKeyPoints: [
          `Optimize PR-AUC and F-beta scores based on the asymmetric business cost of False Positives vs. False Negatives`,
          `Monitor feature distribution drift (PSI / KL-Divergence) and prediction confidence shifts`,
          `Implement automated shadow-model evaluation and retraining pipelines`,
        ],
        sampleAnswerFramework: `Walk through how you translated business requirements into a custom evaluation metric and set up post-deployment drift alerts.`,
      },
      {
        id: `ds_tech_3_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Advanced',
        focusArea: `Production MLOps & Bridging ${primaryGap}`,
        question: `Our ${cleanJobTitle} team serves real-time predictions using ${primaryGap} and ${secondaryGap}. How would you productionize a model trained with your ${primarySkill} stack so it meets a <100ms P99 latency SLA?`,
        whyAsked: `Probes how ${cleanCandidate} bridges data science modeling with production engineering (${primaryGap}).`,
        expectedKeyPoints: [
          `Pre-compute heavy aggregations in a feature store and keep online inference lightweight`,
          `Package model weights with deterministic dependency locking and health-check endpoints`,
          `Provide graceful fallback heuristics if the model server experiences saturation`,
        ],
        sampleAnswerFramework: `Use the Bridge Method: connect your ${skillsList.slice(0, 2).join(' & ')} skills to production API serving, caching, and latency profiling.`,
      },
      {
        id: `ds_behav_1_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Core',
        focusArea: 'Communicating Data Insights to Executives',
        question: `Tell me about a time when you had to present complex ML or statistical findings to non-technical stakeholders. How did you ensure your insights drove a concrete product decision?`,
        whyAsked: `Assesses storytelling with data, business acumen, and executive communication.`,
        expectedKeyPoints: [
          `Lead with the headline business impact and actionable recommendation first`,
          `Translate probability scores into clear customer scenarios and visual trade-offs`,
          `Proactively address data limitations and ethical/fairness considerations`,
        ],
        sampleAnswerFramework: `Use STAR: describe the business problem, how you distilled your ${primarySkill} analysis into a clear recommendation, and the measurable outcome.`,
      },
      {
        id: `ds_behav_2_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Intermediate',
        focusArea: 'Overcoming Noisy or Incomplete Datasets',
        question: `Describe a project where the raw data was messy, biased, or missing key labels. How did you diagnose the data quality issues and still deliver a reliable solution?`,
        whyAsked: `Tests practical data intuition and resilience when working with real-world telemetry.`,
        expectedKeyPoints: [
          `Perform exploratory data auditing to distinguish systemic logging bugs from natural variance`,
          `Use weak supervision, stratified sampling, or domain heuristics to establish a clean baseline`,
          `Partner with upstream engineering teams to fix telemetry schemas at the source`,
        ],
        sampleAnswerFramework: `Share a specific dataset challenge, the diagnostic checks you ran, and how your cleaned baseline outperformed complex models trained on noisy data.`,
      },
      {
        id: `ds_behav_3_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Advanced',
        focusArea: 'Pivoting When a Model Hypothesis Fails',
        question: `Tell me about a time when an ML model or analytical approach you invested in did not beat the baseline. How did you diagnose why and pivot?`,
        whyAsked: `Evaluates scientific discipline, error-analysis habits, and pragmatism.`,
        expectedKeyPoints: [
          `Conduct systematic error analysis on worst-performing data slices`,
          `Prioritize feature quality and domain signals over model complexity`,
          `Communicate findings transparently and pivot quickly to the highest-ROI approach`,
        ],
        sampleAnswerFramework: `Explain the initial hypothesis, what slice-level error analysis revealed, and how pivoting to better features solved the problem.`,
      },
    ];
  }

  // 4. CLOUD DEVOPS & SRE ARCHITECT
  if (lowerJob.includes('cloud') || lowerJob.includes('devops') || lowerJob.includes('sre')) {
    return [
      {
        id: `ops_tech_1_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Core',
        focusArea: `Containerization, Kubernetes & ${primarySkill}`,
        question: `For a ${cleanJobTitle} role, how do you containerize applications built with ${skillsList.slice(0, 2).join(' and ')}, configure liveness/readiness probes, and enforce zero-downtime rolling deployments?`,
        whyAsked: `Tests production container orchestration, security hardening, and high-availability design.`,
        expectedKeyPoints: [
          `Build minimal multi-stage Docker images running as non-root users`,
          `Configure readiness probes to drain traffic cleanly before pod termination (SIGTERM handling)`,
          `Set resource requests/limits and Horizontal Pod Autoscalers (HPA) to handle traffic spikes`,
        ],
        sampleAnswerFramework: `Walk through how you package a ${primarySkill} service, tune health checks to prevent cascading restarts, and verify zero dropped requests during deploys.`,
      },
      {
        id: `ops_tech_2_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Intermediate',
        focusArea: `CI/CD Pipelines & Infrastructure as Code (${primaryGap})`,
        question: `How do you architect automated CI/CD pipelines (using ${primarySkill}, Git, and ${primaryGap}) so every pull request runs deterministic tests, security scans, and automated canary rollbacks?`,
        whyAsked: `Evaluates DevOps automation, supply-chain security, and deployment velocity.`,
        expectedKeyPoints: [
          `Promote immutable, signed build artifacts from staging to production`,
          `Gate canary traffic shifts on real-time error-rate and latency metrics`,
          `Manage infrastructure state declaratively with zero manual console drift`,
        ],
        sampleAnswerFramework: `Describe how you structured a CI/CD pipeline using ${skillsList.slice(0, 2).join(' & ')}, cut build times via caching, and automated rollback safety.`,
      },
      {
        id: `ops_tech_3_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Advanced',
        focusArea: 'SLOs, Error Budgets & Distributed Observability',
        question: `How do you establish SLIs/SLOs and instrument distributed tracing, metrics, and structured logging across a multi-service cloud architecture?`,
        whyAsked: `Probes Site Reliability Engineering (SRE) fundamentals and MTTR reduction.`,
        expectedKeyPoints: [
          `Monitor the Four Golden Signals (Latency, Traffic, Errors, Saturation)`,
          `Propagate W3C trace context headers across services and database calls`,
          `Use multi-window error-budget burn-rate alerts to eliminate alert fatigue`,
        ],
        sampleAnswerFramework: `Explain how you define user-centric SLOs, correlate traces with deployment events, and use error budgets to balance reliability with feature velocity.`,
      },
      {
        id: `ops_behav_1_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Core',
        focusArea: 'Leading High-Severity Incident Response',
        question: `Describe a critical production incident or deployment failure you helped resolve. How did you manage triage, communication, and follow-up remediation?`,
        whyAsked: `Assesses composure under fire and structured incident command.`,
        expectedKeyPoints: [
          `Mitigate customer impact immediately via rollback or traffic failover before deep-diving root cause`,
          `Maintain clear, timestamped status updates for engineering and leadership`,
          `Convert post-mortem findings into automated chaos or regression checks`,
        ],
        sampleAnswerFramework: `Use STAR: detail how you detected the anomaly, restored service rapidly, and engineered permanent guardrails.`,
      },
      {
        id: `ops_behav_2_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Intermediate',
        focusArea: 'Automating Repetitive Operational Toil',
        question: `Tell me about a time you eliminated manual operational toil or sped up developer workflows using ${primarySkill} automation.`,
        whyAsked: `Validates core SRE mindset of solving operational problems through software.`,
        expectedKeyPoints: [
          `Baseline the time wasted and human-error risk of the manual process`,
          `Deliver a self-service script or CI workflow with clear documentation`,
          `Quantify the reduction in deployment lead time or support tickets`,
        ],
        sampleAnswerFramework: `Highlight the manual bottleneck, how you automated it with ${primarySkill}, and the hours saved per sprint.`,
      },
      {
        id: `ops_behav_3_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Advanced',
        focusArea: 'Cloud Cost & Performance Optimization',
        question: `Share an example of how you analyzed resource utilization or system bottlenecks and improved efficiency without sacrificing reliability.`,
        whyAsked: `Tests architectural efficiency and FinOps/performance awareness.`,
        expectedKeyPoints: [
          `Profile actual CPU/memory/query utilization under peak vs. off-peak load`,
          `Right-size instances, add caching, or tune autoscaling thresholds`,
          `Verify that P99 latency and availability SLAs remain rock-solid`,
        ],
        sampleAnswerFramework: `Show how you used telemetry data to identify over-provisioned or inefficient resources and delivered measurable cost/latency savings.`,
      },
    ];
  }

  // 5. PRODUCT & TECHNICAL ENGINEERING LEAD
  if (lowerJob.includes('lead') || lowerJob.includes('product') || lowerJob.includes('manager') || lowerJob.includes('architect')) {
    return [
      {
        id: `ld_tech_1_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Core',
        focusArea: `System Architecture & Technical Strategy (${primarySkill})`,
        question: `Stepping into a ${cleanJobTitle} role with your background in ${skillsList.slice(0, 3).join(', ')}, how do you evaluate architectural trade-offs (monolith vs. modular services, build vs. buy) when launching a new product line?`,
        whyAsked: `Evaluates staff/lead-level architectural judgment aligned with business velocity.`,
        expectedKeyPoints: [
          `Start with a modular monolith or clean domain boundaries before introducing distributed complexity`,
          `Align technology choices (${primarySkill}, ${primaryGap}) with team expertise and operational maturity`,
          `Document Architecture Decision Records (ADRs) with explicit pros, cons, and exit strategies`,
        ],
        sampleAnswerFramework: `Walk through an architectural decision you drove: explain the business constraints, the alternatives evaluated, and why your chosen design scaled cleanly.`,
      },
      {
        id: `ld_tech_2_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Intermediate',
        focusArea: `Full-Stack Quality Gates & Bridging ${primaryGap}`,
        question: `How do you establish engineering quality standards across both ${primarySkill} and ${primaryGap} so a growing team ships fast without accumulating crippling technical debt?`,
        whyAsked: `Tests technical leadership, code-review standards, and platform governance.`,
        expectedKeyPoints: [
          `Automate formatting, strict typing (${secondarySkill}), and contract tests in CI so code reviews focus on architecture`,
          `Define clear API contracts and performance budgets (LCP, API P95) upfront`,
          `Allocate dedicated sprint capacity (e.g., 15–20%) for reliability and tech-debt paydown`,
        ],
        sampleAnswerFramework: `Explain how you combine automated guardrails with constructive mentorship to raise the engineering bar across the whole squad.`,
      },
      {
        id: `ld_tech_3_${variationSeed}`,
        category: 'Technical',
        difficulty: 'Advanced',
        focusArea: 'High-Scale System Reliability & Security Architecture',
        question: `As a ${cleanJobTitle}, how do you review a system design for single points of failure, data privacy compliance, and graceful degradation under 10x traffic surges?`,
        whyAsked: `Probes principal-level threat modeling and fault-tolerant systems design.`,
        expectedKeyPoints: [
          `Identify synchronous bottlenecks and introduce circuit breakers, caching, and queues`,
          `Enforce principle of least privilege, encryption, and audit trails across all data stores`,
          `Run game-days or load tests prior to major product launches`,
        ],
        sampleAnswerFramework: `Trace a critical user journey end-to-end, pointing out how each tier degrades gracefully if a downstream dependency fails.`,
      },
      {
        id: `ld_behav_1_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Core',
        focusArea: 'Leading Ambiguous Cross-Functional Initiatives',
        question: `Tell me about a time you led an ambiguous, high-stakes technical initiative from initial product concept to production launch. How did you align engineering, product, and leadership?`,
        whyAsked: `Assesses technical leadership, roadmap decomposition, and execution ownership.`,
        expectedKeyPoints: [
          `Break ambiguous product goals into incremental, testable milestones`,
          `Surface technical risks early and de-risk them with targeted prototypes`,
          `Keep stakeholders aligned with transparent demos and delivery metrics`,
        ],
        sampleAnswerFramework: `Use STAR: highlight how you structured the roadmap, unblocked your team using ${primarySkill}, and delivered measurable product impact.`,
      },
      {
        id: `ld_behav_2_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Intermediate',
        focusArea: 'Mentoring Engineers & Elevating Team Culture',
        question: `Describe how you have mentored junior or mid-level engineers or helped a teammate overcome a complex technical roadblock in ${primarySkill} or ${secondarySkill}.`,
        whyAsked: `Evaluates force-multiplier leadership and coaching empathy.`,
        expectedKeyPoints: [
          `Pair-program and ask guiding architectural questions rather than just writing the code for them`,
          `Create reusable runbooks, starter templates, and architecture diagrams`,
          `Celebrate growth and foster psychological safety in code reviews`,
        ],
        sampleAnswerFramework: `Share a specific mentoring story where your guidance helped a teammate independently ship a complex feature and level up their skills.`,
      },
      {
        id: `ld_behav_3_${variationSeed}`,
        category: 'Behavioral',
        difficulty: 'Advanced',
        focusArea: 'Navigating Roadmap Pushback & Scope Trade-offs',
        question: `Tell me about a time when leadership asked for an aggressive deadline that put system stability or team burnout at risk. How did you negotiate a realistic plan?`,
        whyAsked: `Tests executive presence, data-backed negotiation, and commitment to sustainable pace.`,
        expectedKeyPoints: [
          `Present clear options (e.g., Phase 1 MVP on target date vs. full scope 2 sprints later) with explicit trade-offs`,
          `Never compromise silently on security or production stability`,
          `Deliver the agreed Phase 1 milestone with 100% reliability`,
        ],
        sampleAnswerFramework: `Show how you reframed "no" into "here is how we hit the business goal safely in two phases" backed by engineering estimates.`,
      },
    ];
  }

  // 6. FULL STACK SOFTWARE ENGINEER (AND ANY CUSTOM JOB TITLE)
  return [
    {
      id: `fs_tech_1_${variationSeed}`,
      category: 'Technical',
      difficulty: 'Core',
      focusArea: `End-to-End Architecture (${primarySkill} & ${secondarySkill})`,
      question: `On your resume, ${cleanCandidate} demonstrates proficiency in ${skillsList.slice(0, 3).join(', ')}. For a ${cleanJobTitle} role, walk me through how you architect a complete feature from database schema and API controller down to reactive client state.`,
      whyAsked: `Verifies holistic ${cleanJobTitle} capabilities and clean separation of concerns across the stack.`,
      expectedKeyPoints: [
        `Design normalized, indexed data models and enforce strict validation at the API boundary`,
        `Manage optimistic UI updates, loading states, and error recovery in ${primarySkill}`,
        `Maintain end-to-end type safety (${secondarySkill}) and sub-200ms P95 API latency`,
      ],
      sampleAnswerFramework: `Pick a flagship project from your resume. Trace a single user interaction from the client UI through the API layer to the database and back.`,
    },
    {
      id: `fs_tech_2_${variationSeed}`,
      category: 'Technical',
      difficulty: 'Advanced',
      focusArea: `Bridging Skill Gap: ${primaryGap} & ${secondaryGap}`,
      question: `Our ${cleanJobTitle} team relies on ${primaryGap} and ${secondaryGap}, which are currently listed as skill gaps on your resume. How would you integrate ${primaryGap} with your existing ${primarySkill} and ${secondarySkill} workflow?`,
      whyAsked: `Evaluates how quickly ${cleanCandidate} can bridge the "${primaryGap}" gap for ${cleanJobTitle}.`,
      expectedKeyPoints: [
        `Connect ${primaryGap} directly to architectural patterns you already master in ${primarySkill}`,
        `Outline error handling, security boundaries, and local testing strategies`,
        `Demonstrate a structured 30-day technical ramp-up plan`,
      ],
      sampleAnswerFramework: `Use the Bridge Method: highlight your verified foundation in ${skillsList.slice(0, 2).join(' & ')}, explain the exact problem ${primaryGap} solves, and walk through how you would implement it.`,
    },
    {
      id: `fs_tech_3_${variationSeed}`,
      category: 'Technical',
      difficulty: 'Intermediate',
      focusArea: `Full-Stack Performance & Bottleneck Debugging`,
      question: `Suppose a high-traffic ${cleanJobTitle} application built with ${skillsList.slice(0, 2).join(' and ')} experiences slow initial load times and intermittent API timeouts under peak load. How do you isolate and fix the root cause?`,
      whyAsked: `Tests end-to-end debugging across browser waterfalls, network payloads, and backend queries.`,
      expectedKeyPoints: [
        `Isolate whether latency is in frontend bundle execution, network payload size, or backend DB queries`,
        `Apply database indexing, response pagination/caching, and frontend code-splitting`,
        `Add automated performance budgets and regression tests in CI`,
      ],
      sampleAnswerFramework: `Structure chronologically: 1) Telemetry & waterfall triage, 2) Targeted backend/frontend optimization, and 3) Quantified P95 latency reduction.`,
    },
    {
      id: `fs_behav_1_${variationSeed}`,
      category: 'Behavioral',
      difficulty: 'Core',
      focusArea: 'End-to-End Ownership & Pragmatic Trade-offs',
      question: `Tell me about a time you owned a complex feature end-to-end using ${primarySkill} under a tight deadline. What architectural trade-offs did you make to ship on time?`,
      whyAsked: `Assesses pragmatic engineering judgment, stakeholder communication, and ownership for ${cleanJobTitle}.`,
      expectedKeyPoints: [
        `Clearly articulate the user problem and business deadline constraint`,
        `Show how you protected core reliability and security while scoping non-essential polish`,
        `Explain how you tracked and paid down any resulting technical debt`,
      ],
      sampleAnswerFramework: `Use STAR (Situation, Task, Action, Result) and reference your resume strength: "${strengthsList[0]}".`,
    },
    {
      id: `fs_behav_2_${variationSeed}`,
      category: 'Behavioral',
      difficulty: 'Intermediate',
      focusArea: 'Resolving Technical Disagreements in Code Review',
      question: `Describe a situation where you and a teammate disagreed on an implementation or architecture approach for a ${cleanJobTitle} deliverable. How did you resolve it?`,
      whyAsked: `Evaluates collaborative maturity, data-driven decision-making, and team culture fit.`,
      expectedKeyPoints: [
        `Focus on objective engineering metrics (latency, readability, testability) over personal preference`,
        `Build a quick benchmark or prototype to compare both options fairly`,
        `Align on a shared decision and document the team standard`,
      ],
      sampleAnswerFramework: `Frame the story around objective criteria, show how you collaborated on a benchmark using ${primarySkill}, and highlight the positive team outcome.`,
    },
    {
      id: `fs_behav_3_${variationSeed}`,
      category: 'Behavioral',
      difficulty: 'Advanced',
      focusArea: `Rapid Learning & Adaptability (${primaryGap})`,
      question: `Looking at the requirements for ${cleanJobTitle}, tell me about a time you had to rapidly master an unfamiliar technology (similar to ${primaryGap}) to unblock a project.`,
      whyAsked: `Validates growth mindset and ability to thrive across evolving full-stack requirements.`,
      expectedKeyPoints: [
        `Break down documentation into a working vertical-slice prototype within days`,
        `Validate security and edge cases through peer code reviews`,
        `Quantify the final impact on project delivery`,
      ],
      sampleAnswerFramework: `Share a concrete milestone where you learned a new tool from scratch, integrated it with ${primarySkill}, and shipped it to production.`,
    },
  ];
}

export const InterviewMockSimulator: React.FC<InterviewMockSimulatorProps> = ({
  activeUser,
  currentAnalysis,
  onNavigate,
}) => {
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>(
    JOB_TITLE_OPTIONS.includes(currentAnalysis.targetRole)
      ? currentAnalysis.targetRole
      : 'Full Stack Software Engineer'
  );
  const [customJobTitle, setCustomJobTitle] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'Technical' | 'Behavioral'>('ALL');
  const [variationSeed, setVariationSeed] = useState<number>(0);

  const effectiveJobTitle = customJobTitle.trim() || selectedJobTitle;

  // Initialize immediately with role-specific questions so the deck is never empty or stuck on All (0)
  const [questions, setQuestions] = useState<MockInterviewQuestion[]>(() =>
    buildRoleQuestionDeck(
      JOB_TITLE_OPTIONS.includes(currentAnalysis.targetRole)
        ? currentAnalysis.targetRole
        : 'Full Stack Software Engineer',
      activeUser.name,
      currentAnalysis.skillsDetected,
      currentAnalysis.missingSkills,
      currentAnalysis.strengths,
      0
    )
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [engineSource, setEngineSource] = useState<string>('AI Role-Tailored Engine');
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    questions[0]?.id || null
  );
  const [generationBanner, setGenerationBanner] = useState<string | null>(null);

  // Per-User Scoped Interactive Practice Response & Self-Evaluation State
  const userScopeKey = `${activeUser.name.trim().toLowerCase()}__${activeUser.email.trim().toLowerCase()}`;
  const getScopedKey = (questionId: string) => `${userScopeKey}::${questionId}`;

  const [draftResponses, setDraftResponses] = useState<Record<string, string>>({});
  const [evaluatedFeedback, setEvaluatedFeedback] = useState<
    Record<
      string,
      {
        score: number;
        statusLabel: string;
        feedback: string;
        matchedPoints: number;
        checkpointHits: boolean[];
      }
    >
  >({});

  // Whenever the selected job title, active user, or resume skills change, immediately populate role-specific questions
  const syncQuestionsForJobTitle = useCallback(
    async (roleToUse: string, nextSeed: number, showNotice = false) => {
      const cleanRole = roleToUse.trim() || 'Full Stack Software Engineer';

      // 1. Immediately set tailored role-specific questions so UI updates in 0ms
      const instantDeck = buildRoleQuestionDeck(
        cleanRole,
        activeUser.name,
        currentAnalysis.skillsDetected,
        currentAnalysis.missingSkills,
        currentAnalysis.strengths,
        nextSeed
      );
      setQuestions(instantDeck);
      setActiveQuestionId(instantDeck[0]?.id || null);

      if (showNotice) {
        setIsLoading(true);
      }

      // 2. Also call backend /api/v1/interview/generate to check for server/AI enrichment
      try {
        const res = await fetch('/api/v1/interview/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle: cleanRole,
            candidateName: activeUser.name,
            skillsDetected: currentAnalysis.skillsDetected,
            missingSkills: currentAnalysis.missingSkills,
            strengths: currentAnalysis.strengths,
            resumeSummary: currentAnalysis.summaryText,
            questionCount: 6,
          }),
        });
        const data = await res.json();
        if (
          res.ok &&
          Array.isArray(data.questions) &&
          data.questions.length > 0 &&
          data.source === 'gemini-3.8-flash'
        ) {
          setQuestions(data.questions);
          setEngineSource('gemini-3.8-flash');
          setActiveQuestionId(data.questions[0].id);
        } else {
          setEngineSource('Resume + Role Tailored AI');
        }
      } catch {
        setEngineSource('Resume + Role Tailored AI');
      } finally {
        setIsLoading(false);
        if (showNotice) {
          setGenerationBanner(
            `Generated 6 tailored Technical & Behavioral questions for "${cleanRole}" based on ${activeUser.name}'s resume!`
          );
          setTimeout(() => setGenerationBanner(null), 3500);
        }
      }
    },
    [
      activeUser.name,
      currentAnalysis.skillsDetected,
      currentAnalysis.missingSkills,
      currentAnalysis.strengths,
      currentAnalysis.summaryText,
    ]
  );

  useEffect(() => {
    syncQuestionsForJobTitle(effectiveJobTitle, variationSeed, false);
  }, [selectedJobTitle, activeUser.name, activeUser.email, currentAnalysis.id]);

  const buildModelAnswerForQuestion = (q: MockInterviewQuestion): string => {
    return `In my work as a ${effectiveJobTitle} utilizing ${currentAnalysis.skillsDetected
      .slice(0, 3)
      .join(', ')}, I approach ${q.focusArea} systematically: First, I ${
      q.expectedKeyPoints[0] || ''
    }. Second, I ${q.expectedKeyPoints[1] || ''}. Third, I ${
      q.expectedKeyPoints[2] || ''
    }. As a result, this architecture reduced P95 latency by 42% and scaled reliably across 25,000+ concurrent requests.`;
  };

  const handleEvaluateAnswer = (questionObj: MockInterviewQuestion) => {
    const scopedKey = getScopedKey(questionObj.id);
    const answerText = (draftResponses[scopedKey] || '').trim();
    if (!answerText) return;

    const STOP_WORDS = new Set([
      'about',
      'above',
      'across',
      'after',
      'again',
      'against',
      'always',
      'among',
      'around',
      'because',
      'before',
      'behind',
      'being',
      'below',
      'between',
      'both',
      'build',
      'clear',
      'close',
      'could',
      'create',
      'deliver',
      'describe',
      'direct',
      'directly',
      'during',
      'early',
      'ensure',
      'every',
      'explain',
      'first',
      'focus',
      'focused',
      'follow',
      'found',
      'from',
      'given',
      'great',
      'handle',
      'having',
      'heavy',
      'helps',
      'into',
      'large',
      'later',
      'learn',
      'level',
      'light',
      'local',
      'maintain',
      'manage',
      'measure',
      'model',
      'models',
      'never',
      'other',
      'order',
      'outline',
      'partner',
      'patterns',
      'phase',
      'place',
      'point',
      'points',
      'prior',
      'prefer',
      'prevent',
      'propose',
      'provide',
      'quickly',
      'rapid',
      'rapidly',
      'rather',
      'ready',
      'request',
      'right',
      'safely',
      'scale',
      'senior',
      'share',
      'short',
      'should',
      'shown',
      'single',
      'small',
      'split',
      'start',
      'state',
      'states',
      'steps',
      'still',
      'store',
      'strict',
      'strictly',
      'strong',
      'style',
      'system',
      'teams',
      'their',
      'there',
      'these',
      'thing',
      'things',
      'think',
      'three',
      'through',
      'tight',
      'times',
      'total',
      'trace',
      'track',
      'trade',
      'train',
      'under',
      'until',
      'update',
      'updates',
      'using',
      'valid',
      'validate',
      'value',
      'values',
      'verify',
      'where',
      'which',
      'while',
      'whole',
      'without',
      'would',
      'write',
      'writing',
      'wrong',
    ]);

    const lowerAnswer = answerText.toLowerCase();
    const tokens = lowerAnswer.split(/[^a-z0-9#+.%-]+/).filter(Boolean);
    const words = answerText.split(/\s+/).filter(Boolean).length;

    // 1. Detect explicit non-answers, refusals, gibberish, or trivial 1-word wrong inputs
    const cleanAlphaOnly = lowerAnswer.replace(/[^a-z\s']/g, '').trim();
    const isExplicitNonAnswer =
      /^(idk|i don'?t know|dont know|do not know|no idea|not sure|nothing|none|null|undefined|wrong|wrong answer|incorrect|bad|pass|skip|na|n\/a|test|testing|hello|hi|hey|yes|no|ok|okay|random|asdf+|qwerty+|123+|abc+|xyz+|blah+|whatever)$/i.test(
        cleanAlphaOnly
      ) ||
      tokens.length === 0 ||
      (tokens.length === 1 && tokens[0].length < 5) ||
      /^(.)\1{4,}$/.test(cleanAlphaOnly.replace(/\s+/g, ''));

    const extractTechnicalKeywords = (text: string): string[] => {
      return text
        .toLowerCase()
        .split(/[^a-z0-9#+.-]+/)
        .map((w) => w.replace(/^[.-]+|[.-]+$/g, ''))
        .filter((w) => w.length >= 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
    };

    const answerMatchesKeyword = (kw: string): boolean => {
      if (!kw || kw.length < 3) return false;
      if (lowerAnswer.includes(kw)) return true;
      // Stem match for 5+ char technical terms (e.g. memoize <-> memoization, index <-> indexing, container <-> containerize)
      if (kw.length >= 5) {
        const stem = kw.slice(0, 5);
        return tokens.some((t) => t.length >= 4 && t.startsWith(stem));
      }
      return false;
    };

    // 2. Evaluate each Expected Rubric Checkpoint individually
    let totalCheckpointKeywordHits = 0;
    const checkpointHits: boolean[] = questionObj.expectedKeyPoints.map((pt) => {
      const kws = extractTechnicalKeywords(pt);
      const matchedInPt = kws.filter((kw) => answerMatchesKeyword(kw));
      totalCheckpointKeywordHits += matchedInPt.length;
      // A checkpoint is considered addressed if at least 1 core technical keyword (or 2 if checkpoint has many words) is matched
      return matchedInPt.length >= 1;
    });

    const matchedPoints = checkpointHits.filter(Boolean).length;

    // 3. Check Topic & Resume Skill Relevance
    const topicKeywords = Array.from(
      new Set([
        ...extractTechnicalKeywords(questionObj.focusArea),
        ...extractTechnicalKeywords(questionObj.question),
        ...currentAnalysis.skillsDetected.map((s) => s.toLowerCase().trim()),
        ...currentAnalysis.missingSkills.map((s) => s.toLowerCase().trim()),
      ])
    ).filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

    const topicHitCount = topicKeywords.filter((kw) => answerMatchesKeyword(kw)).length;

    const hasMetrics =
      /\d+%|\d+x|\b\d+\s*(ms|sec|s|mins|hours|days|users|requests|rps|qps|mb|gb|tb|p95|p99|sla)\b/i.test(
        answerText
      );
    const hasReasoningStructure =
      /\b(because|therefore|resulted|reduced|improved|optimized|architected|implemented|measured|diagnosed|refactored|situation|action|result)\b/i.test(
        lowerAnswer
      );

    let computedScore = 0;
    let statusLabel = 'Incorrect / Off-Topic Answer';
    let feedback = '';

    const missedCheckpoints = questionObj.expectedKeyPoints.filter((_, idx) => !checkpointHits[idx]);

    if (isExplicitNonAnswer || (matchedPoints === 0 && topicHitCount === 0)) {
      // Truly incorrect, irrelevant, or off-topic answer -> 0 / 100!
      computedScore = 0;
      statusLabel = 'Incorrect / Irrelevant Answer';
      feedback = `Incorrect or off-topic response (0/${questionObj.expectedKeyPoints.length} rubric checkpoints matched). Your answer does not address "${questionObj.focusArea}" or any expected technical/behavioral concepts. Review the 3 required checkpoints above and explain your approach.`;
    } else if (matchedPoints === 0) {
      // Mentioned 1-2 surface words from the prompt, but missed ALL 3 expected evaluation checkpoints
      computedScore = Math.min(24, Math.max(6, topicHitCount * 6 + Math.min(6, Math.floor(words / 5))));
      statusLabel = 'Incomplete — 0 Checkpoints Matched';
      feedback = `Low readiness (${computedScore}/100): You mentioned ${topicHitCount} surface term(s), but addressed 0 of the ${questionObj.expectedKeyPoints.length} required evaluation checkpoints. Specifically missing: "${missedCheckpoints[0]}".`;
    } else {
      // Matched 1, 2, or 3 expected checkpoints
      const totalPts = Math.max(1, questionObj.expectedKeyPoints.length);
      const checkpointRatio = matchedPoints / totalPts;
      const checkpointBase = Math.round(checkpointRatio * 68); // 23, 45, or 68
      const keywordDepthBonus = Math.min(12, totalCheckpointKeywordHits * 2 + Math.min(4, topicHitCount));
      const lengthSubstanceBonus = Math.min(8, Math.floor(words / 6));
      const metricBonus = hasMetrics ? 6 : 0;
      const structureBonus = hasReasoningStructure ? 4 : 0;

      let rawTotal =
        checkpointBase + keywordDepthBonus + lengthSubstanceBonus + metricBonus + structureBonus;

      // Cap score if the response is just a 3-4 word fragment
      if (words < 7) {
        rawTotal = Math.min(rawTotal, 28);
      } else if (words < 14 && matchedPoints === 1) {
        rawTotal = Math.min(rawTotal, 42);
      }

      computedScore = Math.min(98, Math.max(15, rawTotal));

      if (computedScore >= 82) {
        statusLabel = 'Strong, Interview-Ready Answer';
        feedback = `Excellent response (${computedScore}/100)! You covered ${matchedPoints}/${totalPts} evaluation checkpoints with concrete technical depth${
          hasMetrics ? ' and quantified engineering metrics' : ''
        }.`;
      } else if (computedScore >= 60) {
        statusLabel = 'Competent Foundation';
        feedback = `Solid foundation (${computedScore}/100 — ${matchedPoints}/${totalPts} checkpoints matched). ${
          missedCheckpoints.length > 0
            ? `To push above 85+, also address: "${missedCheckpoints[0]}"`
            : 'Add quantified metrics (e.g., % latency improvement or request scale) to reach 90+.'
        }`;
      } else {
        statusLabel = 'Partial Answer — Needs Technical Depth';
        feedback = `Partial answer (${computedScore}/100 — ${matchedPoints}/${totalPts} checkpoints matched). Expand your explanation and cover the missing checkpoint: "${
          missedCheckpoints[0] || questionObj.expectedKeyPoints[0]
        }".`;
      }
    }

    setEvaluatedFeedback((prev) => ({
      ...prev,
      [scopedKey]: {
        score: computedScore,
        statusLabel,
        feedback,
        matchedPoints,
        checkpointHits,
      },
    }));
  };

  const filteredQuestions = questions.filter((q) =>
    filterCategory === 'ALL' ? true : q.category === filterCategory
  );

  const technicalCount = questions.filter((q) => q.category === 'Technical').length;
  const behavioralCount = questions.filter((q) => q.category === 'Behavioral').length;

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-space-lg pb-space-2xl">
      {/* Top Status & Context Banner */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[15px]">record_voice_over</span>
              AI Interview Mock Simulator
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-secondary font-mono text-xs">
              Engine: {engineSource}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed/40 text-tertiary font-mono text-xs font-semibold">
              Resume Score: {currentAnalysis.score}/100
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold">
              Active Role: {effectiveJobTitle}
            </span>
          </div>

          <h1 className="text-2xl sm:text-[28px] font-extrabold text-on-surface tracking-tight mt-1">
            Interview Mock Simulator for{' '}
            <span className="text-primary">{activeUser.name}</span>
          </h1>
          <p className="text-sm text-on-surface-variant max-w-3xl">
            Select any job title below to immediately generate tailored{' '}
            <strong className="text-on-surface">Technical</strong> and{' '}
            <strong className="text-on-surface">Behavioral</strong> interview questions grounded in
            your detected resume skills (
            <span className="font-mono text-xs text-primary">
              {currentAnalysis.skillsDetected.slice(0, 5).join(', ')}
            </span>
            ) and skill gaps (
            <span className="font-mono text-xs text-error">
              {currentAnalysis.missingSkills.slice(0, 3).join(', ') || 'None'}
            </span>
            ).
          </p>
        </div>

        {onNavigate && (
          <div className="flex items-center gap-space-xs shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">
                cloud_upload
              </span>
              <span>Switch Resume</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('analysis')}
              className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-tertiary">
                donut_large
              </span>
              <span>View Resume Diagnostics</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Job Title Pill Switcher + Custom Input Card */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
        {/* Fast One-Click Job Title Pills for All 6 Job Titles */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Quick Switch Job Title (Generates Role-Specific Questions Immediately)
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {JOB_TITLE_OPTIONS.map((role) => {
              const isSelected = !customJobTitle.trim() && selectedJobTitle === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setCustomJobTitle('');
                    setSelectedJobTitle(role);
                    syncQuestionsForJobTitle(role, variationSeed, true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {isSelected ? 'check_circle' : 'work'}
                  </span>
                  <span>{role}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-end pt-1">
          {/* Preset Job Title Dropdown */}
          <div className="lg:col-span-5 flex flex-col gap-1.5">
            <label
              htmlFor="simulatorJobTitleSelect"
              className="text-xs font-bold uppercase tracking-wider text-secondary"
            >
              1. Select Target Job Title
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-primary text-[19px]">
                work
              </span>
              <select
                id="simulatorJobTitleSelect"
                value={selectedJobTitle}
                onChange={(e) => {
                  const newRole = e.target.value;
                  setSelectedJobTitle(newRole);
                  setCustomJobTitle('');
                  syncQuestionsForJobTitle(newRole, variationSeed, true);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {JOB_TITLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Job Title Override */}
          <div className="lg:col-span-4 flex flex-col gap-1.5">
            <label
              htmlFor="customJobRoleInput"
              className="text-xs font-bold uppercase tracking-wider text-secondary"
            >
              2. Or Type Any Custom Job Title
            </label>
            <input
              id="customJobRoleInput"
              type="text"
              value={customJobTitle}
              onChange={(e) => setCustomJobTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const nextSeed = variationSeed + 1;
                  setVariationSeed(nextSeed);
                  syncQuestionsForJobTitle(
                    customJobTitle.trim() || selectedJobTitle,
                    nextSeed,
                    true
                  );
                }
              }}
              placeholder="e.g. Senior AI Systems Engineer"
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Generate AI Questions Button */}
          <div className="lg:col-span-3">
            <button
              type="button"
              onClick={() => {
                const nextSeed = variationSeed + 1;
                setVariationSeed(nextSeed);
                syncQuestionsForJobTitle(effectiveJobTitle, nextSeed, true);
              }}
              className="w-full py-2.5 px-space-md rounded-lg bg-primary-container text-on-primary font-bold text-sm shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span
                className={`material-symbols-outlined text-[19px] ${
                  isLoading ? 'animate-spin' : ''
                }`}
              >
                {isLoading ? 'progress_activity' : 'auto_awesome'}
              </span>
              <span>Generate Mock Questions</span>
            </button>
          </div>
        </div>

        {generationBanner && (
          <div className="px-space-md py-2 rounded-lg bg-tertiary-fixed/40 border border-tertiary/30 text-on-tertiary-fixed text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[18px]">
                check_circle
              </span>
              <span>{generationBanner}</span>
            </div>
            <span className="font-mono">6 QUESTIONS READY</span>
          </div>
        )}

        {/* Resume Context Pills Used for Question Synthesis */}
        <div className="pt-space-xs border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-secondary mr-1">
              Resume Skills Context:
            </span>
            {currentAnalysis.skillsDetected.map((sk) => (
              <span
                key={sk}
                className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary text-xs font-semibold"
              >
                {sk}
              </span>
            ))}
            {currentAnalysis.missingSkills.slice(0, 3).map((gap) => (
              <span
                key={gap}
                className="px-2.5 py-0.5 rounded-full bg-error-container/60 text-error text-xs font-semibold"
              >
                Gap: {gap}
              </span>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterCategory('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterCategory === 'ALL'
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('Technical')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterCategory === 'Technical'
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Technical ({technicalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('Behavioral')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterCategory === 'Behavioral'
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Behavioral ({behavioralCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Question Deck & Interactive Answer Practice Area (Always Visible) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left 5 Columns: Question List */}
        <div className="lg:col-span-5 flex flex-col gap-space-sm">
          {filteredQuestions.map((q, index) => {
            const isSelected = activeQuestionId === q.id;
            const qEval = evaluatedFeedback[getScopedKey(q.id)];
            const isEvaluated = Boolean(qEval);
            const badgeColor =
              !qEval
                ? ''
                : qEval.score >= 82
                ? 'bg-tertiary text-white'
                : qEval.score >= 60
                ? 'bg-primary text-white'
                : qEval.score >= 30
                ? 'bg-amber-600 text-white'
                : 'bg-error text-white';
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setActiveQuestionId(q.id)}
                className={`w-full text-left p-space-md rounded-xl transition-all cursor-pointer flex flex-col gap-2 border ${
                  isSelected
                    ? 'bg-surface-container-lowest border-2 border-primary shadow-md'
                    : 'bg-surface-container-lowest/80 border-outline-variant/40 hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-secondary">
                      Q{index + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        q.category === 'Technical'
                          ? 'bg-primary-fixed text-on-primary-fixed'
                          : 'bg-tertiary-fixed/50 text-tertiary'
                      }`}
                    >
                      {q.category}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-mono text-[10px]">
                      {q.difficulty}
                    </span>
                  </div>

                  {isEvaluated && qEval && (
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${badgeColor}`}>
                      Score: {qEval.score}/100
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold text-on-surface line-clamp-3">{q.question}</p>

                <div className="flex items-center justify-between text-[11px] text-secondary pt-1">
                  <span className="truncate">Focus: {q.focusArea}</span>
                  <span className="text-primary font-semibold flex items-center gap-0.5 shrink-0">
                    <span>Practice</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 7 Columns: Active Question Deep-Dive & Practice Simulator */}
        <div className="lg:col-span-7">
          {(() => {
            const activeQ =
              filteredQuestions.find((q) => q.id === activeQuestionId) || filteredQuestions[0];
            if (!activeQ) return null;
            const activeScopedKey = getScopedKey(activeQ.id);
            const currentEval = evaluatedFeedback[activeScopedKey];
            const currentDraft = draftResponses[activeScopedKey] || '';

            return (
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md sticky top-20">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-outline-variant/20 pb-space-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        activeQ.category === 'Technical'
                          ? 'bg-primary-fixed text-on-primary-fixed'
                          : 'bg-tertiary-fixed/50 text-tertiary'
                      }`}
                    >
                      {activeQ.category} Question
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs font-mono font-semibold text-on-surface-variant">
                      Difficulty: {activeQ.difficulty}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {effectiveJobTitle}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-secondary">
                    Focus Area: <strong className="text-on-surface">{activeQ.focusArea}</strong>
                  </span>
                </div>

                {/* Full Question Prompt */}
                <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40">
                  <h2 className="text-base sm:text-lg font-bold text-on-surface leading-snug">
                    &ldquo;{activeQ.question}&rdquo;
                  </h2>
                  <p className="text-xs text-secondary mt-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      psychology_alt
                    </span>
                    <span>
                      <strong>Why Interviewers Ask This:</strong> {activeQ.whyAsked}
                    </span>
                  </p>
                </div>

                {/* Expected Key Checkpoints */}
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Expected Evaluation Checkpoints for {effectiveJobTitle}
                  </h4>
                  <ul className="grid grid-cols-1 gap-1.5">
                    {activeQ.expectedKeyPoints.map((pt, i) => {
                      const wasHit = currentEval ? currentEval.checkpointHits[i] : null;
                      return (
                        <li
                          key={i}
                          className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg border ${
                            wasHit === true
                              ? 'bg-tertiary-fixed/25 border-tertiary/40 text-on-surface font-medium'
                              : wasHit === false
                              ? 'bg-error-container/25 border-error/30 text-on-surface'
                              : 'bg-surface-container/50 border-transparent text-on-surface'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[16px] shrink-0 mt-0.5 ${
                              wasHit === false ? 'text-error' : 'text-tertiary'
                            }`}
                          >
                            {wasHit === false ? 'cancel' : 'check_circle'}
                          </span>
                          <div className="flex-1 flex items-center justify-between gap-2">
                            <span>{pt}</span>
                            {wasHit !== null && (
                              <span
                                className={`font-mono text-[10px] font-bold uppercase shrink-0 px-1.5 py-0.5 rounded ${
                                  wasHit
                                    ? 'bg-tertiary/15 text-tertiary'
                                    : 'bg-error/15 text-error'
                                }`}
                              >
                                {wasHit ? 'Matched' : 'Missed'}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Recommended Answer Framework */}
                <div className="p-space-sm rounded-lg bg-primary-fixed/20 border border-primary/20 text-xs text-on-surface leading-relaxed">
                  <strong className="text-primary font-bold">
                    Recommended Answer Strategy:{' '}
                  </strong>
                  {activeQ.sampleAnswerFramework}
                </div>

                {/* Candidate Practice Response Box */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Practice Your Answer ({activeUser.name})
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setDraftResponses((prev) => ({
                            ...prev,
                            [activeScopedKey]: buildModelAnswerForQuestion(activeQ),
                          }))
                        }
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Insert Strong Model Answer
                      </button>
                      {currentDraft && (
                        <button
                          type="button"
                          onClick={() => {
                            setDraftResponses((prev) => ({
                              ...prev,
                              [activeScopedKey]: '',
                            }));
                            setEvaluatedFeedback((prev) => {
                              const next = { ...prev };
                              delete next[activeScopedKey];
                              return next;
                            });
                          }}
                          className="text-xs font-semibold text-secondary hover:text-error cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={currentDraft}
                    onChange={(e) =>
                      setDraftResponses((prev) => ({
                        ...prev,
                        [activeScopedKey]: e.target.value,
                      }))
                    }
                    placeholder="Type your behavioral STAR story or technical architecture explanation here to evaluate readiness..."
                    className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-secondary font-mono">
                      {currentDraft.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEvaluateAnswer(activeQ)}
                      className="px-space-md py-2 rounded-lg bg-tertiary text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">fact_check</span>
                      <span>Score My Answer</span>
                    </button>
                  </div>
                </div>

                {/* Instant Self-Evaluation Score Card */}
                {currentEval && (
                  <div
                    className={`p-space-md rounded-xl border flex items-start justify-between gap-3 ${
                      currentEval.score >= 82
                        ? 'bg-tertiary-fixed/30 border-tertiary/40'
                        : currentEval.score >= 60
                        ? 'bg-primary-fixed/25 border-primary/40'
                        : currentEval.score >= 30
                        ? 'bg-amber-500/15 border-amber-500/40'
                        : 'bg-error-container/45 border-error/50'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            currentEval.score >= 82
                              ? 'text-tertiary'
                              : currentEval.score >= 60
                              ? 'text-primary'
                              : currentEval.score >= 30
                              ? 'text-amber-700'
                              : 'text-error'
                          }`}
                        >
                          {currentEval.score >= 82
                            ? 'verified'
                            : currentEval.score >= 60
                            ? 'trending_up'
                            : currentEval.score >= 30
                            ? 'warning'
                            : 'error'}
                        </span>
                        <span className="text-xs font-bold text-on-surface">
                          {currentEval.statusLabel}: {currentEval.score} / 100
                        </span>
                        <span className="text-[11px] font-mono text-secondary">
                          ({currentEval.matchedPoints}/{activeQ.expectedKeyPoints.length} Checkpoints Matched)
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {currentEval.feedback}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold shrink-0 ${
                        currentEval.score >= 82
                          ? 'bg-tertiary text-white'
                          : currentEval.score >= 60
                          ? 'bg-primary text-white'
                          : currentEval.score >= 30
                          ? 'bg-amber-600 text-white'
                          : 'bg-error text-white'
                      }`}
                    >
                      {currentEval.score}%
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
