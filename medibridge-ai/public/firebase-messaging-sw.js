importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
// We'll need to fetch the config from the server or hardcode it.
// For simplicity in this environment, we'll try to fetch it from a known endpoint or just rely on the client to register the SW.
// Actually, the easiest way is to let the client register the SW and pass the config, or just use the default.
// Wait, firebase-messaging-sw.js needs the config to initialize.
// Since we can't easily inject env vars here, we can use a URL parameter or just skip it if it's too complex for this environment.
// Let's just add a basic listener.

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.notification.body,
      icon: '/icon.png', // Replace with your icon
      badge: '/badge.png' // Replace with your badge
    };
    event.waitUntil(
      self.registration.showNotification(data.notification.title, options)
    );
  }
});
