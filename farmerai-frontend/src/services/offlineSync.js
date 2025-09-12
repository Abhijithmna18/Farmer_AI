// Offline sync service for Growth Calendar
class OfflineSyncService {
  constructor() {
    this.dbName = 'FarmerAICalendar';
    this.version = 1;
    this.db = null;
    this.pendingChanges = [];
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    
    this.initDB();
    this.setupEventListeners();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('calendars')) {
          const calendarStore = db.createObjectStore('calendars', { keyPath: '_id' });
          calendarStore.createIndex('userId', 'user', { unique: false });
          calendarStore.createIndex('cropName', 'cropName', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: '_id' });
          eventStore.createIndex('calendarId', 'calendarId', { unique: false });
          eventStore.createIndex('date', 'date', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('pendingChanges')) {
          const changesStore = db.createObjectStore('pendingChanges', { keyPath: 'id', autoIncrement: true });
          changesStore.createIndex('type', 'type', { unique: false });
          changesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  setupEventListeners() {
    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online - starting sync');
      this.syncPendingChanges();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Gone offline - storing changes locally');
    });

    // Visibility change (when user comes back to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncPendingChanges();
      }
    });
  }

  // Calendar operations
  async saveCalendar(calendar) {
    try {
      if (this.isOnline) {
        // Try to save online first
        return await this.saveCalendarOnline(calendar);
      } else {
        // Save offline
        return await this.saveCalendarOffline(calendar);
      }
    } catch (error) {
      console.error('Error saving calendar:', error);
      // Fallback to offline storage
      return await this.saveCalendarOffline(calendar);
    }
  }

  async saveCalendarOnline(calendar) {
    const response = await fetch('/api/calendar', {
      method: calendar._id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(calendar)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Also save to offline storage as backup
    await this.saveCalendarOffline(result.data);
    
    return result;
  }

  async saveCalendarOffline(calendar) {
    const transaction = this.db.transaction(['calendars'], 'readwrite');
    const store = transaction.objectStore('calendars');
    
    // Add offline timestamp
    const offlineCalendar = {
      ...calendar,
      _offline: true,
      _lastModified: new Date().toISOString()
    };
    
    await store.put(offlineCalendar);
    
    // Add to pending changes if not online
    if (!this.isOnline) {
      await this.addPendingChange({
        type: calendar._id ? 'update_calendar' : 'create_calendar',
        data: calendar,
        timestamp: new Date().toISOString()
      });
    }
    
    return { data: offlineCalendar };
  }

  async getCalendars() {
    try {
      if (this.isOnline) {
        // Try to get from server first
        const response = await fetch('/api/calendar', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          
          // Update offline storage
          await this.updateOfflineCalendars(result.data);
          
          return result;
        }
      }
      
      // Fallback to offline storage
      return await this.getCalendarsOffline();
    } catch (error) {
      console.error('Error fetching calendars:', error);
      return await this.getCalendarsOffline();
    }
  }

  async getCalendarsOffline() {
    const transaction = this.db.transaction(['calendars'], 'readonly');
    const store = transaction.objectStore('calendars');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve({ data: request.result });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateOfflineCalendars(calendars) {
    const transaction = this.db.transaction(['calendars'], 'readwrite');
    const store = transaction.objectStore('calendars');
    
    // Clear existing calendars
    await store.clear();
    
    // Add updated calendars
    for (const calendar of calendars) {
      await store.put(calendar);
    }
  }

  // Event operations
  async saveEvent(calendarId, event) {
    try {
      if (this.isOnline) {
        return await this.saveEventOnline(calendarId, event);
      } else {
        return await this.saveEventOffline(calendarId, event);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      return await this.saveEventOffline(calendarId, event);
    }
  }

  async saveEventOnline(calendarId, event) {
    const url = event._id 
      ? `/api/calendar/${calendarId}/events/${event._id}`
      : `/api/calendar/${calendarId}/events`;
    
    const response = await fetch(url, {
      method: event._id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Also save to offline storage
    await this.saveEventOffline(calendarId, result.data);
    
    return result;
  }

  async saveEventOffline(calendarId, event) {
    const transaction = this.db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');
    
    const offlineEvent = {
      ...event,
      calendarId,
      _offline: true,
      _lastModified: new Date().toISOString()
    };
    
    await store.put(offlineEvent);
    
    // Add to pending changes if not online
    if (!this.isOnline) {
      await this.addPendingChange({
        type: event._id ? 'update_event' : 'create_event',
        data: { calendarId, event },
        timestamp: new Date().toISOString()
      });
    }
    
    return { data: offlineEvent };
  }

  async deleteEvent(calendarId, eventId) {
    try {
      if (this.isOnline) {
        const response = await fetch(`/api/calendar/${calendarId}/events/${eventId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      // Remove from offline storage
      await this.deleteEventOffline(eventId);
      
      // Add to pending changes if not online
      if (!this.isOnline) {
        await this.addPendingChange({
          type: 'delete_event',
          data: { calendarId, eventId },
          timestamp: new Date().toISOString()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting event:', error);
      // Still remove from offline storage
      await this.deleteEventOffline(eventId);
      return { success: true };
    }
  }

  async deleteEventOffline(eventId) {
    const transaction = this.db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');
    await store.delete(eventId);
  }

  // Pending changes management
  async addPendingChange(change) {
    const transaction = this.db.transaction(['pendingChanges'], 'readwrite');
    const store = transaction.objectStore('pendingChanges');
    
    await store.add({
      ...change,
      id: Date.now() + Math.random() // Unique ID
    });
  }

  async getPendingChanges() {
    const transaction = this.db.transaction(['pendingChanges'], 'readonly');
    const store = transaction.objectStore('pendingChanges');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingChanges() {
    const transaction = this.db.transaction(['pendingChanges'], 'readwrite');
    const store = transaction.objectStore('pendingChanges');
    await store.clear();
  }

  // Sync operations
  async syncPendingChanges() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Starting sync of pending changes...');

    try {
      const pendingChanges = await this.getPendingChanges();
      
      if (pendingChanges.length === 0) {
        console.log('✅ No pending changes to sync');
        return;
      }

      console.log(`📤 Syncing ${pendingChanges.length} pending changes`);

      for (const change of pendingChanges) {
        try {
          await this.processPendingChange(change);
        } catch (error) {
          console.error(`❌ Failed to sync change ${change.id}:`, error);
          // Continue with other changes
        }
      }

      // Clear successfully synced changes
      await this.clearPendingChanges();
      console.log('✅ Sync completed successfully');

    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async processPendingChange(change) {
    switch (change.type) {
      case 'create_calendar':
        await this.saveCalendarOnline(change.data);
        break;
      case 'update_calendar':
        await this.saveCalendarOnline(change.data);
        break;
      case 'create_event':
        await this.saveEventOnline(change.data.calendarId, change.data.event);
        break;
      case 'update_event':
        await this.saveEventOnline(change.data.calendarId, change.data.event);
        break;
      case 'delete_event':
        await this.deleteEvent(change.data.calendarId, change.data.eventId);
        break;
      default:
        console.warn(`Unknown change type: ${change.type}`);
    }
  }

  // Utility methods
  async getOfflineStatus() {
    const pendingChanges = await this.getPendingChanges();
    return {
      isOnline: this.isOnline,
      pendingChangesCount: pendingChanges.length,
      lastSync: localStorage.getItem('lastSync') || 'Never'
    };
  }

  async forceSync() {
    if (this.isOnline) {
      await this.syncPendingChanges();
      localStorage.setItem('lastSync', new Date().toISOString());
    }
  }

  // Cleanup old data
  async cleanup() {
    const transaction = this.db.transaction(['pendingChanges'], 'readwrite');
    const store = transaction.objectStore('pendingChanges');
    const index = store.index('timestamp');
    
    // Remove changes older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const range = IDBKeyRange.upperBound(thirtyDaysAgo.toISOString());
    const request = index.openCursor(range);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Create singleton instance
const offlineSyncService = new OfflineSyncService();

export default offlineSyncService;


