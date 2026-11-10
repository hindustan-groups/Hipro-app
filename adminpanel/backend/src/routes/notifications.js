const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticate, requireAdmin } = require('../middleware/auth');

const NOTIFICATIONS_FILE = path.join(__dirname, '../../uploads/notifications.json');

function readNotifications() {
  try {
    if (!fs.existsSync(NOTIFICATIONS_FILE)) {
      fs.mkdirSync(path.dirname(NOTIFICATIONS_FILE), { recursive: true });
      fs.writeFileSync(NOTIFICATIONS_FILE, '[]', 'utf-8');
      return [];
    }
    const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading notifications file:', err);
    return [];
  }
}

function writeNotifications(notifications) {
  try {
    fs.mkdirSync(path.dirname(NOTIFICATIONS_FILE), { recursive: true });
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing notifications file:', err);
  }
}

let admin = null;
let getMessaging = null;
try {
  admin = require('firebase-admin');
  try {
    ({ getMessaging } = require('firebase-admin/messaging'));
  } catch (_) {}
} catch (e) {
  console.log('firebase-admin module not loaded yet:', e.message);
}

let isFirebaseInitialized = false;

function getAdminApps() {
  if (!admin) return [];
  if (typeof admin.getApps === 'function') {
    return admin.getApps();
  }
  return Array.isArray(admin.apps) ? admin.apps : [];
}

function initFirebaseAdmin() {
  if (!admin) return null;
  const existingApps = getAdminApps();
  if (isFirebaseInitialized || existingApps.length > 0) {
    isFirebaseInitialized = true;
    return existingApps[0] || admin;
  }

  try {
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env:', e);
      }
    }

    if (!serviceAccount) {
      const candidates = [
        path.join(__dirname, '../../firebase-service-account.json'),
        path.join(__dirname, '../../../firebase-service-account.json'),
        path.join(__dirname, '../../config/firebase-service-account.json'),
        path.join(__dirname, '../../../android/app/google-services.json')
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            serviceAccount = JSON.parse(fs.readFileSync(p, 'utf-8'));
            if (serviceAccount.project_id && serviceAccount.private_key) {
              break;
            }
          } catch (_) {}
        }
      }
    }

    if (serviceAccount && serviceAccount.private_key) {
      const app = admin.initializeApp({
        credential: admin.credential ? admin.credential.cert(serviceAccount) : (admin.cert ? admin.cert(serviceAccount) : undefined)
      });
      isFirebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized with service account');
      return app;
    } else {
      try {
        const app = admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'hipro-e3170'
        });
        isFirebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized for project hipro-e3170');
        return app;
      } catch (errDef) {
        console.log('ℹ️ Firebase Admin SDK waiting for service credentials:', errDef.message);
      }
    }
  } catch (err) {
    console.error('Firebase Admin init error:', err);
  }
  return null;
}

// Attempt initial setup
initFirebaseAdmin();

async function sendPushNotificationToTokens(notification) {
  try {
    const fcmApp = initFirebaseAdmin();
    const apps = getAdminApps();
    if (!fcmApp && apps.length === 0) return;

    const tokens = readFcmTokens();
    if (!tokens || tokens.length === 0) return;

    let targetTokens = tokens;
    if (notification.userId) {
      targetTokens = tokens.filter(t => t.userId && String(t.userId).trim() === String(notification.userId).trim());
    } else if (!notification.isBroadcast) {
      return;
    }

    const tokenList = targetTokens.map(t => t.token).filter(t => t && typeof t === 'string' && t.trim().length > 10);
    if (tokenList.length === 0) return;

    const payload = {
      notification: {
        title: notification.title || '',
        body: notification.description || ''
      },
      data: {
        type: String(notification.type || ''),
        threadId: String(notification.threadId || notification.referenceId || ''),
        referenceId: String(notification.referenceId || notification.threadId || ''),
        quoteNumber: String(notification.quoteNumber || ''),
        requestNumber: String(notification.requestNumber || notification.requestId || ''),
        bookingNumber: String(notification.bookingNumber || ''),
        title: String(notification.title || ''),
        body: String(notification.description || '')
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'hipro_notifications_channel',
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      }
    };

    let messaging = null;
    if (getMessaging) {
      messaging = getMessaging(fcmApp || apps[0]);
    } else if (typeof admin.messaging === 'function') {
      messaging = admin.messaging();
    }

    if (!messaging || typeof messaging.sendEachForMulticast !== 'function') {
      console.warn('[FCM Multicast] Messaging client not available');
      return;
    }

    const response = await messaging.sendEachForMulticast({
      tokens: tokenList,
      notification: payload.notification,
      data: payload.data,
      android: payload.android
    });

    console.log(`[FCM Multicast] Sent to ${tokenList.length} devices. Success: ${response.successCount}, Failure: ${response.failureCount}`);
  } catch (err) {
    console.error('[FCM Multicast] Error sending notification:', err.message);
  }
}

