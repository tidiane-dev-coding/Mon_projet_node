require('dotenv').config();
const Joi = require('joi');
// Schéma Joi pour la validation des notes
const noteSchemaJoi = Joi.object({
  titre: Joi.string().min(2).max(100).required(),
  contenu: Joi.string().min(2).max(1000).required()
});
const express = require('express');
const mongoose = require('mongoose');
const Note = require('./modeleNote');

const multer = require('multer');
const path = require('path');

const helmet = require('helmet');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Sécurise les headers HTTP
app.use(helmet());
// Autorise les requêtes cross-origin
app.use(cors());

// Configuration Multer pour le stockage des fichiers dans le dossier 'uploads'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Rendre le dossier 'uploads' accessible publiquement
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware pour parser le JSON
app.use(express.json());

// Middleware de logs
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});

// Connexion à MongoDB Atlas ou local selon la variable d'environnement
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB :', err));

// CRUD Notes

// Route pour uploader un fichier
app.post('/upload', upload.single('fichier'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erreur: 'Aucun fichier envoyé.' });
  }
  // URL d'accès au fichier
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(201).json({ message: 'Fichier uploadé avec succès', url: fileUrl });
});

// Créer une note
app.post('/notes', async (req, res, next) => {
  try {
    const { error } = noteSchemaJoi.validate(req.body);
    if (error) {
      return res.status(400).json({ erreur: error.details[0].message });
    }
    const { titre, contenu } = req.body;
    const note = new Note({ titre, contenu });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

// Lire toutes les notes
app.get('/notes', async (req, res, next) => {
  try {
    const notes = await Note.find();
    res.json(notes);
  } catch (err) {
    next(err);
  }
});

// Lire une note spécifique
app.get('/notes/:id', async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ erreur: 'Note non trouvée.' });
    }
    res.json(note);
  } catch (err) {
    next(err);
  }
});

// Modifier une note
app.put('/notes/:id', async (req, res, next) => {
  try {
    const { error } = noteSchemaJoi.validate(req.body);
    if (error) {
      return res.status(400).json({ erreur: error.details[0].message });
    }
    const { titre, contenu } = req.body;
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { titre, contenu },
      { new: true, runValidators: true }
    );
    if (!note) {
      return res.status(404).json({ erreur: 'Note non trouvée.' });
    }
    res.json({ message: 'Note modifiée avec succès', note });
  } catch (err) {
    next(err);
  }
});

// Supprimer une note
app.delete('/notes/:id', async (req, res, next) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) {
      return res.status(404).json({ erreur: 'Note non trouvée.' });
    }
    res.json({ message: 'Note supprimée avec succès' });
  } catch (err) {
    next(err);
  }
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur :', err.message);
  res.status(500).json({ erreur: 'Erreur serveur', details: err.message });
});

// Route inconnue
app.use((req, res) => {
  res.status(404).json({ erreur: 'Route inconnue' });
});

app.listen(port, () => {
  console.log(`🚀 API Notes lancée sur http://localhost:${port}`);
});


app.get('/notes', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || 'date'; // 'date' ou 'matiere'
  const sortOrder = req.query.order === 'asc' ? 1 : -1;

  const skip = (page - 1) * limit;

  try {
    const totalNotes = await Note.countDocuments();
    const notes = await Note.find()
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    res.json({
      page,
      totalPages: Math.ceil(totalNotes / limit),
      totalNotes,
      notes
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des notes.' });
  }
});
// http://localhost:3000/notes?page=3&limit=5
// http://localhost:3000/notes?page=1&limit=5&sortBy=date&order=desc
//mongodb+srv://Bahamadoutidiane622292370:<db_password>@cluster0.niqycgy.mongodb.net/

