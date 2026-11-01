import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { 
  FileText, Upload, Download, Trash2, Edit3, CheckCircle2, 
  AlertTriangle, RefreshCw, Sparkles, ExternalLink, GraduationCap, 
  Briefcase, FolderGit2, Code2, Award, Globe, Plus, X, Eye
} from 'lucide-react';

export default function StudentResumeManager({ profile, onProfileUpdated }) {
  const [activeProfile, setActiveProfile] = useState(profile || null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Sync profile when prop changes or auto-fetch if missing
  useEffect(() => {
    if (profile) {
      setActiveProfile(profile);
    } else {
      api.get('/student/dashboard')
        .then(res => {
          if (res.data?.profile) {
            setActiveProfile(res.data.profile);
            if (onProfileUpdated) onProfileUpdated(res.data.profile);
          }
        })
        .catch(() => {});
    }
  }, [profile]);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [rawTextPreview, setRawTextPreview] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Success toast
  const [toastMessage, setToastMessage] = useState('');

  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const [viewingResume, setViewingResume] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPdfPreview, setIsPdfPreview] = useState(true);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    setUploadError('');
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5 MB limit. Please select a smaller resume.');
      return;
    }

    const fileName = file.name || '';
    const ext = fileName.toLowerCase().split('.').pop();
    if (!['pdf', 'docx'].includes(ext)) {
      setUploadError('Invalid format. Only PDF and DOCX documents are accepted for AI parsing.');
      return;
    }

    setSelectedFile(file);
    startUpload(file);
  };

  const handleViewResume = async (action = 'preview') => {
    setViewingResume(true);
    try {
      const isDownloadAction = action === 'download';
      const endpoint = `/student/resume/view-resume${isDownloadAction ? '?download=true' : ''}`;
      const res = await api.get(endpoint, { responseType: 'blob' });
      
      const fileName = activeProfile?.resumeFile?.fileName || activeProfile?.resumeUrl || 'resume.pdf';
      const isPdf = fileName.toLowerCase().endsWith('.pdf');
      
      // Accurately detect HTML document vs PDF binary
      const resMime = res.data?.type || res.headers?.['content-type'] || '';
      const isHtml = resMime.includes('text/html');
      const mime = isHtml ? 'text/html' : (isPdf ? 'application/pdf' : (resMime || 'application/octet-stream'));
      
      const blob = new Blob([res.data], { type: mime });
      const blobUrl = window.URL.createObjectURL(blob);

      if (isDownloadAction) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
      } else {
        // In-browser preview action: loads formatted HTML or native PDF
        setPreviewUrl(blobUrl);
        setIsPdfPreview(!isHtml && isPdf);
        setShowPreviewModal(true);
      }
    } catch (err) {
      console.error('Error viewing resume:', err);
      alert('Unable to open resume file. Please ensure a valid resume is uploaded.');
    } finally {
      setViewingResume(false);
    }
  };

  const startUpload = async (fileToUpload) => {
    setUploading(true);
    setProcessing(false);
    setUploadProgress(15);
    setStatusMessage('Uploading document to server...');
    setUploadError('');

    const formData = new FormData();
    formData.append('resume', fileToUpload);

    try {
      setUploadProgress(60);
      setStatusMessage('Extracting text, contact info, education & projects with AI...');
      setProcessing(true);

      const res = await api.post('/student/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (pe) => {
          if (pe.total) {
            const p = Math.round((pe.loaded * 75) / pe.total);
            setUploadProgress(p);
          }
        }
      });

      setUploadProgress(100);
      setUploading(false);
      setProcessing(false);
      setStatusMessage('');
      setSelectedFile(null);

      const { profile: updatedProfile, extracted, resumeScore, rawTextPreview: rawTxt } = res.data;
      if (updatedProfile) {
        setActiveProfile(updatedProfile);
        if (onProfileUpdated) onProfileUpdated(updatedProfile);
      }

      setExtractedData(extracted || updatedProfile?.resumeData);
      setRawTextPreview(rawTxt || '');
      setShowReviewModal(true);
      showToast('🎉 Resume uploaded & extracted successfully! Please review details below.');
    } catch (err) {
      setUploading(false);
      setProcessing(false);
      setUploadProgress(0);
      setUploadError(err.response?.data?.error || 'Failed to process resume document. Please retry.');
    }
  };

  const handleSaveReviewedDetails = async () => {
    if (!extractedData) return;
    setSavingDetails(true);

    try {
      const res = await api.put('/student/resume/details', {
        name: extractedData.name,
        email: extractedData.email,
        phone: extractedData.phone,
        address: extractedData.location,
        summary: extractedData.summary,
        skills: extractedData.skills,
        education: extractedData.education,
        experience: extractedData.experience,
        projects: extractedData.projects
      });

      if (res.data?.profile) {
        setActiveProfile(res.data.profile);
        if (onProfileUpdated) onProfileUpdated(res.data.profile);
      }
      setShowReviewModal(false);
      setSavingDetails(false);
      showToast('✅ Profile details successfully verified and saved!');
    } catch (err) {
      setSavingDetails(false);
      alert(err.response?.data?.error || 'Failed to save updated profile details');
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.delete('/student/resume');
      const updated = res.data?.profile || {
        ...activeProfile,
        resumeFile: null,
        resumeUrl: '',
        resumeData: null,
        aiResumeScore: 0
      };
      setActiveProfile(updated);
      if (onProfileUpdated) onProfileUpdated(updated);
      setShowDeleteModal(false);
      setDeleting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('🗑️ Resume and parsed data deleted from your profile.');
    } catch (err) {
      setDeleting(false);
      alert(err.response?.data?.error || 'Failed to delete resume');
    }
  };

  const hasResume = !!(
    activeProfile?.resumeFile?.data || 
    activeProfile?.resumeFile?.fileName || 
    activeProfile?.resumeUrl
  );
  const resumeMeta = activeProfile?.resumeFile || {};
  const resumeData = activeProfile?.resumeData || {};
  const score = activeProfile?.aiResumeScore || 75;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* Main Resume Card Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-blue-200">
            📄 Automated Resume Profiling
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Student Resume & ATS Profile</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Upload your latest resume (PDF or DOCX). Our dual-layer AI extractor parses education, projects, skills, and experience with zero data loss.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            disabled={uploading}
            onClick={triggerFileInput}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {hasResume ? 'Replace / Upload New Resume' : 'Upload Resume (PDF/DOCX)'}
          </button>

          {hasResume && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-2xl text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Delete Resume
            </button>
          )}
        </div>
      </div>

      {/* Live Upload & Extraction Progress Bar */}
      {uploading && (
        <div className="bg-white p-6 rounded-3xl border border-blue-200 shadow-md space-y-3 animate-fade-in">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              {statusMessage || 'Processing document...'}
            </span>
            <span className="text-blue-700 font-extrabold">{uploadProgress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-700 font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{uploadError}</span>
          </div>
          <button
            onClick={triggerFileInput}
            className="px-3 py-1.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition cursor-pointer"
          >
            Retry Extraction
          </button>
        </div>
      )}

      {/* Current Resume Overview & Score */}
      {hasResume ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Card & Score */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 truncate" title={resumeMeta.fileName || activeProfile?.resumeUrl}>
                  {resumeMeta.fileName || activeProfile?.resumeUrl || 'resume.pdf'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {resumeMeta.fileSize ? `${Math.round(resumeMeta.fileSize / 1024)} KB` : 'Uploaded'} · {resumeMeta.uploadedAt ? new Date(resumeMeta.uploadedAt).toLocaleDateString('en-IN') : 'Active'}
                </p>
              </div>
            </div>

            {/* Resume Score Gauge */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center gap-1.5 text-blue-300">
                  <Sparkles className="w-3.5 h-3.5" /> AI Resume Strength
                </span>
                <span className="text-xl font-black text-white">{score}/100</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    score >= 75 ? 'bg-emerald-400' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-[10px] text-blue-100/70 pt-1">
                {score >= 75 ? 'Excellent ATS keyword match & completeness' : 'Add more project details and certifications to increase ranking'}
              </p>
            </div>

            {/* Download, Replace & Delete Actions */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={viewingResume}
                  onClick={() => handleViewResume('preview')}
                  className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" /> {viewingResume ? 'Loading...' : 'View in Browser'}
                </button>
                <button
                  type="button"
                  disabled={viewingResume}
                  onClick={() => handleViewResume('download')}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setExtractedData(activeProfile?.resumeData || {});
                    setShowReviewModal(true);
                  }}
                  className="py-2 px-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Edit Details
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={triggerFileInput}
                  className="py-2 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Replace
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="py-2 px-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </div>

          {/* Parsed Details Summary (2 cols) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm">Extracted Profile Data</h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full">
                Synchronized
              </span>
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block font-semibold">Name</span>
                <span className="font-bold text-slate-800 mt-0.5 block truncate">
                  {activeProfile?.name || activeProfile?.resumeData?.name || 'Not provided'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block font-semibold">Email</span>
                <span className="font-bold text-slate-800 mt-0.5 block truncate">
                  {activeProfile?.email || activeProfile?.resumeData?.email || 'Not provided'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block font-semibold">Phone</span>
                <span className="font-bold text-slate-800 mt-0.5 block truncate">
                  {activeProfile?.phone || activeProfile?.resumeData?.phone || 'Not provided'}
                </span>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-blue-600" /> Extracted Skills ({(activeProfile?.skills?.length || activeProfile?.resumeData?.skills?.length || 0)})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {((activeProfile?.skills?.length > 0 ? activeProfile.skills : (activeProfile?.resumeData?.skills || [])).length > 0) ? (
                  (activeProfile?.skills?.length > 0 ? activeProfile.skills : (activeProfile?.resumeData?.skills || [])).map((s, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-800 border border-blue-200/80 px-2.5 py-1 rounded-xl text-xs font-bold">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No skills extracted yet.</span>
                )}
              </div>
            </div>

            {/* Education Items */}
            {resumeData.education?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Education History
                </h4>
                <div className="space-y-2">
                  {resumeData.education.map((edu, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{edu.degree}</span>
                        <p className="text-[11px] text-slate-500">{edu.institution}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-indigo-700">{edu.grade || 'Completed'}</span>
                        <p className="text-[11px] text-slate-400">{edu.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience & Projects Preview */}
            {resumeData.projects?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" /> Projects ({resumeData.projects.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {resumeData.projects.map((proj, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-800 block truncate">{proj.name}</span>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white p-12 md:p-16 rounded-3xl border-2 border-dashed border-slate-300 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No Resume Uploaded Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Upload your resume in PDF or DOCX format. Our dual-layer AI will extract all contact info, skills, education, and past experience automatically.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition shadow-md cursor-pointer"
          >
            Upload Resume Now
          </button>
        </div>
      )}

      {/* Review & Edit Extracted Details Modal */}
      {showReviewModal && extractedData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 animate-fade-in border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Step 2 of 2: Verification
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1.5">Review Extracted Resume Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">Edit any fields before saving them permanently to your candidate profile.</p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Warning if essential contact details are missing */}
            {(!extractedData.phone || !extractedData.email) && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-900 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Some contact fields could not be extracted automatically. Please fill them in below.</span>
              </div>
            )}

            <div className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={extractedData.name || ''}
                    onChange={e => setExtractedData({ ...extractedData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 font-medium"
                    placeholder="Candidate Name"
                  />
                </div>
                <div>
                  <label className="block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={extractedData.email || ''}
                    onChange={e => setExtractedData({ ...extractedData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 font-medium"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Phone Number (Indian Format)</label>
                  <input
                    type="text"
                    value={extractedData.phone || ''}
                    onChange={e => setExtractedData({ ...extractedData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 font-medium"
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className="block mb-1">City / Location</label>
                  <input
                    type="text"
                    value={extractedData.location || ''}
                    onChange={e => setExtractedData({ ...extractedData, location: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 font-medium"
                    placeholder="Delhi, India"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Professional Summary / Objective</label>
                <textarea
                  rows={3}
                  value={extractedData.summary || ''}
                  onChange={e => setExtractedData({ ...extractedData, summary: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 font-medium"
                  placeholder="Summary of experience and background..."
                />
              </div>

              <div>
                <label className="block mb-1">Technical Skills (Comma-separated)</label>
                <input
                  type="text"
                  value={Array.isArray(extractedData.skills) ? extractedData.skills.join(', ') : extractedData.skills || ''}
                  onChange={e => setExtractedData({ 
                    ...extractedData, 
                    skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                  })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 font-medium"
                  placeholder="Java, React, Node.js, SQL"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingDetails}
                onClick={handleSaveReviewedDetails}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-60"
              >
                {savingDetails ? 'Saving Profile...' : 'Save & Update Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Resume Deletion */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center animate-fade-in space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Current Resume?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will remove the uploaded resume document and reset the extracted profile scores. Previously submitted job applications keep their own saved copy and will not be affected.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition text-xs shadow-md disabled:opacity-60 cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Resume'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Document In-Browser Preview Modal */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">
                      {activeProfile?.resumeFile?.fileName || activeProfile?.resumeUrl || 'Resume Document Preview'}
                    </h3>
                    <span className="text-3xs font-extrabold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
                      {isPdfPreview ? 'PDF Document' : 'Word Document Formatted View'}
                    </span>
                  </div>
                  <p className="text-2xs text-slate-500 font-medium">Interactive in-browser resume document view</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Open in new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleViewResume('download')}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Download copy"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded document viewer */}
            <div className="grow bg-slate-100 p-2 sm:p-4">
              <iframe
                src={isPdfPreview ? `${previewUrl}#toolbar=1&navpanes=0` : previewUrl}
                className="w-full h-full rounded-2xl bg-white shadow-inner border border-slate-200"
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
