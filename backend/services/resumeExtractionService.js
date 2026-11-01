import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Safe pdf-parse loader
async function parsePdfBuffer(buffer) {
  try {
    const pdfModule = await import('pdf-parse');
    const pdf = pdfModule.default || pdfModule;
    const res = await pdf(buffer);
    return res.text || '';
  } catch (err) {
    try {
      const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const res = await pdf(buffer);
      return res.text || '';
    } catch (innerErr) {
      console.warn('PDF parser fallback error:', innerErr.message);
      return '';
    }
  }
}

// Normalize whitespace and bullet characters
function normalizeRawText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25CF]/g, ' • ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Layer 1: Deterministic regex and heuristics
 */
export function extractDeterministic(text) {
  const result = {
    email: '',
    phone: '',
    links: [],
    cgpa: null,
    skills: [],
    name: ''
  };

  if (!text) return result;

  // 1. Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.email = emailMatch[0].trim();

  // 2. Indian and International Phone Number formats
  // Matches +91 98765 43210, +91-98765-43210, (+91) 9876543210, 98765 43210, 9876543210, etc.
  const phoneRegexes = [
    /(?:(?:\+|0{0,2})91[\s\-]?)?(?:\(?\d{3,5}\)?[\s\-]?)?\d{3,5}[\s\-]?\d{4,5}\b/,
    /(?:phone|mobile|tel|contact|call|cell)?\s*[:=-]?\s*(?:\+?91[\s\-]?)?([6789]\d{4}[\s\-]?\d{5})\b/i,
    /(?:\+91[\s-]?)?[6789]\d{9}\b/,
    /(?:\+?\d{1,3}[\s-]?)?\(?\d{3,5}\)?[\s-]?\d{3,5}[\s-]?\d{4,6}/
  ];
  for (const reg of phoneRegexes) {
    const pMatch = text.match(reg);
    if (pMatch) {
      const rawMatch = pMatch[1] || pMatch[0];
      const digits = rawMatch.replace(/\D/g, '');
      if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        if (/^[6789]\d{9}$/.test(last10)) {
          result.phone = `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
          break;
        } else {
          result.phone = rawMatch.trim();
          break;
        }
      }
    }
  }

  // 3. Links (LinkedIn, GitHub, Portfolios)
  const links = new Set();
  const linkMatches = text.match(/https?:\/\/[^\s,)]+/gi) || [];
  linkMatches.forEach(l => links.add(l.trim()));

  const linkedinMatch = text.match(/(?:linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) links.add(`https://${linkedinMatch[0]}`);

  const githubMatch = text.match(/(?:github\.com\/[a-zA-Z0-9_-]+)/i);
  if (githubMatch) links.add(`https://${githubMatch[0]}`);

  result.links = Array.from(links);

  // 4. CGPA / Percentage
  const cgpaMatch = text.match(/\b(?:cgpa|gpa|percentage|marks|score)?\s*[:=-]?\s*([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*(?:%|\/10|\/4)?\b/i);
  if (cgpaMatch && parseFloat(cgpaMatch[1]) <= 100) {
    const val = parseFloat(cgpaMatch[1]);
    result.cgpa = val > 10 ? Math.round((val / 10) * 10) / 10 : val;
  }

  // 5. Name Heuristic (handles labeled names, prominent headers, and email fallback)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const labeledName = text.match(/(?:full\s*name|candidate\s*name|^name)\s*[:=-]\s*([a-zA-Z\s.]{3,40})/im);
  if (labeledName && labeledName[1]) {
    result.name = labeledName[1].trim();
  } else {
    for (const line of lines.slice(0, 10)) {
      const clean = line.replace(/[^\x20-\x7E]/g, '').trim();
      if (
        clean.length >= 3 &&
        clean.length <= 40 &&
        /^[a-zA-Z\s.]+$/.test(clean) &&
        !/\d/.test(clean) &&
        !/@/.test(clean) &&
        !/http|linkedin|github|curriculum|vitae|resume|profile|summary|contact|experience|education|skills|objective|about|projects|page/i.test(clean)
      ) {
        const words = clean.split(/\s+/).filter(Boolean);
        if (words.length >= 1 && words.length <= 4 && words.every(w => w.length >= 2)) {
          result.name = clean;
          break;
        }
      }
    }
  }

  if (!result.name && result.email) {
    const prefix = result.email.split('@')[0];
    const parts = prefix.split(/[._-]/).filter(p => p.length >= 2 && !/\d/.test(p));
    if (parts.length >= 1) {
      result.name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    }
  }

  // 6. Common Tech Skills matching
  const knownSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
    'React', 'React.js', 'Next.js', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot',
    'HTML', 'HTML5', 'CSS', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'Sass', 'Redux', 'GraphQL', 'REST API',
    'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Firebase', 'Supabase', 'Oracle', 'Cassandra',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'Linux', 'Microservices',
    'Machine Learning', 'Deep Learning', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
    'Scikit-learn', 'NLP', 'Computer Vision', 'Tableau', 'Power BI', 'Agile', 'Scrum', 'Figma'
  ];

  const foundSkills = new Set();
  const lowerText = text.toLowerCase();
  for (const skill of knownSkills) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reg = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, 'i');
    if (reg.test(lowerText)) {
      foundSkills.add(skill);
    }
  }
  result.skills = Array.from(foundSkills);

  return result;
}

/**
 * Layer 2: LLM Extraction via Google Gemini with strict JSON Schema
 */
export async function extractWithLLM(text, fileBuffer = null, mimeType = null) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. Falling back to deterministic extraction.');
    return null;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Supported models in preference order (gemini-3.5-flash-lite is active and fast)
  const candidateModels = [
    process.env.GEMINI_MODEL,
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash'
  ].filter(Boolean);

  const prompt = `You are a specialized AI Resume Parser for a college Placement and Internship Management System.
Extract structured candidate details from the resume text provided below into a single valid JSON object.

Strict Rules:
1. Return ONLY the raw JSON object. Do NOT wrap in markdown \`\`\`json or add conversational text.
2. If a field is not found in the resume, return an empty string "" or empty array [].
3. Format Indian phone numbers with country code (+91) if detected.
4. Extract all education records (e.g. 10th, 12th, BCA, MCA, B.Tech, M.Tech, etc.) with degree, institution, year, and grade/CGPA/percentage.
5. Extract all internships, jobs, projects, technical skills, certifications, and achievements.

JSON Schema format:
{
  "name": "Full Candidate Name",
  "email": "candidate@example.com",
  "phone": "+91 9876543210",
  "location": "City, State, Country",
  "links": ["https://linkedin.com/in/...", "https://github.com/..."],
  "summary": "Professional summary or objective",
  "education": [
    {
      "degree": "BCA / MCA / B.Tech / 12th / 10th",
      "institution": "College or School Name",
      "year": "Passing year e.g. 2026",
      "grade": "CGPA or Percentage e.g. 8.5 CGPA"
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job or Internship Title",
      "duration": "e.g. June 2025 - August 2025 (3 months)",
      "description": "Key responsibilities and achievements"
    }
  ],
  "projects": [
    {
      "name": "Project Title",
      "techStack": ["React", "Node.js", "MongoDB"],
      "description": "What was built and the impact"
    }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "certifications": ["Certification 1"],
  "achievements": ["Achievement or Award 1"],
  "languages": ["English", "Hindi"]
}

Resume Text:
${text.slice(0, 30000)}
`;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      let responseText = '';

      if (text.length < 50 && fileBuffer && mimeType) {
        const part = {
          inlineData: {
            data: fileBuffer.toString('base64'),
            mimeType: mimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg'
          }
        };
        const result = await model.generateContent([prompt, part]);
        responseText = result.response.text();
      } else {
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
      }

      let cleaned = responseText.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }

      const parsed = JSON.parse(cleaned);
      if (parsed && (parsed.name || parsed.skills?.length > 0 || parsed.email)) {
        return parsed;
      }
    } catch (err) {
      console.warn(`Gemini extraction with ${modelName} failed:`, err.message?.slice(0, 150));
    }
  }

  return null;
}

