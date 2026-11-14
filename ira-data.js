import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, doc, setDoc, deleteDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig, COLECOES, IMAGE_BASE, PLANOS, CATEGORIAS, BRAND, planoTem, MODO_DADOS } from "./config.js";

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { COLECOES, IMAGE_BASE, PLANOS, CATEGORIAS, BRAND };

const timeout = (promise, ms = 5000) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error("tempo esgotado")), ms))
]);
const localKey = (name) => `guia-busca:${name}`;
const readLocal = (name, fallback = []) => {
  try { return JSON.parse(localStorage.getItem(localKey(name)) || "null") ?? fallback; } catch { return fallback; }
};
const writeLocal = (name, value) => { try { localStorage.setItem(localKey(name), JSON.stringify(value)); } catch {} };

const categoryMap = new Map([
  ["comida", "alimentacao"], ["alimentação", "alimentacao"], ["alimentacao", "alimentacao"],
  ["mercado", "comercio"], ["lojas", "comercio"], ["comércio", "comercio"], ["comercio", "comercio"],
  ["bebidas", "alimentacao"], ["serviços", "servicos"], ["servicos", "servicos"],
  ["saúde", "saude"], ["saude", "saude"], ["casa e obra", "casa-obra"], ["casa-obra", "casa-obra"],
  ["beleza", "beleza"], ["educação", "educacao"], ["educacao", "educacao"], ["pets", "pets"], ["eventos", "eventos"]
]);
const categoryId = (value = "") => categoryMap.get(String(value).toLowerCase()) || String(value).toLowerCase().replace(/\s+/g, "-");
const categoryName = (value = "") => CATEGORIAS.find((item) => item.id === categoryId(value))?.nome || value || "Serviços";
const safeSite = (value = "") => { let v = String(value || "").trim(); if (!v) return ""; if (!/^https?:\/\//i.test(v)) { if (!/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v)) return ""; v = "https://" + v; } try { return new URL(v).href; } catch { return ""; } };
const safeUrl = (value = "") => { const v = String(value || "").trim(); return /^https?:\/\//i.test(v) ? v : ""; };
const asArray = (value) => Array.isArray(value) ? value : value ? String(value).split(",").map((item) => item.trim()).filter(Boolean) : [];

const geo = (v) => { const lat = Number(v?.lat), lng = Number(v?.lng); return Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng) ? { lat, lng } : null; };

export function normalizar(n, i = 0, hoje = new Date()) {
  const horarios = n.horarios;
  const vencido = n.plano && n.plano !== "gratis" && n.planoAte && new Date(`${n.planoAte}T23:59:59`) < hoje;
  const plano = vencido ? "gratis" : n.plano || "gratis";
  const fotosLimite = PLANOS[plano]?.photos || 1;
  const services = Array.isArray(n.servicosDetalhados) ? n.servicosDetalhados : asArray(n.servicos).map((item) => ({ nome: item, preco: "" }));
  return {
    id: n.id,
    name: n.nome || n.name || "Empresa sem nome",
    cat: categoryName(n.categoriaId || n.categoria || n.category),
    catId: categoryId(n.categoriaId || n.categoria || n.category),
    sub: n.subcategoria || n.sub || "",
    tags: asArray(n.servicos || n.tags),
    keywords: asArray(n.palavras || n.keywords),
    services,
    desc: n.descricao || n.desc || "",
    bairro: n.bairro || "",
    end: (n.endereco || n.end || "").replace(/^—$/, ""),
    t24: horarios === "24h",
    noHours: horarios === undefined || horarios === null,
    fonte: n.fonte || "",
    h: horarios === "24h" ? { wk: [0, 24], sat: [0, 24], sun: [0, 24] } : { wk: horarios?.seg_sex ?? horarios?.wk ?? null, sat: horarios?.sab ?? horarios?.sat ?? null, sun: horarios?.dom ?? horarios?.sun ?? null },
    phone: n.telefone || n.phone || "",
    plan: plano,
    planLabel: PLANOS[plano]?.label || plano,
    ver: n.fotosVersao || n.ver || "",
    n: [Number(n.nota?.media ?? n.rating) || 0, Number(n.nota?.qtd ?? n.reviews) || 0],
    t: n.entrega?.tempo || "",
    f: n.entrega ? Number(n.entrega.frete) || 0 : undefined,
    ret: !!n.retirada,
    orc: !!n.orcamento,
    delivery: !!n.entrega,
    photos: Math.min(fotosLimite, Math.max(1, Number(n.fotos) || 1)),
    ativo: n.ativo !== false,
    ordem: n.ordem ?? i,
    verified: !!(n.verificado || n.verified),
    tipo: TIPOS_NEGOCIO[n.tipoNegocio] ? n.tipoNegocio : "",
    cnpjConferido: !!n.cnpjConferido && !!soDigitos(n.cnpj) && cnpjValido(n.cnpj),
    cnpj: n.cnpjConferido && cnpjValido(n.cnpj) ? soDigitos(n.cnpj) : "",
    emergency: !!(n.emergencia || n.emergency),
    // Instagram: Presença+; Facebook: Destaque+ (config.js → features). No Gratuito, o WhatsApp aparece só como número.
    wa: n.whatsapp || n.wa || "",
    waBtn: planoTem(plano, "whatsapp"),
    social: {
      ...(planoTem(plano, "instagram") ? { instagram: safeUrl((n.redes || n.social || {}).instagram) } : {}),
      ...(planoTem(plano, "facebook") ? { facebook: safeUrl((n.redes || n.social || {}).facebook) } : {})
    },
    // Botão do site: só no Premium (config.js → features.site).
    site: planoTem(plano, "site") ? safeSite(n.site || n.website) : "",
    location: geo(n.localizacao || n.location),
    createdAt: n.createdAt || null,
    i
  };
}

// Modo de leitura (config.js > MODO_DADOS):
//   "ao-vivo"  : Firestore primeiro (empresa nova aparece na hora), data/negocios.json como reserva se o Firestore falhar.
//   "estatico" : data/negocios.json primeiro (0 leituras por visita), Firestore só se o arquivo faltar.
// Na URL, ?live força ao-vivo e ?estatico força estático (para conferência).
const paramUrl = (nome) => { try { return new URLSearchParams(location.search).has(nome); } catch { return false; } };
const querLive = () => paramUrl("live") || (MODO_DADOS === "ao-vivo" && !paramUrl("estatico"));

async function lerEstatico(arquivo) {
  // "no-cache" revalida com o servidor (ETag): barato e sempre atual depois de cada publicação.
  const response = await fetch(arquivo, { cache: "no-cache" });
  if (!response.ok) throw new Error(arquivo + " respondeu " + response.status);
  return response.json();
}

async function negociosDoFirestore() {
  const snap = await timeout(getDocs(collection(db, COLECOES.negocios)));
  return snap.docs.map((item) => ({ ...item.data(), id: item.id }));
}

export async function carregarNegocios({ live = querLive() } = {}) {
  let fonte = "";
  let docs = [];
  const tentativas = live ? ["firestore", "estatico"] : ["estatico", "firestore"];
  for (const tentativa of tentativas) {
    try {
      if (tentativa === "estatico") {
        docs = (await lerEstatico("data/negocios.json")).negocios || [];
        if (docs.length) fonte = "arquivo estático (data/negocios.json)";
      } else {
        docs = await negociosDoFirestore();
        if (docs.length) fonte = "Firestore (ao vivo)";
      }
    } catch (error) {
      console.warn(tentativa + " indisponível:", error.message);
      docs = [];
    }
    if (docs.length) break;
  }
  const lista = docs.filter((item) => item.ativo !== false).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)).map(normalizar);
  return { lista, fonte: fonte || "nenhuma fonte disponível", raw: docs };
}

