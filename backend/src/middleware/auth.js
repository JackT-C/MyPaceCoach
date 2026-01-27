// Middleware to check if user is authenticated
export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Middleware to attach user to request
export const attachUser = async (req, res, next) => {
  if (req.isAuthenticated()) {
    req.currentUser = req.user;
  }
  next();
};
