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
    let prevContent = content;

    content = content.replace(/@\/funcionalidades\/(compartilhado|utilitarios|configuracoes|contexto)/g, '@/$1');

    if (content !== prevContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        changedCount++;
        console.log(`Updated: ${path.relative(srcDir, filePath)}`);
    }
}

console.log(`Done! Fixed ${changedCount} files.`);
