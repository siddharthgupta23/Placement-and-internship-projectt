import express from 'express';
import CompanyReview from '../models/CompanyReview.js';
import CompanyProfile from '../models/Company.js';
import StudentProfile from '../models/Student.js';

const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Please log in' });
  }
  next();
};

// Seed default reviews if none exist
const seedDefaultReviews = async () => {
  const count = await CompanyReview.countDocuments();
  if (count === 0) {
    const companies = await CompanyProfile.find().limit(3);
    const student = await StudentProfile.findOne();
    if (companies.length > 0 && student) {
      await CompanyReview.create([
        {
          company: companies[0]._id,
          student: student._id,
          overallRating: 5,
          processRating: 5,
          cultureRating: 4,
          salaryRating: 5,
          growthRating: 5,
          reviewTitle: 'Exceptional Hiring Process with Fast Feedback',
          interviewProcessReview: '3 rounds total: 1 online DSA assessment, 1 system design / live coding loop, and 1 HR discussion. Interviewers were very supportive and gave feedback in 2 days.',
          workCultureReview: 'Collaborative engineering culture with emphasis on clean code and mentorship.',
          salaryReview: 'Very competitive salary package with performance bonuses and health coverage.',
          tipsForStudents: 'Brush up on dynamic programming and explain your thought process out loud.',
          isAnonymous: true,
          status: 'approved'
        }
      ]);
    }
  }
};

// GET /api/reviews/company/:companyId - Get reviews & average ratings for a company
router.get('/company/:companyId', isAuthenticated, async (req, res) => {
  try {
    await seedDefaultReviews();
    const { companyId } = req.params;

    const reviews = await CompanyReview.find({
      company: companyId,
      status: 'approved'
    })
      .populate('student', 'name branch year')
      .sort({ createdAt: -1 });

    // Calculate aggregations
    const totalReviews = reviews.length;
    let avgOverall = 0, avgProcess = 0, avgCulture = 0, avgSalary = 0, avgGrowth = 0;

    if (totalReviews > 0) {
      avgOverall = (reviews.reduce((acc, r) => acc + r.overallRating, 0) / totalReviews).toFixed(1);
      avgProcess = (reviews.reduce((acc, r) => acc + r.processRating, 0) / totalReviews).toFixed(1);
      avgCulture = (reviews.reduce((acc, r) => acc + r.cultureRating, 0) / totalReviews).toFixed(1);
      avgSalary = (reviews.reduce((acc, r) => acc + r.salaryRating, 0) / totalReviews).toFixed(1);
      avgGrowth = (reviews.reduce((acc, r) => acc + r.growthRating, 0) / totalReviews).toFixed(1);
    }

    res.json({
      reviews,
      stats: {
        totalReviews,
        avgOverall: Number(avgOverall) || 5.0,
        avgProcess: Number(avgProcess) || 4.5,
        avgCulture: Number(avgCulture) || 4.5,
        avgSalary: Number(avgSalary) || 4.5,
        avgGrowth: Number(avgGrowth) || 4.5
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company reviews' });
  }
});

// GET /api/reviews/all - Get all reviews across companies (for exploration / student view)
router.get('/all', isAuthenticated, async (req, res) => {
  try {
    await seedDefaultReviews();
    const reviews = await CompanyReview.find({ status: 'approved' })
      .populate('company', 'name website headquarters branchLocations googleMapsUrl')
      .populate('student', 'name branch year')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews - Student submits or updates review
router.post('/', isAuthenticated, async (req, res) => {
  try {
    if (req.session.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit company reviews' });
    }

    const student = await StudentProfile.findOne({ user: req.session.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const {
      companyId,
      overallRating,
      processRating,
      cultureRating,
      salaryRating,
      growthRating,
      reviewTitle,
      interviewProcessReview,
      workCultureReview,
      salaryReview,
      tipsForStudents,
      isAnonymous
    } = req.body;

    // Basic profanity / sanitization check
    const profanities = ['badword1', 'abuse'];
    const fullText = `${reviewTitle} ${interviewProcessReview} ${workCultureReview}`.toLowerCase();
    if (profanities.some(p => fullText.includes(p))) {
      return res.status(400).json({ error: 'Review contains inappropriate language. Please keep it professional.' });
    }

    const review = await CompanyReview.findOneAndUpdate(
      { company: companyId, student: student._id },
      {
        overallRating: Number(overallRating) || 5,
        processRating: Number(processRating) || 4,
        cultureRating: Number(cultureRating) || 4,
        salaryRating: Number(salaryRating) || 4,
        growthRating: Number(growthRating) || 4,
        reviewTitle,
        interviewProcessReview,
        workCultureReview,
        salaryReview,
        tipsForStudents,
        isAnonymous: Boolean(isAnonymous),
        status: 'approved'
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, review });

  } catch (err) {
    console.error('Review submit error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// PATCH /api/reviews/:id/report - Report a review for moderation
router.patch('/:id/report', isAuthenticated, async (req, res) => {
  try {
    const { reason } = req.body;
    const review = await CompanyReview.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    review.reportCount += 1;
    if (reason) review.reportedReasons.push(reason);
    if (review.reportCount >= 3) review.status = 'pending'; // Auto flag for moderation

    await review.save();
    res.json({ success: true, message: 'Review reported for moderation' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to report review' });
  }
});

// Admin moderation: approve / hide / delete
router.patch('/:id/moderate', isAuthenticated, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.session.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.body;
    const review = await CompanyReview.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: 'Failed to moderate review' });
  }
});

export default router;
