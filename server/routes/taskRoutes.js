const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllTasks,
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  addCommentReply
} = require('../controllers/taskController');

router.use(auth);

router.get('/', getAllTasks);
router.get('/project/:projectId', getTasksByProject);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/comments', addTaskComment);
router.post('/:id/comments/:commentId/reply', addCommentReply);

module.exports = router;
