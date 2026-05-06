const WORKER = `https://demo-worker.1262sbmdj27dj.workers.dev/`;

// Ensure these functions exist or are imported correctly

class FetchMovie {
    constructor() {
        this.hls = null;
        // Fix: Get the ID from the actual URL search string
        const params = new URLSearchParams(window.location.search);
        this.movieId = params.get("id");

        if (!this.movieId) {
            window.location.href = "/";
        }
    }

    async fetchWorker() {
        try {
            const res = await fetch(`${WORKER}?imdb=${this.movieId}`);
            const data = await res.json();
    
            const store = {
            type: "stream",
            id: data.id,  // or data.movieId depending on your response
            title: data.title || data.results?.title || "Unknown",
            embed: data.embed || `https://streamer-f4wx.onrender.com/proxy?url=${encodeURIComponent(data.url)}`,
            embed2: data.embed2,
            ccurl: data.ccurl,
            info: data.results || data.info,
            backdrop: data.backdrop_path || data.results?.backdrop_path,
            similar: data.similar || [],
            timestamp: Date.now()  // Add timestamp for sorting
        };
        
        // Store in localforage
        await localforage.setItem(store.id.toString(), store);
        console.log('Stream saved to history:', store.title);
            this.identifyData(data);
            
        } catch (err) {
            console.error("Fetch failed", err);
        }
    }

    async identifyData(data) {
        if (data.type === "embed") {
            embedUi.init(data); // Call the instance method
        
        }
        if(data.type === "stream"){
            streamUi.init(data)
        }
    }
        }
class streamUI {
    
