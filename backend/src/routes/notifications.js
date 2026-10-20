const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const NOTIFICATIONS_FILE = path.join(__dirname, '../../uploads/notifications.json');

// Default initial notifications
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif_1',
    title: 'New Quotation Received',
    description: 'Quotation #QTE-2026-4821 for ₹42,500 is ready for review. Tap to view itemized scope.',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
    type: 'QUOTATION',
    referenceId: 'qte_initial_1',
    quoteNumber: 'QTE-2026-4821',
    grandTotal: 42500,
    projectName: 'Residential Villa Waterproofing',
    location: 'Plot 42, Subhash Nagar, Bhilwara',
    unread: true,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'notif_2',
    title: 'Site Inspection Assigned',
    description: 'Senior engineer Er. Vikram Sharma has been assigned for your site audit.',
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80',
    type: 'REQUEST',
    referenceId: 'req_initial_1',
    projectName: 'Terrace Leakage Audit',
    location: 'Bhilwara, Rajasthan',
    unread: false,
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

function readNotifications() {
  try {
    if (!fs.existsSync(NOTIFICATIONS_FILE)) {
      fs.mkdirSync(path.dirname(NOTIFICATIONS_FILE), { recursive: true });
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(DEFAULT_NOTIFICATIONS, null, 2), 'utf-8');
      return DEFAULT_NOTIFICATIONS;
    }
    const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading notifications file:', err);
    return DEFAULT_NOTIFICATIONS;
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

function addNotification(notification) {
  const list = readNotifications();
  const item = {
    id: notification.id || `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: notification.title || 'Notification',
    description: notification.description || '',
    imageUrl: notification.imageUrl || '',
    type: notification.type || 'GENERAL',
    referenceId: notification.referenceId || '',
    quoteNumber: notification.quoteNumber || '',
    grandTotal: notification.grandTotal || 0,
    projectName: notification.projectName || 'Inspection Project',
    location: notification.location || 'Site Location',
    unread: notification.unread !== false,
    timestamp: notification.timestamp || new Date().toISOString()
  };
  list.unshift(item);
  // Keep up to 100 recent notifications
  writeNotifications(list.slice(0, 100));
  return item;
}

// GET /api/v1/notifications
router.get('/', (req, res) => {
  try {
    const list = readNotifications();
    const unreadCount = list.filter(n => n.unread).length;
    res.json({
      success: true,
      total: list.length,
      unreadCount,
      data: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// POST /api/v1/notifications
router.post('/', (req, res) => {
  try {
    const item = addNotification(req.body);
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
    item.unread = false;
    writeNotifications(list);
    res.json({ success: true, message: 'Notification marked as read', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};
router.patch('/:id/read', markReadHandler);
router.post('/:id/read', markReadHandler);

// POST /api/v1/notifications/mark-all-read
router.post('/mark-all-read', (req, res) => {
  try {
    const list = readNotifications();
    list.forEach(n => { n.unread = false; });
    writeNotifications(list);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

// DELETE /api/v1/notifications/:id
router.delete('/:id', (req, res) => {
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

module.exports = router;
module.exports.addNotification = addNotification;
module.exports.readNotifications = readNotifications;
