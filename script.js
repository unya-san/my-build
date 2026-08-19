```javascript
// =========================
// Smooth scroll
// =========================

document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", function (event) {

        const targetId = this.getAttribute("href");

        if (targetId === "#") return;

        const target = document.querySelector(targetId);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
            behavior: "smooth"
        });

    });

});


// =========================
// Back to top
// =========================

const topButton = document.getElementById("topButton");

topButton.addEventListener("click", function(event) {

    event.preventDefault();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


// =========================
// Game buttons
// =========================

document.querySelectorAll(".play-button").forEach(button => {

    button.addEventListener("click", function() {

        const gameName =
            this.closest(".game-card")
                .querySelector("h3")
                .textContent;

        console.log("Selected game:", gameName);

        // 後でここにゲームページへのリンク処理を追加できます
        // location.href = "games/example.html";

    });

});


// =========================
// Header scroll effect
// =========================

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {
        header.style.background = "rgba(11,11,15,0.95)";
    } else {
        header.style.background = "rgba(11,11,15,0.75)";
    }

});
```
