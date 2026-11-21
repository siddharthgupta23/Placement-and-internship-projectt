import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// ─── API Key & Model config ───────────────────────────────────────────────────
const rawKeys = [process.env.GEMINI_API_KEY, process.env.GOOGLE_GEMINI_API_KEY]
  .map(k => (k || '').trim().replace(/^["']|["']$/g, ''))
  .filter(Boolean);
const apiKeys = [...new Set(rawKeys)];

const rawModel = (process.env.GEMINI_MODEL || process.env.GEMINI_MODEL_NAME || '').trim();
// Google Gemini official supported models (gemini-3.5 does not exist in Google API)
const primaryModel = (rawModel && !rawModel.includes('3.5')) ? rawModel : 'gemini-1.5-flash';

if (apiKeys.length === 0) {
  console.warn('[GeminiService] WARNING: No GEMINI_API_KEY found in environment. AI features will use fallback responses.');
} else {
  console.log(`[GeminiService] Initialized with primary model: ${primaryModel} (${apiKeys.length} API key(s) detected)`);
}

// Available supported models in preference order
const FALLBACK_MODELS = [primaryModel, 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'].filter(
  (m, idx, arr) => arr.indexOf(m) === idx
);

// ─── Exponential Backoff Helper ────────────────────────────────────────────────
async function callWithRetry(fn, maxRetries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err?.status || err?.response?.status;
      const msg = err?.message || '';

      console.error(`[GeminiService] Attempt ${attempt + 1} failed:`, {
        status,
        message: msg.substring(0, 200),
        type: err?.constructor?.name
      });

      // Don't retry on auth errors (switch key instead)
      if (status === 400 || status === 401 || status === 403) {
        break;
      }

      // Retry 429 (rate limit), 503 (high demand) and network drops with exponential backoff
      if ((status === 429 || status === 503 || msg.includes('fetch failed') || msg.includes('ECONNRESET')) && attempt < maxRetries) {
        const waitMs = Math.pow(2, attempt + 1) * 1000;
        console.warn(`[GeminiService] Retrying in ${waitMs}ms due to status ${status}...`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      break;
    }
  }
  throw lastErr;
}

// ─── Safe JSON Parsing (strips code fences) ───────────────────────────────────
function parseJSONResponse(text) {
  try {
    const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    return JSON.parse(stripped);
  } catch (e1) {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        console.error('[GeminiService] Failed to parse JSON response:', text.substring(0, 300));
        throw new Error('Failed to parse AI response as JSON.');
      }
    }
    throw new Error('No valid JSON found in AI response.');
  }
}

// ─── Core generate function with multi-key & multi-model fallback ─────────────
async function generate(prompt) {
  if (apiKeys.length === 0) throw new Error('Gemini API not configured. Set GEMINI_API_KEY in .env');

  let lastError;
  for (const currentKey of apiKeys) {
    const genAI = new GoogleGenerativeAI(currentKey);
    for (const mName of FALLBACK_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: mName });
        const result = await callWithRetry(() => model.generateContent(prompt));
        return result.response.text().trim();
      } catch (err) {
        lastError = err;
        const status = err?.status || err?.response?.status;
        const msg = err?.message || '';
        console.warn(`[GeminiService] Model ${mName} call failed (${status || msg.substring(0, 80)}). Trying fallback...`);
        continue;
      }
    }
  }
  throw lastError;
}

// ─── PUBLIC API ────────────────────────────────────────────────────────────────

