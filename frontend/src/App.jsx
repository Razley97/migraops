import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import React from "react";
import { THEMES } from "./config/themes.js";
import { UILANGS, LANGS, CROSS, TARGET_EXT, MODULE_CONVENTIONS, LANG_META } from "./config/languages.js";
import { MODELS } from "./config/models.js";
import { i18n } from "./i18n/translations.js";
import ChatView from "./components/chat/ChatView.jsx";
import GitHubPanel from "./components/github/GitHubPanel.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Stepper from "./components/Stepper.jsx";
import DependencyGraph from "./components/DependencyGraph.jsx";
import MigratingView from "./components/MigratingView.jsx";
import ResultsView from "./components/ResultsView.jsx";
import LanguageTooltip from "./components/LanguageTooltip.jsx";
import DashboardView from "./components/DashboardView.jsx";
import HistoryView from "./components/HistoryView.jsx";
import UploadView from "./components/UploadView.jsx";
import ConfigureView from "./components/ConfigureView.jsx";
import { safeParseJSON, syntaxHL } from "./services/utils.js";
import { AGENTS } from "./data/agents.js";
import { PARADIGM_MAPS, getParadigmMap } from "./config/paradigmMaps.js";
import { _activeController, setCancelled, setActiveController } from "./services/claudeClient.js";
import { generateTestSuite, executeSandbox, generateAndRunQA } from "./services/qaSandbox.js";
import { detectVer } from "./services/migrationPhases.js";
import { doAnalyze, generateReportHTML, exportTestsAsCode } from "./services/reportGenerators.js";
import { runVirtualQA, compareVirtualQA, compareQAResults } from "./services/qaHelpers.js";

import { runMigration, resetMigration, generatePDF as pipelineGeneratePDF } from "./services/pipeline.js";
import "./services/playwrightPhase.js"; // Registers Phase 0 (visual baseline) + Phase 110 (visual fidelity)
// Error Boundary — prevents total app crash on render errors
class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={hasError:false,error:null}}
  static getDerivedStateFromError(error){return {hasError:true,error:error}}
  render(){
    if(this.state.hasError){
      return React.createElement("div",{style:{padding:40,textAlign:"center",fontFamily:"system-ui"}},
        React.createElement("h2",{style:{color:"#dc2626",marginBottom:12}},"⚠️ MigraOps — Error de Render"),
        React.createElement("p",{style:{color:"#64748b",marginBottom:16}},String(this.state.error)),
        React.createElement("button",{onClick:function(){window.location.reload()},style:{padding:"8px 20px",borderRadius:10,border:"none",background:"#60A5FA",color:"#fff",cursor:"pointer",fontWeight:700,fontFamily:"Outfit,sans-serif"}},"Recargar Aplicación")
      );
    }
    return this.props.children;
  }
}

var APP = { n: "MigraOps", v: "5.0", co: "SII Group Chile", area: "Code Intelligence" };
var SII_LOGO="data:image/png;base64,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";
var SII_LOGO_LG="data:image/png;base64,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";


// i18n imported from ./i18n/translations.js

// UILANGS, LANGS imported from ./config/languages.js

// CROSS, TARGET_EXT, MODULE_CONVENTIONS imported from ./config/languages.js

// PARADIGM_MAPS, getParadigmMap imported from ./config/paradigmMaps.js
// calcCapacity imported from ./services/claudeClient.js

// mapTargetFile extracted to ./services/migrationPhases.js

// MODELS imported from ./config/models.js

// _tks, _activeController, _cancelled, callClaude, calcCapacity imported from ./services/claudeClient.js

var DPROMPTS = {
  mig:{
    sys:"You are a Staff-level migration engineer executing a {SOURCE} {SOURCE_VER} → {TARGET} {TARGET_VER} migration.\n\nEXECUTION PROTOCOL — 6 phases, in strict order:\n\n1) INVENTORY: Scan every line. Build a mental ledger of: all imports/requires, every deprecated API call, every async pattern (callbacks, promises, sync I/O, RxJava, AsyncTask), every class/interface/enum with their public signatures, every error handling block, every data structure that crosses function boundaries, and every type annotation or cast.\n\n2) DEPENDENCY MAP: Identify what this file exports (public API surface) and what it imports. These are CONTRACTS — the migrated file must expose the same public API and consume the same dependencies, adapted to {TARGET} {TARGET_VER} equivalents.\n\n3) TRANSFORMATION PLAN: For EACH item in the inventory, decide the exact {TARGET} {TARGET_VER} replacement. No item gets skipped. Deprecated APIs get modern replacements. Async patterns get fully migrated (not half-converted). Type system gets the {TARGET} treatment (nullable types, generics, type inference as appropriate).\n\n4) MIGRATE: Write the complete {TARGET} {TARGET_VER} file. Apply ALL transformations. Use idiomatic patterns — not a literal syntax translation, but genuine {TARGET} code that a senior {TARGET} developer would write. Respect {TARGET} naming conventions, module system, error handling idioms, and standard library preferences.\n\n5) CONTRACT VERIFICATION: Mentally verify: Does every import resolve to a real module/package? Does the public API surface match the original (same exported functions/classes, compatible signatures)? Would a caller of the original code work with the migrated version without changes? Is the async model internally consistent (no mixing callbacks with async/await)?\n\n6) QUALITY CHECK: Is error handling complete (no swallowed exceptions, proper resource cleanup)? Are there security improvements (parameterized queries, input validation, no hardcoded secrets)? Is performance preserved (no unnecessary copies, proper lazy evaluation, efficient collection operations)?\n\nOUTPUT RULES:\n- Output ONLY the migrated code. No markdown fences, no analysis text, no preamble.\n- Add '// MIGRATED:' comments inline explaining each significant change (not just the first few — EVERY non-trivial transformation gets a comment).\n- The output must be COMPLETE — every function, every class, every import. Never truncate, abbreviate, or use '...' placeholders.\n- If the file has 50 lines of source, the output should have ~50-70 lines (not 20).",
    guide:["PHASE 1 — INVENTORY: Before writing any code, identify EVERY import, deprecated API, async pattern, class signature, error handler, and data structure in the source file","PHASE 2 — DEPENDENCY CONTRACTS: Map the file's public API surface (exports) and consumed dependencies (imports). These contracts MUST be preserved in the migration","PHASE 3 — API TRANSLATION: Replace ALL deprecated APIs with {TARGET} {TARGET_VER} idiomatic equivalents. Leave ZERO legacy calls. Use the paradigm maps for exact translations","PHASE 4 — ASYNC MODEL: Migrate the async model COMPLETELY — callbacks→async/await, APM→TAP, RxJava→Coroutines/Flow, AsyncTask→viewModelScope.launch. No half-migrations","PHASE 5 — TYPE SYSTEM: Apply {TARGET} type system properly — nullability annotations, generics, type inference, sealed types, union types as appropriate for {TARGET_VER}","PHASE 6 — ERROR HANDLING: Translate exception patterns fully. Ensure every try/catch is idiomatic {TARGET}. Add resource cleanup (try-with-resources, .use{}, using, defer)","PHASE 7 — SECURITY HARDENING: Parameterized queries (never string concat for SQL), input validation, proper encoding, resource limits, no hardcoded secrets","PHASE 8 — MODULE SYSTEM: Use {TARGET} standard imports (ESM for modern JS/TS, packages for Java/Kotlin, namespaces for C#). Consistent module pattern across the file","PHASE 9 — NAMING & IDIOMS: Follow {TARGET} conventions strictly (camelCase, PascalCase, snake_case). Use idiomatic patterns (data classes, extension functions, destructuring, pattern matching)","PHASE 10 — COMPLETENESS: Output the FULL migrated file. Add '// MIGRATED:' comment for EVERY non-trivial change. Never truncate or use placeholders. Verify the file would compile"]
  },
  rev:{
    sys:"You are a Principal QA Engineer performing a rigorous code review of a {SOURCE} {SOURCE_VER} → {TARGET} {TARGET_VER} migration. ALL analysis and output text MUST be in {LANG}.\n\nEVALUATION FRAMEWORK — 8 independent dimensions:\n\n1) FUNCTIONAL EQUIVALENCE (25%): Does the migrated code produce identical outputs for identical inputs? Are all code paths preserved? Are edge cases handled the same way? Test mentally with: empty inputs, null/undefined, error conditions, boundary values.\n\n2) SYNTAX & COMPILATION (15%): Would this code compile/run without errors in {TARGET} {TARGET_VER}? Are all imports valid? Are types correct? No undefined variables or missing returns?\n\n3) IDIOMATIC QUALITY (15%): Is this genuine {TARGET} code or a literal translation wearing {TARGET} syntax? Check: proper use of {TARGET} standard library, language-specific patterns (comprehensions, pattern matching, extension functions, etc.), naming conventions.\n\n4) ASYNC CORRECTNESS (10%): Is the async model fully and consistently migrated? No mixing callbacks with promises? No blocking calls on the main thread? Proper cancellation/cleanup?\n\n5) SECURITY (15%): No SQL injection (parameterized queries required). No XSS (proper encoding). No hardcoded secrets. Input validation present. Resource cleanup (no leaks). No insecure deserialization.\n\n6) ERROR HANDLING (8%): All error paths covered? No swallowed exceptions? Proper propagation? Resource cleanup in finally/defer/using blocks? Meaningful error messages?\n\n7) API CONTRACT PRESERVATION (7%): Does the migrated file export the same public API? Would callers of the original code work with the migrated version? Are function signatures compatible?\n\n8) DOCUMENTATION (5%): Are '// MIGRATED:' comments present for significant changes? Is the code self-documenting with clear naming?\n\nSCORING PROTOCOL:\n- Score EACH dimension independently 0-100 first\n- Final score = weighted average: func×25 + syntax×15 + idiomatic×15 + async×10 + security×15 + errors×8 + contracts×7 + docs×5, divided by 100\n- Show your math explicitly\n- Deductions: -15 per critical issue, -8 per major, -3 per minor (from the relevant dimension)\n- Verdict: aprobado (90+), con_observaciones (70-89), rechazado (<70)\n\nCALIBRATION GUIDE:\n- 90-100: Production-ready. A senior developer would approve this PR.\n- 75-89: Good migration with minor gaps. Needs small fixes before production.\n- 60-74: Functional but has real quality issues. Needs review cycle.\n- 40-59: Significant problems. Core functionality may work but serious gaps.\n- Below 40: Broken or fundamentally incomplete migration.\n\nRespond ONLY valid JSON:\n{\"score\":0-100,\"scoreBreakdown\":\"func:X×25 + syntax:X×15 + idiomatic:X×15 + async:X×10 + security:X×15 + errors:X×8 + contracts:X×7 + docs:X×5 = N/100\",\"verdict\":\"aprobado|con_observaciones|rechazado\",\"dimensions\":{\"functional\":0-100,\"syntax\":0-100,\"idiomatic\":0-100,\"async\":0-100,\"security\":0-100,\"errors\":0-100,\"contracts\":0-100,\"docs\":0-100},\"errors\":[{\"file\":\"...\",\"line\":0,\"severity\":\"critical|major|minor\",\"dimension\":\"functional|syntax|idiomatic|async|security|errors|contracts|docs\",\"msg\":\"specific finding in {LANG}\"}],\"warnings\":[{\"file\":\"...\",\"line\":0,\"dimension\":\"...\",\"msg\":\"in {LANG}\"}],\"good\":[\"specific strength in {LANG}\"],\"summary\":\"2-3 sentences in {LANG}\"}",
    crit:["FUNCTIONAL: Same inputs must produce same outputs — verify with empty, null, and error cases","SYNTAX: Valid compilable {TARGET} {TARGET_VER} — all imports resolve, all types correct, no undefined references","IDIOMATIC: Genuine {TARGET} patterns, not literal {SOURCE} translation — check stdlib usage, naming, language features","ASYNC: Async model fully migrated and internally consistent — no mixed paradigms (callbacks + promises)","SECURITY: No regressions — parameterized queries, input validation, proper encoding, no hardcoded secrets","ERROR HANDLING: All error paths covered, no swallowed exceptions, resource cleanup in finally/defer/using","API CONTRACTS: Public API surface preserved — same exports, compatible function signatures for callers","DEPENDENCY RESOLUTION: All imports point to valid modules/packages — no unresolved references","TYPE SAFETY: Correct types at function boundaries, proper nullable handling, generics preserved","PERFORMANCE: No unnecessary copies, proper lazy evaluation, efficient collection operations preserved","RESOURCE MANAGEMENT: All resources properly closed/disposed — DB connections, file handles, HTTP clients","COMPLETENESS: Full file migrated — no truncation, no '...' placeholders, all functions present"]
  }
};

