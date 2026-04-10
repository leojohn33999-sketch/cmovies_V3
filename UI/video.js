export class videoPlayer {
    constructor(quality,ccurl) {
        console.log(ccurl)
        // Updated IDs with -stream
      this.videoQualitys = quality;
      this.ccurl = ccurl
        this.video = document.getElementById("mainVideo-stream");
        this.container = document.getElementById("videoContainer-stream");
        this.subtitle = document.getElementById("subtitle-stream");
        this.controls = document.getElementById("controlsWrapper-stream");
        this.overlay = document.getElementById("playBtnOverlay-stream");
        this.iconPlay = document.getElementById("centerIcon-stream");
        this.iconSound = document.getElementById("volumeIcon-stream");
        this.progressArea = document.getElementById("progressArea-stream");
        this.progressBar = document.getElementById("progressFilled-stream");
        this.currentTimeDisplay = document.getElementById("currentTime-stream");
        this.displayTime = document.getElementById("duration-stream");
        
        this.hideTimeout = null;
        this.subtitles = []; // Initialize as empty array
        this.cc = true;      // Default CC to on
        console.log(this.ccurl)
        this.fetchSubtitles(this.ccurl);
        
        // Initial setup
        this.video.muted = true;
        this.video.autoplay = true;
        this.video.controls = false;
        
        this.initEvents();
        this.video.play();
        this.iconSound.className = "fa-solid fa-volume-xmark";
        
    }

    initEvents() {
        this.playVideo();
        this.videoSound();
        this.expandVideo();
        this.setupFadeOut();
        this.setupScrubbing(); 
        this.setupKeyboard();
        
        // Subtitle and Time Update Logic
        this.video.ontimeupdate = () => {
            this.updateTime();
            if (this.cc) {
                this.updateSubtitles();
            }
        };

        // CC Toggle Button Fix
        this.ccEnable = document.getElementById("ccBtn-stream");
        this.ccEnable.onclick = () => {
            this.cc = !this.cc; // Simple toggle
            if (!this.cc) {
                // Immediately hide subtitle display when turned off
                document.getElementById("subtitle-display-stream").style.display = "none";
                this.ccEnable.style.color = "#888"; // Optional: dim the icon
            } else {
                this.ccEnable.style.color = "#fff"; // Optional: brighten the icon
            }
        };

        this.video.onloadedmetadata = () => {
            this.durationTrack();
        };
        
        this.video.onplay = () => { this.iconPlay.className = "fa-solid fa-pause"; };
        this.video.onpause = () => { this.iconPlay.className = "fa-solid fa-play"; };

        const loader = document.getElementById("videoLoader-stream");
        const playBtn = document.getElementById("playBtnOverlay-stream");

        this.video.onwaiting = () => {
            loader.style.display = "flex";
            playBtn.style.display = "none";
            this.container.classList.add("loading-active-stream");
        };

        this.video.oncanplay = () => {
            loader.style.display = "none";
            playBtn.style.display = "flex";
            this.container.classList.remove("loading-active-stream");
        };

        this.video.onerror = () => {
            loader.style.display = "none";
            playBtn.style.display = "flex"; 
        };
        this.setting = document.getElementById("setting-gear")
if (this.setting) {
    this.settingVideo(this.setting,this.videoQualitys,this.video,this.ccurl);
} else {
    console.error("Setting gear icon not found in DOM");
}
    }

    playVideo() {
        this.overlay.onclick = () => {
            this.video.paused ? this.video.play() : this.video.pause();
        };
    }

    videoSound() {
        this.iconSound.parentElement.onclick = () => {
            this.video.muted = !this.video.muted;
            this.iconSound.className = this.video.muted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
        };
    }

    expandVideo() {
        const expandBtn = document.getElementById("fullScreenBtn-stream");
        expandBtn.onclick = () => {
            if (!document.fullscreenElement) {
                this.container.requestFullscreen().catch(err => {
                    console.error(`Error: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        };
    }

    updateTime() {
        this.currentTimeDisplay.innerText = this.formatTime(this.video.currentTime);
        const percent = (this.video.currentTime / this.video.duration) * 100;
        this.progressBar.style.width = `${percent}%`;
    }

    durationTrack() {
        this.displayTime.innerText = this.formatTime(this.video.duration);
    }

    setupScrubbing() {
        let isDragging = false;
        const scrub = (e) => {
            const event = e.touches ? e.touches[0] : e;
            const rect = this.progressArea.getBoundingClientRect();
            let pos = (event.clientX - rect.left) / rect.width;
            pos = Math.max(0, Math.min(pos, 1));
            this.progressBar.style.width = `${pos * 100}%`;
            this.video.currentTime = pos * this.video.duration;
        };

        this.progressArea.onmousedown = (e) => {
            isDragging = true;
            this.progressArea.classList.add('active-stream');
            scrub(e);
        };

        this.progressArea.ontouchstart = (e) => {
            isDragging = true;
            this.progressArea.classList.add('active-stream');
            scrub(e);
        };

        window.onmousemove = (e) => { if (isDragging) scrub(e); };
        window.ontouchmove = (e) => { if (isDragging) scrub(e); };

        window.onmouseup = () => {
            isDragging = false;
            this.progressArea.classList.remove('active-stream');
        };
        window.ontouchend = () => {
            isDragging = false;
            this.progressArea.classList.remove('active-stream');
        };
    }

    setupKeyboard() {
        window.onkeydown = (e) => {
            if (e.target.tagName === 'INPUT') return;
            switch(e.key) {
                case "ArrowRight": this.video.currentTime += 5; break;
                case "ArrowLeft": this.video.currentTime -= 5; break;
                case " ": 
                    e.preventDefault();
                    this.video.paused ? this.video.play() : this.video.pause();
                    break;
            }
        };
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return "00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const mStr = m.toString().padStart(2, '0');
        const sStr = s.toString().padStart(2, '0');
        return h > 0 ? `${h.toString().padStart(2, '0')}:${mStr}:${sStr}` : `${mStr}:${sStr}`;
    }

    setupFadeOut() {
        const showUI = () => {
            this.controls.classList.remove('hide-ui-stream');
            this.overlay.classList.remove('hide-ui-stream');
            clearTimeout(this.hideTimeout);
            if (!this.video.paused) {
                this.hideTimeout = setTimeout(() => {
                    this.controls.classList.add('hide-ui-stream');
                    this.overlay.classList.add('hide-ui-stream');
                }, 3000);
            }
        };
        this.container.onmousemove = showUI;
        this.container.onclick = showUI;
        this.video.onpause = showUI; 
    }

    async fetchSubtitles(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            this.subtitles = this.parseVTT(text);
        } catch (e) {
            console.error("Subtitle load failed", e);
        }
    }

parseVTT(data) {

    const cleanedData = data.split(/\r?\n/).slice(5).join('\n');

    const cues = [];
    const blocks = cleanedData.split(/\r?\n\r?\n/); // Now parses the "trimmed" version
    
    blocks.forEach(block => {
        const lines = block.split(/\r?\n/);
        const timeLine = lines.find(l => l.includes('-->'));
        
        if (timeLine) {
            const [start, end] = timeLine.split(' --> ').map(t => this.timeToSeconds(t.trim()));
            const text = lines.slice(lines.indexOf(timeLine) + 1).join('<br>');
            cues.push({ start, end, text });
        }
    });
    return cues;
}


    timeToSeconds(timeStr) {
        const parts = timeStr.split(':');
        let seconds = 0;
        if (parts.length === 3) {
            seconds += parseFloat(parts[0]) * 3600;
            seconds += parseFloat(parts[1]) * 60;
            seconds += parseFloat(parts[2].replace(',', '.'));
        }
        return seconds;
    }

    updateSubtitles() {
        if (!this.subtitles.length) return;
        const now = this.video.currentTime;
        const activeCue = this.subtitles.find(cue => now >= cue.start && now <= cue.end);
        const display = document.getElementById("subtitle-display-stream");
        if (activeCue) {
            display.innerHTML = activeCue.text;
            display.style.display = "block";
        } else {
            display.style.display = "none";
        }
    }
    
        settingVideo(id,quality,element,cc) {
            const video = element
            const videoQuality = quality
            const ccurl = cc
        const container = document.querySelector(".video-settings-card");
        const cancel = document.querySelector(".close-btn");
        const wrapper = document.getElementById("wrap-video-setting");

        id.onclick = () => {
            container.style.display = "block";
        };

        cancel.onclick = () => {
            container.style.display = "none";
        };

        const nav_settings = document.querySelectorAll(".icon-btn");
        nav_settings.forEach(item => {
            item.onclick = () => {
                nav_settings.forEach(i => i.classList.remove("active"));
                item.classList.add("active");

                // Use the local functions defined below
                if (item.dataset.fun === "cc") cc();
                else if (item.dataset.fun === "setting") setting();
                else if( item.dataset.fun === "speed")speed();
            };
        });

        // Helper functions defined inside the method scope
        function setting() {
            
            wrapper.innerHTML = `
                <ul class="settings-list" id="resolution-list">
                    <li class="setting-item" data-value="1080p">1080p</li>
                    <li class="setting-item active" data-value="720p">720p</li>
                    <li class="setting-item" data-value="360p">360p</li>
                </ul>`;
            attachItemListeners(); }

        function cc() {
            wrapper.innerHTML = `
                <ul class="settings-list" id="resolution-list">
                    <li class="setting-item" data-value="off">off</li>
                    <li class="setting-item active" data-value="en">English</li>
                </ul>`;
             attachItemListeners();
         
        }

        function speed() {
            wrapper.innerHTML = `
                <ul class="settings-list" id="resolution-list">
                    <li class="setting-item" data-value="0.5">0.5x</li>
                    <li class="setting-item active" data-value="1">1x</li>
                    <li class="setting-item" data-value="1.5">1.5x</li>
                    <li class="setting-item" data-value="2.5">2.5x</li>
                </ul>`;
            attachItemListeners();
        }

        function attachItemListeners() {
            
            const items = document.querySelectorAll('.setting-item');
            items.forEach(item => {
                item.addEventListener('click', () => {
                    items.forEach(i => i.classList.remove('active'));
                    localStorage.setItem("timePlay",video.currentTime)
                    video.pause()
                    item.classList.add('active');
                    const value = item.getAttribute('data-value');
                 // exucute 
                 
                 const quality = ["1080p","720p","360p"]
                 const speed = ["0.5","1","1.5","2.5"]
                 if(quality.includes(value)){
                     
                     console.log(Object.values(videoQuality[0])[0])
                     
                     let resolutions 
                     = value === "1080p"?Object.values(videoQuality[0])[0]:
                     value === "720p"?Object.values(videoQuality[1])[0]:
                     Object.values(videoQuality[2])[0]
                 
                 video.src = resolutions
                 video.currentTime = localStorage.getItem("timePlay"|| 0)
                     video.play()  
                 }
                 else if(speed.includes(value)){
                     video.pause()
                     video.playbackRate = parseFloat(value)
                     video.play()
                 }
                 
                 
                 
                  
                    
                });
            });

 }
 
 
 

        // Initialize default view
        setting();
    } // End of settingVideo
 // End of videoPlayer Class

    
    
    
}

// Initialize
export const player = new videoPlayer();

