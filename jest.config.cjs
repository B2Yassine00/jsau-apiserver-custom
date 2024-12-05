module.exports = {
    transform: {
        '^.+\\.js$': 'babel-jest', // Transpile les fichiers JS avec Babel
      },
      testEnvironment: 'node', // Utilise l'environnement Node.js pour les tests
      globals: {
        'ts-jest': {
          useBabelrc: true, // Si tu utilises Babel pour transpiler TypeScript
        },
      },
    collectCoverageFrom: [
        'src/*.js'
    ],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns : [
        '/src/server.js'
    ],
    coverageReporters: ['text', 'lcov'],
  };
  