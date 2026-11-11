// The click-to-edit website editor.
//
// Reads the site's own files from GitHub, draws the real page with the same
// templates Jekyll uses (render.js), and - in later steps - lets the client
// click any text or picture to change it, then publish as one commit.
//
// Settings come from ../admin/config.yml (the same file the backup editor
// at /admin/ uses): which repo and branch, the sign-in worker, and every
// section type and field.

import YAML from "https://unpkg.com/yaml@2.9.1/browser/index.js";
import { Liquid } from "https://cdn.jsdelivr.net/npm/liquidjs@10.30.0/dist/liquid.browser.mjs";
import { Marked } from "https://cdn.jsdelivr.net/npm/marked@18.1.2/lib/marked.esm.js";
import { makeRenderer, splitFrontMatter } from "./render.js";

const $ = (id) => document.getElementById(id);
const SITE_ROOT = new URL("../", location.href).href;
const TOKEN_KEY = "site-editor.token";

const state = {
  config: null,   // admin/config.yml, parsed
  repo: "",       // owner/name
  branch: "",
  token: "",
  files: new Map(),   // repo path -> text, for everything the renderer reads
  render: null,
  pages: [],      // [{ path, title }]
  current: "",    // path of the page on screen
};

// ---------------------------------------------------------------- status ---
let statusTimer;
function say(msg, { sticky = false } = {}) {
  $("status").textContent = msg;
  clearTimeout(statusTimer);
  if (!sticky && msg) statusTimer = setTimeout(() => ($("status").textContent = ""), 4000);
}
function show(screen) {
  for (const id of ["screen-signin", "screen-loading", "frame-wrap"]) $(id).hidden = id !== screen;
  $("bar").hidden = screen !== "frame-wrap";
}
function loading(text) {
  $("loading-text").textContent = text;
  show("screen-loading");
}
function fail(text) {
  loading(text);
  document.querySelector("#screen-loading .spinner").hidden = true;
}

// --------------------------------------------------------------- sign-in ---
// Signed in to the backup editor already? Use that, so it's one sign-in for both.
function storedToken() {
  try {
    const sveltia = JSON.parse(localStorage.getItem("sveltia-cms.user") || "null");
    if (sveltia?.backendName === "github" && sveltia.token) return sveltia.token;
  } catch {}
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}

// Same popup handshake Sveltia/Decap use, so each client's existing sign-in
// worker works unchanged: the popup says "authorizing", we echo it back, and
// it answers with the token.
function signInPopup() {
  const { base_url, auth_endpoint = "auth" } = state.config.backend;
  const url = new URL(auth_endpoint, base_url.replace(/\/?$/, "/"));
  url.searchParams.set("provider", "github");
  url.searchParams.set("site_id", location.hostname);
  url.searchParams.set("scope", "repo");
  const popup = window.open(url, "site-editor-signin", "width=600,height=760");
  if (!popup) return Promise.reject(new Error("Your browser blocked the sign-in window. Allow pop-ups for this site and try again."));
  const workerOrigin = url.origin;
  return new Promise((resolve, reject) => {
    function onMessage(e) {
      if (e.origin !== workerOrigin || typeof e.data !== "string") return;
      if (e.data === "authorizing:github") return popup.postMessage(e.data, e.origin);
      const m = e.data.match(/^authorization:github:(success|error):(.*)$/s);
      if (!m) return;
      window.removeEventListener("message", onMessage);
      let body = {};
      try { body = JSON.parse(m[2]); } catch {}
      if (m[1] === "success" && body.token) resolve(body.token);
      else reject(new Error(body.error || "Sign-in didn't finish. Please try again."));
    }
    window.addEventListener("message", onMessage);
  });
}

function askToSignIn(message = "") {
  show("screen-signin");
  $("signin-error").textContent = message;
  $("signin").onclick = async () => {
    $("signin-error").textContent = "";
    try {
      state.token = await signInPopup();
      try { localStorage.setItem(TOKEN_KEY, state.token); } catch {}
      await open();
    } catch (err) {
      $("signin-error").textContent = err.message;
    }
  };
}