// A configuração local pode estar salva como objeto (salvarConteudoLocal) ou como lista de documentos (gravarDocumento).
const configLocal = () => {
  const valor = readLocal("configuracoes", {});
  return Array.isArray(valor) ? (valor.find((item) => item.id === "geral") || {}) : valor;
};

// live=false (site público): usa só data/conteudo.json, sem tocar no Firestore.
// live=true (painel administrativo): lê o Firestore, para o administrador ver o que acabou de editar.
export async function carregarConteudo({ live = false } = {}) {
  const fallback = { banners: [], novidades: [], plantoes: [], categorias: CATEGORIAS, configuracoes: {} };
  let estaticoOk = false;
  try {
    Object.assign(fallback, await lerEstatico("data/conteudo.json"));
    estaticoOk = true;
  } catch (error) {
    console.warn("Conteúdo estático indisponível:", error.message);
  }
  if (!live && estaticoOk) {
    return {
      banners: fallback.banners || [], novidades: fallback.novidades || [], plantoes: fallback.plantoes || [],
      categorias: fallback.categorias, configuracoes: { ...(fallback.configuracoes || {}) }
    };
  }
  const result = {};
  for (const [key, collectionName] of Object.entries({ banners: COLECOES.banners, novidades: COLECOES.novidades, plantoes: COLECOES.plantoes })) {
    try {
      const snap = await timeout(getDocs(collection(db, collectionName)), 2500);
      result[key] = snap.docs.length ? snap.docs.map((item) => ({ ...item.data(), id: item.id })) : (readLocal(key, fallback[key]) || fallback[key]);
    } catch {
      result[key] = readLocal(key, fallback[key]) || fallback[key];
    }
  }
  result.categorias = fallback.categorias;
  let remoto = {};
  try {
    const snap = await timeout(getDocs(collection(db, COLECOES.configuracoes)), 2500);
    const geral = snap.docs.find((item) => item.id === "geral");
    if (geral) remoto = geral.data();
  } catch { /* sem Firestore: usa o que está salvo neste navegador */ }
  result.configuracoes = { ...fallback.configuracoes, ...(Object.keys(remoto).length ? remoto : configLocal()) };
  return result;
}

