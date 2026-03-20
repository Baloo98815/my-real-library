/**
 * Tests unitaires — src/services/bookApi.js
 *
 * On mock fetch() globalement pour simuler les réponses des APIs
 * OpenLibrary et Google Books sans faire de vraies requêtes réseau.
 */

import { searchByCode, searchByTitle } from '../../src/services/bookApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mockFetch = (response, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: jest.fn().mockResolvedValue(response),
  });
};

const mockFetchSequence = (...responses) => {
  let i = 0;
  global.fetch = jest.fn().mockImplementation(async () => {
    const resp = responses[i] ?? responses[responses.length - 1];
    i++;
    return {
      ok:   true,
      json: async () => resp,
    };
  });
};

// ─── Réponses mock OpenLibrary ────────────────────────────────────────────────
const OL_BY_ISBN_RESPONSE = {
  'ISBN:9782070360024': {
    title:    'Le Seigneur des Anneaux',
    authors:  [{ name: 'J.R.R. Tolkien' }],
    publishers:    [{ name: 'Gallimard' }],
    publish_date:  '1978',
    cover:         { large: 'https://covers.openlibrary.org/b/id/1234-L.jpg' },
    number_of_pages: 1200,
    languages:     [{ key: '/languages/fre' }],
    subjects:      [{ name: 'Fantasy' }, { name: 'Adventure' }],
  },
};

const OL_SEARCH_RESPONSE = {
  docs: [
    {
      title:       'Harry Potter',
      author_name: ['J.K. Rowling'],
      cover_i:     5678,
      isbn:        ['9780439708180'],
      first_publish_year: 1997,
      publisher:   ['Bloomsbury'],
    },
  ],
};

const GOOGLE_BOOKS_RESPONSE = {
  items: [
    {
      volumeInfo: {
        title:     'Dune',
        authors:   ['Frank Herbert'],
        publisher: 'Ace Books',
        publishedDate: '1965',
        description: 'Un chef-d\'œuvre de la SF.',
        pageCount:  412,
        language:   'en',
        categories: ['Science Fiction'],
        industryIdentifiers: [
          { type: 'ISBN_13', identifier: '9780441013593' },
        ],
        imageLinks: {
          thumbnail: 'http://books.google.com/cover.jpg',
        },
      },
    },
  ],
};

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
});

// ─── searchByCode ─────────────────────────────────────────────────────────────
describe('searchByCode', () => {
  describe('avec un ISBN-13 valide', () => {
    it('retourne les infos via OpenLibrary', async () => {
      mockFetch(OL_BY_ISBN_RESPONSE);

      const result = await searchByCode('9782070360024');

      expect(result).not.toBeNull();
      expect(result.title).toBe('Le Seigneur des Anneaux');
      expect(result.author).toBe('J.R.R. Tolkien');
    });

    it('appelle l\'URL OpenLibrary avec le bon ISBN', async () => {
      mockFetch(OL_BY_ISBN_RESPONSE);

      await searchByCode('9782070360024');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('9782070360024')
      );
    });

    it('retourne la couverture quand elle est disponible', async () => {
      mockFetch(OL_BY_ISBN_RESPONSE);

      const result = await searchByCode('9782070360024');

      expect(result.cover_url).toContain('covers.openlibrary.org');
    });

    it('retourne le nombre de pages', async () => {
      mockFetch(OL_BY_ISBN_RESPONSE);
      const result = await searchByCode('9782070360024');
      expect(result.pages).toBe(1200);
    });

    it('retourne les catégories', async () => {
      mockFetch(OL_BY_ISBN_RESPONSE);
      const result = await searchByCode('9782070360024');
      expect(result.categories).toContain('Fantasy');
    });
  });

  describe('fallback Google Books', () => {
    it('bascule sur Google Books si OpenLibrary ne retourne rien', async () => {
      mockFetchSequence(
        {},              // OpenLibrary ne trouve rien
        GOOGLE_BOOKS_RESPONSE  // Google Books trouve
      );

      const result = await searchByCode('9780441013593');

      expect(result).not.toBeNull();
      expect(result.title).toBe('Dune');
      expect(result.author).toBe('Frank Herbert');
    });

    it('convertit http en https pour l\'image Google Books', async () => {
      mockFetchSequence({}, GOOGLE_BOOKS_RESPONSE);

      const result = await searchByCode('9780441013593');

      expect(result.cover_url).toMatch(/^https/);
    });
  });

  describe('gestion des erreurs réseau', () => {
    it('retourne null si fetch échoue complètement', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await searchByCode('9782070360024');

      expect(result).toBeNull();
    });
  });

  describe('détection du type de code', () => {
    it('traite un ISBN-13 (13 chiffres)', async () => {
      mockFetch(OL_BY_ISBN_RESPONSE);
      const result = await searchByCode('9782070360024');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('ignore les tirets dans le code', async () => {
      mockFetch(OL_BY_ISBN_RESPONSE);
      await searchByCode('978-2-07-036002-4');
      const url = global.fetch.mock.calls[0][0];
      expect(url).toContain('9782070360024');
    });
  });
});

// ─── searchByTitle ────────────────────────────────────────────────────────────
describe('searchByTitle', () => {
  it('retourne un tableau de résultats', async () => {
    mockFetch(OL_SEARCH_RESPONSE);

    const results = await searchByTitle('Harry Potter');

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('retourne les bons titres et auteurs', async () => {
    mockFetch(OL_SEARCH_RESPONSE);

    const results = await searchByTitle('Harry Potter');
    const first = results[0];

    expect(first.title).toBe('Harry Potter');
    expect(first.author).toBe('J.K. Rowling');
  });

  it('construit l\'URL de couverture à partir du cover_i', async () => {
    mockFetch(OL_SEARCH_RESPONSE);

    const results = await searchByTitle('Harry Potter');
    const first = results[0];

    expect(first.cover_url).toContain('5678');
  });

  it('retourne un tableau vide si la query est trop courte', async () => {
    const results = await searchByTitle('a');
    expect(results).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('retourne un tableau vide si la query est vide', async () => {
    const results = await searchByTitle('');
    expect(results).toEqual([]);
  });

  it('bascule sur Google Books si OpenLibrary retourne 0 résultats', async () => {
    mockFetchSequence(
      { docs: [] },        // OpenLibrary vide
      GOOGLE_BOOKS_RESPONSE   // Google Books OK
    );

    const results = await searchByTitle('Dune');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe('Dune');
  });

  it('retourne un tableau vide si toutes les APIs échouent', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const results = await searchByTitle('Test');

    expect(results).toEqual([]);
  });
});
