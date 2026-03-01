const { OrganizerBusinessInfo } = require('../models');

// Create or Update Business Info
exports.upsertBusinessInfo = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { gst_number, pan_number, country, address } = req.body;

    if (!organizerId) {
      return res.status(400).json({
        success: false,
        message: 'Organizer ID is required'
      });
    }

    await OrganizerBusinessInfo.upsert({
      organizer_id: organizerId,
      gst_number: gst_number || null,
      pan_number: pan_number || null,
      country: country || 'India',
      address: address || null
    });

    return res.json({
      success: true,
      message: 'Business information saved successfully'
    });

  } catch (error) {
    console.error('BUSINESS INFO ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save business information'
    });
  }
};

// Get Business Info
exports.getBusinessInfo = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const info = await OrganizerBusinessInfo.findOne({
      where: { organizer_id: organizerId }
    });

    return res.json({
      success: true,
      data: info
    });

  } catch (error) {
    console.error('GET BUSINESS INFO ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch business information'
    });
  }
};
