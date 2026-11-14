// Gera data/negocios.json e data/conteudo.json a partir do Firestore.
//
// Por que existe: o site público lê esses dois arquivos em vez de ler o banco a cada visita.
// Uma visita custa 0 leituras do Firestore; só este script lê o banco (1 leitura por documento, poucas vezes ao dia).
//
// Uso:   node scripts/exportar-dados.mjs            (Node 22.7 ou mais novo)
//        node scripts/exportar-dados.mjs --forcar   (aceita lista vazia; use só se quiser mesmo esvaziar o guia)
//
// Não precisa de senha nem de token: as regras do Firestore já deixam essas coleções públicas para leitura.
// O script só grava arquivos se algo mudou, para não gerar commits vazios.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { firebaseConfig, COLECOES } = await import(new URL("../config.js", import.meta.url));

const BASE = process.env.FIRESTORE_BASE
  || `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
const FORCAR = process.argv.includes("--forcar");

// Converte o formato tipado da API REST ({stringValue:"x"}) em JSON comum.
export function decodificar(v) {
  if (v === null || v === undefined) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("geoPointValue" in v) return { lat: v.geoPointValue.latitude, lng: v.geoPointValue.longitude };
  if ("referenceValue" in v) return v.referenceValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(decodificar);
  if ("mapValue" in v) return decodificarCampos(v.mapValue.fields || {});
  return null;
}
export function decodificarCampos(campos) {
  return Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, decodificar(v)]));
}

async function lerColecao(nome) {
  const docs = [];
  let pageToken = "";
  do {
    const url = new URL(`${BASE}/${nome}`);
    url.searchParams.set("pageSize", "300");
    url.searchParams.set("key", firebaseConfig.apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`${nome}: HTTP ${resposta.status} ${(await resposta.text()).slice(0, 200)}`);
    const json = await resposta.json();
    for (const d of json.documents || []) {
      docs.push({ ...decodificarCampos(d.fields || {}), id: d.name.split("/").pop() });
    }
    pageToken = json.nextPageToken || "";
  } while (pageToken);
  return docs;
}

async function lerJsonLocal(arquivo, padrao) {
  try { return JSON.parse(await readFile(resolve(raiz, arquivo), "utf8")); } catch { return padrao; }
}

async function gravarSeMudou(arquivo, texto) {
  const caminho = resolve(raiz, arquivo);
  let atual = "";
  try { atual = await readFile(caminho, "utf8"); } catch { /* arquivo novo */ }
  if (atual === texto) { console.log(`= ${arquivo}: sem mudanças`); return false; }
  await mkdir(dirname(caminho), { recursive: true });
  await writeFile(caminho, texto, "utf8");
  console.log(`✓ ${arquivo}: atualizado (${(texto.length / 1024).toFixed(1)} KB)`);
  return true;
}

const porOrdem = (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || String(a.id).localeCompare(String(b.id));
// Um objeto por linha: o diff do Git mostra exatamente qual empresa mudou.
const linhas = (lista) => "[\n" + lista.map((x) => "    " + JSON.stringify(x)).join(",\n") + "\n  ]";

async function principal() {
  const [todosNegocios, banners, novidades, plantoes, configs] = await Promise.all([
    lerColecao(COLECOES.negocios), lerColecao(COLECOES.banners), lerColecao(COLECOES.novidades),
    lerColecao(COLECOES.plantoes), lerColecao(COLECOES.configuracoes)
  ]);

  // Empresas desativadas não vão para o arquivo público.
  const negocios = todosNegocios.filter((n) => n.ativo !== false).sort(porOrdem);
  if (!negocios.length && !FORCAR) {
    console.warn("Nenhuma empresa ativa encontrada. Para não esvaziar a lista de reserva por engano, nada foi gravado. Use --forcar se for intencional.");
    return;
  }

  const antigoNegocios = await lerJsonLocal("data/negocios.json", {});
  const textoNegocios = `{\n  "categorias": ${JSON.stringify(antigoNegocios.categorias || [])},\n  "negocios": ${linhas(negocios)}\n}\n`;

  const antigoConteudo = await lerJsonLocal("data/conteudo.json", {});
  const geral = configs.find((c) => c.id === "geral");
  const { id: _ignorado, ...configuracoes } = geral || {};
  const conteudo = {
    banners: banners.sort(porOrdem),
    novidades: novidades.sort(porOrdem),
    plantoes: plantoes.sort(porOrdem),
    categorias: antigoConteudo.categorias || [],
    configuracoes: geral ? configuracoes : (antigoConteudo.configuracoes || {})
  };
  const textoConteudo = JSON.stringify(conteudo, null, 2) + "\n";

  const mudou = [await gravarSeMudou("data/negocios.json", textoNegocios), await gravarSeMudou("data/conteudo.json", textoConteudo)];
  console.log(`${negocios.length} empresa(s) ativa(s), ${banners.length} banner(s), ${novidades.length} novidade(s), ${plantoes.length} plantão(ões).`);
  if (!mudou.some(Boolean)) console.log("Nada a publicar.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  principal().catch((erro) => { console.error("Falhou:", erro.message); process.exit(1); });
}
