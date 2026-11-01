import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import StudentProfile from '../models/Student.js';
import CompanyProfile from '../models/Company.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { requireRole } from '../middleware/sessionAuth.js';

const router = express.Router();

const STATUS_LABELS = ['Applied', 'Shortlisted', 'Technical Round', 'HR Round', 'Selected', 'Rejected', 'Withdrawn'];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const resolveStatusValues = (status) => {
    if (!status || status === 'All') {
        return null;
    }

    if (status === 'Shortlisted' || status === 'Resume Shortlisted') {
        return ['Shortlisted', 'Resume Shortlisted'];
    }

    return [status];
};

const getPagination = (query) => {
    const page = Math.max(Number.parseInt(query.page || DEFAULT_PAGE, 10), 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit || DEFAULT_LIMIT, 10), 1), 100);

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};

const normalizeApplicationStatus = (status) => {
    if (status === 'Resume Shortlisted') {
        return 'Shortlisted';
    }

    return status;
};

const buildPaginationMeta = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
});

const safeArray = (value) => Array.isArray(value) ? value : [];

const getRecentActivity = async () => {
    const [recentStudents, recentCompanies, recentAdmins, recentApplications] = await Promise.all([
        StudentProfile.find()
            .sort({ updatedAt: -1 })
            .limit(3)
            .populate('user', 'email userId'),
        CompanyProfile.find()
            .sort({ updatedAt: -1 })
            .limit(3)
            .populate('user', 'email'),
        User.find({ role: 'admin' })
            .sort({ updatedAt: -1 })
            .limit(3)
            .select('name email userId updatedAt createdAt'),
        Application.find()
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate({
                path: 'student',
                select: 'name user',
                populate: {
                    path: 'user',
                    select: 'email userId',
                },
            })
            .populate('company', 'name')
            .populate('job', 'role'),
    ]);

    const items = [
        ...recentStudents.map((student) => ({
            id: `student-${student._id}`,
            module: 'Students',
            title: student.name || student.user?.userId || 'Student profile updated',
            subtitle: student.user?.email || 'Student record updated',
            timestamp: student.updatedAt || student.createdAt,
        })),
        ...recentCompanies.map((company) => ({
            id: `company-${company._id}`,
            module: 'Companies',
            title: company.name || 'Company profile updated',
            subtitle: company.user?.email || company.website || 'Company record updated',
            timestamp: company.updatedAt || company.createdAt,
        })),
        ...recentAdmins.map((admin) => ({
            id: `admin-${admin._id}`,
            module: 'Admins',
            title: admin.name || admin.userId || 'Admin account updated',
            subtitle: admin.email,
            timestamp: admin.updatedAt || admin.createdAt,
        })),
        ...recentApplications.map((application) => ({
            id: `application-${application._id}`,
            module: 'Applications',
            title: `${application.student?.name || 'Student'} -> ${application.company?.name || 'Company'}`,
            subtitle: `${application.job?.role || 'Role'} • ${normalizeApplicationStatus(application.status)}`,
            timestamp: application.updatedAt || application.createdAt,
        })),
    ];

    return items
        .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
        .slice(0, 10);
};

router.use(requireRole('super_admin'));

router.get('/dashboard', async (req, res) => {
    try {
        const [students, companies, admins, applications, statusAgg, recentActivity] = await Promise.all([
            StudentProfile.countDocuments(),
            CompanyProfile.countDocuments(),
            User.countDocuments({ role: 'admin' }),
            Application.countDocuments(),
            Application.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),
            getRecentActivity(),
        ]);

        const statusDistribution = STATUS_LABELS.reduce((accumulator, status) => {
            accumulator[status] = 0;
            return accumulator;
        }, {});

        statusAgg.forEach(({ _id, count }) => {
            const normalizedStatus = normalizeApplicationStatus(_id);
            if (Object.prototype.hasOwnProperty.call(statusDistribution, normalizedStatus)) {
                statusDistribution[normalizedStatus] += count;
            }
        });

        res.json({
            stats: {
                students,
                companies,
                admins,
                applications,
                statusDistribution,
            },
            recentActivity,
        });
    } catch (error) {
        console.error('Super admin dashboard error:', error);
        res.status(500).json({ error: 'Failed to load super admin dashboard' });
    }
});