function addNotification(notification, io = null) {
  const list = readNotifications();
  const item = {
    id: notification.id || `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: notification.title || '',
    description: notification.description || '',
    imageUrl: notification.imageUrl || '',
    type: notification.type || '',
    userId: notification.userId || notification.targetUserId || null,
    isBroadcast: !!notification.isBroadcast,
    referenceId: notification.referenceId || notification.threadId || '',
    threadId: notification.threadId || notification.referenceId || '',
    quoteNumber: notification.quoteNumber || '',
    grandTotal: notification.grandTotal || 0,
    requestId: notification.requestId || notification.requestNumber || '',
    requestNumber: notification.requestNumber || notification.requestId || '',
    bookingNumber: notification.bookingNumber || '',
    projectName: notification.projectName || '',
    location: notification.location || '',
    unread: notification.unread !== false,
    timestamp: notification.timestamp || new Date().toISOString()
  };
  list.unshift(item);
  // Keep up to 100 recent notifications
  writeNotifications(list.slice(0, 100));

  if (io) {
    io.to('admin_room').emit('push_notification', item);
    if (item.type === 'QUOTATION') {
      io.to('admin_room').emit('new_quotation_alert', item);
    }
    if (item.userId) {
      io.to(`user_${item.userId}`).emit('push_notification', item);
    } else if (item.isBroadcast) {
      io.emit('push_notification', item);
    }
  }

  // Dispatch FCM push to mobile devices asynchronously
  sendPushNotificationToTokens(item).catch(e => console.error('FCM send error:', e));

  return item;
}

// GET /api/v1/notifications
router.get('/', authenticate, (req, res) => {
  try {
    const list = readNotifications();
    const isAdmin = req.user.role === 'ADMIN';
    const filtered = isAdmin
      ? list
      : list.filter(n => n.userId === req.user.id || !n.userId || n.isBroadcast);
    const unreadCount = filtered.filter(n => n.unread).length;
    res.json({
      success: true,
      total: filtered.length,
      unreadCount,
      data: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// POST /api/v1/notifications
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const item = addNotification({
      ...req.body,
      isBroadcast: req.body.isBroadcast !== false
    }, req.app.get('io'));
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
});

// PATCH or POST /api/v1/notifications/:id/read - Mark as read
const markReadHandler = (req, res) => {
  try {
    const { id } = req.params;
    const list = readNotifications();
    const item = list.find(n => n.id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    const isAdmin = req.user.role === 'ADMIN';
    if (item.userId && item.userId !== req.user.id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify this notification' });
    }
    item.unread = false;
    writeNotifications(list);
    res.json({ success: true, message: 'Notification marked as read', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};
router.patch('/:id/read', authenticate, markReadHandler);
router.post('/:id/read', authenticate, markReadHandler);

// POST /api/v1/notifications/mark-all-read
router.post('/mark-all-read', authenticate, (req, res) => {
  try {
    const list = readNotifications();
    const isAdmin = req.user.role === 'ADMIN';
    list.forEach(n => {
      if (isAdmin || n.userId === req.user.id || !n.userId) {
        n.unread = false;
      }
    });
    writeNotifications(list);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

// DELETE /api/v1/notifications/:id
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let list = readNotifications();
    list = list.filter(n => n.id !== id);
    writeNotifications(list);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

// FCM Token Management
const FCM_TOKENS_FILE = path.join(__dirname, '../../uploads/fcm_tokens.json');

function readFcmTokens() {
  try {
    if (!fs.existsSync(FCM_TOKENS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(FCM_TOKENS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveFcmToken(token, userId, platform = 'android') {
  try {
    let tokens = readFcmTokens();
    const existingIndex = tokens.findIndex(t => t.token === token);
    const item = {
      token,
      userId: userId || null,
      platform,
      updatedAt: new Date().toISOString()
    };
    if (existingIndex >= 0) {
      tokens[existingIndex] = item;
    } else {
      tokens.push(item);
    }
    fs.mkdirSync(path.dirname(FCM_TOKENS_FILE), { recursive: true });
    fs.writeFileSync(FCM_TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
    return item;
  } catch (err) {
    console.error('Error saving FCM token:', err);
    return null;
  }
}

// POST /api/v1/notifications/fcm-token
router.post('/fcm-token', authenticate, (req, res) => {
  try {
    const { token, platform } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }
    const saved = saveFcmToken(token, req.user.id, platform);
    res.json({ success: true, message: 'FCM token registered successfully', data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save FCM token' });
  }
});

// GET /api/v1/notifications/fcm-tokens
router.get('/fcm-tokens', authenticate, requireAdmin, (req, res) => {
  try {
    const tokens = readFcmTokens();
    res.json({ success: true, total: tokens.length, data: tokens });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve FCM tokens' });
  }
});

module.exports = router;
module.exports.addNotification = addNotification;
module.exports.readNotifications = readNotifications;
module.exports.readFcmTokens = readFcmTokens;
module.exports.sendPushNotificationToTokens = sendPushNotificationToTokens;

