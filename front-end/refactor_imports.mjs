import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walk(filePath, fileList);
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const files = walk(srcDir);
let changedCount = 0;

for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;

    // Matches strings preceded by 'from ' or 'import ' containing ../ 
    // And also dynamic imports
    let prevContent = content;
    
    // Pattern designed to capture all imports using ../ and ../../ and convert them
    // It captures group 1 (prefix of string and quote), group 2 (path), group 3 (closing quote)
    content = content.replace(/(from\s+['"]|import\s+['"]|import\(['"])([^'"]+)(['"])/g, (match, prefix, modulePath, suffix) => {
        if (modulePath.startsWith('../')) {
            const currentDir = path.dirname(filePath);
            const absoluteResolvedPath = path.resolve(currentDir, modulePath);
            
            if (absoluteResolvedPath.startsWith(srcDir) || absoluteResolvedPath === srcDir) {
                const relativeToSrc = path.relative(srcDir, absoluteResolvedPath);
                
                // If it resolves strictly to srcDir, it becomes @/
                // Otherwise @/relative
                const newImportPath = relativeToSrc === '' ? '@' : '@/' + relativeToSrc.replace(/\\/g, '/');
                
                return prefix + newImportPath + suffix;
            }
        }
        return match;
    });

    if (content !== prevContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        changedCount++;
        console.log(`Updated: ${path.relative(srcDir, filePath)}`);
    }
}

console.log(`Done! Updated ${changedCount} files.`);
