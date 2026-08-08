const Project = require('../models/Project');

const getProjects = async (req, res) => {
  try {
    // IDOR Protection: Only return projects where current user is lead or a member
    const projects = await Project.find({
      $or: [
        { lead: req.user.id },
        { members: req.user.id }
      ]
    })
      .populate('lead', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('lead', 'name email avatar')
      .populate('members', 'name email avatar');
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // IDOR Protection: Verify membership/lead
    const isMember = project.members.some(m => m._id.toString() === req.user.id) || project.lead._id.toString() === req.user.id;
    if (!isMember) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this project' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;
    
    const newProject = new Project({
      title,
      description,
      priority: priority || 'Medium',
      lead: req.user.id,
      members: [req.user.id],
      dueDate
    });

    const savedProject = await newProject.save();
    await savedProject.populate('lead members', 'name email avatar');
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // IDOR Protection: Only lead or existing members can update
    const isMember = project.members.some(m => m.toString() === req.user.id) || project.lead.toString() === req.user.id;
    if (!isMember) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update this project' });
    }

    const { title, description, priority, dueDate, members } = req.body;
    const updateData = { title, description, priority, dueDate };
    if (members) updateData.members = members;

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('lead members', 'name email avatar');

    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // IDOR Protection: Only project lead can delete
    if (project.lead.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Only project lead can delete this project' });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
