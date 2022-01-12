module.exports = {
  API_PORT: process.env.API_PORT || 3001,
  PORT: process.env.PORT || 3000,
  SIMPLEX_API: process.env.SIMPLEX_API || 'https://sandbox.test-simplexcc.com',
  SIMPLEX_API_KEY: process.env.SIMPLEX_API_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwYXJ0bmVyIjoidmVsYXMiLCJpcCI6WyIxLjIuMy40Il0sInNhbmRib3giOnRydWV9.NM61malc5izr4ehuMkIVHTjcGaDcfKZ6Fr5wBzZHvPw',
  FIXER_API_KEY: process.env.FIXER_API_KEY || null,
  FIXER_UPDATE_INTERVAL: parseInt(process.env.FIXER_UPDATE_INTERVAL) || (24 * 3600 * 1000),
};
