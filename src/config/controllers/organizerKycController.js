const { OrganizerKYC } = require('../models');

exports.submitKYC = async (req, res) => {
  try {
    const organizerId = req.user.id;

    if (!req.files?.aadhar || !req.files?.pan || !req.files?.video) {
      return res.status(400).json({ message: 'All KYC files are required' });
    }

    const payload = {
      organizer_id: organizerId,
      aadhar_document: req.files.aadhar[0].path,
      pan_document: req.files.pan[0].path,
      verification_video: req.files.video[0].path
    };

    await OrganizerKYC.upsert(payload);

    res.json({
      success: true,
      message: 'KYC submitted successfully',
      status: 'pending'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'KYC submission failed' });
  }
};
