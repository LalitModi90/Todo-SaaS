const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getCommentsByTask, deleteComment } = require('../controllers/commentController');

router.use(auth);

router.get('/task/:taskId', getCommentsByTask);
router.delete('/:id', deleteComment);

module.exports = router;
