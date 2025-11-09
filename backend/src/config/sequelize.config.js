require('dotenv').config();

const config = {
  development: {
    username: process.env.DB_USER || 'fun_writing_user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'fun_writing',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
  },
  test: {
    username: process.env.DB_USER || 'fun_writing_user',
    password: process.env.DB_PASSWORD || 'password',
    database: 'fun_writing_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      connectTimeout: 10000,
    },
  },
};

module.exports = config;
