// Browser notification utility for event reminders

// Check if notifications are supported
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.log('Error requesting notification permission:', error);
      return false;
    }
  }

  return false;
};

export const sendNotification = (title, options = {}) => {
  // Skip if notifications not supported or not permitted
  if (!isNotificationSupported()) {
    return null;
  }
  
  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    // Try using the standard Notification API (works on desktop)
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (error) {
    // On mobile browsers, the direct Notification constructor may not work
    // Fall back silently - the toast notifications in the app will still work
    console.log('Browser notification not available:', error.message);
    return null;
  }
};

export const checkUpcomingEvents = (events, hoursAhead = 24) => {
  const now = new Date();
  const upcoming = [];

  events.forEach(event => {
    const eventDate = new Date(event.start_date);
    const hoursUntil = (eventDate - now) / (1000 * 60 * 60);

    if (hoursUntil > 0 && hoursUntil <= hoursAhead) {
      upcoming.push({
        ...event,
        hoursUntil: Math.round(hoursUntil)
      });
    }
  });

  return upcoming;
};

export const formatReminderMessage = (event) => {
  const hoursUntil = event.hoursUntil;
  let timeText = '';

  if (hoursUntil < 1) {
    timeText = 'in less than an hour';
  } else if (hoursUntil === 1) {
    timeText = 'in 1 hour';
  } else if (hoursUntil < 24) {
    timeText = `in ${hoursUntil} hours`;
  } else {
    const days = Math.floor(hoursUntil / 24);
    timeText = days === 1 ? 'tomorrow' : `in ${days} days`;
  }

  return {
    title: `Upcoming: ${event.title}`,
    body: `${event.event_type.replace(/_/g, ' ')} ${timeText}${event.location ? ` at ${event.location}` : ''}`
  };
};

export default {
  isNotificationSupported,
  requestNotificationPermission,
  sendNotification,
  checkUpcomingEvents,
  formatReminderMessage
};