router.get('/students', async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);
        const search = req.query.search?.trim();
        const filter = {};

        if (search) {
            const users = await User.find({
                role: 'student',
                $or: [
                    { email: new RegExp(search, 'i') },
                    { userId: new RegExp(search, 'i') },
                    { name: new RegExp(search, 'i') },
                ],
            }).select('_id');

            filter.$or = [
                { name: new RegExp(search, 'i') },
                { branch: new RegExp(search, 'i') },
                { year: new RegExp(search, 'i') },
                { user: { $in: users.map((user) => user._id) } },
            ];
        }

        const [students, total] = await Promise.all([
            StudentProfile.find(filter)
                .populate('user', 'email userId name createdAt updatedAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            StudentProfile.countDocuments(filter),
        ]);

        res.json({
            students,
            pagination: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        console.error('Fetch students error:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

router.post('/students', async (req, res) => {
    try {
        const { name, email, password, userId, branch, year, skills, experience, cgpa } = req.body;

        if (!name || !email || !password || !userId) {
            return res.status(400).json({ error: 'Name, email, password, and student ID are required' });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { userId }],
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email or student ID already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            userId,
            role: 'student',
        });

        const student = await StudentProfile.create({
            user: user._id,
            name,
            branch: branch || '',
            year: year || '',
            skills: safeArray(skills),
            experience: experience || '',
            cgpa: cgpa ?? undefined,
        });

        const populatedStudent = await StudentProfile.findById(student._id).populate('user', 'email userId name');
        res.status(201).json({ student: populatedStudent });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ error: 'Failed to create student' });
    }
});

router.put('/students/:id', async (req, res) => {
    try {
        const student = await StudentProfile.findById(req.params.id).populate('user');

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const { name, email, password, userId, branch, year, skills, experience, cgpa } = req.body;

        if (email && email !== student.user.email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: student.user._id } });
            if (existingEmail) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            student.user.email = email;
        }

        if (userId && userId !== student.user.userId) {
            const existingUserId = await User.findOne({ userId, _id: { $ne: student.user._id } });
            if (existingUserId) {
                return res.status(400).json({ error: 'Student ID already exists' });
            }
            student.user.userId = userId;
        }

        if (name !== undefined) {
            student.name = name;
            student.user.name = name;
        }

        if (branch !== undefined) student.branch = branch;
        if (year !== undefined) student.year = year;
        if (skills !== undefined) student.skills = safeArray(skills);
        if (experience !== undefined) student.experience = experience;
        if (cgpa !== undefined) student.cgpa = cgpa;
        if (password) student.user.password = await bcrypt.hash(password, 10);

        await Promise.all([student.save(), student.user.save()]);

        const updatedStudent = await StudentProfile.findById(student._id).populate('user', 'email userId name');
        res.json({ student: updatedStudent });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ error: 'Failed to update student' });
    }
});

router.delete('/students/:id', async (req, res) => {
    try {
        const student = await StudentProfile.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        await Promise.all([
            Application.deleteMany({
                $or: [
                    { student: student._id },
                    { studentId: student._id },
                ],
            }),
            User.findByIdAndDelete(student.user),
            StudentProfile.findByIdAndDelete(student._id),
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Failed to delete student' });
    }
});

router.get('/admins', async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);
        const search = req.query.search?.trim();
        const filter = { role: 'admin' };

        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') },
                { userId: new RegExp(search, 'i') },
            ];
        }

        const [admins, total] = await Promise.all([
            User.find(filter)
                .select('name email userId role createdAt updatedAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        res.json({
            admins,
            pagination: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        console.error('Fetch admins error:', error);
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
});

router.post('/admins', async (req, res) => {
    try {
        const { name, email, password, userId } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, ...(userId ? [{ userId }] : [])],
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email or admin ID already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await User.create({
            name,
            email,
            password: hashedPassword,
            userId: userId || undefined,
            role: 'admin',
        });

        res.status(201).json({
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                userId: admin.userId,
                role: admin.role,
                createdAt: admin.createdAt,
                updatedAt: admin.updatedAt,
            },
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ error: 'Failed to create admin' });
    }
});

