module.exports = (req, res) => {
  res.status(200).json({
    message: 'Welcome to the API! Try /api/get-time-entries or /api/save-time',
    method: req.method,
    path: req.url
  });
};