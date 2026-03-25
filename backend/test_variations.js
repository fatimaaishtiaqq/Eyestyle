// Test creating a product with nested variations
async function testVariations() {
    console.log("Starting backend variations test...");

    try {
        // 1. Login to get token
        const loginRes = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@luxurystore.com', password: 'password123' })
        });

        if (!loginRes.ok) {
            console.error("Login failed, make sure admin exists with password123");
            return;
        }

        const userData = await loginRes.json();
        const token = userData.token;

        // 2. Fetch categories to get a valid ID
        const catRes = await fetch('http://localhost:5000/api/categories/admin', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const categories = await catRes.json();
        const categoryId = categories.length > 0 ? categories[0]._id : null;

        if (!categoryId) {
            console.error("No categories found to attach product to.");
            return;
        }

        // 3. Create the product with complex variations
        const productPayload = {
            name: "Test Variation Specs",
            price: 500,
            brand: "LuxTest",
            category: categoryId,
            countInStock: 10,
            description: "A test product for the new variations array",
            images: ["/images/sample.jpg"],
            details: ["Test Detail 1"],
            variations: [
                {
                    name: "Frame Color",
                    options: ["Tortoise", "Matte Black", "Crystal"]
                },
                {
                    name: "Lens Type",
                    options: ["Polarized", "Standard", "Transition"]
                }
            ]
        };

        console.log("Sending payload:", JSON.stringify(productPayload.variations, null, 2));

        const createRes = await fetch('http://localhost:5000/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productPayload)
        });

        if (!createRes.ok) {
            const err = await createRes.json();
            console.error("Failed to create product:", err);
            return;
        }

        const newProduct = await createRes.json();
        console.log(`\nSuccess! Created product ID: ${newProduct._id}`);
        console.log(`Saved Variations Array:`);
        console.log(JSON.stringify(newProduct.variations, null, 2));

        if (newProduct.variations.length === 2 && newProduct.variations[1].options.length === 3) {
            console.log("\n✅ Variations schema successfully validated and saved to DB!");
        } else {
            console.log("\n❌ Variations schema mismatch in DB response.");
        }

    } catch (e) {
        console.error("Script error:", e);
    }
}

testVariations();
