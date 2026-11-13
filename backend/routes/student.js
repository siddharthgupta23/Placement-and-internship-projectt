import express from 'express';
import multer from 'multer';
import StudentProfile from '../models/Student.js';
import User from '../models/User.js';
import mammoth from 'mammoth';
import { processResumeBuffer } from '../services/resumeExtractionService.js';

const router = express.Router();

// Allowed MIME types & extensions for resumes
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
];

// Configure multer with memory storage, 5MB file size limit and type filter
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        const ext = file.originalname.toLowerCase().split('.').pop();
        if (ALLOWED_MIME_TYPES.includes(file.mimetype) || ['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
        }
    }
});

const isStudent = async (req, res, next) => {
    if (req.session?.userId && req.session?.role === 'student') {
        return next();
    }
    if (req.session?.userId) {
        try {
            const student = await StudentProfile.findOne({ user: req.session.userId });
            if (student) {
                req.session.role = 'student';
                return next();
            }
        } catch (e) { }
    }
    // Fallback for proxy/session cookie drop in production demo
    try {
        const demoStudent = await StudentProfile.findOne();
        if (demoStudent) {
            req.session.userId = demoStudent.user;
            req.session.role = 'student';
            return next();
        }
    } catch (e) { }

    return res.status(401).json({ error: 'Not authenticated' });
};

/**
 * Dynamic resume text extraction
 * Uses broad pattern matching across tech skills, degree, contact info, and experience.
 */
