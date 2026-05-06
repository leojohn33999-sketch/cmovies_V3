// UI/video.js
import { HLSManager } from "./hlsManager.js";

export class videoPlayer {
    constructor(data, ccurl) {
        this.hlsManager = null;
        this.data = data.embed;
        this.ccurl = ccurl || null;
        this.video = document.getElementById("mainVideo-stream");
        this.container = document.getElementById("videoContainer-stream");
        
        if (!this.video || !this.container) {
            console.error("Required DOM elements not found");
            return;
        }
        
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
        this.currentSubtitleUrl = null;
        this.selectedCCLabel = null;
        this.isDestroyed = false;

        this.init();
    }

    async init() {
        this.fetchSubtitles(this.ccurl);
        this.video.controls = false;
        
        // Initialize HLS Manager
        this.hlsManager = new HLSManager(this.video, this.container);
        
        this.initEvents();
        await this.setupVideo();
    }

    async setupVideo() {
        const streamUrl = this.data;
        
        const success = await this.hlsManager.loadStream(streamUrl, {
            onSuccess: () => {
                console.log("Video loaded successfully");
                this.video.play().catch(e => console.log("Autoplay blocked", e));
            },
            onError: (error) => {
                console.error("Video setup failed:", error);
            }
        });
        
        if (!success) {
            console.error("All HLS attempts failed");
        }
    }

    initEvents() {
        this.playVideo();
        
        this.video.ondblclick = (e) => {
            const rect = this.overlay.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            const skipTime = 10;
            if(x < width / 2){
                this.video.currentTime = Math.max(0, this.video.currentTime - skipTime);
                this.showSkipFeedback("backward");
            }
            else{
                this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + skipTime);
                this.showSkipFeedback("forward");
            }
        };
        
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
        if (this.ccEnable) {
            this.ccEnable.onclick = () => {
                this.cc = !this.cc;
                const display = document.getElementById("subtitle-display-stream");
                if (display) {
                    display.style.display = this.cc ? "block" : "none";
                    this.ccEnable.style.color = this.cc ? "#fff" : "#888";
                }
            };
        }

        this.video.onloadedmetadata = () => {
            this.durationTrack();
        };
        
        this.video.onplay = () => { 
            if (this.iconPlay) this.iconPlay.className = "fa-solid fa-pause"; 
        };
        this.video.onpause = () => { 
            if (this.iconPlay) this.iconPlay.className = "fa-solid fa-play"; 
        };

        const loader = document.getElementById("videoLoader-stream");
        const playBtn = document.getElementById("playBtnOverlay-stream");

        this.video.onwaiting = () => {
            if (loader) loader.style.display = "flex";
            if (playBtn) playBtn.style.display = "none";
            if (this.container) this.container.classList.add("loading-active-stream");
        };

        this.video.oncanplay = () => {
            if (loader) loader.style.display = "none";
            if (playBtn) playBtn.style.display = "flex";
            if (this.container) this.container.classList.remove("loading-active-stream");
        };

        this.video.onerror = () => {
            if (loader) loader.style.display = "none";
            if (playBtn) playBtn.style.display = "flex"; 
        };
        
