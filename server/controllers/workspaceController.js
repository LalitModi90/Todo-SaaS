const Workspace = require('../models/Workspace');

const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    const ownerId = req.user.id; // From auth middleware

    const newWorkspace = new Workspace({
      name,
      owner: ownerId,
      members: [ownerId] // Owner is automatically a member
    });

    const savedWorkspace = await newWorkspace.save();
    res.status(201).json(savedWorkspace);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getWorkspaces = async (req, res) => {
  try {
    // Return workspaces where user is a member
    const userId = req.user.id;
    const workspaces = await Workspace.find({ members: userId }).populate('owner', 'name email');
    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addMemberToWorkspace = async (req, res) => {
  try {
    const { id } = req.params; // workspace ID
    const { userId } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!workspace.members.includes(userId)) {
      workspace.members.push(userId);
      await workspace.save();
    }

    res.status(200).json(workspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createWorkspace, getWorkspaces, addMemberToWorkspace };
