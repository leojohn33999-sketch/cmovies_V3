class Recommend {
  constructor() {
    this.pages = 1
    this.init();
    this.pagesTv = 1
  }

  init() {
    this.fetchMovie();
  }

  async fetchMovie() {
    try {
      const res = await fetch("https://home.1262sbmdj27dj.workers.dev/trending?type=week");
      if (!res.ok) throw new Error("Network response was not ok");
      
      const data = await res.json();
      this.display(data.results);
    } catch (e) {
      console.error("Fetch failed:", e);
    }
    
    let movies = await fetch("https://home.1262sbmdj27dj.workers.dev/movies?pages=1").then(e => e.json()).catch(console.log)
    movies.results = movies.results.filter(m => m.adult !== true);
    this.movies(movies.results);
    
    let tv = await fetch("https://home.1262sbmdj27dj.workers.dev/tv?pages=1").then(e => e.json()).catch(console.log)
    this.tv(tv.results)
  }

  display(data) {
    const wrap = document.getElementById("movies-recommended-rapper");
    if (!wrap) return;

    wrap.innerHTML = ""; 

    data.forEach(movie => {
      wrap.innerHTML += `
        <div class="movie-card"
        onclick="window.location.href='/movie?movie=${movie.title.replace(" ","-").replace(":","-").toLowerCase()}&id=${movie.id}'" data-scroll="sroll"
        >
          <div class="poster-container">
            <span class="badge">HD</span>
            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
          </div>
          <div class="movie-info">
            <div class="meta-data">
              Movie • ${movie.release_date?.split('-')[0] || '2026'} 
            </div>
            <h3 class="movie-title">${movie.title}</h3>
          </div>
        </div>
      `;
    })
  }
  
  tv(data){
    let isFetching = false 
    const wrap = document.getElementById("tv-rapper")
    if(!wrap) return;
    
    data.forEach(movie => {
      wrap.innerHTML += `
        <div class="movie-card"
        onclick="window.location.href='/tv?movie=${movie.name.replace(" ","-").replace(":","-").toLowerCase()}&id=${movie.id}'"  >
          <div class="poster-container">
            <span class="badge">HD</span>
            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.name}">
          </div>
          <div class="movie-info">
            <div class="meta-data">
              Tv • ${movie.first_air_date?.split('-')[0] || '2026'} 
            </div>
            <h3 class="movie-title">${movie.name}</h3>
          </div>
        </div>
      `;
    })
    
    wrap.onscroll = async ()=>{
      if(isFetching) return
      const isBottom = wrap.scrollHeight - wrap.scrollTop  <= wrap.clientHeight + 10
      if(isBottom){
        isFetching = true
        await this.reloadData("tv")  // ✓ Fixed
        isFetching = false
      }
    }
  } 

  async reloadData(typeStream = "movie") {
  if (typeStream === "movie") {
    // Track current total pages loaded
    const currentPages = this.totalPages || 1;
    const pagesToLoad = 2; // How many new pages to load each time
    
    const res = await fetch(
      `https://home.1262sbmdj27dj.workers.dev/reload?type=movie&pages=${currentPages}&reload=${pagesToLoad}`
    );
    const data = await res.json();
    
    // Append new movies to existing ones
    if (data.results && data.results.length) {
      this.movies(data.results); // Assuming this.movies is an array
      this.totalPages = data.newPages; // Update total pages loaded
    }
    
  } else {
    // Same for TV shows
    const currentPages = this.totalPagesTv || 1;
    const pagesToLoad = 2;
    
    const res = await fetch(
      `https://home.1262sbmdj27dj.workers.dev/reload?type=tv&pages=${currentPages}&reload=${pagesToLoad}`
    );
    const data = await res.json();
    
    if (data.results && data.results.length) {
      this.tv(data.results); // Assuming this.tv is an array
      this.totalPagesTv = data.newPages;
    }
  }
}
  movies(data){
    let isFetching = false
    const wrap = document.getElementById("movies-rapper")
    if(!wrap) return;
    
    data.forEach(movie => {
      wrap.innerHTML += `
        <div class="movie-card"
        onclick="window.location.href='/movie.html?movie=${movie.title.replace(" ","-").replace(":","-").toLowerCase()}&id=${movie.id}'"
        >
          <div class="poster-container">
            <span class="badge">HD</span>
            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
          </div>
          <div class="movie-info">
            <div class="meta-data">
              Movie • ${movie.release_date?.split('-')[0] || '2026'} 
            </div>
            <h3 class="movie-title">${movie.title}</h3>
          </div>
        </div>
      `;
    })
    
    wrap.onscroll = async ()=>{
      if(isFetching) return
      const isBottom = wrap.scrollHeight - wrap.scrollTop  <= wrap.clientHeight + 10
      if(isBottom){
        isFetching = true
        await this.reloadData("movie")  // ✓ Fixed
        isFetching = false
      }
    }
  }
}
export const recommended = () => new Recommend();

