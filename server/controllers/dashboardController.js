const store = require('../storage/jsonStore');

const dateKey = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const localDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const today = localDateKey(now);
    const applications = (await store.readCollection('applications'))
      .filter((application) => application.user === userId)
      .sort((left, right) => (dateKey(right.applicationDate) || dateKey(right.createdAt) || '').localeCompare(dateKey(left.applicationDate) || dateKey(left.createdAt) || ''));

    const totalApplications = applications.length;
    const submittedThisMonth = applications.filter((application) => {
      return dateKey(application.applicationDate || application.createdAt)?.slice(0, 7) === currentMonth;
    }).length;
    const interviews = applications.filter(
      (application) => application.currentStatus === 'Interview'
        || (dateKey(application.interviewDate) >= today && !['Rejected', 'Withdrawn'].includes(application.currentStatus))
    ).length;
    const offers = applications.filter((application) => application.currentStatus === 'Offer').length;
    const rejected = applications.filter((application) => application.currentStatus === 'Rejected').length;
    const upcomingFollowUpsList = applications
      .filter((application) => dateKey(application.followUpDate) && dateKey(application.followUpDate) >= today)
      .sort((left, right) => dateKey(left.followUpDate).localeCompare(dateKey(right.followUpDate)));
    const statusMap = applications.reduce((summary, application) => {
      summary[application.currentStatus] = (summary[application.currentStatus] || 0) + 1;
      return summary;
    }, {});
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyActivity = monthLabels.map((name) => ({ name, count: 0 }));

    applications.forEach((application) => {
      const createdAt = new Date(application.createdAt);
      if (createdAt.getFullYear() === now.getFullYear()) {
        monthlyActivity[createdAt.getMonth()].count += 1;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        totals: {
          totalApplications,
          submittedThisMonth,
          interviews,
          offers,
          rejected,
          upcomingFollowUps: upcomingFollowUpsList.length,
        },
        recentApplications: applications.slice(0, 5),
        upcomingFollowups: upcomingFollowUpsList.slice(0, 4),
        statusDistribution: [
          'Saved',
          'Applied',
          'Assessment',
          'Interview',
          'Offer',
          'Rejected',
          'Withdrawn',
        ].map((status) => ({
          name: status,
          value: statusMap[status] || 0,
        })),
        monthlyActivity,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Dashboard stats could not be loaded',
    });
  }
};

module.exports = {
  getDashboardStats,
};
