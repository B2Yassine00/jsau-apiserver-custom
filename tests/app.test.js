const request = require('supertest');
const { promises: fs } = require('fs');
const { join } = require('path');
const app = require('../src/app.js');

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
  },
}));

describe('API Server Tests', () => {
  const favoritesJson = join(__dirname, '../favorites.json');
  const htmlDirectory = join(__dirname, '../html_files');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/info', () => {
    it('should return the server version info', async () => {
      const res = await request(app).get('/info');
      expect(res.statusCode).toBe(200);
      expect(res.text).toBe('jsau-apiserver-1.0.0');
    });
  });

  describe('/search', () => {
    it('should return all documents when no query is provided', async () => {
      const mockData = JSON.stringify([{ id: 1, name: 'Document1' }]);
      fs.readFile.mockResolvedValue(mockData);

      const res = await request(app).get('/search');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(JSON.parse(mockData));
    });
  });

  describe('/recette/:id', () => {
    it('should return 400 for an invalid recette ID', async () => {
      const res = await request(app).get('/recette/invalid');
      expect(res.statusCode).toBe(400);
      expect(res.text).toBe('Invalid recette ID.');
    });

    it('should return 404 if the recette ID does not exist', async () => {
      const mockDocs = [{ id: 1, name: 'Document1' }];
      fs.readFile.mockResolvedValue(JSON.stringify(mockDocs));

      const res = await request(app).get('/recette/999');
      expect(res.statusCode).toBe(404);
      expect(res.text).toBe('Document not found.');
    });

    it('should return 404 if the HTML file for the recette is not found', async () => {
      const mockDocs = [{ id: 1, name: 'Document1', recette: 'recette1' }];
      fs.readFile.mockResolvedValue(JSON.stringify(mockDocs));
      fs.access.mockRejectedValue(new Error('File not found'));

      const res = await request(app).get('/recette/1');
      expect(res.statusCode).toBe(404);
      expect(res.text).toBe('HTML file not found for the provided document.');
    });
  });

  describe('POST /favorites', () => {
    it('should return 400 if filename is missing', async () => {
      const res = await request(app)
        .post('/favorites')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Filename is required.');
    });

  });

  describe('GET /favorites', () => {
    it('should return 404 if no favorites are found', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify([]));

      const res = await request(app).get('/favorites');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('No favorites found.');
    });

    it('should return the list of favorites', async () => {
      const mockFavorites = [{ id: 1, recetteFile: 'file1.html' }];
      fs.readFile.mockResolvedValue(JSON.stringify(mockFavorites));

      const res = await request(app).get('/favorites');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockFavorites);
    });
  });

  describe('DELETE /favorites', () => {
    it('should return 400 if filename is missing', async () => {
      const res = await request(app)
        .delete('/favorites')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Filename is required.');
    });

    it('should return 404 if the favorite is not found', async () => {
      const mockFavorites = [{ id: 1, recetteFile: 'file1.html' }];
      fs.readFile.mockResolvedValue(JSON.stringify(mockFavorites));

      const res = await request(app)
        .delete('/favorites')
        .send({ filename: 'nonexistent.html' });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Favorite not found.');
    });

  });
});
