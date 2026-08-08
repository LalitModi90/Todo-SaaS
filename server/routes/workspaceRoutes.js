const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createWorkspace, getWorkspaces, addMemberToWorkspace } = require('../controllers/workspaceController');

// Apply auth middleware to all workspace routes
router.use(auth);

router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.post('/:id/members', addMemberToWorkspace);

module.exports = router;
