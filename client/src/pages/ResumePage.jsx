import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, Upload, Trash2, Edit2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function ResumePage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await api.get('/resumes');
      setResumes(res.data.resumes);
    } catch (err) {
      console.error('Failed to fetch resumes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setError('');
    setSuccess('');
    setUploading(true);

    const formData = new FormData();
    formData.append('resume', selectedFile);
    if (customName) {
      formData.append('name', customName);
    }

    try {
      const res = await api.post('/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Resume uploaded and parsed successfully!');
      setSelectedFile(null);
      setCustomName('');
      fetchResumes();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please ensure file is a valid PDF under 5MB.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resume? Associated analyses will also be removed.')) return;
    try {
      await api.delete(`/resumes/${id}`);
      setResumes(resumes.filter((r) => r._id !== id));
      setSuccess('Resume deleted.');
    } catch (err) {
      setError('Failed to delete resume.');
    }
  };

  const handleRename = async (id) => {
    if (!newName.trim()) return;
    try {
      await api.patch(`/resumes/${id}`, { name: newName });
      setEditingId(null);
      setNewName('');
      fetchResumes();
    } catch (err) {
      setError('Failed to rename resume.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Resume Management</h1>
        <p className="text-sm text-slate-600">Upload and manage your PDF resumes for job matching</p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Upload New Resume (PDF)</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
            />
            <input
              type="text"
              placeholder="Custom resume name (optional)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full sm:w-80 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all flex-shrink-0"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Parsing PDF...' : 'Upload & Parse'}
            </button>
          </div>
          <p className="text-xs text-slate-400">Supported format: PDF up to 5MB. Text-based PDFs produce best results.</p>
        </form>
      </div>

      {/* Resumes List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Your Saved Resumes ({resumes.length})</h2>

        {loading ? (
          <div className="flex py-12 justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm">No resumes uploaded yet. Upload your first PDF above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div key={resume._id} className="rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow bg-slate-50/50">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      {editingId === resume._id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="rounded border border-slate-300 px-2 py-1 text-sm w-36"
                          />
                          <button
                            onClick={() => handleRename(resume._id)}
                            className="rounded bg-indigo-600 text-white px-2 py-1 text-xs"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-bold text-slate-900 truncate max-w-[180px]" title={resume.name}>
                          {resume.name}
                        </h3>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      resume.parseStatus === 'success' ? 'bg-emerald-100 text-emerald-800' :
                      resume.parseStatus === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {resume.parseStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 truncate mb-4">File: {resume.originalFilename}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400 block">Words</span>
                      <span className="font-semibold">{resume.wordCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Pages</span>
                      <span className="font-semibold">{resume.pageCount || 1}</span>
                    </div>
                  </div>

                  {resume.extractedSkills && resume.extractedSkills.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Detected Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {resume.extractedSkills.slice(0, 6).map((s) => (
                          <span key={s} className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700 font-medium">
                            {s}
                          </span>
                        ))}
                        {resume.extractedSkills.length > 6 && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                            +{resume.extractedSkills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {new Date(resume.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    {editingId !== resume._id && (
                      <button
                        onClick={() => { setEditingId(resume._id); setNewName(resume.name); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(resume._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