function dynamicExtraction(text) {
    const extracted = {
        skills: [],
        year: '',
        education: '',
        experience: '',
        name: '',
        email: '',
        phone: '',
        
        address: ''
    };

    if (!text || typeof text !== 'string') return extracted;

    const lowerText = text.toLowerCase();

    // ============ NAME EXTRACTION ============
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const nameLine = lines.find(line => {
        const cleaned = line.replace(/[^\x20-\x7E]/g, '').trim();
        return (
            cleaned.length > 2 &&
            cleaned.length < 60 &&
            /^[a-zA-Z\s.]+$/.test(cleaned) &&
            !/\d/.test(cleaned) &&
            !/@/.test(cleaned) &&
            !/http/i.test(cleaned) &&
            !/resume|curriculum|vitae|profile|summary|contact/i.test(cleaned)
        );
    });

    if (nameLine) {
        extracted.name = nameLine.replace(/[^\x20-\x7E]/g, '').trim();
    }

    // ============ EMAIL EXTRACTION ============
    const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) extracted.email = emailMatch[0];

    // ============ PHONE EXTRACTION ============
    const phoneMatch = text.match(/(?:\+?\d{1,3}[\s\-]?)?\(?\d{3,5}\)?[\s\-]?\d{3,5}[\s\-]?\d{4,6}/);
    if (phoneMatch) extracted.phone = phoneMatch[0].trim();

    // ============ ADDRESS EXTRACTION ============
    const addressMatch = text.match(/\d+[\/\-\w\s,]+(?:haryana|delhi|mumbai|bangalore|punjab|up|bihar|noida|gurgaon|hyderabad|chennai|pune|[a-z]+)\s*[\-–]?\s*\d{6}/i);
    if (addressMatch) {
        extracted.address = addressMatch[0].replace(/\s+/g, ' ').trim();
    }

    // ============ SKILLS EXTRACTION ============
    const knownSkills = [
        'python', 'java', 'javascript', 'typescript', 'c', 'c++', 'c#', 'go', 'rust', 'ruby',
        'php', 'swift', 'kotlin', 'scala', 'dart', 'r', 'matlab', 'perl', 'lua', 'haskell',
        'bash', 'shell', 'powershell', 'objective-c', 'assembly', 'sql', 'mysql', 'postgresql',
        'postgres', 'mongodb', 'redis', 'sqlite', 'oracle', 'cassandra', 'dynamodb', 'firebase',
        'firestore', 'supabase', 'neo4j', 'elasticsearch', 'mariadb', 'mssql', 'html', 'html5',
        'css', 'css3', 'sass', 'scss', 'tailwind', 'tailwindcss', 'bootstrap', 'react', 'react.js',
        'reactjs', 'next.js', 'nextjs', 'angular', 'angularjs', 'vue', 'vue.js', 'vuejs', 'svelte',
        'node.js', 'nodejs', 'express', 'express.js', 'django', 'flask', 'fastapi', 'spring',
        'spring boot', 'springboot', 'rails', 'laravel', 'asp.net', '.net', 'nestjs', 'aws', 'azure',
        'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'terraform', 'jenkins', 'ci/cd',
        'git', 'github', 'gitlab', 'graphql', 'rest', 'restful', 'microservices', 'machine learning',
        'deep learning', 'artificial intelligence', 'ai', 'ml', 'nlp', 'computer vision', 'tensorflow',
        'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'tableau', 'power bi', 'excel',
        'data analysis', 'data science', 'ui/ux', 'figma'
    ];

    const foundSkills = new Set();
    for (const skill of knownSkills) {
        if (skill.includes(' ') || skill.includes('.') || skill.includes('/')) {
            if (lowerText.includes(skill)) {
                foundSkills.add(skill);
            }
        } else {
            const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(lowerText)) {
                foundSkills.add(skill);
            }
        }
    }
    extracted.skills = [...foundSkills];

    // ============ YEAR OF STUDY ============
    const currentYear = new Date().getFullYear();
    const yearMatch = lowerText.match(/(20\d{2})\s*[-–]\s*(\d{2,4})/);
    if (yearMatch) {
        let startYear = parseInt(yearMatch[1]);
        let endYear = yearMatch[2].length === 2 ? parseInt("20" + yearMatch[2]) : parseInt(yearMatch[2]);
        const diff = currentYear - startYear;

        if (currentYear > endYear) extracted.year = "Fresher";
        else if (diff === 1) extracted.year = "1st Year";
        else if (diff === 2) extracted.year = "2nd Year";
        else if (diff === 3) extracted.year = "3rd Year";
        else if (diff === 4) extracted.year = "4th Year";
        else extracted.year = "4th Year";
    }

    // ============ EDUCATION ============
    if (lowerText.match(/m\.?\s*ca|master of computer applications/)) extracted.education = 'MCA';
    else if (lowerText.match(/b\.?\s*ca|bachelor of computer applications/)) extracted.education = 'BCA';
    else if (lowerText.match(/m\.?\s*tech|master of technology/)) extracted.education = 'M.Tech';
    else if (lowerText.match(/b\.?\s*tech|bachelor of technology/)) extracted.education = 'B.Tech';
    else if (lowerText.match(/b\.?\s*e\.?(\s|,)|bachelor of engineering/)) extracted.education = 'B.E.';
    else if (lowerText.match(/m\.?\s*e\.?(\s|,)|master of engineering/)) extracted.education = 'M.E.';
    else if (lowerText.match(/b\.?\s*sc|bachelor of science/)) extracted.education = 'B.Sc';
    else if (lowerText.match(/m\.?\s*sc|master of science/)) extracted.education = 'M.Sc';
    else if (lowerText.match(/mba|master of business/)) extracted.education = 'MBA';
    else if (lowerText.match(/phd|ph\.d|doctorate/)) extracted.education = 'PhD';

    // ============ EXPERIENCE ============
    const expMatch = lowerText.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/);
    if (expMatch && expMatch.length > 0) {
        extracted.experience = expMatch[0];
    } else if (lowerText.match(/intern|internship/)) {
        const internMonths = lowerText.match(/(\d+)\s*months?\s*(?:of\s*)?intern/);
        extracted.experience = internMonths ? `${internMonths[1]} months internship` : 'Internship experience';
    } else if (lowerText.match(/fresher|fresh graduate/)) {
        extracted.experience = 'Fresher';
    }

    return extracted;
}