    async init(data) {
        this.movie = data
        this.videoTapcount = 0
        this.videoUi = `
        <div class="video-card-stream">
        <div class="video-container-stream" id="videoContainer-stream">
            <video id="mainVideo-stream" class="video-main-stream" 
                poster="https://image.tmdb.org/t/p/w1280${this.movie.backdrop}">
            </video>
                        <div class="video-settings-card">
  <div class="settings-header">
    <div class="nav-icons" >
      <button class="icon-btn active" data-fun="setting"><i class="fas fa-signal" ></i></button>
      <button class="icon-btn" data-fun="cc"><i class="fas fa-closed-captioning" ></i></button>
      <button class="icon-btn" data-fun="speed"><i class="fas fa-stopwatch"></i></button>
    </div>
    <button class="close-btn">&times;</button>
  </div>
<div id="wrap-video-setting">
 
</div>
</div><div id="subtitle-display-stream"></div>
            <div id="videoLoader-stream" class="video-loader-stream">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
            </div>

            <div class="center-overlay-stream" id="playBtnOverlay-stream">
                <i class="fa-solid fa-play" id="centerIcon-stream"></i>
            </div>

            <div class="controls-wrapper-stream" id="controlsWrapper-stream">
                <div class="progress-area-stream" id="progressArea-stream">
                    <div class="progress-filled-stream" id="progressFilled-stream"></div>
                </div>
                
                <div class="controls-main-stream">
                    <div class="controls-left-stream">
                        <button class="btn-icon-stream" id="volumeBtn-stream"><i class="fa-solid fa-volume-high" id="volumeIcon-stream"></i></button>
                        <span class="time-stamp-stream"><span id="currentTime-stream">00:00</span> / <span id="duration-stream">00:00</span></span>
                    </div>

                    <div class="controls-right-stream">
                        <button class="btn-icon-stream" id="ccBtn-stream"><i class="fa-solid fa-closed-captioning"></i></button>
                        <button class="btn-icon-stream" id="setting-gear"><i class="fa-solid fa-gear"></i></button>
                        <button class="btn-icon-stream" id="fullScreenBtn-stream"><i class="fa-solid fa-expand"></i></button>

                    </div>
                </div>
            </div>
        </div>

        <div class="meta-bar-stream">
            <div><i class="fa-solid fa-share-nodes" id="share"></i><i class="fa-solid fa-forward-step" style="margin-left:20px"></i></div>
            <div><i class="fa-solid fa-bookmark" id="saveM"></i><i class="fa-solid fa-triangle-exclamation" style="margin-left:20px"></i></div>
        </div>
    </div>
      `
        try {
            const [infOmdb, recommended] = await Promise.all([
                this.loadExtra(),
                this.createRecommendation(this.movie.similar)
            ]);

            this.display(infOmdb, recommended);
            this.rerunDisplay = [infOmdb, recommended]

        } catch (err) {
            console.error("Initialization failed:", err);

        }



    }
    destroyPlayer() {
  if (this.hls) {
    this.hls.destroy();
    this.hls = null;
  }
  
  if (this.video) {
    this.video.pause();
    this.video.removeAttribute("src");
    this.video.load();
    this.video.replaceWith(video.cloneNode(true));
    console.log("killed")
  }

  console.log("🔥 HLS fully destroyed");
}
    async display(infOmdb, recommended) {
        console.log(infOmdb)
        const div = document.createElement("div");
        div.id = "whole-cointaner"
        div.innerHTML = `
          <div id="responsive-ui">
          <div>
            <div id="wrap">
          ${this.videoUi}
    </div>
            <div class="server-section">
                <p class="server-hint">If the current server is not working, try switching servers.</p>
                <div class="server-switcher">
                    <button id="server_1" class="server-btn active" data-server="active">
                        <i class="fa-solid fa-cloud"></i><span>Server 1</span>
                    </button>
                    <button id="server_2" class="server-btn">
                        <i class="fa-solid fa-cloud"></i><span>Server 2</span>
                    </button>
                </div>
            </div>
</div>
            <div class="info_movie-card">
                <div class="header">
                    <h1 class="info_h1">${this.movie.title}</h1>
                    <div class="badges">
                        <span class="badge gray">HD</span>
                        <span class="badge gray">${infOmdb[1].Rated}</span>
                        <span class="badge gray">${this.movie.info.release_date.split("-")[0]}</span>
                    </div>
                </div>
                <p class="description">${this.movie.info.overview}</p>
                <hr class="divider">
                <div class="content-wrapper">
                    <div class="poster-container">
                        <img src="https://image.tmdb.org/t/p/w500${this.movie.info.poster_path}" class="poster-img">
                    </div>
                    <div class="details">${infOmdb[0]}</div>
                </div>
                <div class="rating-footer">
                    <div class="stars">${this.rate(infOmdb[1].imdbRating)}</div>
                    <div class="rating-text"><strong>${infOmdb[1].imdbRating || 'N/A'}</strong> of <strong>10</strong></div>
                </div>
            </div>
 </div
            <div class="recommendation-container">
                <h2 class="section-title-liked">You may also like</h2>
                <div class="scroll-wrapper">${recommended}</div>
            </div>

          <footer id="footer">
    <div id="request_info">
      <span>Request</span>
      <span>Contact</span>
      
    </div>
    
    <p>
      <strong>Coinresty</strong> is your destination for free high-quality movies and TV shows. 
      Dive into seamless streaming without the hassle of subscriptions or hidden fees.
    </p>
    
    <div id="bottom">
      <img src="/IMG/logo_m.png" alt="Coinresty Logo" width="40" height="40">
      <span>&copy; 2026 Coinresty Streaming. All rights reserved.</span>
    </div>
  </footer>
        `;

        document.body.appendChild(div);

        // --- Logic for Iframe Loader ---
  if(localStorage.getItem("server") !== "server_2"){
          try {
            const module = await import("/UI/video.js");
            // Access the named export directly
            const PlayerClass = module.videoPlayer;
            new PlayerClass(
                this.movie, 
                this.movie.ccurl
            );
        } catch (err) {
            console.error("Failed to load video player logic:", err);
        }}

        const saveM = document.getElementById("saveM")
        saveM.onclick = async () => {
            const { saveF } = await import("/JS/home.js")
            saveF(this.movie.id, this.movie.title, this.movie.info.poster_path)
        }
        document.getElementById("share").onclick = () => {
            // Get current URL from navigation
            const currentUrl = navigation.currentEntry?.url || window.location.href;

            // Share it
            if (navigator.share) {
                navigator.share({
                    title: this.movie.title,
                    url: currentUrl
                });
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(currentUrl);
                alert('URL copied to clipboard!');
            }

        }
        //run server change 
        var server = localStorage.getItem("server")
        if (server === "server_2") {
if (window.currentPlayer) {
  window.currentPlayer.destroyPlayer();
}
            const video = document.querySelector(".video-main-stream");
            const controler = document.querySelector("#wrap")

            const s1 = document.getElementById("server_1");
            const s2 = document.getElementById("server_2");
            this.videoTapcount = 1

            s2.setAttribute("data-server", "active");
            s1.removeAttribute("data-server");
            controler.innerHTML = `
              <div class="video-card">
           
                <div class="video-container" style="position: relative; background: #000; overflow: hidden;">
                    <div id="iframe-backdrop" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('https://image.tmdb.org/t/p/w1280${this.movie.info.backdrop_path}') center/cover no-repeat;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px); z-index: 5;">
                         <div class="video-loader-stream" id="iframe-spinner" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; z-index: 10;">
                            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: #fff;"></i>
                        </div>
                    </div>
                    <iframe id="player" class="iframe" src="${this.movie.embed2}" 
                        allowfullscreen allow="autoplay; encrypted-media" style="position: relative; z-index: 1;"></iframe>      
                </div>
                <div class="controls-bar">
                    <div class="left-controls">
                        <div id="expand_iframe"><i class="fa-solid fa-share-nodes hightlight" style="color:#8a96a3;" id="share"></i></div>
                        <i class="fa-solid fa-forward-step highlight"></i>
                    </div>
                    
                    <div class="right-controls">
                        <div id="store"><i class="fa-solid fa-bookmark" id="saveM"></i></div>
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                </div>
            </div>

            `
            const iframe = document.getElementById("player");
            const backdrop = document.getElementById("iframe-backdrop");

            iframe.addEventListener("load", () => {
                backdrop.style.display = "none";
            });

            const saveM = document.getElementById("saveM")
            saveM.onclick = async () => {
                const { saveF } = await import("/JS/home.js")
                saveF(this.movie.id, this.movie.title, this.movie.info.poster_path)
            }
            document.getElementById("share").onclick = () => {
                // Get current URL from navigation
                const currentUrl = navigation.currentEntry?.url || window.location.href;

                // Share it
                if (navigator.share) {
                    navigator.share({
                        title: this.movie.title,
                        url: currentUrl
                    });
                } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(currentUrl);
                    alert('URL copied to clipboard!');
                }

            }
        }
        // Event Listeners

