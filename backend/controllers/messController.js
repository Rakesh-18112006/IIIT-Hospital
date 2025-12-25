import DietRecommendation from '../models/DietRecommendation.js';
import User from '../models/User.js';

// @desc    Get all active diet recommendations (Mess Admin)
// @route   GET /api/mess/diets
// @access  Private (Mess Admin)
export const getActiveDiets = async (req, res) => {
  try {
    const diets = await DietRecommendation.find({
      status: 'active'
    })
      .populate('student', 'name studentId') // Only name and studentId, no medical info
      .sort({ dietType: 1, createdAt: -1 });

    res.json(diets);
  } catch (error) {
    console.error('Get active diets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get diet statistics (Mess Admin)
// @route   GET /api/mess/stats
// @access  Private (Mess Admin)
export const getDietStats = async (req, res) => {
  try {
    const stats = await DietRecommendation.aggregate([
      {
        $match: {
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$dietType',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      normal: 0,
      light: 0,
      special: 0,
      total: 0
    };

    stats.forEach(item => {
      formattedStats[item._id] = item.count;
      formattedStats.total += item.count;
    });

    res.json(formattedStats);
  } catch (error) {
    console.error('Get diet stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update diet status (Mess Admin)
// @route   PUT /api/mess/diets/:id
// @access  Private (Mess Admin)
export const updateDietStatus = async (req, res) => {
  try {
    const { status, messNotes, endDate } = req.body;

    const diet = await DietRecommendation.findById(req.params.id);

    if (!diet) {
      return res.status(404).json({ message: 'Diet recommendation not found' });
    }

    if (status) diet.status = status;
    if (messNotes) diet.messNotes = messNotes;
    if (endDate) diet.endDate = endDate;
    
    diet.updatedByMess = req.user._id;

    await diet.save();

    res.json(diet);
  } catch (error) {
    console.error('Update diet status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get students by diet type (Mess Admin)
// @route   GET /api/mess/diets/type/:type
// @access  Private (Mess Admin)
export const getStudentsByDietType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['normal', 'light', 'special'].includes(type)) {
      return res.status(400).json({ message: 'Invalid diet type' });
    }

    const diets = await DietRecommendation.find({
      dietType: type,
      status: 'active'
    })
      .populate('student', 'name studentId')
      .select('-patientRecord'); // Exclude medical reference

    res.json(diets);
  } catch (error) {
    console.error('Get students by diet type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
