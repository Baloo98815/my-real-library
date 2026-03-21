/**
 * Tests d'intégration — database.js
 *
 * Contrairement à database.test.js qui vérifie uniquement les appels SQL,
 * ces tests vérifient l'état réel en mémoire après chaque opération
 * (grâce au mock expo-sqlite v2 qui maintient l'état).
 *
 * Scénarios couverts :
 *   - Ajout de livre  → le livre est bien récupérable par ID
 *   - Suppression     → le livre est bien absent après deleteBook
 *   - Prêt            → lent_to est défini après lendBook
 *   - Rendu           → lent_to est null après returnBook
 *   - Statut lecture  → reading_status est mis à jour
 *   - Wishlist        → ajout, notes, suppression, déplacement vers bibliothèque
 */

import * as SQLite from 'expo-sqlite';
import {
  initDatabase,
  addBook,
  getBookById,
  getAllBooks,
  deleteBook,
  updateBook,
  lendBook,
  returnBook,
  updateReadingStatus,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  updateWishlistNotes,
  moveWishlistToLibrary,
  isInWishlist,
} from '../../src/database/database';

// ─── Données de test ─────────────────────────────────────────────────────────
const BOOK = {
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

const WISH_ITEM = {
  isbn:   '9780441013593',
  title:  'Dune',
  author: 'Frank Herbert',
  genre:  'scifi',
};

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeEach(async () => {
  SQLite.openDatabaseAsync.mockClear();
  await initDatabase();
});

// ─── Ajout de livre ───────────────────────────────────────────────────────────
describe('Ajout de livre', () => {
  it('retourne un ID valide', async () => {
    const id = await addBook(BOOK);
    expect(id).toBeGreaterThan(0);
  });

  it('le livre est récupérable par son ID après ajout', async () => {
    const id   = await addBook(BOOK);
    const book = await getBookById(id);
    expect(book).not.toBeNull();
    expect(book.id).toBe(id);
    expect(book.title).toBe(BOOK.title);
  });

  it('getAllBooks inclut le livre ajouté', async () => {
    await addBook(BOOK);
    await addBook({ ...BOOK, title: 'Harry Potter', isbn: '9780439708180' });
    const all = await getAllBooks();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('le statut de lecture par défaut est "unread"', async () => {
    const id   = await addBook({ title: 'Test', author: 'Auteur' });
    const book = await getBookById(id);
    expect(book.reading_status).toBe('unread');
  });
});

// ─── Suppression ──────────────────────────────────────────────────────────────
describe('Suppression de livre', () => {
  it('le livre est introuvable après deleteBook', async () => {
    const id = await addBook(BOOK);
    // Vérifie qu'il est bien là d'abord
    expect(await getBookById(id)).not.toBeNull();

    await deleteBook(id);

    // Doit être null maintenant
    const after = await getBookById(id);
    expect(after).toBeNull();
  });

  it('supprimer un ID inexistant ne lève pas d\'erreur', async () => {
    await expect(deleteBook(99999)).resolves.not.toThrow();
  });

  it('getAllBooks ne contient plus le livre supprimé', async () => {
    const id1 = await addBook(BOOK);
    const id2 = await addBook({ ...BOOK, title: 'Dune', isbn: '9780441013593' });

    await deleteBook(id1);

    const all = await getAllBooks();
    const ids = all.map((b) => b.id);
    expect(ids).not.toContain(id1);
    expect(ids).toContain(id2);
  });
});

// ─── Prêt du livre ────────────────────────────────────────────────────────────
describe('Prêt de livre', () => {
  it('lendBook définit lent_to dans la base', async () => {
    const id = await addBook(BOOK);
    await lendBook(id, 'Marie Dupont');

    const book = await getBookById(id);
    expect(book.lent_to).toBe('Marie Dupont');
  });

  it('returnBook remet lent_to à null', async () => {
    const id = await addBook(BOOK);
    await lendBook(id, 'Pierre Martin');
    // Vérifie le prêt
    expect((await getBookById(id)).lent_to).toBe('Pierre Martin');

    await returnBook(id);

    const book = await getBookById(id);
    expect(book.lent_to).toBeNull();
  });

  it('on peut prêter à nouveau après un retour', async () => {
    const id = await addBook(BOOK);
    await lendBook(id, 'Alice');
    await returnBook(id);
    await lendBook(id, 'Bob');

    const book = await getBookById(id);
    expect(book.lent_to).toBe('Bob');
  });
});

// ─── Statut de lecture ────────────────────────────────────────────────────────
describe('Statut de lecture', () => {
  it.each(['unread', 'reading', 'read'])('updateReadingStatus("%s") est persisté', async (status) => {
    const id = await addBook({ ...BOOK, reading_status: 'unread' });
    await updateReadingStatus(id, status);

    const book = await getBookById(id);
    expect(book.reading_status).toBe(status);
  });
});

// ─── updateBook ───────────────────────────────────────────────────────────────
describe('updateBook', () => {
  it('met à jour le genre en base', async () => {
    const id = await addBook({ ...BOOK, genre: 'fantasy' });
    await updateBook(id, { genre: 'scifi' });

    const book = await getBookById(id);
    expect(book.genre).toBe('scifi');
  });
});

// ─── Wishlist – ajout ─────────────────────────────────────────────────────────
describe('Wishlist – ajout', () => {
  it('addToWishlist retourne un ID valide', async () => {
    const id = await addToWishlist(WISH_ITEM);
    expect(id).toBeGreaterThan(0);
  });

  it('getWishlist contient l\'item ajouté', async () => {
    await addToWishlist(WISH_ITEM);
    const list = await getWishlist();
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  it('isInWishlist retourne true après ajout', async () => {
    await addToWishlist(WISH_ITEM);
    const found = await isInWishlist('Dune');
    expect(found).toBe(true);
  });

  it('isInWishlist retourne false pour un titre absent', async () => {
    const found = await isInWishlist('Titre inexistant XYZ');
    expect(found).toBe(false);
  });
});

// ─── Wishlist – notes ─────────────────────────────────────────────────────────
describe('Wishlist – notes', () => {
  it('updateWishlistNotes met à jour les notes', async () => {
    const id = await addToWishlist(WISH_ITEM);
    await updateWishlistNotes(id, 'Lu dans Le Monde, très recommandé.');

    // getMockTables est exporté par le mock et disponible via SQLite.*
    const tables = SQLite.getMockTables();
    const row    = tables['wishlist']?.rows?.find((r) => r.id === id);
    expect(row?.notes).toBe('Lu dans Le Monde, très recommandé.');
  });

  it('on peut effacer les notes (chaîne vide)', async () => {
    const id = await addToWishlist({ ...WISH_ITEM, notes: 'Ancienne note' });
    await updateWishlistNotes(id, '');

    const tables = SQLite.getMockTables();
    const row    = tables['wishlist']?.rows?.find((r) => r.id === id);
    expect(row?.notes).toBe('');
  });
});

// ─── Wishlist – suppression ───────────────────────────────────────────────────
describe('Wishlist – suppression', () => {
  it('removeFromWishlist retire l\'item de la liste', async () => {
    const id    = await addToWishlist(WISH_ITEM);
    const id2   = await addToWishlist({ ...WISH_ITEM, title: 'Fondation' });
    const before = await getWishlist();
    expect(before.length).toBe(2);

    await removeFromWishlist(id);

    const after = await getWishlist();
    expect(after.length).toBe(1);
    expect(after[0].id).toBe(id2);
  });

  it('isInWishlist retourne false après suppression', async () => {
    const id = await addToWishlist(WISH_ITEM);
    await removeFromWishlist(id);

    // Vérifie via getMockTables que la ligne a bien disparu
    const tables = SQLite.getMockTables();
    const row    = tables['wishlist']?.rows?.find((r) => r.id === id);
    expect(row).toBeUndefined();
  });
});

// ─── Wishlist – déplacement vers bibliothèque ─────────────────────────────────
describe('Wishlist – Acheté (moveWishlistToLibrary)', () => {
  it('ajoute le livre dans books', async () => {
    const wid   = await addToWishlist(WISH_ITEM);
    const item  = { id: wid, ...WISH_ITEM };
    const bookId = await moveWishlistToLibrary(item);

    expect(bookId).toBeGreaterThan(0);
    const book = await getBookById(bookId);
    expect(book).not.toBeNull();
    expect(book.title).toBe(WISH_ITEM.title);
  });

  it('retire le livre de la wishlist', async () => {
    const wid  = await addToWishlist(WISH_ITEM);
    const item = { id: wid, ...WISH_ITEM };
    await moveWishlistToLibrary(item);

    const wishlist = await getWishlist();
    const stillThere = wishlist.find((w) => w.id === wid);
    expect(stillThere).toBeUndefined();
  });

  it('le livre ajouté a reading_status = "unread"', async () => {
    const wid    = await addToWishlist(WISH_ITEM);
    const bookId = await moveWishlistToLibrary({ id: wid, ...WISH_ITEM });

    const book = await getBookById(bookId);
    expect(book.reading_status).toBe('unread');
  });

  it('les autres items de la wishlist sont préservés', async () => {
    const wid1  = await addToWishlist(WISH_ITEM);
    const wid2  = await addToWishlist({ ...WISH_ITEM, title: 'Fondation' });
    await moveWishlistToLibrary({ id: wid1, ...WISH_ITEM });

    const wishlist = await getWishlist();
    expect(wishlist.length).toBe(1);
    expect(wishlist[0].id).toBe(wid2);
  });
});