        document.getElementById("server_1").addEventListener("click", (e) => {
            if (this.videoTapcount <= 0) return;
            this.serverChange(e)
        });
        document.getElementById("server_2").addEventListener("click", (e) => {
            this.destroyPlayer()
            this.videoTapcount = 1
            this.serverChange(e)
        });
    }

    rate(stars) {
        let rating = Math.round(stars / 2);
        let html = "";
        for (let i = 1; i <= 5; i++) {
            html += `<i class="fas fa-star ${i <= rating ? 'yellow' : 'gray'}"></i>`;
        }
        return html;
    }

    async loadExtra() {
        const extraInfo = await this.getMovie(this.movie.title);
        if (!extraInfo || extraInfo.Response === "False") return ["<p>No extra info available</p>", "N/A"];

        const html = `
            <p><span>Country:</span> ${extraInfo.Country || "N/A"}</p>
            <p><span>Genres:</span> ${extraInfo.Genre || "N/A"}</p>
            <p><span>Released:</span> ${extraInfo.Released || "N/A"}</p>
            <p><span>Directors:</span> ${extraInfo.Director || "N/A"}</p>
                    <p><span>Casts:</span> ${extraInfo.Actors || "N/A"}</p>
        `;
        return [html, extraInfo];
    }

    async createRecommendation(movies) {
        if (!movies) return "";
        let html = "";
        movies.forEach(datarec => {
            const slug = datarec.title.toLowerCase().replace(/ /g, "-").replace(/:/g, "-");
            html += `
                <a href="/movie?${slug}&id=${datarec.id}">
                    <div class="movie-card-liked">
                        <div class="img-container-liked">
                            <span class="hd-badge">HD</span>
                            <img src="https://image.tmdb.org/t/p/w500${datarec.poster_path}" alt="${datarec.title}" class="poster-liked" load="lazy">
                        </div>
                        <div class="movie-info-liked">
                            <p class="meta-liked">Movie • ${datarec.release_date.split("-")[0]}</p>
                            <h3 class="movie-title-liked">${datarec.title}</h3>
                        </div>
                    </div>
                </a>`;
        });
        return html;
    }

    async getMovie(title) {
        const apikey = "afcd4c24";
        try {
            const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apikey}`);
            return await res.json();
        } catch (err) {
            console.error("OMDb Error:", err);
            return null;
        }
    }
    // stream
    async serverChange(event) {
        const serverId = event.currentTarget.id;
        //localstorage

        localStorage.setItem("server", serverId)

        const video = document.querySelector(".video-main-stream");
        const controler = document.querySelector("#wrap")

        const s1 = document.getElementById("server_1");
        const s2 = document.getElementById("server_2");

        if (serverId === "server_1") {
            s1.setAttribute("data-server", "active");
            s2.removeAttribute("data-server");
            const div = document.getElementById("whole-cointaner")
            controler.innerHTML = this.videoUi

            this.videoTapcount = 0
try {
                const module = await import("/UI/video.js");
const Player = module.videoPlayer;

// Re-initialize with the full embed data
new Player(
    this.movie,
    this.movie.ccurl
);
                const saveM = document.getElementById("saveM")
                saveM.onclick = async () => {
                    const { saveF } = await import("/JS/home.js")
                    saveF(this.movie.id, this.movie.title, this.movie.info.poster_path)
                }
                document.getElementById("share").onclick = () => {
                    // Get current URL from navigation
                    const currentUrl = navigation.currentEntry?.url || window.location.href;

                    // Share it
                    if (navigator.share) {
                        navigator.share({
                            title: this.movie.title,
                            url: currentUrl
                        });
                    } else {
                        // Fallback: copy to clipboard
                        navigator.clipboard.writeText(currentUrl);
                        alert('URL copied to clipboard!');
                    }

                }
            } catch (err) {
                console.error("Failed to reload video player logic:", err);
            }

        } else {
            s2.setAttribute("data-server", "active");
            s1.removeAttribute("data-server");
            controler.innerHTML = `
   <div class="video-card">
           
                <div class="video-container" style="position: relative; background: #000; overflow: hidden;">
                    <div id="iframe-backdrop" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('https://image.tmdb.org/t/p/w1280${this.movie.info.backdrop_path}') center/cover no-repeat;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px); z-index: 5;">
                         <div class="video-loader-stream" id="iframe-spinner" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; z-index: 10;">
                            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: #fff;"></i>
                        </div>
                    </div>
                    <iframe id="player" class="iframe" src="${this.movie.embed2}" 
                        allowfullscreen allow="autoplay; encrypted-media" style="position: relative; z-index: 1;"></iframe>      
                </div>
                <div class="controls-bar">
                    <div class="left-controls">
                        <div id="expand_iframe"><i class="fa-solid fa-share-nodes hightlight" style="color:#8a96a3;" id="share"></i></div>
                        <i class="fa-solid fa-forward-step highlight"></i>
                    </div>
                    
                    <div class="right-controls">
                        <div id="store"><i class="fa-solid fa-bookmark" id="saveM"></i></div>
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                </div>
            </div>

            `
            if(this.hls) this.hls.destroy()
            
            const iframe = document.getElementById("player");
            const backdrop = document.getElementById("iframe-backdrop");

            iframe.addEventListener("load", () => {
                backdrop.style.display = "none";
            });
            document.getElementById("share").onclick = () => {
                // Get current URL from navigation
                const currentUrl = navigation.currentEntry?.url || window.location.href;

                // Share it
                if (navigator.share) {
                    navigator.share({
                        title: this.movie.title,
                        url: currentUrl
                    });
                } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(currentUrl);
                    alert('URL copied to clipboard!');
                }
            }

            const saveM = document.getElementById("saveM")
            saveM.onclick = async () => {
                const { saveF } = await import("/JS/home.js")
                saveF(this.movie.id, this.movie.title, this.movie.info.poster_path)
            }
        }
    }


}

class EmbedUI {
    async init(movie) {
        this.movie = movie;
        this.showFetchLoader();
        
        try {
            const [infOmdb, recommended] = await Promise.all([
                this.loadExtra(),
                this.createRecommendation(this.movie.similar)
            ]);
            
            this.display(infOmdb, recommended);
            this.hideFetchLoader();
        } catch (err) {
            console.error("Initialization failed:", err);
            this.hideFetchLoader();
        }
    }

    showFetchLoader() {
        const overlay = document.createElement("div");
        overlay.id = "fetch-overlay";
        overlay.innerHTML = `
            <div class="spinner"></div>
            <p style="color:white; font-family:sans-serif; letter-spacing:2px;">LOADING MOVIE DATA...</p>
        `;
        document.body.appendChild(overlay);
    }

    hideFetchLoader() {
        const overlay = document.getElementById("fetch-overlay");
        if (overlay) {
            overlay.style.opacity = "0";
            setTimeout(() => overlay.remove(), 500);
        }
    }

    async display(infOmdb, recommended) {
        const div = document.createElement("div");
        div.innerHTML = `

            <div class="video-card">
                <div class="video-container" style="position: relative; background: #000; overflow: hidden;">
                    <div id="iframe-backdrop" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://image.tmdb.org/t/p/w1280${this.movie.info.backdrop_path}') center/cover no-repeat; z-index: 5; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;">
                        <div class="video-loader" id="iframe-spinner">
                            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: #fff;"></i>
                        </div>
                    </div>
                    
                    <iframe id="player" class="iframe" src="${this.movie.embed}" 
                        allowfullscreen allow="autoplay; encrypted-media" style="position: relative; z-index: 1;"></iframe>      
                </div>
                <div class="controls-bar">
                    <div class="left-controls">
                        <div id="share"><i class="fa-solid fa-share-nodes highlight" style="color:#8a96a3; cursor:pointer;"></i></div>
                        <i class="fa-solid fa-forward-step highlight"></i>
                    </div>
                    
                    <div class="right-controls">
                        <div id="store"><i class="fa-solid fa-bookmark" style="cursor:pointer;"></i></div>
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                </div>
            </div>

            <div class="server-section">
                <p class="server-hint">If the current server is not working, try switching servers.</p>
                <div class="server-switcher">
                    <button id="server_1" class="server-btn active" data-server="active">
                        <i class="fa-solid fa-cloud"></i><span>Server 1</span>
                    </button>
                    <button id="server_2" class="server-btn">
                        <i class="fa-solid fa-cloud"></i><span>Server 2</span>
                    </button>
                </div>
            </div>

            <div class="info_movie-card">
                <div class="header">
                    <h1 class="info_h1">${this.movie.title}</h1>
                    <div class="badges">
                        <span class="badge gray">HD</span>
                        <span class="badge gray">PG-13</span>
                        <span class="badge gray">${this.movie.info.release_date.split("-")[0]}</span>
                    </div>
                </div>
                <p class="description">${this.movie.info.overview}</p>
                <hr class="divider">
                <div class="content-wrapper">
                    <div class="poster-container">
                        <img src="https://image.tmdb.org/t/p/w500${this.movie.info.poster_path}" class="poster-img">
                    </div>
                    <div class="details">${infOmdb[0]}</div>
                </div>
                <div class="rating-footer">
                    <div class="stars">${this.rate(this.movie.info.vote_average)}</div>
                    <div class="rating-text"><strong>${infOmdb[1] || 'N/A'}</strong> of <strong>10</strong></div>
                </div>
            </div>

            <div class="recommendation-container">
                <h2 class="section-title-liked">You may also like</h2>
                <div class="scroll-wrapper">${recommended}</div>
            </div>

            <footer id="footer">
                <div id="request_info">
                    <span>Request</span>
                    <span>Contact</span>
                </div>
                <p>
                    <strong>Coinresty</strong> is your destination for free high-quality movies and TV shows. 
                    Dive into seamless streaming without the hassle of subscriptions or hidden fees.
                </p>
                <div id="bottom">
                    <img src="/IMG/logo_m.png" alt="Coinresty Logo" width="40" height="40">
                    <span>&copy; 2026 Coinresty Streaming. All rights reserved.</span>
                </div>
            </footer>
        `;

        document.body.appendChild(div);

        this.setupIframeLogic();

        // Event Listeners
        document.getElementById("server_1").addEventListener("click", (e) => this.serverChange(e));
        document.getElementById("server_2").addEventListener("click", (e) => this.serverChange(e));
        
        // Share Feature
        document.getElementById("share").onclick = () => {
            const currentUrl = window.location.href;
            if (navigator.share) {
                navigator.share({ title: this.movie.title, url: currentUrl });
            } else {
                navigator.clipboard.writeText(currentUrl);
                alert('URL copied to clipboard!');
            }
        };

        // Store Feature
        document.getElementById("store").onclick = async () => {
            const { saveF } = await import("/JS/home.js");
            saveF(this.movie.id, this.movie.title, this.movie.info.poster_path);
        };
    }

    setupIframeLogic() {
        const iframe = document.getElementById("player");
        const backdrop = document.getElementById("iframe-backdrop");
        
        // Ensure the backdrop shows when a new source starts loading
        backdrop.style.display = "flex";

        iframe.addEventListener("load", () => {
            backdrop.style.display = "none";
        });
    }

    rate(stars) {
        let rating = Math.round(stars / 2);
        let html = "";
        for (let i = 1; i <= 5; i++) {
            html += `<i class="fas fa-star ${i <= rating ? 'yellow' : 'gray'}"></i>`;
        }
        return html;
    }

    async loadExtra() {
        const extraInfo = await this.getMovie(this.movie.title);
        if (!extraInfo || extraInfo.Response === "False") return ["<p>No extra info available</p>", "N/A"];

        const html = `
            <p><span>Country:</span> ${extraInfo.Country || "N/A"}</p>
            <p><span>Genres:</span> ${extraInfo.Genre || "N/A"}</p>
            <p><span>Released:</span> ${extraInfo.Released || "N/A"}</p>
            <p><span>Directors:</span> ${extraInfo.Director || "N/A"}</p>
            <p><span>Casts:</span> ${extraInfo.Actors || "N/A"}</p>
        `;
        return [html, extraInfo.imdbRating];
    }

    async createRecommendation(movies) {
        if (!movies) return "";
        let html = "";
        movies.forEach(datarec => {
            const slug = datarec.title.toLowerCase().replace(/ /g, "-").replace(/:/g, "-");
            html += `
                <a href="/movie?${slug}&id=${datarec.id}">
                    <div class="movie-card-liked">
                        <div class="img-container-liked">
                            <span class="hd-badge">HD</span>
                            <img src="https://image.tmdb.org/t/p/w500${datarec.poster_path}" alt="${datarec.title}" class="poster-liked" load="lazy">
                        </div>
                        <div class="movie-info-liked">
                            <p class="meta-liked">Movie • ${datarec.release_date.split("-")[0]}</p>
                            <h3 class="movie-title-liked">${datarec.title}</h3>
                        </div>
                    </div>
                </a>`;
        });
        return html;
    }

    async getMovie(title) {
        const apikey = "afcd4c24";
        try {
            const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apikey}`);
            return await res.json();
        } catch (err) {
            console.error("OMDb Error:", err);
            return null;
        }
    }

    serverChange(event) {
        const serverId = event.currentTarget.id;
        const iframe = document.getElementById("player");
        const backdrop = document.getElementById("iframe-backdrop");
        const s1 = document.getElementById("server_1");
        const s2 = document.getElementById("server_2");
        
        // Show loader backdrop again during switch
        backdrop.style.display = "flex";

        if (serverId === "server_1") {
            s1.setAttribute("data-server", "active");
            s2.removeAttribute("data-server");
            iframe.src = this.movie.embed;
        } else {
            s2.setAttribute("data-server", "active");
            s1.removeAttribute("data-server");
            // Assuming server 2 uses movie.embed2 as per your previous streamUI logic
            iframe.src = this.movie.embed2 || `${this.movie.embed}?server=2`;
        }
    }
}

async function reloadIframeThreeTimes(iframeId) {
  const iframe = document.getElementById(iframeId);
  if (!iframe) return ;
 let c = 0
  for (let count = 1; count <= 1; count++) {
    iframe.src = iframe.src; //reload
    c +=1
    console.log("attempt", count);

    await (1); // wait 1 second between reloads
  }
  
  
}

function wait(seconds) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}

export const streamUi = new streamUI()
// Single Export Instances
export const embedUi = new EmbedUI();
export const fetchmovie = new FetchMovie();