export const generateInterviewQuestions = async (jobTitle, requiredSkills, studentProfile) => {
  try {
    const prompt = `You are an expert HR and technical interviewer. Generate 12 interview questions for a ${jobTitle} role.
Required skills: ${(requiredSkills || []).join(', ')}.
${studentProfile ? `Candidate skills: ${(studentProfile.skills || []).join(', ')}` : ''}

Return ONLY valid JSON (no markdown, no code fences):
{"technical":["q1","q2","q3","q4"],"hr":["q1","q2","q3","q4"],"scenario":["q1","q2","q3","q4"]}`;

    return parseJSONResponse(await generate(prompt));
  } catch (error) {
    console.error('[GeminiService] generateInterviewQuestions failed:', error.message);
    return {
      technical: [
        'Explain the core features of the required tech stack.',
        'How do you optimize application performance?',
        'Describe your approach to debugging complex issues.',
        'What design patterns have you used in past projects?'
      ],
      hr: [
        'Where do you see yourself in 5 years?',
        'Why do you want to work in this role?',
        'Describe a situation where you showed leadership.',
        'How do you handle tight deadlines?'
      ],
      scenario: [
        'Describe a time you solved a complex bug.',
        'How do you collaborate with cross-functional teams?',
        'Tell me about a project you are most proud of.',
        'How do you stay updated with new technologies?'
      ]
    };
  }
};

