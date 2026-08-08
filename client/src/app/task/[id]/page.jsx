'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import './task-detail.css';
import Sidebar from '@/components/sidebar/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { getTaskById, updateTask, addComment, addReply, deleteTask, createTask } from '@/api/taskApi';
import { useAuth } from '@/hooks/useAuth';

const PRIORITIES = [
  { name: 'High', color: '#ea580c', bg: '#fff7ed' },
  { name: 'Medium', color: '#ca8a04', bg: '#fefce8' },
  { name: 'Low', color: '#16a34a', bg: '#f0fdf4' },
  { name: 'Urgent', color: '#dc2626', bg: '#fef2f2' },
];

const STATUS_OPTIONS = [
  { id: 'todo', label: 'To Do', color: '#64748b', dot: '#64748b' },
  { id: 'doing', label: 'Doing', color: '#3b82f6', dot: '#3b82f6' },
  { id: 'completed', label: 'Completed', color: '#22c55e', dot: '#22c55e' },
  { id: 'onhold', label: 'On Hold', color: '#ef4444', dot: '#ef4444' },
];

const LABEL_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f97316', '#ef4444', '#ec4899'];

function SubtaskRowActions({ sub, index, onToggle, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
      <button 
        className="icon-btn-ghost" 
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        title="Subtask Options"
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
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            zIndex: 100,
            minWidth: '185px',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="dropdown-option-item" 
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={(e) => { e.stopPropagation(); setOpen(false); onToggle(index); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              {sub.completed ? <polyline points="20 6 9 17 4 12"/> : <circle cx="12" cy="12" r="9"/>}
            </svg>
            <span>{sub.completed ? 'Mark Pending' : 'Mark Completed'}</span>
          </button>

          <button 
            className="dropdown-option-item" 
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDuplicate(index); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
            <span>Duplicate Subtask</span>
          </button>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color, #e4e4e7)', margin: '4px 0' }} />

          <button 
            className="dropdown-option-item delete-option" 
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(index); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            <span>Delete Subtask</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params || {};
  const { user } = useAuth();

  const [task, setTask]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [statusOpen, setStatusOpen]     = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [activeDateType, setActiveDateType] = useState('end');
  const [commentText, setCommentText]   = useState('');
  const [replyingTo, setReplyingTo]     = useState(null);
  const [replyTexts, setReplyTexts]     = useState({});
  const [submitting, setSubmitting]     = useState(false);

  // ── Top Bar Buttons State & Actions ──
  const [isLocked, setIsLocked]         = useState(false);
  const [isPublic, setIsPublic]         = useState(false);
  const [viewsCount, setViewsCount]     = useState(1);
  const [optionsOpen, setOptionsOpen]   = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [toastMsg, setToastMsg]         = useState('');

  // ── Panel Actions State (+ & ⚙️) ──
  const [addFieldOpen, setAddFieldOpen]         = useState(false);
  const [panelSettingsOpen, setPanelSettingsOpen] = useState(false);
  const [compactMode, setCompactMode]           = useState(false);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);

  // ── Modals State ──
  const [showLabelModal, setShowLabelModal]     = useState(false);
  const [newLabelInput, setNewLabelInput]       = useState('');
  const [selectedColor, setSelectedColor]       = useState(LABEL_COLORS[0]);

  const [showMemberModal, setShowMemberModal]   = useState(false);
  const [newMemberInput, setNewMemberInput]     = useState('');
  const [memberRole, setMemberRole]             = useState('Assignee');
  const [addMode, setAddMode]                   = useState('team');

  // Subtask creation state
  const [newSubtaskTitle, setNewSubtaskTitle]       = useState('');
  const [newSubtaskPriority, setNewSubtaskPriority] = useState('High');
  const [showAddSubtaskRow, setShowAddSubtaskRow]   = useState(false);

  // Resource link state
  const [resourceLink, setResourceLink] = useState('');
  const [isEditingResource, setIsEditingResource] = useState(false);

  // Calendar navigation state
  const [calDate, setCalDate] = useState(new Date(2026, 0, 10));

  const priorityRef      = useRef(null);
  const statusRef        = useRef(null);
  const dateRef          = useRef(null);
  const optionsRef       = useRef(null);
  const addFieldRef      = useRef(null);
  const panelSettingsRef = useRef(null);

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  // Outside click listener for dropdowns
  useEffect(() => {
    const handler = (e) => {
      if (priorityRef.current && !priorityRef.current.contains(e.target)) setPriorityOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(false);
      if (dateRef.current && !dateRef.current.contains(e.target)) setDatePickerOpen(false);
      if (optionsRef.current && !optionsRef.current.contains(e.target)) setOptionsOpen(false);
      if (addFieldRef.current && !addFieldRef.current.contains(e.target)) setAddFieldOpen(false);
      if (panelSettingsRef.current && !panelSettingsRef.current.contains(e.target)) setPanelSettingsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const fetchTaskDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getTaskById(id);
      setTask(data);
      if (data && data.viewsCount) {
        setViewsCount(data.viewsCount);
      }
      if (data && typeof data.isLocked === 'boolean') {
        setIsLocked(data.isLocked);
      }
      if (data && typeof data.isPublic === 'boolean') {
        setIsPublic(data.isPublic);
      }
      if (data && data.dueDate) {
        setCalDate(new Date(data.dueDate));
      }
    } catch (err) {
      console.error('Error fetching task details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublic = async () => {
    const ownerId = task?.creator?._id || task?.creator || task?.lockedBy?._id || task?.lockedBy;
    const currentUserId = user?.id || user?._id;

    if (ownerId && currentUserId && ownerId.toString() !== currentUserId.toString()) {
      triggerToast('⚠️ Only the task owner can change task visibility (Public/Private).');
      return;
    }

    const newPublicState = !isPublic;
    setIsPublic(newPublicState);
    try {
      const updated = await updateTask(id, { isPublic: newPublicState });
      setTask(updated);
      triggerToast(newPublicState ? '🌐 Task set to Public (view-only for others)' : '🔒 Task set to Private (only creator & members)');
    } catch (err) {
      console.error('Error toggling public state:', err);
      setIsPublic(!newPublicState);
    }
  };

  const checkCanModifyTask = (requiredRole = 'Assignee') => {
    if (!task) return true;

    const ownerId = task.creator?._id || task.creator || task.lockedBy?._id || task.lockedBy;
    const currentUserId = user?.id || user?._id;
    const currentUserName = (user?.name || '').toLowerCase();

    // 1. Owner / Creator always has full access
    if (ownerId && currentUserId && ownerId.toString() === currentUserId.toString()) {
      return true;
    }

    // 2. Check assigned members with roles
    const members = task.membersWithRoles || [];
    const assignedMember = members.find(m => 
      (m.user && (m.user._id === currentUserId || m.user === currentUserId)) ||
      (m.name && m.name.toLowerCase() === currentUserName)
    );

    if (assignedMember) {
      if (assignedMember.role === 'Assignee') {
        return true; // Explicitly assigned edit role
      }
      if (assignedMember.role === 'Reviewer' && requiredRole === 'Reviewer') {
        return true; // Explicitly assigned reviewer role
      }
      if (assignedMember.role === 'Observer') {
        triggerToast('⚠️ Observer Role: You have Read-Only access.');
        return false;
      }
    }

    // 3. If Public or Locked, block unauthorized edits by non-owners
    if (isPublic) {
      const ownerName = task.creator?.name || 'the task owner';
      triggerToast(`⚠️ View-Only Access: Public tasks can only be modified by ${ownerName} or assigned members.`);
      return false;
    }

    if (isLocked) {
      const lockerName = task.lockedBy?.name || task.creator?.name || 'the owner';
      triggerToast(`⚠️ Task is locked by ${lockerName}. Only assigned members or the owner can modify it.`);
      return false;
    }

    return true;
  };

  // ── Action Buttons Functions ──
  const handleToggleLock = async () => {
    const lockerId = task?.lockedBy?._id || task?.lockedBy || task?.creator?._id || task?.creator;
    const currentUserId = user?.id || user?._id;

    if (isLocked && lockerId && currentUserId && lockerId.toString() !== currentUserId.toString()) {
      const lockerName = task.lockedBy?.name || task.creator?.name || 'another user';
      triggerToast(`⚠️ Task is locked by ${lockerName}. Only they can unlock it.`);
      return;
    }

    const newLockState = !isLocked;
    setIsLocked(newLockState);
    try {
      const updated = await updateTask(id, { isLocked: newLockState });
      setTask(updated);
      triggerToast(newLockState ? '🔒 Task locked by you' : '🔓 Task unlocked');
    } catch (err) {
      console.error('Error toggling task lock:', err);
      setIsLocked(!newLockState);
    }
  };

  const handleShowViews = () => {
    // Silent badge indicator
  };

  const handleShareTask = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      triggerToast('Task link copied to clipboard!');
    }
  };

  const handleDuplicateTask = async () => {
    if (!task) return;
    try {
      setOptionsOpen(false);
      const duplicated = await createTask({
        title: `${task.title} (Copy)`,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        project: task.project?._id || task.project,
      });
      triggerToast('Task duplicated successfully!');
      router.push(`/task/${duplicated._id}`);
    } catch (err) {
      console.error('Error duplicating task:', err);
    }
  };

  const handleDeleteTask = async () => {
    if (!id) return;
    if (!checkCanModifyTask()) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        triggerToast('Task deleted');
        router.push('/dashboard/tasks');
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };

  const handleToggleSidePanel = () => {
    setShowSidePanel(prev => !prev);
  };

  // ── Modal Submit Handlers ──
  const handleCreateLabelSubmit = async (e) => {
    e.preventDefault();
    if (!checkCanModifyTask()) return;
    if (!newLabelInput.trim()) return;
    try {
      const currentLabels = task.labels || ['Research', 'Design', 'Development', 'Testing', 'Deployment'];
      const updatedLabels = [...currentLabels, newLabelInput.trim()];
      const updated = await updateTask(id, { labels: updatedLabels });
      setTask(updated);
      setNewLabelInput('');
      setShowLabelModal(false);
      triggerToast(`Label "${newLabelInput.trim()}" created successfully!`);
    } catch (err) {
      console.error('Error creating label:', err);
    }
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!checkCanModifyTask()) return;
    if (!newMemberInput.trim()) return;
    try {
      const currentMembers = task.membersWithRoles || [];
      const newNames = newMemberInput
        .split(',')
        .map(n => n.trim())
        .filter(Boolean);

      const newEntries = newNames.map(name => ({
        name,
        role: memberRole,
        isTeam: addMode === 'team' || name.toLowerCase().includes('team') || name.toLowerCase().includes('leads')
      }));

      const updatedMembers = [...currentMembers, ...newEntries];
      const updated = await updateTask(id, { membersWithRoles: updatedMembers });
      setTask(updated);
      setShowMemberModal(false);
      triggerToast(`Added ${newNames.length} ${addMode === 'team' ? 'team member(s)' : 'member(s)'} (${newNames.join(', ')}) as ${memberRole}!`);
      setNewMemberInput('');
    } catch (err) {
      console.error('Error adding member:', err);
    }
  };

  const handleSaveResource = (e) => {
    e.preventDefault();
    if (!checkCanModifyTask()) return;
    setIsEditingResource(false);
    if (resourceLink.trim()) {
      triggerToast('Resource link saved successfully!');
    }
  };

  const handleToggleCompactMode = () => {
    setPanelSettingsOpen(false);
    setCompactMode(prev => !prev);
  };

  // ── Dynamic Priority and Status Handlers ──
  const handlePriorityChange = async (newPriority) => {
    if (!checkCanModifyTask()) return;
    try {
      const updated = await updateTask(id, { priority: newPriority });
      setTask(updated);
      setPriorityOpen(false);
    } catch (err) {
      console.error('Error updating priority:', err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!checkCanModifyTask()) return;
    try {
      const updated = await updateTask(id, { status: newStatus });
      setTask(updated);
      setStatusOpen(false);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDateSelect = async (selectedDate) => {
    if (!checkCanModifyTask()) return;
    try {
      const payload = activeDateType === 'start'
        ? { startDate: selectedDate }
        : { endDate: selectedDate, dueDate: selectedDate };

      const updated = await updateTask(id, payload);
      setTask(updated);
      setDatePickerOpen(false);
      triggerToast(activeDateType === 'start' ? 'Start date updated' : 'End date updated');
    } catch (err) {
      console.error('Error updating date:', err);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!checkCanModifyTask()) return;
    if (!newSubtaskTitle.trim()) return;
    try {
      const currentSubtasks = (task.subtasks || []).map(sub => ({
        _id: sub._id,
        title: sub.title,
        completed: !!sub.completed,
        priority: sub.priority || 'Medium'
      }));
      const updatedSubtasks = [
        ...currentSubtasks,
        { title: newSubtaskTitle.trim(), completed: false, priority: newSubtaskPriority }
      ];

      const updated = await updateTask(id, { subtasks: updatedSubtasks });
      setTask(updated);
      setNewSubtaskTitle('');
      setShowAddSubtaskRow(false);
      triggerToast('Subtask added');
    } catch (err) {
      console.error('Error adding subtask:', err);
    }
  };

  const handleToggleSubtask = async (index) => {
    if (!checkCanModifyTask()) return;
    try {
      const currentSubtasks = (task.subtasks || []).map((sub, i) => ({
        _id: sub._id,
        title: sub.title,
        completed: i === index ? !sub.completed : !!sub.completed,
        priority: sub.priority || 'Medium'
      }));
      const updated = await updateTask(id, { subtasks: currentSubtasks });
      setTask(updated);
      triggerToast(currentSubtasks[index].completed ? 'Subtask marked completed' : 'Subtask marked pending');
    } catch (err) {
      console.error('Error toggling subtask:', err);
    }
  };

  const handleDuplicateSubtask = async (index) => {
    if (!checkCanModifyTask()) return;
    try {
      const currentSubtasks = (task.subtasks || []).map(sub => ({
        _id: sub._id,
        title: sub.title,
        completed: !!sub.completed,
        priority: sub.priority || 'Medium'
      }));
      if (index < 0 || index >= currentSubtasks.length) return;
      const subToDup = currentSubtasks[index];
      const duplicated = {
        title: `${subToDup.title} (Copy)`,
        completed: false,
        priority: subToDup.priority || 'Medium'
      };
      currentSubtasks.splice(index + 1, 0, duplicated);
      const updated = await updateTask(id, { subtasks: currentSubtasks });
      setTask(updated);
      triggerToast('Subtask duplicated!');
    } catch (err) {
      console.error('Error duplicating subtask:', err);
    }
  };

  const handleDeleteSubtask = async (index) => {
    if (!checkCanModifyTask()) return;
    try {
      const currentSubtasks = (task.subtasks || []).map(sub => ({
        _id: sub._id,
        title: sub.title,
        completed: !!sub.completed,
        priority: sub.priority || 'Medium'
      }));
      if (index < 0 || index >= currentSubtasks.length) return;
      currentSubtasks.splice(index, 1);
      const updated = await updateTask(id, { subtasks: currentSubtasks });
      setTask(updated);
      triggerToast('Subtask deleted');
    } catch (err) {
      console.error('Error deleting subtask:', err);
    }
  };

  const handleSubtaskPriorityChange = async (index, newPriority) => {
    if (!checkCanModifyTask()) return;
    try {
      const currentSubtasks = (task.subtasks || []).map((sub, i) => ({
        _id: sub._id,
        title: sub.title,
        completed: !!sub.completed,
        priority: i === index ? newPriority : (sub.priority || 'Medium')
      }));
      const updated = await updateTask(id, { subtasks: currentSubtasks });
      setTask(updated);
      triggerToast(`Subtask priority set to ${newPriority}`);
    } catch (err) {
      console.error('Error updating subtask priority:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const updatedTask = await addComment(id, commentText);
      setTask(updatedTask);
      setCommentText('');
      triggerToast('Comment added');
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (e, commentId) => {
    e.preventDefault();
    const text = replyTexts[commentId];
    if (!text || !text.trim()) return;
    setSubmitting(true);
    try {
      const updatedTask = await addReply(id, commentId, text);
      setTask(updatedTask);
      setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
      setReplyingTo(null);
      triggerToast('Reply added');
    } catch (err) {
      console.error('Error adding reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar generator helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const currentYear = calDate.getFullYear();
  const currentMonth = calDate.getMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);
  const calendarDays = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, currentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, currentMonth: true });
  }
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, currentMonth: false });
  }

  if (loading) {
    return (
      <div className="dashboard-layout" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <div className="main-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Navbar />
          <div style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>Loading task details...</div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="dashboard-layout" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <div className="main-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Navbar />
          <div style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>Task not found.</div>
        </div>
      </div>
    );
  }

  const assigneeName = task.assignedTo?.[0]?.name || user?.name || 'Assignee';
  const assigneeAvatar = task.assignedTo?.[0]?.avatar || user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(assigneeName)}`;
  const formattedStartDate = task.startDate 
    ? new Date(task.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    : 'Start';

  const formattedEndDate = (task.endDate || task.dueDate) 
    ? new Date(task.endDate || task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    : 'End';

  const currentStatusObj = STATUS_OPTIONS.find(s => s.id === (task.status || '').toLowerCase()) || STATUS_OPTIONS[1];
  const currentPriorityObj = PRIORITIES.find(p => p.name.toLowerCase() === (task.priority || 'low').toLowerCase()) || PRIORITIES[2];

  return (
    <div className="dashboard-layout" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div className="main-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar />

        {/* Floating Feedback Toast Notification */}
        {toastMsg && (
          <div className="action-toast-banner">
            {toastMsg}
          </div>
        )}

        {/* ── Modal 1: Add New Label ── */}
        {showLabelModal && (
          <div className="modal-overlay-backdrop" onClick={() => setShowLabelModal(false)}>
            <div className="custom-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-card-header">
                <h3>🏷 Add New Label</h3>
                <button className="modal-close-btn" onClick={() => setShowLabelModal(false)}>✕</button>
              </div>
              <form onSubmit={handleCreateLabelSubmit} className="modal-card-body">
                <label className="modal-field-label">Label Name</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend, API, Urgent..."
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  className="modal-text-input"
                  autoFocus
                  required
                />
                
                <label className="modal-field-label" style={{ marginTop: '12px' }}>Color Badge</label>
                <div className="color-dots-row">
                  {LABEL_COLORS.map(c => (
                    <span 
                      key={c} 
                      className={`color-dot-choice ${selectedColor === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setSelectedColor(c)}
                    />
                  ))}
                </div>

                <div className="modal-card-footer">
                  <button type="button" className="btn-small-light" onClick={() => setShowLabelModal(false)}>Cancel</button>
                  <button type="submit" className="btn-small-dark">+ Create Label</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal 2: Add Member / Team ── */}
        {showMemberModal && (
          <div className="modal-overlay-backdrop" onClick={() => setShowMemberModal(false)}>
            <div 
              className="custom-modal-card" 
              onClick={(e) => e.stopPropagation()} 
              style={{ 
                maxWidth: '450px',
                width: '100%',
                background: '#18181b', 
                border: '1px solid #27272a',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                color: '#f4f4f5'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    {addMode === 'team' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f4f4f5', margin: 0 }}>
                      {addMode === 'team' ? 'Add Team / Group' : 'Add Member'}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#a1a1aa', margin: '2px 0 0 0' }}>
                      {addMode === 'team' ? 'Assign a single role to multiple people' : 'Assign task access to an individual member'}
                    </p>
                  </div>
                </div>
                <button 
                  className="modal-close-btn" 
                  onClick={() => setShowMemberModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '1.125rem', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                >
                  ✕
                </button>
              </div>

              {/* Mode Switcher Segmented Control */}
              <div style={{ display: 'flex', gap: '4px', background: '#09090b', padding: '4px', borderRadius: '10px', border: '1px solid #27272a', marginBottom: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setAddMode('team')}
                  style={{ 
                    flex: 1, 
                    padding: '8px 12px', 
                    borderRadius: '7px', 
                    fontSize: '0.78125rem', 
                    fontWeight: 600, 
                    background: addMode === 'team' ? '#27272a' : 'transparent', 
                    color: addMode === 'team' ? '#f4f4f5' : '#a1a1aa', 
                    border: addMode === 'team' ? '1px solid #3f3f46' : '1px solid transparent', 
                    cursor: 'pointer', 
                    transition: 'all 0.15s ease',
                    boxShadow: addMode === 'team' ? '0 2px 4px rgba(0,0,0,0.4)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span>Team (Multi-Person)</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setAddMode('single')}
                  style={{ 
                    flex: 1, 
                    padding: '8px 12px', 
                    borderRadius: '7px', 
                    fontSize: '0.78125rem', 
                    fontWeight: 600, 
                    background: addMode === 'single' ? '#27272a' : 'transparent', 
                    color: addMode === 'single' ? '#f4f4f5' : '#a1a1aa', 
                    border: addMode === 'single' ? '1px solid #3f3f46' : '1px solid transparent', 
                    cursor: 'pointer', 
                    transition: 'all 0.15s ease',
                    boxShadow: addMode === 'single' ? '0 2px 4px rgba(0,0,0,0.4)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>Single Member</span>
                </button>
              </div>

              <form onSubmit={handleAddMemberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#a1a1aa', marginBottom: '6px' }}>
                    {addMode === 'team' ? 'Teammates / People List (Comma Separated)' : 'Member Name'}
                  </label>
                  <input
                    type="text"
                    placeholder={addMode === 'team' ? 'e.g. Ankit Dutta, Sarah Connor, Alex Smith' : 'e.g. Ankit Dutta'}
                    value={newMemberInput}
                    onChange={(e) => setNewMemberInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '10px',
                      color: '#f4f4f5',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#a1a1aa', marginBottom: '6px' }}>
                    Role & Permission
                  </label>
                  <select 
                    value={memberRole} 
                    onChange={(e) => setMemberRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '10px',
                      color: '#f4f4f5',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Assignee" style={{ background: '#18181b', color: '#f4f4f5' }}>Assignee — Full Edit Access</option>
                    <option value="Reviewer" style={{ background: '#18181b', color: '#f4f4f5' }}>Reviewer — Comments & Review Access</option>
                    <option value="Observer" style={{ background: '#18181b', color: '#f4f4f5' }}>Observer — Read-Only Access</option>
                  </select>
                </div>

                {/* Permission Helper Card */}
                <div style={{ padding: '12px 14px', background: 'rgba(99, 102, 241, 0.08)', borderLeft: '3px solid #6366f1', borderRadius: '8px', fontSize: '0.78125rem', color: '#e0e7ff', lineHeight: 1.45 }}>
                  {memberRole === 'Assignee' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                      <span><strong>Assignee:</strong> Full Edit access to work on subtasks, update status, & edit dates.</span>
                    </span>
                  )}
                  {memberRole === 'Reviewer' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      <span><strong>Reviewer:</strong> Review access to inspect work, leave feedback, & post replies.</span>
                    </span>
                  )}
                  {memberRole === 'Observer' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <span><strong>Observer:</strong> Read-Only access to monitor progress without making changes.</span>
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowMemberModal(false)}
                    style={{ padding: '9px 16px', background: 'transparent', border: '1px solid #27272a', borderRadius: '8px', color: '#a1a1aa', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', borderRadius: '8px', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)' }}
                  >
                    {addMode === 'team' ? '+ Add Team (Multi-Person)' : '+ Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <main className="main-content task-detail-page" style={{ flex: 1, overflow: 'auto', background: '#ffffff' }}>
          <div className="task-detail-page-content">

            {/* ── Top Header Row (Title + Top Action Icons) ── */}
            <div className="task-detail-top-header">
              <h1 className="task-detail-title">{task.title || 'Write API Documentation'}</h1>
              
              {/* Fully Working Action Buttons */}
              <div className="task-top-actions">
                <button 
                  className="visibility-toggle-btn" 
                  onClick={handleTogglePublic}
                  title={isPublic ? "Public Task (Visible to team)" : "Private Task (Only creator & members)"}
                  style={{ 
                    height: '32px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    fontSize: '0.78125rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: isPublic ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                    color: isPublic ? '#4ade80' : '#d4d4d8',
                    border: isPublic ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: isPublic ? '0 0 12px rgba(34, 197, 94, 0.2)' : 'none'
                  }}
                >
                  {isPublic ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <span>Private</span>
                    </>
                  )}
                </button>

                <button className="icon-btn-view" onClick={handleShowViews} title="Total Task Page Views">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6366f1' }}>{viewsCount}</span>
                </button>

                <button className="icon-btn" onClick={handleShareTask} title="Share task link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>

                <div style={{ position: 'relative' }} ref={optionsRef}>
                  <button className="icon-btn" onClick={() => setOptionsOpen(!optionsOpen)} title="More options">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                  </button>

                  {optionsOpen && (
                    <div className="options-dropdown-menu">
                      <div className="dropdown-option-item" onClick={handleShareTask}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        Copy Task Link
                      </div>
                      <div className="dropdown-option-item" onClick={handleDuplicateTask}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Duplicate Task
                      </div>
                      <div className="dropdown-option-item delete-red" onClick={handleDeleteTask}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Delete Task
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  className={`icon-btn ${!showSidePanel ? 'panel-toggle-inactive' : ''}`} 
                  onClick={handleToggleSidePanel} 
                  title={showSidePanel ? "Hide details panel" : "Show details panel"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                </button>

              </div>
            </div>

            {/* ── Single Wrapper Div for Both Left Content and Right Details Panel ── */}
            <div className="task-detail-columns-wrapper">

              {/* ── Left Content Column ── */}
              <div className="task-main-col">
                
                {/* Description */}
                <p className="task-detail-desc">
                  {task.description || 'Create clear and detailed API documentation.'}
                </p>

                {/* Properties Section */}
                <div className="properties-section">
                  <div className="property-row">
                    <span className="property-label">Properties</span>
                    <div className="property-pills">
                      <span className="pill-badge">
                        <span className="role-letter">A</span>
                        Designer
                      </span>
                      <span className="pill-badge red-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {task.startDate ? `${formattedStartDate} → ${formattedEndDate}` : formattedEndDate}
                      </span>
                    </div>
                  </div>

                  <div className="property-row">
                    <span className="property-label">Labels</span>
                    <div className="property-pills">
                      {(task.labels && task.labels.length > 0 ? task.labels : ['Research', 'Design', 'Development', 'Testing', 'Deployment']).map((lbl, idx) => (
                        <span key={idx} className="label-tag">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                          {lbl}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="property-row">
                    <span className="property-label">Resources</span>
                    <div className="property-pills">
                      {isEditingResource ? (
                        <form onSubmit={handleSaveResource} style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Paste document link or title..."
                            value={resourceLink}
                            onChange={(e) => setResourceLink(e.target.value)}
                            className="resource-input"
                            autoFocus
                          />
                          <button type="submit" className="btn-small-dark">Save</button>
                        </form>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="add-resource-link" onClick={() => setIsEditingResource(true)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                            {resourceLink || 'Add document or link...'}
                          </span>
                          {resourceLink && (
                            <button 
                              className="icon-btn-ghost" 
                              onClick={() => { setResourceLink(''); triggerToast('Resource link removed'); }}
                              title="Remove resource link"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subtasks Section */}
                <div className="subtasks-container">
                  <div className="section-title-dropdown">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    <h3 className="section-heading">Subtasks</h3>
                  </div>

                  <div className="subtask-card-box">
                    <table className="subtask-table">
                      <thead>
                        <tr>
                          <th style={{ width: '30%' }}>Task</th>
                          <th style={{ width: '20%' }}>Priority</th>
                          <th style={{ width: '18%' }}>Members</th>
                          <th style={{ width: '22%' }}>Due Date</th>
                          <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {task.subtasks && task.subtasks.length > 0 ? task.subtasks.map((sub, idx) => {
                          const prioColor = sub.priority === 'High' ? '#ea580c' : sub.priority === 'Low' ? '#16a34a' : sub.priority === 'Urgent' ? '#dc2626' : '#ca8a04';
                          return (
                            <tr key={sub._id || idx}>
                              <td>
                                <span className="subtask-title-text" style={{ textDecoration: sub.completed ? 'line-through' : 'none', opacity: sub.completed ? 0.6 : 1 }}>
                                  {sub.title}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ color: prioColor }}><rect x="3" y="14" width="4" height="7"/><rect x="10" y="8" width="4" height="13"/><rect x="17" y="2" width="4" height="19"/></svg>
                                  <select
                                    value={sub.priority || 'Medium'}
                                    onChange={(e) => handleSubtaskPriorityChange(idx, e.target.value)}
                                    className="subtask-priority-select"
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      color: prioColor,
                                      cursor: 'pointer',
                                      outline: 'none',
                                      padding: '2px 4px'
                                    }}
                                  >
                                    {PRIORITIES.map(p => (
                                      <option key={p.name} value={p.name} style={{ color: '#09090b', background: '#ffffff' }}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </td>
                              <td>
                                {sub.avatar ? (
                                  <img src={sub.avatar} alt="member" className="avatar-micro" />
                                ) : sub.member === '+' ? (
                                  <div className="avatar-micro-plus">+</div>
                                ) : (
                                  <div className="avatar-micro-placeholder">{sub.member || '—'}</div>
                                )}
                              </td>
                              <td style={{ fontSize: '0.8125rem', color: '#52525b' }}>
                                {sub.dueDate ? (typeof sub.dueDate === 'string' ? sub.dueDate : new Date(sub.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })) : '—'}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <SubtaskRowActions 
                                  sub={sub} 
                                  index={idx} 
                                  onToggle={handleToggleSubtask} 
                                  onDuplicate={handleDuplicateSubtask} 
                                  onDelete={handleDeleteSubtask} 
                                />
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#71717a', fontSize: '0.8125rem' }}>
                              No subtasks yet. Click "Add Subtasks" below to create one.
                            </td>
                          </tr>
                        )}

                        {showAddSubtaskRow && (
                          <tr>
                            <td>
                              <input
                                type="text"
                                placeholder="Subtask title..."
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                className="subtask-inline-input"
                                autoFocus
                              />
                            </td>
                            <td>
                              <select
                                value={newSubtaskPriority}
                                onChange={(e) => setNewSubtaskPriority(e.target.value)}
                                className="subtask-inline-select"
                              >
                                {PRIORITIES.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                              </select>
                            </td>
                            <td colSpan="3" style={{ textAlign: 'right' }}>
                              <button onClick={handleAddSubtask} className="btn-small-dark" style={{ marginRight: '6px' }}>Add</button>
                              <button onClick={() => setShowAddSubtaskRow(false)} className="btn-small-light">Cancel</button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {!showAddSubtaskRow && (
                      <div className="subtask-card-footer">
                        <button className="add-subtask-btn" onClick={() => setShowAddSubtaskRow(true)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Add Subtasks
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Stream Section */}
                <div className="comments-stream-container">
                  <div className="section-title-dropdown" style={{ marginBottom: '8px' }}>
                    <h3 className="section-heading">Comments</h3>
                  </div>

                  {task.comments && task.comments.map((c, i) => {
                    const commentAuthorInitials = c.userId?.name ? c.userId.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'AN';
                    return (
                      <div key={c._id || i} className="comment-card">
                        <div className="comment-card-header">
                          <div className="author-info">
                            <div className="avatar-circle-red">{commentAuthorInitials}</div>
                            <span className="author-name">{c.userId?.name || 'Unknown'}</span>
                            <span className="comment-time">{c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}</span>
                          </div>
                        </div>
                        <div className="comment-body-text">{c.message}</div>

                        {/* Reply button */}
                        <div className="comment-reply-actions">
                          <button
                            className="reply-toggle-btn"
                            onClick={() => setReplyingTo(replyingTo === c._id ? null : c._id)}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                            Reply
                          </button>
                          {c.replies && c.replies.length > 0 && (
                            <span className="reply-count-badge">{c.replies.length} {c.replies.length === 1 ? 'reply' : 'replies'}</span>
                          )}
                        </div>

                        {/* Nested replies */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="replies-thread">
                            {c.replies.map((reply, rIdx) => {
                              const replyInitials = reply.userId?.name ? reply.userId.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';
                              return (
                                <div key={reply._id || rIdx} className="reply-card">
                                  <div className="reply-card-header">
                                    <div className="avatar-circle-red-small">{replyInitials}</div>
                                    <span className="reply-author-name">{reply.userId?.name || 'Unknown'}</span>
                                    <span className="comment-time">{reply.createdAt ? new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}</span>
                                  </div>
                                  <div className="reply-body-text">{reply.message}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Inline reply form */}
                        {replyingTo === c._id && (
                          <div className="reply-form-wrapper">
                            <div className="replying-to-label">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                              Replying to <strong>{c.userId?.name || 'Unknown'}</strong>
                            </div>
                            <form onSubmit={(e) => handleAddReply(e, c._id)} className="reply-input-row">
                              <div className="avatar-circle-red-small">
                                {user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'ME'}
                              </div>
                              <input
                                type="text"
                                placeholder="Write a reply..."
                                value={replyTexts[c._id] || ''}
                                onChange={(e) => setReplyTexts(prev => ({ ...prev, [c._id]: e.target.value }))}
                                className="reply-text-field"
                                autoFocus
                              />
                              <div className="reply-actions">
                                <button type="button" className="icon-btn-ghost" onClick={() => setReplyingTo(null)} title="Cancel">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                                <button type="submit" className="icon-btn-ghost" disabled={submitting} title="Send reply">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <form onSubmit={handleAddComment} className="main-comment-input-box">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="comment-input-field"
                    />
                    <div className="comment-box-actions">
                      <button type="button" className="icon-btn-ghost" title="Attach file">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                      </button>
                      <button type="submit" disabled={submitting} className="send-btn" title="Send comment">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </button>
                    </div>
                  </form>
                </div>

              </div>

              {/* ── Right Side Details Panel Column (Toggleable) ── */}
              {showSidePanel && (
                <div className="task-side-col">
                  <div className={`side-details-panel ${compactMode ? 'compact-mode' : ''}`}>

                    {/* Details Header with Working + and ⚙️ Buttons & Collapsible Chevron */}
                    <div className="panel-header">
                      <div 
                        className="panel-title" 
                        onClick={() => setDetailsCollapsed(!detailsCollapsed)}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        <svg 
                          width="14" 
                          height="14" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                          style={{ transition: 'transform 0.2s ease', transform: detailsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                        >
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                        Details
                      </div>

                      <div className="panel-actions">
                        
                        {/* 1. Add Details (+) Dropdown */}
                        <div style={{ position: 'relative' }} ref={addFieldRef}>
                          <button 
                            className="icon-btn-ghost" 
                            onClick={() => setAddFieldOpen(!addFieldOpen)}
                            title="Add property or detail"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>

                          {addFieldOpen && (
                            <div className="options-dropdown-menu left-align-menu">
                              <div className="dropdown-option-item" onClick={() => { setAddFieldOpen(false); setShowLabelModal(true); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                Add New Label
                              </div>
                              <div className="dropdown-option-item" onClick={() => { setAddFieldOpen(false); setShowMemberModal(true); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                                Add Member / Team
                              </div>
                              <div className="dropdown-option-item" onClick={() => { setAddFieldOpen(false); setActiveDateType('start'); setDatePickerOpen(true); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                Set Start Date
                              </div>
                              <div className="dropdown-option-item" onClick={() => { setAddFieldOpen(false); setActiveDateType('end'); setDatePickerOpen(true); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                Set End Date
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. Panel Settings (⚙️) Dropdown */}
                        <div style={{ position: 'relative' }} ref={panelSettingsRef}>
                          <button 
                            className="icon-btn-ghost" 
                            onClick={() => setPanelSettingsOpen(!panelSettingsOpen)}
                            title="Panel Settings"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                          </button>

                          {panelSettingsOpen && (
                            <div className="options-dropdown-menu left-align-menu">
                              <div className="dropdown-option-item" onClick={handleToggleCompactMode}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>
                                {compactMode ? 'Disable Compact View' : 'Enable Compact View'}
                              </div>
                              <div className="dropdown-option-item" onClick={() => { setPanelSettingsOpen(false); router.push('/settings/profile'); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82"/></svg>
                                Account Settings
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {!detailsCollapsed && (
                      <div className="panel-body">

                      {/* Dynamic Status Dropdown Row */}
                      <div className="detail-row" ref={statusRef} style={{ position: 'relative' }}>
                        <span className="detail-label">Status</span>
                        <div className="detail-value-clickable" onClick={() => setStatusOpen(!statusOpen)}>
                          <span className="status-dot" style={{ background: currentStatusObj.dot }}/>
                          <span style={{ fontWeight: 600, color: currentStatusObj.color }}>{currentStatusObj.label}</span>
                        </div>

                        {statusOpen && (
                          <div className="details-dropdown-popup">
                            <div className="dropdown-popup-title">Set Status</div>
                            {STATUS_OPTIONS.map(s => (
                              <div
                                key={s.id}
                                className="dropdown-popup-item"
                                onClick={() => handleStatusChange(s.id)}
                              >
                                <span className="status-dot" style={{ background: s.dot }}/>
                                <span style={{ fontWeight: s.id === currentStatusObj.id ? 700 : 500 }}>{s.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Dynamic Priority Dropdown Row */}
                      <div className="detail-row" ref={priorityRef} style={{ position: 'relative' }}>
                        <span className="detail-label">Priority</span>
                        <div className="detail-value-clickable" onClick={() => setPriorityOpen(!priorityOpen)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: currentPriorityObj.color }}><rect x="3" y="14" width="4" height="7"/><rect x="10" y="8" width="4" height="13"/><rect x="17" y="2" width="4" height="19"/></svg>
                          <span style={{ fontWeight: 600, color: currentPriorityObj.color }}>{currentPriorityObj.name}</span>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>

                        {priorityOpen && (
                          <div className="details-dropdown-popup">
                            <div className="dropdown-popup-title">Priority</div>
                            {PRIORITIES.map(p => (
                              <div
                                key={p.name}
                                className="dropdown-popup-item"
                                onClick={() => handlePriorityChange(p.name)}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ color: p.color }}><rect x="3" y="14" width="4" height="7"/><rect x="10" y="8" width="4" height="13"/><rect x="17" y="2" width="4" height="19"/></svg>
                                <span style={{ color: p.color, fontWeight: p.name.toLowerCase() === currentPriorityObj.name.toLowerCase() ? 700 : 500 }}>{p.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Members Row */}
                      <div className="detail-row">
                        <span className="detail-label">Members</span>
                        <div className="detail-value-clickable" onClick={() => { setAddMode('single'); setShowMemberModal(true); }}>
                          {task.membersWithRoles && task.membersWithRoles.filter(m => !m.isTeam && !m.name.toLowerCase().includes('team') && !m.name.toLowerCase().includes('leads') && !m.name.toLowerCase().includes('group')).length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {task.membersWithRoles.filter(m => !m.isTeam && !m.name.toLowerCase().includes('team') && !m.name.toLowerCase().includes('leads') && !m.name.toLowerCase().includes('group')).map((m, idx) => (
                                <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255, 255, 255, 0.08)', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.1)' }}>
                                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                                  <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', background: m.role === 'Assignee' ? '#2563eb' : m.role === 'Reviewer' ? '#d97706' : '#6b7280', color: '#ffffff', padding: '1px 6px', borderRadius: '8px' }}>{m.role}</span>
                                </span>
                              ))}
                              <span style={{ fontSize: '0.75rem', color: '#6366f1', marginLeft: '4px', fontWeight: 600 }}>+ Add</span>
                            </div>
                          ) : (
                            <>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              <span className="detail-action-text">Add members</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Dates Interactive Row */}
                      <div className="detail-row" ref={dateRef} style={{ position: 'relative' }}>
                        <span className="detail-label">Dates</span>
                        <div className="date-pills-group">
                          <span 
                            className={`date-pill-btn ${activeDateType === 'start' ? 'active-pill' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDateType('start');
                              if (task.startDate) setCalDate(new Date(task.startDate));
                              setDatePickerOpen(true);
                            }}
                            title="Click to set Start Date"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            {formattedStartDate}
                          </span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                          <span 
                            className={`date-pill-btn ${activeDateType === 'end' ? 'active-pill' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDateType('end');
                              if (task.endDate || task.dueDate) setCalDate(new Date(task.endDate || task.dueDate));
                              setDatePickerOpen(true);
                            }}
                            title="Click to set End Date"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            {formattedEndDate}
                          </span>
                        </div>

                        {datePickerOpen && (
                          <div className="calendar-popup-box" onClick={(e) => e.stopPropagation()}>
                            {/* Start / End Date Mode Switcher Tabs */}
                            <div className="cal-tab-switcher">
                              <button 
                                type="button"
                                className={`cal-tab-btn ${activeDateType === 'start' ? 'active' : ''}`}
                                onClick={() => {
                                  setActiveDateType('start');
                                  if (task.startDate) setCalDate(new Date(task.startDate));
                                }}
                              >
                                Start Date
                              </button>
                              <button 
                                type="button"
                                className={`cal-tab-btn ${activeDateType === 'end' ? 'active' : ''}`}
                                onClick={() => {
                                  setActiveDateType('end');
                                  if (task.endDate || task.dueDate) setCalDate(new Date(task.endDate || task.dueDate));
                                }}
                              >
                                End Date
                              </button>
                            </div>

                            <div className="calendar-header-nav">
                              <button
                                type="button"
                                className="cal-nav-btn"
                                onClick={() => setCalDate(new Date(currentYear, currentMonth - 1, 1))}
                              >
                                ‹
                              </button>
                              <span className="cal-month-title">{monthNames[currentMonth]} {currentYear}</span>
                              <button
                                type="button"
                                className="cal-nav-btn"
                                onClick={() => setCalDate(new Date(currentYear, currentMonth + 1, 1))}
                              >
                                ›
                              </button>
                            </div>

                            <div className="calendar-week-row">
                              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(w => <span key={w}>{w}</span>)}
                            </div>

                            <div className="calendar-days-grid">
                              {calendarDays.map((item, idx) => {
                                const targetDate = activeDateType === 'start' ? task.startDate : (task.endDate || task.dueDate);
                                const isSelected = targetDate && item.currentMonth && 
                                  new Date(targetDate).getDate() === item.day && 
                                  new Date(targetDate).getMonth() === currentMonth && 
                                  new Date(targetDate).getFullYear() === currentYear;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    className={`cal-day-cell ${!item.currentMonth ? 'faded' : ''} ${isSelected ? 'active' : ''}`}
                                    onClick={() => {
                                      if (item.currentMonth) {
                                        const selDate = new Date(currentYear, currentMonth, item.day);
                                        handleDateSelect(selDate);
                                      }
                                    }}
                                  >
                                    {item.day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Labels Row */}
                      <div className="detail-row">
                        <span className="detail-label">Labels</span>
                        <div className="detail-value-clickable" onClick={() => setShowLabelModal(true)}>
                          {task?.labels && task.labels.length > 0 ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {task.labels.map((lbl, idx) => (
                                <span key={idx} className="label-tag">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                  {lbl}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                              <span className="detail-action-text">Add labels</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Teams Row */}
                      <div className="detail-row">
                        <span className="detail-label">Teams</span>
                        <div className="detail-value-clickable" onClick={() => { setAddMode('team'); setShowMemberModal(true); }}>
                          {task.membersWithRoles && task.membersWithRoles.filter(m => m.isTeam || m.name.toLowerCase().includes('team') || m.name.toLowerCase().includes('leads') || m.name.toLowerCase().includes('group')).length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {task.membersWithRoles.filter(m => m.isTeam || m.name.toLowerCase().includes('team') || m.name.toLowerCase().includes('leads') || m.name.toLowerCase().includes('group')).map((m, idx) => (
                                <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(99, 102, 241, 0.15)', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                  <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                    <span>{m.name}</span>
                                  </span>
                                  <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', background: m.role === 'Assignee' ? '#2563eb' : m.role === 'Reviewer' ? '#d97706' : '#6b7280', color: '#ffffff', padding: '1px 6px', borderRadius: '8px' }}>{m.role}</span>
                                </span>
                              ))}
                              <span style={{ fontSize: '0.75rem', color: '#6366f1', marginLeft: '4px', fontWeight: 600 }}>+ Add</span>
                            </div>
                          ) : (
                            <>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                              <span className="detail-action-text">Add teams</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Reporter Row */}
                      <div className="detail-row">
                        <span className="detail-label">Reporter</span>
                        <div className="detail-value-clickable">
                          <div className="avatar-circle-red-small">
                            {user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'ME'}
                          </div>
                          <span className="reporter-name-text">{user?.name || 'Logged-in User'}</span>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Activity Update Stream Below Details Box */}
                  <div className="activity-card-footer">
                    <div className="update-row">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ea580c' }}><rect x="3" y="14" width="4" height="7"/><rect x="10" y="8" width="4" height="13"/><rect x="17" y="2" width="4" height="19"/></svg>
                      <div className="update-text-col">
                        <span className="posted-update-text">posted an update · Aug 2026</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
