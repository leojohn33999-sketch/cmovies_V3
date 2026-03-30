class searchQuery{
    constructor(input,key,result){
         this.input = document.getElementById(input)
        this.key = key
         this.result = document.getElementById(result)
         
    }
    
    search(){
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
        const url =  `https://www.omdbapi.com/?s=${encodeURIComponent(text)}&apikey=${apikey}`
        try{
            const response = await fetch(url)
            const data = await response.json()
            this.result.innerHTML = ""
            
            if(data.Response === "True"){
                this.display(data.Search)
            }
        else{this.displayNone()}
        }catch(err){console.log("error happen",err)}
    }
    display(movies){
      movies.forEach((movie,index) => {
  const div = document.createElement("div");
  div.id=`movie_${index}`
  div.className = "movie-card"; // Changed class name for clarity

  div.innerHTML = `
    <img src="${movie.Poster !== "N/A" ? movie.Poster : 'placeholder.jpg'}" class="movie-poster">
    <div class="movie-details">
      <span class="movie-meta">${movie.Type} • ${movie.Year}</span>
      <h3 class="movie-title">${movie.Title}</h3>
    </div>
  `;

  this.result.appendChild(div);
  
div.addEventListener("click",()=>{
    
    let urlRedirect = `${movie.Title}`
    if(urlRedirect.includes(" ") || urlRedirect.includes(":")){
        urlRedirect = urlRedirect.toLowerCase().replace(" ","-").replace(":","-")}
        
    window.location.href=`/movie?movie=${urlRedirect}&id=${movie.imdbID}`
    
    
    
    
    
})
  
});

    }
    displayNone(){
        console.log("typo")
    }
}

export const index = new searchQuery("search","afcd4c24","result")
export const movie = new searchQuery("search","afcd4c24","movieResult")
