const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(status).json({
    error: isProd && status === 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error')
  });
};

module.exports = errorHandler;