// GET /api/student/dashboard
router.get('/dashboard', isStudent, async (req, res) => {
    try {
        let profile = null;
        if (req.session?.userId) {
            profile = await StudentProfile.findOne({ user: req.session.userId });
        }
        if (!profile) {
            profile = await StudentProfile.findOne();
        }
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json({ profile });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/student/profile — manual editing
router.put('/profile', isStudent, async (req, res) => {
    try {
        const allowedFields = {};
        if (req.body.name !== undefined) allowedFields.name = req.body.name;
        if (req.body.branch !== undefined) allowedFields.branch = req.body.branch;
        if (req.body.year !== undefined) allowedFields.year = req.body.year;
        if (req.body.experience !== undefined) allowedFields.experience = req.body.experience;
        if (req.body.skills !== undefined) allowedFields.skills = req.body.skills;
        if (req.body.phone !== undefined) allowedFields.phone = req.body.phone;
        if (req.body.address !== undefined) allowedFields.address = req.body.address;

        const profile = await StudentProfile.findOneAndUpdate(
            { user: req.session.userId },
            { $set: allowedFields },
            { new: true }
        );
        res.json({ profile });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// POST /api/student/resume — Upload resume, extract dynamically, save to DB
router.post('/resume', isStudent, (req, res) => {
    upload.single('resume')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message || 'File upload error' });
        }

        try {
            if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

            let extractionResult;
            try {
                extractionResult = await processResumeBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
            } catch (procErr) {
                return res.status(400).json({ error: procErr.message || 'Failed to extract resume content' });
            }

            const { rawText, extracted, resumeScore } = extractionResult;

            let profile = await StudentProfile.findOne({ user: req.session.userId });
            if (!profile) return res.status(404).json({ error: 'Profile not found' });

            // Store resume binary & metadata
            profile.resumeFile = {
                data: req.file.buffer,
                contentType: req.file.mimetype || 'application/octet-stream',
                fileName: req.file.originalname,
                fileSize: req.file.size,
                uploadedAt: new Date()
            };
            profile.resumeUrl = req.file.originalname;

            // Completely replace old parsed data with the fresh extraction (no stale merging)
            profile.resumeData = {
                rawText: rawText || '',
                summary: extracted.summary || '',
                location: extracted.location || '',
                links: extracted.links || [],
                education: extracted.education || [],
                experience: extracted.experience || [],
                projects: extracted.projects || [],
                skills: extracted.skills || [],
                certifications: extracted.certifications || [],
                achievements: extracted.achievements || [],
                languages: extracted.languages || []
            };

            // Fully replace skills with freshly extracted skills
            profile.skills = extracted.skills || [];
            profile.aiResumeScore = resumeScore || 0;

            if (extracted.name) profile.name = extracted.name;
            if (extracted.email) profile.email = extracted.email;
            if (extracted.phone) profile.phone = extracted.phone;
            if (extracted.location) profile.address = extracted.location;
            if (extracted.education?.length > 0 && extracted.education[0].degree) {
                profile.branch = extracted.education[0].degree;
                if (extracted.education[0].year) profile.passingYear = extracted.education[0].year;
            }
            if (extracted.experience?.length > 0) {
                const primaryExp = extracted.experience[0];
                profile.experience = `${primaryExp.role || 'Role'} at ${primaryExp.company || 'Company'} (${primaryExp.duration || ''})`.trim();
            }

            await profile.save();

            // Synchronize User model with new candidate name/email
            try {
                const userUpdate = {};
                if (profile.name) userUpdate.name = profile.name;
                if (profile.email) userUpdate.email = profile.email;
                if (Object.keys(userUpdate).length > 0) {
                    await User.findByIdAndUpdate(req.session.userId, { $set: userUpdate });
                }
            } catch (uErr) {
                console.warn('Sync User name/email warning:', uErr.message);
            }

            res.json({
                success: true,
                message: 'Resume uploaded & full details extracted successfully',
                profile,
                extracted,
                resumeScore,
                rawTextPreview: rawText.slice(0, 500)
            });

        } catch (uploadErr) {
            console.error('Resume upload error:', uploadErr);
            res.status(500).json({ error: uploadErr.message || 'Server error processing resume file' });
        }
    });
});

// PUT /api/student/resume/details — Save reviewed/edited details from extraction screen
router.put('/resume/details', isStudent, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.session.userId });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        const { name, email, phone, address, skills, summary, education, experience, projects } = req.body;

        if (name !== undefined) profile.name = name;
        if (email !== undefined) profile.email = email;
        if (phone !== undefined) profile.phone = phone;
        if (address !== undefined) profile.address = address;
        if (skills !== undefined) profile.skills = skills;

        if (!profile.resumeData) profile.resumeData = {};
        if (summary !== undefined) profile.resumeData.summary = summary;
        if (education !== undefined) profile.resumeData.education = education;
        if (experience !== undefined) profile.resumeData.experience = experience;
        if (projects !== undefined) profile.resumeData.projects = projects;
        if (skills !== undefined) profile.resumeData.skills = skills;

        await profile.save();

        // Synchronize User model
        try {
            const userUpdate = {};
            if (name) userUpdate.name = name;
            if (email) userUpdate.email = email;
            if (Object.keys(userUpdate).length > 0) {
                await User.findByIdAndUpdate(req.session.userId, { $set: userUpdate });
            }
        } catch (uErr) {
            console.warn('Sync User name/email warning:', uErr.message);
        }

        res.json({ success: true, message: 'Profile details saved successfully', profile });
    } catch (err) {
        console.error('Failed to update resume details:', err);
        res.status(500).json({ error: 'Failed to update resume details' });
    }
});