var PROJECTS = [
  {
    id:"rest",name:"Servicio REST API",lang:"javascript",icon:"\ud83c\udf10",
    desc:"Express.js ES5 con callbacks — 4 archivos",difficulty:"advanced",suggest:{to:"ES2024",score:"~85"},
    files:[
      {name:"server.js",path:"api/server.js",content:"// Express REST API - Legacy ES5\nvar express = require('express');\nvar bodyParser = require('body-parser');\nvar UserModel = require('./models/user');\nvar authMiddleware = require('./middleware/auth');\n\nvar app = express();\napp.use(bodyParser.json());\n\napp.get('/api/users', authMiddleware, function(req, res) {\n  UserModel.findAll(function(err, users) {\n    if (err) { res.status(500).json({error: err.message}); return; }\n    var active = users.filter(function(u) { return u.active; });\n    res.json({data: active, total: active.length});\n  });\n});\n\napp.post('/api/users', authMiddleware, function(req, res) {\n  UserModel.create(req.body, function(err, user) {\n    if (err) { res.status(500).json({error: err.message}); return; }\n    res.status(201).json({data: user});\n  });\n});\n\napp.listen(3000, function() { console.log('Server on port 3000'); });\n"},
      {name:"user.js",path:"api/models/user.js",content:"// User Model - Callback pattern\nvar users = [];\nvar nextId = 1;\n\nfunction User(data) {\n  this.id = nextId++;\n  this.name = data.name;\n  this.email = data.email;\n  this.role = data.role || 'viewer';\n  this.active = true;\n}\n\nUser.findAll = function(callback) {\n  setTimeout(function() { callback(null, users.slice()); }, 10);\n};\n\nUser.create = function(data, callback) {\n  var user = new User(data);\n  users.push(user);\n  callback(null, user);\n};\n\nmodule.exports = User;\n"},
      {name:"auth.js",path:"api/middleware/auth.js",content:"// Auth Middleware\nvar TOKENS = {'admin-token':'admin','user-token':'viewer'};\n\nfunction authMiddleware(req, res, next) {\n  var token = req.headers['authorization'];\n  if (!token) { res.status(401).json({error:'No token'}); return; }\n  token = token.replace('Bearer ', '');\n  if (TOKENS.hasOwnProperty(token)) {\n    req.user = {role: TOKENS[token]};\n    next();\n  } else { res.status(403).json({error:'Invalid'}); }\n}\nmodule.exports = authMiddleware;\n"},
      {name:"validator.js",path:"api/utils/validator.js",content:"// Validation - ES5\nfunction validateUser(data) {\n  var errors = [];\n  if (!data.name || data.name.length < 2) errors.push('Name required');\n  if (!data.email || data.email.indexOf('@') === -1) errors.push('Email required');\n  return errors;\n}\nmodule.exports = { user: validateUser };\n"}
    ]
  },
  {
    id:"ecom",name:"Módulo E-Commerce",lang:"java",icon:"\ud83d\uded2",
    desc:"Carrito y pagos Java 8 — 4 clases",difficulty:"advanced",suggest:{to:"Java 21",score:"~80"},
    files:[
      {name:"Product.java",path:"shop/Product.java",content:"package com.shop;\n\npublic class Product {\n    private final String id;\n    private final String name;\n    private double price;\n\n    public Product(String id, String name, double price) {\n        this.id = id; this.name = name; this.price = price;\n    }\n    public String getId() { return id; }\n    public String getName() { return name; }\n    public double getPrice() { return price; }\n\n    @Override\n    public String toString() {\n        return String.format(\"Product{id='%s', price=%.2f}\", id, price);\n    }\n}\n"},
      {name:"CartService.java",path:"shop/CartService.java",content:"package com.shop;\nimport java.util.*;\n\npublic class CartService {\n    private Map<String, List<CartItem>> carts = new HashMap<String, List<CartItem>>();\n\n    public static class CartItem {\n        private Product product; private int qty;\n        public CartItem(Product p, int q) { product=p; qty=q; }\n        public Product getProduct() { return product; }\n        public int getQty() { return qty; }\n        public double subtotal() { return product.getPrice()*qty; }\n    }\n\n    public void addItem(String uid, Product p, int qty) {\n        if (!carts.containsKey(uid)) carts.put(uid, new ArrayList<CartItem>());\n        carts.get(uid).add(new CartItem(p, qty));\n    }\n\n    public List<CartItem> sorted(String uid) {\n        List<CartItem> items = carts.containsKey(uid) ? new ArrayList<CartItem>(carts.get(uid)) : new ArrayList<CartItem>();\n        Collections.sort(items, new Comparator<CartItem>() {\n            public int compare(CartItem a, CartItem b) { return Double.compare(b.subtotal(), a.subtotal()); }\n        });\n        return items;\n    }\n}\n"},
      {name:"PaymentProcessor.java",path:"shop/PaymentProcessor.java",content:"package com.shop;\nimport java.text.SimpleDateFormat;\nimport java.util.Date;\n\npublic class PaymentProcessor {\n    public enum Status { PENDING, APPROVED, DECLINED }\n    public static class Payment {\n        String id; double amount; Status status;\n        public Payment(String id, double amt) { this.id=id; amount=amt; status=Status.PENDING; }\n    }\n    public Payment process(double amount, String method) {\n        Payment p = new Payment(\"PAY-\"+System.currentTimeMillis(), amount);\n        switch(method) {\n            case \"credit_card\": p.status = amount<=10000 ? Status.APPROVED : Status.DECLINED; break;\n            default: p.status = Status.DECLINED;\n        }\n        return p;\n    }\n    public String receipt(Payment p) {\n        SimpleDateFormat sdf = new SimpleDateFormat(\"yyyy-MM-dd\");\n        return String.format(\"Recibo: %s | $%.2f | %s\", p.id, p.amount, p.status);\n    }\n}\n"},
      {name:"OrderRepo.java",path:"shop/OrderRepo.java",content:"package com.shop;\nimport java.util.*;\n\npublic class OrderRepo {\n    private List<Order> orders = new ArrayList<Order>();\n    public static class Order {\n        String id, userId; double total; Date created;\n        public Order(String id, String uid, double t) { this.id=id; userId=uid; total=t; created=new Date(); }\n    }\n    public Order save(String uid, double total) {\n        Order o = new Order(\"ORD-\"+(orders.size()+1), uid, total);\n        orders.add(o); return o;\n    }\n    public List<Order> byUser(String uid) {\n        List<Order> r = new ArrayList<Order>();\n        for (Order o : orders) if (o.userId.equals(uid)) r.add(o);\n        Collections.sort(r, new Comparator<Order>() {\n            public int compare(Order a, Order b) { return b.created.compareTo(a.created); }\n        });\n        return r;\n    }\n}\n"}
    ]
  },
  {
    id:"etl",name:"Pipeline de Datos",lang:"python",icon:"\ud83d\udcca",
    desc:"ETL Python 2.7 con urllib2 — 4 módulos",difficulty:"intermediate",suggest:{to:"Python 3.12",score:"~85"},
    files:[
      {name:"pipeline.py",path:"etl/pipeline.py",content:"#!/usr/bin/env python\nimport urllib2\nimport json\nimport time\n\nclass Pipeline:\n    def __init__(self):\n        self.stats = {\"extracted\":0,\"loaded\":0}\n\n    def extract(self, url):\n        print \"Extracting: %s\" % url\n        try:\n            req = urllib2.Request(url)\n            resp = urllib2.urlopen(req, timeout=30)\n            data = json.loads(resp.read())\n            self.stats[\"extracted\"] = len(data)\n            return data\n        except urllib2.URLError, e:\n            print \"ERROR: %s\" % str(e)\n            return []\n\n    def run(self, url, table):\n        print \"Started at %s\" % time.strftime(\"%Y-%m-%d %H:%M:%S\")\n        raw = self.extract(url)\n        if not raw:\n            print \"No data.\"\n            return False\n        print \"Done: %d records\" % len(raw)\n        return True\n"},
      {name:"transformers.py",path:"etl/transformers.py",content:"# Transformers - Python 2.7\nclass DataTransformer:\n    def __init__(self):\n        self.rules = {}\n\n    def clean(self, val):\n        if not isinstance(val, basestring):\n            return str(val)\n        return val.strip().encode('utf-8')\n\n    def process(self, records):\n        result = []\n        for rec in records:\n            cleaned = {}\n            for k, v in rec.iteritems():\n                if self.rules.has_key(k):\n                    cleaned[k] = self.rules[k](v)\n                elif isinstance(v, basestring):\n                    cleaned[k] = self.clean(v)\n                elif isinstance(v, (int, long, float)):\n                    cleaned[k] = v\n            if cleaned:\n                result.append(cleaned)\n        print \"Transformed: %d / %d\" % (len(result), len(records))\n        return result\n"},
      {name:"db_connector.py",path:"etl/db_connector.py",content:"# DB Connector - Python 2.7\nimport ConfigParser\nimport os\n\nclass DBConnector:\n    def __init__(self, cfg):\n        self.config = ConfigParser.ConfigParser()\n        if os.path.exists(cfg):\n            self.config.read(cfg)\n        self.connected = False\n\n    def connect(self):\n        try:\n            host = self.config.get('database','host')\n            port = self.config.getint('database','port')\n            print \"Connecting to %s:%d\" % (host, port)\n            self.connected = True\n        except ConfigParser.NoSectionError, e:\n            print \"Error: %s\" % str(e)\n\n    def insert(self, table, records):\n        if not self.connected: self.connect()\n        ct = 0\n        for r in records:\n            try: ct += 1\n            except Exception, e: print \"Err: %s\" % str(e)\n        print \"Inserted %d rows\" % ct\n        return ct\n"},
      {name:"report.py",path:"etl/report.py",content:"# Report - Python 2.7\nimport time\n\nclass Reporter:\n    def __init__(self, out=\"reports\"):\n        self.out = out\n\n    def generate(self, stats, table):\n        fn = \"%s/report_%s.txt\" % (self.out, table)\n        try:\n            f = open(fn, 'w')\n            f.write(\"Report: %s\\n\" % table)\n            for k, v in stats.iteritems():\n                f.write(\"%s: %s\\n\" % (k, str(v)))\n            f.close()\n            print \"Saved: %s\" % fn\n        except IOError, e:\n            print \"Error: %s\" % str(e)\n"}
    ]
  },
  {
    id:"web",name:"Aplicación Web",lang:"csharp",icon:"\ud83d\udda5\ufe0f",
    desc:".NET Framework 4.8 MVC — 4 componentes",difficulty:"advanced",suggest:{to:".NET 8",score:"~75"},
    files:[
      {name:"UserController.cs",path:"webapp/UserController.cs",content:"using System;\nusing System.Web.Mvc;\nusing System.Web;\n\nnamespace LegacyApp.Controllers {\n    public class UserController : Controller {\n        private readonly DataAccess _db = new DataAccess();\n\n        [HttpGet]\n        public ActionResult Index() {\n            ViewBag.Title = \"Users\";\n            return View(_db.GetAll());\n        }\n\n        [HttpPost]\n        public ActionResult Create(string name, string email) {\n            string safe = HttpUtility.HtmlEncode(name);\n            _db.Create(safe, email, \"viewer\");\n            return RedirectToAction(\"Index\");\n        }\n    }\n}\n"},
      {name:"AuthService.cs",path:"webapp/AuthService.cs",content:"using System;\nusing System.Configuration;\n\nnamespace LegacyApp {\n    public class AuthService {\n        private readonly string _secret;\n        public AuthService() { _secret = ConfigurationManager.AppSettings[\"Secret\"]; }\n\n        public bool Validate(string token) {\n            return !string.IsNullOrEmpty(token) && token.StartsWith(_secret ?? \"def-\");\n        }\n\n        public string Generate(string uid) {\n            string raw = string.Format(\"{0}:{1}:{2}\", _secret, uid, DateTime.Now.Ticks);\n            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(raw));\n        }\n\n        public void RunAsync(Action cb) {\n            Func<bool> work = () => true;\n            IAsyncResult r = work.BeginInvoke(ar => { work.EndInvoke(ar); cb(); }, null);\n        }\n    }\n}\n"},
      {name:"DataAccess.cs",path:"webapp/DataAccess.cs",content:"using System;\nusing System.Collections.Generic;\nusing System.Configuration;\nusing System.Data.SqlClient;\n\nnamespace LegacyApp {\n    public class DataAccess : IDisposable {\n        private SqlConnection _c;\n        private static readonly log4net.ILog Log = log4net.LogManager.GetLogger(typeof(DataAccess));\n\n        public DataAccess() {\n            _c = new SqlConnection(ConfigurationManager.ConnectionStrings[\"Default\"].ConnectionString);\n        }\n\n        public List<string> GetAll() {\n            var list = new List<string>();\n            try {\n                _c.Open();\n                var cmd = new SqlCommand(\"SELECT Name FROM Users WHERE Active=1\", _c);\n                var rd = cmd.ExecuteReader();\n                while (rd.Read()) list.Add(rd.GetString(0));\n            } catch (Exception ex) { Log.Error(\"Err\", ex); }\n            finally { if (_c.State == System.Data.ConnectionState.Open) _c.Close(); }\n            return list;\n        }\n\n        public void Create(string n, string e, string r) {\n            var cmd = new SqlCommand(string.Format(\"INSERT INTO Users VALUES('{0}','{1}','{2}')\", n, e, r), _c);\n            _c.Open(); cmd.ExecuteNonQuery(); _c.Close();\n        }\n\n        public void Dispose() { if (_c!=null) { _c.Dispose(); _c=null; } }\n    }\n}\n"},
      {name:"EmailService.cs",path:"webapp/EmailService.cs",content:"using System;\nusing System.Configuration;\nusing System.Net.Mail;\n\nnamespace LegacyApp {\n    public class EmailService {\n        private readonly string _host;\n        public EmailService() { _host = ConfigurationManager.AppSettings[\"Smtp\"] ?? \"localhost\"; }\n\n        public bool Send(string to, string subj, string body) {\n            try {\n                var c = new SmtpClient(_host, 25);\n                var m = new MailMessage(\"no-reply@app.com\", to, subj, body);\n                m.IsBodyHtml = true;\n                c.Send(m);\n                return true;\n            } catch (Exception ex) { Console.WriteLine(ex.Message); return false; }\n        }\n    }\n}\n"}
    ]
  },
  {
    id:"android",name:"App Android Legacy",lang:"java",icon:"\ud83d\udcf1",
    desc:"Android Java con AsyncTask, MVP y XML Views — 4 archivos",difficulty:"advanced",suggest:{to:"Kotlin 2.0",score:"~75"},
    files:[
      {name:"MainActivity.java",path:"app/ui/MainActivity.java",content:"package com.legacy.app;\nimport android.os.Bundle;\nimport android.os.AsyncTask;\nimport android.widget.ListView;\nimport android.widget.Toast;\nimport android.support.v7.app.AppCompatActivity;\nimport java.util.List;\nimport java.util.ArrayList;\n\npublic class MainActivity extends AppCompatActivity {\n    private ListView listView;\n    private UserAdapter adapter;\n    private List<User> users = new ArrayList<>();\n\n    @Override\n    protected void onCreate(Bundle savedInstanceState) {\n        super.onCreate(savedInstanceState);\n        setContentView(R.layout.activity_main);\n        listView = (ListView) findViewById(R.id.user_list);\n        adapter = new UserAdapter(this, users);\n        listView.setAdapter(adapter);\n        new LoadUsersTask().execute(\"https://api.example.com/users\");\n    }\n\n    private class LoadUsersTask extends AsyncTask<String, Integer, List<User>> {\n        @Override\n        protected List<User> doInBackground(String... urls) {\n            try {\n                ApiService api = new ApiService();\n                return api.getUsers(urls[0]);\n            } catch (Exception e) {\n                return new ArrayList<>();\n            }\n        }\n\n        @Override\n        protected void onPostExecute(List<User> result) {\n            users.clear();\n            users.addAll(result);\n            adapter.notifyDataSetChanged();\n            if (result.isEmpty()) {\n                Toast.makeText(MainActivity.this, \"No users\", Toast.LENGTH_SHORT).show();\n            }\n        }\n    }\n\n    @Override\n    protected void onActivityResult(int requestCode, int resultCode, android.content.Intent data) {\n        super.onActivityResult(requestCode, resultCode, data);\n        if (requestCode == 100 && resultCode == RESULT_OK) {\n            new LoadUsersTask().execute(\"https://api.example.com/users\");\n        }\n    }\n}\n"},
      {name:"UserFragment.java",path:"app/ui/UserFragment.java",content:"package com.legacy.app;\nimport android.os.Bundle;\nimport android.view.LayoutInflater;\nimport android.view.View;\nimport android.view.ViewGroup;\nimport android.widget.TextView;\nimport android.widget.Button;\nimport android.widget.ProgressBar;\nimport android.support.v4.app.Fragment;\nimport android.support.v4.content.LocalBroadcastManager;\nimport android.content.IntentFilter;\nimport android.content.BroadcastReceiver;\nimport android.content.Context;\nimport android.content.Intent;\n\npublic class UserFragment extends Fragment {\n    private TextView nameText;\n    private TextView emailText;\n    private Button editBtn;\n    private ProgressBar progress;\n    private UserPresenter presenter;\n\n    private BroadcastReceiver updateReceiver = new BroadcastReceiver() {\n        @Override\n        public void onReceive(Context context, Intent intent) {\n            String userId = intent.getStringExtra(\"user_id\");\n            if (userId != null) presenter.loadUser(userId);\n        }\n    };\n\n    @Override\n    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle saved) {\n        View view = inflater.inflate(R.layout.fragment_user, container, false);\n        nameText = (TextView) view.findViewById(R.id.user_name);\n        emailText = (TextView) view.findViewById(R.id.user_email);\n        editBtn = (Button) view.findViewById(R.id.edit_btn);\n        progress = (ProgressBar) view.findViewById(R.id.progress);\n        presenter = new UserPresenter(this);\n        editBtn.setOnClickListener(new View.OnClickListener() {\n            @Override\n            public void onClick(View v) {\n                presenter.onEditClicked();\n            }\n        });\n        return view;\n    }\n\n    @Override\n    public void onResume() {\n        super.onResume();\n        LocalBroadcastManager.getInstance(getContext())\n            .registerReceiver(updateReceiver, new IntentFilter(\"USER_UPDATED\"));\n    }\n\n    @Override\n    public void onPause() {\n        LocalBroadcastManager.getInstance(getContext()).unregisterReceiver(updateReceiver);\n        super.onPause();\n    }\n\n    public void showUser(User user) {\n        nameText.setText(user.getName());\n        emailText.setText(user.getEmail());\n    }\n\n    public void showLoading(boolean show) {\n        progress.setVisibility(show ? View.VISIBLE : View.GONE);\n    }\n}\n"},
      {name:"ApiService.java",path:"app/data/ApiService.java",content:"package com.legacy.app;\nimport java.net.HttpURLConnection;\nimport java.net.URL;\nimport java.io.BufferedReader;\nimport java.io.InputStreamReader;\nimport java.util.List;\nimport java.util.ArrayList;\nimport org.json.JSONArray;\nimport org.json.JSONObject;\n\npublic class ApiService {\n    private static final String BASE_URL = \"https://api.example.com\";\n\n    public List<User> getUsers(String url) throws Exception {\n        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();\n        conn.setRequestMethod(\"GET\");\n        conn.setRequestProperty(\"Content-Type\", \"application/json\");\n        conn.setConnectTimeout(15000);\n        conn.setReadTimeout(15000);\n\n        int code = conn.getResponseCode();\n        if (code != 200) throw new Exception(\"HTTP \" + code);\n\n        BufferedReader reader = new BufferedReader(\n            new InputStreamReader(conn.getInputStream()));\n        StringBuilder sb = new StringBuilder();\n        String line;\n        while ((line = reader.readLine()) != null) sb.append(line);\n        reader.close();\n        conn.disconnect();\n\n        List<User> users = new ArrayList<>();\n        JSONArray arr = new JSONArray(sb.toString());\n        for (int i = 0; i < arr.length(); i++) {\n            JSONObject obj = arr.getJSONObject(i);\n            users.add(new User(\n                obj.getString(\"id\"),\n                obj.getString(\"name\"),\n                obj.getString(\"email\"),\n                obj.optString(\"role\", \"viewer\")\n            ));\n        }\n        return users;\n    }\n\n    public User updateUser(String id, String name, String email) throws Exception {\n        HttpURLConnection conn = (HttpURLConnection) new URL(BASE_URL + \"/users/\" + id).openConnection();\n        conn.setRequestMethod(\"PUT\");\n        conn.setRequestProperty(\"Content-Type\", \"application/json\");\n        conn.setDoOutput(true);\n        String body = String.format(\"{\\\"name\\\":\\\"%s\\\",\\\"email\\\":\\\"%s\\\"}\" , name, email);\n        conn.getOutputStream().write(body.getBytes(\"UTF-8\"));\n        conn.getOutputStream().close();\n\n        if (conn.getResponseCode() != 200) throw new Exception(\"Update failed\");\n        conn.disconnect();\n        return new User(id, name, email, \"viewer\");\n    }\n}\n"},
      {name:"UserAdapter.java",path:"app/ui/UserAdapter.java",content:"package com.legacy.app;\nimport android.content.Context;\nimport android.view.LayoutInflater;\nimport android.view.View;\nimport android.view.ViewGroup;\nimport android.widget.ArrayAdapter;\nimport android.widget.TextView;\nimport android.widget.ImageView;\nimport java.util.List;\n\npublic class UserAdapter extends ArrayAdapter<User> {\n    private LayoutInflater inflater;\n\n    public UserAdapter(Context context, List<User> users) {\n        super(context, 0, users);\n        inflater = LayoutInflater.from(context);\n    }\n\n    @Override\n    public View getView(int position, View convertView, ViewGroup parent) {\n        ViewHolder holder;\n        if (convertView == null) {\n            convertView = inflater.inflate(R.layout.item_user, parent, false);\n            holder = new ViewHolder();\n            holder.name = (TextView) convertView.findViewById(R.id.item_name);\n            holder.email = (TextView) convertView.findViewById(R.id.item_email);\n            holder.role = (TextView) convertView.findViewById(R.id.item_role);\n            holder.avatar = (ImageView) convertView.findViewById(R.id.item_avatar);\n            convertView.setTag(holder);\n        } else {\n            holder = (ViewHolder) convertView.getTag();\n        }\n\n        User user = getItem(position);\n        if (user != null) {\n            holder.name.setText(user.getName());\n            holder.email.setText(user.getEmail());\n            holder.role.setText(user.getRole());\n        }\n        return convertView;\n    }\n\n    static class ViewHolder {\n        TextView name;\n        TextView email;\n        TextView role;\n        ImageView avatar;\n    }\n}\n"}
    ]
  },
  {
    id:"dashboard",name:"Dashboard React JS",lang:"javascript",icon:"📊",
    desc:"React class components con state — 3 archivos renderizables",difficulty:"intermediate",suggest:{to:"TypeScript React",score:"~88"},
    files:[
      {name:"App.jsx",path:"dashboard/App.jsx",content:"import React from \"react\";\nimport Dashboard from \"./Dashboard\";\nimport UserList from \"./UserList\";\n\nvar USERS = [\n  {id:1,name:\"Ana Torres\",email:\"ana@demo.com\",role:\"admin\",score:92,active:true},\n  {id:2,name:\"Carlos Ruiz\",email:\"carlos@demo.com\",role:\"editor\",score:78,active:true},\n  {id:3,name:\"Diana Lopez\",email:\"diana@demo.com\",role:\"viewer\",score:65,active:false},\n  {id:4,name:\"Erik Soto\",email:\"erik@demo.com\",role:\"editor\",score:88,active:true},\n  {id:5,name:\"Fabiola Rios\",email:\"fabi@demo.com\",role:\"admin\",score:95,active:true},\n  {id:6,name:\"Gabriel Paz\",email:\"gabriel@demo.com\",role:\"viewer\",score:42,active:false},\n  {id:7,name:\"Helena Cruz\",email:\"helena@demo.com\",role:\"editor\",score:71,active:true},\n  {id:8,name:\"Ivan Mena\",email:\"ivan@demo.com\",role:\"viewer\",score:58,active:true}\n];\n\nclass App extends React.Component {\n  constructor(props) {\n    super(props);\n    this.state = { users: USERS, filter: \"all\", search: \"\", sortBy: \"name\", dark: false };\n    this.handleFilter = this.handleFilter.bind(this);\n    this.handleSearch = this.handleSearch.bind(this);\n    this.handleSort = this.handleSort.bind(this);\n    this.handleToggleTheme = this.handleToggleTheme.bind(this);\n    this.handleToggleActive = this.handleToggleActive.bind(this);\n    this.handleDelete = this.handleDelete.bind(this);\n  }\n  handleFilter(f) { this.setState({filter: f}); }\n  handleSearch(e) { this.setState({search: e.target.value}); }\n  handleSort(s) { this.setState({sortBy: s}); }\n  handleToggleTheme() { this.setState(function(st) { return {dark: !st.dark}; }); }\n  handleToggleActive(id) {\n    this.setState(function(st) {\n      return {users: st.users.map(function(u) {\n        return u.id === id ? Object.assign({}, u, {active: !u.active}) : u;\n      })};\n    });\n  }\n  handleDelete(id) {\n    this.setState(function(st) {\n      return {users: st.users.filter(function(u) { return u.id !== id; })};\n    });\n  }\n  render() {\n    var st = this.state;\n    var bg = st.dark ? \"#1a1a2e\" : \"#f0f2f5\";\n    var fg = st.dark ? \"#e0e0e0\" : \"#333\";\n    var card = st.dark ? \"#16213e\" : \"#fff\";\n    return React.createElement(\"div\", {style:{minHeight:\"100vh\",background:bg,color:fg,fontFamily:\"Segoe UI, sans-serif\",padding:24,transition:\"all 0.3s\"}},\n      React.createElement(\"div\", {style:{maxWidth:900,margin:\"0 auto\"}},\n        React.createElement(\"div\", {style:{display:\"flex\",justifyContent:\"space-between\",alignItems:\"center\",marginBottom:24}},\n          React.createElement(\"h1\", {style:{margin:0,fontSize:28}}, \"User Dashboard\"),\n          React.createElement(\"button\", {onClick:this.handleToggleTheme, style:{padding:\"8px 16px\",borderRadius:8,border:\"none\",background:st.dark?\"#e0e0e0\":\"#333\",color:st.dark?\"#333\":\"#fff\",cursor:\"pointer\"}}, st.dark ? \"Light\" : \"Dark\")\n        ),\n        React.createElement(Dashboard, {users:st.users,dark:st.dark,cardBg:card}),\n        React.createElement(UserList, {users:st.users,filter:st.filter,search:st.search,sortBy:st.sortBy,dark:st.dark,cardBg:card,\n          onFilter:this.handleFilter,onSearch:this.handleSearch,onSort:this.handleSort,\n          onToggleActive:this.handleToggleActive,onDelete:this.handleDelete})\n      )\n    );\n  }\n}\n\nexport default App;\n"},
      {name:"Dashboard.jsx",path:"dashboard/Dashboard.jsx",content:"import React from \"react\";\n\nclass Dashboard extends React.Component {\n  render() {\n    var users = this.props.users;\n    var cardBg = this.props.cardBg;\n    var total = users.length;\n    var active = users.filter(function(u) { return u.active; }).length;\n    var inactive = total - active;\n    var avg = total > 0 ? Math.round(users.reduce(function(s,u) { return s + u.score; }, 0) / total) : 0;\n    var roles = {};\n    users.forEach(function(u) { roles[u.role] = (roles[u.role] || 0) + 1; });\n    var maxRole = Math.max.apply(null, Object.values(roles).concat([1]));\n    var cardStyle = {flex:1,padding:16,borderRadius:12,background:cardBg,boxShadow:\"0 2px 8px rgba(0,0,0,0.1)\",textAlign:\"center\"};\n    var stats = [\n      {label:\"Total\",value:total,color:\"#6366f1\"},\n      {label:\"Active\",value:active,color:\"#22c55e\"},\n      {label:\"Inactive\",value:inactive,color:\"#ef4444\"},\n      {label:\"Avg Score\",value:avg,color:\"#f59e0b\"}\n    ];\n    return React.createElement(\"div\", {style:{marginBottom:24}},\n      React.createElement(\"div\", {style:{display:\"flex\",gap:16,marginBottom:16}},\n        stats.map(function(s) {\n          return React.createElement(\"div\", {key:s.label,style:cardStyle},\n            React.createElement(\"div\", {style:{fontSize:32,fontWeight:\"bold\",color:s.color}}, s.value),\n            React.createElement(\"div\", {style:{fontSize:14,opacity:0.7,marginTop:4}}, s.label)\n          );\n        })\n      ),\n      React.createElement(\"div\", {style:{background:cardBg,borderRadius:12,padding:16,boxShadow:\"0 2px 8px rgba(0,0,0,0.1)\"}},\n        React.createElement(\"h3\", {style:{margin:\"0 0 12px\",fontSize:16}}, \"Roles Distribution\"),\n        React.createElement(\"div\", {style:{display:\"flex\",gap:12,alignItems:\"flex-end\",height:80}},\n          Object.keys(roles).map(function(r) {\n            var pct = (roles[r] / maxRole) * 100;\n            return React.createElement(\"div\", {key:r,style:{flex:1,textAlign:\"center\"}},\n              React.createElement(\"div\", {style:{height:pct*0.7,background:\"linear-gradient(180deg,#6366f1,#8b5cf6)\",borderRadius:\"6px 6px 0 0\",minHeight:8,transition:\"height 0.3s\"}}),\n              React.createElement(\"div\", {style:{fontSize:12,marginTop:4,opacity:0.7}}, r),\n              React.createElement(\"div\", {style:{fontSize:14,fontWeight:\"bold\"}}, roles[r])\n            );\n          })\n        )\n      )\n    );\n  }\n}\n\nexport default Dashboard;\n"},
      {name:"UserList.jsx",path:"dashboard/UserList.jsx",content:"import React from \"react\";\n\nclass UserList extends React.Component {\n  getFiltered() {\n    var p = this.props;\n    var list = p.users.slice();\n    if (p.filter \\!== \"all\") {\n      list = list.filter(function(u) { return p.filter === \"active\" ? u.active : \\!u.active; });\n    }\n    if (p.search) {\n      var q = p.search.toLowerCase();\n      list = list.filter(function(u) { return u.name.toLowerCase().indexOf(q) \\!== -1 || u.email.toLowerCase().indexOf(q) \\!== -1; });\n    }\n    var sortBy = p.sortBy;\n    list.sort(function(a, b) {\n      if (sortBy === \"score\") return b.score - a.score;\n      if (sortBy === \"role\") return a.role.localeCompare(b.role);\n      return a.name.localeCompare(b.name);\n    });\n    return list;\n  }\n  render() {\n    var p = this.props;\n    var cardBg = p.cardBg;\n    var list = this.getFiltered();\n    var filters = [\"all\",\"active\",\"inactive\"];\n    var sorts = [\"name\",\"score\",\"role\"];\n    var colors = {admin:\"#6366f1\",editor:\"#22c55e\",viewer:\"#f59e0b\"};\n    return React.createElement(\"div\", {style:{background:cardBg,borderRadius:12,padding:16,boxShadow:\"0 2px 8px rgba(0,0,0,0.1)\"}},\n      React.createElement(\"input\", {type:\"text\",placeholder:\"Search users...\",value:p.search,onChange:p.onSearch,\n        style:{width:\"100%\",padding:\"10px 14px\",borderRadius:8,border:\"1px solid #ddd\",marginBottom:12,fontSize:14,boxSizing:\"border-box\"}}),\n      React.createElement(\"div\", {style:{display:\"flex\",gap:8,marginBottom:12}},\n        filters.map(function(f) {\n          var act = p.filter === f;\n          return React.createElement(\"button\", {key:f,onClick:function(){p.onFilter(f);},\n            style:{padding:\"6px 14px\",borderRadius:6,border:\"none\",background:act?\"#6366f1\":\"#e5e7eb\",color:act?\"#fff\":\"#333\",cursor:\"pointer\",fontWeight:act?\"bold\":\"normal\"}\n          }, f.charAt(0).toUpperCase()+f.slice(1));\n        }),\n        React.createElement(\"div\",{style:{flex:1}}),\n        sorts.map(function(s) {\n          var act = p.sortBy === s;\n          return React.createElement(\"button\", {key:s,onClick:function(){p.onSort(s);},\n            style:{padding:\"6px 10px\",borderRadius:6,border:\"1px solid \"+(act?\"#6366f1\":\"#ddd\"),background:\"transparent\",color:act?\"#6366f1\":\"#666\",cursor:\"pointer\",fontSize:12}\n          }, s);\n        })\n      ),\n      React.createElement(\"div\", {style:{fontSize:13,opacity:0.6,marginBottom:8}}, list.length+\" users\"),\n      list.map(function(u) {\n        var initials = u.name.split(\" \").map(function(w){return w[0];}).join(\"\");\n        return React.createElement(\"div\", {key:u.id, style:{display:\"flex\",alignItems:\"center\",padding:\"10px 0\",borderBottom:\"1px solid rgba(0,0,0,0.06)\"}},\n          React.createElement(\"div\", {style:{width:36,height:36,borderRadius:\"50%\",background:colors[u.role]||\"#999\",display:\"flex\",alignItems:\"center\",justifyContent:\"center\",color:\"#fff\",fontWeight:\"bold\",fontSize:14,marginRight:12}}, initials),\n          React.createElement(\"div\", {style:{flex:1}},\n            React.createElement(\"div\", {style:{fontWeight:600,fontSize:14}}, u.name),\n            React.createElement(\"div\", {style:{fontSize:12,opacity:0.6}}, u.email)\n          ),\n          React.createElement(\"span\", {style:{padding:\"2px 8px\",borderRadius:4,fontSize:11,background:colors[u.role]+\"22\",color:colors[u.role],marginRight:12}}, u.role),\n          React.createElement(\"div\", {style:{width:40,textAlign:\"center\",fontWeight:\"bold\",color:u.score>=80?\"#22c55e\":u.score>=60?\"#f59e0b\":\"#ef4444\",marginRight:12}}, u.score),\n          React.createElement(\"button\", {onClick:function(){p.onToggleActive(u.id);},\n            style:{padding:\"4px 10px\",borderRadius:6,border:\"none\",background:u.active?\"#dcfce7\":\"#fee2e2\",color:u.active?\"#16a34a\":\"#dc2626\",cursor:\"pointer\",fontSize:12,marginRight:8}\n          }, u.active?\"Active\":\"Inactive\"),\n          React.createElement(\"button\", {onClick:function(){p.onDelete(u.id);},\n            style:{padding:\"4px 8px\",borderRadius:6,border:\"none\",background:\"#fef2f2\",color:\"#dc2626\",cursor:\"pointer\",fontSize:12}\n          }, \"X\")\n        );\n      })\n    );\n  }\n}\n\nexport default UserList;\n"}
    ]
  },
];

