export const getDashboardPath = (role) => {
    switch (role) {
        case 'student':
            return '/student-dashboard';
        case 'company':
            return '/company-dashboard';
        case 'admin':
            return '/admin-dashboard';
        case 'super_admin':
            return '/super-admin-dashboard';
        default:
            return '/';
    }
};
