/**
 * Logger — My Real Library
 *
 * Écrit des logs horodatés à la fois dans la console et dans un fichier
 * persistant sur l'appareil : DocumentDirectory/app.log
 *
 * Usage :
 *   import logger from '../utils/logger';
 *   logger.info('Livre ajouté', { id: 3, title: 'Dune' });
 *   logger.warn('Couverture introuvable', { isbn: '...' });
 *   logger.error('Erreur SQLite', error);
 *
 * Lire le fichier de log depuis l'app :
 *   const content = await logger.readLog();
 *
 * Vider le fichier :
 *   await logger.clearLog();
 */

import * as FileSystem from 'expo-file-system';

// ─── Config ────────────────────────────────────────────────────────────────────
const LOG_FILE    = FileSystem.documentDirectory + 'app.log';
const MAX_LINES   = 2000;   // on tronque au-delà pour ne pas grossir indéfiniment
const LEVELS      = { DEBUG: 'DEBUG', INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timestamp = () => new Date().toISOString().replace('T', ' ').replace('Z', '');

const serialize = (data) => {
  if (data === undefined || data === null) return '';
  if (data instanceof Error) return ` | ${data.message}${data.stack ? '\n' + data.stack : ''}`;
  if (typeof data === 'object') {
    try { return ' | ' + JSON.stringify(data); } catch { return ' | [object]'; }
  }
  return ' | ' + String(data);
};

// ─── Écriture dans le fichier (sans bloquer le thread UI) ────────────────────
let _queue    = [];
let _flushing = false;

const enqueue = (line) => {
  _queue.push(line);
  if (!_flushing) flushQueue();
};

const flushQueue = async () => {
  _flushing = true;
  while (_queue.length > 0) {
    const batch = _queue.splice(0, _queue.length).join('\n') + '\n';
    try {
      // Lit le contenu existant, ajoute le batch, tronque si besoin
      let existing = '';
      const info = await FileSystem.getInfoAsync(LOG_FILE);
      if (info.exists) {
        existing = await FileSystem.readAsStringAsync(LOG_FILE);
      }

      let combined = existing + batch;

      // Tronque les vieilles lignes si on dépasse MAX_LINES
      const lines = combined.split('\n').filter(Boolean);
      if (lines.length > MAX_LINES) {
        combined = lines.slice(lines.length - MAX_LINES).join('\n') + '\n';
      }

      await FileSystem.writeAsStringAsync(LOG_FILE, combined);
    } catch (e) {
      // Silencieux : on ne veut pas boucler sur des erreurs de log
      console.warn('[logger] Impossible d\'écrire dans app.log :', e?.message);
    }
  }
  _flushing = false;
};

// ─── Fonction de log principale ───────────────────────────────────────────────
const log = (level, message, data) => {
  const line = `[${timestamp()}] [${level}] ${message}${serialize(data)}`;

  // Console
  switch (level) {
    case LEVELS.ERROR: console.error(line); break;
    case LEVELS.WARN:  console.warn(line);  break;
    default:           console.log(line);
  }

  // Fichier (asynchrone, non bloquant)
  enqueue(line);
};

// ─── API publique ─────────────────────────────────────────────────────────────
const logger = {
  debug : (msg, data) => log(LEVELS.DEBUG, msg, data),
  info  : (msg, data) => log(LEVELS.INFO,  msg, data),
  warn  : (msg, data) => log(LEVELS.WARN,  msg, data),
  error : (msg, data) => log(LEVELS.ERROR, msg, data),

  /** Retourne le contenu complet du fichier de log */
  readLog: async () => {
    try {
      const info = await FileSystem.getInfoAsync(LOG_FILE);
      if (!info.exists) return '(aucun log pour l\'instant)';
      return await FileSystem.readAsStringAsync(LOG_FILE);
    } catch (e) {
      return `(erreur lecture log: ${e?.message})`;
    }
  },

  /** Chemin du fichier sur l'appareil (utile pour le partager) */
  logFilePath: LOG_FILE,

  /** Vide le fichier de log */
  clearLog: async () => {
    try {
      await FileSystem.writeAsStringAsync(LOG_FILE, '');
      log(LEVELS.INFO, 'Log vidé');
    } catch (e) {
      console.warn('[logger] clearLog error:', e?.message);
    }
  },
};

export default logger;
