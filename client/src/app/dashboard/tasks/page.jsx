'use client';

import React, { useState, useEffect } from 'react';
import TaskHeader from '@/components/tasks/TaskHeader';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskTable from '@/components/tasks/TaskTable';
import { getAllTasks } from '@/api/taskApi';

const ALL_TASK_FIELDS = ['Priority', 'Members', 'Due Date', 'Labels', 'Status', 'Reporter'];

export default function TasksPage() {
  const [viewMode, setViewMode]       = useState('board'); // 'board' or 'list'
  const [tasks, setTasks]             = useState([]);
  const [modalStatus, setModalStatus] = useState(null);

  // Visible fields state
  const [visibleFields, setVisibleFields] = useState(new Set(['Priority', 'Members', 'Due Date']));

  // Live Search & Filter state
  const [searchQuery, setSearchQuery]       = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter]     = useState('all');

  const fetchTasks = async () => {
    try {
      const data = await getAllTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(task => {
    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = task.title?.toLowerCase().includes(q);
      const descMatch = task.description?.toLowerCase().includes(q);
      if (!titleMatch && !descMatch) return false;
    }
    // Priority filter check
    if (priorityFilter !== 'all') {
      if (task.priority?.toLowerCase() !== priorityFilter.toLowerCase()) return false;
    }
    // Status filter check
    if (statusFilter !== 'all') {
      if (task.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }
    return true;
  });

  return (
    <div className="tasks-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TaskHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        onTaskAdded={fetchTasks}
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
            onTaskUpdated={fetchTasks}
            onAddTask={(status) => setModalStatus(status || 'todo')}
            visibleFields={visibleFields}
          />
        ) : (
          <TaskTable
            tasks={filteredTasks}
            onTaskUpdated={fetchTasks}
            onAddTask={(status) => setModalStatus(status || 'todo')}
            visibleFields={visibleFields}
          />
        )}
      </div>
    </div>
  );
}