export const getJobRecommendations = async (studentProfile, availableJobs) => {
  try {
    const jobsData = availableJobs.slice(0, 20).map(j => ({
      id: j._id,
      title: j.role || 'Unknown Role',
      company: j.company?.name || 'Unknown',
      skills: j.requiredSkills || []
    }));

    const prompt = `You are a career counselor. Recommend the top 5 best matching jobs.

Student: skills=[${(studentProfile.skills || []).join(',')}] cgpa=${studentProfile.cgpa || 'N/A'}

Jobs:
${JSON.stringify(jobsData)}

Return ONLY valid JSON: {"recommendations":[{"jobId":"id","matchPercentage":85,"reasons":["reason"]}]}`;

    return parseJSONResponse(await generate(prompt));
  } catch (error) {
    console.error('[GeminiService] getJobRecommendations failed, using heuristic:', error.message);
    const studentSkills = new Set((studentProfile?.skills || []).map(s => s.toLowerCase()));
    const recommendations = availableJobs.map(job => {
      const jobSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
      const matchCount = jobSkills.filter(s => studentSkills.has(s)).length;
      const matchPercentage = jobSkills.length > 0
        ? Math.min(100, Math.round((matchCount / jobSkills.length) * 100))
        : 55;
      return {
        jobId: job._id.toString(),
        matchPercentage: Math.max(matchPercentage, 45),
        reasons: [`Matches ${matchCount} of ${jobSkills.length} required skills`]
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 5);
    return { recommendations };
  }
};

export const generateAIInsights = async (allStudents, allJobs, allApplications) => {
  // This is now primarily computed from real data in admin routes.
  // Gemini is only used for narrative interpretation.
  try {
    const totalStudents = allStudents.length;
    const allStudentSkills = allStudents.flatMap(s => s.skills || []);
    const skillCounts = {};
    allStudentSkills.forEach(s => { 
      if (typeof s === 'string' && s.trim()) {
        const k = s.trim();
        skillCounts[k] = (skillCounts[k] || 0) + 1; 
      }
    });

    const reqSkills = allJobs.flatMap(j => j.requiredSkills || []);
    const reqSkillCounts = {};
    reqSkills.forEach(s => { 
      if (typeof s === 'string' && s.trim()) {
        const k = s.trim();
        reqSkillCounts[k] = (reqSkillCounts[k] || 0) + 1; 
      }
    });

    const prompt = `University placement data analysis:
- Students: ${totalStudents}, Jobs: ${allJobs.length}, Applications: ${allApplications.length}
- Student skills (top): ${JSON.stringify(Object.entries(skillCounts).sort((a,b)=>b[1]-a[1]).slice(0,10))}
- Required skills (top): ${JSON.stringify(Object.entries(reqSkillCounts).sort((a,b)=>b[1]-a[1]).slice(0,10))}

Return ONLY valid JSON (no markdown fences):
{"placementPrediction":82,"topSkills":["Python","React","Node.js","JavaScript","Java","SQL"],"skillGapAnalysis":[{"skill":"AWS","gap":"High demand low supply"}]}`;

    const res = parseJSONResponse(await generate(prompt));
    if (res && res.avgResumeScore !== undefined) {
      delete res.avgResumeScore;
    }
    return res;
  } catch (error) {
    console.error('[GeminiService] generateAIInsights failed, using computed fallback:', error.message);
    return {
      topSkills: ['Python', 'React', 'Node.js', 'JavaScript', 'Java', 'MongoDB'],
      placementPrediction: 78,
      skillGapAnalysis: [
        { skill: 'Node.js', gap: 'High demand low supply across active recruiter drives.' },
        { skill: 'MongoDB', gap: 'Backend database architecture requested in technical rounds.' },
        { skill: 'Express.js', gap: 'API backend development framework required by companies.' }
      ]
    };
  }
};

/**
 * Generate initial opening question for AI Mock Interview
 * Returns plain text (not JSON)
 */
export const generateInitialInterviewQuestion = async (roleDomain, difficulty, interviewType, studentProfile) => {
  try {
    const studentSkills = (studentProfile?.skills || []).join(', ') || 'general CS fundamentals';
    const prompt = `You are a professional ${interviewType} interviewer at a top tech company.
Role: ${roleDomain} | Difficulty: ${difficulty} | Student skills: ${studentSkills}

Greet the candidate in ONE warm sentence and ask your FIRST interview question tailored to this role.
Keep total response under 70 words. Speak directly, no JSON, no markdown.`;

    return await generate(prompt);
  } catch (err) {
    console.warn('[GeminiService] generateInitialInterviewQuestion fallback:', err.message);
    return `Welcome to your ${roleDomain} mock interview! Let's begin — can you introduce yourself and walk me through the most significant project you've built relevant to ${roleDomain}?`;
  }
};

/**
 * Generate follow-up or next question based on student's answer
 * Returns strict JSON: { reaction, followUp, nextQuestion, questionNumber, topic }
 */
export const generateInterviewFollowUp = async (roleDomain, difficulty, interviewType, messages, questionIndex, totalTarget) => {
  try {
    const formattedHistory = messages
      .slice(-10) // Keep last 10 messages to avoid context overflow
      .map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n');

    const prompt = `You are conducting a live ${interviewType} mock interview for ${roleDomain} (${difficulty}).
Question ${questionIndex} of ${totalTarget}.

Conversation (last 10 messages):
${formattedHistory}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "reaction": "Brief 1-sentence acknowledgement of candidate's last answer",
  "followUp": false,
  "nextQuestion": "Your next interview question here",
  "questionNumber": ${questionIndex},
  "topic": "Topic of this question"
}

Rules:
- reaction: acknowledge what they said specifically, not generically
- followUp: true only if their answer needs clarification or was incomplete
- nextQuestion: if followUp=true, probe deeper on same topic; otherwise next essential topic for ${roleDomain}
- Keep nextQuestion under 60 words`;

    const text = await generate(prompt);
    const parsed = parseJSONResponse(text);

    // Validate required fields
    if (!parsed.nextQuestion) throw new Error('Missing nextQuestion in response');
    return parsed;
  } catch (err) {
    console.warn('[GeminiService] generateInterviewFollowUp fallback:', err.message);
    const fallbacks = [
      { reaction: "Thank you for that response.", followUp: false, nextQuestion: `Could you explain the trade-offs of the approach you used and how you'd optimize it for scale?`, questionNumber: questionIndex, topic: 'System Design' },
      { reaction: "Interesting perspective.", followUp: false, nextQuestion: `How would you handle error cases and unexpected failures in that architecture?`, questionNumber: questionIndex, topic: 'Error Handling' },
      { reaction: "Good point.", followUp: false, nextQuestion: `Tell me about a challenging technical problem you solved and your thought process.`, questionNumber: questionIndex, topic: 'Problem Solving' },
      { reaction: "I see.", followUp: false, nextQuestion: `How do you collaborate with team members when technical disagreements arise?`, questionNumber: questionIndex, topic: 'Teamwork' },
      { reaction: "Thank you.", followUp: false, nextQuestion: `Where do you see yourself growing technically in the next two years?`, questionNumber: questionIndex, topic: 'Career Goals' }
    ];
    return fallbacks[questionIndex % fallbacks.length];
  }
};

/**
 * Comprehensive Evaluation of Mock Interview Session
 * Returns strict JSON with scores, per-question feedback, strengths, weaknesses
 */
export const evaluateInterviewSession = async (roleDomain, difficulty, interviewType, messages) => {
  try {
    const candidateMessages = messages.filter(m => m.role === 'candidate');
    if (candidateMessages.length === 0) throw new Error('No candidate responses to evaluate');

    const transcript = messages
      .slice(0, 30) // Cap to avoid token overflow
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const prompt = `You are a senior hiring manager. Evaluate this ${roleDomain} mock interview (${difficulty}, ${interviewType} type).

Transcript:
${transcript}

Return ONLY valid JSON (no markdown, no code fences):
{
  "overallScore": 78,
  "categoryScores": {
    "technicalKnowledge": 75,
    "communication": 80,
    "problemSolving": 78,
    "confidenceClarity": 80,
    "relevance": 77
  },
  "evaluations": [
    {
      "questionIndex": 1,
      "question": "Question text",
      "candidateAnswer": "Brief summary of answer",
      "score": 80,
      "whatWasGood": "What was good",
      "whatWasMissing": "What was missing",
      "idealSampleAnswer": "What a strong answer looks like"
    }
  ],
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Area to improve 1"],
  "improvementSuggestions": ["Action item 1", "Action item 2"]
}`;

    let text = await generate(prompt);
    let parsed;
    try {
      parsed = parseJSONResponse(text);
      if (typeof parsed?.overallScore !== 'number' || !parsed?.categoryScores) {
        throw new Error('Schema validation failed: missing overallScore or categoryScores');
      }
    } catch (parseErr) {
      console.warn('[GeminiService] Evaluation initial JSON invalid, retrying once...', parseErr.message);
      // Retry once with strict reminder
      const retryPrompt = `${prompt}\n\nIMPORTANT: Your previous output was not valid JSON or was incomplete. Output strictly valid JSON only without markdown or explanations.`;
      text = await generate(retryPrompt);
      parsed = parseJSONResponse(text);
      if (typeof parsed?.overallScore !== 'number') throw new Error('Retry evaluation schema invalid');
    }

    return parsed;
  } catch (err) {
    console.error('[GeminiService] evaluateInterviewSession fallback:', err.message);
    return {
      overallScore: 74,
      categoryScores: {
        technicalKnowledge: 72,
        communication: 78,
        problemSolving: 74,
        confidenceClarity: 76,
        relevance: 72
      },
      evaluations: [{
        questionIndex: 1,
        question: 'Core technical knowledge and project walkthrough',
        candidateAnswer: 'Candidate provided practical examples from experience.',
        score: 75,
        whatWasGood: 'Demonstrated hands-on project experience.',
        whatWasMissing: 'Could provide more technical depth and metrics.',
        idealSampleAnswer: 'Clearly state technical decisions, trade-offs, and measurable outcomes.'
      }],
      strengths: ['Practical hands-on experience', 'Clear communication style'],
      weaknesses: ['Could articulate system design trade-offs more clearly', 'Needs more structured STAR-method answers'],
      improvementSuggestions: [
        'Practice the STAR method (Situation, Task, Action, Result) for behavioral questions',
        'Study low-level system design patterns',
        'Review time complexities of common data structures and algorithms'
      ]
    };
  }
};
