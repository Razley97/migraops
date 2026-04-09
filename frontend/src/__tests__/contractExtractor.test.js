import { describe, it, expect } from "vitest";
import { extractContracts, contractsToString } from "../services/contractExtractor.js";

describe("contractExtractor", function() {

  it("short files (<= 40 lines) return raw code unchanged", function() {
    var code = "import foo from 'bar';\nfunction hello() {}\nexport default hello;";
    var result = extractContracts(code, "js");
    expect(result.raw).toBe(code);
  });

  it("extracts JS imports, exports, and signatures", function() {
    var lines = [];
    lines.push("import React from 'react';");
    lines.push("import { useState } from 'react';");
    lines.push("const helper = require('./helper');");
    lines.push("");
    // Pad to exceed 40 lines
    for (var i = 0; i < 40; i++) lines.push("// line " + i);
    lines.push("export function doSomething(a, b) {");
    lines.push("  return a + b;");
    lines.push("}");
    lines.push("export default class MyComponent {");
    lines.push("}");
    lines.push("module.exports = { doSomething };");
    var code = lines.join("\n");
    var result = extractContracts(code, "js");
    expect(result.imports.length).toBe(3);
    expect(result.exports.length).toBeGreaterThanOrEqual(3);
    expect(result.signatures.length).toBeGreaterThanOrEqual(1);
    expect(result.raw).toContain("import React");
    expect(result.raw).toContain("export function doSomething");
  });

  it("extracts Python imports, defs, and classes", function() {
    var lines = [];
    lines.push("from flask import Flask");
    lines.push("import os");
    lines.push("");
    for (var i = 0; i < 45; i++) lines.push("# comment " + i);
    lines.push("def process_data(input_list):");
    lines.push("    pass");
    lines.push("async def fetch_data(url):");
    lines.push("    pass");
    lines.push("class DataProcessor:");
    lines.push("    pass");
    var code = lines.join("\n");
    var result = extractContracts(code, "py");
    expect(result.imports.length).toBe(2);
    expect(result.signatures.length).toBe(2);
    expect(result.types.length).toBe(1);
    expect(result.raw).toContain("from flask import Flask");
    expect(result.raw).toContain("def process_data");
  });

  it("extracts Java package, imports, classes, and methods", function() {
    var lines = [];
    lines.push("package com.example.service;");
    lines.push("import java.util.List;");
    lines.push("import java.util.Map;");
    lines.push("");
    for (var i = 0; i < 45; i++) lines.push("// filler " + i);
    lines.push("public class UserService {");
    lines.push("  private int count;");
    lines.push("  public void createUser(String name) {");
    lines.push("    // implementation");
    lines.push("  }");
    lines.push("  public List<User> getAll() {");
    lines.push("    return null;");
    lines.push("  }");
    lines.push("}");
    var code = lines.join("\n");
    var result = extractContracts(code, "java");
    expect(result.imports.length).toBe(3); // package + 2 imports
    expect(result.types.length).toBe(1);
    expect(result.signatures.length).toBeGreaterThanOrEqual(2);
    expect(result.raw).toContain("package com.example");
  });

  it("extracts Go package, imports, funcs, and types", function() {
    var lines = [];
    lines.push("package main");
    lines.push("");
    lines.push("import (");
    lines.push('  "fmt"');
    lines.push('  "net/http"');
    lines.push(")");
    lines.push("");
    for (var i = 0; i < 45; i++) lines.push("// filler " + i);
    lines.push("type Server struct {");
    lines.push("  port int");
    lines.push("}");
    lines.push("func NewServer(port int) *Server {");
    lines.push("  return &Server{port: port}");
    lines.push("}");
    lines.push("func (s *Server) start() error {");
    lines.push("  return nil");
    lines.push("}");
    var code = lines.join("\n");
    var result = extractContracts(code, "go");
    expect(result.imports.length).toBeGreaterThanOrEqual(4); // package + import block
    expect(result.types.length).toBe(1);
    expect(result.exports.length).toBeGreaterThanOrEqual(2); // Server, NewServer
    expect(result.raw).toContain("package main");
    expect(result.raw).toContain("func NewServer");
  });

  it("extracts C# using, namespace, classes, and methods", function() {
    var lines = [];
    lines.push("using System;");
    lines.push("using System.Collections.Generic;");
    lines.push("namespace MyApp.Services {");
    lines.push("");
    for (var i = 0; i < 45; i++) lines.push("// filler " + i);
    lines.push("public class UserService {");
    lines.push("  public async Task<User> GetUser(int id) {");
    lines.push("    return null;");
    lines.push("  }");
    lines.push("}");
    lines.push("}");
    var code = lines.join("\n");
    var result = extractContracts(code, "csharp");
    expect(result.imports.length).toBe(3); // 2 using + namespace
    expect(result.types.length).toBe(1);
    expect(result.signatures.length).toBeGreaterThanOrEqual(1);
    expect(result.raw).toContain("using System");
  });

  it("unsupported language falls back to first 80 lines", function() {
    var lines = [];
    for (var i = 0; i < 100; i++) lines.push("line " + i);
    var code = lines.join("\n");
    var result = extractContracts(code, "xyz");
    expect(result.raw).toContain("line 0");
    expect(result.raw).toContain("line 79");
    expect(result.raw).toContain("more lines");
    expect(result.raw).not.toContain("line 80");
  });

  it("contractsToString returns raw field", function() {
    var contracts = { imports: [], exports: [], signatures: [], types: [], raw: "test content" };
    expect(contractsToString(contracts)).toBe("test content");
  });

  it("empty code returns empty result", function() {
    var result = extractContracts("", "js");
    expect(result.raw).toBe("");
    expect(result.imports).toEqual([]);
  });
});
