const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  contenu: { type: String, required: true },
  dateAjout: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);
