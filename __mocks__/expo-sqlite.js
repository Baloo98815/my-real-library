// Mock d'expo-sqlite pour les tests unitaires
// Simule une base de données en mémoire avec la même API qu'expo-sqlite v14+
// v2 : le mock maintient réellement l'état en mémoire (INSERT stocke les colonnes,
//      UPDATE modifie les lignes, DELETE supprime les lignes) pour permettre des
//      tests d'intégration end-to-end.

let mockDatabase = null;
let mockTables = {};

// ─── Parseur SET clause ───────────────────────────────────────────────────────
// Exemple : "lent_to = ?, updated_date = datetime('now')"
// → { lent_to: params[0] }
const parseSetClause = (setClause, params) => {
  const updates = {};
  let paramIdx = 0;
  const parts = setClause.split(',');
  for (const part of parts) {
    const match = part.match(/(\w+)\s*=\s*(.+)/);
    if (!match) continue;
    const col = match[1].trim().toLowerCase();
    const val = match[2].trim();
    if (val === '?') {
      updates[col] = params[paramIdx++] ?? null;
    } else if (val.toUpperCase() === 'NULL') {
      updates[col] = null;
    }
    // datetime('now') et autres fonctions SQL → on ignore (pas de param)
  }
  return updates;
};

// ─── Factory de mock DB ───────────────────────────────────────────────────────
const createMockDb = () => {
  mockTables = {};

  return {
    execAsync: jest.fn(async (sql) => {
      // Crée les tables en mémoire à partir du CREATE TABLE
      const createMatches = sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/gi);
      for (const match of createMatches) {
        const tableName = match[1].toLowerCase();
        if (!mockTables[tableName]) {
          mockTables[tableName] = { rows: [], nextId: 1 };
        }
      }
    }),

    runAsync: jest.fn(async (sql, params = []) => {
      const sqlTrimmed = sql.trim();
      const sqlUpper   = sqlTrimmed.toUpperCase();

      // ── INSERT ──────────────────────────────────────────────────────────────
      if (sqlUpper.startsWith('INSERT')) {
        const tableMatch = sql.match(/INSERT INTO (\w+)\s*\(([^)]+)\)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          const columns   = tableMatch[2].split(',').map((c) => c.trim().toLowerCase());
          if (!mockTables[tableName]) mockTables[tableName] = { rows: [], nextId: 1 };
          const id  = mockTables[tableName].nextId++;
          const row = { id };
          columns.forEach((col, i) => { row[col] = params[i] ?? null; });
          mockTables[tableName].rows.push(row);
          return { lastInsertRowId: id, changes: 1 };
        }
      }

      // ── DELETE ──────────────────────────────────────────────────────────────
      if (sqlUpper.startsWith('DELETE')) {
        const tableMatch = sql.match(/DELETE FROM (\w+)\s+WHERE\s+(\w+)\s*=\s*\?/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          const whereCol  = tableMatch[2].toLowerCase();
          const whereVal  = params[0];
          const table     = mockTables[tableName];
          if (table) {
            const before = table.rows.length;
            table.rows   = table.rows.filter((r) => r[whereCol] !== whereVal);
            return { changes: before - table.rows.length };
          }
        }
        return { changes: 0 };
      }

      // ── UPDATE ──────────────────────────────────────────────────────────────
      if (sqlUpper.startsWith('UPDATE')) {
        // UPDATE table SET ... WHERE col = ?
        const tableMatch = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(\w+)\s*=\s*\?/i);
        if (tableMatch) {
          const tableName = tableMatch[1].toLowerCase();
          const setClause = tableMatch[2];
          const whereCol  = tableMatch[3].toLowerCase();
          const whereVal  = params[params.length - 1]; // dernier param = WHERE
          const table     = mockTables[tableName];
          if (table) {
            const row = table.rows.find((r) => r[whereCol] === whereVal);
            if (row) {
              // On passe tous les params sauf le dernier (WHERE)
              const setParams = params.slice(0, params.length - 1);
              const updates   = parseSetClause(setClause, setParams);
              Object.assign(row, updates);
            }
          }
        }
        return { changes: 1 };
      }

      return { changes: 0 };
    }),

    getAllAsync: jest.fn(async (sql, params = []) => {
      const tableMatch = sql.match(/FROM (\w+)/i);
      if (!tableMatch) return [];
      const tableName = tableMatch[1].toLowerCase();
      return mockTables[tableName]?.rows || [];
    }),

    getFirstAsync: jest.fn(async (sql, params = []) => {
      const tableMatch = sql.match(/FROM (\w+)/i);
      if (!tableMatch) return null;
      const tableName = tableMatch[1].toLowerCase();
      const rows      = mockTables[tableName]?.rows || [];

      // Parse la clause WHERE pour trouver la bonne colonne
      // Ex : "WHERE id = ?"  ou  "WHERE title = ? COLLATE NOCASE"
      const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
      if (whereMatch && params[0] !== undefined) {
        const whereCol = whereMatch[1].toLowerCase();
        const whereVal = params[0];
        return rows.find((r) => {
          const cellVal = r[whereCol];
          // Supporte COLLATE NOCASE (comme isInWishlist)
          if (typeof cellVal === 'string' && typeof whereVal === 'string') {
            return cellVal.toLowerCase() === whereVal.toLowerCase();
          }
          return cellVal === whereVal;
        }) ?? null;
      }

      return rows[0] ?? null;
    }),
  };
};

// ─── API publique du mock ─────────────────────────────────────────────────────
/** Réinitialise la DB entre les tests */
export const resetMockDatabase = () => {
  mockTables   = {};
  mockDatabase = createMockDb();
};

/** Accès direct aux tables en mémoire (pour les assertions d'intégration) */
export const getMockTables = () => mockTables;

export const openDatabaseAsync = jest.fn(async (name) => {
  mockDatabase = createMockDb();
  return mockDatabase;
});
