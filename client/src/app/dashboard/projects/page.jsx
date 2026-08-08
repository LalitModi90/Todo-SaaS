'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getProjects, createProject, deleteProject } from '@/api/projectApi';
import { useAuth } from '@/hooks/useAuth';
import './projects.css';
import '@/components/tasks/tasks.css';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const priorityColor = {
  Low:    { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  Medium: { bg: '#fefce8', color: '#ca8a04', dot: '#eab308' },
  High:   { bg: '#fff7ed', color: '#ea580c', dot: '#f97316' },
  Urgent: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
};

// All toggleable columns
const ALL_FIELDS = ['Priority', 'Lead', 'Due Date'];

function ProjectRowActions({ project, onDelete, fetchProjects }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    setOpen(false);
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/projects/${project._id}`);
    triggerToast('Project link copied!');
  };

  const handleDuplicate = async (e) => {
    e.stopPropagation();
    setOpen(false);
    try {
      await createProject({
        title: `${project.title} (Copy)`,
        description: project.description || '',
        priority: project.priority || 'Medium',
        dueDate: project.dueDate || undefined
      });
      triggerToast('Project duplicated!');
      if (fetchProjects) fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
      {toast && (
        <div style={{
          position: 'absolute', top: '-30px', right: 0,
          background: '#18181b', color: '#fff', fontSize: '0.75rem',
          padding: '4px 8px', borderRadius: '4px', zIndex: 100, whiteSpace: 'nowrap'
        }}>
          {toast}
        </div>
      )}
      <button 
        className="icon-btn-ghost"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        title="Project options"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
        </svg>
      </button>

      {open && (
        <div 
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            backgroundColor: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e4e4e7)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 100,
            minWidth: '160px',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="dropdown-option-item"
            onClick={(e) => { e.stopPropagation(); setOpen(false); window.location.href = `/dashboard/projects/${project._id}`; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 1-2-2h-4a2 2 0 0 1 2 2v2"/></svg>
            View Project
          </button>

          <button className="dropdown-option-item" onClick={handleCopyLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy Project Link
          </button>

          <button className="dropdown-option-item" onClick={handleDuplicate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
            Duplicate Project
          </button>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color, #e4e4e7)', margin: '2px 0' }} />

          <button 
            className="dropdown-option-item delete-option"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(project._id); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete Project
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [fieldsOpen, setFieldsOpen]   = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [deleteId, setDeleteId]       = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');
  const [search, setSearch]           = useState('');

  const [visibleCols, setVisibleCols] = useState(new Set(ALL_FIELDS));

  // Filter state
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterOpen, setFilterOpen]         = useState(false);

  // Form fields
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]       = useState('Medium');
  const [dueDate, setDueDate]         = useState('');
  const [titleErr, setTitleErr]       = useState('');

  const titleRef   = useRef(null);
  const fieldsRef  = useRef(null);
  const filterRef  = useRef(null);
  const { checkGuestAction } = useAuth();

  // Close Fields dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (fieldsRef.current && !fieldsRef.current.contains(e.target)) setFieldsOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleCol = (col) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  };

  const show = (col) => visibleCols.has(col);

  useEffect(() => { fetchProjects(); }, []);

  // Focus title when modal opens
  useEffect(() => {
    if (showModal) setTimeout(() => titleRef.current?.focus(), 100);
  }, [showModal]);

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    if (checkGuestAction('create projects')) return;
    setTitle(''); setDescription(''); setPriority('Medium'); setDueDate('');
    setTitleErr(''); setFormError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setTitleErr('Project title is required.'); return; }
    if (title.trim().length < 2) { setTitleErr('Title must be at least 2 characters.'); return; }

    setSubmitting(true);
    setFormError('');
    try {
      await createProject({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || undefined,
      });
      closeModal();
      fetchProjects();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (checkGuestAction('delete projects')) return;
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      await deleteProject(deleteId);
      setDeleteId(null);
      fetchProjects();
    } catch (err) {
      console.error('Delete project error:', err);
      setDeleteId(null);
    }
  };

  const filtered = projects.filter(p => {
    const matchSearch   = p.title.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === 'All' || p.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  return (
    <div className="projects-page-wrapper">

      {/* ── Header ── */}
      <div className="task-header-container">
        <h1 className="task-title">Projects</h1>

        <div className="task-actions">
          <div className="search-container">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search projects…"
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="dropdown-wrapper" ref={fieldsRef}>
            <button className="btn-secondary" onClick={() => setFieldsOpen(!fieldsOpen)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
              Fields
              {visibleCols.size < ALL_FIELDS.length && (
                <span style={{ background:'#18181b', color:'#fff', borderRadius:'9999px', fontSize:'0.65rem', padding:'1px 6px', marginLeft:'4px' }}>
                  {ALL_FIELDS.length - visibleCols.size} hidden
                </span>
              )}
            </button>
            {fieldsOpen && (
              <div className="fields-dropdown" style={{ minWidth:'180px' }}>
                <div className="fields-header-title">
                  Toggle Columns
                </div>
                <div className="fields-list">
                  {ALL_FIELDS.map(field => {
                    const on = show(field);
                    return (
                      <div
                        key={field}
                        className="field-checkbox"
                        onClick={() => toggleCol(field)}
                        style={{ cursor:'pointer', userSelect:'none' }}
                      >
                        <span style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          {/* Checkbox */}
                          <span className={`custom-col-checkbox ${on ? 'checked' : ''}`}>
                            {on && (
                              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </span>
                          {field}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="fields-footer">
                  <button
                    className="show-all-fields-btn"
                    onClick={() => {
                      if (visibleCols.size === ALL_FIELDS.length) {
                        setVisibleCols(new Set()); // Hide all
                      } else {
                        setVisibleCols(new Set(ALL_FIELDS)); // Show all
                      }
                    }}
                  >
                    {visibleCols.size === ALL_FIELDS.length ? 'Hide all' : 'Show all'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Filter button ── */}
          <div className="dropdown-wrapper" ref={filterRef} style={{ position:'relative' }}>
            <button
              className="btn-icon"
              onClick={() => setFilterOpen(!filterOpen)}
              title="Filter by priority"
              style={{ position:'relative' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              {filterPriority !== 'All' && (
                <span style={{ position:'absolute', top:'-3px', right:'-3px', width:'8px', height:'8px', borderRadius:'50%', background: priorityColor[filterPriority]?.dot || '#6366f1', border:'1.5px solid #fff' }}/>
              )}
            </button>

            {filterOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'#fff', border:'1px solid #e4e4e7', borderRadius:'12px', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', zIndex:50, minWidth:'160px', overflow:'hidden' }}>
                <div style={{ padding:'8px 12px', fontSize:'0.75rem', fontWeight:600, color:'#71717a', borderBottom:'1px solid #f4f4f5', letterSpacing:'0.04em', textTransform:'uppercase' }}>
                  Filter by Priority
                </div>
                {['All', ...PRIORITIES].map(p => {
                  const pc = priorityColor[p];
                  const active = filterPriority === p;
                  return (
                    <div
                      key={p}
                      onClick={() => { setFilterPriority(p); setFilterOpen(false); }}
                      style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 14px', cursor:'pointer', background: active ? '#f4f4f5' : 'transparent', fontSize:'0.875rem', color:'#09090b' }}
                    >
                      {pc ? (
                        <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: pc.dot, flexShrink:0 }}/>
                      ) : (
                        <span style={{ width:'8px', height:'8px', borderRadius:'50%', border:'1.5px solid #d4d4d8', flexShrink:0 }}/>
                      )}
                      <span style={{ flex:1 }}>{p}</span>
                      {active && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  );
                })}
                {filterPriority !== 'All' && (
                  <div style={{ padding:'8px 12px', borderTop:'1px solid #f4f4f5' }}>
                    <button
                      onClick={() => { setFilterPriority('All'); setFilterOpen(false); }}
                      style={{ fontSize:'0.75rem', color:'#ef4444', background:'transparent', border:'none', cursor:'pointer', padding:0 }}
                    >
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="btn-dark" onClick={openModal}>
            + Add Project
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="projects-content">
        <table className="task-table">
          <thead>
            <tr>
              <th className="col-task">Project</th>
              {show('Priority') && <th className="col-priority">Priority</th>}
              {show('Lead')     && <th className="col-members">Lead</th>}
              {show('Due Date') && <th className="col-date">Due Date</th>}
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign:'center', padding:'32px', color:'#71717a' }}>Loading projects…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign:'center', padding:'48px', color:'#a1a1aa' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" strokeWidth="1.5">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                    </svg>
                    <span style={{ fontSize:'0.9rem' }}>{search ? 'No projects match your search.' : 'No projects yet. Create your first one!'}</span>
                    {!search && <button className="btn-dark" onClick={openModal} style={{ fontSize:'0.8rem', padding:'8px 16px' }}>+ Add Project</button>}
                  </div>
                </td>
              </tr>
            ) : filtered.map(project => {
              const p = priorityColor[project.priority] || priorityColor.Medium;
              return (
                <tr key={project._id}>
                  <td className="col-task">
                    <span
                      style={{ cursor:'pointer', fontWeight:500 }}
                      onClick={() => window.location.href = `/dashboard/projects/${project._id}`}
                    >
                      {project.title}
                    </span>
                    {project.description && (
                      <div style={{ fontSize:'0.75rem', color:'#71717a', marginTop:'2px' }}>{project.description}</div>
                    )}
                  </td>
                  {show('Priority') && (
                    <td className="col-priority">
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background: p.bg, color: p.color, borderRadius:'9999px', padding:'2px 10px', fontSize:'0.75rem', fontWeight:600 }}>
                        <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: p.dot, display:'inline-block' }}/>
                        {project.priority || 'Medium'}
                      </span>
                    </td>
                  )}
                  {show('Lead') && (
                    <td className="col-members">
                      {project.lead?.avatar ? (
                        <img src={project.lead.avatar} alt={project.lead.name} className="avatar-small" title={project.lead.name} />
                      ) : (
                        <div className="avatar-small" style={{ background:'#e4e4e7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700, color:'#71717a' }}>
                          {project.lead?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </td>
                  )}
                  {show('Due Date') && (
                    <td className="col-date" style={{ fontSize:'0.8rem', color: project.dueDate && new Date(project.dueDate) < new Date() ? '#ef4444' : 'inherit' }}>
                      {project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </td>
                  )}
                  <td className="col-actions">
                    <ProjectRowActions project={project} onDelete={handleDelete} fetchProjects={fetchProjects} />
                  </td>
                </tr>
              );
            })}

            {/* Add row */}
            <tr className="add-task-row">
              <td colSpan="5">
                <button className="add-task-btn" onClick={openModal}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Project
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Add Project Modal ── */}
      {showModal && (
        <div
          className="new-task-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="new-task-modal-card">

            {/* Modal Header */}
            <div className="new-task-modal-header">
              <h2 className="new-task-modal-title">New Project</h2>
              <button onClick={closeModal} className="icon-btn-ghost">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="new-task-modal-body">

                {formError && (
                  <div className="new-task-form-error">
                    {formError}
                  </div>
                )}

                {/* Title */}
                <div className="new-task-form-group">
                  <label className="new-task-form-label">
                    Title <span style={{ color:'#ef4444' }}>*</span>
                  </label>
                  <input
                    ref={titleRef}
                    type="text"
                    placeholder="e.g. Website Redesign"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); if (titleErr) setTitleErr(''); }}
                    onBlur={() => !title.trim() && setTitleErr('Project title is required.')}
                    className={`new-task-form-input ${titleErr ? 'error-border' : ''}`}
                  />
                  {titleErr && <span style={{ color:'#ef4444', fontSize:'0.75rem' }}>{titleErr}</span>}
                </div>

                {/* Description */}
                <div className="new-task-form-group">
                  <label className="new-task-form-label">Description <span style={{ fontSize:'0.75rem', color:'#9ca3af', fontWeight:400 }}>(optional)</span></label>
                  <textarea
                    placeholder="What is this project about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="new-task-form-input new-task-form-textarea"
                  />
                </div>

                {/* Priority + Due Date row */}
                <div className="new-task-form-grid">
                  <div className="new-task-form-group">
                    <label className="new-task-form-label">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="new-task-form-input new-task-form-select"
                    >
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="new-task-form-group">
                    <label className="new-task-form-label">Due Date <span style={{ fontSize:'0.75rem', color:'#9ca3af', fontWeight:400 }}>(optional)</span></label>
                    <input
                      type="date"
                      value={dueDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="new-task-form-input"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="new-task-modal-footer">
                <button type="button" onClick={closeModal} className="btn-cancel-modal">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-submit-modal">
                  {submitting ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div
          className="new-task-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}
        >
          <div className="new-task-modal-card" style={{ maxWidth: '380px', padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ width:'48px', height:'48px', background:'#fef2f2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </div>
            <h3 className="new-task-modal-title" style={{ margin:'0 0 8px', textAlign: 'center' }}>Delete Project?</h3>
            <p style={{ margin:'0 0 24px', fontSize:'0.875rem', color:'var(--text-secondary, #71717a)', lineHeight:1.5 }}>
              This will permanently delete the project and all its tasks. This action cannot be undone.
            </p>
            <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
              <button onClick={() => setDeleteId(null)} className="btn-cancel-modal">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn-submit-modal" style={{ background: '#ef4444' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
