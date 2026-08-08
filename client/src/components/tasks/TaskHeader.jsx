'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createTask } from '@/api/taskApi';
import { useAuth } from '@/hooks/useAuth';
import './tasks.css';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'doing', label: 'Doing' },
  { value: 'completed', label: 'Completed' },
  { value: 'onhold', label: 'On Hold' },
];

const ALL_TASK_FIELDS = ['Priority', 'Members', 'Due Date', 'Labels', 'Status', 'Reporter'];

export default function TaskHeader({ 
  viewMode, 
  setViewMode, 
  onTaskAdded, 
  externalStatus, 
  onModalClosed,
  searchQuery = '',
  setSearchQuery,
  priorityFilter = 'all',
  setPriorityFilter,
  statusFilter = 'all',
  setStatusFilter,
  visibleFields,
  setVisibleFields,
  allFields = ALL_TASK_FIELDS
}) {
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  // Fallback state if not provided by parent
  const [localFields, setLocalFields] = useState(new Set(['Priority', 'Members', 'Due Date']));
  const activeFields = visibleFields || localFields;
  const updateFields = setVisibleFields || setLocalFields;

  const toggleTaskField = (field) => {
    const next = new Set(activeFields);
    next.has(field) ? next.delete(field) : next.add(field);
    updateFields(next);
  };

  const handleToggleAllTaskFields = () => {
    if (activeFields.size === allFields.length) {
      updateFields(new Set()); // Hide all
    } else {
      updateFields(new Set(allFields)); // Show all
    }
  };

  // Form fields
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus]           = useState('todo');
  const [priority, setPriority]       = useState('Medium');
  const [dueDate, setDueDate]         = useState('');
  const [labelsInput, setLabelsInput] = useState('');
  const [titleErr, setTitleErr]       = useState('');

  const titleRef = useRef(null);
  const filterRef = useRef(null);
  const fieldsRef = useRef(null);
  const { checkGuestAction } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
      if (fieldsRef.current && !fieldsRef.current.contains(e.target)) {
        setFieldsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [showModal]);

  useEffect(() => {
    if (externalStatus) {
      setTitle('');
      setDescription('');
      setStatus(externalStatus);
      setPriority('Medium');
      setDueDate('');
      setLabelsInput('');
      setTitleErr('');
      setFormError('');
      setShowModal(true);
    }
  }, [externalStatus]);

  const closeModal = () => {
    setShowModal(false);
    if (onModalClosed) onModalClosed();
  };

  const openModal = () => {
    if (checkGuestAction("create tasks")) return;
    setTitle('');
    setDescription('');
    setStatus('todo');
    setPriority('Medium');
    setDueDate('');
    setLabelsInput('');
    setTitleErr('');
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleErr('Task title is required.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const labels = labelsInput
        .split(',')
        .map(l => l.trim())
        .filter(Boolean);

      await createTask({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        dueDate: dueDate || undefined,
        labels,
      });

      closeModal();
      if (onTaskAdded) onTaskAdded();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasActiveFilter = (priorityFilter && priorityFilter !== 'all') || (statusFilter && statusFilter !== 'all') || Boolean(searchQuery);

  return (
    <div className="task-header-container">
      <h1 className="task-title">Tasks</h1>
      
      <div className="task-actions">
        <div className="search-container">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input 
            type="text" 
            placeholder="Search..." 
            className="search-input" 
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          />
        </div>

        <div className="dropdown-wrapper" ref={fieldsRef}>
          <button className="btn-secondary" onClick={() => setFieldsOpen(!fieldsOpen)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
            Fields
          </button>

          {fieldsOpen && (
            <div className="fields-dropdown">
              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                  List
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
                  onClick={() => setViewMode('board')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
                  Board
                </button>
              </div>

              <div className="fields-header-title">
                Toggle Columns
              </div>

              <div className="fields-list">
                {allFields.map(field => {
                  const on = activeFields.has(field);
                  return (
                    <div
                      key={field}
                      className="field-checkbox"
                      onClick={() => toggleTaskField(field)}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  type="button"
                  className="show-all-fields-btn"
                  onClick={handleToggleAllTaskFields}
                >
                  {activeFields.size === allFields.length ? 'Hide all' : 'Show all'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Button & Popover */}
        <div className="dropdown-wrapper" ref={filterRef}>
          <button 
            className={`btn-icon ${hasActiveFilter ? 'active-filter' : ''}`} 
            onClick={() => setFilterOpen(!filterOpen)}
            title="Filter tasks"
            style={{ position: 'relative' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            {hasActiveFilter && <span className="filter-active-dot" />}
          </button>

          {filterOpen && (
            <div className="fields-dropdown filter-popover">
              <div className="filter-section">
                <span className="filter-label-header">Priority</span>
                <div className="filter-pills-row">
                  {['all', 'Low', 'Medium', 'High', 'Urgent'].map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`filter-pill ${priorityFilter === p ? 'active' : ''}`}
                      onClick={() => setPriorityFilter && setPriorityFilter(p)}
                    >
                      {p === 'all' ? 'All' : p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-section" style={{ marginTop: '12px' }}>
                <span className="filter-label-header">Status</span>
                <div className="filter-pills-row">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'todo', label: 'To Do' },
                    { id: 'doing', label: 'Doing' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'onhold', label: 'On Hold' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className={`filter-pill ${statusFilter === s.id ? 'active' : ''}`}
                      onClick={() => setStatusFilter && setStatusFilter(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilter && (
                <button
                  type="button"
                  className="clear-filters-btn"
                  onClick={() => {
                    if (setPriorityFilter) setPriorityFilter('all');
                    if (setStatusFilter) setStatusFilter('all');
                    if (setSearchQuery) setSearchQuery('');
                  }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        <button className="btn-dark" onClick={openModal}>
          + Add Task
        </button>
      </div>

      {/* ── New Task Modal ── */}
      {showModal && (
        <div
          className="new-task-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="new-task-modal-card">
            {/* Modal Header */}
            <div className="new-task-modal-header">
              <h2 className="new-task-modal-title">New Task</h2>
              <button
                onClick={closeModal}
                className="icon-btn-ghost"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal Body Form */}
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
                    Task Title <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    ref={titleRef}
                    type="text"
                    placeholder="e.g. Write API Documentation"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); if (titleErr) setTitleErr(''); }}
                    onBlur={() => !title.trim() && setTitleErr('Task title is required.')}
                    className={`new-task-form-input ${titleErr ? 'error-border' : ''}`}
                  />
                  {titleErr && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{titleErr}</span>}
                </div>

                {/* Description */}
                <div className="new-task-form-group">
                  <label className="new-task-form-label">
                    Description <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    placeholder="Provide details about this task..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="new-task-form-input new-task-form-textarea"
                  />
                </div>

                {/* Status + Priority */}
                <div className="new-task-form-grid">
                  <div className="new-task-form-group">
                    <label className="new-task-form-label">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="new-task-form-input new-task-form-select"
                    >
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

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
                </div>

                {/* Due Date + Labels */}
                <div className="new-task-form-grid">
                  <div className="new-task-form-group">
                    <label className="new-task-form-label">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="new-task-form-input"
                    />
                  </div>

                  <div className="new-task-form-group">
                    <label className="new-task-form-label">Labels</label>
                    <input
                      type="text"
                      placeholder="e.g. Design, Dev"
                      value={labelsInput}
                      onChange={(e) => setLabelsInput(e.target.value)}
                      className="new-task-form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="new-task-modal-footer">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-cancel-modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-submit-modal"
                >
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