router.put('/admins/:id', async (req, res) => {
    try {
        const admin = await User.findOne({ _id: req.params.id, role: 'admin' });

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const { name, email, password, userId } = req.body;

        if (email && email !== admin.email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: admin._id } });
            if (existingEmail) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            admin.email = email;
        }

        if (userId && userId !== admin.userId) {
            const existingUserId = await User.findOne({ userId, _id: { $ne: admin._id } });
            if (existingUserId) {
                return res.status(400).json({ error: 'Admin ID already exists' });
            }
            admin.userId = userId;
        }

        if (name !== undefined) admin.name = name;
        if (password) admin.password = await bcrypt.hash(password, 10);

        await admin.save();

        res.json({
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                userId: admin.userId,
                role: admin.role,
                createdAt: admin.createdAt,
                updatedAt: admin.updatedAt,
            },
        });
    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ error: 'Failed to update admin' });
    }
});

router.delete('/admins/:id', async (req, res) => {
    try {
        if (req.session.userId === req.params.id) {
            return res.status(400).json({ error: 'You cannot delete your own super admin session user from this screen' });
        }

        const deletedAdmin = await User.findOneAndDelete({ _id: req.params.id, role: 'admin' });

        if (!deletedAdmin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ error: 'Failed to delete admin' });
    }
});

router.get('/companies', async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);
        const search = req.query.search?.trim();
        const filter = {};

        if (search) {
            const users = await User.find({
                role: 'company',
                $or: [
                    { email: new RegExp(search, 'i') },
                    { name: new RegExp(search, 'i') },
                ],
            }).select('_id');

            filter.$or = [
                { name: new RegExp(search, 'i') },
                { website: new RegExp(search, 'i') },
                { contactPerson: new RegExp(search, 'i') },
                { user: { $in: users.map((user) => user._id) } },
            ];
        }

        const [companies, total] = await Promise.all([
            CompanyProfile.find(filter)
                .populate('user', 'email name createdAt updatedAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            CompanyProfile.countDocuments(filter),
        ]);

        res.json({
            companies,
            pagination: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        console.error('Fetch companies error:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

router.post('/companies', async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            website,
            description,
            contactPerson,
            phone,
            status,
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'company',
        });

        const company = await CompanyProfile.create({
            user: user._id,
            name,
            website: website || '',
            description: description || '',
            contactPerson: contactPerson || '',
            phone: phone || '',
            status: status || 'approved',
        });

        const populatedCompany = await CompanyProfile.findById(company._id).populate('user', 'email name');
        res.status(201).json({ company: populatedCompany });
    } catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({ error: 'Failed to create company' });
    }
});

router.put('/companies/:id', async (req, res) => {
    try {
        const company = await CompanyProfile.findById(req.params.id).populate('user');

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const {
            name,
            email,
            password,
            website,
            description,
            contactPerson,
            phone,
            status,
        } = req.body;

        if (email && email !== company.user.email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: company.user._id } });
            if (existingEmail) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            company.user.email = email;
        }

        if (name !== undefined) {
            company.name = name;
            company.user.name = name;
        }

        if (website !== undefined) company.website = website;
        if (description !== undefined) company.description = description;
        if (contactPerson !== undefined) company.contactPerson = contactPerson;
        if (phone !== undefined) company.phone = phone;
        if (status !== undefined) company.status = status;
        if (password) company.user.password = await bcrypt.hash(password, 10);

        await Promise.all([company.save(), company.user.save()]);

        const updatedCompany = await CompanyProfile.findById(company._id).populate('user', 'email name');
        res.json({ company: updatedCompany });
    } catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({ error: 'Failed to update company' });
    }
});

