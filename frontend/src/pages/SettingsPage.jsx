import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function SettingsPage() {
  const { changePassword } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLocalBackup = async () => {
    setBackupLoading(true);
    setBackupMessage('');

    try {
      const result = await api.post('/backup/local');
      setBackupMessage(`Backup created: ${result.fileName}`);
    } catch (error) {
      setBackupMessage(`Backup failed: ${error.message}`);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleGoogleDriveBackup = async () => {
    setBackupLoading(true);
    setBackupMessage('');

    try {
      const result = await api.post('/backup/google-drive');
      setBackupMessage(`Backup uploaded to Google Drive: ${result.fileName}`);
    } catch (error) {
      setBackupMessage(`Backup failed: ${error.message}`);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      await api.downloadFile('/backup/download', 'rhm_backup.db');
    } catch (error) {
      setBackupMessage(`Download failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {passwordError && (
            <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
              {passwordSuccess}
            </div>
          )}

          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="input"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="btn btn-primary"
          >
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Backup */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Database Backup</h2>

        {backupMessage && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            backupMessage.includes('failed') ? 'bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400'
          }`}>
            {backupMessage}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Local Backup</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Create a backup of your database on the server.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleLocalBackup}
                disabled={backupLoading}
                className="btn btn-secondary"
              >
                {backupLoading ? 'Creating...' : 'Create Local Backup'}
              </button>
              <button
                onClick={handleDownloadBackup}
                className="btn btn-secondary"
              >
                Download Latest Backup
              </button>
            </div>
          </div>

          <hr className="dark:border-gray-700" />

          <div>
            <h3 className="font-medium mb-2">Google Drive Backup</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Upload a backup to your Google Drive. Make sure Google Drive is configured in the server settings.
            </p>
            <button
              onClick={handleGoogleDriveBackup}
              disabled={backupLoading}
              className="btn btn-primary"
            >
              {backupLoading ? 'Uploading...' : 'Backup to Google Drive'}
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">About</h2>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>RHM - Rental House Management</strong></p>
          <p>Version 1.0.0</p>
          <p>A self-hosted application for managing rental properties.</p>
        </div>
      </div>
    </div>
  );
}
