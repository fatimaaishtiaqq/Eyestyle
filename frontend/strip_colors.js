import fs from 'fs';
import path from 'path';

const targetDirs = [
    'c:/Users/Mysterious/Desktop/New folder/luxury-ecommerce/frontend/src/pages',
    'c:/Users/Mysterious/Desktop/New folder/luxury-ecommerce/frontend/src/components',
    'c:/Users/Mysterious/Desktop/New folder/luxury-ecommerce/frontend/src/admin/pages',
    'c:/Users/Mysterious/Desktop/New folder/luxury-ecommerce/frontend/src/admin/components'
];

// Aggressively map EVERYTHING to the approved palette
const replacements = [
    // RGBA Opacities that look gray
    { regex: /text-\[rgba\(20,33,61,0\.\d\)\]/g, replacement: 'text-primary' },
    { regex: /bg-\[rgba\(20,33,61,0\.\d\)\]/g, replacement: 'bg-surface' },
    { regex: /border-\[rgba\(20,33,61,0\.\d\)\]/g, replacement: 'border-surface' },
    { regex: /text-\[#999999\]/g, replacement: 'text-primary' },
    { regex: /bg-\[#999999\]/g, replacement: 'bg-primary' },

    // Primary opacities
    { regex: /text-primary\/\d{2}/g, replacement: 'text-primary' },
    { regex: /bg-primary\/\d{2}/g, replacement: 'bg-primary' },
    { regex: /bg-surface\/\d{2}/g, replacement: 'bg-surface' },

    // Grays
    { regex: /text-gray-\d{2,3}/g, replacement: 'text-primary' },
    { regex: /bg-gray-\d{2,3}/g, replacement: 'bg-surface' },
    { regex: /border-gray-\d{2,3}/g, replacement: 'border-surface' },
    { regex: /hover:text-gray-\d{2,3}/g, replacement: 'hover:text-black' },
    { regex: /hover:bg-gray-\d{2,3}/g, replacement: 'hover:bg-surface' },
    { regex: /hover:border-gray-\d{2,3}/g, replacement: 'hover:border-black' },

    // Reds
    { regex: /text-red-\d{2,3}/g, replacement: 'text-black' },
    { regex: /bg-red-\d{2,3}/g, replacement: 'bg-surface' },
    { regex: /border-red-\d{2,3}/g, replacement: 'border-black' },
    { regex: /hover:text-red-\d{2,3}/g, replacement: 'hover:text-primary' },
    { regex: /hover:bg-red-\d{2,3}/g, replacement: 'hover:bg-black' },
    { regex: /hover:border-red-\d{2,3}/g, replacement: 'hover:border-primary' },

    // Greens
    { regex: /text-green-\d{2,3}/g, replacement: 'text-primary' },
    { regex: /bg-green-\d{2,3}/g, replacement: 'bg-surface' },
    { regex: /border-green-\d{2,3}/g, replacement: 'border-primary' },
    { regex: /hover:text-green-\d{2,3}/g, replacement: 'hover:text-black' },
    { regex: /hover:bg-green-\d{2,3}/g, replacement: 'hover:bg-surface' },
    { regex: /hover:border-green-\d{2,3}/g, replacement: 'hover:border-black' },

    // Blue
    { regex: /text-blue-\d{2,3}/g, replacement: 'text-primary' },
    { regex: /bg-blue-\d{2,3}/g, replacement: 'bg-surface' },
    { regex: /border-blue-\d{2,3}/g, replacement: 'border-primary' },
    { regex: /hover:text-blue-\d{2,3}/g, replacement: 'hover:text-black' },

    // Purple
    { regex: /text-purple-\d{2,3}/g, replacement: 'text-primary' },
    { regex: /bg-purple-\d{2,3}/g, replacement: 'bg-surface' },

    // Emerald
    { regex: /text-emerald-\d{2,3}/g, replacement: 'text-primary' },
    { regex: /bg-emerald-\d{2,3}/g, replacement: 'bg-surface' },
    { regex: /border-emerald-\d{2,3}/g, replacement: 'border-primary' },

    // Misc
    { regex: /border-\[var\(--color-surface\)\]/g, replacement: 'border-surface' },
    { regex: /bg-orange-\d{2,3}/g, replacement: 'bg-surface' },
    { regex: /text-orange-\d{2,3}/g, replacement: 'text-primary' },

];

function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            for (const rule of replacements) {
                if (rule.regex.test(content)) {
                    content = content.replace(rule.regex, rule.replacement);
                    changed = true;
                }
            }

            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Aggressively updated colors in ${file}`);
            }
        }
    }
}

targetDirs.forEach(dir => processDirectory(dir));
console.log('Strict Color replacement complete.');
