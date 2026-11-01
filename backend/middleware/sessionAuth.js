export const requireAuth = (req, res, next) => {
    if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    next();
};

export const requireRole = (...roles) => (req, res, next) => {
    if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.session.role)) {
        return res.status(403).json({ error: 'Access denied' });
    }

    next();
};
