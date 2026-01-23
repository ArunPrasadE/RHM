import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// POST /api/backup/google-drive - Trigger backup to Google Drive
router.post('/google-drive', async (req, res) => {
  try {
    const { google } = await import('googleapis');

    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!serviceAccountEmail || !privateKey || !folderId) {
      return res.status(400).json({
        error: 'Google Drive backup not configured. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_DRIVE_FOLDER_ID in .env'
      });
    }

    // Create JWT auth client
    const auth = new google.auth.JWT(
      serviceAccountEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/drive.file']
    );

    const drive = google.drive({ version: 'v3', auth });

    // Get database path
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/rhm.db');

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '_');
    const backupFileName = `rhm_backup_${timestamp}.db.gz`;

    // Read and compress database file
    const dbBuffer = fs.readFileSync(dbPath);
    const compressedBuffer = zlib.gzipSync(dbBuffer);

    // Upload to Google Drive
    const fileMetadata = {
      name: backupFileName,
      parents: [folderId]
    };

    const media = {
      mimeType: 'application/gzip',
      body: require('stream').Readable.from(compressedBuffer)
    };

    const uploadResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, createdTime'
    });

    // Log backup
    db.prepare(`
      INSERT INTO backup_log (status, file_name, google_drive_id)
      VALUES ('success', ?, ?)
    `).run(backupFileName, uploadResponse.data.id);

    // Clean up old backups (keep last 12)
    const backups = await drive.files.list({
      q: `'${folderId}' in parents and name contains 'rhm_backup_'`,
      orderBy: 'createdTime desc',
      fields: 'files(id, name, createdTime)'
    });

    if (backups.data.files.length > 12) {
      const toDelete = backups.data.files.slice(12);
      for (const file of toDelete) {
        await drive.files.delete({ fileId: file.id });
      }
    }

    res.json({
      message: 'Backup completed successfully',
      fileName: backupFileName,
      googleDriveId: uploadResponse.data.id,
      createdTime: uploadResponse.data.createdTime
    });
  } catch (error) {
    console.error('Error creating backup:', error);

    // Log failed backup
    db.prepare(`
      INSERT INTO backup_log (status, file_name)
      VALUES ('failed', ?)
    `).run(`Error: ${error.message}`);

    res.status(500).json({ error: 'Failed to create backup', details: error.message });
  }
});

// POST /api/backup/local - Create local backup
router.post('/local', (req, res) => {
  try {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/rhm.db');
    const backupDir = path.join(__dirname, '../../database/backups');

    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `rhm_backup_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    // Copy database file
    fs.copyFileSync(dbPath, backupPath);

    // Log backup
    db.prepare(`
      INSERT INTO backup_log (status, file_name)
      VALUES ('success', ?)
    `).run(backupFileName);

    // Clean up old local backups (keep last 30)
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('rhm_backup_'))
      .sort()
      .reverse();

    if (files.length > 30) {
      files.slice(30).forEach(f => {
        fs.unlinkSync(path.join(backupDir, f));
      });
    }

    res.json({
      message: 'Local backup completed successfully',
      fileName: backupFileName,
      path: backupPath
    });
  } catch (error) {
    console.error('Error creating local backup:', error);
    res.status(500).json({ error: 'Failed to create local backup' });
  }
});

// GET /api/backup/history - Get backup history
router.get('/history', (req, res) => {
  try {
    const backups = db.prepare(`
      SELECT * FROM backup_log
      ORDER BY backup_date DESC
      LIMIT 50
    `).all();

    res.json(backups);
  } catch (error) {
    console.error('Error fetching backup history:', error);
    res.status(500).json({ error: 'Failed to fetch backup history' });
  }
});

// GET /api/backup/download - Download latest local backup
router.get('/download', (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../database/backups');

    if (!fs.existsSync(backupDir)) {
      return res.status(404).json({ error: 'No backups found' });
    }

    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('rhm_backup_'))
      .sort()
      .reverse();

    if (files.length === 0) {
      return res.status(404).json({ error: 'No backups found' });
    }

    const latestBackup = files[0];
    const backupPath = path.join(backupDir, latestBackup);

    res.download(backupPath, latestBackup);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ error: 'Failed to download backup' });
  }
});

export default router;
