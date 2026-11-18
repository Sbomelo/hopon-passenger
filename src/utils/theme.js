export function getTheme() {
    try {
        return localStorage.getItem('hopon-theme') === 'dark' ? 'dark' : 'light';
    } catch {
        return 'light';
    }
}

export function setTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
        localStorage.setItem('hopon-theme', next);
    } catch {
        // The theme still works when the browser blocks persistent storage.
    }
    return next;
}

export function toggleTheme() {
    return setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}
