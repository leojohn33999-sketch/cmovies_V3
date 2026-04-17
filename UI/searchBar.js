class searchQuery{
    constructor(input,key,result){
         this.input = document.getElementById(input)
        this.key = key
         this.result = document.getElementById(result)
         
    }
    
    search(){
        this.tracker = document.getElementById("tracker");
if (!this.tracker) {
    this.tracker = document.createElement("script");
    this.tracker.id = "tracker";
    this.tracker.defer = true;
    this.tracker.src = "https://cloud.umami.is/script.js";
    this.tracker.setAttribute("data-website-id", "5dddd6b5-d007-4b92-95d0-ab38614f24d3");
    document.head.appendChild(this.tracker);
}
        this.style = document.getElementById("style-bar")
        
        if(!this.style){
            this.style = document.createElement("style")
            this.style.rel = "stylesheet"
            this.style.id = "style-bar"
        }
        this.style.innerHTML = `
        /* --- Professional Search Container --- */
#searchContainer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100px; /* Reduced height */
    z-index: 1000;
    display: none; /* Controlled by JS */
    align-items: center;
    justify-content: center;
    background: linear-gradient(to bottom, var(--bg-black) 60%, transparent);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.search-container {
    width: 90%;
    max-width: 600px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    transition: all 0.3s ease;
}

.search-container:focus-within {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--brand-red);
    box-shadow: 0 0 20px rgba(229, 9, 20, 0.2);
}

.search-container i {
    color: var(--text-muted);
    font-size: 1.1rem;
}

.search-container input {
    background: transparent;
    border: none;
    color: white;
    width: 100%;
    font-size: 1rem;
    font-family: 'Inter', sans-serif;
    outline: none;
}

/* --- Professional Results Dropdown --- */
#movieResult {
    position: fixed;
    top: 85px; /* Aligned right under the search bar */
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 600px;
    background: #161616;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    max-height: 70vh;
    overflow-y: auto;
    z-index: 1001;
    display: none;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

/* Individual Movie Row in Search */
.movie-card-search {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: background 0.2s;
}

.movie-card-search:hover {
    background: rgba(255, 255, 255, 0.05);
}

.movie-card-search img {
    width: 45px;
    height: 65px;
    border-radius: 6px;
    object-fit: cover;
}

.search-info h4 {
    margin: 0;
    font-size: 0.95rem;
    color: white;
}

.search-info p {
    margin: 4px 0 0;
    font-size: 0.8rem;
    color: var(--text-muted);
}
        `
        document.head.appendChild(this.style)
        
        let timeout;
        const text = this.input
        
       timeout =  setTimeout(()=>{
          text.addEventListener("input",()=>{
              
              this.result.style.display="block"
              if(text.value.length <0){
                  this.result.innerHTML = ""
            this.result.style.display="none"
                  return}
             this.fetchMovie(text.value)
     }) },400) }
    async fetchMovie(text){
        const apikey = this.key
        const url =  `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(text)}&api_key=${apikey}`
        try{
            const response = await fetch(url)
            const data = await response.json()
            this.result.innerHTML = ""
            
            if(data.results.length > 0){
               this.display(data.results)}
            
        else{this.displayNone()}
        }catch(err){console.log("error happen",err)}
    }
   display(movies) {
  this.result.innerHTML = "";

  movies.forEach((movie) => {
    const div = document.createElement("div");
    div.className = "movie-card-search";

    const name = movie.title || movie.name || "Unknown";
    const date = movie.release_date || movie.first_air_date || "";
    const year = date ? date.split("-")[0] : "N/A";

    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "placeholder.jpg";

    div.innerHTML = `
      <img src="${poster}">
      <div class="search-info">
        <h4>${name}</h4>
        <p>${movie.media_type?.toUpperCase() || "UNKNOWN"} • ${year}</p>
      </div>
    `;

    div.addEventListener("click", () => {
      const urlRedirect = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      window.location.href = `/${
        movie.media_type === "tv" ? "tv" : "movie"
      }?${
        movie.media_type === "tv" ? "tv" : "movie"
      }=${urlRedirect}&id=${movie.id}`;
    });

    this.result.appendChild(div);
  });
}
    displayNone(){
        console.log("typo")
    }
}

export const index = new searchQuery("search","7ea66f83093608890a91e38a8995f038","result")
export const movie = new searchQuery("search","7ea66f83093608890a91e38a8995f038","movieResult")