function detectLang(fn) {
  var ext = "." + fn.split(".").pop().toLowerCase();
  var keys = Object.keys(LANGS);
  for (var i = 0; i < keys.length; i++) {
    if (LANGS[keys[i]].x.indexOf(ext) >= 0) return keys[i];
  }
  return null;
}

// detectVer extracted to ./services/migrationPhases.js

// doAnalyze extracted to ./services/reportGenerators.js

// doDeepAnalysis, generateAndroidReport extracted to ./services/migrationPhases.js

// generateReportHTML extracted to ./services/reportGenerators.js

// callClaude extracted to ./services/claudeClient.js

// generateTestSuite, executeSandbox, runTestSuite, generateAndRunQA extracted to ./services/qaSandbox.js


// runVirtualQA, compareVirtualQA, compareQAResults extracted to ./services/qaHelpers.js

// exportTestsAsCode extracted to ./services/reportGenerators.js

// doCodebaseAnalysis, doFilePlan, doMigrate, doDependencyAudit, doConsolidation,
// SCORING_RUBRIC, doIntegrationCheck, doIntegrationFix, doReview, doFixPlan
// extracted to ./services/migrationPhases.js
// Utility functions (safeParseJSON, mkDiff, mkRisks, syntaxHL) imported from ./services/utils.js
// THEMES imported from ./config/themes.js

