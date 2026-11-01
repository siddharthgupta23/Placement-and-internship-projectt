# Deployment & Launch Checklist

## Pre-Launch Verification

### Backend Setup Checklist
- [ ] Node.js installed (v14+)
- [ ] MongoDB Atlas account created
- [ ] MongoDB URI copied to `.env`
- [ ] JWT_SECRET configured in `.env`
- [ ] PORT set to 5000 in `.env`
- [ ] Install dependencies: `npm install`
- [ ] Test server starts: `npm start`
- [ ] No errors in console output

### Database Checklist
- [ ] MongoDB connectivity verified
- [ ] Collections auto-created on first run
- [ ] Connection logs show "MongoDB Connected"
- [ ] Can access MongoDB Atlas dashboard

### Frontend Setup Checklist
- [ ] Install dependencies: `npm install`
- [ ] API_BASE URL points to correct backend (http://localhost:5000/api/coordinator)
- [ ] Tailwind CSS compiles without errors
- [ ] Test dev server: `npm run dev`
- [ ] Can access frontend on http://localhost:5173

### API Endpoints Checklist
- [ ] POST /api/coordinator/register works
- [ ] POST /api/coordinator/login works and returns token
- [ ] GET /api/coordinator/stats works (with token)
- [ ] GET /api/coordinator/companies works (with token)
- [ ] PATCH /api/coordinator/companies/:id/status works (with token)
- [ ] GET /api/coordinator/applications works (with token)

### Authentication Checklist
- [ ] Create at least one coordinator account
- [ ] Coordinator email and password verified
- [ ] Login successful, token received
- [ ] Token stored in localStorage
- [ ] Session persists on page reload
- [ ] Logout clears session

### Feature Checklist
- [ ] Dashboard shows 8 statistic cards
- [ ] Companies tab shows add form
- [ ] Companies tab shows "Registering" and "Registered" sections
- [ ] Approve button moves company to registered
- [ ] Reject button keeps company in registering
- [ ] Applications tab shows table of applications
- [ ] Students tab shows all students
- [ ] Jobs tab shows all jobs
- [ ] Placements tab shows placements
- [ ] Navigation between tabs works
- [ ] All data loads correctly

### Sample Data Checklist
- [ ] (Optional) Run SETUP_TEST_DATA.js
- [ ] Verify 5 students created
- [ ] Verify 5 companies created
- [ ] Verify 3 companies auto-approved
- [ ] Verify 5 jobs created

### Security Checklist
- [ ] Passwords are hashed in database (not plain text)
- [ ] JWT tokens are generated and verified
- [ ] Protected endpoints require token
- [ ] Invalid tokens are rejected
- [ ] Coordinator role is enforced
- [ ] CORS is enabled
- [ ] No sensitive data in API responses

### UI/UX Checklist
- [ ] Login page displays correctly
- [ ] Dashboard is responsive (desktop and mobile)
- [ ] Colors and styling match design
- [ ] Icons display correctly
- [ ] Status badges show correct colors
- [ ] Tables are readable
- [ ] Forms are functional
- [ ] Buttons have hover states
- [ ] Messages display feedback (success/error)

### Error Handling Checklist
- [ ] Backend returns meaningful error messages
- [ ] Frontend displays error messages to user
- [ ] Frontend displays success messages
- [ ] Invalid login shows error
- [ ] Network errors are handled
- [ ] Missing data is handled gracefully
- [ ] Expired token triggers re-login

---

## Test Scenarios

### Scenario 1: Company Registration Workflow
- [ ] Add new company
- [ ] Company appears in "Registering" section
- [ ] Click "Approve" button
- [ ] Company moves to "Registered" section
- [ ] Verify status in database

### Scenario 2: Application Tracking
- [ ] Create fake application via API
- [ ] Application appears in Applications tab
- [ ] View student name, company, job, status
- [ ] Verify application date displays

### Scenario 3: Dashboard Statistics
- [ ] Add 5 companies (not approved)
- [ ] Verify "Registering" count = 5
- [ ] Approve 3 companies
- [ ] Verify "Registered" count = 3
- [ ] Verify both show on dashboard

### Scenario 4: Session Persistence
- [ ] Login to dashboard
- [ ] Refresh page
- [ ] Verify still logged in
- [ ] Navigate to different tabs
- [ ] Refresh again
- [ ] Still logged in
- [ ] Click Logout
- [ ] Redirected to login
- [ ] Verify localStorage cleared

### Scenario 5: Data Integrity
- [ ] Add company
- [ ] Approve company
- [ ] Check database record
- [ ] Verify status field = "registered"
- [ ] Verify registeredDate is set
- [ ] Modify status back to "registering"
- [ ] Refresh frontend
- [ ] Verify shows in registering list

---

## Browser Compatibility Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iPhone Safari, Chrome Mobile)

---

## Performance Testing

- [ ] Dashboard loads in < 2 seconds
- [ ] Data fetches without lag
- [ ] UI remains responsive during API calls
- [ ] No console errors or warnings
- [ ] Network requests are optimized
- [ ] No unused imports or code

---

## Documentation Verification

- [ ] QUICK_START.md is accurate
- [ ] PLACEMENT_COORDINATOR_GUIDE.md covers all features
- [ ] SYSTEM_ARCHITECTURE.md matches implementation
- [ ] CODE_REFERENCE.md code snippets work
- [ ] SETUP_TEST_DATA.js runs successfully
- [ ] README_DOCUMENTATION.md provides good index
- [ ] IMPLEMENTATION_SUMMARY.md is complete

---

## Production Deployment Checklist

### Before Deploying

#### Backend:
- [ ] Remove console.log statements (or use proper logging)
- [ ] Use production MongoDB connection string
- [ ] Use strong JWT_SECRET (> 32 characters)
- [ ] Enable HTTPS
- [ ] Set proper CORS origin URL
- [ ] Configure database backups
- [ ] Set up monitoring/alerts
- [ ] Use process manager (PM2, systemd)
- [ ] Configure environment variables on server
- [ ] Test with production database

#### Frontend:
- [ ] Run `npm run build` successfully
- [ ] No build warnings or errors
- [ ] Dist folder has all assets
- [ ] API_BASE points to production backend
- [ ] Environment variables configured
- [ ] Service worker configured (if using)
- [ ] Cache headers configured
- [ ] Test production build locally

#### Security:
- [ ] SSL/TLS certificate installed
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] Input validation applied
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Sensitive data not logged
- [ ] Dependencies updated to latest secure versions

