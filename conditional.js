const storeName = "TechCart";
const currency = "₹";

let customerName = "Saravanana";
let customerAge = 22;
let isLoggedIn = true;
let selectedCoupon = null;

let deliveryAddress;
let walletBalance = 5000;

const products = [
    {

        
        id: 101,
        name: "Laptop",
        price: 55000,
        quantity: 1,
        category: "Electronics",
        inStock: true
    },
    {
        id: 102,
        name: "Wireless Mouse",
        price: 1200,
        quantity: 2,
        category: "Accessories",
        inStock: true
    },
    {
        id: 103,
        name: "Keyboard",
        price: 2500,
        quantity: 1,
        category: "Accessories",
        inStock: true
    },
    {
        id: 104,
        name: "Headphones",
        price: 3500,
        quantity: 1,
        category: "Audio",
        inStock: false
    }
];

console.log("====================================");
console.log("          " + storeName);
console.log("====================================");

console.log("Customer:", customerName);
console.log("Age:", customerAge);
console.log("Logged In:", isLoggedIn);

if (isLoggedIn) {
    console.log("Welcome", customerName);
} else {
    console.log("Please login first.");
}

console.log("------------------------------------");
console.log("PRODUCT LIST");
console.log("------------------------------------");

for (let i = 0; i < products.length; i++) {

    if (!products[i].inStock) {
        continue;
    }

    console.log(
        products[i].id,
        products[i].name,
        currency + products[i].price,
        "Qty:",
        products[i].quantity
    );
}

console.log("------------------------------------");
console.log("CART CALCULATION");
console.log("------------------------------------");

let subtotal = 0;

for (const product of products) {

    if (!product.inStock) {
        continue;
    }

    let itemTotal = product.price * product.quantity;

    subtotal += itemTotal;

    console.log(
        product.name +
        " x " +
        product.quantity +
        " = " +
        currency +
        itemTotal
    );
}

console.log("------------------------------------");
console.log("Subtotal:", currency + subtotal);

let discount = 0;

if (subtotal >= 50000) {
    discount = subtotal * 0.10;
} else if (subtotal >= 20000) {
    discount = subtotal * 0.05;
} else if (subtotal >= 10000) {
    discount = subtotal * 0.02;
} else {
    discount = 0;
}

console.log("Discount:", currency + discount);

let discountedPrice = subtotal - discount;

let deliveryCharge;

if (discountedPrice >= 5000) {
    deliveryCharge = 0;
} else {
    deliveryCharge = 100;
}

console.log("Delivery Charge:", currency + deliveryCharge);

let finalAmount = discountedPrice + deliveryCharge;

console.log("Final Amount:", currency + finalAmount);

console.log("------------------------------------");
console.log("PAYMENT CHECK");
console.log("------------------------------------");

let paymentStatus;

if (walletBalance >= finalAmount && isLoggedIn) {
    paymentStatus = true;
} else {
    paymentStatus = false;
}

if (paymentStatus) {
    walletBalance -= finalAmount;
    console.log("Payment Successful");
} else {
    console.log("Payment Failed");
}

console.log("Remaining Wallet:", currency + walletBalance);

console.log("------------------------------------");
console.log("ORDER STATUS");
console.log("------------------------------------");

let orderStatus = paymentStatus ? "Order Confirmed" : "Payment Pending";

console.log(orderStatus);

console.log("------------------------------------");
console.log("AVAILABLE PRODUCTS");
console.log("------------------------------------");

let availableProducts = 0;

products.forEach(function(product) {

    if (product.inStock) {
        availableProducts++;
        console.log(
            product.name +
            " - " +
            currency +
            product.price
        );
    }
});

console.log("Available Products:", availableProducts);

console.log("------------------------------------");
console.log("CATEGORY CHECK");
console.log("------------------------------------");

for (const product of products) {

    if (product.category === "Accessories") {
        console.log(
            product.name +
            " belongs to Accessories"
        );
    }
}

console.log("------------------------------------");
console.log("STOCK CHECK USING WHILE");
console.log("------------------------------------");

let stockIndex = 0;

while (stockIndex < products.length) {

    if (products[stockIndex].inStock) {
        console.log(
            products[stockIndex].name +
            " is available"
        );
    }

    stockIndex++;
}

console.log("------------------------------------");
console.log("ORDER PROCESS USING DO...WHILE");
console.log("------------------------------------");

let attempts = 0;

do {

    console.log("Checking order status...");

    attempts++;

} while (attempts < 2);

console.log("Order checking completed.");

console.log("------------------------------------");
console.log("BREAK EXAMPLE");
console.log("------------------------------------");

for (let i = 0; i < products.length; i++) {

    if (products[i].price > 50000) {
        console.log(
            "Expensive product found:",
            products[i].name
        );

        break;
    }
}

console.log("------------------------------------");
console.log("CONTINUE EXAMPLE");
console.log("------------------------------------");

for (let i = 0; i < products.length; i++) {

    if (!products[i].inStock) {
        continue;
    }

    console.log(
        "Processing:",
        products[i].name
    );
}

console.log("------------------------------------");
console.log("EVEN / ODD PRODUCT IDS");
console.log("------------------------------------");

for (const product of products) {

    if (product.id % 2 === 0) {
        console.log(product.name, "ID is Even");
    } else {
        console.log(product.name, "ID is Odd");
    }
}

console.log("------------------------------------");
console.log("NESTED LOOP - PRODUCT OPTIONS");
console.log("------------------------------------");

const sizes = ["Small", "Medium", "Large"];

for (let i = 0; i < products.length; i++) {

    console.log(products[i].name);

    for (let j = 0; j < sizes.length; j++) {

        console.log(
            "  " + sizes[j]
        );
    }
}

console.log("------------------------------------");
console.log("DATA TYPE CHECK");
console.log("------------------------------------");

console.log("customerName:", typeof customerName);
console.log("customerAge:", typeof customerAge);
console.log("isLoggedIn:", typeof isLoggedIn);
console.log("selectedCoupon:", typeof selectedCoupon);
console.log("deliveryAddress:", typeof deliveryAddress);
console.log("products:", typeof products);

console.log(
    "Is products an array?",
    Array.isArray(products)
);

console.log("------------------------------------");
console.log("FINAL BILL");
console.log("------------------------------------");

console.log("Customer:", customerName);
console.log("Subtotal:", currency + subtotal);
console.log("Discount:", currency + discount);
console.log("Delivery:", currency + deliveryCharge);
console.log("Final Amount:", currency + finalAmount);
console.log("Payment:", paymentStatus ? "Paid" : "Pending");
console.log("Order:", orderStatus);

console.log("====================================");
console.log("       THANK YOU FOR SHOPPING");
console.log("====================================");