router.delete('/companies/:id', async (req, res) => {
    try {
        const company = await CompanyProfile.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const jobs = await Job.find({ company: company._id }).select('_id');
        const jobIds = jobs.map((job) => job._id);

        await Promise.all([
            Application.deleteMany({
                $or: [
                    { company: company._id },
                    { companyId: company._id },
                    { job: { $in: jobIds } },
                ],
            }),
            Job.deleteMany({ company: company._id }),
            User.findByIdAndDelete(company.user),
            CompanyProfile.findByIdAndDelete(company._id),
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({ error: 'Failed to delete company' });
    }
});

router.get('/applications', async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);
        const statusValues = resolveStatusValues(req.query.status);
        const filter = {};

        if (statusValues) {
            filter.status = { $in: statusValues };
        }

        const [applications, total] = await Promise.all([
            Application.find(filter)
                .populate({
                    path: 'student',
                    select: 'name branch year experience cgpa user',
                    populate: {
                        path: 'user',
                        select: 'email userId',
                    },
                })
                .populate('company', 'name')
                .populate('job', 'role location salary')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Application.countDocuments(filter),
        ]);

        const formattedApplications = applications.map((application) => ({
            _id: application._id,
            studentId: application.student?._id || application.studentId,
            companyId: application.company?._id || application.companyId,
            studentName: application.student?.name || 'Unknown',
            studentEmail: application.student?.user?.email || 'N/A',
            studentProfileId: application.student?.user?.userId || 'N/A',
            companyName: application.company?.name || 'N/A',
            jobRole: application.job?.role || 'N/A',
            location: application.job?.location || 'N/A',
            salary: application.job?.salary || 'N/A',
            status: normalizeApplicationStatus(application.status),
            rawStatus: application.status,
            matchScore: application.matchScore,
            answers: application.answers || [],
            dateOfApplication: application.appliedOn || application.createdAt,
            createdAt: application.createdAt,
            updatedAt: application.updatedAt,
            branch: application.student?.branch || '',
            year: application.student?.year || '',
            experience: application.student?.experience || '',
            cgpa: application.student?.cgpa ?? null,
        }));

        res.json({
            applications: formattedApplications,
            pagination: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        console.error('Fetch applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

router.put('/applications/:id', async (req, res) => {
    try {
        const statusValues = resolveStatusValues(req.body.status);
        const nextStatus = statusValues?.[0];

        if (!nextStatus) {
            return res.status(400).json({ error: 'A valid status is required' });
        }

        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { status: nextStatus },
            { new: true }
        );

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json({ application });
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ error: 'Failed to update application' });
    }
});

router.delete('/applications/:id', async (req, res) => {
    try {
        const application = await Application.findByIdAndDelete(req.params.id);

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({ error: 'Failed to delete application' });
    }
});

// GET /api/admin/super/reports/applications
router.get('/reports/applications', async (req, res) => {
    try {
        const { month, year, course, company, exportData, page, limit } = req.query;
        const filter = {};

        if (year) {
            let startMonth = 0;
            let endMonth = 11;
            if (month) {
                startMonth = parseInt(month, 10) - 1;
                endMonth = startMonth;
            }
            
            const startDate = new Date(year, startMonth, 1);
            const endDate = new Date(year, endMonth + 1, 1);
            filter.appliedOn = { $gte: startDate, $lt: endDate };
        }

        if (course) {
            const studentsInCourse = await StudentProfile.find({ 
                branch: new RegExp(`^${course}$`, 'i') 
            }).select('_id');
            filter.student = { $in: studentsInCourse.map((s) => s._id) };
        }

        if (company) {
            const companiesMatching = await CompanyProfile.find({
                name: new RegExp(`${company}`, 'i')
            }).select('_id');
            filter.company = { $in: companiesMatching.map((c) => c._id) };
        }

        const isExport = exportData === 'true';
        const pageNum = Math.max(parseInt(page || DEFAULT_PAGE, 10), 1);
        const limitNum = Math.max(parseInt(limit || 20, 10), 1);
        const skip = (pageNum - 1) * limitNum;

        const query = Application.find(filter)
            .populate({
                path: 'student',
                populate: { path: 'user', select: 'email userId' }
            })
            .populate('company', 'name')
            .populate('job', 'role salary')
            .sort({ appliedOn: -1 });

        if (!isExport) {
            query.skip(skip).limit(limitNum);
        }

        const [applications, total] = await Promise.all([
            query.exec(),
            Application.countDocuments(filter)
        ]);

        const formattedApplications = applications.map((app) => ({
            _id: app._id,
            studentName: app.student?.name || 'N/A',
            studentId: app.student?.user?.userId || 'N/A',
            email: app.student?.user?.email || 'N/A',
            phone: app.student?.phone || 'N/A',
            course: app.student?.branch || 'N/A',
            year: app.student?.year || 'N/A',
            company: app.company?.name || 'N/A',
            role: app.job?.role || 'N/A',
            status: app.status,
            appliedOn: app.appliedOn || app.createdAt,
            skills: app.student?.skills?.join(', ') || 'N/A',
            cgpa: app.student?.cgpa ?? 'N/A',
            placementType: 'N/A',
            package: app.job?.salary || 'N/A'
        }));

        res.json({ 
            report: formattedApplications,
            total,
            pagination: isExport ? null : buildPaginationMeta(pageNum, limitNum, total)
        });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

router.get('/analytics', async (req, res) => {
    try {
        // 1. Status distribution
        const statusCountsAgg = await Application.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        const statusCounts = statusCountsAgg
            .map(({ _id, count }) => ({
                name: normalizeApplicationStatus(_id),
                value: count,
            }))
            .filter((item) => item.value > 0);

        // 2. Monthly trend (last 12 months)
        const now = new Date();
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - 11);

        const monthlyTrendAgg = await Application.aggregate([
            { $match: { appliedOn: { $gte: monthsAgo, $lte: now } } },
            { $group: { _id: { year: { $year: '$appliedOn' }, month: { $month: '$appliedOn' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyTrend = monthlyTrendAgg.map(({ _id, count }) => ({
            month: monthNames[_id.month - 1],
            applications: count,
        }));

        // 3. Placement rate by course (using aggregation with lookup)
        const placementByCourseAgg = await StudentProfile.aggregate([
            {
                $group: {
                    _id: '$branch',
                    totalStudents: { $sum: 1 },
                }
            },
            {
                $lookup: {
                    from: 'applications',
                    let: { studentBranch: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$status', 'Selected'] }
                            }
                        },
                        {
                            $lookup: {
                                from: 'studentprofiles',
                                localField: 'student',
                                foreignField: '_id',
                                as: 'studentInfo'
                            }
                        },
                        {
                            $unwind: '$studentInfo'
                        },
                        {
                            $match: {
                                $expr: { $eq: ['$studentInfo.branch', '$$studentBranch'] }
                            }
                        }
                    ],
                    as: 'selectedApplications'
                }
            },
            {
                $project: {
                    course: { $ifNull: ['$_id', 'Not Specified'] },
                    rate: {
                        $cond: [
                            { $eq: ['$totalStudents', 0] },
                            0,
                            { $round: [{ $multiply: [{ $divide: [{ $size: '$selectedApplications' }, '$totalStudents'] }, 100] }, 0] }
                        ]
                    }
                }
            },
            { $sort: { course: 1 } }
        ]);

        const placementByCourse = placementByCourseAgg.map(item => ({
            course: item.course,
            rate: item.rate
        }));

        // 4. Top 10 companies by applications
        const topCompaniesAgg = await Application.aggregate([
            { $group: { _id: '$company', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'companyprofiles',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'companyData'
                }
            },
            { $unwind: { path: '$companyData', preserveNullAndEmptyArrays: true } },
        ]);

        const topCompanies = topCompaniesAgg.map(({ count, companyData }) => ({
            name: companyData?.name || 'Unknown Company',
            count,
        }));

        res.json({
            statusCounts: statusCounts.length > 0 ? statusCounts : [],
            monthlyTrend: monthlyTrend.length > 0 ? monthlyTrend : [],
            placementByCourse: placementByCourse.length > 0 ? placementByCourse : [],
            topCompanies: topCompanies.length > 0 ? topCompanies : [],
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.json({
            statusCounts: [],
            monthlyTrend: [],
            placementByCourse: [],
            topCompanies: [],
        });
    }
});

export default router;
