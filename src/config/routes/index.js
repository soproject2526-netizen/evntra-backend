const express = require('express');
const router = express.Router();
/**
 * EVENT ROUTES
 */
router.use('/events', require('./eventRoutes'));   // create event, upload media
//router.use('/events', require('./events'));        // list events, event detail

/**
 * ORGANIZER ROUTES
 */
router.use('/organizer', require('./organizer/organizerKycRoutes'));
router.use('/organizer', require('./organizer/organizerBusinessRoutes'));

/**
 * INTERACTIONS
 */
router.use('/events', require('./interactionRoutes'));
  ``
/**
 * MEDIA (if used separately)
 */
router.use('/media', require('./mediaRoutes'));
router.use("/event-tickets", require('./eventTicketsRoutes'));

/**
 * DASHBOARD
 */
router.use('/dashboard', require('./dashboardRoutes'));

router.use('/chats', require('./chats')); 

router.use('/calendar', require('./calendarRoutes'));

router.use('/auth', require('./authRoutes'));
router.use('/cities', require('./cityRoutes'));
router.use('/users', require('./usersRoutes'));

module.exports = router;
