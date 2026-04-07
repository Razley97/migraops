export var UILANGS = [
  {code:"es",label:"Español",flag:"\ud83c\uddea\ud83c\uddf8"},
  {code:"en",label:"English",flag:"\ud83c\uddec\ud83c\udde7"},
  {code:"pt",label:"Português",flag:"\ud83c\udde7\ud83c\uddf7"}
];

export var LANGS = {
  python:{n:"Python",i:"\ud83d\udc0d",v:["2.7","3.6","3.8","3.10","3.12"],x:[".py"],c:"#3776AB"},
  javascript:{n:"JavaScript",i:"\u26a1",v:["ES5","ES6/ES2015","ES2020","ES2024"],x:[".js",".mjs"],c:"#D4A017"},
  typescript:{n:"TypeScript",i:"\ud83d\udd37",v:["3.x","4.x","5.0","5.6"],x:[".ts",".tsx"],c:"#3178C6"},
  java:{n:"Java",i:"\u2615",v:["8","11","17","21"],x:[".java"],c:"#ED8B00"},
  csharp:{n:"C#",i:"\ud83d\udfe3",v:[".NET Framework 4.8",".NET Core 3.1",".NET 6",".NET 8"],x:[".cs"],c:"#512BD4"},
  go:{n:"Go",i:"\ud83d\udc39",v:["1.18","1.20","1.21","1.22"],x:[".go"],c:"#00ADD8"},
  rust:{n:"Rust",i:"\ud83e\udd80",v:["2018","2021","2024"],x:[".rs"],c:"#CE422B"},
  php:{n:"PHP",i:"\ud83d\udc18",v:["7.4","8.0","8.2","8.3"],x:[".php"],c:"#777BB4"},
  ruby:{n:"Ruby",i:"\ud83d\udc8e",v:["2.7","3.0","3.2","3.3"],x:[".rb"],c:"#CC342D"},
  kotlin:{n:"Kotlin",i:"\ud83d\udfe0",v:["1.5","1.6","1.7","1.8","1.9","2.0","2.1"],x:[".kt",".kts"],c:"#2563EB"}
};

export var CROSS = [
  {f:"javascript",t:"typescript",l:"JS → TS"},
  {f:"typescript",t:"javascript",l:"TS → JS"},
  {f:"python",t:"javascript",l:"Py → JS"},
  {f:"javascript",t:"python",l:"JS → Py"},
  {f:"java",t:"csharp",l:"Java → C#"},
  {f:"csharp",t:"java",l:"C# → Java"},
  {f:"java",t:"python",l:"Java → Py"},
  {f:"python",t:"java",l:"Py → Java"},
  {f:"java",t:"kotlin",l:"Java → Kotlin"},
  {f:"kotlin",t:"java",l:"Kotlin → Java"},
  {f:"ruby",t:"python",l:"Ruby → Py"},
  {f:"php",t:"python",l:"PHP → Py"},
  {f:"go",t:"rust",l:"Go → Rust"}
];

export var TARGET_EXT={python:".py",javascript:".js",typescript:".ts",java:".java",csharp:".cs",go:".go",rust:".rs",php:".php",ruby:".rb",kotlin:".kt"};

export var LANG_META={python:{desc:"Versatile high-level language",strengths:["AI/ML","Data Science","Scripting","Web"],migrateTo:["javascript","typescript","java","go","rust"],ecosystem:"470k+ packages"},javascript:{desc:"The language of the web",strengths:["Frontend","Node.js","Full Stack","Real-time"],migrateTo:["typescript","python","go","rust","java"],ecosystem:"2M+ packages"},typescript:{desc:"JavaScript with superpowers",strengths:["Type Safety","Enterprise","Angular/React","APIs"],migrateTo:["javascript","python","java","csharp","go"],ecosystem:"npm compatible"},java:{desc:"Enterprise-grade platform",strengths:["Enterprise","Android","Microservices","Spring"],migrateTo:["kotlin","python","typescript","go","csharp"],ecosystem:"500k+ artifacts"},csharp:{desc:".NET ecosystem powerhouse",strengths:[".NET/Azure","Unity","Enterprise","Desktop"],migrateTo:["java","typescript","python","go","rust"],ecosystem:"350k+ packages"},go:{desc:"Cloud-native simplicity",strengths:["Cloud/DevOps","Microservices","CLI Tools","Concurrency"],migrateTo:["rust","python","typescript","java","csharp"],ecosystem:"Growing fast"},rust:{desc:"Performance without compromise",strengths:["Systems","WebAssembly","Security","Performance"],migrateTo:["go","csharp","typescript","python","java"],ecosystem:"120k+ crates"},php:{desc:"Web development workhorse",strengths:["WordPress","Laravel","Web APIs","CMS"],migrateTo:["python","typescript","go","java","ruby"],ecosystem:"350k+ packages"},ruby:{desc:"Developer happiness first",strengths:["Rails","Prototyping","Scripting","DevOps"],migrateTo:["python","typescript","go","rust","java"],ecosystem:"175k+ gems"},kotlin:{desc:"Modern JVM language",strengths:["Android","Multiplatform","Spring","Coroutines"],migrateTo:["java","typescript","python","go","csharp"],ecosystem:"Java interop"}};

export var MODULE_CONVENTIONS=(function(){
  var mc={};
  mc.javascript={system:"CommonJS (require/module.exports) or ESM (import/export)",naming:"camelCase files, index.js for barrel exports",imports:"CommonJS: const x = require(path) / ESM: import x (from path)",example:"Use require() for CommonJS or import/export for ESM"};
  mc.typescript={system:"ESM (import/export) with type annotations",naming:"camelCase files, index.ts for barrel exports",imports:"ESM: import { Type } (from path)",example:"Use import/export with type annotations"};
  mc.python={system:"Python modules (import/from...import)",naming:"snake_case files, __init__.py for packages",imports:"Python: from module import Class / import module",example:"Use from...import for specific classes"};
  mc.java={system:"Java packages (import com.pkg.Class)",naming:"PascalCase files matching class names",imports:"import com.package.ClassName;",example:"Use package imports matching directory structure"};
  mc.csharp={system:".NET namespaces (using Namespace)",naming:"PascalCase files matching class names",imports:"using Namespace;",example:"Use using directives for namespace imports"};
  mc.kotlin={system:"Kotlin packages (import pkg.Class) + Android components (Activity, Fragment, ViewModel)",naming:"PascalCase for classes, camelCase for functions/extensions",imports:"Kotlin: import com.package.ClassName / import android.x.y",example:"Use package imports, extension functions, Jetpack libraries"};
  mc.go={system:"Go packages (import path)",naming:"snake_case files, package per directory",imports:"import github.com/user/pkg",example:"Use import with package paths"};
  mc.rust={system:"Rust modules (mod/use)",naming:"snake_case files, mod.rs for modules",imports:"use crate::module::Type;",example:"Use mod declarations and use paths"};
  mc.ruby={system:"Ruby require/require_relative",naming:"snake_case files",imports:"require_relative path_to_module",example:"Use require_relative for local files"};
  mc.php={system:"PHP namespaces + use/require",naming:"PascalCase files matching class",imports:"use App\\Module\\Class;",example:"Use namespace and use declarations"};
  return mc;
})();
