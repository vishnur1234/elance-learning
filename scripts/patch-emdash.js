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
			patchFile(fullPath, 'src: isLocal ? itemUrl : undefined,', 'src: itemUrl,');
			patchFile(fullPath, 'previewUrl: isLocal ? undefined : itemUrl,', 'previewUrl: itemUrl,');
			// Fix upload response unwrap (data.data.item instead of data.item)
			patchFile(fullPath, 'if (!data.item) throw new Error("Upload failed");\n      var item = data.item;', 'var item = data && data.data && data.data.item ? data.data.item : (data && data.item);\n      if (!item) throw new Error((data && data.error && data.error.message) || "Upload failed");');
			patchFile(fullPath, 'if (!data.item) throw new Error("Upload failed");var item = data.item;', 'var item = data && data.data && data.data.item ? data.data.item : (data && data.item);if (!item) throw new Error((data && data.error && data.error.message) || "Upload failed");');
			// Fix media library response unwrap (data.data.items instead of data.items)
			patchFile(fullPath, 'var items = data.items || [];', 'var items = (data && data.data && data.data.items) || (data && data.items) || [];');
			// Fix alt text edit for unsaved/default images
			patchFile(
				fullPath,
				`if (currentValue) {\n          var updated = Object.assign({}, currentValue, { alt: newAlt });\n          saveField(collection, id, field, updated);\n          if (imgEl) imgEl.alt = newAlt;\n        }`,
				`var baseVal = currentValue || { src: (imgEl ? imgEl.src : "") };\n        var updated = Object.assign({}, baseVal, { alt: newAlt });\n        saveField(collection, id, field, updated);\n        if (imgEl) imgEl.alt = newAlt;`
			);
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
