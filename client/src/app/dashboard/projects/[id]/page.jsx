'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TaskHeader from '@/components/tasks/TaskHeader';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskTable from '@/components/tasks/TaskTable';
import { getProjectById, deleteProject, createProject } from '@/api/projectApi';
import { getTasksByProject } from '@/api/taskApi';
import { useAuth } from '@/hooks/useAuth';

const ALL_TASK_FIELDS = ['Priority', 'Members', 'Due Date', 'Labels', 'Status', 'Reporter'];

export default function ProjectDetailPage({ params }) {
  const router = useRouter();
  const { checkGuestAction } = useAuth();
  const projectId = params?.id;

  const [project, setProject]         = useState(null);
  const [tasks, setTasks]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [viewMode, setViewMode]       = useState('board'); // 'board' or 'list'
  const [modalStatus, setModalStatus] = useState(null);

  // Visible fields state
  const [visibleFields, setVisibleFields] = useState(new Set(['Priority', 'Members', 'Due Date']));

  // Filter state
  const [searchQuery, setSearchQuery]       = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter]     = useState('all');

  // Options popover state
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [toastMsg, setToastMsg]       = useState('');
  const optionsRef                    = useRef(null);

  const fetchProjectData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projData, taskData] = await Promise.all([
        getProjectById(projectId),
        getTasksByProject(projectId)
      ]);
      setProject(projData);
      setTasks(taskData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) setOptionsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleCopyLink = () => {
    setOptionsOpen(false);
    navigator.clipboard.writeText(window.location.href);
    triggerToast('Project link copied!');
  };

  const handleDuplicateProject = async () => {
    if (!project) return;
    setOptionsOpen(false);
    if (checkGuestAction('duplicate projects')) return;
    try {
      const duplicated = await createProject({
        title: `${project.title} (Copy)`,
        description: project.description || '',
        priority: project.priority || 'Medium',
        dueDate: project.dueDate || undefined
      });
      triggerToast('Project duplicated!');
      router.push(`/dashboard/projects/${duplicated._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    setOptionsOpen(false);
    if (checkGuestAction('delete projects')) return;
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
        triggerToast('Project deleted');
        router.push('/dashboard/projects');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = task.title?.toLowerCase().includes(q);
      const descMatch = task.description?.toLowerCase().includes(q);
      if (!titleMatch && !descMatch) return false;
    }
    if (priorityFilter !== 'all') {
      if (task.priority?.toLowerCase() !== priorityFilter.toLowerCase()) return false;
    }
    if (statusFilter !== 'all') {
      if (task.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }
    return true;
  });

  return (
    <div className="tasks-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* Toast Feedback */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#18181b',
          color: '#ffffff',
          fontSize: '0.8125rem',
          fontWeight: 600,
          padding: '10px 18px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Project Header Bar */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border-color, #e4e4e7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card, #ffffff)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #09090b)' }}>
            {project?.title || 'Project Tasks'}
          </h1>
          {project?.description && (
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary, #71717a)' }}>
              {project.description}
            </p>
          )}
        </div>

        {/* Project Options Button */}
        <div style={{ position: 'relative' }} ref={optionsRef}>
          <button 
            className="btn-icon" 
            onClick={() => setOptionsOpen(!optionsOpen)}
            title="Project Options"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>

          {optionsOpen && (
            <div 
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                backgroundColor: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e4e4e7)',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                zIndex: 100,
                minWidth: '170px',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <button className="dropdown-option-item" onClick={handleCopyLink}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy Project Link
              </button>

              <button className="dropdown-option-item" onClick={handleDuplicateProject}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                Duplicate Project
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--border-color, #e4e4e7)', margin: '2px 0' }} />

              <button className="dropdown-option-item delete-option" onClick={handleDeleteProject}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete Project
              </button>
            </div>
          )}
        </div>
      </div>

      <TaskHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        onTaskAdded={fetchProjectData}
        externalStatus={modalStatus}
        onModalClosed={() => setModalStatus(null)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        visibleFields={visibleFields}
        setVisibleFields={setVisibleFields}
        allFields={ALL_TASK_FIELDS}
      />
      
      <div className="tasks-content" style={{ flex: 1, overflow: 'hidden' }}>
        {viewMode === 'board' ? (
          <TaskBoard
            tasks={filteredTasks}
            onTaskUpdated={fetchProjectData}
            onAddTask={(status) => setModalStatus(status || 'todo')}
            visibleFields={visibleFields}
          />
        ) : (
          <TaskTable
            tasks={filteredTasks}
            onTaskUpdated={fetchProjectData}
            onAddTask={(status) => setModalStatus(status || 'todo')}
            visibleFields={visibleFields}
          />
        )}
      </div>
    </div>
  );
}