export async function carregarColecao(nome, fallback = []) {
  try {
    const snap = await timeout(getDocs(collection(db, nome)), 4000);
    return snap.docs.map((item) => ({ ...item.data(), id: item.id }));
  } catch {
    return readLocal(nome, fallback);
  }
}

export async function gravarDocumento(collectionName, id, data) {
  const payload = { ...data, atualizadoEm: new Date().toISOString() };
  const key = Object.entries(COLECOES).find(([, value]) => value === collectionName)?.[0] || collectionName;
  const current = readLocal(key, []);
  const list = Array.isArray(current) ? current.filter((item) => item.id !== id) : [];
  writeLocal(key, [...list, { ...payload, id }]);
  try {
    await setDoc(doc(db, collectionName, id), payload, { merge: true });
    return { remote: true, id };
  } catch (error) {
    console.warn("Documento salvo apenas localmente:", error.message);
    return { remote: false, id };
  }
}

export async function removerDocumento(collectionName, id) {
  const key = Object.entries(COLECOES).find(([, value]) => value === collectionName)?.[0] || collectionName;
  const current = readLocal(key, []);
  writeLocal(key, Array.isArray(current) ? current.filter((item) => item.id !== id) : []);
  try { await deleteDoc(doc(db, collectionName, id)); } catch (error) { console.warn("Exclusão remota indisponível:", error.message); }
}

const versionQuery = (version) => version ? `?v=${encodeURIComponent(version)}` : "";
export const urlFoto = (id, index, version = "") => `${IMAGE_BASE}${id}/${String(index + 1).padStart(2, "0")}.webp${versionQuery(version)}`;
export const urlLogo = (id, version = "") => `${IMAGE_BASE}${id}/logo.webp${versionQuery(version)}`;

/* ---- Métricas do piloto: contadores diários anônimos (sem cookies, sem identificar ninguém) ---- */
const diaHoje = () => new Date().toLocaleDateString("sv-SE"); // AAAA-MM-DD no fuso do aparelho
const limparOrigem = (o) => String(o || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 20);

async function somarMetrica({ visitas = 0, unicos = 0, buscas = 0, buscasVazias = 0 }, origem = "") {
  const dia = diaHoje();
  const dados = { dia, visitas: increment(visitas), unicos: increment(unicos), buscas: increment(buscas), buscasVazias: increment(buscasVazias) };
  const o = limparOrigem(origem);
  if (o && visitas) dados.origens = { [o]: increment(1) };
  await setDoc(doc(db, COLECOES.metricas, dia), dados, { merge: true });
}

