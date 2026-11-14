// Troca o endereço do site em todos os lugares de uma vez (config.js, canonical e og: do index.html, sitemap.xml, robots.txt).
// Uso:  node scripts/definir-endereco.mjs https://meusite.com.br
//       node scripts/definir-endereco.mjs https://guiabusca.github.io/guiabusca
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entrada = process.argv[2];
if (!entrada || !/^https:\/\/[a-z0-9.-]+(\/[a-z0-9._~\/-]*)?$/i.test(entrada)) {
  console.error("Uso: node scripts/definir-endereco.mjs https://seusite.com.br   (começa com https://, sem barra no final)");
  process.exit(1);
}
const base = entrada.replace(/\/+$/, "");

async function editar(arquivo, fn) {
  const caminho = resolve(raiz, arquivo);
  const antes = await readFile(caminho, "utf8");
  const depois = fn(antes);
  if (depois === antes) { console.log(`= ${arquivo}: já estava assim`); return; }
  await writeFile(caminho, depois, "utf8");
  console.log(`✓ ${arquivo}`);
}

await editar("config.js", (s) => s.replace(/(siteUrl:\s*")[^"]*(")/, `$1${base}$2`));
await editar("index.html", (s) => s
  .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${base}/$2`)
  .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${base}/$2`)
  .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${base}/og-image.png$2`));
await editar("sitemap.xml", (s) => s
  .replace(/<loc>[^<]*\/privacidade\.html<\/loc>/, `<loc>${base}/privacidade.html</loc>`)
  .replace(/<loc>[^<]*\/<\/loc>/, `<loc>${base}/</loc>`));
await editar("robots.txt", (s) => s.replace(/Sitemap:.*/, `Sitemap: ${base}/sitemap.xml`));
console.log(`\nEndereço do site definido como ${base}`);
