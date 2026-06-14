export const audioManager = {
    sounds: {
        catch: new Audio('assets/sounds/catch.mp3'),
        viewChange: new Audio('assets/sounds/swish.mp3'),
        nightAmbience: new Audio('assets/sounds/ambient.mp3')
    },

    init() {
        this.sounds.nightAmbience.loop = true;
        this.sounds.nightAmbience.volume = 0.3;
        
        // Browsers block auto-play; we wait for first interaction
        window.addEventListener('click', () => {
            if (this.sounds.nightAmbience.paused) {
                this.sounds.nightAmbience.play().catch(e => console.log("Ambient audio wait for user interaction."));
            }
        }, { once: true });
    },

    play(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log(`Audio play failed for ${soundName}`));
        }
    }
};
