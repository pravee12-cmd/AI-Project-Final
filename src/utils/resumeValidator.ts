export interface ResumeValidationResult {
  isValid: boolean;
  confidenceScore: number; // 0 - 100
  detectedDocumentType: 'Resume / CV' | 'Invoice / Bill' | 'Recipe / Cooking' | 'Medical Report' | 'Legal / Contract' | 'Generic Document / Notes' | 'Insufficient Content';
  detectedSections: string[];
  missingSections: string[];
  hasContactInfo: boolean;
  hasWorkExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  hasProjectsOrCertifications: boolean;
  wordCount: number;
  rejectionReason?: string;
  recommendations: string[];
}

export function validateResumeContent(
  textContent: string,
  fileName = 'document'
): ResumeValidationResult {
  const cleanText = String(textContent || '').trim();
  const lowerText = cleanText.toLowerCase();
  const lowerFileName = fileName.toLowerCase();
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const detectedSections: string[] = [];
  const missingSections: string[] = [];
  const recommendations: string[] = [];

  // 1. Check for Insufficient / Empty Content
  if (cleanText.length < 100 || wordCount < 15) {
    return {
      isValid: false,
      confidenceScore: 5,
      detectedDocumentType: 'Insufficient Content',
      detectedSections: [],
      missingSections: ['Work Experience', 'Education', 'Skills', 'Contact Information'],
      hasContactInfo: false,
      hasWorkExperience: false,
      hasEducation: false,
      hasSkills: false,
      hasProjectsOrCertifications: false,
      wordCount,
      rejectionReason:
        'The uploaded file contains insufficient readable text (fewer than 15 words). If you uploaded a scanned image PDF, please upload a text-searchable PDF, DOCX, or TXT resume.',
      recommendations: [
        'Ensure the document is a text-based PDF or DOCX file (not an image scan)',
        'Include standard resume sections: Experience, Education, and Skills',
      ],
    };
  }

  // 2. Negative Classifiers (Immediate Detection of Invoices, Recipes, Medical, Legal)
  const invoicePatterns = [
    /\btax\s+invoice\b/,
    /\binvoice\s+(no|number|#|date)\b/,
    /\bbill\s+to\b/,
    /\bship\s+to\b/,
    /\bamount\s+due\b/,
    /\bdue\s+date\b/,
    /\bsubtotal\b/,
    /\btotal\s+amount\b/,
    /\bpayment\s+terms\b/,
    /\breceipt\s+(no|number|#)\b/,
    /\bgstin\b/,
    /\bunit\s+price\b/,
    /\bitemized\s+bill\b/,
  ];
  const invoiceHits = invoicePatterns.filter((p) => p.test(lowerText)).length;
  if (invoiceHits >= 2 || /\binvoice|receipt|bill_of_sale/i.test(lowerFileName)) {
    return {
      isValid: false,
      confidenceScore: 8,
      detectedDocumentType: 'Invoice / Bill',
      detectedSections: [],
      missingSections: ['Work Experience', 'Education', 'Skills', 'Professional Summary'],
      hasContactInfo: false,
      hasWorkExperience: false,
      hasEducation: false,
      hasSkills: false,
      hasProjectsOrCertifications: false,
      wordCount,
      rejectionReason:
        'Document rejected: The uploaded file appears to be a Billing Invoice or Payment Receipt. AI Resume Analyzer only accepts professional candidate resumes and CVs.',
      recommendations: [
        'Upload an actual candidate resume or curriculum vitae',
        'Verify you did not accidentally select an invoice, receipt, or purchase statement',
      ],
    };
  }

  const recipePatterns = [
    /\bingredients\b/,
    /\btablespoon|teaspoon|tbsp|tsp\b/,
    /\bpreheat\s+oven\b/,
    /\bcook\s+time\b/,
    /\bservings\b/,
    /\bbake\s+for\b/,
    /\bcup\s+of\b/,
  ];
  const recipeHits = recipePatterns.filter((p) => p.test(lowerText)).length;
  if (recipeHits >= 2 || /recipe|cooking|menu/i.test(lowerFileName)) {
    return {
      isValid: false,
      confidenceScore: 4,
      detectedDocumentType: 'Recipe / Cooking',
      detectedSections: [],
      missingSections: ['Work Experience', 'Education', 'Skills'],
      hasContactInfo: false,
      hasWorkExperience: false,
      hasEducation: false,
      hasSkills: false,
      hasProjectsOrCertifications: false,
      wordCount,
      rejectionReason:
        'Document rejected: The uploaded file appears to be a Cooking Recipe or Food Preparation guide. Please upload a professional resume.',
      recommendations: ['Select a valid Resume or CV document in PDF, DOCX, or TXT format.'],
    };
  }

  const medicalPatterns = [
    /\bpatient\s+name\b/,
    /\bblood\s+pressure\b/,
    /\bdiagnosis\b/,
    /\bprescription\b/,
    /\bdoctor['’]?s\s+signature\b/,
    /\bhemoglobin\b/,
    /\blab\s+results\b/,
  ];
  const medicalHits = medicalPatterns.filter((p) => p.test(lowerText)).length;
  if (medicalHits >= 2) {
    return {
      isValid: false,
      confidenceScore: 6,
      detectedDocumentType: 'Medical Report',
      detectedSections: [],
      missingSections: ['Work Experience', 'Education', 'Skills'],
      hasContactInfo: false,
      hasWorkExperience: false,
      hasEducation: false,
      hasSkills: false,
      hasProjectsOrCertifications: false,
      wordCount,
      rejectionReason:
        'Document rejected: The uploaded document appears to be a Medical or Clinical Report. For privacy and system integrity, only resumes are processed.',
      recommendations: ['Upload a career resume or curriculum vitae.'],
    };
  }

  // 3. Positive Resume Pillars
  // Contact Info
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cleanText);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(cleanText);
  const hasLinkedInOrGithub = /linkedin\.com|github\.com|portfolio|behance/i.test(cleanText);
  const hasContactInfo = hasEmail || hasPhone || hasLinkedInOrGithub;
  if (hasContactInfo) {
    detectedSections.push('Contact Information');
  } else {
    missingSections.push('Contact Information');
  }

  // Work Experience
  const expPatterns = [
    /\b(work\s+)?experience\b/,
    /\bemployment(\s+history)?\b/,
    /\bwork\s+history\b/,
    /\bprofessional\s+experience\b/,
    /\bcareer\s+history\b/,
    /\broles\s+(&|and)\s+responsibilities\b/,
    /\binternship(s)?\b/,
    /\bsoftware\s+engineer|developer|architect|manager|consultant|analyst\b/,
  ];
  const hasWorkExperience = expPatterns.some((p) => p.test(lowerText));
  if (hasWorkExperience) {
    detectedSections.push('Work Experience / Employment');
  } else {
    missingSections.push('Work Experience / Employment');
  }

  // Education
  const eduPatterns = [
    /\beducation\b/,
    /\bacademic\s+(background|qualifications)?\b/,
    /\bdegree\b/,
    /\buniversity|college|institute|polytechnic\b/,
    /\bbachelor|master|b\.tech|b\.e\.|b\.sc|bca|m\.tech|m\.s\.|mba|ph\.d|diploma\b/,
    /\bgpa|cgpa\b/,
  ];
  const hasEducation = eduPatterns.some((p) => p.test(lowerText));
  if (hasEducation) {
    detectedSections.push('Education / Academics');
  } else {
    missingSections.push('Education / Academics');
  }

  // Skills
  const skillsPatterns = [
    /\b(technical\s+|key\s+|core\s+)?skills\b/,
    /\bcore\s+competencies\b/,
    /\btechnologies\b/,
    /\bprogramming\s+languages\b/,
    /\btools\s+(&|and)\s+frameworks\b/,
    /\bproficiencies\b/,
    /\bjavascript|typescript|python|react|java|c\+\+|node|html|css|sql|docker|aws|git\b/,
  ];
  const hasSkills = skillsPatterns.some((p) => p.test(lowerText));
  if (hasSkills) {
    detectedSections.push('Skills & Competencies');
  } else {
    missingSections.push('Skills & Competencies');
  }

  // Projects / Certifications / Summary
  const extraPatterns = [
    /\bprojects\b/,
    /\bcertifications?|certified\b/,
    /\b(professional\s+)?summary\b/,
    /\bcareer\s+objective\b/,
    /\bachievements|awards\b/,
  ];
  const hasProjectsOrCertifications = extraPatterns.some((p) => p.test(lowerText));
  if (hasProjectsOrCertifications) {
    detectedSections.push('Projects / Certifications / Summary');
  }

  // Compute confidence score
  let score = 0;
  if (hasContactInfo) score += 20;
  if (hasWorkExperience) score += 30;
  if (hasEducation) score += 25;
  if (hasSkills) score += 20;
  if (hasProjectsOrCertifications) score += 15;
  if (wordCount >= 80 && wordCount <= 2500) score += 10;
  score = Math.min(100, score);

  // Resume validation criterion:
  // Must satisfy at least 2 of (Work Experience, Education, Skills) AND at least 45 total confidence score
  const corePillarCount = [hasWorkExperience, hasEducation, hasSkills].filter(Boolean).length;
  const isValid = (corePillarCount >= 2 && score >= 45) || (corePillarCount >= 1 && hasContactInfo && score >= 50);

  if (!isValid) {
    return {
      isValid: false,
      confidenceScore: score,
      detectedDocumentType: 'Generic Document / Notes',
      detectedSections,
      missingSections,
      hasContactInfo,
      hasWorkExperience,
      hasEducation,
      hasSkills,
      hasProjectsOrCertifications,
      wordCount,
      rejectionReason:
        'The uploaded document does not appear to be a valid Resume or CV. Standard resume sections such as Work Experience, Education, or Technical Skills were not detected.',
      recommendations: [
        'Ensure the document contains an "Experience" or "Work History" section',
        'Add an "Education" section with degree or institution details',
        'Include a "Skills" or "Technologies" section listing your competencies',
        'Include your contact information (Email, Phone, or LinkedIn)',
      ],
    };
  }

  return {
    isValid: true,
    confidenceScore: score,
    detectedDocumentType: 'Resume / CV',
    detectedSections,
    missingSections,
    hasContactInfo,
    hasWorkExperience,
    hasEducation,
    hasSkills,
    hasProjectsOrCertifications,
    wordCount,
    recommendations: missingSections.length > 0
      ? missingSections.map((s) => `Consider adding a dedicated "${s}" section to boost your ATS pass rate`)
      : ['Your resume structure satisfies standard ATS layout guidelines!'],
  };
}