export function popShow(text, color, bg, id, time) {
  // Check if element already exists and remove it
  const existingElement = document.getElementById(id);
  if (existingElement) {
    existingElement.remove();
  }
  
  // Check and remove existing style if it exists
  const existingStyle = document.getElementById(`pop-style-${id}`);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create and append the style element
  var style = document.createElement("style");
  style.rel = "stylesheet";
  style.id = `pop-style-${id}`;
  style.innerHTML = `
    #${id} {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px 24px;
        font-size: 0.875rem;
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        max-width: 500px;
        width: 70%;
        border-radius: 8px;
        background: #${bg};
        font-weight: 600;
        color: #${color};
        border: 1px solid #${bg};
        border-left: 4px solid #${color};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        animation: slideIn-${id} 0.3s ease-out;
        z-index: 100000;
        font-family: 'Inter', sans-serif;
        box-sizing: border-box;
    }
    
  @keyframes slideIn-${id} {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);  /* Start below */
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);     /* End at normal position */
    }
}`;
  
  document.head.appendChild(style);
  
  // Add Font Awesome and Google Fonts only if not present
  
  if (!document.querySelector('link[href*="fonts.googleapis.com"][href*="Inter"]')) {
    const gf = document.createElement("link");
    gf.rel = "stylesheet";
    gf.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(gf);
  }
  
  // Create and append the popup element
  const alt = document.createElement("div");
  alt.id = id;
  alt.innerHTML = text;
  document.body.appendChild(alt);
  
  // Remove after specified time (default 3000ms)
  setTimeout(() => {
    if (document.getElementById(id)) {
      document.getElementById(id).remove();
    }
    const styleToRemove = document.getElementById(`pop-style-${id}`);
    if (styleToRemove) {
      styleToRemove.remove();
    }
  }, time || 3000);
}

export async function saveF(id, title, img) {
  try {
    const { supabase } = await import("/JS/supabaseJS.js");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) {
      return popShow("Log in please", "EF4444", "FEF2F2", "section", 4000);
    }

    const { error } = await supabase.rpc('add_favorite', {
      new_movie: { id, title, poster: img }
    });

    if (error) {
      return popShow(error.message || "Failed to save", "EF4444", "FEF2F2", "errors", 3000);
    }

    // ✅ Correct object
    const favorite = {
      id,
      poster: img,
      title
    };

    // ✅ Get existing favorites
    let stored = localStorage.getItem("favorites");
    stored = stored ? JSON.parse(stored) : [];

    // ✅ Prevent duplicates
    const exists = stored.some(item => item.id === id);
    if (exists) {
      return popShow("Already in favorites", "f59e0b", "fff", "warn", 2000);
    }

    // ✅ Store directly (no encoding)
    stored.push(favorite);
    localStorage.setItem("favorites", JSON.stringify(stored));

    return popShow("Added to favourites", "1ABC9C", "fff", "showSuc", 3000);

  } catch (err) {
    console.error("Save favorite error:", err);
    return popShow("An unexpected error occurred", "EF4444", "FEF2F2", "errors", 3000);
  }
}