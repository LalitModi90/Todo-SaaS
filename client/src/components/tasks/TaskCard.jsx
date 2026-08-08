'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTask, createTask } from '@/api/taskApi';
import { useAuth } from '@/hooks/useAuth';

export default function TaskCard({ task, onTaskUpdated }) {
  const router = useRouter();
  const { checkGuestAction } = useAuth();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [toastMsg, setToastMsg]       = useState('');
  const menuRef                       = useRef(null);

  if (!task) return null;

  const taskId = task._id || task.id;
  const title = task.title || 'Untitled Task';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    setOptionsOpen(false);
    const link = `${window.location.origin}/task/${taskId}`;
    navigator.clipboard.writeText(link);
    triggerToast('Task link copied to clipboard!');
  };

  const handleDuplicate = async (e) => {
    e.stopPropagation();
    setOptionsOpen(false);
    if (checkGuestAction('duplicate tasks')) return;
    try {
      await createTask({
        title: `${title} (Copy)`,
        description: task.description || '',
        priority: task.priority || 'Medium',
        status: task.status || 'todo',
        dueDate: task.dueDate || undefined,
        labels: task.labels || []
      });
      triggerToast('Task duplicated successfully!');
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setOptionsOpen(false);
    if (checkGuestAction('delete tasks')) return;
    try {
      await deleteTask(taskId);
      triggerToast('Task deleted');
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  // Assignee handling
  const firstAssignee = Array.isArray(task.assignedTo) && task.assignedTo.length > 0
    ? task.assignedTo[0]
    : null;
  const assigneeName = firstAssignee?.name || task.assignee || 'Unassigned';
  const assigneeAvatar = firstAssignee?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${assigneeName}`;

  // Due date handling
  const rawDate = task.dueDate || task.date;
  const formattedDate = rawDate 
    ? (isNaN(new Date(rawDate).getTime()) ? rawDate : new Date(rawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }))
    : 'No date';

  // Tags/Labels handling
  const tags = task.labels || task.tags || [];

  return (
    <div className="task-card" onClick={() => router.push(`/task/${taskId}`)} style={{ cursor: 'pointer', position: 'relative' }}>
      
      {/* Toast popup */}
      {toastMsg && (
        <div style={{
          position: 'absolute',
          top: '-32px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#18181b',
          color: '#ffffff',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: '6px',
          zIndex: 100,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {toastMsg}
        </div>
      )}

      <div className="task-card-header">
        <h4 className="task-card-title">{title}</h4>
        
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button 
            className="icon-btn-small" 
            onClick={(e) => {
              e.stopPropagation();
              setOptionsOpen(!optionsOpen);
            }}
            title="Task options"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
          </button>

          {optionsOpen && (
            <div 
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                backgroundColor: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e4e4e7)',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                zIndex: 50,
                minWidth: '150px',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="dropdown-option-item"
                onClick={(e) => { e.stopPropagation(); setOptionsOpen(false); router.push(`/task/${taskId}`); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                View Details
              </button>

              <button
                className="dropdown-option-item"
                onClick={handleCopyLink}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy Task Link
              </button>

              <button
                className="dropdown-option-item"
                onClick={handleDuplicate}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                Duplicate Task
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--border-color, #e4e4e7)', margin: '2px 0' }} />

              <button
                className="dropdown-option-item delete-option"
                onClick={handleDelete}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete Task
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="task-card-meta">
        <div className="task-assignee">
          <img src={assigneeAvatar} alt={assigneeName} className="avatar-small" />
          <span className="assignee-name">{assigneeName}</span>
        </div>
        
        <div className="task-date">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span className="date-text">{formattedDate}</span>
        </div>
      </div>
      
      {tags.length > 0 && (
        <div className="task-card-tags">
          {tags.map((tag, idx) => (
            <span key={idx} className="task-tag">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
