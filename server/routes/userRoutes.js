const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { getUsers, getUserById, updateUser, uploadAvatar } = require('../controllers/userController');

// Apply auth middleware to all user routes
router.use(auth);

router.get('/', getUsers);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.get('/:id', getUserById);
router.put('/:id', updateUser);

module.exports = router;
