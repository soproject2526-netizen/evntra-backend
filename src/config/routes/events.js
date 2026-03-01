const express = require('express');
const router = express.Router();
const authOptional = require('../../middleware/authOptional');
const upload = require('../../middleware/upload');
const eventController = require("../controllers/eventController");

let listEvents, getEventDetail;
try {
  const evCtrls = require('../controllers/eventsController');
  listEvents = evCtrls.listEvents;
} catch (e) {
  console.error('ERROR: eventsController require failed:', e.message);
}

try {
  const evDetail = require('../controllers/eventDetailController');
  getEventDetail = evDetail.getEventDetail;
} catch (e) {
  console.error('ERROR: eventDetailController require failed:', e.message);
}
router.get('/__test/:id', (req, res) => {
  return res.json({ ok: true, testedId: req.params.id });
});

router.get('/',listEvents);
router.get('/:id',getEventDetail);
// Update event media
router.put("/events/:id",eventController.updateEventMedia);
router.post("/events/upload-media",upload.single("media"),eventController.uploadEventMedia);
module.exports = router;
