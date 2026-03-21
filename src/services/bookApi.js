import logger from '../utils/logger';

// ─── Constantes ───────────────────────────────────────────────────────────────
const OPENLIBRARY_BASE  = 'https://openlibrary.org';
const COVERS_BASE       = 'https://covers.openlibrary.org/b';
const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1';

// ─── Mode debug API ───────────────────────────────────────────────────────────
/**
 * Activez DEBUG_API pour loguer les réponses brutes des APIs lors d'une recherche.
 * Utile pour diagnostiquer pourquoi un livre trouvé sur desktop ne l'est pas sur mobile.
 *
 * Par défaut : actif en mode développement (__DEV__).
 * Pour l'activer manuellement en production, passez à `true`.
 */
export const DEBUG_API = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

/**
 * Logue une réponse API brute (URL + JSON) si le mode debug est actif.
 * N'a aucun effet en production (DEBUG_API = false).
 */
const debugLog = (label, url, data) => {
  if (!DEBUG_API) return;
  logger.debug(`[API DEBUG] ${label}`, { url, response: data });
  // Aussi en console pour un accès rapide dans Metro / Expo Go
  console.log(`\n🔍 [API DEBUG] ${label}`);
  console.log(`   URL     : ${url}`);
  console.log(`   Réponse :`, JSON.stringify(data, null, 2).substring(0, 2000));
};

// ─── Recherche par code ───────────────────────────────────────────────────────
/**
 * Cherche un livre à partir de n'importe quel code
 * (ISBN-10, ISBN-13, EAN, ASIN, UPC, ISSN)
 */
export const searchByCode = async (code) => {
  const cleaned = code.replace(/[-\s]/g, '');
  logger.info('[bookApi] searchByCode', { code: cleaned });

  // Détermine le type de code
  const codeType = detectCodeType(cleaned);

  try {
    // 1. OpenLibrary par ISBN
    if (codeType === 'isbn' || codeType === 'ean') {
      const result = await fetchOpenLibraryByISBN(cleaned);
      if (result) return { ...result, [codeType]: cleaned };
    }

    // 2. Google Books (supporte ISBN, EAN, ASIN, UPC)
    const googleResult = await fetchGoogleBooks(`isbn:${cleaned}`);
    if (googleResult) return { ...googleResult, [codeType]: cleaned };

    // 3. Recherche générale OpenLibrary
    const olResult = await fetchOpenLibrarySearch(cleaned);
    if (olResult) return { ...olResult, [codeType]: cleaned };

    return null;
  } catch (error) {
    logger.error('[bookApi] searchByCode', error);
    return null;
  }
};

// ─── Recherche par titre ───────────────────────────────────────────────────────
/**
 * Retourne une liste de suggestions de livres
 */
export const searchByTitle = async (title) => {
  if (!title || title.trim().length < 2) return [];

  try {
    const encoded = encodeURIComponent(title.trim());
    const url = `${OPENLIBRARY_BASE}/search.json?title=${encoded}&limit=10&fields=key,title,author_name,cover_i,isbn,first_publish_year,publisher,number_of_pages_median,language`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('OpenLibrary search failed');
    const data = await response.json();
    debugLog('OpenLibrary Title Search', url, data);

    if (!data.docs || data.docs.length === 0) {
      // Fallback Google Books
      return await searchGoogleBooksByTitle(title);
    }

    return data.docs.map(parseOpenLibrarySearchDoc);
  } catch (error) {
    logger.error('[bookApi] searchByTitle', error);
    return [];
  }
};

// ─── OpenLibrary ───────────────────────────────────────────────────────────────
const fetchOpenLibraryByISBN = async (isbn) => {
  const url = `${OPENLIBRARY_BASE}/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    debugLog('OpenLibrary ISBN', url, data);
    const bookData = data[`ISBN:${isbn}`];
    if (!bookData) return null;
    return parseOpenLibraryBookData(bookData, isbn);
  } catch {
    return null;
  }
};

const fetchOpenLibrarySearch = async (query) => {
  const url = `${OPENLIBRARY_BASE}/search.json?q=${encodeURIComponent(query)}&limit=1`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    debugLog('OpenLibrary Search', url, data);
    if (!data.docs || data.docs.length === 0) return null;
    return parseOpenLibrarySearchDoc(data.docs[0]);
  } catch {
    return null;
  }
};

const parseOpenLibraryBookData = (data, isbn) => {
  const coverId = data.cover?.large || data.cover?.medium || data.cover?.small;
  return {
    isbn,
    title:          data.title || '',
    author:         data.authors?.map((a) => a.name).join(', ') || '',
    publisher:      data.publishers?.[0]?.name || '',
    published_date: data.publish_date || '',
    description:    data.notes?.value || data.excerpts?.[0]?.text || '',
    cover_url:      coverId || null,
    pages:          data.number_of_pages || null,
    language:       data.languages?.[0]?.key?.replace('/languages/', '') || '',
    categories:     data.subjects?.slice(0, 5).map((s) => (typeof s === 'string' ? s : s.name)).join(', ') || '',
  };
};

const parseOpenLibrarySearchDoc = (doc) => {
  const coverId = doc.cover_i;
  const cover_url = coverId ? `${COVERS_BASE}/id/${coverId}-L.jpg` : null;
  return {
    isbn:           doc.isbn?.[0] || '',
    title:          doc.title || '',
    author:         doc.author_name?.join(', ') || '',
    publisher:      doc.publisher?.[0] || '',
    published_date: doc.first_publish_year?.toString() || '',
    description:    '',
    cover_url,
    pages:          doc.number_of_pages_median || null,
    language:       doc.language?.[0] || '',
    categories:     '',
  };
};

// ─── Google Books ──────────────────────────────────────────────────────────────
const fetchGoogleBooks = async (query) => {
  const url = `${GOOGLE_BOOKS_BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    debugLog('Google Books', url, data);
    if (!data.items || data.items.length === 0) return null;
    return parseGoogleBook(data.items[0]);
  } catch {
    return null;
  }
};

const searchGoogleBooksByTitle = async (title) => {
  const url = `${GOOGLE_BOOKS_BASE}/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=8`;
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    debugLog('Google Books (title)', url, data);
    if (!data.items) return [];
    return data.items.map(parseGoogleBook);
  } catch {
    return [];
  }
};

const parseGoogleBook = (item) => {
  const info = item.volumeInfo || {};
  const isbn13 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier;
  const isbn10 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_10')?.identifier;
  const thumbnail = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
  return {
    isbn:           isbn13 || isbn10 || '',
    title:          info.title || '',
    author:         info.authors?.join(', ') || '',
    publisher:      info.publisher || '',
    published_date: info.publishedDate || '',
    description:    info.description || '',
    cover_url:      thumbnail ? thumbnail.replace('http:', 'https:') : null,
    pages:          info.pageCount || null,
    language:       info.language || '',
    categories:     info.categories?.join(', ') || '',
  };
};

// ─── Utilitaires ──────────────────────────────────────────────────────────────
const detectCodeType = (code) => {
  if (/^\d{13}$/.test(code))          return 'isbn'; // ISBN-13 / EAN-13
  if (/^\d{10}$/.test(code))          return 'isbn'; // ISBN-10
  if (/^\d{12}$/.test(code))          return 'upc';  // UPC-A
  if (/^[A-Z0-9]{10}$/.test(code))    return 'asin'; // ASIN (Amazon)
  if (/^\d{8}$/.test(code))           return 'issn';
  return 'isbn'; // défaut
};
