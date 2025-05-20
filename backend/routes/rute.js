const express = require('express');
const { getAllRoutes, getRouteById } = require('../controllers/ruteController');

const router = express.Router();

// @route   GET /api/rute
// @desc    Get all active routes
// @access  Public
router.get('/', getAllRoutes);

// @route   GET /api/rute/:id
// @desc    Get route by ID
// @access  Public
router.get('/:id', getRouteById);

module.exports = router;