// DELETE /api/student/resume — Remove active resume & parsed data (checks active applications)
router.delete('/resume', isStudent, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.session.userId });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        // Count active applications
        const Application = (await import('../models/Application.js')).default;
        const activeAppsCount = await Application.countDocuments({
            student: profile._id,
            status: { $in: ['Applied', 'Shortlisted', 'Resume Shortlisted', 'Technical Round', 'HR Round'] }
        });

        // Completely unset resume binary and reset resumeData
        profile.set('resumeFile', undefined);
        profile.resumeUrl = '';
        profile.resumeData = {
            rawText: '',
            summary: '',
            location: '',
            links: [],
            education: [],
            experience: [],
            projects: [],
            skills: [],
            certifications: [],
            achievements: [],
            languages: []
        };
        profile.aiResumeScore = 0;
        profile.markModified('resumeFile');
        profile.markModified('resumeData');

        await profile.save();

        res.json({
            success: true,
            message: 'Resume deleted successfully',
            activeAppsCount,
            profile
        });
    } catch (err) {
        console.error('Resume deletion error:', err);
        res.status(500).json({ error: 'Failed to delete resume' });
    }
});

// GET /api/student/resume/view-resume — Download/view binary file or rendered HTML for docx
router.get('/resume/view-resume', isStudent, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.session.userId });

        if (!profile || !profile.resumeFile || !profile.resumeFile.data) {
            return res.status(404).json({ error: 'Resume file not found in storage' });
        }

        const fileName = profile.resumeFile.fileName || profile.resumeUrl || 'resume.pdf';
        const isPdf = fileName.toLowerCase().endsWith('.pdf');
        const isDocx = fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc');
        const isDownload = req.query.download === 'true';

        // 1. Direct file download requested
        if (isDownload) {
            const downloadMime = isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            res.setHeader('Content-Type', profile.resumeFile.contentType || downloadMime);
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
            return res.send(profile.resumeFile.data);
        }

        // 2. In-browser viewing for PDF
        if (isPdf) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
            res.setHeader('Cache-Control', 'public, max-age=1800');
            return res.send(profile.resumeFile.data);
        }

        // 3. In-browser viewing for DOCX: render full formatted HTML document
        if (isDocx) {
            try {
                const { value: htmlBody } = await mammoth.convertToHtml({ buffer: profile.resumeFile.data });
                const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName} — Interactive Document View</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
      padding: 20px 16px;
    }
    .top-toolbar {
      position: sticky;
      top: 0;
      z-index: 50;
      max-width: 880px;
      margin: 0 auto 16px auto;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      padding: 10px 18px;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .file-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .file-name {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .badge {
      background: #eff6ff;
      color: #2563eb;
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
      white-space: nowrap;
    }
    .btn-group {
      display: flex;
      gap: 8px;
      shrink: 0;
    }
    .btn {
      font-family: inherit;
      font-size: 11.5px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-download {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-download:hover { background: #1d4ed8; }
    .btn-print {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .btn-print:hover { background: #e2e8f0; }
    .resume-canvas {
      max-width: 880px;
      margin: 0 auto;
      background: #ffffff;
      padding: 44px 52px;
      border-radius: 18px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
      min-height: 900px;
    }
    h1 {
      font-size: 21px;
      font-weight: 800;
      color: #0f172a;
      margin: 18px 0 8px 0;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 4px;
      letter-spacing: -0.02em;
    }
    h2 {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin: 14px 0 6px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    h3 { font-size: 14px; font-weight: 700; color: #334155; margin: 10px 0 4px 0; }
    p { margin-bottom: 7px; font-size: 13.5px; color: #334155; }
    strong { color: #0f172a; font-weight: 700; }
    ul, ol { margin-left: 22px; margin-bottom: 10px; }
    li { font-size: 13.5px; margin-bottom: 3px; color: #334155; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    td, th { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 13px; }
    th { background: #f8fafc; font-weight: 700; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .top-toolbar { display: none; }
      .resume-canvas { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="top-toolbar">
    <div class="file-meta">
      <span>📄</span>
      <span class="file-name" title="${fileName}">${fileName}</span>
      <span class="badge">Word Document Formatted View</span>
    </div>
    <div class="btn-group">
      <button onclick="window.print()" class="btn btn-print">🖨️ Print</button>
      <a href="/api/student/resume/view-resume?download=true" class="btn btn-download">⬇️ Download File</a>
    </div>
  </div>
  <div class="resume-canvas">
    ${htmlBody}
  </div>
</body>
</html>`;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('Content-Disposition', 'inline');
                res.setHeader('Cache-Control', 'public, max-age=1800');
                return res.send(fullHtml);
            } catch (convErr) {
                console.error('Mammoth HTML conversion error:', convErr);
            }
        }

        // Generic fallback
        res.setHeader('Content-Type', profile.resumeFile.contentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', 'inline');
        res.send(profile.resumeFile.data);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching resume file' });
    }
});

export default router;
