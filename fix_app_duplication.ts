
import fs from 'fs';

const filePath = 'C:\\Users\\MSI CYBORG\\.gemini\\antigravity\\scratch\\procurement\\App.tsx';
const fileContent = fs.readFileSync(filePath, 'utf-8');
const lines = fileContent.split('\n');

// We want to remove lines 416 to 601 (1-based index).
// In 0-based index: 415 to 600.
// Line 416 is index 415.
// Line 601 is index 600.
// We want to remove from index 415 up to (but not including) index 601?
// Wait, line 601 is "const isOwner ...". We want to remove it because line 415 is also "const isOwner ...".
// So we want to keep line 415 (index 414).
// Remove from 416 (index 415) to 601 (index 600).
// So splice(415, 601 - 416 + 1).
// 601 - 416 + 1 = 186 lines.

const startLine = 416;
const endLine = 601;
const startIndex = startLine - 1;
const deleteCount = endLine - startLine + 1;

console.log(`Removing lines ${startLine} to ${endLine} (indices ${startIndex} to ${startIndex + deleteCount - 1})`);
console.log(`Line ${startLine} content: ${lines[startIndex]}`);
console.log(`Line ${endLine} content: ${lines[startIndex + deleteCount - 1]}`);

lines.splice(startIndex, deleteCount);

fs.writeFileSync(filePath, lines.join('\n'));
console.log('File updated.');
