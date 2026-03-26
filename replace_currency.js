const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('C:\\Users\\Mysterious\\Downloads\\luxury-ecommerce\\frontend\\src');
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Safety check: Don't replace things that might break code (like `${` inside JS logic unless we know it's a template string price)
    let newContent = content
        // 1. JSX text nodes: `>$` -> `>Rs. `
        // Example: <span>$</span> -> <span>Rs. </span>
        // Example: <span>${total}</span> -> <span>Rs. {total}</span>
        .replace(/>\$(?=\{|\d|<\/)/g, '>Rs. ')
        
        // 2. Template Strings: \`$${\` -> \`Rs. ${\`
        // Example: \`$${price.toFixed(2)}\` -> \`Rs. ${price.toFixed(2)}\`
        .replace(/`\$(\$\{)/g, '`Rs. $1')
        
        // 3. String literals and specific cases
        .replace(/'\$0\.00'/g, "'Rs. 0.00'")
        .replace(/'\$0'/g, "'Rs. 0'")
        .replace(/\$100/g, 'Rs. 100')
        .replace(/\$300/g, 'Rs. 300')
        .replace(/\$150/g, 'Rs. 150')
        .replace(/\$15/g, 'Rs. 15')
        
        // 4. WhatsApp Message Templates in Checkout.jsx
        .replace(/\|  Price: \$/g, '|  Price: Rs. ')
        .replace(/Subtotal: \$/g, 'Subtotal: Rs. ')
        .replace(/Shipping: \$/g, 'Shipping: Rs. ')
        .replace(/Taxes: \$/g, 'Taxes: Rs. ')
        .replace(/TOTAL DUE: \$/g, 'TOTAL DUE: Rs. ')
        
        // 5. Some text gaps
        .replace(/ \$(?=\d)/g, ' Rs. ')
        .replace(/\(\$/g, '(Rs. ')
        .replace(/"\$/g, '"Rs. ')
        
        // 6. JSX specific cases where `$` is at start of line or padded
        .replace(/([ \t]+)\$(\{)/g, '$1Rs. $2'); // Indented ${price}

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        changedFiles++;
        console.log('Updated:', file);
    }
});

console.log('Total files changed:', changedFiles);