/**
 * Score Resume Completeness & Strength (0 to 100)
 */
export function calculateResumeScore(data) {
  let score = 0;
  if (!data) return score;

  // Contact info (20 pts)
  if (data.email) score += 7;
  if (data.phone) score += 7;
  if (data.links?.length > 0) score += 6;

  // Summary (10 pts)
  if (data.summary && data.summary.length > 25) score += 10;

  // Education (20 pts)
  if (data.education?.length > 0) {
    score += Math.min(20, data.education.length * 10);
  }

  // Skills (20 pts)
  if (data.skills?.length > 0) {
    score += Math.min(20, Math.round(data.skills.length * 2.5));
  }

  // Projects (15 pts)
  if (data.projects?.length > 0) {
    score += Math.min(15, data.projects.length * 7.5);
  }

  // Experience / Internships (10 pts)
  if (data.experience?.length > 0) {
    score += Math.min(10, data.experience.length * 5);
  }

  // Certifications / Achievements (5 pts)
  if (data.certifications?.length > 0 || data.achievements?.length > 0) {
    score += 5;
  }

  return Math.min(100, Math.max(25, Math.round(score)));
}

/**
 * Master Pipeline: Extracts raw text from PDF/DOCX, applies Deterministic & LLM layers,
 * merges preferring regex values for phone/email, and calculates score.
 */
