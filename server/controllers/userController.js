const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Workspace = require('../models/Workspace');
const Comment = require('../models/Comment');
const { uploadToCloudinary } = require('../config/cloudinary');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    // IDOR Protection: User can only update their own profile
    if (req.params.id !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
    }

    const { name, email, avatar } = req.body;
    const updateData = { name, email, avatar };
    
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'avatars');
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: result.secure_url },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Avatar uploaded successfully',
      url: result.secure_url,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const currentUserId = (req.user.id || req.user._id || '').toString();
    let userId = req.params.id;
    if (userId === 'me' || !userId) {
      userId = currentUserId;
    } else {
      userId = userId.toString();
    }

    // Security Check: User can only delete their own account
    if (userId !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own account' });
    }

    // 1. Find projects created/led by this user
    const userProjects = await Project.find({ lead: userId }).select('_id');
    const userProjectIds = userProjects.map(p => p._id);

    // 2. Find tasks created by this user or inside user's projects
    const userTasks = await Task.find({
      $or: [
        { creator: userId },
        { project: { $in: userProjectIds } }
      ]
    }).select('_id');
    const userTaskIds = userTasks.map(t => t._id);

    // 3. Delete comments written by this user or on this user's tasks
    await Comment.deleteMany({
      $or: [
        { userId: userId },
        { taskId: { $in: userTaskIds } }
      ]
    });

    // 4. Delete tasks created by this user or in user's projects
    await Task.deleteMany({
      $or: [
        { creator: userId },
        { project: { $in: userProjectIds } }
      ]
    });

    // 5. Remove user from other people's tasks (where user was assigned/member)
    await Task.updateMany(
      { assignedTo: userId },
      { $pull: { assignedTo: userId } }
    );
    await Task.updateMany(
      { 'membersWithRoles.user': userId },
      { $pull: { membersWithRoles: { user: userId } } }
    );
    await Task.updateMany(
      { lockedBy: userId },
      { $unset: { lockedBy: 1 }, isLocked: false }
    );

    // 6. Delete projects led by this user
    await Project.deleteMany({ lead: userId });

    // 7. Remove user from other people's projects (where user was a team member)
    await Project.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );

    // 8. Delete workspaces owned by this user
    await Workspace.deleteMany({ owner: userId });

    // 9. Remove user from other people's workspaces (where user was a team member)
    await Workspace.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );

    // 10. Finally, delete the User document from DB
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: 'User account not found' });
    }

    res.status(200).json({ 
      message: 'Account deleted successfully. User data removed, and team memberships updated.' 
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getUsers, getUserById, updateUser, uploadAvatar, deleteUser };