// ---------------------------------------------------------------- GitHub ---
class SignedOut extends Error {}
async function gh(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${state.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...opts.headers,
    },
  });
  if (res.status === 401) throw new SignedOut();
  if (!res.ok) throw new Error(`GitHub said ${res.status} for ${path}`);
  return res.json();
}

const fromBase64 = (b64) =>
  new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

// Everything the renderer and editor read. Media files are not downloaded:
// the preview loads them from the live site.
const WANTED = /^(_layouts|_includes|_data|_content)\/.+\.(html|ya?ml)$|^_config\.yml$|^admin\/config\.yml$/;

async function loadFiles() {
  const tree = await gh(`/repos/${state.repo}/git/trees/${encodeURIComponent(state.branch)}?recursive=1`);
  const blobs = tree.tree.filter((t) => t.type === "blob" && WANTED.test(t.path));
  let done = 0;
  await Promise.all(blobs.map(async (b) => {
    const blob = await gh(`/repos/${state.repo}/git/blobs/${b.sha}`);
    state.files.set(b.path, fromBase64(blob.content));
    loading(`Loading your website… ${++done} of ${blobs.length}`);
  }));
}

// ---------------------------------------------------------------- render ---
function listPages() {
  state.pages = [...state.files.keys()]
    .filter((p) => p.startsWith("_content/"))
    .map((path) => ({ path, title: splitFrontMatter(state.files.get(path), YAML).data.title || path }))
    .sort((a, b) => (a.path.endsWith("/index.html") ? -1 : b.path.endsWith("/index.html") ? 1 : a.title.localeCompare(b.title)));
  $("page-select").replaceChildren(...state.pages.map((p) => new Option(p.title, p.path)));
}

async function draw() {
  const frame = $("frame");
  const scroll = frame.contentWindow?.scrollY ?? 0;
  let html;
  try {
    html = await state.render(state.current, { editing: true });
  } catch (err) {
    console.error(err);
    say("This page couldn't be shown. Your changes are safe; please let Blake know.", { sticky: true });
    return;
  }
  // Relative links, styles and pictures resolve against the live site.
  html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${SITE_ROOT}">`);
  frame.addEventListener("load", () => frame.contentWindow.scrollTo(0, scroll), { once: true });
  frame.srcdoc = html;
}

async function goTo(path) {
  state.current = path;
  $("page-select").value = path;
  await draw();
}

// ------------------------------------------------------------------ open ---
async function open() {
  try {
    loading("Loading your website…");
    await loadFiles();
    state.render = makeRenderer({ Liquid, Marked, YAML, files: state.files });
    listPages();
    show("frame-wrap");
    await goTo(state.pages[0].path);
  } catch (err) {
    if (err instanceof SignedOut) {
      try { localStorage.removeItem(TOKEN_KEY); } catch {}
      return askToSignIn("Your sign-in has expired. Please sign in again.");
    }
    console.error(err);
    fail(`The editor couldn't load your website (${err.message}). Check your internet connection and reload.`);
  }
}

async function start() {
  try {
    const res = await fetch(new URL("admin/config.yml", SITE_ROOT));
    state.config = YAML.parse(await res.text(), { merge: true });
  } catch {
    return fail("The editor's settings file is missing. Please let Blake know.");
  }
  state.repo = state.config.backend.repo;
  // ?branch= lets Blake try the editor on a test branch.
  state.branch = new URLSearchParams(location.search).get("branch") || state.config.backend.branch || "main";
  $("site-name").textContent = state.config.site_url ? new URL(state.config.site_url).hostname : "Your website";

  $("page-select").onchange = (e) => goTo(e.target.value);
  for (const [id, mobile] of [["view-desktop", false], ["view-mobile", true]]) {
    $(id).onclick = () => {
      $("frame-wrap").classList.toggle("mobile", mobile);
      $("view-desktop").setAttribute("aria-pressed", String(!mobile));
      $("view-mobile").setAttribute("aria-pressed", String(mobile));
    };
  }

  state.token = storedToken();
  if (state.token) open();
  else askToSignIn();
}

start();
