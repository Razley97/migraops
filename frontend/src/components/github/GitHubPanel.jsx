import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { LANGS } from "../../config/languages.js";

/* ── helpers ─────────────────────────────────────────────── */

var STORAGE_KEY = "migraops:gh-token";

var EXCLUDE_DIRS = [
  "node_modules/", ".git/", "dist/", "build/", "__pycache__/",
  ".next/", ".nuxt/", "vendor/", ".venv/", "venv/", ".idea/",
  ".vscode/", "target/", "bin/obj/", ".gradle/", ".cache/"
];

var EXCLUDE_EXT = [
  ".class", ".pyc", ".pyo", ".exe", ".dll", ".so", ".dylib",
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".zip", ".tar", ".gz", ".rar", ".7z",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".mp3", ".mp4", ".avi", ".mov", ".wav",
  ".lock", ".map", ".min.js", ".min.css"
];

/* build an extension set from LANGS */
var CODE_EXT_SET = (function () {
  var s = {};
  Object.keys(LANGS).forEach(function (k) {
    LANGS[k].x.forEach(function (e) { s[e] = k; });
  });
  return s;
})();

function parseRepoUrl(input) {
  if (!input) return null;
  var s = input.trim().replace(/\/+$/, "");
  /* strip protocol + github.com */
  s = s.replace(/^https?:\/\//, "").replace(/^github\.com\//, "");
  /* owner/repo possibly followed by /tree/branch/... */
  var m = s.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/);
  if (m) return { owner: m[1], repo: m[2] };
  return null;
}

function detectLang(filename) {
  var ext = "." + filename.split(".").pop().toLowerCase();
  return CODE_EXT_SET[ext] || null;
}

function isCodeFile(path) {
  for (var i = 0; i < EXCLUDE_DIRS.length; i++) {
    if (path.indexOf(EXCLUDE_DIRS[i]) >= 0) return false;
  }
  var ext = "." + path.split(".").pop().toLowerCase();
  for (var j = 0; j < EXCLUDE_EXT.length; j++) {
    if (path.endsWith(EXCLUDE_EXT[j])) return false;
  }
  return !!CODE_EXT_SET[ext];
}

