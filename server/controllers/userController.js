const bcrypt = require('bcryptjs');
const store = require('../storage/jsonStore');

const getProfile = async (req, res) => {
  try {
    const user = await store.findById('users', req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { password, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      data: safeUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile',
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await store.findById('users', req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { name, bio, location, portfolio, linkedin } = req.body;
    const updatedUser = await store.updateById('users', user._id, (currentUser) => {
      const profile = { ...currentUser.profile };
      if (bio !== undefined) profile.bio = bio.trim();
      if (location !== undefined) profile.location = location.trim();
      if (portfolio !== undefined) profile.portfolio = portfolio.trim();
      if (linkedin !== undefined) profile.linkedin = linkedin.trim();

      return {
        ...(name ? { name: name.trim() } : {}),
        profile,
        updatedAt: new Date().toISOString(),
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profile: updatedUser.profile,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Profile update failed',
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Current password and a new password of at least 6 characters are required',
      });
    }

    const user = await store.findById('users', req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    await store.updateById('users', user._id, {
      password: await bcrypt.hash(newPassword, 10),
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Password change failed',
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await store.deleteWhere('applications', (application) => application.user === req.user._id);
    await store.deleteById('users', req.user._id);

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Account deletion failed',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
};
