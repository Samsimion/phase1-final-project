document.addEventListener("DOMContentLoaded", () => {
    fetchFurniture();
    setupSellerForm();
    setupCheckout();
    setupCloseModal();
});

let cart = [];

const modal = document.querySelector("#buy-modal");
const closeModal = document.querySelector(".close-btn");
const modalImage = document.querySelector("#modal-image");
const modalTitle = document.querySelector("#modal-title");
const modalPrice = document.querySelector("#modal-price");
const confirmBtn = document.querySelector("#confirm-purchase");



function sortReviews(reviews, sortBy) {
    switch (sortBy) {
        case "newest":
            return reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        case "highest":
            return reviews.sort((a, b) => b.rating - a.rating);
        case "lowest":
            return reviews.sort((a, b) => a.rating - b.rating);
        default:
            return reviews;
    }
}

function updateReviewUI(reviews, container) {
    container.innerHTML = reviews.length === 0 
        ? "<p>No reviews yet.</p>" 
        : reviews.map(review => `
            <div class="review-item">
                <p><strong>Rating:</strong> ${"⭐".repeat(review.rating)}</p>
                <p>${review.comment}</p>
                <hr>
            </div>
        `).join("");
}

function fetchReviews(productId, container) {
    fetch(`http://localhost:3000/reviews?productId=${productId}`)
        .then(res => res.json())
        .then(reviews => {
            container.innerHTML = `
                <select class="sort-reviews" data-id="${productId}">
                    <option value="newest">Newest First</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                </select>
                <div class="reviews-list"></div>
            `;
            const reviewList = container.querySelector(".reviews-list");
            updateReviewUI(reviews, reviewList);
            container.querySelector(".sort-reviews").addEventListener("change", (e) => {
                const sorted = sortReviews(reviews, e.target.value);
                updateReviewUI(sorted, reviewList);
            });
        })
        .catch(err => console.error("Error fetching reviews:", err));
}

function addToCart(item) {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
        if (existing.quantity < item.stock) {
            existing.quantity += 1;
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
        const li = document.createElement("li");
        li.innerHTML = `
            ${item.name} - Ksh ${Number(item.price).toLocaleString()} (x${item.quantity})
            <button class="remove-btn" data-id="${item.id}">Remove</button>
        `;
        cartContainer.appendChild(li);
    });
    cartTotal.textContent = `Total: Ksh ${Number(total).toLocaleString()}`;
    document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", () => removeFromCart(btn.dataset.id));
    });
}

function removeFromCart(id) {
    const index = cart.findIndex(item => item.id == id);
    if (index !== -1) {
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        } else {
            cart.splice(index, 1);
        }
        updateCartUI();
    }
}

function setupCheckout() {
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
    });
}

function updateStockInDB(id, stock) {
    fetch(`http://localhost:3000/furniture/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock })
    }).then(() => fetchFurniture())
      .catch(err => console.error("Stock update error:", err));
}

function displayFurniture(items) {
    const container = document.querySelector("#furniture-container");
    container.innerHTML = "";
    items.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("product-card");
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}" />
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p class="price">Ksh ${Number(item.price).toLocaleString()}</p>
            <p class="stock">Stock: ${item.stock}</p>
            <button class="buy-btn" data-id="${item.id}" ${item.stock === 0 ? "disabled" : ""}>
                ${item.stock === 0 ? "Out of Stock" : "Buy Now"}
            </button>
        `;

        const reviewContainer = document.createElement("div");
        reviewContainer.classList.add("review-container");
        fetchReviews(item.id, reviewContainer);

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

        card.append(reviewContainer, reviewForm);
        container.appendChild(card);
    });

    setupBuyNow(items);
    setupReviewSubmit();
}

function setupBuyNow(items) {
    document.querySelectorAll(".buy-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const item = items.find(i => i.id == btn.dataset.id);
            if (item.stock === 0) {
                alert("Samahani mteja, bidhaa hii imeisha kwa sasa.");
                return;
            }
            addToCart(item);
            alert(`${item.name} added to cart!`);
            modalImage.src = item.image;
            modalTitle.textContent = item.name;
            modalPrice.textContent = `Price: Ksh ${Number(item.price).toLocaleString()}`;
            modal.style.display = "block";

            confirmBtn.onclick = () => {
                const paymentMethod = document.querySelector("#payment-method").value;
                alert(`Order placed successfully using ${paymentMethod}!`);
                modal.style.display = "none";
            };
        });
    });
}

function setupReviewSubmit() {
    document.querySelectorAll(".submit-review").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const id = btn.dataset.id;
            const rating = document.querySelector(`#rating-${id}`).value;
            const comment = document.querySelector(`#comment-${id}`).value.trim();
            if (!comment) {
                alert("Please enter a comment.");
                return;
            }
            const review = {
                productId: id,
                rating: parseInt(rating),
                comment,
                date: new Date().toISOString(),
                verified: true
            };
            fetch("http://localhost:3000/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(review)
            }).then(() => {
                alert("Review submitted successfully!");
                fetchFurniture();
            }).catch(err => console.error("Review submit error:", err));
        });
    });
}

function fetchFurniture() {
    fetch("http://localhost:3000/furniture")
        .then(res => res.json())
        .then(data => displayFurniture(data))
        .catch(err => console.error("Fetch furniture error:", err));
}

function setupCloseModal() {
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

function setupSellerForm() {
    const form = document.querySelector("#add-furniture-form");
    form.addEventListener("submit", (e) => {
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

        const newItem = {
            name,
            description,
            price: parseFloat(price),
            image,
            stock: parseInt(stock)
        };

        fetch("http://localhost:3000/furniture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newItem)
        }).then(res => res.json())
          .then(data => {
              alert(`Furniture "${data.name}" added successfully!`);
              form.reset();
              fetchFurniture();
          }).catch(err => {
              console.error("Error adding furniture:", err);
              alert("Something went wrong. Please try again.");
          });
    });
}