function isExcludedPath(path) {
  for (var i = 0; i < EXCLUDE_DIRS.length; i++) {
    if (path.indexOf(EXCLUDE_DIRS[i]) >= 0) return true;
  }
  return false;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function buildTreeView(flatList) {
  var root = [];
  var dirMap = {};

  /* ensure parent dirs exist */
  function ensureDir(dirPath) {
    if (dirMap[dirPath]) return dirMap[dirPath];
    var parts = dirPath.split("/");
    var name = parts.pop();
    var parentPath = parts.join("/");
    var node = { type: "dir", name: name, path: dirPath, children: [] };
    dirMap[dirPath] = node;
    if (parentPath) {
      var parent = ensureDir(parentPath);
      if (parent.children.indexOf(node) === -1) parent.children.push(node);
    } else {
      if (root.indexOf(node) === -1) root.push(node);
    }
    return node;
  }

  flatList.forEach(function (item) {
    if (item.type !== "blob") return;
    var parts = item.path.split("/");
    var fileName = parts.pop();
    var dirPath = parts.join("/");

    var fileNode = {
      type: "file",
      name: fileName,
      path: item.path,
      size: item.size || 0
    };

    if (dirPath) {
      var parent = ensureDir(dirPath);
      parent.children.push(fileNode);
    } else {
      root.push(fileNode);
    }
  });

  /* sort: dirs first, then alphabetical */
  function sortChildren(nodes) {
    nodes.sort(function (a, b) {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(function (n) {
      if (n.children) sortChildren(n.children);
    });
  }
  sortChildren(root);
  return root;
}

/* ── component ───────────────────────────────────────────── */

export default function GitHubPanel(props) {
  var T = props.T;
  var dark = props.dark;
  var t = props.t;
  var onImportFiles = props.onImportFiles;
  var onClose = props.onClose;

  /* state */
  var _tk = useState(function () { try { return localStorage.getItem(STORAGE_KEY) || ""; } catch (e) { return ""; } });
  var token = _tk[0], setToken = _tk[1];
  var _ru = useState(""); var repoUrl = _ru[0], setRepoUrl = _ru[1];
  var _ld = useState(""); var loading = _ld[0], setLoading = _ld[1];
  var _er = useState(""); var error = _er[0], setError = _er[1];
  var _rd = useState(null); var repoData = _rd[0], setRepoData = _rd[1];
  var _br = useState([]); var branches = _br[0], setBranches = _br[1];
  var _sb = useState(""); var selectedBranch = _sb[0], setSelectedBranch = _sb[1];
  var _tr = useState([]); var tree = _tr[0], setTree = _tr[1];
  var _sf = useState(new Set()); var selectedFiles = _sf[0], setSelectedFiles = _sf[1];
  var _ff = useState(""); var fileFilter = _ff[0], setFileFilter = _ff[1];
  var _ed = useState(new Set()); var expandedDirs = _ed[0], setExpandedDirs = _ed[1];
  var _st = useState(false); var showToken = _st[0], setShowToken = _st[1];
  var _ip = useState(0); var importProgress = _ip[0], setImportProgress = _ip[1];
  var _it = useState(0); var importTotal = _it[0], setImportTotal = _it[1];

  var panelRef = useRef(null);

  /* persist token */
  useEffect(function () {
    try { if (token) localStorage.setItem(STORAGE_KEY, token); else localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
  }, [token]);

  /* close on Escape */
  useEffect(function () {
    function handleKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return function () { document.removeEventListener("keydown", handleKey); };
  }, [onClose]);

  /* ── API helpers ─────── */

  var apiHeaders = useMemo(function () {
    var h = { "Accept": "application/json" };
    if (token) h["x-github-token"] = token;
    return h;
  }, [token]);

  var fetchRepo = useCallback(function () {
    var parsed = parseRepoUrl(repoUrl);
    if (!parsed) { setError(t.ghInvalidUrl || "Invalid repository URL. Use owner/repo format."); return; }
    setError(""); setLoading("repo"); setRepoData(null); setBranches([]); setTree([]); setSelectedFiles(new Set()); setSelectedBranch("");

    var owner = parsed.owner, repo = parsed.repo;

    Promise.all([
      fetch("/api/github/repos/" + owner + "/" + repo, { headers: apiHeaders }).then(function (r) { if (!r.ok) throw new Error("Repository not found (HTTP " + r.status + ")"); return r.json(); }),
      fetch("/api/github/repos/" + owner + "/" + repo + "/branches", { headers: apiHeaders }).then(function (r) { if (!r.ok) throw new Error("Could not fetch branches"); return r.json(); })
    ]).then(function (res) {
      var data = res[0], brs = res[1];
      setRepoData(data);
      setBranches(brs);
      var def = data.default_branch || "main";
      setSelectedBranch(def);
      setLoading("tree");
      return fetchTreeForBranch(owner, repo, def);
    }).catch(function (err) {
      setError(err.message || "Failed to connect to repository");
      setLoading("");
    });
  }, [repoUrl, apiHeaders]);

  var fetchTreeForBranch = useCallback(function (owner, repo, branch) {
    setLoading("tree"); setTree([]); setSelectedFiles(new Set()); setExpandedDirs(new Set());
    return fetch("/api/github/repos/" + owner + "/" + repo + "/git/trees/" + branch, { headers: apiHeaders })
      .then(function (r) { if (!r.ok) throw new Error("Could not fetch file tree"); return r.json(); })
      .then(function (data) {
        var items = (data.tree || []).filter(function (f) {
          return f.type === "blob" && !isExcludedPath(f.path);
        });
        setTree(items);
        /* auto-expand first level dirs */
        var topDirs = new Set();
        items.forEach(function (f) { var p = f.path.split("/"); if (p.length > 1) topDirs.add(p[0]); });
        setExpandedDirs(topDirs);
        setLoading("");
      }).catch(function (err) {
        setError(err.message || "Failed to load file tree");
        setLoading("");
      });
  }, [apiHeaders]);

  var handleBranchChange = useCallback(function (e) {
    var branch = e.target.value;
    setSelectedBranch(branch);
    var parsed = parseRepoUrl(repoUrl);
    if (parsed) fetchTreeForBranch(parsed.owner, parsed.repo, branch);
  }, [repoUrl, fetchTreeForBranch]);

  /* ── file selection ─────── */

  var toggleFile = useCallback(function (path) {
    setSelectedFiles(function (prev) {
      var next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  var toggleDir = useCallback(function (dirPath) {
    setExpandedDirs(function (prev) {
      var next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath); else next.add(dirPath);
      return next;
    });
  }, []);

  var selectAllCode = useCallback(function () {
    var codePaths = new Set();
    tree.forEach(function (f) { if (isCodeFile(f.path)) codePaths.add(f.path); });
    setSelectedFiles(codePaths);
  }, [tree]);

  var deselectAll = useCallback(function () {
    setSelectedFiles(new Set());
  }, []);

  /* ── import ─────── */

  var importSelected = useCallback(function () {
    var parsed = parseRepoUrl(repoUrl);
    if (!parsed || selectedFiles.size === 0) return;
    var owner = parsed.owner, repo = parsed.repo;
    var paths = Array.from(selectedFiles);
    setLoading("files"); setImportProgress(0); setImportTotal(paths.length); setError("");

    var results = [];
    var idx = 0;

    function next() {
      if (idx >= paths.length) {
        setLoading("");
        onImportFiles(results);
        return;
      }
      var path = paths[idx];
      fetch("/api/github/repos/" + owner + "/" + repo + "/contents/" + path + "?ref=" + selectedBranch, { headers: apiHeaders })
        .then(function (r) { if (!r.ok) throw new Error("Failed to fetch " + path); return r.json(); })
        .then(function (data) {
          var content = "";
          try { content = atob(data.content.replace(/\n/g, "")); } catch (e) { content = data.content || ""; }
          var lang = detectLang(path);
          results.push({
            name: path.split("/").pop(),
            path: path,
            content: content,
            size: content.length,
            lang: lang,
            langN: lang ? LANGS[lang].n : "?"
          });
          idx++;
          setImportProgress(idx);
          next();
        }).catch(function (err) {
          /* skip failed files, continue */
          idx++;
          setImportProgress(idx);
          next();
        });
    }
    next();
  }, [repoUrl, selectedFiles, selectedBranch, apiHeaders, onImportFiles]);

  /* ── computed ─────── */

  var treeView = useMemo(function () {
    return buildTreeView(tree);
  }, [tree]);

  var filteredCodeCount = useMemo(function () {
    return tree.filter(function (f) { return isCodeFile(f.path); }).length;
  }, [tree]);

  var selectedSize = useMemo(function () {
    var total = 0;
    tree.forEach(function (f) { if (selectedFiles.has(f.path)) total += (f.size || 0); });
    return total;
  }, [tree, selectedFiles]);

  /* ── styles ─────── */

  var S = {
    overlay: {
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: T.modalBg,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      animation: "ghFadeIn .25s ease-out"
    },
    panel: {
      width: "min(720px, 92vw)", maxHeight: "88vh",
      background: T.w, borderRadius: 14,
      border: "1px solid " + T.bdL,
      boxShadow: dark
        ? "0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04)"
        : "0 32px 80px rgba(0,0,0,.15), 0 0 0 1px rgba(0,0,0,.04)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      animation: "ghScaleIn .3s cubic-bezier(.16,1,.3,1)"
    },
    header: {
      padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid " + T.bdL,
      background: dark
        ? "linear-gradient(135deg, rgba(37,99,235,.08), rgba(99,102,241,.06))"
        : "linear-gradient(135deg, rgba(37,99,235,.04), rgba(99,102,241,.03))"
    },
    headerTitle: {
      fontSize: 16, fontWeight: 800, fontFamily: T.ui, color: T.tx,
      display: "flex", alignItems: "center", gap: 10, letterSpacing: "-.02em"
    },
    closeBtn: {
      width: 32, height: 32, borderRadius: 8, border: "1px solid " + T.bd,
      background: "transparent", color: T.txM, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 16, fontWeight: 600, transition: "all .15s"
    },
    section: {
      padding: "14px 24px", borderBottom: "1px solid " + T.bdL
    },
    label: {
      fontSize: 10, fontWeight: 700, fontFamily: T.ui, color: T.txD,
      textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6
    },
    input: {
      padding: "9px 12px", borderRadius: 8, border: "1px solid " + T.bd,
      background: T.inputBg, color: T.tx, fontSize: 12, fontFamily: T.f,
      outline: "none", width: "100%", boxSizing: "border-box",
      transition: "border-color .2s, box-shadow .2s"
    },
    select: {
      padding: "9px 12px", borderRadius: 8, border: "1px solid " + T.bd,
      background: T.inputBg, color: T.tx, fontSize: 12, fontFamily: T.ui,
      outline: "none", cursor: "pointer", transition: "border-color .2s"
    },
    btn: function (v) {
      var b = {
        padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
        fontSize: 11, fontWeight: 700, fontFamily: T.ui,
        display: "inline-flex", alignItems: "center", gap: 6,
        transition: "all .2s ease", letterSpacing: "-.01em"
      };
      if (v === "p") return Object.assign({}, b, {
        background: "linear-gradient(135deg," + T.gradA + "," + T.gradB + ")",
        color: "#fff", boxShadow: "0 2px 8px " + T.gradA + "40"
      });
      if (v === "g") return Object.assign({}, b, {
        background: T.g, color: "#fff", boxShadow: "0 2px 8px " + T.g + "30"
      });
      if (v === "ghost") return Object.assign({}, b, {
        background: "transparent", color: T.txM, border: "1px solid " + T.bd
      });
      return b;
    },
    treeContainer: {
      flex: 1, overflow: "auto", padding: "8px 16px",
      minHeight: 0, maxHeight: "calc(88vh - 340px)"
    },
    fileRow: function (selected, isCode) {
      return {
        display: "flex", alignItems: "center", gap: 8, padding: "5px 10px",
        borderRadius: 8, cursor: "pointer", transition: "background .12s",
        background: selected ? (dark ? "rgba(37,99,235,.12)" : "rgba(37,99,235,.06)") : "transparent",
        opacity: isCode ? 1 : 0.45
      };
    },
    dirRow: {
      display: "flex", alignItems: "center", gap: 8, padding: "5px 10px",
      borderRadius: 8, cursor: "pointer", transition: "background .12s",
      fontWeight: 600
    },
    checkbox: function (checked) {
      return {
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        border: checked ? "none" : "1.5px solid " + T.bd,
        background: checked
          ? "linear-gradient(135deg," + T.gradA + "," + T.gradB + ")"
          : T.inputBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .15s", cursor: "pointer"
      };
    },
    footer: {
      padding: "14px 24px", borderTop: "1px solid " + T.bdL,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: dark ? "rgba(17,22,32,.6)" : "rgba(245,247,250,.8)"
    },
    langDot: function (color) {
      return {
        width: 7, height: 7, borderRadius: 2, flexShrink: 0,
        background: color || T.txD
      };
    },
    badge: {
      padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700,
      fontFamily: T.ui, background: dark ? "rgba(37,99,235,.15)" : T.blP,
      color: T.bl
    },
    errorBox: {
      padding: "10px 14px", borderRadius: 8, fontSize: 11, fontFamily: T.ui,
      background: T.errBg, color: T.r, border: "1px solid " + T.errBd,
      display: "flex", alignItems: "center", gap: 8
    },
    spinner: {
      width: 14, height: 14, border: "2px solid " + T.bdL,
      borderTopColor: T.bl, borderRadius: "50%",
      animation: "spin .6s linear infinite", flexShrink: 0
    },
    repoCard: {
      padding: "12px 16px", borderRadius: 10,
      background: dark ? "rgba(37,99,235,.06)" : T.blM,
      border: "1px solid " + (dark ? "rgba(37,99,235,.12)" : T.blP),
      display: "flex", alignItems: "center", gap: 12, marginTop: 8
    },
    progress: {
      height: 3, borderRadius: 2, background: T.bdL, overflow: "hidden"
    },
    progressFill: function (pct) {
      return {
        height: "100%", borderRadius: 2, width: pct + "%",
        background: "linear-gradient(90deg," + T.gradA + "," + T.gradB + ")",
        transition: "width .3s ease"
      };
    }
  };

  /* ── render helpers ─────── */

  function renderSpinner() {
    return React.createElement("div", { style: S.spinner });
  }

  function renderCheck() {
    return React.createElement("svg", { width: 10, height: 10, viewBox: "0 0 10 10", style: { display: "block" } },
      React.createElement("path", { d: "M2 5l2.5 2.5L8 3", stroke: "#fff", strokeWidth: 2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" })
    );
  }

  function renderGitHubIcon() {
    return React.createElement("svg", { width: 22, height: 22, viewBox: "0 0 24 24", fill: T.tx },
      React.createElement("path", { d: "M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" })
    );
  }

  function renderTreeNode(node, depth) {
    if (node.type === "dir") {
      var isExpanded = expandedDirs.has(node.path);
      /* check if any child matches filter */
      if (fileFilter) {
        var hasMatch = hasFilterMatch(node);
        if (!hasMatch) return null;
      }
      return React.createElement("div", { key: node.path },
        React.createElement("div", {
          style: Object.assign({}, S.dirRow, { paddingLeft: 10 + depth * 18 }),
          onClick: function () { toggleDir(node.path); },
          className: "hv-glow"
        },
          React.createElement("span", { style: { fontSize: 10, color: T.txD, transition: "transform .15s", transform: isExpanded ? "rotate(90deg)" : "rotate(0)", display: "inline-block" } }, "\u25B6"),
          React.createElement("span", { style: { fontSize: 13 } }, "\uD83D\uDCC1"),
          React.createElement("span", { style: { fontSize: 12, fontFamily: T.ui, color: T.tx } }, node.name),
          React.createElement("span", { style: { fontSize: 9, color: T.txD, fontFamily: T.f, marginLeft: "auto" } },
            (node.children || []).length + " items"
          )
        ),
        isExpanded && (node.children || []).map(function (child) {
          return renderTreeNode(child, depth + 1);
        })
      );
    }

    /* file node */
    var code = isCodeFile(node.path);
    var lang = detectLang(node.name);
    var langInfo = lang ? LANGS[lang] : null;
    var sel = selectedFiles.has(node.path);

    /* filter */
    if (fileFilter && node.name.toLowerCase().indexOf(fileFilter.toLowerCase()) < 0) return null;

    return React.createElement("div", {
      key: node.path,
      style: Object.assign({}, S.fileRow(sel, code), { paddingLeft: 10 + depth * 18 }),
      onClick: function () { if (code) toggleFile(node.path); }
    },
      React.createElement("div", { style: S.checkbox(sel), onClick: function (e) { e.stopPropagation(); if (code) toggleFile(node.path); } },
        sel && renderCheck()
      ),
      React.createElement("span", { style: { fontSize: 13 } }, langInfo ? langInfo.i : "\uD83D\uDCC4"),
      React.createElement("span", {
        style: { fontSize: 12, fontFamily: T.f, color: code ? T.tx : T.txD, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
      }, node.name),
      React.createElement("span", { style: { fontSize: 10, color: T.txD, fontFamily: T.f, flexShrink: 0 } }, formatSize(node.size)),
      langInfo && React.createElement("span", {
        style: {
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 600,
          fontFamily: T.ui, background: langInfo.c + "18", color: langInfo.c
        }
      },
        React.createElement("span", { style: S.langDot(langInfo.c) }),
        langInfo.n
      )
    );
  }

  function hasFilterMatch(dirNode) {
    for (var i = 0; i < (dirNode.children || []).length; i++) {
      var child = dirNode.children[i];
      if (child.type === "dir") { if (hasFilterMatch(child)) return true; }
      else if (child.name.toLowerCase().indexOf(fileFilter.toLowerCase()) >= 0) return true;
    }
    return false;
  }

  /* ── main render ─────── */

  var isConnected = !!repoData;
  var loadingMsg = loading === "repo" ? (t.ghConnecting || "Connecting to repository...")
    : loading === "tree" ? (t.ghLoadingTree || "Loading file tree...")
    : loading === "files" ? (t.ghImporting || "Importing files...") + " (" + importProgress + "/" + importTotal + ")"
    : "";

  return React.createElement("div", { style: S.overlay, onClick: function (e) { if (e.target === e.currentTarget) onClose(); } },
    React.createElement("style", { dangerouslySetInnerHTML: { __html:
      "@keyframes ghFadeIn{from{opacity:0}to{opacity:1}}" +
      "@keyframes ghScaleIn{from{opacity:0;transform:scale(.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}" +
      "@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}" +
      ".gh-row:hover{background:" + (dark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.02)") + "!important}"
    } }),

    React.createElement("div", { ref: panelRef, style: S.panel },

      /* ── Header ─── */
      React.createElement("div", { style: S.header },
        React.createElement("div", { style: S.headerTitle },
          renderGitHubIcon(),
          t.ghTitle || "GitHub Import"
        ),
        React.createElement("button", {
          style: S.closeBtn, onClick: onClose,
          "aria-label": "Close"
        }, "\u2715")
      ),

      /* ── Token + Repo ─── */
      React.createElement("div", { style: S.section },
        React.createElement("div", { style: { display: "flex", gap: 12, marginBottom: 12 } },
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: S.label }, "\uD83D\uDD11 " + (t.ghToken || "Personal Access Token")),
            React.createElement("div", { style: { display: "flex", gap: 6 } },
              React.createElement("input", {
                type: showToken ? "text" : "password",
                value: token,
                onChange: function (e) { setToken(e.target.value); },
                placeholder: "ghp_...",
                style: Object.assign({}, S.input, { flex: 1, fontFamily: T.f, fontSize: 11 }),
                "aria-label": "GitHub Token"
              }),
              React.createElement("button", {
                style: Object.assign({}, S.btn("ghost"), { padding: "8px 10px", fontSize: 13, minWidth: 36 }),
                onClick: function () { setShowToken(!showToken); },
                title: showToken ? "Hide" : "Show",
                "aria-label": showToken ? "Hide token" : "Show token"
              }, showToken ? "\uD83D\uDE48" : "\uD83D\uDC41\uFE0F")
            )
          )
        ),
        React.createElement("div", { style: S.label }, "\uD83D\uDCE6 " + (t.ghRepo || "Repository")),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("input", {
            type: "text",
            value: repoUrl,
            onChange: function (e) { setRepoUrl(e.target.value); },
            placeholder: "owner/repo or https://github.com/owner/repo",
            style: Object.assign({}, S.input, { flex: 1 }),
            onKeyDown: function (e) { if (e.key === "Enter" && !loading) fetchRepo(); },
            "aria-label": "Repository URL"
          }),
          React.createElement("button", {
            style: Object.assign({}, S.btn("p"), { opacity: loading ? 0.6 : 1 }),
            onClick: fetchRepo,
            disabled: !!loading
          },
            loading === "repo" && React.createElement("div", { style: S.spinner }),
            t.ghConnect || "Connect"
          )
        ),

        /* repo info card */
        isConnected && React.createElement("div", { style: S.repoCard },
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 700, fontFamily: T.ui, color: T.tx } },
              repoData.full_name || ""
            ),
            repoData.description && React.createElement("div", {
              style: { fontSize: 11, color: T.txM, fontFamily: T.ui, marginTop: 2, lineHeight: "1.4" }
            }, repoData.description.length > 100 ? repoData.description.slice(0, 100) + "..." : repoData.description),
            React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 6 } },
              React.createElement("span", { style: { fontSize: 10, color: T.txD } }, "\u2B50 " + (repoData.stargazers_count || 0)),
              React.createElement("span", { style: { fontSize: 10, color: T.txD } }, "\uD83C\uDF74 " + (repoData.forks_count || 0)),
              repoData.language && React.createElement("span", { style: { fontSize: 10, color: T.txD } }, "\uD83D\uDCBB " + repoData.language)
            )
          )
        ),

        /* error */
        error && React.createElement("div", { style: Object.assign({}, S.errorBox, { marginTop: 10 }) },
          "\u26A0\uFE0F ", error
        )
      ),

      /* ── Branch + Filter bar ─── */
      isConnected && tree.length > 0 && React.createElement("div", { style: Object.assign({}, S.section, { display: "flex", gap: 12, alignItems: "flex-end" }) },
        React.createElement("div", { style: { minWidth: 160 } },
          React.createElement("div", { style: S.label }, "\uD83C\uDF3F " + (t.ghBranch || "Branch")),
          React.createElement("select", {
            value: selectedBranch,
            onChange: handleBranchChange,
            style: S.select,
            disabled: loading === "tree"
          },
            branches.map(function (b) {
              return React.createElement("option", { key: b.name, value: b.name }, b.name);
            })
          )
        ),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: S.label }, "\uD83D\uDD0D " + (t.ghFilter || "Filter files")),
          React.createElement("input", {
            type: "text",
            value: fileFilter,
            onChange: function (e) { setFileFilter(e.target.value); },
            placeholder: t.ghFilterPlaceholder || "Search files...",
            style: S.input,
            "aria-label": "Filter files"
          })
        ),
        React.createElement("span", { style: S.badge },
          tree.length + " " + (t.ghFiles || "files") + " \u00B7 " + filteredCodeCount + " " + (t.ghCode || "code")
        )
      ),

      /* ── Loading state for tree ─── */
      loading === "tree" && React.createElement("div", {
        style: { padding: "40px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }
      },
        React.createElement("div", { style: S.spinner }),
        React.createElement("span", { style: { fontSize: 12, color: T.txM, fontFamily: T.ui } }, loadingMsg)
      ),

      /* ── File tree ─── */
      isConnected && tree.length > 0 && !loading && React.createElement("div", { style: S.treeContainer },
        treeView.map(function (node) { return renderTreeNode(node, 0); })
      ),

      /* ── Empty state ─── */
      isConnected && tree.length === 0 && !loading && React.createElement("div", {
        style: { padding: "40px 24px", textAlign: "center" }
      },
        React.createElement("div", { style: { fontSize: 32, marginBottom: 8 } }, "\uD83D\uDCC2"),
        React.createElement("div", { style: { fontSize: 13, color: T.txM, fontFamily: T.ui } }, t.ghEmpty || "No files found in this branch.")
      ),

      /* ── Import progress ─── */
      loading === "files" && React.createElement("div", { style: { padding: "16px 24px" } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } },
          React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: T.tx, fontFamily: T.ui } }, loadingMsg),
          React.createElement("span", { style: { fontSize: 10, color: T.txD, fontFamily: T.f } },
            Math.round((importProgress / Math.max(importTotal, 1)) * 100) + "%"
          )
        ),
        React.createElement("div", { style: S.progress },
          React.createElement("div", { style: S.progressFill((importProgress / Math.max(importTotal, 1)) * 100) })
        )
      ),

      /* ── Footer ─── */
      (isConnected && tree.length > 0) && React.createElement("div", { style: S.footer },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
          React.createElement("span", { style: { fontSize: 11, color: T.txM, fontFamily: T.ui } },
            selectedFiles.size + " " + (t.ghSelected || "selected") + " (" + formatSize(selectedSize) + ")"
          )
        ),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          selectedFiles.size > 0 && React.createElement("button", {
            style: S.btn("ghost"),
            onClick: deselectAll
          }, t.ghDeselectAll || "Deselect all"),
          React.createElement("button", {
            style: S.btn("ghost"),
            onClick: selectAllCode,
            disabled: !!loading
          }, "\u26A1 " + (t.ghSelectCode || "Select code")),
          React.createElement("button", {
            style: Object.assign({}, S.btn("g"), { opacity: selectedFiles.size === 0 || loading ? 0.5 : 1 }),
            onClick: importSelected,
            disabled: selectedFiles.size === 0 || !!loading
          },
            loading === "files" && React.createElement("div", { style: S.spinner }),
            (t.ghImport || "Import selected") + " \u2192"
          )
        )
      )
    )
  );
}