// Uma visita por sessão do navegador; "único" = primeira visita do aparelho no dia.
export async function registrarVisita(origem = "") {
  try {
    if (sessionStorage.getItem("guia-busca:visita")) return;
    sessionStorage.setItem("guia-busca:visita", "1");
    let novo = 1;
    try {
      const dia = diaHoje();
      if (localStorage.getItem("guia-busca:visto") === dia) novo = 0; else localStorage.setItem("guia-busca:visto", dia);
    } catch { /* sem armazenamento: conta como novo */ }
    await somarMetrica({ visitas: 1, unicos: novo }, origem);
  } catch { /* métrica nunca pode atrapalhar o uso */ }
}

// Guarda o que a pessoa procurou e se havia resultado: mostra no painel quais empresas faltam no guia.
const buscasDaSessao = new Set();
export async function registrarBusca(termo, resultados) {
  try {
    const t = String(termo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (t.length < 3 || buscasDaSessao.has(t) || buscasDaSessao.size >= 15) return;
    buscasDaSessao.add(t);
    const n = Math.max(0, Math.min(9999, Number(resultados) | 0));
    await Promise.all([
      somarMetrica({ buscas: 1, buscasVazias: n === 0 ? 1 : 0 }),
      addDoc(collection(db, COLECOES.buscas), { termo: t, resultados: n, criadoEm: serverTimestamp() })
    ]);
  } catch { /* idem */ }
}

export async function registrarContato(negocioId, tipo, origem = "app") {
  try {
    await addDoc(collection(db, COLECOES.contatos), { negocioId, tipo, origem, criadoEm: serverTimestamp() });
  } catch { /* analytics não pode impedir a conversão */ }
}

/* Tipo de negócio e CNPJ (opcional). O CNPJ é dado público de empresa; CPF nunca é coletado. */
export const TIPOS_NEGOCIO = {
  cnpj: "Empresa com CNPJ",
  mei: "MEI",
  autonomo: "Profissional autônomo",
  naotem: "Ainda não formalizado"
};
export const soDigitos = (v) => String(v || "").replace(/\D/g, "");
export function cnpjValido(valor) {
  const c = soDigitos(valor);
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const dv = (base) => {
    let soma = 0, peso = base.length - 7;
    for (const d of base) { soma += Number(d) * peso--; if (peso < 2) peso = 9; }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(c.slice(0, 12)) === Number(c[12]) && dv(c.slice(0, 13)) === Number(c[13]);
}
export const formatarCnpj = (v) => soDigitos(v).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, "$1.$2.$3/$4-$5");

export async function enviarCadastro({ nome, categoria, whatsapp, plano = "gratis", periodo = 1, aceite = false, origem = "", ...extra }) {
  const planoValido = PLANOS[plano] ? plano : "gratis";
  const payload = { nome: String(nome).slice(0, 80), categoria: String(categoria).slice(0, 40), whatsapp: String(whatsapp).slice(0, 25), plano: planoValido, aceite: aceite === true, status: "novo", criadoEm: serverTimestamp() };
  const meses = [1, 3, 6, 12].includes(Number(periodo)) ? Number(periodo) : 1;
  if (planoValido !== "gratis") payload.periodo = meses;
  const o = String(origem || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  if (o) payload.origem = o;
  // Dados opcionais que o dono já informa no pedido (a equipe só confere e publica).
  const LIMITES = { bairro: 60, endereco: 120, horario: 80, servicos: 200, descricao: 300, telefone: 16, site: 120, instagram: 80 };
  for (const [k, max] of Object.entries(LIMITES)) {
    const v = String(extra[k] || "").trim().slice(0, max);
    if (v) payload[k] = v;
  }
  if (TIPOS_NEGOCIO[extra.tipoNegocio]) payload.tipoNegocio = extra.tipoNegocio;
  const cnpj = soDigitos(extra.cnpj);
  if (cnpj && cnpjValido(cnpj)) payload.cnpj = cnpj;
  await addDoc(collection(db, COLECOES.cadastros), payload);
}

export const salvarConteudoLocal = (key, value) => writeLocal(key, value);
