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
    
    // Replace `Rs. {` with `${` *ONLY* inside backtick strings
    // `gs` flag handles multi-line template literals
    let newContent = content.replace(/`([^`]+)`/gs, (match) => {
        return match.replace(/Rs\. \{/g, '${');
    });

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        changedFiles++;
        console.log('Fixed template literals in:', file);
    }
});

console.log('Total files repaired:', changedFiles);
