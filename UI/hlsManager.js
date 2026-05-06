// UI/hlsManager.js
export class HLSManager {
    constructor(videoElement, container) {
        this.hls = null;
        this.video = videoElement;
        this.container = container;
        this.currentStreamUrl = null;
        this.isSwitching = false;
        this.errorDisplay = null;
        this.createErrorDisplay();
    }

    createErrorDisplay() {
        this.errorDisplay = document.createElement("div");
        this.errorDisplay.id = "hls-error-display";
        this.errorDisplay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: #ff6b6b;
            padding: 20px 30px;
            border-radius: 12px;
            text-align: center;
            z-index: 200;
            display: none;
            font-family: monospace;
            border: 1px solid #ff6b6b;
            backdrop-filter: blur(8px);
            min-width: 250px;
        `;
        this.container.appendChild(this.errorDisplay);
    }

    showError(errorCode, message, retryCallback = null) {
        this.errorDisplay.innerHTML = `
            <i class="fa-solid fa-circle-exclamation" style="font-size: 32px; margin-bottom: 12px; display: block;"></i>
            <strong>Playback Error (${errorCode})</strong><br>
            <span style="font-size: 13px; color: #aaa; display: block; margin: 8px 0;">${message || "Failed to load video"}</span>
            ${retryCallback ? '<button id="hls-retry-btn" style="margin-top: 12px; padding: 6px 20px; background: #ff6b6b; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: bold;">Retry</button>' : ''}
        `;
        this.errorDisplay.style.display = "block";
        
        if (retryCallback) {
            const retryBtn = document.getElementById("hls-retry-btn");
            if (retryBtn) {
                retryBtn.onclick = () => {
                    this.hideError();
                    retryCallback();
                };
            }
        }
    }

    hideError() {
        if (this.errorDisplay) this.errorDisplay.style.display = "none";
    }

    async destroy() {
        this.isSwitching = true;
        
        // Clear video source first
        if (this.video) {
            this.video.pause();
            this.video.removeAttribute('src');
            this.video.load();
        }
        
        // Destroy HLS instance
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        this.isSwitching = false;
    }

    async loadStream(streamUrl, options = {}) {
        const {
            onSuccess = null,
            onError = null,
            retryCount = 3,
            retryDelay = 1000
        } = options;

        if (this.isSwitching) {
            console.log("Already switching, wait...");
            return false;
        }

        await this.destroy();
        this.currentStreamUrl = streamUrl;
        this.hideError();

        const loader = document.getElementById("videoLoader-stream");
        const playBtn = document.getElementById("playBtnOverlay-stream");
        
        if (loader) loader.style.display = "flex";
        if (playBtn) playBtn.style.display = "none";

        let attempts = 0;
        
        const attemptLoad = async () => {
            attempts++;
            
            try {
                // Try HLS.js
                if (Hls && Hls.isSupported()) {
                    return await this.loadWithHLS(streamUrl);
                }
                // Fallback to native
                else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
                    return await this.loadWithNative(streamUrl);
                }
                else {
                    throw new Error("HLS not supported");
                }
            } catch (error) {
                console.error(`HLS load attempt ${attempts} failed:`, error);
                
                if (attempts < retryCount) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    return attemptLoad();
                }
                
                this.showError("23006", error.message || "Failed to load video", () => {
                    this.loadStream(streamUrl, options);
                });
                
                if (onError) onError(error);
                if (loader) loader.style.display = "none";
                if (playBtn) playBtn.style.display = "flex";
                return false;
            }
        };
        
        const success = await attemptLoad();
        
        if (success && onSuccess) {
            onSuccess();
        }
        
        return success;
    }

    loadWithHLS(streamUrl) {
        return new Promise((resolve, reject) => {
            this.hls = new Hls({ 
                enableWorker: true,
                manifestLoadingTimeOut: 15000,
                manifestLoadingMaxRetry: 3,
                manifestLoadingRetryDelay: 1000,
                levelLoadingTimeOut: 15000,
                levelLoadingMaxRetry: 3,
                fragLoadingTimeOut: 20000,
                fragLoadingMaxRetry: 3,
                autoRecoverError: true,
                startLevel: -1
            });

            this.hls.loadSource(streamUrl);
            this.hls.attachMedia(this.video);

            const manifestParsedHandler = () => {
                this.hls.off(Hls.Events.MANIFEST_PARSED, manifestParsedHandler);
                window.hlsLevels = this.hls.levels;
                window.currentHLS = this.hls;
                resolve(true);
            };

            this.hls.on(Hls.Events.MANIFEST_PARSED, manifestParsedHandler);

            this.hls.on(Hls.Events.ERROR, (event, errorData) => {
                if (errorData.fatal) {
                    reject(new Error(`HLS Error: ${errorData.type}`));
                }
            });

            // Timeout fallback
            setTimeout(() => {
                if (this.hls && !this.hls.levels) {
                    reject(new Error("Manifest load timeout"));
                }
            }, 15000);
        });
    }

    loadWithNative(streamUrl) {
        return new Promise((resolve, reject) => {
            this.video.src = streamUrl;
            
            const timeoutId = setTimeout(() => {
                reject(new Error("Native HLS load timeout"));
            }, 15000);
            
            this.video.onloadedmetadata = () => {
                clearTimeout(timeoutId);
                resolve(true);
            };
            
            this.video.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error(this.video.error?.message || "Native HLS error"));
            };
        });
    }

    setQuality(levelIndex) {
        if (this.hls && this.hls.levels) {
            const wasPlaying = !this.video.paused;
            const currentTime = this.video.currentTime;
            
            this.hls.currentLevel = levelIndex;
            
            setTimeout(() => {
                if (wasPlaying && this.video.paused) {
                    this.video.currentTime = currentTime;
                    this.video.play().catch(e => console.log("Resume failed", e));
                }
            }, 100);
        }
    }

    setSpeed(rate) {
        if (this.video) {
            this.video.playbackRate = parseFloat(rate);
        }
    }
}