### Deployment Steps

1. **Backend Deployment**
   ```bash
   # On production server
   git clone <repo-url>
   cd backend
   npm install --production
   # Configure .env with production values
   npm start
   # Or use PM2
   pm2 start server.js --name "placement-api"
   ```

2. **Frontend Deployment**
   ```bash
   # Build locally or on server
   cd frontend
   npm run build
   # Upload dist folder to CDN or web server
   ```

3. **Database Migration**
   - [ ] Backup existing database
   - [ ] Verify new schema (Application model)
   - [ ] Update Company documents with status field
   - [ ] Create indexes for status field

4. **Post-Deployment**
   - [ ] Test all features on production
   - [ ] Verify database connections
   - [ ] Check logs for errors
   - [ ] Monitor performance
   - [ ] Get team feedback

---

## Rollback Plan

If issues occur after deployment:

1. **Immediate Actions**
   - [ ] Check server logs
   - [ ] Check browser console
   - [ ] Check MongoDB status
   - [ ] Verify environment variables

2. **Rollback Steps**
   - [ ] Backend: Revert to previous version
   - [ ] Frontend: Serve previous build
   - [ ] Database: Restore from backup if needed
   - [ ] Verify functionality

3. **Post-Rollback**
   - [ ] Identify root cause
   - [ ] Fix and test locally
   - [ ] Re-deploy after verification

---

## Monitoring & Maintenance

### Daily
- [ ] Check application logs
- [ ] Monitor error rates
- [ ] Verify database connectivity
- [ ] Check API response times

### Weekly
- [ ] Review user feedback
- [ ] Check security logs
- [ ] Update dependencies (if needed)
- [ ] Backup database

### Monthly
- [ ] Performance analysis
- [ ] Security audit
- [ ] User metrics review
- [ ] Plan improvements

---

## Support Resources

**For Issues:**
1. Check backend logs: `npm start` output
2. Check frontend logs: Browser DevTools Console
3. Check database: MongoDB Atlas Dashboard
4. Check network: Browser DevTools Network tab
5. Review error messages carefully
6. Check documentation for solutions

**Contact Points:**
- Backend Errors: Check `npm start` terminal
- Frontend Errors: Check browser DevTools (F12)
- Database Errors: Check MongoDB Atlas logs
- API Errors: Check Network tab in DevTools

---

## Sign-Off

- [ ] Project Manager: Approved
- [ ] Backend Lead: Verified all endpoints
- [ ] Frontend Lead: Verified all UI
- [ ] Security Lead: Verified security measures
- [ ] QA Lead: All test scenarios passed
- [ ] DevOps: Deployment steps documented
- [ ] Documentation Lead: All docs complete

---

## Launch Date

**Planned Launch**: _______________
**Actual Launch**: _______________

**Prepared By**: _______________
**Date**: _______________

**Verified By**: _______________
**Date**: _______________

---

**Use this checklist to ensure smooth deployment and launch!** ✅
