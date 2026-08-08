const Task = require('../models/Task');
const User = require('../models/User');

const getAccessQuery = async (req) => {
  if (!req.user || !req.user.id) {
    return { isPublic: true };
  }

  let userName = '';
  try {
    const u = await User.findById(req.user.id);
    if (u) userName = u.name;
  } catch (e) {}

  const orConditions = [
    { creator: req.user.id },
    { assignedTo: req.user.id },
    { 'membersWithRoles.user': req.user.id },
    { isPublic: true }
  ];

  if (userName) {
    orConditions.push({ 'membersWithRoles.name': new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  }

  return { $or: orConditions };
};

const getAllTasks = async (req, res) => {
  try {
    const accessQuery = await getAccessQuery(req);
    const tasks = await Task.find(accessQuery)
      .sort({ createdAt: -1 })
      .populate('project', 'title')
      .populate('assignedTo', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('lockedBy', 'name email avatar')
      .populate({
        path: 'comments',
        populate: { path: 'userId', select: 'name email avatar' }
      });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const accessQuery = await getAccessQuery(req);
    let query = { ...accessQuery };

    if (projectId && projectId !== 'undefined') {
      try { query.project = projectId; } catch (e) { }
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .populate('project', 'title')
      .populate('assignedTo', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('lockedBy', 'name email avatar')
      .populate({
        path: 'comments',
        populate: { path: 'userId', select: 'name email avatar' }
      });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    )
      .populate('project', 'title')
      .populate('assignedTo', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('lockedBy', 'name email avatar')
      .populate({
        path: 'comments',
        populate: [
          { path: 'userId', select: 'name email avatar' },
          { path: 'replies', populate: { path: 'userId', select: 'name email avatar' } }
        ]
      });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Privacy Access Control: Check if task is private (isPublic === false)
    if (task.isPublic === false) {
      const currentUserId = req.user?.id ? req.user.id.toString() : null;
      const isCreator = task.creator && (task.creator._id ? task.creator._id.toString() : task.creator.toString()) === currentUserId;
      const isAssigned = task.assignedTo && task.assignedTo.some(u => (u._id ? u._id.toString() : u.toString()) === currentUserId);
      const isMember = task.membersWithRoles && task.membersWithRoles.some(m => m.user && (m.user._id ? m.user._id.toString() : m.user.toString()) === currentUserId);
      const isWithoutCreator = !task.creator;

      if (!isCreator && !isAssigned && !isMember && !isWithoutCreator) {
        return res.status(403).json({ error: 'Access denied. This task is private.' });
      }
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, project, status, priority, dueDate, startDate, endDate, assignedTo, labels, subtasks, isLocked, membersWithRoles, isPublic } = req.body;

    const newTask = new Task({
      title,
      description,
      project,
      status: status || 'todo',
      priority: priority || 'Medium',
      dueDate,
      startDate,
      endDate,
      assignedTo: assignedTo || (req.user ? [req.user.id] : []),
      creator: req.user ? req.user.id : undefined,
      labels: labels || [],
      subtasks: subtasks || [],
      isLocked: !!isLocked,
      lockedBy: isLocked && req.user ? req.user.id : undefined,
      membersWithRoles: membersWithRoles || [],
      isPublic: !!isPublic
    });

    const savedTask = await newTask.save();
    await savedTask.populate('project', 'title');
    await savedTask.populate('assignedTo', 'name email avatar');
    await savedTask.populate('creator', 'name email avatar');
    await savedTask.populate('lockedBy', 'name email avatar');
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const existingTask = await Task.findById(req.params.id);
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });

    const currentUserId = req.user?.id ? req.user.id.toString() : null;
    const creatorId = existingTask.creator ? (existingTask.creator._id ? existingTask.creator._id.toString() : existingTask.creator.toString()) : null;
    const isCreator = !!(creatorId && currentUserId && creatorId === currentUserId);
    const isAssigned = !!(existingTask.assignedTo && existingTask.assignedTo.some(u => (u._id ? u._id.toString() : u.toString()) === currentUserId));
    const isMember = !!(existingTask.membersWithRoles && existingTask.membersWithRoles.some(m => m.user && (m.user._id ? m.user._id.toString() : m.user.toString()) === currentUserId));
    
    const hasAssignments = (existingTask.assignedTo && existingTask.assignedTo.length > 0) || (existingTask.membersWithRoles && existingTask.membersWithRoles.length > 0);
    const canModify = creatorId ? (isCreator || isAssigned || isMember) : (hasAssignments ? (isAssigned || isMember) : true);

    const { title, description, status, priority, dueDate, startDate, endDate, assignedTo, labels, subtasks, isLocked, membersWithRoles, isPublic } = req.body;

    // 1. Check visibility toggle permission
    if (isPublic !== undefined && isPublic !== existingTask.isPublic) {
      if (!isCreator && creatorId) {
        return res.status(403).json({ error: 'Only the task creator can change task visibility (Public/Private).' });
      }
    }

    // 2. Enforce edit permission for Public and Private tasks
    if (!canModify) {
      if (existingTask.isPublic) {
        return res.status(403).json({ error: 'Public tasks are view-only. Only the task creator or assigned members can edit this task.' });
      } else {
        return res.status(403).json({ error: 'Access denied. You do not have permission to edit this private task.' });
      }
    }

    const updateData = { title, description, status, priority, dueDate, startDate, endDate, assignedTo, labels, subtasks, isLocked, membersWithRoles, isPublic };

    if (isLocked !== undefined) {
      if (isLocked) {
        updateData.lockedBy = req.user ? req.user.id : undefined;
      } else {
        updateData.lockedBy = null;
      }
    }

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('project', 'title')
      .populate('assignedTo', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('lockedBy', 'name email avatar')
      .populate({
        path: 'comments',
        populate: [
          { path: 'userId', select: 'name email avatar' },
          { path: 'replies', populate: { path: 'userId', select: 'name email avatar' } }
        ]
      });

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const existingTask = await Task.findById(req.params.id);
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });

    const currentUserId = req.user?.id ? req.user.id.toString() : null;
    const creatorId = existingTask.creator ? (existingTask.creator._id ? existingTask.creator._id.toString() : existingTask.creator.toString()) : null;
    const isCreator = !!(creatorId && currentUserId && creatorId === currentUserId);
    const isAssigned = !!(existingTask.assignedTo && existingTask.assignedTo.some(u => (u._id ? u._id.toString() : u.toString()) === currentUserId));
    const isMember = !!(existingTask.membersWithRoles && existingTask.membersWithRoles.some(m => m.user && (m.user._id ? m.user._id.toString() : m.user.toString()) === currentUserId));
    
    const hasAssignments = (existingTask.assignedTo && existingTask.assignedTo.length > 0) || (existingTask.membersWithRoles && existingTask.membersWithRoles.length > 0);
    const canModify = creatorId ? (isCreator || isAssigned || isMember) : (hasAssignments ? (isAssigned || isMember) : true);

    if (!canModify) {
      return res.status(403).json({ error: 'Access denied. Only the task creator or assigned members can delete this task.' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add comment to task helper
const addTaskComment = async (req, res) => {
  try {
    const Comment = require('../models/Comment');
    const { message } = req.body;

    const newComment = new Comment({
      message,
      taskId: req.params.id,
      userId: req.user.id,
      parentComment: null
    });
    const savedComment = await newComment.save();

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: savedComment._id } },
      { new: true }
    ).populate({
      path: 'comments',
      populate: [
        { path: 'userId', select: 'name email avatar' },
        {
          path: 'replies',
          populate: { path: 'userId', select: 'name email avatar' }
        }
      ]
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add reply to a comment
const addCommentReply = async (req, res) => {
  try {
    const Comment = require('../models/Comment');
    const { message } = req.body;
    const { id: taskId, commentId } = req.params;

    // Create the reply comment
    const reply = new Comment({
      message,
      taskId,
      userId: req.user.id,
      parentComment: commentId
    });
    const savedReply = await reply.save();

    // Push reply into parent comment's replies array
    await Comment.findByIdAndUpdate(commentId, {
      $push: { replies: savedReply._id }
    });

    // Return the full task with populated comments + replies
    const task = await Task.findById(taskId)
      .populate('project', 'title')
      .populate('assignedTo', 'name email avatar')
      .populate({
        path: 'comments',
        populate: [
          { path: 'userId', select: 'name email avatar' },
          {
            path: 'replies',
            populate: { path: 'userId', select: 'name email avatar' }
          }
        ]
      });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getAllTasks,
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  addCommentReply
};
