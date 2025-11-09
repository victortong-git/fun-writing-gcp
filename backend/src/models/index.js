const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');

const db = {};

// Load all models
const files = fs.readdirSync(__dirname).filter(
  (file) => file.endsWith('.js') && file !== 'index.js'
);

files.forEach((file) => {
  const model = require(path.join(__dirname, file));
  db[model.name] = model;
});

// Set up associations
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

db.sequelize = sequelize;
db.DataTypes = DataTypes;

module.exports = db;
