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
    
    let newContent = content
        // 1. JSX text nodes immediately after tags: `>$10` or `>${price}`
        .replace(/>\$(?=\d|\{)/g, '>Rs. ')
        
        // 2. JSX text nodes at the beginning of a line (e.g., multiline formatting)
        .replace(/(^\s+)\$(?=\d|\{)/gm, '$1Rs. ')
        
        // 3. Spaced pricing or parenthesized (e.g. ` ($10)` or ` $10`)
        .replace(/ \$(?=\d|\{)/g, ' Rs. ')
        .replace(/\(\$(?=\d|\{)/g, '(Rs. ')
        
        // 4. Specific known hardcodes
        .replace(/'\$0\.00'/g, "'Rs. 0.00'")
        .replace(/'\$0'/g, "'Rs. 0'")
        .replace(/\$100/g, 'Rs. 100')
        .replace(/\$300/g, 'Rs. 300')
        .replace(/\$150/g, 'Rs. 150')
        .replace(/\$15/g, 'Rs. 15')
        
        // 5. Template literals where it's explicitly a price: \`$${price}\`
        .replace(/`\$(\$\{)/g, '`Rs. $1');

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        changedFiles++;
        console.log('Updated:', file);
    }
});

console.log('Total files changed:', changedFiles);
