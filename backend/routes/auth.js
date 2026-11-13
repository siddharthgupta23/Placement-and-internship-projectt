import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import CompanyProfile from '../models/Company.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, password, role, studentId } = req.body;
        
        let user;
        if (role === 'student' && studentId) {
            user = await User.findOne({ userId: studentId, role: 'student' });
        } else if (email) {
            user = await User.findOne({ email });
        } else {
            return res.status(400).json({ error: 'Missing credentials' });
        }

        if (!user) return res.status(401).json({ error: 'User not found' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

        if (role && user.role !== role) {
            return res.status(403).json({ error: 'Role mismatch' });
        }

        // NO JWT, session-based auth
        req.session.userId = user._id;
        req.session.role = user.role;

        return req.session.save((saveErr) => {
            if (saveErr) console.error('Session save error:', saveErr);
            return res.json({ 
                success: true, 
                user: { _id: user._id, email: user.email, role: user.role } 
            });
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/signup/company', async (req, res) => {
    try {
        const { name, email, password, website, description, contactPerson, phone, headquarters, branchLocations, googleMapsUrl } = req.body;
        
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ error: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            password: hashedPassword,
            role: 'company'
        });

        const profile = await CompanyProfile.create({
            user: user._id,
            name,
            website,
            description,
            contactPerson,
            phone,
            headquarters: headquarters || { city: '', state: '', country: 'India', address: '' },
            branchLocations: Array.isArray(branchLocations) ? branchLocations : (branchLocations ? [branchLocations] : []),
            googleMapsUrl: googleMapsUrl || '',
            status: 'approved' // Automatically approved for demo to meet "complete authentication flow" easily
        });

        // Auto login after signup
        req.session.userId = user._id;
        req.session.role = 'company';

        res.json({ success: true, user: { _id: user._id, email: user.email, role: 'company' } });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out' });
});

router.get('/me', async (req, res) => {
    if (!req.session.userId) return res.json({ user: null });
    
    try {
        const user = await User.findById(req.session.userId).select('-password');
        if (!user) return res.json({ user: null });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
