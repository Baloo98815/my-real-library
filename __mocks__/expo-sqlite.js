// Mock d'expo-sqlite pour les tests unitaires
// Simule une base de données en mémoire avec la même API qu'expo-sqlite v14+

let mockDatabase = null;
let mockTables = {};

const createMockDb = () => {
  mockTables = {};

  return {
    execAsync: jest.fn(async (sql) => {
      // Parse basique pour créer les tables en mémoire
      const createMatches = sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/gi);
      for (const match of createMatches) {
        const tableName = match[1];
        if (!mockTables[tableName]) {
          mockTables[tableName] = { rows: [], nextId: 1 };
        }
      }
    }),

    runAsync: jest.fn(async (sql, params = []) => {
      const sqlUpper = sql.trim().toUpperCase();

      if (sqlUpper.startsWith('INSERT')) {
        // Extraire le nom de la table
        const tableMatch = sql.match(/INSERT INTO (\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          if (!mockTables[tableName]) mockTables[tableName] = { rows: [], nextId: 1 };
          const id = mockTables[tableName].nextId++;
          const row = { id, _params: params };
          mockTables[tableName].rows.push(row);
          return { lastInsertRowId: id, changes: 1 };
        }
      }

      if (sqlUpper.startsWith('UPDATE')) {
        return { changes: 1 };
      }

      if (sqlUpper.startsWith('DELETE')) {
        return { changes: 1 };
      }

      return { changes: 0 };
    }),

    getAllAsync: jest.fn(async (sql, params = []) => {
      const tableMatch = sql.match(/FROM (\w+)/i);
      if (!tableMatch) return [];
      const tableName = tableMatch[1];
      return mockTables[tableName]?.rows || [];
    }),

    getFirstAsync: jest.fn(async (sql, params = []) => {
      const tableMatch = sql.match(/FROM (\w+)/i);
      if (!tableMatch) return null;
      const tableName = tableMatch[1];
      const rows = mockTables[tableName]?.rows || [];
      // Simuler WHERE id = ?
      const idParam = params[0];
      if (idParam !== undefined) {
        return rows.find((r) => r.id === idParam) || null;
      }
      return rows[0] || null;
    }),
  };
};

// Réinitialise la DB entre les tests
export const resetMockDatabase = () => {
  mockTables = {};
  mockDatabase = createMockDb();
};

export const getMockTables = () => mockTables;

export const openDatabaseAsync = jest.fn(async (name) => {
  mockDatabase = createMockDb();
  return mockDatabase;
});
