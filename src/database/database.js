import * as SQLite from 'expo-sqlite';
import logger from '../utils/logger';

let db = null;

// ─── Initialisation ────────────────────────────────────────────────────────────
export const initDatabase = async () => {
  logger.info('initDatabase: ouverture de la base');
  db = await SQLite.openDatabaseAsync('my-real-library.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS books (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn            TEXT,
      ean             TEXT,
      issn            TEXT,
      asin            TEXT,
      upc             TEXT,
      title           TEXT NOT NULL,
      author          TEXT,
      publisher       TEXT,
      published_date  TEXT,
      description     TEXT,
      cover_url       TEXT,
      pages           INTEGER,
      language        TEXT,
      categories      TEXT,
      genre           TEXT,
      reading_status  TEXT DEFAULT 'unread',
      lent_to         TEXT,
      added_date      TEXT DEFAULT (datetime('now')),
      updated_date    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn            TEXT,
      title           TEXT NOT NULL,
      author          TEXT,
      publisher       TEXT,
      published_date  TEXT,
      cover_url       TEXT,
      genre           TEXT,
      description     TEXT,
      notes           TEXT,
      added_date      TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migration silencieuse : ajouter les colonnes si une ancienne version de la DB existe
  await db.execAsync(`ALTER TABLE books ADD COLUMN genre TEXT;`).catch(() => {});

  logger.info('initDatabase: base initialisée avec succès');
  return db;
};

export const getDatabase = () => db;

// ─── Helpers de filtrage ──────────────────────────────────────────────────────
const applyFilters = (sql, params, filters = {}) => {
  if (filters.reading_status) {
    sql += ' AND reading_status = ?';
    params.push(filters.reading_status);
  }
  if (filters.genre) {
    sql += ' AND genre = ?';
    params.push(filters.genre);
  }
  if (filters.lent === true) {
    sql += ' AND lent_to IS NOT NULL AND lent_to != ""';
  } else if (filters.lent === false) {
    sql += ' AND (lent_to IS NULL OR lent_to = "")';
  }
  if (filters.date_from != null) {
    sql += ' AND CAST(SUBSTR(published_date, 1, 4) AS INTEGER) >= ?';
    params.push(filters.date_from);
  }
  if (filters.date_to != null) {
    sql += ' AND CAST(SUBSTR(published_date, 1, 4) AS INTEGER) <= ?';
    params.push(filters.date_to);
  }
  return { sql, params };
};

// ─── Lecture ───────────────────────────────────────────────────────────────────
export const getAllBooks = async () => {
  return await db.getAllAsync('SELECT * FROM books ORDER BY title ASC');
};

export const getBookById = async (id) => {
  return await db.getFirstAsync('SELECT * FROM books WHERE id = ?', [id]);
};

export const searchBooks = async (query, filters = {}) => {
  let sql = 'SELECT * FROM books WHERE (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR genre LIKE ?)';
  let params = [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`];
  ({ sql, params } = applyFilters(sql, params, filters));
  sql += ' ORDER BY title ASC';
  return await db.getAllAsync(sql, params);
};

export const filterBooks = async (filters = {}) => {
  let sql = 'SELECT * FROM books WHERE 1=1';
  let params = [];
  ({ sql, params } = applyFilters(sql, params, filters));
  sql += ' ORDER BY title ASC';
  return await db.getAllAsync(sql, params);
};

// ─── Écriture ──────────────────────────────────────────────────────────────────
export const addBook = async (book) => {
  logger.info('addBook', { title: book.title });
  const result = await db.runAsync(
    `INSERT INTO books
      (isbn, ean, issn, asin, upc, title, author, publisher,
       published_date, description, cover_url, pages, language,
       categories, genre, reading_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      book.isbn           || null,
      book.ean            || null,
      book.issn           || null,
      book.asin           || null,
      book.upc            || null,
      book.title,
      book.author         || null,
      book.publisher      || null,
      book.published_date || null,
      book.description    || null,
      book.cover_url      || null,
      book.pages          || null,
      book.language       || null,
      book.categories     || null,
      book.genre          || null,
      book.reading_status || 'unread',
    ]
  );
  return result.lastInsertRowId;
};

export const updateBook = async (id, updates) => {
  if (Object.keys(updates).length === 0) return;
  const fields = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  await db.runAsync(
    `UPDATE books SET ${fields}, updated_date = datetime('now') WHERE id = ?`,
    values
  );
};

export const deleteBook = async (id) => {
  logger.info('deleteBook', { id });
  await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
};

// ─── Prêt ──────────────────────────────────────────────────────────────────────
export const lendBook = async (id, personName) => {
  await db.runAsync(
    `UPDATE books SET lent_to = ?, updated_date = datetime('now') WHERE id = ?`,
    [personName, id]
  );
};

export const returnBook = async (id) => {
  await db.runAsync(
    `UPDATE books SET lent_to = NULL, updated_date = datetime('now') WHERE id = ?`,
    [id]
  );
};

// ─── Statut de lecture ────────────────────────────────────────────────────────
export const updateReadingStatus = async (id, status) => {
  await db.runAsync(
    `UPDATE books SET reading_status = ?, updated_date = datetime('now') WHERE id = ?`,
    [status, id]
  );
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const getWishlist = async () => {
  return await db.getAllAsync('SELECT * FROM wishlist ORDER BY added_date DESC');
};

export const addToWishlist = async (book) => {
  const result = await db.runAsync(
    `INSERT INTO wishlist
      (isbn, title, author, publisher, published_date, cover_url, genre, description, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      book.isbn           || null,
      book.title,
      book.author         || null,
      book.publisher      || null,
      book.published_date || null,
      book.cover_url      || null,
      book.genre          || null,
      book.description    || null,
      book.notes          || null,
    ]
  );
  return result.lastInsertRowId;
};

export const updateWishlistNotes = async (id, notes) => {
  await db.runAsync('UPDATE wishlist SET notes = ? WHERE id = ?', [notes, id]);
};

export const removeFromWishlist = async (id) => {
  await db.runAsync('DELETE FROM wishlist WHERE id = ?', [id]);
};

/**
 * Déplace un item de la wishlist vers la bibliothèque.
 * Retourne l'id du nouveau livre.
 */
export const moveWishlistToLibrary = async (wishlistItem) => {
  const bookId = await addBook({
    ...wishlistItem,
    reading_status: 'unread',
  });
  await removeFromWishlist(wishlistItem.id);
  return bookId;
};

export const isInWishlist = async (title) => {
  const row = await db.getFirstAsync(
    'SELECT id FROM wishlist WHERE title = ? COLLATE NOCASE',
    [title]
  );
  return row != null;
};
