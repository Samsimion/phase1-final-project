document.addEventListener("DOMContentLoaded", () => {
    fetchFurniture();
    setupDarkMode();
    setupLiveSearch();
});

let cart = [];

const modal = document.querySelector("#buy-modal");
const closeModal = document.querySelector(".close-btn");
const modalImage = document.querySelector("#modal-image");
const modalTitle = document.querySelector("#modal-title");
const modalPrice = document.querySelector("#modal-price");
const confirmBtn = document.querySelector("#confirm-purchase");

// Live Search
function setupLiveSearch() {
    const searchInput = document.querySelector("#search-bar");
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const products = document.querySelectorAll(".product-card");

        products.forEach(product => {
            const name = product.querySelector("h3").textContent.toLowerCase();
            product.style.display = name.includes(query) ? "block" : "none";
        });
    });
}

// Dark Mode
function setupDarkMode() {
    const darkModeToggle = document.querySelector("#dark-mode-toggle");
    darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
    });
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }
}

//  Sort Reviews
function sortReviews(reviews, sortBy) {
    if (sortBy === "newest") {
        return reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === "highest") {
        return reviews.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "lowest") {
        return reviews.sort((a, b) => a.rating - b.rating);
    }
    return reviews;
}

// Update Review UI
function updateReviewUI(reviews, container) {
    container.innerHTML = "";
    if (reviews.length === 0) {
        container.innerHTML = "<p>No reviews yet.</p>";
        return;
    }
    reviews.forEach(review => {
        const reviewItem = document.createElement("div");
        reviewItem.classList.add("review-item");
        reviewItem.innerHTML = `
            <p><strong>Rating:</strong> ${"⭐".repeat(review.rating)}</p>
            <p>${review.comment}</p>
            <hr>
        `;
        container.appendChild(reviewItem);
    });
}

// Fetch Reviews & Sorting
function fetchReviews(productId, reviewContainer) {
    fetch(`http://localhost:3000/reviews?productId=${productId}`)
        .then(res => res.json())
        .then(reviews => {
            reviewContainer.innerHTML = `
                <select class="sort-reviews" data-id="${productId}">
                    <option value="newest">Newest First</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                </select>
                <div class="reviews-list"></div>
            `;
            const reviewList = reviewContainer.querySelector(".reviews-list");
            updateReviewUI(reviews, reviewList);

            reviewContainer.querySelector(".sort-reviews").addEventListener("change", (e) => {
                const sorted = sortReviews(reviews, e.target.value);
                updateReviewUI(sorted, reviewList);
            });
        })
        .catch(error => console.error("Error fetching reviews:", error));
}

// 🛒 Add to Cart
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

    document.querySelectorAll(".remove-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            removeFromCart(e.target.dataset.id);
        });
    });
}

function removeFromCart(itemId) {
    itemId = itemId.toString();
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        } else {
            cart.splice(itemIndex, 1);
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
        .then(() => fetchFurniture())
        .catch(error => console.error("Error updating stock:", error));
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
            <button class="buy-btn" data-id="${item.id}" ${item.stock === 0 ? "disabled" : ""}>
                ${item.stock === 0 ? "Out of Stock" : "Buy Now"}
            </button>
        `;

        // Reviews
        const reviewContainer = document.createElement("div");
        reviewContainer.classList.add("review-container");
        fetchReviews(item.id, reviewContainer);

        // Add Review
        const reviewForm = document.createElement("div");
        reviewForm.classList.add("review-form");
        reviewForm.innerHTML = `
            <h4>Add a Review</h4>
            <select id="rating-${item.id}">
                <option value="5">⭐⭐⭐⭐⭐ - Excellent</option>
                <option value="4">⭐⭐⭐⭐ - Good</option>
                <option value="3">⭐⭐⭐ - Average</option>
                <option value="2">⭐⭐ - Poor</option>
                <option value="1">⭐ - Terrible</option>
            </select>
            <textarea id="comment-${item.id}" placeholder="Write your review..."></textarea>
            <button class="submit-review" data-id="${item.id}">Submit Review</button>
        `;

        productCard.appendChild(reviewContainer);
        productCard.appendChild(reviewForm);
        container.appendChild(productCard);
    });

    // Buy Now Logic
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

    // Submit Review
    document.querySelectorAll(".submit-review").forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const productId = e.target.dataset.id;
            const rating = document.querySelector(`#rating-${productId}`).value;
            const comment = document.querySelector(`#comment-${productId}`).value;
            if (!comment.trim()) {
                alert("Please enter a comment.");
                return;
            }
            const reviewData = {
                productId: productId,
                rating: parseInt(rating),
                comment: comment,
                date: new Date().toISOString(),
                verified: true
            };
            fetch("http://localhost:3000/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reviewData)
            })
                .then(() => {
                    alert("Review submitted successfully!");
                    fetchFurniture();
                })
                .catch(error => console.error("Error submitting review:", error));
        });
    });
}

function fetchFurniture() {
    fetch("http://localhost:3000/furniture")
        .then(res => res.json())
        .then(data => displayFurniture(data))
        .catch(error => console.error("Failed to fetch furniture:", error));
}

// Close Modal
closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});



// code ya muuzaji/seller
document.querySelector("#add-furniture-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.querySelector("#furniture-name").value.trim();
    const description = document.querySelector("#furniture-description").value.trim();
    const price = document.querySelector("#furniture-price").value.trim();
    const image = document.querySelector("#furniture-image").value.trim();
    const stock = document.querySelector("#furniture-stock").value.trim();

    if (!name || !description || !price || !image || !stock) {
        alert("Please fill in all fields.");
        return;
    }

    const newFurniture = {
        name,
        description,
        price: parseFloat(price),
        image,
        stock: parseInt(stock)
    };

    fetch("http://localhost:3000/furniture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFurniture)
    })
        .then(res => res.json())
        .then(data => {
            alert(`Furniture "${data.name}" added successfully!`);
            document.querySelector("#add-furniture-form").reset();
            fetchFurniture();
        })
        .catch(error => {
            console.error("Error adding furniture:", error);
            alert("Something went wrong. Please try again.");
        });
});
