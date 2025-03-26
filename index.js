document.addEventListener("DOMContentLoaded", fetchFurniture);

function fetchFurniture() {
    fetch("http://localhost:3000/furniture")
        .then(response => response.json())
        .then(data => displayFurniture(data))
        .catch(error => console.error("Error fetching furniture:", error));
}

function displayFurniture(items) {
    const container = document.querySelector("#furniture-container"); // Add this div in HTML
    container.innerHTML = ""; // Clear existing items

    items.forEach(item => {
        const productCard = document.createElement("div");
        productCard.classList.add("product-card");

        productCard.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p class="price">Ksh ${item.price.toLocaleString()}</p>
            <button class="buy-btn" data-id="${item.id}">Buy Now</button>
        `;

        container.appendChild(productCard);
    });
}

// AUTO SLIDESHOW FUNCTIONALITY
let slideIndex = 0;
const slides = document.querySelectorAll(".slide");

function showSlides() {
    slides.forEach((slide) => (slide.style.display = "none"));
    slideIndex++;
    if (slideIndex > slides.length) slideIndex = 1;
    slides[slideIndex - 1].style.display = "block";
    setTimeout(showSlides, 3000); // Change slide every 3 seconds
}

showSlides();

// MANUAL SLIDE NAVIGATION
function changeSlide(n) {
    slideIndex += n;
    if (slideIndex > slides.length) slideIndex = 1;
    if (slideIndex < 1) slideIndex = slides.length;
    slides.forEach((slide) => (slide.style.display = "none"));
    slides[slideIndex - 1].style.display = "block";
}







