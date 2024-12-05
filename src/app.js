const express = require('express');
const morgan = require('morgan');
const { join } = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const htmlDirectory = join(__dirname, '/../html_files');
const recettesJson = join(__dirname, '../recettes.json');
const favoritesJson = join(__dirname, '/favorites.json');

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Autoriser uniquement votre frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Méthodes HTTP autorisées
  credentials: true // Si vous utilisez des cookies ou des authentifications
}));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(morgan('dev'));

// /info endpoint
app.get('/info', (req, res) => {
  res.send('jsau-apiserver-1.0.0');
});

// /search endpoint
app.get('/search', async (req, res) => {
  const recetteparam = req.query.recette;

  if (!recetteparam) {
    try {
      const data = await fs.readFile(recettesJson, 'utf-8');
      const recettes = JSON.parse(data);
      res.json(recettes);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.json([]);
      }
      console.error('Error parsing JSON data', err);
      res.status(500).json({ error: 'Error parsing JSON data.' });
    }
    return;
  }

  const filepath = join(htmlDirectory, `${recetteparam}.html`);
  try {
    await fs.access(filepath);
    res.sendFile(filepath);
  } catch (err) {
    console.error('File not found', err);
    res.status(404).send('File not Found');
  }
});

// /recette/:id endpoint
app.get('/recette/:id', async (req, res) => {
  try {
    const recetteId = parseInt(req.params.id, 10);
    if (isNaN(recetteId)) {
      return res.status(400).send('Invalid recette ID.');
    }

    const data = await fs.readFile(recettesJson, 'utf-8');
    const recettes = JSON.parse(data);
    const recette = recettes.find((u) => u.id === recetteId);

    if (!recette) {
      return res.status(404).send('Document not found.');
    }

    const filePath = join(
      htmlDirectory,
      `${recette.recette.replace(/\s+/g, '_').toLowerCase()}.html`
    );

    try {
      await fs.access(filePath);
      res.download(filePath);
    } catch (err) {
      console.error('HTML file not found for the document', err);
      res.status(404).send('HTML file not found for the provided document.');
    }
  } catch (err) {
    console.error('Internal server error', err);
    res.status(500).send('Internal server error.');
  }
});

// POST /favorites : Ajouter un favori basé sur le filename uniquement
app.post('/favorites', async (req, res) => {
  const { recetteFile } = req.body;

  if (!recetteFile) {
    return res.status(400).json({ error: 'Filename is required.' });
  }

  try {
    await fs.access(join(htmlDirectory, recetteFile), fs.constants.F_OK);

    const data = await fs.readFile(favoritesJson, 'utf-8');
    let favorites;
    try {
      favorites = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing favorites data', parseErr);
      return res.status(500).json({ error: 'Error parsing favorites data.' });
    }

    const exists = favorites.find((fav) => fav.filename === recetteFile);
    if (exists) {
      return res.status(409).json({ error: 'This favorite already exists.' });
    }

    const newFavorite = { id: favorites.length + 1, recetteFile };
    favorites.push(newFavorite);

    await fs.writeFile(favoritesJson, JSON.stringify(favorites, null, 2));

    res.status(201).json({ message: 'Favorite added successfully!' });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'File does not exist.' });
    }
    console.error('Error in adding favorite', err);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});

// GET /favorites : Récupérer tous les favoris
app.get('/favorites', async (req, res) => {
  try {
    const data = await fs.readFile(favoritesJson, 'utf-8');
    let favorites;
    try {
      favorites = JSON.parse(data);
    } catch (err) {
      console.error('Error parsing favorites data', err);
      return res.status(500).json({ error: 'Error parsing favorites data.' });
    }

    if (favorites.length === 0) {
      return res.status(404).json({ message: 'No favorites found.' });
    }

    res.json(favorites);
  } catch (err) {
    console.error('Error reading favorites file', err);
    res.status(500).json({ error: 'An error occurred while retrieving favorites.' });
  }
});

// DELETE /favorites : Supprimer un favori par filename
app.delete('/favorites', async (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: 'Filename is required.' });
  }

  try {
    const data = await fs.readFile(favoritesJson, 'utf-8');
    let favorites;
    try {
      favorites = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing favorites data', parseErr);
      return res.status(500).json({ error: 'Error parsing favorites data.' });
    }

    const index = favorites.findIndex((fav) => fav.recetteFile === filename);

    if (index === -1) {
      return res.status(404).json({ error: 'Favorite not found.' });
    }

    favorites.splice(index, 1);
    await fs.writeFile(favoritesJson, JSON.stringify(favorites, null, 2));

    res.status(200).json({ message: 'Favorite deleted successfully.' });
  } catch (err) {
    console.error('Error deleting favorite', err);
    res.status(500).json({ error: 'An error occurred while deleting the favorite.' });
  }
});

module.exports = app;
