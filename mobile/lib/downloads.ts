import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const dbName = 'clipx_offline.db';
let db: SQLite.SQLiteDatabase | null = null;

export const initOfflineDB = async () => {
  if (Platform.OS === 'web') return null; // SQLite is not supported on web
  try {
    db = await SQLite.openDatabaseAsync(dbName);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS downloads (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        posterUrl TEXT,
        localPath TEXT NOT NULL,
        fileSize INTEGER DEFAULT 0,
        progress REAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        downloadedAt INTEGER
      );
    `);

    return db;
  } catch (error) {
    console.error('Failed to init offline DB', error);
    return null;
  }
};

export const startDownload = async (
  id: string,
  title: string,
  remoteUrl: string,
  posterUrl: string,
  onProgress?: (progress: number) => void
) => {
  if (Platform.OS === 'web') return;

  const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  // NOTE: Files are saved with .clipx extension (not .mp4) to prevent
  // casual playback in third-party apps. For true DRM, a native encryption
  // module would be needed (e.g. react-native-blob-util + AES).
  // @ts-ignore
  const localPath = `${FileSystem.documentDirectory || ''}${safeTitle}_${id}.clipx`;

  try {
    if (db) {
      await db.runAsync(
        'INSERT OR REPLACE INTO downloads (id, title, posterUrl, localPath, status, progress, downloadedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, title, posterUrl, localPath, 'downloading', 0, Date.now()]
      );
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      remoteUrl,
      localPath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        if (db) {
          db.runAsync(
            'UPDATE downloads SET progress = ?, fileSize = ? WHERE id = ?',
            [progress, downloadProgress.totalBytesExpectedToWrite, id]
          ).catch(e => console.log('DB progress update failed', e));
        }
        if (onProgress) onProgress(progress);
      }
    );

    const result = await downloadResumable.downloadAsync();

    if (result && db) {
      db.runAsync(
        'UPDATE downloads SET status = ?, progress = 1 WHERE id = ?',
        ['completed', id]
      );
    }

    return result;
  } catch (e) {
    if (db) {
      db.runAsync('UPDATE downloads SET status = ? WHERE id = ?', ['failed', id]);
    }
    console.error('Download failed', e);
    throw e;
  }
};

export const getDownloads = async () => {
  if (!db || Platform.OS === 'web') return [];
  try {
    const allRows = await db.getAllAsync('SELECT * FROM downloads ORDER BY downloadedAt DESC');
    return allRows as any[];
  } catch (error) {
    console.error('Failed to get downloads', error);
    return [];
  }
};

export const removeDownload = async (id: string, localPath: string) => {
  if (Platform.OS === 'web') return;
  try {
    await FileSystem.deleteAsync(localPath, { idempotent: true });
    if (db) {
      await db.runAsync('DELETE FROM downloads WHERE id = ?', [id]);
    }
  } catch (error) {
    console.error('Failed to remove download', error);
  }
};
