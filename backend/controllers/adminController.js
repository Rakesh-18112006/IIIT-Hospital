import PatientRecord from '../models/PatientRecord.js';
import User from '../models/User.js';
import MedicalLeave from '../models/MedicalLeave.js';
import DietRecommendation from '../models/DietRecommendation.js';

// @desc    Get dashboard stats (Hospital Admin)
// @route   GET /api/admin/stats
// @access  Private (Hospital Admin)
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total patients today
    const totalPatientsToday = await PatientRecord.countDocuments({
      createdAt: { $gte: today }
    });

    // Severity distribution
    const severityDistribution = await PatientRecord.aggregate([
      {
        $match: {
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format severity distribution
    const severityStats = {
      red: 0,
      orange: 0,
      green: 0
    };
    severityDistribution.forEach(item => {
      severityStats[item._id] = item.count;
    });

    // Status distribution
    const statusDistribution = await PatientRecord.aggregate([
      {
        $match: {
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Doctor workload
    const doctorWorkload = await PatientRecord.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          assignedDoctor: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$assignedDoctor',
          patientsHandled: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $unwind: '$doctor'
      },
      {
        $project: {
          doctorName: '$doctor.name',
          patientsHandled: 1,
          completed: 1
        }
      }
    ]);

    // Bed/Resource simulation
    const activeCritical = await PatientRecord.countDocuments({
      severity: 'red',
      status: { $in: ['waiting', 'in_consultation'] }
    });
    
    const bedUsage = {
      totalBeds: 50,
      occupied: Math.min(activeCritical * 2 + Math.floor(Math.random() * 10), 50),
      available: 0
    };
    bedUsage.available = bedUsage.totalBeds - bedUsage.occupied;

    // Disease trends (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const diseaseTrends = await PatientRecord.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $unwind: '$symptoms'
      },
      {
        $group: {
          _id: '$symptoms',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Patients per day (last 7 days)
    const dailyPatients = await PatientRecord.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      totalPatientsToday,
      severityStats,
      statusDistribution,
      doctorWorkload,
      bedUsage,
      diseaseTrends,
      dailyPatients
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all doctors
// @route   GET /api/admin/doctors
// @access  Private (Hospital Admin)
export const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get weekly report
// @route   GET /api/admin/weekly-report
// @access  Private (Hospital Admin)
export const getWeeklyReport = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const totalPatients = await PatientRecord.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const completedCases = await PatientRecord.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      status: 'completed'
    });

    const referrals = await PatientRecord.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      status: 'referred'
    });

    const leavesIssued = await MedicalLeave.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      period: '7 days',
      totalPatients,
      completedCases,
      referrals,
      leavesIssued,
      completionRate: totalPatients > 0 ? ((completedCases / totalPatients) * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Get weekly report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
