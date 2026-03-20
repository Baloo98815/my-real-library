/**
 * Tests unitaires — src/database/database.js
 *
 * On teste toutes les opérations CRUD ainsi que les filtres avancés.
 * La base SQLite est remplacée par le mock en mémoire (__mocks__/expo-sqlite.js).
 */

import * as SQLite from 'expo-sqlite';
import {
  initDatabase,
  getAllBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  searchBooks,
  filterBooks,
  lendBook,
  returnBook,
  updateReadingStatus,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveWishlistToLibrary,
  isInWishlist,
} from '../../src/database/database';

// ─── Données de test ─────────────────────────────────────────────────────────
const BOOK_SAMPLE = {
  isbn:           '9782070360024',
  title:          'Le Seigneur des Anneaux',
  author:         'J.R.R. Tolkien',
  publisher:      'Gallimard',
  published_date: '1954',
  description:    'Une épopée fantasy.',
  cover_url:      'https://example.com/cover.jpg',
  pages:          1200,
  language:       'fr',
  categories:     'Fantasy',
  genre:          'fantasy',
  reading_status: 'unread',
};

const BOOK_SAMPLE_2 = {
  title:          'Harry Potter',
  author:         'J.K. Rowling',
  genre:          'fantasy',
  published_date: '1997',
  reading_status: 'read',
};

// ─── Setup / teardown ─────────────────────────────────────────────────────────
beforeEach(async () => {
  // Réinitialise le mock et la DB avant chaque test
  SQLite.openDatabaseAsync.mockClear();
  await initDatabase();
});

// ─── initDatabase ─────────────────────────────────────────────────────────────
describe('initDatabase', () => {
  it('ouvre la base de données', async () => {
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('my-real-library.db');
  });

  it('crée les tables books et wishlist', async () => {
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    expect(db.execAsync).toHaveBeenCalled();
    const sqlCall = db.execAsync.mock.calls[0][0];
    expect(sqlCall).toContain('CREATE TABLE IF NOT EXISTS books');
    expect(sqlCall).toContain('CREATE TABLE IF NOT EXISTS wishlist');
  });
});

