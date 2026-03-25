import fs from 'fs';
import path from 'path';

const targetDirs = [
    'c:/Users/Mysterious/Desktop/New folder/luxury-ecommerce/frontend/src/pages',
    'c:/Users/Mysterious/Desktop/New folder/luxury-ecommerce/frontend/src/components',
    'c:/Users/Mysterious/Desktop/New folder/luxury-ecommerce/frontend/src/admin/pages',
    'c:/Users/Mysterious/Desktop/New folder/luxury-ecommerce/frontend/src/admin/components'
];

const replacements = {
    'text-gray-200': 'text-primary/30',
    'text-gray-300': 'text-primary/40',
    'text-gray-400': 'text-[rgba(20,33,61,0.5)]',
    'text-gray-500': 'text-[rgba(20,33,61,0.6)]',
    'text-gray-600': 'text-[rgba(20,33,61,0.7)]',
    'text-gray-700': 'text-[rgba(20,33,61,0.8)]',
    'bg-gray-50/50': 'bg-surface/50',
    'bg-gray-50': 'bg-surface',
    'bg-gray-100': 'bg-surface',
    'border-gray-50': 'border-surface',
    'border-gray-100': 'border-surface',
    'border-gray-200': 'border-surface',
    'border-gray-300': 'border-[var(--color-surface)]',
    'text-\\[#999999\\]': 'text-[rgba(20,33,61,0.5)]',
    'bg-\\[#999999\\]': 'bg-[rgba(20,33,61,0.5)]',
    'text-text-primary': 'text-black',
    'bg-text-primary': 'bg-black',
    'border-text-primary': 'border-black'
};

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

            for (const [key, value] of Object.entries(replacements)) {
                const regex = new RegExp(key.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, value);
                    changed = true;
                }
            }

            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated colors in ${file}`);
            }
        }
    }
}

targetDirs.forEach(dir => processDirectory(dir));
console.log('Color replacement complete.');
