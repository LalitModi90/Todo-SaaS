import React from 'react';
import TaskColumn from './TaskColumn';

export default function TaskBoard({ tasks = [], onTaskUpdated, onAddTask }) {
  const columns = [
    { id: 'todo', title: 'To Do', count: tasks.filter(t => t.status === 'todo').length, tasks: tasks.filter(t => t.status === 'todo') },
    { id: 'doing', title: 'Doing', count: tasks.filter(t => t.status === 'doing').length, tasks: tasks.filter(t => t.status === 'doing') },
    { id: 'completed', title: 'Completed', count: tasks.filter(t => t.status === 'completed').length, tasks: tasks.filter(t => t.status === 'completed') },
    { id: 'onhold', title: 'On Hold', count: tasks.filter(t => t.status === 'onhold').length, tasks: tasks.filter(t => t.status === 'onhold') }
  ];

  return (
    <div className="task-board-scroll" style={{position: 'relative'}}>
      <div className="task-board">
        {columns.map(col => (
          <TaskColumn
            key={col.id}
            id={col.id}
            title={col.title}
            count={col.count}
            tasks={col.tasks}
            onTaskUpdated={onTaskUpdated}
            onAddTask={() => onAddTask && onAddTask(col.id)}
          />
        ))}
      </div>
    </div>
  );
}
