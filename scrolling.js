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

    document.body.addEventListener("wheel", function(e) {
        e.preventDefault();
        e.stopPropagation();
        if(e.deltaY > 0) {
            window.scrollBy(0,window.innerHeight);
        } else {
            window.scrollBy(0,-window.innerHeight);
        }

        window.scrollTo(0, Math.round(window.scrollY / window.innerHeight) * window.innerHeight);
    });

    document.body.style.overflow = "hidden";
});