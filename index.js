document.addEventListener("DOMContentLoaded", fetchFurniture);
let cart = [];

const modal = document.querySelector("#buy-modal");
const closeModal = document.querySelector(".close-btn");
const modalImage = document.querySelector("#modal-image");
const modalTitle = document.querySelector("#modal-title");
const modalPrice = document.querySelector("#modal-price");
const confirmBtn = document.querySelector("#confirm-purchase");

function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);

    if (existingItem) {
        if (existingItem.quantity < item.stock) {
            existingItem.quantity += 1;
        } else {
            alert("Sorry, not enough stock available.");
            return;
        }
    } else {
        if (item.stock > 0) {
            cart.push({ ...item, quantity: 1 });
        } else {
            alert("Sorry, this item is out of stock.");
            return;
        }
    }

    updateCartUI();
}

function updateCartUI() {
    const cartContainer = document.querySelector("#cart-items");
    const cartTotal = document.querySelector("#cart-total");

    cartContainer.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        const cartItem = document.createElement("li");

        cartItem.innerHTML = `
            ${item.name} - Ksh ${Number(item.price).toLocaleString()} (x${item.quantity})
            <button class="remove-btn" data-id="${item.id}">Remove</button>
        `;
        cartContainer.appendChild(cartItem);
    });

    cartTotal.textContent = `Total: Ksh ${Number(total).toLocaleString()}`;

    // Attach remove button event listeners AFTER updating the UI
    document.querySelectorAll(".remove-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            removeFromCart(e.target.dataset.id);
        });
    });
}
function removeFromCart(itemId) {
    itemId = itemId.toString(); // Convert to string

    const itemIndex = cart.findIndex(item => item.id === itemId);

    if (itemIndex !== -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1; // Reduce quantity instead of removing entirely
        } else {
            cart.splice(itemIndex, 1); // Remove item when quantity is 1
        }
    }

    updateCartUI();
}


document.querySelector("#checkout-btn").addEventListener("click", (e) => {
    e.preventDefault();
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    alert("Order placed successfully!");

    cart.forEach(item => {
        updateStockInDB(item.id, item.stock - item.quantity);
    });

    cart = [];
    updateCartUI();
    fetchFurniture();
});

function updateStockInDB(itemId, newStock) {
    fetch(`http://localhost:3000/furniture/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock })
    })
    .then(() => fetchFurniture()) // Refresh UI after stock update
    .catch(error => console.error("Error updating stock:", error));
}

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
            <p class="stock">Stock: ${item.stock}</p>
            <button class="buy-btn" data-id="${item.id}" ${item.stock === 0 ? "disabled" : ""}>${item.stock === 0 ? "Out of Stock" : "Buy Now"}</button>
        `;

        container.appendChild(productCard);
    });

    document.querySelectorAll(".buy-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const itemId = e.target.dataset.id;
            const selectedItem = items.find(item => item.id == itemId);

            if (selectedItem.stock === 0) {
                alert("Samahani mteja, bidhaa hii imeisha kwa sasa.");
            } else {
                addToCart(selectedItem);
                alert(`${selectedItem.name} added to cart!`);

                modalImage.src = selectedItem.image;
                modalTitle.textContent = selectedItem.name;
                modalPrice.textContent = `Price: Ksh ${Number(selectedItem.price).toLocaleString()}`;

                modal.style.display = "block";
                confirmBtn.onclick = () => {
                    const paymentMethod = document.querySelector("#payment-method").value;
                    alert(`Order placed successfully using ${paymentMethod}!`);
                    modal.style.display = "none";
                };
            }
        });
    });
}

closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});
