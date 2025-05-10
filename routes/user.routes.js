const express = require('express');
const { protect, admin } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.get('/', protect, admin, userController.getAllUsers);
router.delete('/:id', protect, admin, userController.deleteUser);
router.put('/:id', protect, admin, userController.updateUserRole);

module.exports = router;