export async function processResumeBuffer(buffer, originalName, mimeType) {
  const ext = (originalName || '').toLowerCase().split('.').pop();
  let rawText = '';

  // 1. Text extraction based on file format
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    rawText = await parsePdfBuffer(buffer);
  } else if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const mammothResult = await mammoth.extractRawText({ buffer });
      rawText = mammothResult.value || '';
    } catch (docxErr) {
      console.warn('Mammoth extraction failed:', docxErr.message);
    }
  } else if (ext === 'doc' || mimeType === 'application/msword') {
    throw new Error('Legacy .DOC format is not supported. Please save your resume as .DOCX or .PDF and try again.');
  } else if (ext === 'txt' || mimeType === 'text/plain') {
    rawText = buffer.toString('utf-8');
  } else {
    throw new Error(`Unsupported file type (.${ext}). Only PDF and DOCX files are supported.`);
  }

  const cleanText = normalizeRawText(rawText);

  // 2. Deterministic Extraction
  const det = extractDeterministic(cleanText);

  // 3. LLM Extraction (Gemini)
  const llm = await extractWithLLM(cleanText, buffer, mimeType);

  // 4. Merge results: prefer candidate name from LLM if present, else deterministic
  const resolvedName = (llm?.name && llm.name.length >= 3 && !/candidate|resume|student/i.test(llm.name))
    ? llm.name.trim()
    : (det.name || '');

  const resolvedPhone = det.phone || llm?.phone || '';
  const resolvedEmail = det.email || llm?.email || '';

  const merged = {
    name: resolvedName,
    email: resolvedEmail,
    phone: resolvedPhone,
    location: llm?.location || '',
    links: Array.from(new Set([...(det.links || []), ...(llm?.links || [])])),
    summary: llm?.summary || '',
    education: llm?.education || [],
    experience: llm?.experience || [],
    projects: llm?.projects || [],
    skills: Array.from(new Set([...(det.skills || []), ...(llm?.skills || [])])),
    certifications: llm?.certifications || [],
    achievements: llm?.achievements || [],
    languages: llm?.languages || []
  };

  // If no education was extracted by LLM, try fallback heuristic
  if (merged.education.length === 0) {
    const degMatches = cleanText.match(/\b(MCA|BCA|B\.Tech|M\.Tech|B\.E\.|B\.Sc|M\.Sc|MBA)\b/gi) || [];
    degMatches.slice(0, 3).forEach(deg => {
      merged.education.push({ degree: deg.toUpperCase(), institution: 'Campus University', year: '2026', grade: '' });
    });
  }

  const score = calculateResumeScore(merged);

  return {
    rawText: cleanText,
    extracted: merged,
    resumeScore: score
  };
}
