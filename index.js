document.addEventListener("DOMContentLoaded", fetchFurniture);


const modal = document.querySelector("#buy-modal");
const closeModal = document.querySelector(".close-btn");
const modalImage = document.querySelector("#modal-image");
const modalTitle = document.querySelector("#modal-title");
const modalPrice = document.querySelector("#modal-price");
const confirmBtn = document.querySelector("#confirm-purchase");

function fetchFurniture() {
    fetch("http://localhost:3000/furniture")
        .then(res => res.json())
        .then(data => displayFurniture(data))
        .catch(error => console.error("Failed to fetch furniture:", error));
}

function displayFurniture(items) {
    const container = document.querySelector("#furniture-container");
    container.innerHTML = ""; 

    items.forEach(item => {
        const productCard = document.createElement("div");
        productCard.classList.add("product-card");

        productCard.innerHTML = `
            <img src="${item.image}" alt="${item.name}" />
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p class="price">Ksh ${Number(item.price).toLocaleString()}</p>
            <button class="buy-btn" data-id="${item.id}">Buy Now</button>
        `;

        container.appendChild(productCard);
    });

    
    const buyButtons = document.querySelectorAll(".buy-btn");
    buyButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const itemId = e.target.dataset.id;
            const selectedItem = items.find(item => item.id == itemId);

            
            modal.style.display = "flex";
            modalImage.src = selectedItem.image;
            modalTitle.textContent = selectedItem.name;
            modalPrice.textContent = `Price: Ksh ${Number(selectedItem.price).toLocaleString()}`;

            
            confirmBtn.onclick = () => {
                const paymentMethod = document.querySelector("#payment-method").value;
                alert(`Order placed successfully using ${paymentMethod}!`);
                modal.style.display = "none"; 
            };
        });
    });
}


closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});
