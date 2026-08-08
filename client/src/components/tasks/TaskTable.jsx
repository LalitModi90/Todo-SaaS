'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTask, createTask } from '@/api/taskApi';
import { useAuth } from '@/hooks/useAuth';

function TaskRowActions({ task, onTaskUpdated }) {
  const router = useRouter();
  const { checkGuestAction } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const taskId = task._id || task.id;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = (e) => {
    e.stopPropagation();
    setOpen(false);
    navigator.clipboard.writeText(`${window.location.origin}/task/${taskId}`);
  };

  const handleDuplicate = async (e) => {
    e.stopPropagation();
    setOpen(false);
    if (checkGuestAction('duplicate tasks')) return;
    try {
      await createTask({
        title: `${task.title} (Copy)`,
        description: task.description || '',
        priority: task.priority || 'Medium',
        status: task.status || 'todo',
        dueDate: task.dueDate || undefined,
        labels: task.labels || []
      });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setOpen(false);
    if (checkGuestAction('delete tasks')) return;
    try {
      await deleteTask(taskId);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
      <button 
        className="icon-btn-ghost" 
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        title="Actions"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
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
            zIndex: 50,
            minWidth: '150px',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="dropdown-option-item" onClick={(e) => { e.stopPropagation(); setOpen(false); router.push(`/task/${taskId}`); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View Details
          </button>
          <button className="dropdown-option-item" onClick={handleCopyLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy Task Link
          </button>
          <button className="dropdown-option-item" onClick={handleDuplicate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
            Duplicate Task
          </button>
          <div style={{ height: '1px', backgroundColor: 'var(--border-color, #e4e4e7)', margin: '2px 0' }} />
          <button className="dropdown-option-item delete-option" onClick={handleDelete}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete Task
          </button>
        </div>
      )}
    </div>
  );
}

export default function TaskTable({ tasks = [], onTaskUpdated, onAddTask, visibleFields }) {
  const router = useRouter();
  const [collapsedSections, setCollapsedSections] = useState({});

  const show = (field) => {
    if (!visibleFields) return true;
    return visibleFields.has(field);
  };

  const toggleSection = (secId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [secId]: !prev[secId]
    }));
  };

  const sections = [
    { id: 'todo', title: 'To Do', tasks: tasks.filter(t => t.status === 'todo') },
    { id: 'doing', title: 'Doing', tasks: tasks.filter(t => t.status === 'doing') },
    { id: 'completed', title: 'Completed', tasks: tasks.filter(t => t.status === 'completed') },
    { id: 'onhold', title: 'On Hold', tasks: tasks.filter(t => t.status === 'onhold') }
  ];

  // Calculate colSpan dynamically for empty row
  let activeColCount = 2; // Task + Actions
  if (show('Priority')) activeColCount++;
  if (show('Members')) activeColCount++;
  if (show('Due Date')) activeColCount++;
  if (show('Labels')) activeColCount++;
  if (show('Status')) activeColCount++;
  if (show('Reporter')) activeColCount++;

  return (
    <div className="task-list-view-scroll">
      <div className="task-list-view-container">
        {sections.map(sec => {
          const isCollapsed = collapsedSections[sec.id];
          return (
            <div key={sec.id} className="list-section-group">
              
              {/* Section Collapsible Header */}
              <div 
                className="list-section-header" 
                onClick={() => toggleSection(sec.id)}
              >
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  className={`section-chevron ${isCollapsed ? 'collapsed' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                <span className="list-section-title">{sec.title}</span>
              </div>

              {/* Section Card Box */}
              {!isCollapsed && (
                <div className="list-section-card">
                  <table className="list-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        {show('Priority') && <th>Priority</th>}
                        {show('Members')  && <th>Members</th>}
                        {show('Due Date') && <th>Due Date</th>}
                        {show('Labels')   && <th>Labels</th>}
                        {show('Status')   && <th>Status</th>}
                        {show('Reporter') && <th>Reporter</th>}
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sec.tasks.length > 0 ? (
                        sec.tasks.map(task => {
                          const prioClass = (task.priority || 'medium').toLowerCase();
                          const prioColor = task.priority === 'High' || task.priority === 'Urgent' ? '#ef4444' : task.priority === 'Low' ? '#10b981' : '#f59e0b';

                          return (
                            <tr 
                              key={task._id || task.id} 
                              onClick={() => router.push(`/task/${task._id || task.id}`)} 
                              className="list-table-row"
                            >
                              <td>
                                <span className="task-title-text">{task.title}</span>
                              </td>
                              {show('Priority') && (
                                <td>
                                  <span className={`prio-pill ${prioClass}`} style={{ color: prioColor }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ color: prioColor }}>
                                      <rect x="3" y="14" width="4" height="7"/>
                                      <rect x="10" y="8" width="4" height="13"/>
                                      <rect x="17" y="2" width="4" height="19"/>
                                    </svg>
                                    {task.priority || 'Medium'}
                                  </span>
                                </td>
                              )}
                              {show('Members') && (
                                <td>
                                  {task.assignedTo && task.assignedTo.length > 0 ? (
                                    <div className="avatar-micro-group">
                                      {task.assignedTo.map((u, i) => (
                                        <img 
                                          key={u._id || i} 
                                          src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} 
                                          className="avatar-micro" 
                                          alt="member" 
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="avatar-micro-placeholder">DE</div>
                                  )}
                                </td>
                              )}
                              {show('Due Date') && (
                                <td className="due-date-cell">
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '12 Sep 2026'}
                                </td>
                              )}
                              {show('Labels') && (
                                <td>
                                  <div className="labels-group" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {task.labels && task.labels.length > 0 ? (
                                      task.labels.map((lbl, idx) => (
                                        <span key={idx} className="filter-pill" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>{lbl}</span>
                                      ))
                                    ) : (
                                      <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>—</span>
                                    )}
                                  </div>
                                </td>
                              )}
                              {show('Status') && (
                                <td>
                                  <span className={`filter-pill`} style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                                    {task.status || 'todo'}
                                  </span>
                                </td>
                              )}
                              {show('Reporter') && (
                                <td style={{ fontSize: '0.8125rem', color: '#71717a' }}>
                                  {task.creator?.name || 'Assignee'}
                                </td>
                              )}
                              <td style={{ textAlign: 'right' }}>
                                <TaskRowActions task={task} onTaskUpdated={onTaskUpdated} />
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="empty-row">
                          <td colSpan={activeColCount} style={{ padding: '16px 24px', color: '#a1a1aa', fontSize: '0.8125rem' }}>
                            No tasks in {sec.title}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Card Footer with + Add Task Button */}
                  <div className="list-section-footer">
                    <button 
                      className="add-task-table-btn"
                      onClick={() => onAddTask && onAddTask(sec.id)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add Task
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
