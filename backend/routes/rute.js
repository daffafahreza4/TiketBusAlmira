const express = require('express');
const { getAllRoutes, getRouteById } = require('../controllers/ruteController');

const router = express.Router();

// Get all active routes
router.get('/', getAllRoutes);

// Get route by ID
router.get('/:id', getRouteById);

module.exports = router;