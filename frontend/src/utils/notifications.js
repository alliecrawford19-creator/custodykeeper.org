// Browser notification utility for event reminders
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
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
  }
  return null;
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
  requestNotificationPermission,
  sendNotification,
  checkUpcomingEvents,
  formatReminderMessage
};
