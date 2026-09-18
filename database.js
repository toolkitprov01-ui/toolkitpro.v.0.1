// Database connection placeholder.
// PostgreSQL integration will be added in a later setup phase.

module.exports = {
  isConfigured: Boolean(process.env.DATABASE_URL)
};