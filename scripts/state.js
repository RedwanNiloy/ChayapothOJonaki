export const state = {
    caughtFireflies: 0,
    currentView: 'jungle', // 'jungle' or 'terrarium'
    
    // Listeners for state changes (simple pub/sub)
    listeners: [],
    
    subscribe(callback) {
        this.listeners.push(callback);
    },
    
    notify() {
        this.listeners.forEach(cb => cb(this));
    },
    
    incrementCaught() {
        this.caughtFireflies++;
        this.notify();
    },
    
    setView(view) {
        this.currentView = view;
        this.notify();
    }
};
