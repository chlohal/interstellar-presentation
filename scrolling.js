document.addEventListener("DOMContentLoaded", function() {
    document.body.addEventListener("keydown", function(e) {
        if(e.key == "ArrowDown") {
            window.scrollBy(0,window.innerHeight);
            e.preventDefault();
        }
        else if(e.key == "ArrowUp") {
            window.scrollBy(0,-window.innerHeight);
            e.preventDefault();
        }
    });
})