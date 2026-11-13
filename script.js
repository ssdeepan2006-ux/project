let products = [];

// CART DATA
let cart = [];

try {
  cart = JSON.parse(localStorage.getItem("kadalCart")) || [];
} catch {
  cart = [];
}

// DISPLAY PRODUCTS
const productList = document.getElementById("productList");

function displayProducts() {
  productList.innerHTML = products.map((fish) => `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="product-card">

        <div class="image-wrap">
          <img src="${fish.image}"
               alt="${fish.name}"
               loading="lazy">
        </div>

        <div class="product-info">
          <h4>${fish.name}</h4>

          <p>Fresh seafood selection</p>

          <div class="product-price mb-3">
            ₹${fish.price} / kg
          </div>

          <button class="btn btn-warning"
            onclick="addToCart(${fish.id})">
            🛒 Add to Cart
          </button>
        </div>

      </div>
    </div>
  `).join("");
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error(`Products request failed (${response.status}).`);
    }

    products = await response.json();
    cart = cart.flatMap(item => {
      const currentProduct = products.find(product => product.id === item.id);
      return currentProduct
        ? [{ ...currentProduct, quantity: item.quantity }]
        : [];
    });

    displayProducts();
    updateCart();
  } catch (error) {
    console.error("Could not load products from the backend.", error);
    productList.innerHTML = `
      <p class="text-center text-danger">
        Products could not be loaded. Start the Python backend and refresh.
      </p>
    `;
    updateCart();
  }
}

// ADD TO CART
function addToCart(id) {
  const fish = products.find(item => item.id === id);

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      ...fish,
      quantity: 1
    });
  }

  updateCart();

  document.getElementById("cart").scrollIntoView({
    behavior: "smooth"
  });
}

// INCREASE QUANTITY
function increaseQty(id) {
  const item = cart.find(item => item.id === id);

  if (item) {
    item.quantity++;
  }

  updateCart();
}

// DECREASE QUANTITY
function decreaseQty(id) {
  const item = cart.find(item => item.id === id);

  if (item && item.quantity > 1) {
    item.quantity--;
  }

  updateCart();
}

// REMOVE PRODUCT
function removeItem(id) {
  cart = cart.filter(item => item.id !== id);

  updateCart();
}

// UPDATE CART
function updateCart() {
  const cartItems = document.getElementById("cartItems");

  const cartCount = document.getElementById("cartCount");

  const cartTotal = document.getElementById("cartTotal");

  const checkoutBtn = document.getElementById("checkoutBtn");

  let total = 0;
  let count = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;
    count += item.quantity;
  });

  cartCount.innerText = count;

  cartTotal.innerText = total.toLocaleString("en-IN");

  checkoutBtn.disabled = cart.length === 0;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <p class="empty-cart">
        Your cart is empty. Add some fresh seafood!
      </p>
    `;
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">

        <div class="cart-product">
          <img src="${item.image}" alt="${item.name}">

          <div>
            <h5>${item.name}</h5>
            <small>₹${item.price} / kg</small>
            <p class="mb-0 fw-bold">
              ₹${(item.price * item.quantity).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div class="quantity-control">
          <button onclick="decreaseQty(${item.id})">−</button>

          <span>${item.quantity}</span>

          <button onclick="increaseQty(${item.id})">+</button>
        </div>

        <button class="remove-btn"
          onclick="removeItem(${item.id})">
          Remove
        </button>

      </div>
    `).join("");
  }

  localStorage.setItem("kadalCart", JSON.stringify(cart));
}

// WHATSAPP CHECKOUT
async function checkout() {
  if (cart.length === 0) {
    alert("Please add products to your cart!");
    return;
  }

  const checkoutButton = document.getElementById("checkoutBtn");
  const whatsappWindow = window.open("about:blank", "_blank");
  checkoutButton.disabled = true;

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `Order request failed (${response.status}).`);
    }

    const order = await response.json();
    let message = "Hello KADALARASAN! I want to place an order.\n\n";

    message += `ORDER #${order.order_id}\nMY ORDER DETAILS:\n`;
    order.items.forEach(item => {
      message +=
        `${item.name} - ${item.quantity} kg x ₹${item.price} = ₹${item.line_total}\n`;
    });

    message += `\nTotal Amount: ₹${order.total}\n`;
    message += "\nPlease confirm availability and delivery details.";

    const whatsappURL =
      "https://wa.me/919994669060?text=" +
      encodeURIComponent(message);

    if (whatsappWindow) {
      whatsappWindow.location.href = whatsappURL;
    } else {
      alert(`Order #${order.order_id} was saved. Allow popups to open WhatsApp.`);
    }
  } catch (error) {
    if (whatsappWindow) {
      whatsappWindow.close();
    }
    console.error("Could not save the order.", error);
    alert(`Order could not be saved: ${error.message}`);
  } finally {
    checkoutButton.disabled = cart.length === 0;
  }
}

// CONTACT FORM
document.getElementById("enquiryForm")
  .addEventListener("submit", async function(event) {

    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const message = document.getElementById("message").value.trim();
    const submitButton = this.querySelector('button[type="submit"]');
    const whatsappWindow = window.open("about:blank", "_blank");
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, message })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Enquiry request failed (${response.status}).`);
      }

      const enquiry = await response.json();
      const whatsappMessage =
        `Hello KADALARASAN!\n\nEnquiry #${enquiry.enquiry_id}\nName: ${name}\nPhone: ${phone}\nMessage: ${message}`;

      const whatsappURL =
        "https://wa.me/919994669060?text=" +
        encodeURIComponent(whatsappMessage);

      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappURL;
      } else {
        alert(`Enquiry #${enquiry.enquiry_id} was saved. Allow popups to open WhatsApp.`);
      }

      this.reset();
    } catch (error) {
      if (whatsappWindow) {
        whatsappWindow.close();
      }
      console.error("Could not save the enquiry.", error);
      alert(`Enquiry could not be saved: ${error.message}`);
    } finally {
      submitButton.disabled = false;
    }
  });

// INITIALIZE WEBSITE
loadProducts();