// ─── addBook / getAllBooks ────────────────────────────────────────────────────
describe('addBook + getAllBooks', () => {
  it('ajoute un livre et retourne un ID numérique', async () => {
    const id = await addBook(BOOK_SAMPLE);
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  it('retourne tous les livres ajoutés', async () => {
    await addBook(BOOK_SAMPLE);
    await addBook(BOOK_SAMPLE_2);
    const books = await getAllBooks();
    expect(books.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── getBookById ─────────────────────────────────────────────────────────────
describe('getBookById', () => {
  it('retourne le livre correspondant à l\'ID', async () => {
    const id = await addBook(BOOK_SAMPLE);
    const book = await getBookById(id);
    expect(book).not.toBeNull();
    expect(book.id).toBe(id);
  });

  it('retourne null pour un ID inexistant', async () => {
    const book = await getBookById(99999);
    expect(book).toBeNull();
  });
});

// ─── updateBook ──────────────────────────────────────────────────────────────
describe('updateBook', () => {
  it('appelle runAsync avec les bons paramètres', async () => {
    const id  = await addBook(BOOK_SAMPLE);
    const db  = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.runAsync.mockClear();

    await updateBook(id, { title: 'Nouveau titre' });

    expect(db.runAsync).toHaveBeenCalled();
    const [sql, params] = db.runAsync.mock.calls[0];
    expect(sql).toContain('UPDATE books SET');
    expect(params).toContain('Nouveau titre');
    expect(params).toContain(id);
  });

  it('ne fait rien si updates est vide', async () => {
    const id = await addBook(BOOK_SAMPLE);
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.runAsync.mockClear();
    await updateBook(id, {});
    expect(db.runAsync).not.toHaveBeenCalled();
  });
});

// ─── deleteBook ──────────────────────────────────────────────────────────────
describe('deleteBook', () => {
  it('appelle runAsync avec DELETE et l\'ID', async () => {
    const id = await addBook(BOOK_SAMPLE);
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.runAsync.mockClear();

    await deleteBook(id);

    const [sql, params] = db.runAsync.mock.calls[0];
    expect(sql).toContain('DELETE FROM books');
    expect(params).toContain(id);
  });
});

// ─── searchBooks ─────────────────────────────────────────────────────────────
describe('searchBooks', () => {
  it('construit la requête avec le bon pattern LIKE', async () => {
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.getAllAsync.mockClear();

    await searchBooks('tolkien');

    expect(db.getAllAsync).toHaveBeenCalled();
    const [sql, params] = db.getAllAsync.mock.calls[0];
    expect(sql).toContain('LIKE');
    expect(params).toContain('%tolkien%');
  });

  it('ajoute le filtre reading_status si fourni', async () => {
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.getAllAsync.mockClear();

    await searchBooks('', { reading_status: 'read' });

    const [sql, params] = db.getAllAsync.mock.calls[0];
    expect(sql).toContain('reading_status = ?');
    expect(params).toContain('read');
  });

  it('ajoute le filtre genre si fourni', async () => {
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.getAllAsync.mockClear();

    await searchBooks('', { genre: 'fantasy' });

    const [sql, params] = db.getAllAsync.mock.calls[0];
    expect(sql).toContain('genre = ?');
    expect(params).toContain('fantasy');
  });

  it('ajoute les filtres de date si fournis', async () => {
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.getAllAsync.mockClear();

    await searchBooks('', { date_from: 1980, date_to: 1999 });

    const [sql, params] = db.getAllAsync.mock.calls[0];
    expect(sql).toContain('CAST(SUBSTR(published_date');
    expect(params).toContain(1980);
    expect(params).toContain(1999);
  });
});

// ─── filterBooks ─────────────────────────────────────────────────────────────
describe('filterBooks', () => {
  it('filtre les livres prêtés', async () => {
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.getAllAsync.mockClear();

    await filterBooks({ lent: true });

    const [sql] = db.getAllAsync.mock.calls[0];
    expect(sql).toContain('lent_to IS NOT NULL');
  });

  it('filtre les livres disponibles', async () => {
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.getAllAsync.mockClear();

    await filterBooks({ lent: false });

    const [sql] = db.getAllAsync.mock.calls[0];
    expect(sql).toContain('lent_to IS NULL');
  });
});

// ─── lendBook / returnBook ───────────────────────────────────────────────────
describe('lendBook / returnBook', () => {
  it('lendBook met à jour lent_to', async () => {
    const id = await addBook(BOOK_SAMPLE);
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.runAsync.mockClear();

    await lendBook(id, 'Marie Dupont');

    const [sql, params] = db.runAsync.mock.calls[0];
    expect(sql).toContain('lent_to = ?');
    expect(params).toContain('Marie Dupont');
    expect(params).toContain(id);
  });

  it('returnBook remet lent_to à NULL', async () => {
    const id = await addBook(BOOK_SAMPLE);
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.runAsync.mockClear();

    await returnBook(id);

    const [sql, params] = db.runAsync.mock.calls[0];
    expect(sql).toContain('lent_to = NULL');
    expect(params).toContain(id);
  });
});

// ─── updateReadingStatus ─────────────────────────────────────────────────────
describe('updateReadingStatus', () => {
  it.each(['unread', 'reading', 'read'])('accepte le statut "%s"', async (status) => {
    const id = await addBook(BOOK_SAMPLE);
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.runAsync.mockClear();

    await updateReadingStatus(id, status);

    const [sql, params] = db.runAsync.mock.calls[0];
    expect(sql).toContain('reading_status = ?');
    expect(params).toContain(status);
  });
});

// ─── Wishlist ─────────────────────────────────────────────────────────────────
describe('Wishlist', () => {
  const WISH_ITEM = {
    isbn:  '9782070360024',
    title: 'Dune',
    author: 'Frank Herbert',
    genre: 'scifi',
  };

  it('addToWishlist retourne un ID numérique', async () => {
    const id = await addToWishlist(WISH_ITEM);
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  it('getWishlist retourne les items', async () => {
    await addToWishlist(WISH_ITEM);
    const items = await getWishlist();
    expect(Array.isArray(items)).toBe(true);
  });

  it('removeFromWishlist appelle DELETE', async () => {
    const id = await addToWishlist(WISH_ITEM);
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.runAsync.mockClear();

    await removeFromWishlist(id);

    const [sql, params] = db.runAsync.mock.calls[0];
    expect(sql).toContain('DELETE FROM wishlist');
    expect(params).toContain(id);
  });

  it('isInWishlist cherche par titre', async () => {
    const db = await SQLite.openDatabaseAsync.mock.results[0].value;
    db.getFirstAsync.mockClear();

    await isInWishlist('Dune');

    const [sql, params] = db.getFirstAsync.mock.calls[0];
    expect(sql).toContain('SELECT id FROM wishlist');
    expect(params).toContain('Dune');
  });
});