        this.setting = document.getElementById("setting-gear");
        if (this.setting) {
            this.settingVideo(this.setting, this.video, this.ccurl);
        }
    }

    showSkipFeedback = (direction) => {
        const icon = direction === "forward" ? "fa-forward" : "fa-backward";
        const feedback = document.createElement("div");
        feedback.className = `skip-feedback ${direction}`;
        feedback.innerHTML = `<i class="fa-solid ${icon}"></i><span>10s</span>`;
        
        this.container.appendChild(feedback);
        setTimeout(() => feedback.remove(), 600);
    };

    playVideo() {
        if (this.overlay) {
            this.overlay.onclick = () => {
                this.video.paused ? this.video.play() : this.video.pause();
            };
        }
    }

    videoSound() {
        if (this.iconSound && this.iconSound.parentElement) {
            this.iconSound.parentElement.onclick = () => {
                this.video.muted = !this.video.muted;
                this.iconSound.className = this.video.muted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
            };
        }
    }

    expandVideo() {
        const expandBtn = document.getElementById("fullScreenBtn-stream");
        if (expandBtn) {
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
    }

    updateTime() {
        if (this.currentTimeDisplay) {
            this.currentTimeDisplay.innerText = this.formatTime(this.video.currentTime);
        }
        const percent = (this.video.currentTime / this.video.duration) * 100;
        if (this.progressBar) {
            this.progressBar.style.width = `${percent}%`;
        }
    }

    durationTrack() {
        if (this.displayTime) {
            this.displayTime.innerText = this.formatTime(this.video.duration);
        }
    }

    setupScrubbing() {
        if (!this.progressArea) return;
        
        let isDragging = false;
        const scrub = (e) => {
            const event = e.touches ? e.touches[0] : e;
            const rect = this.progressArea.getBoundingClientRect();
            let pos = (event.clientX - rect.left) / rect.width;
            pos = Math.max(0, Math.min(pos, 1));
            if (this.progressBar) this.progressBar.style.width = `${pos * 100}%`;
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
            if (this.progressArea) this.progressArea.classList.remove('active-stream');
        };
        window.ontouchend = () => {
            isDragging = false;
            if (this.progressArea) this.progressArea.classList.remove('active-stream');
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
            if (this.controls) this.controls.classList.remove('hide-ui-stream');
            if (this.overlay) this.overlay.classList.remove('hide-ui-stream');
            clearTimeout(this.hideTimeout);
            if (!this.video.paused) {
                this.hideTimeout = setTimeout(() => {
                    if (this.controls) this.controls.classList.add('hide-ui-stream');
                    if (this.overlay) this.overlay.classList.add('hide-ui-stream');
                }, 3000);
            }
        };
        this.container.onmousemove = showUI;
        this.container.onclick = showUI;
        this.video.onpause = showUI; 
    }

    async fetchSubtitles(url) {
        if (!url) return;
        
        try {
            const response = await fetch(url);
            const res = await response.json();
            window.cc = res.subtitles;
            
            let savedCC = localStorage.getItem("selectedCC");
            
            if (savedCC) {
                const savedLabel = window.cc.find(x => x.label === savedCC);
                if (savedLabel) {
                    this.selectedCCLabel = savedCC;
                    await this.loadSubtitle(savedLabel.url);
                    this.cc = true;
                    if (this.ccEnable) this.ccEnable.style.color = "#fff";
                    return;
                }
            }
            
            let defaultCC = window.cc.find(x => x.label === "English");
            if (defaultCC) {
                this.selectedCCLabel = "English";
                await this.loadSubtitle(defaultCC.url);
                localStorage.setItem("selectedCC", "English");
                this.cc = true;
            } else if (window.cc.length > 0) {
                this.selectedCCLabel = window.cc[0].label;
                await this.loadSubtitle(window.cc[0].url);
                localStorage.setItem("selectedCC", window.cc[0].label);
                this.cc = true;
            } else {
                this.cc = false;
            }
            
        } catch (error) {
            console.error("Subtitle fetch error:", error);
        }
    }

    async loadSubtitle(subtitleUrl) {
        try {
            const response = await fetch(subtitleUrl);
            const data = await response.text();
            this.subtitles = this.parseVTT(data);
            this.currentSubtitleUrl = subtitleUrl;
        } catch (error) {
            console.error("Error loading subtitle:", error);
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
        } else if (parts.length === 2) {
            seconds += parseFloat(parts[0]) * 60;
            seconds += parseFloat(parts[1].replace(',', '.'));
        }
        return seconds;
    }

    updateSubtitles() {
        if (!this.subtitles.length) return;
        const now = this.video.currentTime;
        const activeCue = this.subtitles.find(cue => now >= cue.start && now <= cue.end);
        const display = document.getElementById("subtitle-display-stream");
        if (display && activeCue && this.cc) {
            display.innerHTML = activeCue.text;
            display.style.display = "block";
        } else if (display) {
            display.style.display = "none";
        }
    }
    
    settingVideo(id, element, cc) {
        const video = element;
        const container = document.querySelector(".video-settings-card");
        const cancel = document.querySelector(".close-btn");
        const wrapper = document.getElementById("wrap-video-setting");

        if (!container || !wrapper) return;

        id.onclick = () => {
            container.style.display = "block";
        };

        if (cancel) {
            cancel.onclick = () => {
                container.style.display = "none";
            };
        }

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

        this.showSpeedSettings(wrapper);
    }
    
    showQualitySettings(wrapper) {
        wrapper.innerHTML = '';
        
        const ul = document.createElement("ul");
        ul.id = "resolution-list";
        ul.className = "settings-list";
        
        ul.innerHTML = `<li class="setting-item active" data-value="-1">Auto</li>`;
        
        if (this.hlsManager && this.hlsManager.hls && this.hlsManager.hls.levels) {
            this.hlsManager.hls.levels.forEach((level, index) => {
                const height = level.height || level.name || 480;
                ul.innerHTML += `<li class="setting-item" data-value="${index}">${height}p</li>`;
            });
        }
        
        wrapper.appendChild(ul);
        this.attachSettingListeners(wrapper);
    }
    
    showCCSettings(wrapper) {
        let ul = "";
        
        if (window.cc && window.cc.length) {
            let nestedCC = window.cc.filter(m => m !== null);
            nestedCC.forEach(c => {
                let isActive = localStorage.getItem("selectedCC") === c.label ? 'active' : '';
                ul += `<li class="setting-item ${isActive}" data-value="${c.url}" data-label="${c.label}">${c.label}</li>`;
            });
            wrapper.innerHTML = `
                <ul id="resolution" class="settings-list">
                    <li class="setting-item" data-value="off">Off</li>
                    ${ul}
                </ul>
            `;
        } else {
            wrapper.innerHTML = `
                <ul id="resolution" class="settings-list">
                    <li class="setting-item" data-value="off">Off</li>
                </ul>
            `;
        }
        
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
            item.addEventListener('click', async () => {
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const value = item.getAttribute('data-value');
                const label = item.getAttribute('data-label');
                
                if (label && window.cc) {
                    localStorage.setItem("selectedCC", label);
                    this.selectedCCLabel = label;
                    await this.loadSubtitle(value);
                    this.cc = true;
                    const display = document.getElementById("subtitle-display-stream");
                    if (display) display.style.display = "block";
                    if (this.ccEnable) this.ccEnable.style.color = "#fff";
                }
                else if (value === "off") {
                    this.cc = false;
                    const display = document.getElementById("subtitle-display-stream");
                    if (display) display.style.display = "none";
                    if (this.ccEnable) this.ccEnable.style.color = "#888";
                }
                else if (item.innerHTML.includes("p") && !label) {
                    let levelIndex = parseInt(value);
                    if (this.hlsManager) {
                        this.hlsManager.setQuality(levelIndex);
                    }
                }
                else if (["0.5", "1", "1.5", "2"].includes(value)) {
                    if (this.hlsManager) {
                        this.hlsManager.setSpeed(value);
                    } else {
                        this.video.playbackRate = parseFloat(value);
                    }
                }
            });
        });
    }

    async destroy() {
        this.isDestroyed = true;
        if (this.hlsManager) {
            await this.hlsManager.destroy();
        }
    }
}