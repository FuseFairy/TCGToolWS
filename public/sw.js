self.addEventListener('fetch', (event) => {
    // This is the minimum Service Worker required for browsers like Google Chrome to trigger the "install" prompt for a PWA.
    // Chrome requires that a registered Service Worker include at least one 'fetch' event listener in order to identify the site as an "installable" PWA.
});