# API REST Gestion de Notes de Cours

Ce projet est une API REST réalisée avec Node.js, Express, Mongoose et Joi pour gérer des notes de cours. Elle inclut un middleware de logs et une gestion avancée des erreurs.

## Explication détaillée du code

```js
const Joi = require('joi');
```
- On importe Joi, une bibliothèque pour valider les données reçues dans les requêtes.

```js
const noteSchemaJoi = Joi.object({
  titre: Joi.string().min(2).max(100).required(),
  contenu: Joi.string().min(2).max(1000).required()
});
```
- On définit le schéma de validation pour une note : le titre et le contenu doivent être des chaînes de caractères, avec une longueur minimale et maximale, et sont obligatoires.

```js
const express = require('express');
```
- On importe Express, le framework pour créer le serveur web.

```js
const mongoose = require('mongoose');
```
- On importe Mongoose, qui sert à communiquer avec la base MongoDB.

```js
const Note = require('./modeleNote');
```
- On importe le modèle Mongoose pour les notes.

```js
const app = express();
const port = 3000;
```
- On crée l’application Express et on définit le port d’écoute du serveur.

```js
app.use(express.json());
```
- On ajoute un middleware pour que le serveur comprenne le format JSON dans les requêtes POST/PUT.

```js
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});
```
- Middleware de logs : chaque requête affiche la date, la méthode et l’URL dans la console.

```js

```js
mongoose.connect('mongodb://localhost:27017/notes_cours')
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB :', err));
```
- `mongoose.connect('mongodb://localhost:27017/notes_cours')` : Demande à Mongoose de se connecter à la base MongoDB locale nommée `notes_cours`.
- `.then(() => console.log('✅ Connecté à MongoDB'))` : Si la connexion réussit, affiche un message de succès dans la console.
- `.catch(err => console.error('❌ Erreur de connexion MongoDB :', err));` : Si la connexion échoue, affiche l’erreur dans la console.

### Endpoints CRUD

#### Créer une note
```js
app.post('/notes', async (req, res, next) => {
  try {
    const { error } = noteSchemaJoi.validate(req.body); // Valide les données reçues avec Joi
    if (error) {
      return res.status(400).json({ erreur: error.details[0].message }); // Si la validation échoue, retourne une erreur 400 avec le message Joi
    }
    const { titre, contenu } = req.body; // Récupère le titre et le contenu du corps de la requête
    const note = new Note({ titre, contenu }); // Crée une nouvelle note avec ces données
    await note.save(); // Sauvegarde la note dans MongoDB
    res.status(201).json(note); // Retourne la note créée avec le code 201
  } catch (err) {
    next(err); // Passe l’erreur au middleware de gestion des erreurs
  }
});
```

#### Lire toutes les notes
```js
app.get('/notes', async (req, res, next) => {
  try {
    const notes = await Note.find(); // Cherche toutes les notes dans la base
    res.json(notes); // Retourne la liste des notes en JSON
  } catch (err) {
    next(err); // Passe l’erreur au middleware de gestion des erreurs
  }
});
```

#### Lire une note spécifique
```js
app.get('/notes/:id', async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id); // Cherche la note par son identifiant
    if (!note) {
      return res.status(404).json({ erreur: 'Note non trouvée.' }); // Si la note n’existe pas, retourne une erreur 404
    }
    res.json(note); // Retourne la note trouvée
  } catch (err) {
    next(err); // Passe l’erreur au middleware de gestion des erreurs
  }
});
```

#### Modifier une note
```js
app.put('/notes/:id', async (req, res, next) => {
  try {
    const { error } = noteSchemaJoi.validate(req.body); // Valide les nouvelles données avec Joi
    if (error) {
      return res.status(400).json({ erreur: error.details[0].message }); // Si la validation échoue, retourne une erreur 400
    }
    const { titre, contenu } = req.body; // Récupère le titre et le contenu
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { titre, contenu },
      { new: true, runValidators: true }
    ); // Modifie la note dans la base
    if (!note) {
      return res.status(404).json({ erreur: 'Note non trouvée.' }); // Si la note n’existe pas, retourne une erreur 404
    }
    res.json({ message: 'Note modifiée avec succès', note }); // Retourne la note modifiée
  } catch (err) {
    next(err); // Passe l’erreur au middleware de gestion des erreurs
  }
});
```

#### Supprimer une note
```js
app.delete('/notes/:id', async (req, res, next) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id); // Supprime la note par son identifiant
    if (!note) {
      return res.status(404).json({ erreur: 'Note non trouvée.' }); // Si la note n’existe pas, retourne une erreur 404
    }
    res.json({ message: 'Note supprimée avec succès' }); // Retourne un message de succès
  } catch (err) {
    next(err); // Passe l’erreur au middleware de gestion des erreurs
  }
});
```

### Gestion des erreurs
```js
app.use((err, req, res, next) => {
  console.error('Erreur :', err.message); // Affiche l’erreur dans la console
  res.status(500).json({ erreur: 'Erreur serveur', details: err.message }); // Retourne une erreur 500 et le détail
});
```

### Route inconnue
```js
app.use((req, res) => {
  res.status(404).json({ erreur: 'Route inconnue' }); // Toute route non prévue retourne une erreur 404
});
```

### Démarrage du serveur
```js
app.listen(port, () => {
  console.log(`🚀 API Notes lancée sur http://localhost:${port}`); // Démarre le serveur et affiche le port
});
```

---

## Test de l’API avec Postman

- **POST /notes** : Ajoute une note (body JSON : `{ "titre": "Maths", "contenu": "Calcul intégral" }`)
- **GET /notes** : Affiche toutes les notes
- **GET /notes/:id** : Affiche une note précise
- **PUT /notes/:id** : Modifie une note
- **DELETE /notes/:id** : Supprime une note

## Validation des données
- Les champs sont vérifiés avec Joi avant chaque enregistrement ou modification.
- Les erreurs sont retournées en JSON avec un message explicite.

---

## Auteur
Projet généré avec GitHub Copilot.
