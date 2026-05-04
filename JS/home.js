class Recommend {
  constructor() {
    // The constructor runs immediately when you type 'new Recommend()'
    this.init();
  }

  init() {
    this.fetchMovie();
  }

  async fetchMovie() {
    try {
      const res = await fetch("/JSON/trending.json");
      if (!res.ok) throw new Error("Network response was not ok");
      
      const data = await res.json();
      this.display(data.results);
    } catch (e) {
      console.error("Fetch failed:", e);
    }
  }

  display(data) {
    const wrap = document.getElementById("movies-recommended-rapper");
    if (!wrap) return; // Safety check

    wrap.innerHTML = ""; 

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
  }
}

// Export a function that instantiates the class
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

export async function saveF(id,title,img) {
 const {supabase} = await import("/JS/supabaseJS.js")
  const {error} = await supabase.rpc('add_favorite', {
  new_movie: { id: id, title: title,poster: img}
});
  
  if (!error) popShow("added to favourite","1ABC9C","fff","showSuc",3000)
  else popShow(error,"EF4444","FEF2F2","errors",3000)
}