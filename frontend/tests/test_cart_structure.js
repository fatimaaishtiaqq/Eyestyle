// Test Cart Data Structure
const cartItems = [
    {
        id: "product_1",
        name: "Legacy Product",
        price: 100,
        quantity: 1,
        image: "/test.jpg",
        size: "M" // Legacy format
    },
    {
        id: "product_2",
        name: "New Product",
        price: 200,
        quantity: 1,
        image: "/test.jpg",
        variations: { "Color": "Red", "Size": "L" },
        variationId: JSON.stringify({ "Color": "Red", "Size": "L" })
    }
];

cartItems.forEach(item => {
    try {
        console.log(`\nTesting Render for: ${item.name}`);

        let output = "";
        if (item.variations && Object.keys(item.variations).length > 0) {
            output = Object.entries(item.variations)
                .map(([vName, vOption]) => `${vName}: ${vOption}`)
                .join(" | ");
            console.log("Rendered Variations:", output);
        } else if (item.size) {
            console.log("Rendered Legacy Size:", item.size);
        } else {
            console.log("No variations or size.");
        }

        const rmId = item.variationId || `${item.id}-fallback`;
        console.log(`Key / Fallback ID: ${rmId}`);

    } catch (e) {
        console.error("CRASH during render mock:", e);
    }
});