function AppInner() {
  var [dark,setDark]=useState(false);
  var [uiL,setUiL]=useState("es");
  var T=dark?THEMES.dark:THEMES.light;

  // Sub-components (memoized — recreate only when theme changes)
  var hlCache=useRef(new Map());
  var Dots=useMemo(function(){return function(p){return <span style={{display:"inline-flex",gap:2}}>{[0,1,2,3,4].map(function(i){return <span key={i} style={{width:6,height:6,borderRadius:"50%",background:i<p.n?T.bl:T.bdL}} />})}</span>}},[T.bl,T.bdL]);
  var CodeLine=useMemo(function(){return function(p){
    var key=(p.lang||"")+":|:"+p.text;
    var cached=hlCache.current.get(key);
    if(!cached){cached=syntaxHL(p.text||"",p.lang||"");hlCache.current.set(key,cached);if(hlCache.current.size>2000)hlCache.current.clear()}
    return <span>{cached.map(function(s,i){return s.color?<span key={i} style={{color:s.color}}>{s.text}</span>:<span key={i}>{s.text}</span>})}</span>
  }},[]);

  // Persistent storage: load dark mode + language preference on mount
  useEffect(function(){
    (async function(){
      try {
        var dkr=await window.storage.get("migraops:dark");
        if(dkr&&dkr.value==="true")setDark(true);
      } catch(e){}
      try {
        var lng=await window.storage.get("migraops:lang");
        if(lng&&lng.value)setUiL(lng.value);
      } catch(e){}
    })();
  },[]);
  // Persist dark mode changes
  var toggleDark=function(){
    setDark(function(d){var nv=!d;try{window.storage.set("migraops:dark",String(nv))}catch(e){};return nv});
  };
  // Persist language changes  
  var changeUiL=function(code){
    setUiL(code);try{window.storage.set("migraops:lang",code)}catch(e){}
  };

  // History search (debounced)
  var [histSearch,setHistSearch]=useState("");
  var [histQ,setHistQ]=useState("");
  var histTimer=useRef(null);
  var onHistSearch=function(v){setHistSearch(v);clearTimeout(histTimer.current);histTimer.current=setTimeout(function(){setHistQ(v)},200)};

  // Responsive
  var [isMobile,setIsMobile]=useState(window.innerWidth<768);
  useEffect(function(){
    var h=function(){setIsMobile(window.innerWidth<768)};
    window.addEventListener("resize",h);return function(){window.removeEventListener("resize",h)};
  },[]);
  var t=i18n[uiL];
  var [vw,setVw]=useState("upload");
  var [files,setFiles]=useState([]);
  var [selF,setSelF]=useState(null);
  var [sL,setSL]=useState("");
  var [sV,setSV]=useState("");
  var [det,setDet]=useState(null);
  var [man,setMan]=useState(false);
  var [tL,setTL]=useState("");
  var [tV,setTV]=useState("");
  var [mt,setMt]=useState("version");
  var [mod,setMod]=useState("claude-sonnet-4-5-20250929");
  var [res,setRes]=useState([]);
  var [prog,setProg]=useState(0);
  var [hist,setHist]=useState([{id:1,_migTs:1,date:"11/03/2026 14:30",from:"Python 2.7",to:"Python 3.12",ml:"Sonnet 4.5",fc:4,results:[{name:"report.py",targetName:"report.py",original:"# Report - Python 2.7\nimport time\nclass Reporter:\n  def __init__(self,out=\"reports\"):\n    self.out=out\n  def generate(self,data):\n    print \"Generating...\"\n    for k,v in data.iteritems():\n      print k,v\n    return True",migrated:"# Report - Python 3.12\nfrom pathlib import Path\nfrom typing import Dict\n\nclass Reporter:\n  def __init__(self, out: str = \"reports\") -> None:\n    self.out = Path(out)\n  def generate(self, data: Dict) -> bool:\n    print(\"Generating...\")\n    for k, v in data.items():\n      print(k, v)\n    return True",changes:9},{name:"db_connector.py",targetName:"db_connector.py",original:"# DB Connector\nimport urllib2\nclass DBConn:\n  def connect(self):\n    req=urllib2.Request(\"http://db\")\n    return urllib2.urlopen(req)",migrated:"# DB Connector\nimport urllib.request\nfrom typing import Optional\n\nclass DBConn:\n  def connect(self) -> Optional[bytes]:\n    req = urllib.request.Request(\"http://db\")\n    return urllib.request.urlopen(req).read()",changes:8},{name:"transformers.py",targetName:"transformers.py",original:"# Transformers\ndef clean(data):\n  if isinstance(data,basestring):\n    return data.strip()\n  return data",migrated:"# Transformers\nfrom typing import Any\n\ndef clean(data: Any) -> Any:\n  if isinstance(data, str):\n    return data.strip()\n  return data",changes:7},{name:"pipeline.py",targetName:"pipeline.py",original:"# Pipeline\nclass Pipeline:\n  def run(self):\n    print \"Running...\"\n    map(self.process, self.items)\n    print \"Done\"",migrated:"# Pipeline\nfrom typing import List\n\nclass Pipeline:\n  def run(self) -> None:\n    print(\"Running...\")\n    list(map(self.process, self.items))\n    print(\"Done\")",changes:11}],risks:[{level:"medium",msg:"Sintaxis print statement a function",file:"report.py"},{level:"high",msg:"urllib2 removido en Python 3",file:"db_connector.py"},{level:"low",msg:"basestring no existe en Python 3",file:"transformers.py"}],audit:{id:"MIG-1773250076592",startedAt:"2026-03-11T14:27:56",completedAt:"2026-03-11T14:37:54",totalDurationMs:598000,finalScore:90,finalPass:true,config:{source:"Python 2.7",target:"Python 3.12",model:"Sonnet 4.5",fileCount:4},phases:[{id:"A",name:"Codebase Analysis",phase:"analysis",durationMs:44000,status:"done",detail:"ETL pipeline that extracts JSON data from HTTP endpoints"},{id:"B",name:"File Migration",phase:"migration",durationMs:124000,status:"done",files:[{source:"report.py",target:"report.py",durationMs:35000,changes:9},{source:"db_connector.py",target:"db_connector.py",durationMs:32000,changes:8},{source:"transformers.py",target:"transformers.py",durationMs:25000,changes:7},{source:"pipeline.py",target:"pipeline.py",durationMs:32000,changes:11}]},{id:"B2a",name:"Dependency Audit",phase:"consolidation",durationMs:34000,status:"done",detail:"4 connections, 11 issues"},{id:"B2b",name:"Consolidation Fix",phase:"consolidation",durationMs:40000,status:"done",detail:"Fixed: 4"},{id:"C1",name:"Integration Check #1",phase:"integration",durationMs:66000,status:"done",detail:"Score: 74, Issues: 10, 2 critical",score:74},{id:"D1",name:"Integration Fix #1",phase:"qa",durationMs:59000,status:"done",detail:"Issues: 10, Fixed: 4"},{id:"C2",name:"Integration Check #2",phase:"integration",durationMs:64000,status:"done",detail:"Score: 90, Issues: 5",score:90},{id:"D2",name:"Integration Fix #2",phase:"qa",durationMs:81000,status:"done",detail:"Issues: 5, Fixed: 3"},{id:"C3",name:"Integration Check #3",phase:"integration",durationMs:86000,status:"done",detail:"Score: 90",score:90}]}}]);
  var [actR,setActR]=useState(0);
  var [dm,setDm]=useState("split");
  var [rsk,setRsk]=useState([]);
  var [shR,setShR]=useState(false);
  var [logs,setLogs]=useState([]);
  var [tOut,setTOut]=useState(null);
  var [deepR,setDeepR]=useState(null);
  var [deepLd,setDeepLd]=useState(false);
  var [tTab,setTTab]=useState("mig");
  var [aiR,setAiR]=useState(null);
  var [aiLd,setAiLd]=useState(false);
  var [fixR,setFixR]=useState(null);
  var [fixLd,setFixLd]=useState(false);
  var [fixTab,setFixTab]=useState("plan");
  var [migPhase,setMigPhase]=useState("");
  var [activeAgent,setActiveAgent]=useState(null);
  var [intR,setIntR]=useState(null);
  var [cbA,setCbA]=useState(null);
  var [shCfg,setShCfg]=useState(false);
  var [cfgTab,setCfgTab]=useState("prompts");
  var [pMapEdit,setPMapEdit]=useState(null);
  var [pr,setPr]=useState(JSON.parse(JSON.stringify(DPROMPTS)));
  var [drg,setDrg]=useState(false);
  var [shTP,setShTP]=useState(false);
  var [prevProj,setPrevProj]=useState(null);
  var [graphSel,setGraphSel]=useState(null);
  var [pdfLd,setPdfLd]=useState(false);
  var [audTab,setAudTab]=useState("pipeline"); // pipeline | charts | detail
  var [audExpand,setAudExpand]=useState({});
  var [tick,setTick]=useState(0);
  var [andReport,setAndReport]=useState(null);
  var [resTab,setResTab]=useState("code");
  var [sideTools,setSideTools]=useState(false);
  var [histView,setHistView]=useState("cards");
  var [qaPhase,setQaPhase]=useState("");
  var [qaSteps,setQaSteps]=useState([]);
  var [qaExpand,setQaExpand]=useState({});
  var [qaFilter,setQaFilter]=useState("all");
  var [qaHist,setQaHist]=useState([]);
  var [complianceR,setComplianceR]=useState(null);
  var [toasts,setToasts]=useState([]);
  var [hovLang,setHovLang]=useState(null);
  var [hovLangPos,setHovLangPos]=useState({x:0,y:0});
  var [ghPanel,setGhPanel]=useState(false);
  var [ghToken,setGhToken]=useState("");
  var [ghRepo,setGhRepo]=useState("");
  var [ghData,setGhData]=useState(null);
  var [ghBranch,setGhBranch]=useState("");
  var [ghTree,setGhTree]=useState(null);
  var [ghSelected,setGhSelected]=useState({});
  var [ghLoading,setGhLoading]=useState("");
  var [ghCommits,setGhCommits]=useState([]);
  var [ghError,setGhError]=useState("");
  var [confettiOn,setConfettiOn]=useState(false);
  var [migSessions,setMigSessions]=useState([]);
  var [activeSessionId,setActiveSessionId]=useState(null);
  var sessionCounter=useRef(0);
  var [qaTests,setQaTests]=useState(null); // {suite:[...], jsTranslations:{...}}
  var [qaTestsLd,setQaTestsLd]=useState(false);
  var [qaPreR,setQaPreR]=useState(null); // pre-migration results
  var [qaPostR,setQaPostR]=useState(null); // post-migration results
  var [shQaPanel,setShQaPanel]=useState(false);
  var [qaVPreR,setQaVPreR]=useState(null); // virtual pre-migration results
  var [qaVPostR,setQaVPostR]=useState(null); // virtual post-migration results
  var [qaTab,setQaTab]=useState("sandbox");
  var [pwPre,_setPwPre]=useState(null); var pwPreRef=useRef(null);
  var setPwPre=function(v){pwPreRef.current=v;_setPwPre(v);};
  var [pwPost,setPwPost]=useState(null);
  var [pwComparison,setPwComparison]=useState(null);
  var [visualQA,setVisualQA]=useState(null);
  var [isLoggedIn,setIsLoggedIn]=useState(false);
  var [userName,setUserName]=useState("");
  var [loginInput,setLoginInput]=useState("");
  var [sideCol,setSideCol]=useState(false);
  var [histSort,setHistSort]=useState("date"); // "sandbox" | "virtual"
  var [andReportLd,setAndReportLd]=useState(false);
  var [shAndReport,setShAndReport]=useState(false);
  var [auditTrail,setAuditTrail]=useState(null);
  var [migStartTs,setMigStartTs]=useState(0);
  var fr=useRef(null);
  var tickRef=useRef(null);
  var cancelRef=useRef(false);
  var activeAbortRef=useRef(null); // holds the current fetch's AbortController so cancel can kill it
  var globalTimerRef=useRef(null); // global 8-min timeout

  // ═══ HUMAN-IN-THE-LOOP GATE SYSTEM ═══
  // Pipeline pauses at key phases and waits for human approval
  var [migGate,setMigGate]=useState(null); // { phase, title, message, data, options }
  var [migGateLog,setMigGateLog]=useState([]); // history of gate decisions
  var gateResolveRef=useRef(null);

  var waitForGate=useCallback(function(phase,title,message,data,options){
    return new Promise(function(resolve){
      gateResolveRef.current=resolve;
      setMigGate({phase:phase,title:title,message:message,data:data,options:options||{},ts:Date.now()});
    });
  },[]);

  var resolveGate=useCallback(function(approved,feedback){
    if(gateResolveRef.current){
      var decision={approved:approved,feedback:feedback||"",ts:Date.now()};
      setMigGateLog(function(p){return p.concat([Object.assign({},migGate,decision)])});
      gateResolveRef.current(decision);
      gateResolveRef.current=null;
      setMigGate(null);
    }
  },[migGate]);

  // Auto-collapse sidebar on mobile
  useEffect(function(){if(migPhase==="done"&&res.length>0){var already=hist.some(function(h){return h._migTs===migStartTs});if(!already&&migStartTs>0){var ml2=MODELS.find(function(m){return m.id===mod});var dur=migStartTs>0?Date.now()-migStartTs:0;var aud=auditTrail&&auditTrail.phases&&auditTrail.phases.length>0?Object.assign({},auditTrail):{id:"MIG-"+migStartTs,phases:logs.filter(function(l){return l.type==="phase"}).map(function(l,i){return{id:l.subPhase?l.phase.charAt(0).toUpperCase()+l.iter:l.phase.charAt(0).toUpperCase(),name:l.phase+(l.iter?" #"+l.iter:""),phase:l.phase,durationMs:l.durationMs||0,status:l.st||"done",detail:l.detail||"",score:l.score}}),config:{source:(LANGS[sL]||{}).n+" "+sV,target:(LANGS[tL]||{}).n+" "+tV,model:ml2?ml2.n:"",fileCount:files.length}};if(!aud.totalDurationMs)aud.totalDurationMs=dur;if(!aud.startedAt)aud.startedAt=new Date(migStartTs).toISOString();if(!aud.completedAt)aud.completedAt=new Date().toISOString();if(aud.finalScore===null||aud.finalScore===undefined){var sc=null;if(intR&&intR.ok&&intR.result)sc=intR.result.score;if(sc===null&&aud.phases){aud.phases.forEach(function(ph){if(ph.score!==undefined&&ph.score!==null&&(sc===null||ph.score>sc))sc=ph.score})}aud.finalScore=sc}setAuditTrail(aud);setHist(function(p){return [{id:Date.now(),_migTs:migStartTs,date:new Date().toLocaleString(),from:(LANGS[sL]||{}).n+" "+sV,to:(LANGS[tL]||{}).n+" "+tV,ml:ml2?ml2.n:"",fc:files.length,results:res,risks:rsk,integration:intR,audit:aud,visualQA:visualQA}].concat(p)})}}},[migPhase]);

  useEffect(function(){if(migPhase==="done"&&res.length>0&&vw==="migrating"){var t=setTimeout(function(){setVw("results")},2000);return function(){clearTimeout(t)}}},[migPhase,res.length,vw]);

  useEffect(function(){if(isMobile)setSideCol(true)},[isMobile]);

  // Heartbeat: tick every 1s when migrating so UI always shows movement
  useEffect(function(){
    if (vw==="migrating"||vw==="qa-running") {
      tickRef.current=setInterval(function(){setTick(function(t){return t+1})},1000);
      return function(){clearInterval(tickRef.current)};
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
      setTick(0);
    }
  },[vw]);

  // Keyboard shortcuts
  useEffect(function(){
    var handler=function(e){
      // Escape: close modals
      if (e.key==="Escape") {
        if (shCfg) { setShCfg(false); e.preventDefault(); return; }
      }
      // Only when not in input/textarea
      if (e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"||e.target.tagName==="SELECT") return;
      // Arrow keys: navigate files in results
      if (vw==="results"&&res.length>0) {
        if (e.key==="ArrowUp"||e.key==="k") { setActR(function(p){return Math.max(0,p-1)}); e.preventDefault(); }
        if (e.key==="ArrowDown"||e.key==="j") { setActR(function(p){return Math.min(res.length-1,p+1)}); e.preventDefault(); }
      }
      // D: toggle dark mode
      if (e.key==="d"&&!e.ctrlKey&&!e.metaKey) { toggleDark(); }
      // 1-4: switch views
      if (e.key==="1") setVw("upload");
      if (e.key==="2"&&files.length>0) setVw("configure");
      if (e.key==="3"&&res.length>0) setVw("results");
      if (e.key==="4") setVw("history");
    };
    window.addEventListener("keydown",handler);
    return function(){window.removeEventListener("keydown",handler)};
  },[vw,res.length,files.length,shCfg]);

  useEffect(function(){
    if (files.length&&sL&&!det) {
      var code=files.filter(function(f){return f.lang===sL}).map(function(f){return f.content}).join("\n");
      var d=detectVer(sL,code);
      setDet(d);
      if (d.v&&!man) setSV(d.v);
    }
  },[files,sL]);

  var addF=useCallback(function(nf){
    var arr=Array.from(nf),loaded=0,pend=[];
    arr.forEach(function(f){
      var rd=new FileReader();
      rd.onload=function(e){
        var lang=detectLang(f.name);
        pend.push({name:f.name,content:e.target.result,size:f.size,lang:lang,langN:lang?LANGS[lang].n:"?"});
        loaded++;
        if (loaded===arr.length){
          setFiles(function(p){return p.concat(pend)});
          if (!sL){var d=pend.find(function(x){return x.lang});if(d)setSL(d.lang);}
        }
      };
      rd.readAsText(f);
    });
  },[sL]);

  var loadProj=function(proj){
    var nf=proj.files.map(function(f){return{name:f.name,path:f.path,content:f.content,size:f.content.length,lang:proj.lang,langN:(LANGS[proj.lang]||{}).n||"?",project:proj.name}});
    setFiles(function(p){var ex=p.map(function(x){return x.name});return p.concat(nf.filter(function(x){return ex.indexOf(x.name)===-1}))});
    if (!sL) setSL(proj.lang);
    setDet(null);
  };

  var dlF=function(content,name){
    var b=new Blob([content],{type:"text/plain;charset=utf-8"});
    var u=URL.createObjectURL(b);
    var a=document.createElement("a");
    a.href=u;a.download=name;a.style.display="none";
    document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(u)},200);
  };

  var dlN=function(n,tgtName){
    // For cross-language: use the target name directly if provided
    var fileName=tgtName||n;
    var base=fileName.replace(/\.[^.]+$/,"");
    var extMap={typescript:"ts",python:"py",javascript:"js",java:"java",csharp:"cs",go:"go",rust:"rs",php:"php",ruby:"rb",kotlin:"kt"};
    var ext=extMap[tL]||fileName.split(".").pop();
    return "optimiza_"+base+"_"+tV.replace(/[^a-zA-Z0-9]/g,"").toLowerCase()+"."+ext;
  };

  // ═══ Timing helper ═══
  var fmtMs=function(ms){if(ms<1000)return ms+"ms";var s=Math.round(ms/1000);if(s<60)return s+"s";return Math.floor(s/60)+"m "+s%60+"s"};

    // LANG_META extracted to ./config/languages.js

  var addToast=function(msg,type){var id=Date.now();setToasts(function(p){return p.concat([{id:id,msg:msg,type:type||"info"}])});setTimeout(function(){setToasts(function(p){return p.filter(function(t2){return t2.id!==id})})},4000)};

  var go=async function(){
    var config = { files: files, sL: sL, sV: sV, tL: tL, tV: tV, mod: mod, uiL: uiL, pr: DPROMPTS };
    var emit = {
      setVw: setVw, setProg: setProg, setRes: setRes, setLogs: setLogs, setRsk: setRsk,
      setIntR: setIntR, setCbA: setCbA, setMigPhase: setMigPhase, setAuditTrail: setAuditTrail,
      setActiveAgent: setActiveAgent, setHist: setHist, setMigGate: setMigGate,
      setMigGateLog: setMigGateLog, setTOut: setTOut, setAiR: setAiR, setDeepR: setDeepR,
      setFixR: setFixR, addToast: addToast, setMigStartTs: setMigStartTs,
      cancelRef: cancelRef, globalTimerRef: globalTimerRef, gateResolveRef: gateResolveRef,
      setCancelled: setCancelled, setActiveController: setActiveController,
      waitForGate: waitForGate, APP: APP,
      setPwPre: setPwPre, setPwPost: setPwPost, setPwComparison: setPwComparison,
      setVisualQA: setVisualQA,
      getPwPre: function() { return pwPreRef.current; },
      onError: function(cb) {
        cb(res, rsk, intR);
      }
    };
    await runMigration(config, emit);
  };
  var rst=function(){
    resetMigration({
      setVw: setVw, setFiles: setFiles, setSL: setSL, setSV: setSV, setTL: setTL, setTV: setTV,
      setRes: setRes, setRsk: setRsk, setShR: setShR, setSelF: setSelF, setLogs: setLogs,
      setDet: setDet, setMan: setMan, setTOut: setTOut, setDeepR: setDeepR, setDeepLd: setDeepLd,
      setAiR: setAiR, setFixR: setFixR, setFixLd: setFixLd, setIntR: setIntR, setCbA: setCbA,
      setMigPhase: setMigPhase, setAuditTrail: setAuditTrail, setAudTab: setAudTab,
      setAudExpand: setAudExpand, setAndReport: setAndReport, setAndReportLd: setAndReportLd,
      setShAndReport: setShAndReport, setQaTests: setQaTests, setQaTestsLd: setQaTestsLd,
      setQaPreR: setQaPreR, setQaPostR: setQaPostR, setShQaPanel: setShQaPanel,
      setQaVPreR: setQaVPreR, setQaVPostR: setQaVPostR, setQaTab: setQaTab,
      setPwPre: setPwPre, setPwPost: setPwPost, setPwComparison: setPwComparison,
      setVisualQA: setVisualQA
    });
  };
  var generatePDF=function(){
    pipelineGeneratePDF({
      sL: sL, tL: tL, sV: sV, tV: tV, mod: mod,
      files: files, auditTrail: auditTrail, res: res, rsk: rsk, APP: APP
    }, setPdfLd);
  };
  // Dashboard stats
  var dashS={mig:hist.length,score:hist.length?Math.round(hist.reduce(function(s,h){return s+((h.integration&&h.integration.ok)?h.integration.result.score:0)},0)/hist.length):0,files:hist.reduce(function(s,h){return s+(h.fc||0)},0),tests:qaPreR?qaPreR.summary.total:0};

  var S={
    card:{background:T.w,border:"1px solid "+T.bdL,borderRadius:12,overflow:"hidden",boxShadow:T.shadowSm,transition:"border-color .2s,box-shadow .2s"},
    cH:{padding:"12px 20px",borderBottom:"1px solid "+T.bdL,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.blM},
    btn:function(v){
      var b={padding:"8px 18px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:T.ui,display:"inline-flex",alignItems:"center",gap:6,transition:"all .2s ease",letterSpacing:"-.01em"};
      if(v==="p")return Object.assign({},b,{background:"linear-gradient(135deg,"+T.gradA+","+T.gradB+")",color:"#fff",boxShadow:"0 2px 8px "+T.gradA+"40"});
      if(v==="g")return Object.assign({},b,{background:T.g,color:"#fff",boxShadow:"0 2px 8px "+T.g+"30"});
      if(v==="ai")return Object.assign({},b,{background:"linear-gradient(135deg,#6C5CE7,#A29BFE)",color:"#fff",boxShadow:"0 2px 8px rgba(108,92,231,.3)"});
      if(v==="r")return Object.assign({},b,{background:T.errBg,color:T.r,border:"1px solid "+T.errBd});
      return Object.assign({},b,{background:"transparent",color:T.txM,border:"1px solid "+T.bd});
    },
    sel:{padding:"8px 12px",borderRadius:8,border:"1px solid "+T.bd,background:T.inputBg,color:T.tx,fontSize:12,fontFamily:T.ui,outline:"none",cursor:"pointer",width:"100%",transition:"border-color .2s"},
    input:{padding:"8px 12px",borderRadius:8,border:"1px solid "+T.bd,background:T.inputBg,color:T.tx,fontSize:12,fontFamily:T.ui,outline:"none",width:"100%",boxSizing:"border-box",transition:"border-color .2s"}
  };

    var bR=function(lv){var m={high:{bg:T.errBg,c:T.r,l:t.hi},medium:{bg:T.warnBg,c:T.y,l:t.med},low:{bg:T.okBg,c:T.g,l:t.lo}};var x=m[lv]||m.low;return <span style={{padding:"2px 8px",borderRadius:16,fontSize:9,fontWeight:700,background:x.bg,color:x.c}}>{x.l}</span>};


  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.tx,fontFamily:T.ui}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fira+Code:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style dangerouslySetInnerHTML={{__html:"@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.8}}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes float1{0%,100%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(30px,-20px) rotate(120deg)}66%{transform:translate(-20px,15px) rotate(240deg)}}@keyframes float2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-25px,20px) scale(1.1)}}@keyframes float3{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(15px,-30px) rotate(90deg)}75%{transform:translate(-10px,25px) rotate(270deg)}}@keyframes glow{0%,100%{box-shadow:0 0 5px rgba(37,99,235,.2)}50%{box-shadow:0 0 20px rgba(37,99,235,.4)}}button:hover{filter:brightness(1.1)!important}input:focus,select:focus,textarea:focus{outline:none!important;border-color:rgba(37,99,235,.5)!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important}*{scrollbar-width:thin}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{border-radius:3px}"}}/>
      <style dangerouslySetInnerHTML={{__html:".hv-glow{transition:all .15s}.hv-glow:hover{background:rgba(37,99,235,.15)!important;box-shadow:inset 3px 0 0 #3B82F6!important}.hv-lift{transition:transform .2s,box-shadow .2s}.hv-lift:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08)}.hv-grow{transition:transform .2s}.hv-grow:hover{transform:scale(1.1)}.gtl{background:linear-gradient(135deg,#4338CA,#2563EB,#1D4ED8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.gtd{background:linear-gradient(135deg,#C7D2FE,#93A3F8,#60A5FA);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}"}}/>
      <style dangerouslySetInnerHTML={{__html:".hv-glow{transition:all .15s}.hv-glow:hover{background:rgba(37,99,235,.15)!important;box-shadow:inset 3px 0 0 #3B82F6!important}.hv-lift{transition:transform .2s,box-shadow .2s}.hv-lift:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08)}.hv-grow{transition:transform .2s}.hv-grow:hover{transform:scale(1.08)}"}}/>
      {!isLoggedIn&&<LoginScreen dark={dark} isMobile={isMobile} APP={APP} SII_LOGO_LG={SII_LOGO_LG} t={t} loginInput={loginInput} setLoginInput={setLoginInput} onLogin={function(name){setUserName(name);setIsLoggedIn(true);setVw("dashboard")}}/>}
      {isLoggedIn&&<div style={{display:"flex",height:"100vh"}}>
        <Sidebar dark={dark} sideCol={sideCol} setSideCol={setSideCol} vw={vw} setVw={setVw} T={T} t={t} SII_LOGO={SII_LOGO} userName={userName} resCount={res.length} filesCount={files.length} uiL={uiL} changeUiL={changeUiL} toggleDark={toggleDark} setShCfg={setShCfg}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{height:48,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",borderBottom:"1px solid "+T.bdL,background:T.hdrBg,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>{vw!=="dashboard"&&<button onClick={function(){var prev={upload:"dashboard",configure:"upload",results:"dashboard",history:"dashboard",migrating:"migrating"};setVw(prev[vw]||"dashboard")}} style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",color:T.txD,transition:"all .15s"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg></button>}<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.txD} strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg><span style={{fontSize:11,color:T.bdL}}>{"/"}</span><span style={{fontSize:13,fontWeight:700,color:T.nv}}>{vw==="dashboard"?t.dashTitle:vw==="upload"?t.upload:vw==="configure"?t.config:vw==="migrating"?"Migration":vw==="results"?t.results:vw==="history"?t.history:vw==="qa-running"?"QA Testing":""}</span>{sL&&tL&&(vw==="configure"||vw==="migrating"||vw==="results")&&<span style={{display:"inline-flex",alignItems:"center",gap:4,marginLeft:4}}><span style={{color:T.bdL}}>{"/"}</span><span style={{fontSize:11,fontWeight:600,color:T.bl}}>{(LANGS[sL]||{}).n+" > "+(LANGS[tL]||{}).n}</span></span>}</div>
            <span style={{fontSize:9,color:T.txD}}>{"v"+APP.v}</span>
          </div>
          <div style={{flex:1,overflow:"auto"}}>
          <div style={{maxWidth:1200,margin:"0 auto",padding:"20px 24px"}}>
            {vw==="dashboard"&&<DashboardView T={T} t={t} S={S} isMobile={isMobile} userName={userName} uiL={uiL} hist={hist} dashS={dashS} setVw={setVw}/>}
      {(vw==="upload"||vw==="configure"||vw==="migrating"||vw==="results")&&<Stepper vw={vw} T={T} t={t} isMobile={isMobile}/>}


      {vw==="upload" && <UploadView T={T} t={t} S={S} isMobile={isMobile} dark={dark} files={files} setFiles={setFiles} sL={sL} setSL={setSL} sV={sV} setSV={setSV} det={det} setDet={setDet} selF={selF} setSelF={setSelF} drg={drg} setDrg={setDrg} fr={fr} man={man} setMan={setMan} hovLang={hovLang} setHovLang={setHovLang} setHovLangPos={setHovLangPos} addF={addF} loadProj={loadProj} setVw={setVw} shTP={shTP} setShTP={setShTP} prevProj={prevProj} setPrevProj={setPrevProj} setGhPanel={setGhPanel} PROJECTS={PROJECTS}/>}


      {/* CONFIGURE */}
      {vw==="configure" && <ConfigureView T={T} t={t} S={S} isMobile={isMobile} dark={dark} files={files} sL={sL} sV={sV} tL={tL} tV={tV} mt={mt} mod={mod} setMt={setMt} setTL={setTL} setTV={setTV} setMod={setMod} setVw={setVw} setShCfg={setShCfg} go={go} uiL={uiL} res={res} qaTests={qaTests} setQaTests={setQaTests} qaPreR={qaPreR} setQaPreR={setQaPreR} qaPostR={qaPostR} setQaPostR={setQaPostR} qaVPreR={qaVPreR} setQaVPreR={setQaVPreR} qaVPostR={qaVPostR} setQaVPostR={setQaVPostR} qaTestsLd={qaTestsLd} setQaTestsLd={setQaTestsLd} qaTab={qaTab} setQaTab={setQaTab} shQaPanel={shQaPanel} setShQaPanel={setShQaPanel} andReport={andReport} setAndReport={setAndReport} andReportLd={andReportLd} setAndReportLd={setAndReportLd} shAndReport={shAndReport} setShAndReport={setShAndReport} Dots={Dots}/>}

      {/* MIGRATING — Professional Progress Dashboard */}
      {vw==="migrating" && <MigratingView tick={tick} migStartTs={migStartTs} files={files} logs={logs} res={res} prog={prog} migPhase={migPhase} mod={mod} T={T} t={t} S={S} dark={dark} sL={sL} tL={tL} sV={sV} tV={tV} setCancelled={setCancelled} setActiveController={setActiveController} _activeController={_activeController} setVw={setVw} setMigPhase={setMigPhase} setLogs={setLogs} fmtMs={fmtMs} cancelRef={cancelRef} globalTimerRef={globalTimerRef} migGate={migGate} resolveGate={resolveGate} activeAgent={activeAgent} intR={intR} setActR={setActR} setShR={setShR} pwPre={pwPre} pwComparison={pwComparison} visualQA={visualQA}/>}

      {/* RESULTS */}
      <ResultsView vw={vw} res={res} actR={actR} setActR={setActR} shR={shR} setShR={setShR} pdfLd={pdfLd} generatePDF={generatePDF} t={t} T={T} S={S} rsk={rsk} bR={bR} intR={intR} auditTrail={auditTrail} audTab={audTab} setAudTab={setAudTab} audExpand={audExpand} setAudExpand={setAudExpand} fmtMs={fmtMs} dlF={dlF} dlN={dlN} uiL={uiL} isMobile={isMobile} dark={dark} rst={rst} dm={dm} setDm={setDm} tOut={tOut} setTOut={setTOut} sL={sL} tL={tL} sV={sV} tV={tV} mod={mod} migStartTs={migStartTs} resTab={resTab} setResTab={setResTab} CodeLine={CodeLine} pwComparison={pwComparison} visualQA={visualQA}/>
      {/* DEPENDENCY GRAPH */}
      {vw==="graph"&&<DependencyGraph files={files} res={res} dark={dark} T={T} S={S} isMobile={isMobile} graphSel={graphSel} setGraphSel={setGraphSel}/>}

      {/* HISTORY */}
      {vw==="history" && <HistoryView T={T} t={t} S={S} isMobile={isMobile} hist={hist} dashS={dashS} histSearch={histSearch} onHistSearch={onHistSearch} histQ={histQ} histSort={histSort} setHistSort={setHistSort} fmtMs={fmtMs} dlF={dlF} dlN={dlN} setRes={setRes} setRsk={setRsk} setActR={setActR} setShR={setShR} setIntR={setIntR} setAuditTrail={setAuditTrail} setAudTab={setAudTab} setAudExpand={setAudExpand} setVw={setVw} setVisualQA={setVisualQA} setPwComparison={setPwComparison}/>}
          </div>
          </div>
        </div>
      </div>}
    
      {vw==="chat"&&<ChatView T={T} dark={dark} t={t} files={files} sL={sL} sV={sV} tL={tL} tV={tV} mod={mod} onFilesMigrated={function(migrated){setRes(migrated);setVw("results")}} />}

      {ghPanel&&<GitHubPanel T={T} dark={dark} t={t} onImportFiles={function(imported){setFiles(function(p){var existing=p.map(function(x){return x.name});return p.concat(imported.filter(function(x){return existing.indexOf(x.name)===-1}))});if(!sL&&imported.length>0&&imported[0].lang)setSL(imported[0].lang);setDet(null);setGhPanel(false)}} onClose={function(){setGhPanel(false)}} />}

      {/* LANGUAGE TOOLTIP PORTAL */}
      <LanguageTooltip hovLang={hovLang} hovLangPos={hovLangPos} setHovLang={setHovLang} dark={dark} T={T} t={t} setSL={setSL} setTL={setTL} setVw={setVw} filesCount={files.length}/>
      {/* PERSISTENT MIGRATION BANNER */}
          {migPhase&&migPhase!==""&&migPhase!=="done"&&vw!=="migrating"&&<div onClick={function(){setVw("migrating")}} style={{position:"fixed",bottom:40,left:"50%",transform:"translateX(-50%)",zIndex:9998,display:"flex",alignItems:"center",gap:12,padding:"10px 20px",borderRadius:14,background:dark?"rgba(15,23,42,.92)":"rgba(255,255,255,.95)",border:"1px solid "+(dark?"rgba(96,165,250,.2)":"rgba(37,99,235,.15)"),boxShadow:"0 8px 32px rgba(0,0,0,"+(dark?".4":".12")+")",backdropFilter:"blur(12px)",cursor:"pointer",animation:"fadeIn .3s ease"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#60A5FA",animation:"pulse 1.2s infinite",flexShrink:0}}/>
            <div>
              <span style={{fontSize:11,fontWeight:700,color:dark?"#fff":T.nv}}>{t.mgHdr||"Migration in progress"}</span>
              <span style={{fontSize:9,color:T.txD,marginLeft:6}}>{migPhase+" · "+Math.round(prog)+"%"}</span>
            </div>
            <div style={{width:60,height:4,borderRadius:2,background:dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.06)",overflow:"hidden"}}>
              <div style={{height:"100%",width:prog+"%",borderRadius:2,background:"linear-gradient(90deg,#2563EB,#60A5FA)",transition:"width .5s"}}/>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.bl} strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>}
          {/* FOOTER */}
          <div style={{height:28,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",borderTop:"1px solid "+T.bdL,background:T.hdrBg,fontSize:9,color:T.txD,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span>{files.length+" files"}</span>
              {sL&&<span>{(LANGS[sL]||{}).i+" "+(LANGS[sL]||{}).n}</span>}
              {tL&&<span>{"→ "+(LANGS[tL]||{}).i+" "+(LANGS[tL]||{}).n}</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {mod&&<span>{(MODELS.find(function(m3){return m3.id===mod})||{}).n||""}</span>}
              <span><img src={SII_LOGO} style={{height:12,opacity:.4}} alt=""/>{"MigraOps v"+APP.v}</span>
            </div>
          </div>
</div>
  );
}

export default function App() {
  return React.createElement(ErrorBoundary, null, React.createElement(AppInner, null));
}
