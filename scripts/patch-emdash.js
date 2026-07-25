import fs from 'node:fs';
import path from 'node:path';

function patchFile(filePath, searchStr, replaceStr) {
	if (!fs.existsSync(filePath)) return;
	const content = fs.readFileSync(filePath, 'utf8');
	if (content.includes(searchStr)) {
		const newContent = content.replaceAll(searchStr, replaceStr);
		fs.writeFileSync(filePath, newContent, 'utf8');
		console.log(`[patch-emdash] Successfully patched ${filePath}`);
	}
}

function findAndPatch(dir) {
	if (!fs.existsSync(dir)) return;
	const files = fs.readdirSync(dir, { recursive: true });
	for (const file of files) {
		const fullPath = path.join(dir, file);
		if (fs.statSync(fullPath).isFile() && (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.ts'))) {
			patchFile(fullPath, 'adapter.constructor.name === "PostgresAdapter"', 'adapter.constructor.name.includes("Postgres")');
			patchFile(fullPath, 'adapter.constructor.name==="PostgresAdapter"', 'adapter.constructor.name.includes("Postgres")');
		}
	}
}

const emdashDir = path.resolve('node_modules/emdash');
if (fs.existsSync(emdashDir)) {
	console.log('[patch-emdash] Patching emdash package...');
	findAndPatch(emdashDir);
} else {
	console.log('[patch-emdash] emdash package not found in node_modules.');
}
