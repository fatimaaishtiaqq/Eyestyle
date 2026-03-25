// Test exact component behavior
const product = {
    id: "prod_1",
    _id: "prod_1",
    name: "Classic Frame",
    variations: [
        { name: "Color", options: ["Red", "Blue"] },
        { name: "Len", options: ["UV", "Polarized"] }
    ]
};

// Emulate React ProductDetails Init State 
const defaults = {};
if (product.variations && product.variations.length > 0) {
    product.variations.forEach(v => {
        if (v.options && v.options.length > 0) {
            defaults[v.name] = v.options[0];
        }
    });
}
console.log("React Selected Variations State Initialized:", defaults);

// Emulate clicking addToCart
const selectedVariations = defaults;
const quantity = 1;

// Emulate CartContext addToCart implementation
let cartItems = [];
const defaultVariationId = JSON.stringify(selectedVariations);

const existingItem = cartItems.find(item => item.id === product.id && JSON.stringify(item.variations || item.size || {}) === defaultVariationId);

if (existingItem) {
    cartItems = cartItems.map(item =>
        item.id === product.id && JSON.stringify(item.variations || item.size || {}) === defaultVariationId
            ? { ...item, quantity: item.quantity + quantity }
            : item
    );
} else {
    cartItems = [...cartItems, { ...product, quantity, variations: selectedVariations, variationId: defaultVariationId }];
}

console.log("\nCart Items Saved in State:");
console.log(JSON.stringify(cartItems, null, 2));


// Emulate rendering in Cart.jsx
console.log("\nSimulated React Cart Map:");
cartItems.forEach(item => {
    console.log(`- Product: ${item.name}`);
    if (item.variations && Object.keys(item.variations).length > 0) {
        Object.entries(item.variations).map(([vName, vOption]) => {
            console.log(`   <p> ${vName}: ${vOption} </p>`);
        })
    } else if (item.size) {
        console.log(`   <p> Size: ${item.size} </p>`);
    } else {
        console.log("   (No variations to render)");
    }
});
