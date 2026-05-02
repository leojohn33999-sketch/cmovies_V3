
export class videoPlayer {
    constructor(data, ccurl) {
        this.hls = null;
        this.data = data.embed;
        this.ccurl = ccurl;
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
        this.subtitles = [];
        this.cc = true;

        this.fetchSubtitles(this.ccurl);
        this.video.controls = false;
        
        this.initEvents();
        this.hlsSetUp();
    }
    
    async hlsSetUp() {
        if (this.hls) this.hls.destroy();
        this.video.pause();
        this.video.src = "";
        
        const streamUrl = this.data;
        
        if (Hls.isSupported()) {
            this.hls = new Hls({ enableWorker: true });

            this.hls.loadSource(streamUrl);
            this.hls.attachMedia(this.video);

            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                // Store levels array globally, not just level index
                window.hlsLevels = this.hls.levels;
                window.currentHLS = this.hls;
                
                this.video.play().catch(e => console.log("Autoplay blocked"));
            });

            this.hls.on(Hls.Events.ERROR, (event, errorData) => {
                if (errorData.fatal) {
                    console.error("Fatal HLS error:", errorData.type);
                }
            });
        }
    }
    
    initEvents() {
        this.playVideo();
        this.overlay.ondblclick = (e) => 
        {
            const rect = this.overlay.getBoundingClientRect()
            const x = e.clientX - rect.left
            const width = rect.width
            const skipTime = 10
            if(x < width / 2){
                this.video.currentTime = Math.max(0,this.video.currentTime - skipTime)
                this.showSkipFeedback("backward")
            }
            else{
                this.video.currentTime = Math.min(this.video.duration,this.video.currentTime + skipTime)
                this.showSkipFeedback("forward")
            }
        }
        
        
        this.videoSound();
        this.expandVideo();
        this.setupFadeOut();
        this.setupScrubbing(); 
        this.setupKeyboard();
        
        this.video.ontimeupdate = () => {
            this.updateTime();
            if (this.cc) {
                this.updateSubtitles();
            }
        };

        this.ccEnable = document.getElementById("ccBtn-stream");
        this.ccEnable.onclick = () => {
            this.cc = !this.cc;
            if (!this.cc) {
                document.getElementById("subtitle-display-stream").style.display = "none";
                this.ccEnable.style.color = "#888";
            } else {
                this.ccEnable.style.color = "#fff";
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
        
        this.setting = document.getElementById("setting-gear");
        if (this.setting) {
            this.settingVideo(this.setting, this.video, this.ccurl);
        } else {
            console.error("Setting gear icon not found in DOM");
        }
    }
showSkipFeedback = (direction) => {
    const icon = direction === "forward" ? "fa-forward" : "fa-backward";
    const feedback = document.createElement("div");
    feedback.className = `skip-feedback ${direction}`;
    feedback.innerHTML = `<i class="fa-solid ${icon}"></i><span>10s</span>`;
    
    this.container.appendChild(feedback);
    setTimeout(() => feedback.remove(), 600)
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
        const blocks = cleanedData.split(/\r?\n\r?\n/);
        
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
    
    settingVideo(id, element, cc) {
        const video = element;
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

                if (item.dataset.fun === "cc") this.showCCSettings(wrapper);
                else if (item.dataset.fun === "setting") this.showQualitySettings(wrapper);
                else if (item.dataset.fun === "speed") this.showSpeedSettings(wrapper);
            };
        });

        // Initialize default view
        this.showQualitySettings(wrapper);
    }
    
    showQualitySettings(wrapper) {
        // Clear wrapper
        wrapper.innerHTML = '';
        
        const ul = document.createElement("ul");
        ul.id = "resolution-list";
        ul.className = "settings-list";
        
        // Add auto option
        ul.innerHTML = `<li class="setting-item active" data-value="-1">Auto</li>`;
        
        // Add quality options from HLS levels
        if (window.hlsLevels && window.hlsLevels.length > 0) {
            window.hlsLevels.forEach((level, index) => {
                const height = level.height || level.name ||  480;
                ul.innerHTML += `
                    <li class="setting-item" data-value="${index}">${height}p</li>
                `;
            });
        }
        
        wrapper.appendChild(ul);
        this.attachSettingListeners(wrapper);
    }
    
    showCCSettings(wrapper) {
        wrapper.innerHTML = `
            <ul class="settings-list" id="resolution-list">
                <li class="setting-item" data-value="off">Off</li>
                <li class="setting-item active" data-value="en">English</li>
            </ul>`;
        this.attachSettingListeners(wrapper);
    }
    
    showSpeedSettings(wrapper) {
        wrapper.innerHTML = `
            <ul class="settings-list" id="resolution-list">
                <li class="setting-item" data-value="0.5">0.5x</li>
                <li class="setting-item active" data-value="1">1x</li>
                <li class="setting-item" data-value="1.5">1.5x</li>
                <li class="setting-item" data-value="2">2x</li>
            </ul>`;
        this.attachSettingListeners(wrapper);
    }
    
  attachSettingListeners(wrapper) {
    const items = wrapper.querySelectorAll('.setting-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            items.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const value = item.getAttribute('data-value');
            
            // Check qualities FIRST (before speeds)
            const qualities = ["1080", "720", "360", "480", "auto"];
            const speeds = ["0.5", "1", "1.5", "2"];
            
            // 1. Check for quality first
            if (item.innerHTML.includes("1080p")||item.innerHTML.includes("360p")||item.innerHTML.includes("720p")||item.innerHTML.includes("480p") ) {
                // Quality change
                let levelIndex = -1; // default auto
                if(value){
                levelIndex = parseInt(value) 
                }
                if (this.hls) {
                    this.hls.currentLevel = levelIndex;
                    console.log(`Quality changelevel.nal} (level ${levelIndex})`);
                }
            }
            // 2. Check for speed
            else if (speeds.includes(value)) {
                this.video.playbackRate = parseFloat(value);
                console.log(`Speed changed to: ${value}x`);
            }
            // 3. Check for subtitles
            else if (value === "off") {
                this.cc = false;
                document.getElementById("subtitle-display-stream").style.display = "none";
                console.log("Subtitles off");
            }
            else if (value === "en") {
                this.cc = true;
                console.log("Subtitles on");
            }
        });
    });
}
}

// Initialize

