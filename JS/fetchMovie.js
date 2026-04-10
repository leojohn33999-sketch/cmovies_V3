const WORKER = `https://worker.1262sbmdj27dj.workers.dev/`;

// Ensure these functions exist or are imported correctly

class FetchMovie {
    constructor() {
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
            streamUI.init(data)
        }
    }
        
}
class streamUI{
    init(data){
        
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

  async  display(infOmdb, recommended) {
        const div = document.createElement("div");
        div.innerHTML = `
            <h3 id="title">${this.movie.title || 'Movie'}</h3>
            <div class="video-card">
            <div id="remove_iframe" style="">&times</div>
                <div class="video-container">
                    <div class="loader" id="iframe-spinner">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #e50914;"></i>
                    </div>
                    <iframe id="player" class="iframe" src="${this.movie.embed}" 
                        allowfullscreen allow="autoplay; encrypted-media"></iframe>      
                </div>
                <div class="controls-bar">
                    <div class="left-controls">
                        <div id="expand_iframe"><i class="fa-solid fa-moon hightlight" style="color:#8a96a3;"></i></div>
                        <i class="fa-solid fa-forward-step highlight"></i>
                    </div>
                    
                    <div class="right-controls">
                        <div id="store"><i class="fa-solid fa-bookmark"></i></div>
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

        // --- Logic for Iframe Loader ---
        const iframe = document.getElementById("player");
        const iframeSpinner = document.getElementById("iframe-spinner");
        await reloadIframeThreeTimes("player")
        iframe.addEventListener("load", () => {
            iframeSpinner.style.display = "none";
        });
      
        // Event Listeners
        document.getElementById("server_1").addEventListener("click", (e) => this.serverChange(e));
        document.getElementById("server_2").addEventListener("click", (e) => this.serverChange(e));
        document.getElementById("expand_iframe").addEventListener("click", () => this.expandUI());
        document.getElementById("store").addEventListener("click", () => this.saveMovie(this.movie.title));
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

    async saveMovie(title) {
        const extraInfo = await this.getMovie(title);
        if (!extraInfo || extraInfo.Response === "False") {
            alert("Movie not found");
            return;
        }
        const expires = new Date();
        expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
        document.cookie = `movieTitle=${extraInfo.Title};expires=${expires.toUTCString()};path=/`;
        document.cookie = `moviePoster=${extraInfo.Poster};expires=${expires.toUTCString()};path=/`;
        alert("Saved!");
    }

    async expandUI() {
        const iframeCard = document.querySelector(".video-card");
        const iframeE = document.getElementById("player")
        const cancel = document.getElementById("remove_iframe")
        if (iframeE.requestFullscreen) {
            iframeE.requestFullscreen();
            cancel.style.display="block"
            cancel.addEventListener("click",()=>{iframeCard.exisFullscreen()
                cancel.style.display="none"}
            )
        } else {
            alert("Fullscreen not supported");
        }
    }

    serverChange(event) {
        const serverId = event.currentTarget.id;
        const iframe = document.querySelector(".iframe");
        const s1 = document.getElementById("server_1");
        const s2 = document.getElementById("server_2");
        
        if (serverId === "server_1") {
            s1.setAttribute("data-server", "active");
            s2.removeAttribute("data-server");
            iframe.src = this.movie.embed;
        } else {
            s2.setAttribute("data-server", "active");
            s1.removeAttribute("data-server");
            iframe.src = `${this.movie.embed}?server=2`;
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


// Single Export Instances
export const embedUi = new EmbedUI();
export const fetchmovie = new FetchMovie();


