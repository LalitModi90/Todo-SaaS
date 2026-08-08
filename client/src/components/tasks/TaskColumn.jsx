import React from 'react';
import TaskCard from './TaskCard';

export default function TaskColumn({ id, title, count, tasks, onTaskUpdated, onAddTask }) {
  return (
    <div className="task-column">
      <div className="column-header">
        <div className="column-title-group">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="drag-handle-icon">
            <circle cx="9" cy="5" r="1" fill="currentColor"/>
            <circle cx="9" cy="12" r="1" fill="currentColor"/>
            <circle cx="9" cy="19" r="1" fill="currentColor"/>
            <circle cx="15" cy="5" r="1" fill="currentColor"/>
            <circle cx="15" cy="12" r="1" fill="currentColor"/>
            <circle cx="15" cy="19" r="1" fill="currentColor"/>
          </svg>
          <h3 className="column-title">{title}</h3>
        </div>
        <div className="column-actions">
          <button className="icon-btn-small" onClick={onAddTask} title={`Add task to ${title}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      </div>
      
      <div className="task-list">
        {tasks.map(task => (
          <TaskCard key={task._id || task.id} task={task} onTaskUpdated={onTaskUpdated} />
        ))}
      </div>
      
      <button className="add-task-btn" onClick={onAddTask}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Add Task
      </button>
    </div>
  );
}
