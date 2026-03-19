import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import React from "react";

// Error Boundary — prevents total app crash on render errors
class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={hasError:false,error:null}}
  static getDerivedStateFromError(error){return {hasError:true,error:error}}
  render(){
    if(this.state.hasError){
      return React.createElement("div",{style:{padding:40,textAlign:"center",fontFamily:"system-ui"}},
        React.createElement("h2",{style:{color:"#dc2626",marginBottom:12}},"⚠️ MigraOps — Error de Render"),
        React.createElement("p",{style:{color:"#64748b",marginBottom:16}},String(this.state.error)),
        React.createElement("button",{onClick:function(){window.location.reload()},style:{padding:"8px 20px",borderRadius:8,border:"none",background:"#60A5FA",color:"#fff",cursor:"pointer",fontWeight:700,borderRadius:10,fontFamily:"Outfit,sans-serif"}},"Recargar Aplicación")
      );
    }
    return this.props.children;
  }
}

var APP = { n: "MigraOps", v: "5.0", co: "SII Group Chile", area: "Code Intelligence" };
var SII_LOGO="data:image/png;base64,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";
var SII_LOGO_LG="data:image/png;base64,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";


var i18n = {
  es: {
    sub:"Code Intelligence Platform",upload:"Subir",config:"Configurar",results:"Resultados",
    history:"Historial",testProj:"Proyectos de Prueba",testDesc:"Multi-archivo — selecciona un proyecto",
    drag:"Arrastra archivos o haz clic para subir",files:"archivo(s)",clean:"Limpiar",
    detected:"Auto-detectado",lowConf:"Baja confianza",auto:"Auto",
    cfgMig:"Configurar Migración",cfg:"Configuración",aiCfg:"Configuración Avanzada de IA",
    aiDesc2:"Metodología Senior — Prompts de nivel Staff/Principal Engineer",migP:"Prompt de Migración (6 Fases + 10 Directivas)",revP:"Prompt de Revisión QA (8 Dimensiones + 12 Criterios)",
    sysP:"PROMPT DEL SISTEMA (Staff Engineer Methodology)",guide:"DIRECTIVAS DE MIGRACIÓN (10 fases secuenciales)",crit:"CRITERIOS DE VALIDACIÓN (12 dimensiones especializadas)",
    vars:"Variables:",reset:"Restablecer",type:"Tipo de migración",
    updVer:"Actualizar Versión",chgLang:"Cambiar Lenguaje",origin:"Origen",dest:"Destino",
    selVer:"Seleccionar versión...",selLang:"Seleccionar lenguaje...",
    model:"Modelo",summary:"Resumen",migrate:"Migrar",done:"Completado",
    dlAll:"Descargar Todo",newMig:"Nueva Migración",risks:"Riesgos",
    filesLbl:"ARCHIVOS",changes:"cambios",orig:"Original",mig:"Migrado",
    validate:"Análisis Adicional",static:"Análisis Profundo",aiRev:"Revisión QA Senior",
    staticD:"8 capas: arquitectura, seguridad, async, tipos, performance",aiD:"8 dimensiones ponderadas: funcional, sintaxis, idiomática, async, seguridad, errores, contratos, docs",
    ok:"Aprobado",obs:"Con observaciones",rej:"Rechazado",
    errs:"Errores",warns:"Advertencias",good:"Bien hecho",score:"Puntuación",
    reviewing:"Claude analizando en profundidad...",noHist:"Sin migraciones aún",
    lines:"líneas",adv:"Avanzado",inter:"Intermedio",
    hi:"Alto",med:"Medio",lo:"Bajo",qual:"CALIDAD",spd:"VELOCIDAD",view:"Ver",
    fixBtn:"Generar Solución Completa",fixBtnShort:"Generar Solución",fixing:"Generando solución con IA...",
    fixPlan:"PLAN DE ACCIÓN",fixCode:"CÓDIGO CORREGIDO",fixCheck:"CHECKLIST DE VERIFICACIÓN",
    fixTitle:"Solución Generada por IA",fixApply:"Aplicar Corrección",fixDl:"Descargar Corregido",
    fixClose:"Cerrar",fixEmpty:"Sin errores — no se requiere plan de acción",
    dimEval:"DIMENSIONES DE EVALUACIÓN",
    deepLayers:"CAPAS DE ANÁLISIS",deepCrit:"HALLAZGOS CRÍTICOS",deepImpr:"MEJORAS SUGERIDAS",
    deepStr:"FORTALEZAS",deepAnalyzing:"Análisis profundo en curso...",
    deepDesc:"Claude analiza arquitectura, seguridad, async, tipos, performance y contrato API",
    revDesc:"Claude evalúa funcionalidad, sintaxis, idiomática, seguridad y documentación",
    stepReview:"1. Revisar",stepFix:"2. Corregir",stepApply:"3. Aplicar",
    noIssues:"Sin hallazgos críticos",issuesFound:"hallazgos encontrados",
    genSolution:"Quieres que Claude genere la solución?",
    pass:"Pasa",warn:"Advertencia",fail:"Falla",
    ph1:"Migrando código",ph2:"Auto-revisión IA",ph3:"Corrigiendo errores",ph4:"Verificación final",
    phClean:"Sin errores",phFixed:"corregidos",phIter:"iteración",phScore:"puntos",
    pipeDesc:"Migración rápida + validación de integración completa",
    optDesc:"El código ya fue revisado y corregido. Estas herramientas son para análisis adicional opcional",
    gPhA:"Analizando aplicación",gPhB:"Migrando archivos",gPhB2:"Consolidando archivos",gPhB2a:"Auditoría de dependencias",gPhB2b:"Corrigiendo conexiones",gPhC:"Validación de integración",gPhD:"Corrección de integración",
    gPhAd:"Entendiendo arquitectura, dependencias y contratos",gPhBd:"Migración con contexto de arquitectura por archivo",
    gPhCd:"Verificando que todo funcione junto",gPhDd:"Corrigiendo problemas entre archivos",
    mgHdr:"Migración en curso",mgElapsed:"Transcurrido",mgRemain:"Restante",mgModel:"Modelo",
    mgFiles:"Archivos",mgApiCalls:"Llamadas API",mgThroughput:"Rendimiento",mgQueue:"Cola de archivos",
    mgPending:"Pendiente",mgActive:"Migrando",mgPlanning:"Planificando",mgCompleted:"Completado",mgActivity:"Actividad",
    mgFilesPerMin:"arch/min",mgLinesProcessed:"líneas procesadas",mgPhase:"Fase actual",
    mgWaiting:"En espera",mgNoFiles:"Sin archivos aún",cancel:"Cancelar",timeLimit:"Límite: 8 min",
    mgTokens:"Tokens",mgCost:"Costo est.",crossLang:"Cross-Language",verUpg:"Actualización",mgModSys:"Sistema de módulos",mgLastChg:"Último cambio",
    rcTitle:"Reporte de Migración",rcGrade:"Calificación",rcIter:"Iteraciones",rcFixed:"Correcciones",rcTime:"Tiempo total",rcArch:"Arquitectura",rcRisks:"Riesgos detectados",rcVerified:"Verificados",rcPipeline:"Pipeline",
    intTitle:"Reporte de Integración",intPass:"Integración validada",intFail:"Problemas de integración",
    intVerified:"Verificaciones correctas",intIssues:"Problemas detectados",
    cbTitle:"Análisis del Codebase",cbArch:"Arquitectura",cbPurpose:"Propósito",cbDeps:"Dependencias",cbRisks:"Riesgos identificados",
    intIter:"Iteración de integración",intFixing:"Corrigiendo integración",intRecheck:"Re-verificando integración",intTarget:"Objetivo: 95/100",
    audit:"Auditoría",auditTitle:"Registro de Auditoría",auditDesc:"Trazabilidad completa de tiempos por fase",
    auditTotal:"Tiempo Total",auditPhase:"Fase",auditDuration:"Duración",auditStart:"Inicio",auditEnd:"Fin",
    auditStatus:"Estado",auditDetail:"Detalle",auditFile:"Archivo",auditExport:"Exportar JSON",
    auditConfig:"Configuración",auditTimeline:"Línea de Tiempo",auditSummary:"Resumen de Tiempos",
    auditCalls:"Llamadas API",auditAvg:"Promedio",auditSlowest:"Más lento",auditFastest:"Más rápido",
    auditDistrib:"Distribución de Tiempos",auditScoreEvol:"Evolución del Score",auditFileComp:"Tiempo por Archivo",
    auditPipeline:"Pipeline de Ejecución",auditEfficiency:"Eficiencia",auditOverhead:"Overhead IA",
    auditPhDesc:"Descripción de Fase",auditIssuesDelta:"Delta de Issues",auditTokenEst:"Tokens Est.",
    auditFixRate:"Tasa de Corrección",auditPhases:"fases completadas",auditIter:"iteraciones",
    rollback:"Rollback — fix empeoró resultado, restaurando versión anterior",
    stall:"Estancamiento — score no mejora, deteniendo ciclo",
    pdfExport:"Exportar PDF",pdfGen:"Generando PDF...",pdfTitle:"Reporte de Migración",
    pdfExecSum:"Resumen Ejecutivo",pdfConfig:"Configuración",pdfIntReport:"Reporte de Integración",
    pdfAuditTrail:"Auditoría de Tiempos",pdfRisks:"Análisis de Riesgos",pdfFiles:"Archivos Migrados",
    pdfGenBy:"Generado por",pdfDate:"Fecha",pdfScore:"Puntuación",pdfVerdict:"Veredicto",
    pdfIssues:"Problemas",pdfVerified:"Verificaciones",pdfPhase:"Fase",pdfDuration:"Duración",
    pdfChanges:"Cambios Detectados",pdfModel:"Modelo Utilizado",pdfTotalTime:"Tiempo Total",
    pdfApiCalls:"Llamadas API",pdfConfidential:"CONFIDENCIAL — SII Group Chile",
    dropTitle:"Suelta tu código fuente aquí",orBrowse:"o busca archivos",supportedLangs:"Lenguajes soportados",
    readyCfg:"Configurar migración",samples:"Proyectos de ejemplo",samplesDesc:"Proyectos demo para pruebas",
    linesCode:"líneas de código",filesSel:"archivos seleccionados",detectedAs:"detectado como",
    pMaps:"Mapeos de Paradigma",pMapsDesc:"Traducciones API concretas para migraciones cross-language",
    pStdlib:"Traducciones de Stdlib",pPatterns:"Patrones de Código",pModules:"Sistema de Módulos",pAsync:"Modelo Async",pTypes:"Sistema de Tipos",
    pMapsNone:"Sin mapeo disponible para este par de lenguajes",pMapsActive:"Activo para",pConns:"conexiones",pIssues:"problemas",pBroken:"rotas",
    andTitle:"Análisis Android",andArch:"Arquitectura",andDeprecated:"APIs Obsoletas",andCompose:"Migración Compose",andSecurity:"Seguridad Android",andGradle:"Dependencias Gradle",andRefactor:"Plan de Refactorización",andModular:"Modularización",andReport:"Reporte Pre-Migración",andDownload:"Descargar Reporte",andBreach:"Brechas Detectadas",andPlan:"Plan de Acción",andLibs:"Actualización de Librerías",andPattern:"Patrón Detectado",andTarget:"Patrón Objetivo",andImpact:"Impacto",andEffort:"Esfuerzo",andPriority:"Prioridad",andCritical:"Crítico",andMajor:"Mayor",andMinor:"Menor",andXmlViews:"XML Views",andComposeTarget:"Jetpack Compose",andMvp:"MVP/MVC Legacy",andMvvm:"MVVM + Clean",andAsyncTask:"AsyncTask (obsoleto)",andCoroutines:"Coroutines",andKotlinVer:"Versión Kotlin",andAndroidApi:"API Android",andMinSdk:"Min SDK",andTargetSdk:"Target SDK",andJetpack:"Jetpack Libraries",andBreachSummary:"Resumen de Brechas",andNoBreaches:"Sin brechas detectadas",andGenReport:"Generar Reporte",andReportReady:"Reporte listo",andViewReport:"Ver Reporte",andExportHtml:"Exportar HTML",
    qaTitle:"QA Sandbox",qaRun:"Ejecutar Tests",qaRunning:"Ejecutando...",qaPreTitle:"Tests Pre-Migración",qaPostTitle:"Tests Post-Migración",qaPassed:"Pasaron",qaFailed:"Fallaron",qaSkipped:"Omitidos",qaCompare:"Comparar Pre vs Post",qaRetest:"Re-testear Migrado",qaNoTests:"Sin tests generados aún",qaGenerate:"Generar Test Suite",qaTotal:"Total tests",qaIdentical:"Resultados idénticos",qaRegression:"Regresión detectada",qaNewPass:"Nuevo éxito",qaExecTime:"Tiempo ejecución",qaInput:"Entrada",qaExpected:"Esperado",qaActual:"Resultado",qaUnit:"Unitario",qaInteg:"Integración",qaApi:"API",qaFunc:"Función",qaFile:"Archivo",qaCoverage:"Cobertura",qaExport:"Exportar Tests",qaSandbox:"Sandbox (ejecución real)",qaVirtual:"Virtual (análisis IA)",qaVDesc:"Claude analiza y predice el comportamiento de cada función",qaVTrace:"Traza de ejecución",qaVPredicted:"Predicho",qaVConfidence:"Confianza",qaVHigh:"Alta",qaVMed:"Media",qaVLow:"Baja",qaVSideEffects:"Efectos secundarios",qaVBehavior:"Comportamiento",qaVEquivalent:"Equivalente",qaVDifferent:"Diferente",qaVTab:"Vista",dashTitle:"Dashboard",dashWelcome:"Bienvenido",dashNewMig:"Nueva Migración",dashTotalMig:"Migraciones",dashAvgScore:"Score Promedio",dashFilesProc:"Archivos",dashRecent:"Actividad Reciente",dashNoData:"Sin migraciones aún",dashStart:"Comenzar",sideNew:"Nueva Migración",sideDash:"Dashboard",sideResults:"Resultados",sideHist:"Historial",sideQA:"QA Tests",sideCfg:"Config. IA",loginWelcome:"Bienvenido a",loginName:"Tu nombre",loginBtn:"Ingresar",step1:"Arquivos",step2:"Configurar",step3:"Migrar",step4:"Resultados",step1:"Archivos",step2:"Configurar",step3:"Migrar",step4:"Resultados",
    localFiles:"Archivos Locales",localFilesDesc:"Sube .zip o archivos de código desde tu computador",ghRepoL:"Repositorio GitHub",ghRepoDesc:"Importa archivos directamente desde cualquier repo",strengths2:"Fortalezas",migrateTo2:"Migrar a",scoreTrend:"Tendencia de Scores",noMigYet:"Sin migraciones aún",noMigDesc:"Inicia tu primera migración para ver estadísticas aquí",preview2:"Vista previa",copyCode:"Copiar",riskScore2:"RIESGO",readiness2:"PREPARACIÓN",qualityLayers:"Capas de Calidad"
  },
  en: {
    sub:"Code Intelligence Platform",upload:"Upload",config:"Configure",results:"Results",
    history:"History",testProj:"Test Projects",testDesc:"Multi-file — select a project",
    drag:"Drag files or click to upload",files:"file(s)",clean:"Clear",
    detected:"Auto-detected",lowConf:"Low confidence",auto:"Auto",
    cfgMig:"Configure Migration",cfg:"Configuration",aiCfg:"Advanced AI Configuration",
    aiDesc2:"Senior Methodology — Staff/Principal Engineer level prompts",migP:"Migration Prompt (6 Phases + 10 Directives)",revP:"QA Review Prompt (8 Dimensions + 12 Criteria)",
    sysP:"SYSTEM PROMPT (Staff Engineer Methodology)",guide:"MIGRATION DIRECTIVES (10 sequential phases)",crit:"VALIDATION CRITERIA (12 specialized dimensions)",
    vars:"Variables:",reset:"Reset",type:"Migration type",
    updVer:"Update Version",chgLang:"Change Language",origin:"Source",dest:"Target",
    selVer:"Select version...",selLang:"Select language...",
    model:"Model",summary:"Summary",migrate:"Migrate",done:"Completed",
    dlAll:"Download All",newMig:"New Migration",risks:"Risks",
    filesLbl:"FILES",changes:"changes",orig:"Original",mig:"Migrated",
    validate:"Additional Analysis",static:"Deep Analysis",aiRev:"Senior QA Review",
    staticD:"8 layers: architecture, security, async, types, performance",aiD:"8 weighted dimensions: functional, syntax, idiomatic, async, security, errors, contracts, docs",
    ok:"Approved",obs:"With observations",rej:"Rejected",
    errs:"Errors",warns:"Warnings",good:"Well done",score:"Score",
    reviewing:"Claude performing deep analysis...",noHist:"No migrations yet",
    lines:"lines",adv:"Advanced",inter:"Intermediate",
    hi:"High",med:"Medium",lo:"Low",qual:"QUALITY",spd:"SPEED",view:"View",
    fixBtn:"Generate Complete Solution",fixBtnShort:"Generate Solution",fixing:"Generating AI solution...",
    fixPlan:"ACTION PLAN",fixCode:"CORRECTED CODE",fixCheck:"VERIFICATION CHECKLIST",
    fixTitle:"AI-Generated Solution",fixApply:"Apply Fix",fixDl:"Download Fixed",
    fixClose:"Close",fixEmpty:"No errors — action plan not needed",
    dimEval:"EVALUATION DIMENSIONS",
    deepLayers:"ANALYSIS LAYERS",deepCrit:"CRITICAL FINDINGS",deepImpr:"SUGGESTED IMPROVEMENTS",
    deepStr:"STRENGTHS",deepAnalyzing:"Deep analysis in progress...",
    deepDesc:"Claude analyzes architecture, security, async, types, performance and API contract",
    revDesc:"Claude evaluates 8 dimensions: functional equivalence, syntax, idiomatic quality, async correctness, security, error handling, API contracts, documentation",
    stepReview:"1. Review",stepFix:"2. Fix",stepApply:"3. Apply",
    noIssues:"No critical findings",issuesFound:"findings detected",
    genSolution:"Want Claude to generate the solution?",
    pass:"Pass",warn:"Warning",fail:"Fail",
    ph1:"Migrating code",ph2:"AI self-review",ph3:"Fixing errors",ph4:"Final verification",
    phClean:"No errors",phFixed:"fixed",phIter:"iteration",phScore:"points",
    pipeDesc:"Migration with automatic integrated review and correction",
    optDesc:"Code was already auto-reviewed and fixed. These tools are for optional additional analysis",
    gPhA:"Analyzing application",gPhB:"Migrating files",gPhB2:"Consolidating files",gPhB2a:"Dependency audit",gPhB2b:"Fixing connections",gPhC:"Integration validation",gPhD:"Integration fix",
    gPhAd:"Understanding architecture, dependencies and contracts",gPhBd:"Context-aware migration per file",
    gPhCd:"Verifying everything works together",gPhDd:"Fixing cross-file issues",
    mgHdr:"Migration in progress",mgElapsed:"Elapsed",mgRemain:"Remaining",mgModel:"Model",
    mgFiles:"Files",mgApiCalls:"API Calls",mgThroughput:"Throughput",mgQueue:"File queue",
    mgPending:"Pending",mgActive:"Migrating",mgPlanning:"Planning",mgCompleted:"Completed",mgActivity:"Activity",
    mgFilesPerMin:"files/min",mgLinesProcessed:"lines processed",mgPhase:"Current phase",
    mgWaiting:"Waiting",mgNoFiles:"No files yet",cancel:"Cancel",timeLimit:"Limit: 8 min",
    mgTokens:"Tokens",mgCost:"Est. cost",crossLang:"Cross-Language",verUpg:"Version Upgrade",mgModSys:"Module system",mgLastChg:"Last change",
    rcTitle:"Migration Report",rcGrade:"Grade",rcIter:"Iterations",rcFixed:"Fixes applied",rcTime:"Total time",rcArch:"Architecture",rcRisks:"Risks detected",rcVerified:"Verified",rcPipeline:"Pipeline",
    intTitle:"Integration Report",intPass:"Integration validated",intFail:"Integration issues",
    intVerified:"Verified checks",intIssues:"Issues detected",
    cbTitle:"Codebase Analysis",cbArch:"Architecture",cbPurpose:"Purpose",cbDeps:"Dependencies",cbRisks:"Identified risks",
    intIter:"Integration iteration",intFixing:"Fixing integration",intRecheck:"Re-verifying integration",intTarget:"Target: 95/100",
    audit:"Audit",auditTitle:"Audit Log",auditDesc:"Complete phase timing traceability",
    auditTotal:"Total Time",auditPhase:"Phase",auditDuration:"Duration",auditStart:"Start",auditEnd:"End",
    auditStatus:"Status",auditDetail:"Detail",auditFile:"File",auditExport:"Export JSON",
    auditConfig:"Configuration",auditTimeline:"Timeline",auditSummary:"Time Summary",
    auditCalls:"API Calls",auditAvg:"Average",auditSlowest:"Slowest",auditFastest:"Fastest",
    auditDistrib:"Time Distribution",auditScoreEvol:"Score Evolution",auditFileComp:"Time per File",
    auditPipeline:"Execution Pipeline",auditEfficiency:"Efficiency",auditOverhead:"AI Overhead",
    auditPhDesc:"Phase Description",auditIssuesDelta:"Issues Delta",auditTokenEst:"Est. Tokens",
    auditFixRate:"Fix Rate",auditPhases:"phases completed",auditIter:"iterations",
    rollback:"Rollback — fix worsened result, restoring previous version",
    stall:"Stalled — score not improving, stopping loop",
    pdfExport:"Export PDF",pdfGen:"Generating PDF...",pdfTitle:"Migration Report",
    pdfExecSum:"Executive Summary",pdfConfig:"Configuration",pdfIntReport:"Integration Report",
    pdfAuditTrail:"Audit Trail",pdfRisks:"Risk Analysis",pdfFiles:"Migrated Files",
    pdfGenBy:"Generated by",pdfDate:"Date",pdfScore:"Score",pdfVerdict:"Verdict",
    pdfIssues:"Issues",pdfVerified:"Verified",pdfPhase:"Phase",pdfDuration:"Duration",
    pdfChanges:"Detected Changes",pdfModel:"Model Used",pdfTotalTime:"Total Time",
    pdfApiCalls:"API Calls",pdfConfidential:"CONFIDENTIAL — SII Group Chile",
    dropTitle:"Drop your source code here",orBrowse:"or browse files",supportedLangs:"Supported languages",
    readyCfg:"Configure migration",samples:"Sample Projects",samplesDesc:"Demo projects for testing",
    linesCode:"lines of code",filesSel:"files selected",detectedAs:"detected as",
    pMaps:"Paradigm Maps",pMapsDesc:"Concrete API translations for cross-language migrations",
    pStdlib:"Stdlib Translations",pPatterns:"Code Patterns",pModules:"Module System",pAsync:"Async Model",pTypes:"Type System",
    pMapsNone:"No mapping available for this language pair",pMapsActive:"Active for",pConns:"connections",pIssues:"issues",pBroken:"broken",
    andTitle:"Android Analysis",andArch:"Architecture",andDeprecated:"Deprecated APIs",andCompose:"Compose Migration",andSecurity:"Android Security",andGradle:"Gradle Dependencies",andRefactor:"Refactoring Plan",andModular:"Modularization",andReport:"Pre-Migration Report",andDownload:"Download Report",andBreach:"Detected Breaches",andPlan:"Action Plan",andLibs:"Library Updates",andPattern:"Detected Pattern",andTarget:"Target Pattern",andImpact:"Impact",andEffort:"Effort",andPriority:"Priority",andCritical:"Critical",andMajor:"Major",andMinor:"Minor",andXmlViews:"XML Views",andComposeTarget:"Jetpack Compose",andMvp:"MVP/MVC Legacy",andMvvm:"MVVM + Clean",andAsyncTask:"AsyncTask (deprecated)",andCoroutines:"Coroutines",andKotlinVer:"Kotlin Version",andAndroidApi:"Android API",andMinSdk:"Min SDK",andTargetSdk:"Target SDK",andJetpack:"Jetpack Libraries",andBreachSummary:"Breach Summary",andNoBreaches:"No breaches detected",andGenReport:"Generate Report",andReportReady:"Report ready",andViewReport:"View Report",andExportHtml:"Export HTML",
    qaTitle:"QA Sandbox",qaRun:"Run Tests",qaRunning:"Running...",qaPreTitle:"Pre-Migration Tests",qaPostTitle:"Post-Migration Tests",qaPassed:"Passed",qaFailed:"Failed",qaSkipped:"Skipped",qaCompare:"Compare Pre vs Post",qaRetest:"Re-test Migrated",qaNoTests:"No tests generated yet",qaGenerate:"Generate Test Suite",qaTotal:"Total tests",qaIdentical:"Identical results",qaRegression:"Regression detected",qaNewPass:"New pass",qaExecTime:"Exec time",qaInput:"Input",qaExpected:"Expected",qaActual:"Actual",qaUnit:"Unit",qaInteg:"Integration",qaApi:"API",qaFunc:"Function",qaFile:"File",qaCoverage:"Coverage",qaExport:"Export Tests",qaSandbox:"Sandbox (real execution)",qaVirtual:"Virtual (AI analysis)",qaVDesc:"Claude analyzes and predicts the behavior of each function",qaVTrace:"Execution trace",qaVPredicted:"Predicted",qaVConfidence:"Confidence",qaVHigh:"High",qaVMed:"Medium",qaVLow:"Low",qaVSideEffects:"Side effects",qaVBehavior:"Behavior",qaVEquivalent:"Equivalent",qaVDifferent:"Different",qaVTab:"View",dashTitle:"Dashboard",dashWelcome:"Welcome",dashNewMig:"New Migration",dashTotalMig:"Migrations",dashAvgScore:"Avg Score",dashFilesProc:"Files",dashRecent:"Recent Activity",dashNoData:"No migrations yet",dashStart:"Start",sideNew:"New Migration",sideDash:"Dashboard",sideResults:"Results",sideHist:"History",sideQA:"QA Tests",sideCfg:"AI Config",loginWelcome:"Welcome to",loginName:"Your name",loginBtn:"Sign In",step1:"Files",step2:"Configure",step3:"Migrate",step4:"Results",
    localFiles:"Local Files",localFilesDesc:"Upload .zip or code files from your computer",ghRepoL:"GitHub Repository",ghRepoDesc:"Import files directly from any repo",strengths2:"Strengths",migrateTo2:"Migrate to",scoreTrend:"Score Trend",noMigYet:"No migrations yet",noMigDesc:"Start your first migration to see stats and trends here",preview2:"Preview",copyCode:"Copy",riskScore2:"RISK SCORE",readiness2:"READINESS",qualityLayers:"Quality Layers"
  },
  pt: {
    sub:"Code Intelligence Platform",upload:"Enviar",config:"Configurar",results:"Resultados",
    history:"Histórico",testProj:"Projetos de Teste",testDesc:"Multi-arquivo — selecione um projeto",
    drag:"Arraste arquivos ou clique",files:"arquivo(s)",clean:"Limpar",
    detected:"Auto-detectado",lowConf:"Baixa confiança",auto:"Auto",
    cfgMig:"Configurar Migração",cfg:"Configuração",aiCfg:"Configuração Avançada de IA",
    aiDesc2:"Metodologia Sênior — Prompts nível Staff/Principal Engineer",migP:"Prompt de Migração (6 Fases + 10 Diretivas)",revP:"Prompt de Revisão QA (8 Dimensões + 12 Critérios)",
    sysP:"PROMPT DO SISTEMA (Staff Engineer Methodology)",guide:"DIRETIVAS DE MIGRAÇÃO (10 fases sequenciais)",crit:"CRITÉRIOS DE VALIDAÇÃO (12 dimensões especializadas)",
    vars:"Variáveis:",reset:"Redefinir",type:"Tipo de migração",
    updVer:"Atualizar Versão",chgLang:"Mudar Linguagem",origin:"Origem",dest:"Destino",
    selVer:"Selecionar versão...",selLang:"Selecionar linguagem...",
    model:"Modelo",summary:"Resumo",migrate:"Migrar",done:"Concluído",
    dlAll:"Baixar Tudo",newMig:"Nova Migração",risks:"Riscos",
    filesLbl:"ARQUIVOS",changes:"alterações",orig:"Original",mig:"Migrado",
    validate:"Análise Adicional",static:"Análise Profunda",aiRev:"Revisão QA Sênior",
    staticD:"8 camadas: arquitetura, segurança, async, tipos, performance",aiD:"8 dimensões ponderadas: funcional, sintaxe, idiomática, async, segurança, erros, contratos, docs",
    ok:"Aprovado",obs:"Com observações",rej:"Rejeitado",
    errs:"Erros",warns:"Avisos",good:"Bem feito",score:"Pontuação",
    reviewing:"Claude analisando em profundidade...",noHist:"Sem migrações ainda",
    lines:"linhas",adv:"Avançado",inter:"Intermediário",
    hi:"Alto",med:"Médio",lo:"Baixo",qual:"QUALIDADE",spd:"VELOCIDADE",view:"Ver",
    fixBtn:"Gerar Solução Completa",fixBtnShort:"Gerar Solução",fixing:"Gerando solução com IA...",
    fixPlan:"PLANO DE AÇÃO",fixCode:"CÓDIGO CORRIGIDO",fixCheck:"CHECKLIST DE VERIFICAÇÃO",
    fixTitle:"Solução Gerada por IA",fixApply:"Aplicar Correção",fixDl:"Baixar Corrigido",
    fixClose:"Fechar",fixEmpty:"Sem erros — plano de ação não necessário",
    dimEval:"DIMENSÕES DE AVALIAÇÃO",
    deepLayers:"CAMADAS DE ANÁLISE",deepCrit:"ACHADOS CRÍTICOS",deepImpr:"MELHORIAS SUGERIDAS",
    deepStr:"PONTOS FORTES",deepAnalyzing:"Análise profunda em andamento...",
    deepDesc:"Claude analisa arquitetura, segurança, async, tipos, performance e contrato API",
    revDesc:"Claude avalia funcionalidade, sintaxe, idiomática, segurança e documentação",
    stepReview:"1. Revisar",stepFix:"2. Corrigir",stepApply:"3. Aplicar",
    noIssues:"Sem achados críticos",issuesFound:"achados detectados",
    genSolution:"Quer que Claude gere a solução?",
    pass:"Passa",warn:"Aviso",fail:"Falha",
    ph1:"Migrando código",ph2:"Auto-revisão IA",ph3:"Corrigindo erros",ph4:"Verificação final",
    phClean:"Sem erros",phFixed:"corrigidos",phIter:"iteração",phScore:"pontos",
    pipeDesc:"Migração com revisão e correção automática integrada",
    optDesc:"O código já foi revisado e corrigido. Estas ferramentas são para análise adicional opcional",
    gPhA:"Analisando aplicação",gPhB:"Migrando arquivos",gPhB2:"Consolidando arquivos",gPhB2a:"Auditoria de dependências",gPhB2b:"Corrigindo conexões",gPhC:"Validação de integração",gPhD:"Correção de integração",
    gPhAd:"Entendendo arquitetura, dependências e contratos",gPhBd:"Migração com contexto de arquitetura por arquivo",
    gPhCd:"Verificando que tudo funcione junto",gPhDd:"Corrigindo problemas entre arquivos",
    mgHdr:"Migração em andamento",mgElapsed:"Decorrido",mgRemain:"Restante",mgModel:"Modelo",
    mgFiles:"Arquivos",mgApiCalls:"Chamadas API",mgThroughput:"Rendimento",mgQueue:"Fila de arquivos",
    mgPending:"Pendente",mgActive:"Migrando",mgPlanning:"Planejando",mgCompleted:"Concluído",mgActivity:"Atividade",
    mgFilesPerMin:"arq/min",mgLinesProcessed:"linhas processadas",mgPhase:"Fase atual",
    mgWaiting:"Aguardando",mgNoFiles:"Sem arquivos ainda",cancel:"Cancelar",timeLimit:"Limite: 8 min",
    mgTokens:"Tokens",mgCost:"Custo est.",crossLang:"Cross-Language",verUpg:"Atualização",mgModSys:"Sistema de módulos",mgLastChg:"Última alteração",
    rcTitle:"Relatório de Migração",rcGrade:"Nota",rcIter:"Iterações",rcFixed:"Correções",rcTime:"Tempo total",rcArch:"Arquitetura",rcRisks:"Riscos detectados",rcVerified:"Verificados",rcPipeline:"Pipeline",
    intTitle:"Relatório de Integração",intPass:"Integração validada",intFail:"Problemas de integração",
    intVerified:"Verificações corretas",intIssues:"Problemas detectados",
    cbTitle:"Análise do Codebase",cbArch:"Arquitetura",cbPurpose:"Propósito",cbDeps:"Dependências",cbRisks:"Riscos identificados",
    intIter:"Iteração de integração",intFixing:"Corrigindo integração",intRecheck:"Re-verificando integração",intTarget:"Objetivo: 95/100",
    audit:"Auditoria",auditTitle:"Registro de Auditoria",auditDesc:"Rastreabilidade completa de tempos por fase",
    auditTotal:"Tempo Total",auditPhase:"Fase",auditDuration:"Duração",auditStart:"Início",auditEnd:"Fim",
    auditStatus:"Status",auditDetail:"Detalhe",auditFile:"Arquivo",auditExport:"Exportar JSON",
    auditConfig:"Configuração",auditTimeline:"Linha do Tempo",auditSummary:"Resumo de Tempos",
    auditCalls:"Chamadas API",auditAvg:"Média",auditSlowest:"Mais lento",auditFastest:"Mais rápido",
    auditDistrib:"Distribuição de Tempos",auditScoreEvol:"Evolução do Score",auditFileComp:"Tempo por Arquivo",
    auditPipeline:"Pipeline de Execução",auditEfficiency:"Eficiência",auditOverhead:"Overhead IA",
    auditPhDesc:"Descrição da Fase",auditIssuesDelta:"Delta de Issues",auditTokenEst:"Tokens Est.",
    auditFixRate:"Taxa de Correção",auditPhases:"fases completas",auditIter:"iterações",
    rollback:"Rollback — fix piorou resultado, restaurando versão anterior",
    stall:"Estagnação — score não melhora, parando ciclo",
    pdfExport:"Exportar PDF",pdfGen:"Gerando PDF...",pdfTitle:"Relatório de Migração",
    pdfExecSum:"Resumo Executivo",pdfConfig:"Configuração",pdfIntReport:"Relatório de Integração",
    pdfAuditTrail:"Auditoria de Tempos",pdfRisks:"Análise de Riscos",pdfFiles:"Arquivos Migrados",
    pdfGenBy:"Gerado por",pdfDate:"Data",pdfScore:"Pontuação",pdfVerdict:"Veredito",
    pdfIssues:"Problemas",pdfVerified:"Verificações",pdfPhase:"Fase",pdfDuration:"Duração",
    pdfChanges:"Alterações Detectadas",pdfModel:"Modelo Utilizado",pdfTotalTime:"Tempo Total",
    pdfApiCalls:"Chamadas API",pdfConfidential:"CONFIDENCIAL — SII Group Chile",
    dropTitle:"Solte seu código fonte aqui",orBrowse:"ou procure arquivos",supportedLangs:"Linguagens suportadas",
    readyCfg:"Configurar migração",samples:"Projetos de exemplo",samplesDesc:"Projetos demo para testes",
    linesCode:"linhas de código",filesSel:"arquivos selecionados",detectedAs:"detectado como",
    pMaps:"Mapas de Paradigma",pMapsDesc:"Traduções API concretas para migrações cross-language",
    pStdlib:"Traduções Stdlib",pPatterns:"Padrões de Código",pModules:"Sistema de Módulos",pAsync:"Modelo Async",pTypes:"Sistema de Tipos",
    pMapsNone:"Sem mapeamento disponível para este par de linguagens",pMapsActive:"Ativo para",pConns:"conexões",pIssues:"problemas",pBroken:"quebradas",
    andTitle:"Análise Android",andArch:"Arquitetura",andDeprecated:"APIs Obsoletas",andCompose:"Migração Compose",andSecurity:"Segurança Android",andGradle:"Dependências Gradle",andRefactor:"Plano de Refatoração",andModular:"Modularização",andReport:"Relatório Pré-Migração",andDownload:"Baixar Relatório",andBreach:"Brechas Detectadas",andPlan:"Plano de Ação",andLibs:"Atualização de Bibliotecas",andPattern:"Padrão Detectado",andTarget:"Padrão Alvo",andImpact:"Impacto",andEffort:"Esforço",andPriority:"Prioridade",andCritical:"Crítico",andMajor:"Maior",andMinor:"Menor",andXmlViews:"XML Views",andComposeTarget:"Jetpack Compose",andMvp:"MVP/MVC Legado",andMvvm:"MVVM + Clean",andAsyncTask:"AsyncTask (obsoleto)",andCoroutines:"Coroutines",andKotlinVer:"Versão Kotlin",andAndroidApi:"API Android",andMinSdk:"Min SDK",andTargetSdk:"Target SDK",andJetpack:"Bibliotecas Jetpack",andBreachSummary:"Resumo de Brechas",andNoBreaches:"Sem brechas detectadas",andGenReport:"Gerar Relatório",andReportReady:"Relatório pronto",andViewReport:"Ver Relatório",andExportHtml:"Exportar HTML",
    qaTitle:"QA Sandbox",qaRun:"Executar Testes",qaRunning:"Executando...",qaPreTitle:"Testes Pré-Migração",qaPostTitle:"Testes Pós-Migração",qaPassed:"Passaram",qaFailed:"Falharam",qaSkipped:"Omitidos",qaCompare:"Comparar Pré vs Pós",qaRetest:"Re-testar Migrado",qaNoTests:"Sem testes gerados ainda",qaGenerate:"Gerar Test Suite",qaTotal:"Total testes",qaIdentical:"Resultados idênticos",qaRegression:"Regressão detectada",qaNewPass:"Novo sucesso",qaExecTime:"Tempo execução",qaInput:"Entrada",qaExpected:"Esperado",qaActual:"Resultado",qaUnit:"Unitário",qaInteg:"Integração",qaApi:"API",qaFunc:"Função",qaFile:"Arquivo",qaCoverage:"Cobertura",qaExport:"Exportar Testes",qaSandbox:"Sandbox (execução real)",qaVirtual:"Virtual (análise IA)",qaVDesc:"Claude analisa e prevê o comportamento de cada função",qaVTrace:"Rastreamento de execução",qaVPredicted:"Previsto",qaVConfidence:"Confiança",qaVHigh:"Alta",qaVMed:"Média",qaVLow:"Baixa",qaVSideEffects:"Efeitos colaterais",qaVBehavior:"Comportamento",qaVEquivalent:"Equivalente",qaVDifferent:"Diferente",qaVTab:"Vista",dashTitle:"Dashboard",dashWelcome:"Bienvenido",dashNewMig:"Nueva Migración",dashTotalMig:"Migraciones",dashAvgScore:"Score Promedio",dashFilesProc:"Archivos",dashRecent:"Actividad Reciente",dashNoData:"Sin migraciones aún",dashStart:"Comenzar",sideNew:"Nueva Migración",sideDash:"Dashboard",sideResults:"Resultados",sideHist:"Historial",sideQA:"QA Tests",sideCfg:"Config. IA",loginWelcome:"Bienvenido a",loginName:"Tu nombre",loginBtn:"Ingresar",
    localFiles:"Arquivos Locais",localFilesDesc:"Envie .zip ou arquivos de código",ghRepoL:"Repositório GitHub",ghRepoDesc:"Importe arquivos de qualquer repo",strengths2:"Pontos Fortes",migrateTo2:"Migrar para",scoreTrend:"Tendência de Scores",noMigYet:"Sem migrações ainda",noMigDesc:"Inicie sua primeira migração para ver estatísticas",preview2:"Pré-visualização",copyCode:"Copiar",riskScore2:"RISCO",readiness2:"PREPARAÇÃO",qualityLayers:"Camadas de Qualidade"
  }
};

var UILANGS = [
  {code:"es",label:"Español",flag:"\ud83c\uddea\ud83c\uddf8"},
  {code:"en",label:"English",flag:"\ud83c\uddec\ud83c\udde7"},
  {code:"pt",label:"Português",flag:"\ud83c\udde7\ud83c\uddf7"}
];

var LANGS = {
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

var CROSS = [
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

// ═══ Cross-language file mapping ═══
var TARGET_EXT={python:".py",javascript:".js",typescript:".ts",java:".java",csharp:".cs",go:".go",rust:".rs",php:".php",ruby:".rb",kotlin:".kt"};
var MODULE_CONVENTIONS=(function(){
  // Built dynamically to prevent artifact parser from detecting example strings as real imports
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

// ═══ Cross-language paradigm mappings — 8 bidirectional maps with concrete API translations ═══
var PARADIGM_MAPS = {
  "python→javascript": {
    title: "Python → JavaScript/Node.js",
    stdlib: [
      "print('x') / print(x,end='') → console.log('x') / process.stdout.write(x)",
      "print(x, file=sys.stderr) → console.error(x)",
      "urllib2.urlopen(url) → fetch(url) or axios.get(url)",
      "urllib2.Request(url,data,headers) → fetch(url, {method:'POST',headers,body:JSON.stringify(data)})",
      "requests.get(url) → await fetch(url).then(r=>r.json())",
      "requests.post(url,json=data) → await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})",
      "json.loads(s) → JSON.parse(s)",
      "json.dumps(o) / json.dumps(o,indent=2) → JSON.stringify(o) / JSON.stringify(o,null,2)",
      "ConfigParser → JSON config file, dotenv, or cosmiconfig",
      "os.path.exists(p) → fs.existsSync(p)",
      "os.path.join(a,b) → path.join(a,b)",
      "os.path.basename(p) / os.path.dirname(p) → path.basename(p) / path.dirname(p)",
      "os.path.splitext(f) → [path.basename(f,path.extname(f)),path.extname(f)]",
      "os.makedirs(p,exist_ok=True) → fs.mkdirSync(p,{recursive:true})",
      "os.listdir(p) → fs.readdirSync(p)",
      "os.walk(p) → fs.readdirSync(p,{recursive:true,withFileTypes:true}) (Node 20+)",
      "pathlib.Path(f).read_text() → fs.readFileSync(f,'utf8')",
      "pathlib.Path(f).write_text(s) → fs.writeFileSync(f,s,'utf8')",
      "pathlib.Path(f).exists() → fs.existsSync(f)",
      "pathlib.Path(a) / b → path.join(a,b)",
      "open(f,'r').read() → fs.readFileSync(f,'utf8') or await fs.promises.readFile(f,'utf8')",
      "open(f,'w').write(s) → fs.writeFileSync(f,s) or await fs.promises.writeFile(f,s)",
      "open(f,'rb') → fs.readFileSync(f) (returns Buffer)",
      "time.strftime('%Y-%m-%d') → new Date().toISOString().slice(0,10)",
      "time.time() → Date.now()/1000",
      "time.sleep(n) → await new Promise(r=>setTimeout(r,n*1000))",
      "datetime.now() → new Date()",
      "datetime.now().isoformat() → new Date().toISOString()",
      "datetime.strptime(s,fmt) → new Date(s) or dayjs(s,fmt)",
      "timedelta(days=n) → n*24*60*60*1000 (ms) or dayjs().add(n,'day')",
      "sys.argv → process.argv.slice(2)",
      "sys.exit(code) → process.exit(code)",
      "os.environ['KEY'] / os.environ.get('KEY',def) → process.env.KEY || def",
      "re.match(pat,s) → s.match(new RegExp(pat))",
      "re.search(pat,s) → new RegExp(pat).exec(s)",
      "re.findall(pat,s) → [...s.matchAll(new RegExp(pat,'g'))].map(m=>m[0])",
      "re.sub(pat,repl,s) → s.replace(new RegExp(pat,'g'),repl)",
      "re.compile(pat) → new RegExp(pat,'g')",
      "re.split(pat,s) → s.split(new RegExp(pat))",
      "collections.Counter(items) → items.reduce((m,x)=>(m[x]=(m[x]||0)+1,m),{})",
      "collections.defaultdict(list) → new Proxy({},{get:(t,k)=>(t[k]=t[k]||[],t[k])})",
      "collections.OrderedDict → Map() (preserves insertion order)",
      "collections.deque → array (use push/shift for FIFO, push/pop for LIFO)",
      "collections.namedtuple('P',['x','y']) → class P { constructor(x,y){this.x=x;this.y=y} }",
      "itertools.chain(*lists) → [...list1,...list2,...listN] or [].concat(...lists)",
      "itertools.product(a,b) → a.flatMap(x=>b.map(y=>[x,y]))",
      "itertools.combinations(arr,r) → custom generator or combinatorics lib",
      "itertools.zip_longest(a,b,fill=0) → Array.from({length:Math.max(a.length,b.length)},(_,i)=>[a[i]??0,b[i]??0])",
      "functools.reduce(fn,items,init) → items.reduce(fn,init)",
      "functools.partial(fn,a) → fn.bind(null,a) or (b)=>fn(a,b)",
      "functools.lru_cache → manual Map cache or memoize lib",
      "hashlib.sha256(s.encode()).hexdigest() → crypto.createHash('sha256').update(s).digest('hex')",
      "base64.b64encode(s.encode()).decode() → Buffer.from(s).toString('base64')",
      "base64.b64decode(s) → Buffer.from(s,'base64').toString()",
      "uuid.uuid4() → crypto.randomUUID()",
      "copy.deepcopy(obj) → structuredClone(obj)",
      "copy.copy(obj) → {...obj} (shallow spread)",
      "math.floor/ceil/round → Math.floor/ceil/round",
      "math.sqrt/pow/log → Math.sqrt/pow/log",
      "random.random() → Math.random()",
      "random.randint(a,b) → Math.floor(Math.random()*(b-a+1))+a",
      "random.choice(arr) → arr[Math.floor(Math.random()*arr.length)]",
      "random.shuffle(arr) → arr.sort(()=>Math.random()-0.5) or Fisher-Yates",
      "logging.info/error/debug → console.log/error/debug or winston/pino logger",
      "subprocess.run(cmd) → child_process.execSync(cmd) or execa(cmd)",
      "typing.Optional[T] → T|undefined or T|null",
      "Decimal(x) → decimal.js lib or native arithmetic",
      "string.Template('$name') → template literal"
    ],
    patterns: [
      "class Foo: def __init__(self) → class Foo { constructor() }",
      "self.x → this.x (EVERY instance reference)",
      "def method(self,a,b) → method(a,b) { ... } (drop self)",
      "@staticmethod def fn() → static fn() { }",
      "@classmethod def fn(cls) → static fn() { }",
      "@property def name(self) → get name() { return this._name; }",
      "@name.setter def name(self,v) → set name(v) { this._name=v; }",
      "__str__(self) / __repr__(self) → toString() { }",
      "__len__(self) → get length() { } or custom method",
      "__eq__(self,other) → equals(other) { } (no operator overloading)",
      "__getitem__(self,key) → Proxy with get trap or get(key) method",
      "__contains__(self,item) → has(item) method",
      "__iter__/__next__ → [Symbol.iterator]() { } generator",
      "@dataclass class Foo: x:int; y:str → class Foo { constructor(x,y){this.x=x;this.y=y} }",
      "for k,v in dict.iteritems() → for (const [k,v] of Object.entries(dict))",
      "for k,v in dict.items() → for (const [k,v] of Object.entries(dict))",
      "dict.has_key(k) / k in dict → k in obj / obj.hasOwnProperty(k)",
      "isinstance(x, str) / isinstance(x, basestring) → typeof x === 'string'",
      "isinstance(x, (int,float,long)) → typeof x === 'number'",
      "isinstance(x,list) → Array.isArray(x)",
      "isinstance(x,dict) → typeof x==='object'&&x!==null&&!Array.isArray(x)",
      "isinstance(x,bool) → typeof x === 'boolean'",
      "isinstance(x,tuple) → Array.isArray(x) (Object.freeze for immutability)",
      "list.append(x) → array.push(x)",
      "list.extend(other) → array.push(...other)",
      "list.insert(i,x) → array.splice(i,0,x)",
      "list.pop() / list.pop(i) → array.pop() / array.splice(i,1)[0]",
      "list.remove(x) → array.splice(array.indexOf(x),1)",
      "list.index(x) → array.indexOf(x) (-1 vs ValueError)",
      "list.count(x) → array.filter(i=>i===x).length",
      "list.reverse() → array.reverse() (mutates) or [...arr].reverse()",
      "list(set(items)) → [...new Set(items)]",
      "dict.get(k,default) → obj[k] ?? default",
      "dict.setdefault(k,v) → obj[k] = obj[k] ?? v",
      "dict.update(other) → Object.assign(obj,other) or {...obj,...other}",
      "dict.pop(k,default) → (v=obj[k]??default, delete obj[k], v)",
      "'x' in list → array.includes('x')",
      "'x' in dict → 'x' in obj || obj.hasOwnProperty('x')",
      "[x*2 for x in items] → items.map(x=>x*2)",
      "[x for x in items if x>0] → items.filter(x=>x>0)",
      "[f(x) for x in items if p(x)] → items.filter(p).map(f)",
      "{k:v for k,v in items} → Object.fromEntries(items.map(([k,v])=>[k,v]))",
      "{k:f(v) for k,v in d.items()} → Object.fromEntries(Object.entries(d).map(([k,v])=>[k,f(v)]))",
      "set comprehension {x for x in items} → new Set(items.map(x=>x))",
      "generator (x for x in items) → function*(){for(const x of items)yield x}()",
      "def gen(): yield x → function* gen() { yield x }",
      "yield from iterable → yield* iterable",
      "next(gen) → gen.next().value",
      "try/except Exception as e → try { } catch(e) { }",
      "except (TypeError,ValueError) → catch(e) { if(e instanceof TypeError||e instanceof RangeError) }",
      "with open(f) as fh: → const data=fs.readFileSync(f,'utf8') or try/finally",
      "with contextmanager → try { acquire(); ... } finally { release(); }",
      "raise ValueError('msg') → throw new Error('msg')",
      "raise CustomError(msg) from e → throw new CustomError(msg,{cause:e})",
      "None → null",
      "True / False → true / false",
      "lambda x: x+1 → (x)=>x+1",
      "def fn(a,b=10,*args,**kwargs) → function fn(a,b=10,...args) (kwargs as options obj)",
      "f'Hello {name}' / '%s'%name → `Hello ${name}` (template literal)",
      "f'{val:.2f}' → val.toFixed(2)",
      "f'{val:>10}' → val.toString().padStart(10)",
      "a,b = b,a → [a,b]=[b,a]",
      "a,b,c = tuple_val → const [a,b,c] = array_val",
      "x if cond else y → cond ? x : y",
      "sorted(list,key=lambda x:x.v) → [...list].sort((a,b)=>a.v-b.v)",
      "sorted(list,reverse=True) → [...list].sort((a,b)=>b-a)",
      "dict.keys()/values()/items() → Object.keys/values/entries(obj)",
      "enumerate(items) → items.map((item,i)=>[i,item]) or forEach((item,i)=>{})",
      "zip(a,b) → a.map((x,i)=>[x,b[i]])",
      "any(cond for x in items) → items.some(x=>cond)",
      "all(cond for x in items) → items.every(x=>cond)",
      "sum(items) → items.reduce((s,x)=>s+x,0)",
      "min(items)/max(items) → Math.min(...items)/Math.max(...items)",
      "abs(x) → Math.abs(x)",
      "round(x,n) → Number(x.toFixed(n))",
      "divmod(a,b) → [Math.floor(a/b),a%b]",
      "int(s,base) → parseInt(s,base)",
      "str.startswith/endswith → str.startsWith/endsWith",
      "str.strip()/lstrip()/rstrip() → str.trim()/trimStart()/trimEnd()",
      "str.split(sep,maxsplit) → str.split(sep) (different maxsplit semantics!)",
      "'sep'.join(list) → array.join('sep')",
      "str.replace(old,new) → str.replaceAll(old,new) (ES2021+)",
      "str.upper()/lower() → str.toUpperCase()/toLowerCase()",
      "str.isdigit()/isalpha() → /^\\d+$/.test(str) / /^[a-zA-Z]+$/.test(str)",
      "str.zfill(n) → str.padStart(n,'0')",
      "chr(n)/ord(c) → String.fromCharCode(n)/c.charCodeAt(0)",
      "map(fn,items) → items.map(fn)",
      "filter(fn,items) → items.filter(fn)",
      "len(x) → x.length",
      "range(n) → Array.from({length:n},(_,i)=>i)",
      "range(a,b) → Array.from({length:b-a},(_,i)=>i+a)",
      "type(x).__name__ → typeof x or x.constructor.name",
      "ABC/@abstractmethod → throw new Error('Abstract') in base",
      "super().__init__() → super()",
      "multiple inheritance class C(A,B) → mixin pattern or single extends",
      "enum.Enum → Object.freeze({A:'A',B:'B'}) or TS enum"
    ],
    modules: [
      "from module import Class → import { Class } from {./module.js}",
      "from module import * → import * as module from {./module.js}",
      "import module → import module from {./module.js} (default)",
      "__name__=='__main__' → top-level await in ESM or if(require.main===module)",
      "__init__.py barrel → index.js with re-exports: export { X } from {./x.js}",
      "from .sibling import X → import { X } from {./sibling.js}",
      "from package.sub import X → import { X } from {./sub/index.js}",
      "requirements.txt / pyproject.toml → package.json dependencies",
      "pip install pkg → npm install pkg"
    ],
    async: [
      "urllib2.urlopen (sync) → await fetch() (async)",
      "open().read() (sync I/O) → await fs.promises.readFile() (async)",
      "time.sleep(n) (blocking) → await new Promise(r=>setTimeout(r,n*1000))",
      "threading.Thread(target=fn) → Promise or Worker thread",
      "multiprocessing.Pool → Promise.all() or worker_threads pool",
      "asyncio.run(main()) → top-level await or main().catch(console.error)",
      "async def fn(): await x → async function fn() { await x }",
      "asyncio.gather(*coros) → await Promise.all([p1,p2])",
      "asyncio.create_task(coro) → const p = asyncFn() (auto-starts)",
      "asyncio.Queue → custom async queue or p-queue lib",
      "async for item in aiter → for await (const item of asyncIter)"
    ],
    versionNotes: [
      "Target ES5: No arrow functions (use function(){}), no template literals (use +), no const/let (use var), no class (use prototype), no destructuring",
      "Target ES6/ES2015: Use const/let, arrow functions, template literals, classes, destructuring, default params, for...of, Map/Set, Promise",
      "Target ES2020: Use optional chaining (?.), nullish coalescing (??), BigInt, Promise.allSettled, globalThis, dynamic import()",
      "Target ES2024: Use Array.groupBy, Promise.withResolvers, Set operations, RegExp v flag, well-formed Unicode strings"
    ]
  },

  "javascript→python": {
    title: "JavaScript/Node.js → Python",
    stdlib: [
      "console.log(x) → print(x)",
      "console.error(x) → print(x, file=sys.stderr) or logging.error(x)",
      "console.warn(x) → logging.warning(x)",
      "console.table(data) → print(tabulate(data)) or pprint(data)",
      "fetch(url) → requests.get(url) (sync) or aiohttp (async) or urllib.request.urlopen(url)",
      "fetch(url,{method:'POST',body}) → requests.post(url,json=body)",
      "fetch(url,{headers}) → requests.get(url,headers=headers)",
      "response.json() → response.json() (requests) or json.loads(response.read())",
      "response.text() → response.text (requests) or response.read().decode()",
      "response.ok → response.ok (requests) or response.status == 200",
      "JSON.parse(s) → json.loads(s)",
      "JSON.stringify(obj) → json.dumps(obj)",
      "JSON.stringify(obj,null,2) → json.dumps(obj,indent=2)",
      "fs.readFileSync(f,'utf8') → Path(f).read_text() (pathlib) or open(f).read()",
      "fs.writeFileSync(f,s) → Path(f).write_text(s) or open(f,'w').write(s)",
      "fs.existsSync(p) → Path(p).exists() or os.path.exists(p)",
      "fs.mkdirSync(p,{recursive:true}) → Path(p).mkdir(parents=True,exist_ok=True)",
      "fs.readdirSync(p) → os.listdir(p) or list(Path(p).iterdir())",
      "fs.unlinkSync(f) → os.remove(f) or Path(f).unlink()",
      "fs.statSync(f).size → os.path.getsize(f) or Path(f).stat().st_size",
      "fs.promises.readFile(f) → async: await aiofiles.open(f) or sync: Path(f).read_text()",
      "path.join(a,b) → os.path.join(a,b) or Path(a)/b",
      "path.resolve(p) → os.path.abspath(p) or Path(p).resolve()",
      "path.basename(p) → os.path.basename(p) or Path(p).name",
      "path.dirname(p) → os.path.dirname(p) or Path(p).parent",
      "path.extname(p) → os.path.splitext(p)[1] or Path(p).suffix",
      "new Date() → datetime.now()",
      "new Date().toISOString() → datetime.now(timezone.utc).isoformat()",
      "Date.now() → int(time.time()*1000)",
      "new Date(s) → datetime.fromisoformat(s) (3.7+) or dateutil.parser.parse(s)",
      "setTimeout(fn,ms) → asyncio.sleep(ms/1000) or time.sleep(ms/1000)",
      "setInterval(fn,ms) → while loop with asyncio.sleep or threading.Timer",
      "clearTimeout/clearInterval → task.cancel() (asyncio) or timer.cancel()",
      "process.env.KEY → os.environ.get('KEY') or os.environ['KEY']",
      "process.argv.slice(2) → sys.argv[1:]",
      "process.cwd() → os.getcwd() or Path.cwd()",
      "process.exit(code) → sys.exit(code)",
      "Math.floor/ceil/round(x) → math.floor/ceil/round(x) or int(x)//1",
      "Math.random() → random.random()",
      "Math.max(...arr) / Math.min(...arr) → max(arr) / min(arr)",
      "Math.abs/sqrt/pow/log → abs/math.sqrt/math.pow/math.log (abs is builtin)",
      "x.length → len(x)",
      "String(x) → str(x)",
      "Number(x) → int(x) or float(x)",
      "parseInt(x,10) → int(x)",
      "parseFloat(x) → float(x)",
      "isNaN(x) → math.isnan(x)",
      "isFinite(x) → math.isfinite(x)",
      "crypto.createHash('sha256').update(s).digest('hex') → hashlib.sha256(s.encode()).hexdigest()",
      "crypto.randomUUID() → str(uuid.uuid4())",
      "Buffer.from(s,'base64') → base64.b64decode(s)",
      "Buffer.from(s).toString('base64') → base64.b64encode(s.encode()).decode()",
      "structuredClone(obj) → copy.deepcopy(obj)",
      "{...obj} (spread) → copy.copy(obj) or {**obj}",
      "new RegExp(pat,'g') → re.compile(pat)",
      "str.match(re) → re.match(pat,s) or re.search(pat,s)",
      "str.matchAll(re) → re.finditer(pat,s)",
      "str.replace(re,repl) → re.sub(pat,repl,s)",
      "str.split(re) → re.split(pat,s)",
      "new Map() → dict() (or OrderedDict for guaranteed order in 3.6)",
      "new Set() → set()",
      "new WeakMap() / new WeakRef(obj) → weakref.WeakValueDictionary() / weakref.ref(obj)",
      "child_process.execSync(cmd) → subprocess.run(cmd,shell=True,capture_output=True)",
      "EventEmitter → custom pub/sub or signals library"
    ],
    patterns: [
      "class Foo { constructor(a,b) { this.a=a } } → class Foo: def __init__(self,a,b): self.a=a",
      "this.x → self.x (EVERY instance reference)",
      "method(a,b) { } → def method(self,a,b): (add self as first param)",
      "static fn() { } → @staticmethod def fn():",
      "get name() { } → @property def name(self):",
      "set name(v) { } → @name.setter def name(self,v):",
      "toString() { } → def __str__(self):",
      "equals(other) → def __eq__(self,other):",
      "[Symbol.iterator]() → def __iter__(self): / def __next__(self):",
      "class Foo extends Bar → class Foo(Bar):",
      "#privateField → self._private_field (convention)",
      "class { static #count } → class Foo: _count = 0 (class variable)",
      "for (const [k,v] of Object.entries(obj)) → for k,v in obj.items():",
      "for (const item of array) → for item in array:",
      "for (let i=0;i<arr.length;i++) → for i in range(len(arr)):",
      "arr.forEach((item,i)=>{}) → for i,item in enumerate(arr):",
      "while (cond) { } → while cond:",
      "do { } while(cond) → while True: ... if not cond: break",
      "typeof x==='string' → isinstance(x,str)",
      "typeof x==='number' → isinstance(x,(int,float))",
      "typeof x==='boolean' → isinstance(x,bool)",
      "typeof x==='undefined' → x is None (or check with hasattr)",
      "Array.isArray(x) → isinstance(x,list)",
      "x instanceof Foo → isinstance(x,Foo)",
      "arr.push(x) → arr.append(x)",
      "arr.push(...other) → arr.extend(other)",
      "arr.pop() → arr.pop()",
      "arr.shift() → arr.pop(0) or collections.deque.popleft()",
      "arr.unshift(x) → arr.insert(0,x)",
      "arr.splice(i,1) → arr.pop(i) or del arr[i]",
      "arr.splice(i,0,x) → arr.insert(i,x)",
      "arr.slice(a,b) → arr[a:b]",
      "arr.concat(other) → arr + other or [*arr,*other]",
      "arr.includes(x) → x in arr",
      "arr.indexOf(x) → arr.index(x) (wrap in try for -1 behavior)",
      "arr.find(x=>cond) → next((x for x in arr if cond),None)",
      "arr.findIndex(x=>cond) → next((i for i,x in enumerate(arr) if cond),-1)",
      "arr.flat(depth) → [item for sub in arr for item in (sub if isinstance(sub,list) else [sub])]",
      "arr.flatMap(fn) → [y for x in arr for y in fn(x)]",
      "obj[k] ?? default → obj.get(k,default)",
      "Object.assign(obj,other) → obj.update(other) or {**obj,**other}",
      "Object.keys(obj) → list(obj.keys())",
      "Object.values(obj) → list(obj.values())",
      "Object.entries(obj) → obj.items()",
      "Object.fromEntries(arr) → dict(arr)",
      "Object.freeze(obj) → types.MappingProxyType(obj) or @dataclass(frozen=True)",
      "{...obj,key:val} → {**obj,'key':val}",
      "[...arr1,...arr2] → [*arr1,*arr2]",
      "arr.map(x=>x*2) → [x*2 for x in arr]",
      "arr.filter(x=>x>0) → [x for x in arr if x>0]",
      "arr.some(x=>cond) → any(cond for x in arr)",
      "arr.every(x=>cond) → all(cond for x in arr)",
      "arr.reduce((s,x)=>s+x,0) → sum(arr) or functools.reduce()",
      "[...arr].sort((a,b)=>a.v-b.v) → sorted(arr,key=lambda x:x.v)",
      "[...new Set(arr)] → list(set(arr))",
      "arr.join(sep) → sep.join(arr)",
      "str.startsWith(p) / str.endsWith(s) → str.startswith(p) / str.endswith(s)",
      "str.trim()/trimStart()/trimEnd() → str.strip()/lstrip()/rstrip()",
      "str.padStart(n,c) / str.padEnd(n,c) → str.rjust(n,c) / str.ljust(n,c)",
      "str.repeat(n) → str * n",
      "str.toUpperCase()/toLowerCase() → str.upper()/str.lower()",
      "str.replaceAll(old,new) → str.replace(old,new) (Python replace is global)",
      "str.charAt(i) / str[i] → str[i]",
      "str.charCodeAt(i) → ord(str[i])",
      "String.fromCharCode(n) → chr(n)",
      "try { } catch(e) { } → try: ... except Exception as e: ...",
      "catch(e) { if(e instanceof TypeError) } → except TypeError as e:",
      "throw new Error('msg') → raise ValueError('msg') or raise RuntimeError('msg')",
      "throw new CustomError(msg,{cause:e}) → raise CustomError(msg) from e",
      "null / undefined → None",
      "true / false → True / False",
      "(x)=>x+1 → lambda x: x+1",
      "function fn(a,b=10,...args) → def fn(a,b=10,*args):",
      "fn({opt1,opt2}) (options obj) → def fn(**kwargs): or def fn(opt1=None,opt2=None):",
      "`Hello ${name}` → f'Hello {name}'",
      "cond ? x : y → x if cond else y",
      "x?.y?.z → getattr(getattr(x,'y',None),'z',None) or try/except",
      "x ?? default → x if x is not None else default",
      "const {a,b}=obj → a,b = obj['a'],obj['b']",
      "const [a,b]=arr → a,b = arr",
      "const [first,...rest]=arr → first,*rest = arr",
      "switch(x) { case 'a': ... } → match x: case 'a': ... (3.10+) or if/elif",
      "function* gen() { yield x } → def gen(): yield x",
      "yield* iterable → yield from iterable",
      "for await (const x of iter) → async for x in iter:",
      "new Proxy(target,handler) → __getattr__/__setattr__/__getitem__ dunder methods",
      "Symbol('desc') → string constant (no direct equivalent)",
      "Promise.resolve(val) → asyncio.coroutine returning val or immediate return",
      "async () => { } (IIFE) → asyncio.run(async_main())"
    ],
    modules: [
      "import { X } from {./module.js} → from module import X",
      "import * as mod from {./module.js} → import module",
      "import mod from {./module.js} (default) → from module import default_export",
      "export default X → X at module level (use __all__ to restrict)",
      "export { X,Y } → __all__ = ['X','Y']",
      "export class Foo {} → class Foo: (public by default)",
      "index.js barrel → __init__.py with from .submodule import X",
      "package.json dependencies → requirements.txt or pyproject.toml",
      "npm install pkg → pip install pkg",
      "dynamic import({mod}) → importlib.import_module({mod})"
    ],
    async: [
      "async function fn() → async def fn(): (requires asyncio)",
      "await fetch(url) → async: await aiohttp.ClientSession().get(url) or sync: requests.get(url)",
      "await fs.promises.readFile(f) → async: await aiofiles.open(f) or sync: Path(f).read_text()",
      "Promise.all([p1,p2]) → await asyncio.gather(p1,p2)",
      "Promise.race([p1,p2]) → await asyncio.wait(tasks,return_when=FIRST_COMPLETED)",
      "Promise.allSettled(promises) → results=await asyncio.gather(*tasks,return_exceptions=True)",
      "new Promise((resolve,reject)=>{}) → loop.create_future() or asyncio.Future()",
      "setTimeout(fn,ms) → await asyncio.sleep(ms/1000)",
      "Worker threads → multiprocessing.Process or concurrent.futures.ProcessPoolExecutor",
      "AbortController/signal → asyncio.Task.cancel() or threading.Event",
      "event.on('data',cb) → asyncio.Queue or callback pattern",
      "setImmediate(fn) → await asyncio.sleep(0) (yield control)"
    ],
    versionNotes: [
      "Target Python 2.7: print stmt not fn, basestring not str, .iteritems() not .items(), urllib2, ConfigParser, no f-strings, no type hints",
      "Target Python 3.6: f-strings, type hints, async/await, pathlib, no walrus operator",
      "Target Python 3.8: Walrus operator (:=), positional-only params (/), f-string debugging (f'{x=}')",
      "Target Python 3.10: match/case (structural pattern matching), union types X|Y, ParamSpec",
      "Target Python 3.12: Type parameter syntax (def fn[T](x:T)), f-string any expression, improved error messages"
    ]
  },

  "java→csharp": {
    title: "Java → C#/.NET",
    stdlib: [
      "System.out.println(x) → Console.WriteLine(x)",
      "String.format(\"%s: %d\",a,b) → $\"{a}: {b}\" (interpolation)",
      "new SimpleDateFormat(\"yyyy-MM-dd\") → DateTime.Now.ToString(\"yyyy-MM-dd\")",
      "System.currentTimeMillis() → DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()",
      "new Date() → DateTime.Now or DateTime.UtcNow",
      "Thread.sleep(ms) → await Task.Delay(ms) (async) or Thread.Sleep(ms)",
      "Integer.parseInt(s) → int.Parse(s) or int.TryParse(s,out var n)",
      "Double.parseDouble(s) → double.Parse(s)",
      "System.getenv(\"KEY\") → Environment.GetEnvironmentVariable(\"KEY\")",
      "Files.readString(Path.of(f)) → File.ReadAllText(f)",
      "Files.writeString(Path.of(f),s) → File.WriteAllText(f,s)",
      "Files.exists(Path.of(f)) → File.Exists(f)",
      "Paths.get(a,b) → Path.Combine(a,b)",
      "UUID.randomUUID() → Guid.NewGuid()",
      "Math.max/min/abs → Math.Max/Min/Abs (PascalCase)",
      "new ObjectMapper().readValue(s,T.class) → JsonSerializer.Deserialize<T>(s)",
      "new ObjectMapper().writeValueAsString(obj) → JsonSerializer.Serialize(obj)",
      "list.stream().filter(p).collect(toList()) → list.Where(p).ToList() (LINQ)",
      "new BufferedReader(new FileReader(f)) → File.ReadLines(f) or StreamReader",
      "System.err.println(x) → Console.Error.WriteLine(x)",
      "Arrays.asList(a,b,c) → new List<T>{a,b,c}",
      "Collections.unmodifiableList(list) → list.AsReadOnly()",
      "Pattern.compile(regex).matcher(s) → Regex.Match(s,pattern)"
    ],
    patterns: [
      "implements Interface → : IInterface (C# prefix I convention)",
      "extends Base → : Base (single colon for both)",
      "final field → readonly field",
      "final class → sealed class",
      "private String name + getName()/setName() → public string Name { get; set; } (auto-property)",
      "ArrayList<T> / List<T> → List<T> (System.Collections.Generic)",
      "HashMap<K,V> → Dictionary<K,V>",
      "HashSet<T> → HashSet<T>",
      "TreeMap<K,V> → SortedDictionary<K,V>",
      "Optional<T> → T? (nullable) or Nullable<T>",
      "opt.isPresent() → x != null / x is not null",
      "opt.orElse(def) → x ?? def (null coalescing)",
      "stream.filter(x->cond) → list.Where(x=>cond) (LINQ)",
      "stream.map(x->fn(x)) → list.Select(x=>fn(x)) (LINQ)",
      "stream.collect(Collectors.toList()) → .ToList()",
      "stream.forEach(x->{}) → foreach(var x in list) or list.ForEach()",
      "stream.reduce(id,acc) → list.Aggregate(id,(a,x)=>...)",
      "stream.anyMatch(pred) → list.Any(pred) (LINQ)",
      "stream.allMatch(pred) → list.All(pred) (LINQ)",
      "stream.sorted(Comparator) → list.OrderBy(x=>x.Prop) (LINQ)",
      "Collections.sort(list,comp) → list.Sort(comp) or list.OrderBy()",
      "new Comparator<T>(){compare(a,b){}} → (a,b)=>a.CompareTo(b)",
      "for (var entry : map.entrySet()) → foreach (var (key,val) in dict)",
      "@Override → override keyword",
      "@Deprecated → [Obsolete(\"message\")]",
      "instanceof → is pattern: if (x is Type t) { use t }",
      "try-with-resources → using statement: using var x = new R()",
      "throw new IllegalArgumentException → throw new ArgumentException",
      "catch(IOException|SQLException e) → catch(Exception e) when (e is IOException or SqlException)"
    ],
    modules: [
      "package com.app.service → namespace App.Service",
      "import java.util.List → using System.Collections.Generic",
      "import static → using static ClassName",
      "Maven/Gradle dependency → NuGet package reference"
    ],
    async: [
      "CompletableFuture<T> → Task<T>",
      "future.thenApply(fn) → await task; fn(result) or task.ContinueWith()",
      "CompletableFuture.allOf(futures) → Task.WhenAll(tasks)",
      "CompletableFuture.supplyAsync(()->val) → Task.Run(()=>val)",
      "ExecutorService → Task.Run or ThreadPool",
      "synchronized block → lock(obj) { } or SemaphoreSlim"
    ],
    versionNotes: [
      "Target .NET 6: Minimal API, top-level statements, file-scoped namespaces, global usings, record structs",
      "Target .NET 8: Primary constructors, collection expressions, default interface methods, required members, raw string literals",
      "Target .NET Framework 4.8: Full System.Web, ConfigurationManager, WCF, classic ASP.NET MVC",
      "Target .NET Core 3.1: No System.Web (use ASP.NET Core), IConfiguration instead of ConfigurationManager, dependency injection built-in"
    ]
  },

  "csharp→java": {
    title: "C#/.NET → Java",
    stdlib: [
      "Console.WriteLine(x) → System.out.println(x)",
      "$\"{a}: {b}\" (interpolation) → String.format(\"%s: %s\",a,b)",
      "DateTime.Now.ToString(fmt) → LocalDateTime.now().format(DateTimeFormatter.ofPattern(fmt))",
      "DateTimeOffset.UtcNow → Instant.now() (java.time)",
      "Thread.Sleep(ms) → Thread.sleep(ms)",
      "int.Parse(s) → Integer.parseInt(s)",
      "int.TryParse(s,out var n) → try{Integer.parseInt(s)}catch(NumberFormatException e){}",
      "File.ReadAllText(f) → Files.readString(Path.of(f)) (Java 11+)",
      "File.WriteAllText(f,s) → Files.writeString(Path.of(f),s)",
      "File.Exists(f) → Files.exists(Path.of(f))",
      "Path.Combine(a,b) → Paths.get(a,b).toString()",
      "Guid.NewGuid() → UUID.randomUUID()",
      "Environment.GetEnvironmentVariable(k) → System.getenv(k)",
      "JsonSerializer.Deserialize<T>(s) → new ObjectMapper().readValue(s,T.class)",
      "JsonSerializer.Serialize(obj) → new ObjectMapper().writeValueAsString(obj)",
      "list.Where(p).ToList() → list.stream().filter(p).collect(Collectors.toList())",
      "File.ReadLines(f) → Files.readAllLines(Path.of(f))",
      "Console.Error.WriteLine(x) → System.err.println(x)",
      "new List<T>{a,b,c} → List.of(a,b,c) (Java 9+)",
      "list.AsReadOnly() → Collections.unmodifiableList(list)",
      "Regex.Match(s,pat) → Pattern.compile(pat).matcher(s)"
    ],
    patterns: [
      ": IInterface → implements Interface (drop I prefix)",
      ": Base → extends Base",
      "sealed class → final class",
      "readonly field → final field",
      "public string Name {get;set;} → private String name + getName()/setName()",
      "auto-property {get;} → final field + getter",
      "List<T> (System.Collections) → ArrayList<T> or List<T> (java.util)",
      "Dictionary<K,V> → HashMap<K,V> or Map<K,V>",
      "SortedDictionary<K,V> → TreeMap<K,V>",
      "T? (nullable) → Optional<T> (Java 8+)",
      "x ?? default → Optional.ofNullable(x).orElse(default)",
      "x?.Property → Optional.ofNullable(x).map(o->o.getProperty())",
      "list.Where(x=>cond) → list.stream().filter(x->cond)",
      "list.Select(x=>fn(x)) → list.stream().map(x->fn(x))",
      "list.ToList() → .collect(Collectors.toList())",
      "list.Any(pred) → list.stream().anyMatch(pred)",
      "list.All(pred) → list.stream().allMatch(pred)",
      "list.OrderBy(x=>x.P) → list.stream().sorted(Comparator.comparing(x->x.getP()))",
      "list.Aggregate(init,(a,x)=>...) → list.stream().reduce(init,(a,x)->...)",
      "foreach(var x in list) → for(var x : list) (Java 10+ var)",
      "foreach(var (k,v) in dict) → for(var e:map.entrySet()){var k=e.getKey();var v=e.getValue();}",
      "is Type t (pattern) → instanceof Type t (Java 16+) or instanceof + cast",
      "using var x = new R() → try(var x = new R()) { } (try-with-resources)",
      "throw new ArgumentException → throw new IllegalArgumentException",
      "throw new ArgumentNullException → throw new NullPointerException",
      "catch when (condition) → catch then if(condition)",
      "record Foo(int X) → record Foo(int x) {} (Java 16+)",
      "[Obsolete] → @Deprecated",
      "delegate/event → listener interface + callback pattern",
      "LINQ to Objects → Java Stream API"
    ],
    modules: [
      "namespace App.Service → package com.app.service",
      "using System.Collections.Generic → import java.util.*",
      "using static → import static pkg.ClassName.*",
      "NuGet package → Maven/Gradle dependency"
    ],
    async: [
      "async Task<T> Method() → CompletableFuture<T> method()",
      "await task → future.join() (blocking) or .thenApply() (chained)",
      "Task.WhenAll(tasks) → CompletableFuture.allOf(futures)",
      "Task.Run(()=>val) → CompletableFuture.supplyAsync(()->val)",
      "lock(obj){} → synchronized(obj){} or ReentrantLock",
      "CancellationToken → volatile boolean flag or Future.cancel()"
    ],
    versionNotes: [
      "Target Java 8: Streams, lambdas, Optional, CompletableFuture, no var, no records, no switch expressions",
      "Target Java 11: var keyword, HttpClient, String methods (isBlank, strip, repeat), Files.readString",
      "Target Java 17: Records, sealed classes, pattern matching instanceof, text blocks, switch expressions",
      "Target Java 21: Virtual threads, record patterns, sequenced collections, string templates (preview)"
    ]
  },

  "java→python": {
    title: "Java → Python",
    stdlib: [
      "System.out.println(x) → print(x)",
      "String.format(\"%s: %d\",a,b) → f'{a}: {b}'",
      "Integer.parseInt(s) → int(s)",
      "Double.parseDouble(s) → float(s)",
      "new SimpleDateFormat(fmt).format(date) → datetime.now().strftime(fmt)",
      "LocalDateTime.now() → datetime.now()",
      "System.currentTimeMillis() → int(time.time()*1000)",
      "Thread.sleep(ms) → time.sleep(ms/1000)",
      "System.getenv(\"KEY\") → os.environ.get('KEY')",
      "Files.readString(Path.of(f)) → Path(f).read_text() (from pathlib)",
      "Files.writeString(Path.of(f),s) → Path(f).write_text(s)",
      "Files.exists(Path.of(f)) → Path(f).exists()",
      "Paths.get(a,b) → Path(a)/b or os.path.join(a,b)",
      "UUID.randomUUID() → uuid.uuid4()",
      "Math.max/min/abs → max()/min()/abs() (builtins)",
      "Collections.sort(list) → list.sort() or sorted(list)",
      "json via Jackson/Gson → json.loads(s) / json.dumps(obj)",
      "Jackson ObjectMapper → json module (json.loads/json.dumps)",
      "Arrays.asList(a,b) → [a,b] (literal list)",
      "Collections.unmodifiableList(l) → tuple(l) (immutable)",
      "list.stream().filter(p).map(f).collect(toList()) → [f(x) for x in list if p(x)]",
      "new HashMap<>() → dict()",
      "new ArrayList<>() → list()",
      "new HashSet<>() → set()",
      "StringBuilder → list.append()+str.join() or io.StringIO",
      "Pattern.compile(re).matcher(s).find() → re.search(re,s)"
    ],
    patterns: [
      "public class Foo { private int x; Foo(int x){this.x=x;} } → class Foo: def __init__(self,x): self.x=x",
      "public class w/ getters/setters → @dataclass class Foo: x:int (3.7+)",
      "record Foo(int x,String y) → @dataclass(frozen=True) class Foo: x:int; y:str",
      "this.x → self.x",
      "getX()/setX(v) → @property x / @x.setter or direct self.x",
      "private/protected/public → _ prefix convention (no enforcement)",
      "final → UPPER_CASE convention for constants",
      "static method → @staticmethod or @classmethod",
      "interface IFoo { } → class Foo(ABC): @abstractmethod",
      "implements Interface → class Foo(Interface): (multiple inheritance)",
      "extends Base → class Foo(Base):",
      "ArrayList<T>/List<T> → list (optionally list[T] hints)",
      "HashMap<K,V>/Map<K,V> → dict (optionally dict[K,V])",
      "HashSet<T> → set",
      "Optional<T> → None check or typing.Optional[T]",
      "opt.orElse(def) → x if x is not None else def",
      "stream.filter(p).map(f).collect(toList()) → [f(x) for x in items if p(x)]",
      "stream.forEach(x->{}) → for x in items: ...",
      "stream.anyMatch(pred) → any(pred(x) for x in items)",
      "stream.allMatch(pred) → all(pred(x) for x in items)",
      "for(var entry:map.entrySet()) → for k,v in d.items():",
      "for(int i=0;i<n;i++) → for i in range(n):",
      "instanceof Type → isinstance(x,Type)",
      "switch/case → match/case (3.10+) or if/elif",
      "try-with-resources → with statement",
      "try/catch/finally → try/except/finally",
      "throw new Exception(msg) → raise Exception(msg)",
      "null → None",
      "lambda x -> x+1 → lambda x: x+1",
      "enum Direction{N,S} → class Direction(Enum): N='N'; S='S'"
    ],
    modules: [
      "package com.app.service → directory structure app/service/",
      "import java.util.List → no import needed (list is builtin)",
      "import com.app.model.User → from app.model import User",
      "Maven/Gradle → pip requirements.txt or pyproject.toml"
    ],
    async: [
      "CompletableFuture<T> → async def fn() -> T: (asyncio)",
      "future.thenApply(fn) → result = await coro; fn(result)",
      "CompletableFuture.allOf(futures) → await asyncio.gather(*coros)",
      "ExecutorService → concurrent.futures.ThreadPoolExecutor",
      "synchronized → threading.Lock() or asyncio.Lock()"
    ],
    versionNotes: [
      "Target Python 3.6: f-strings, type hints (PEP 484), async/await, pathlib, dataclasses (3.7)",
      "Target Python 3.8: Walrus operator (:=), positional-only params, TypedDict, f'{x=}' debug",
      "Target Python 3.10: match/case, union X|Y syntax, ParamSpec, structural pattern matching",
      "Target Python 3.12: Type parameter syntax class Foo[T]:, f-string improvements, @override decorator"
    ]
  },

  "python→java": {
    title: "Python → Java",
    stdlib: [
      "print(x) → System.out.println(x)",
      "f'{a}: {b}' → String.format(\"%s: %s\",a,b)",
      "int(s) → Integer.parseInt(s)",
      "float(s) → Double.parseDouble(s)",
      "str(x) → String.valueOf(x)",
      "len(x) → x.size() (collections) or x.length() (strings) or x.length (arrays)",
      "datetime.now().strftime(fmt) → LocalDateTime.now().format(DateTimeFormatter.ofPattern(fmt))",
      "time.sleep(n) → Thread.sleep((long)(n*1000))",
      "os.environ.get('KEY') → System.getenv(\"KEY\")",
      "Path(f).read_text() → Files.readString(Path.of(f)) (Java 11+)",
      "Path(f).write_text(s) → Files.writeString(Path.of(f),s)",
      "Path(f).exists() → Files.exists(Path.of(f))",
      "os.path.join(a,b) → Paths.get(a,b).toString()",
      "uuid.uuid4() → UUID.randomUUID()",
      "max()/min()/abs() → Math.max()/Math.min()/Math.abs()",
      "sorted(list) → list.stream().sorted().collect(Collectors.toList())",
      "json.loads(s) → new ObjectMapper().readValue(s,Map.class) (Jackson)",
      "json.dumps(obj) → new ObjectMapper().writeValueAsString(obj)",
      "json module → Jackson ObjectMapper or Gson",
      "[a,b] (list literal) → List.of(a,b) (Java 9+) or Arrays.asList(a,b)",
      "tuple(l) (immutable) → Collections.unmodifiableList(l) or List.copyOf(l)",
      "[f(x) for x in items if p(x)] → items.stream().filter(p).map(f).collect(toList())",
      "dict() → new HashMap<>()",
      "list() → new ArrayList<>()",
      "set() → new HashSet<>()",
      "str.join(parts) → String.join(sep,parts) or StringBuilder",
      "re.search(pat,s) → Pattern.compile(pat).matcher(s).find()"
    ],
    patterns: [
      "class Foo: def __init__(self,x): self.x=x → public class Foo { private int x; public Foo(int x){this.x=x;} }",
      "@dataclass class Foo: x:int; y:str → public record Foo(int x,String y){} (Java 16+)",
      "self.x → this.x",
      "def method(self,a,b): → public ReturnType method(Type a,Type b) { } (add types)",
      "@staticmethod def fn(): → public static ReturnType fn() { }",
      "@property def name(self): → public String getName() { return this.name; }",
      "list → ArrayList<T> (must declare element type)",
      "dict → HashMap<K,V> (must declare key+value types)",
      "set → HashSet<T>",
      "tuple → custom record or List",
      "None → null or Optional<T> for returns",
      "[fn(x) for x in items if p(x)] → items.stream().filter(p).map(fn).collect(toList())",
      "for k,v in d.items(): → for(var e:map.entrySet()){var k=e.getKey();var v=e.getValue();}",
      "for i in range(n): → for(int i=0;i<n;i++)",
      "any(pred(x) for x in items) → items.stream().anyMatch(pred)",
      "isinstance(x,Type) → x instanceof Type",
      "match/case (3.10+) → switch expression (Java 14+)",
      "with open(f) as fh: → try(var r=new BufferedReader(new FileReader(f))){...}",
      "raise Exception(msg) → throw new RuntimeException(msg)",
      "lambda x: x+1 → (x)->x+1",
      "**kwargs → Map<String,Object> param or Builder pattern",
      "f'Hello {name}' → String.format(\"Hello %s\",name)",
      "x if cond else y → cond ? x : y",
      "class Direction(Enum): → enum Direction { N,S }",
      "ABC / @abstractmethod → interface or abstract class",
      "# type hints: x:int → explicit type: int x"
    ],
    modules: [
      "from app.model import User → import com.app.model.User",
      "from . import sibling → same-package import (no keyword needed)",
      "requirements.txt / pyproject.toml → pom.xml (Maven) or build.gradle",
      "__all__ = ['X'] → public/private access modifiers"
    ],
    async: [
      "async def fn(): → CompletableFuture<T> fn() { return supplyAsync(()->...); }",
      "await coro → future.join() (blocking) or .thenApply()",
      "asyncio.gather(*coros) → CompletableFuture.allOf(futures)",
      "concurrent.futures.ThreadPoolExecutor → Executors.newFixedThreadPool(n)",
      "threading.Lock() → synchronized or ReentrantLock"
    ],
    versionNotes: [
      "Target Java 8: Use streams for comprehensions, Optional for None, lambdas, no var keyword",
      "Target Java 11: var for local variables, HttpClient, Files.readString/writeString, String.isBlank()",
      "Target Java 17: Records for @dataclass, sealed classes for restricted inheritance, pattern matching",
      "Target Java 21: Virtual threads for async, record patterns, sequenced collections, unnamed variables _"
    ]
  },

  "javascript→typescript": {
    title: "JavaScript → TypeScript",
    stdlib: [
      "No API changes \u2014 TypeScript is a superset of JavaScript",
      "require({module}) → import module from {module} (ESM)",
      "module.exports = X → export default X",
      "exports.fn = fn → export function fn() {} or export { fn }",
      "require.resolve → import.meta.resolve (ESM)"
    ],
    patterns: [
      "function fn(a,b) → function fn(a: Type, b: Type): ReturnType",
      "const obj = {} → const obj: InterfaceName = {} (define interface)",
      "const arr = [] → const arr: Type[] = []",
      "callback(err,result) → Promise<T> with async/await",
      "any/untyped params → proper type annotations or generics",
      "== comparisons → === (strict equality)",
      "obj.dynamicProp → type with index signature: {[key:string]:Type}",
      "class with no types → add property types, method signatures",
      "JSON.parse(s) → JSON.parse(s) as Type (add type assertion)",
      "event handlers → properly typed: (e:MouseEvent)=>void",
      "switch without exhaustive → add never default for exhaustive switch",
      "null checks → strict null checks with ?. and ??"
    ],
    modules: [
      "require() → import (ESM syntax)",
      "module.exports → export default / named exports",
      ".js extension → .ts extension (compiles to .js)",
      "Add .d.ts for external untyped libs: declare module {lib}"
    ],
    async: [
      "Promise chains → async/await where cleaner",
      "Callback APIs → promisify + async/await with typed returns",
      "Promise<any> → Promise<SpecificType>"
    ],
    types: [
      "Define interfaces for ALL data shapes (params, returns, configs)",
      "Use type for unions: type Status = 'active'|'inactive'",
      "Use enum for fixed sets with semantic meaning",
      "Use generics: function first<T>(arr:T[]):T|undefined",
      "Use readonly for immutable properties",
      "Avoid 'any' \u2014 use 'unknown' + type guards",
      "Add return types to ALL functions (even void)",
      "Use Record<K,V> for key-value objects",
      "Use Partial<T>, Required<T>, Pick<T,K>, Omit<T,K>",
      "Use discriminated unions for state",
      "Use 'as const' for literal types"
    ],
    versionNotes: [
      "Target TS 4.x: Variadic tuple types, template literal types, key remapping in mapped types",
      "Target TS 5.0: Decorators (stage 3), const type parameters, enum improvements",
      "Target TS 5.6: Iterator helpers, disallowed nullish on non-nullable, strict builtin iterator checks"
    ]
  },

  "typescript→javascript": {
    title: "TypeScript → JavaScript (ES2024)",
    stdlib: [
      "No API changes \u2014 remove type system, keep runtime code",
      "import type { X } from {mod} → remove entirely (type-only)",
      "import { X, type Y } from {mod} → import { X } from {mod}"
    ],
    patterns: [
      "function fn(a:Type):RetType → function fn(a) (remove types)",
      "const x:Type = val → const x = val",
      "interface Foo { } → remove entirely (no runtime representation)",
      "type Foo = ... → remove entirely",
      "enum Dir { N='N',S='S' } → const Dir = Object.freeze({N:'N',S:'S'})",
      "x as Type → x (remove type assertion)",
      "generic <T>(arr:T[]):T → (arr) (remove generic params)",
      "readonly prop → no keyword (Object.freeze if needed)",
      "x! (non-null assertion) → x (remove !)",
      "x?.y / x ?? y → keep (valid JS)",
      "abstract class → regular class",
      "implements Interface → remove",
      "declare module/var → remove (ambient declarations)",
      "namespace Foo { } → plain object or module pattern",
      "satisfies Type → remove"
    ],
    modules: [
      ".ts extension → .js extension",
      "import type statements → remove entirely",
      "Keep all runtime import/export statements",
      ".d.ts files → delete (not needed)"
    ],
    async: [
      "async/await stays the same \u2014 valid JS",
      "Promise<T> return types → remove <T> annotation"
    ],
    versionNotes: [
      "Target ES5: Remove all TS features, convert class to prototype, arrow to function, const/let to var",
      "Target ES6: Keep classes, arrows, const/let, template literals — only remove types",
      "Target ES2020: Keep optional chaining (?.), nullish coalescing (??) — only remove types",
      "Target ES2024: Keep all modern JS features — only strip TypeScript type annotations"
    ]
  },
  // ═══ Java → Kotlin (Android-focused) ═══
  "java→kotlin": {
    title: "Java → Kotlin (Android)",
    stdlib: [
      "System.out.println(x) → println(x)",
      "String.format(fmt,args) → string templates: \u0024{expr} or fmt.format(args)",
      "Integer.parseInt(s) → s.toInt() / s.toIntOrNull()",
      "Double.parseDouble(s) → s.toDouble() / s.toDoubleOrNull()",
      "Collections.unmodifiableList(list) → list.toList() (returns read-only List)",
      "Collections.singletonList(x) → listOf(x)",
      "Arrays.asList(a,b,c) → listOf(a,b,c) or mutableListOf(a,b,c)",
      "new ArrayList<>() → mutableListOf<T>()",
      "new HashMap<>() → mutableMapOf<K,V>() or hashMapOf()",
      "new HashSet<>() → mutableSetOf<T>() or hashSetOf()",
      "map.put(k,v) → map[k] = v (operator overload)",
      "map.get(k) → map[k] (returns nullable T?)",
      "map.containsKey(k) → k in map",
      "list.get(i) → list[i]",
      "list.size() → list.size (property, no parentheses)",
      "str.length() → str.length (property)",
      "str.charAt(i) → str[i]",
      "str.substring(a,b) → str.substring(a,b) or str.slice(a..b)",
      "str.equals(other) → str == other (structural equality)",
      "str.equalsIgnoreCase(s) → str.equals(s, ignoreCase=true)",
      "obj == other (reference) → obj === other (referential equality)",
      "instanceof → is (smart cast: if (x is String) x.length works)",
      "(Type) obj cast → obj as Type / obj as? Type (safe cast)",
      "Object → Any / Any?",
      "void → Unit",
      "Void (boxed) → Nothing? or Unit",
      "final → val (immutable variable)",
      "Math.max(a,b) → maxOf(a,b) / kotlin.math.max(a,b)",
      "Math.min(a,b) → minOf(a,b)",
      "Math.abs(x) → kotlin.math.abs(x) or x.absoluteValue",
      "Thread.sleep(ms) → delay(ms) (suspend function, coroutines)",
      "System.currentTimeMillis() → System.currentTimeMillis() or Clock.System.now()",
      "Optional.of(x) → nullable type T? (no Optional needed)",
      "Optional.empty() → null",
      "optional.isPresent() → value != null",
      "optional.get() → value!! (non-null assertion) or value ?: default",
      "optional.orElse(def) → value ?: def (Elvis operator)",
      "try-with-resources → .use { } extension function",
      "synchronized(lock) {} → synchronized(lock) {} or Mutex (coroutines)",
      "Iterable.forEach(Consumer) → .forEach { } (trailing lambda)",
      "stream().map(fn) → .map { } (direct on collection, no stream())",
      "stream().filter(p) → .filter { }",
      "stream().collect(toList()) → .toList() or .toMutableList()",
      "stream().findFirst() → .firstOrNull()",
      "stream().anyMatch(p) → .any { }",
      "stream().allMatch(p) → .all { }",
      "stream().reduce() → .reduce() or .fold(initial) { }",
      "stream().flatMap() → .flatMap { }",
      "Collectors.toMap() → .associate { } or .associateBy { }",
      "Collectors.groupingBy() → .groupBy { }",
      "Collectors.joining(sep) → .joinToString(sep)"
    ],
    patterns: [
      "public class Foo {} → class Foo {} (public by default in Kotlin)",
      "private final String name; + getter → val name: String (read-only property)",
      "private String name; + getter + setter → var name: String (mutable property)",
      "POJO with getters/setters → data class Foo(val name: String, var age: Int)",
      "equals()/hashCode()/toString() boilerplate → data class (auto-generated)",
      "static final CONST = x → companion object { const val CONST = x }",
      "static method → companion object { fun method() } or top-level function",
      "static utility class → top-level functions in file (no class needed)",
      "Builder pattern → named parameters + default values: fun create(name: String, age: Int = 0)",
      "new Foo() → Foo() (no new keyword)",
      "anonymous inner class → object : Interface { } or lambda",
      "Comparator anonymous class → compareBy { it.field } or Comparator lambda",
      "enum with fields → enum class Status(val code: Int) { ACTIVE(1), INACTIVE(0) }",
      "sealed interface → sealed class/interface + data class subclasses",
      "switch-case → when (expr) { pattern -> result } (exhaustive for sealed)",
      "for (Type x : collection) → for (x in collection)",
      "for (int i=0;i<n;i++) → for (i in 0 until n) or repeat(n) { }",
      "while + iterator → for (item in iterable) or .forEach { }",
      "ternary a ? b : c → if (a) b else c (if is expression)",
      "null check if(x!=null) → x?.let { } or if (x != null) (smart cast)",
      "throw NPE on null → ?: throw or requireNotNull(x)",
      "multiple null checks → safe call chain: a?.b?.c?.d",
      "try-catch → try-catch (same, but runCatching { } also available)",
      "checked exceptions → no checked exceptions in Kotlin (@Throws for Java interop)",
      "interface + abstract methods → interface (can have default implementations)",
      "abstract class → abstract class (same concept)",
      "@Override → override keyword (mandatory, no annotation)",
      "String concatenation + → string template \u0024{expr} or \u0024var",
      "Type[] array → Array<Type> or IntArray/LongArray/etc for primitives",
      "varargs Type... → vararg param: Type",
      "Pair<A,B> → Pair(a,b) with destructuring: val (first, second) = pair",
      "Map.Entry<K,V> → destructuring in loop: for ((key, value) in map)",
      "singleton class → object Singleton { } (object declaration)",
      "lazy initialization → val x by lazy { expensive() }",
      "delegation pattern → class Foo(list: List<T>) : List<T> by list"
    ],
    android: [
      "// ═══ Android-Specific Migrations ═══",
      "Activity.findViewById(R.id.x) → ViewBinding: binding.x or Compose",
      "Fragment.onCreateView + inflate → ViewBinding or ComposeView in Fragment",
      "AsyncTask<P,Prog,R> → viewModelScope.launch { withContext(Dispatchers.IO) { } }",
      "AsyncTask.execute() → lifecycleScope.launch { } (lifecycle-aware)",
      "new Thread(runnable).start() → CoroutineScope.launch(Dispatchers.Default) { }",
      "Handler(Looper.getMainLooper()).post {} → withContext(Dispatchers.Main) { }",
      "runOnUiThread { } → withContext(Dispatchers.Main) { } inside coroutine",
      "IntentService → WorkManager for background work",
      "LocalBroadcastManager → SharedFlow / StateFlow / LiveData observer",
      "startActivityForResult() → registerForActivityResult(ActivityResultContracts.X())",
      "onActivityResult() → ActivityResultCallback in registerForActivityResult",
      "Loader/CursorLoader → ViewModel + Repository + Flow/LiveData",
      "ContentProvider direct query → Repository pattern + Room DAO",
      "SQLiteOpenHelper → Room Database + @Entity + @Dao + @Database",
      "SharedPreferences.edit().putX().apply() → DataStore<Preferences> (proto or preferences)",
      "PreferenceFragment → PreferenceFragmentCompat (AndroidX)",
      "android.support.v4.* → androidx.* (AndroidX migration)",
      "android.support.v7.* → androidx.appcompat.* / androidx.recyclerview.*",
      "AppCompatActivity (support) → AppCompatActivity (androidx.appcompat.app)",
      "RecyclerView.Adapter + ViewHolder → ListAdapter + DiffUtil (or LazyColumn in Compose)",
      "XML Layout + ConstraintLayout → Compose: Column/Row/Box + Modifier",
      "XML styles/themes → MaterialTheme + CompositionLocal in Compose",
      "XML menu + onOptionsItemSelected → TopAppBar actions in Compose",
      "XML navigation graph → Compose Navigation: NavHost + composable(route)",
      "Fragment transactions → Compose Navigation (no fragment manager)",
      "TabLayout + ViewPager2 → Compose HorizontalPager + TabRow",
      "AlertDialog.Builder → AlertDialog composable in Compose",
      "Toast.makeText() → Snackbar with SnackbarHost in Compose",
      "ProgressBar XML → CircularProgressIndicator() / LinearProgressIndicator()",
      "LiveData.observe(owner) { } → StateFlow + collectAsState() in Compose",
      "MutableLiveData.value = x → MutableStateFlow.value = x or mutableStateOf(x)",
      "ViewModel + LiveData → ViewModel + StateFlow + UiState sealed class (MVI)",
      "MVP: Presenter interface → ViewModel + UiState + UiEvent (MVVM/MVI)",
      "MVC: Activity doing everything → ViewModel + Repository + UseCase (Clean Arch)",
      "Dagger/Dagger-Android → Hilt (@HiltAndroidApp, @AndroidEntryPoint, @Inject)",
      "manual DI / ServiceLocator → Hilt modules (@Module, @Provides, @Singleton)",
      "Retrofit callback → Retrofit suspend fun + coroutines",
      "OkHttp Interceptor (Java) → OkHttp Interceptor (Kotlin, same API)",
      "Gson → Kotlin Serialization (@Serializable) or Moshi (KotlinJsonAdapterFactory)",
      "RxJava Observable/Single → Kotlin Flow / StateFlow / SharedFlow",
      "RxJava Schedulers → Coroutine Dispatchers (IO, Main, Default)",
      "RxJava CompositeDisposable → CoroutineScope cancellation (structured concurrency)",
      "EventBus → SharedFlow for events, StateFlow for state",
      "Butter Knife @BindView → ViewBinding or Compose (ButterKnife deprecated)",
      "Picasso/Glide (XML) → Coil (Compose: AsyncImage) or Glide Compose",
      "JUnit4 + Mockito → JUnit5 + MockK (Kotlin-first mocking)",
      "Espresso UI tests → Compose Testing: composeTestRule + onNodeWithText",
      "R.string.x → stringResource(R.string.x) in Compose",
      "getResources().getString() → context.getString() or stringResource() in Compose"
    ],
    modules: [
      "import com.pkg.Class; → import com.pkg.Class (same, but type alias available)",
      "static import → top-level function (no static import needed)",
      "Java source folder → Kotlin source folder (src/main/kotlin or src/main/java both work)",
      "build.gradle (Groovy) → build.gradle.kts (Kotlin DSL)",
      "apply plugin: X → plugins { id(X) } in Kotlin DSL",
      "compileSdkVersion 33 → compileSdk = 33 (Kotlin DSL property assignment)",
      "implementation X → implementation(X) in Kotlin DSL (parentheses)",
      "kapt X → ksp(X) (prefer KSP over KAPT for annotation processing)",
      "android.enableJetifier=true → remove if fully migrated to AndroidX"
    ],
    async: [
      "AsyncTask.doInBackground() → withContext(Dispatchers.IO) { }",
      "AsyncTask.onPostExecute() → result arrives in Main dispatcher (structured concurrency)",
      "AsyncTask.onProgressUpdate() → emit progress via Flow or StateFlow",
      "ExecutorService.submit() → async { } + await() in coroutine scope",
      "Future.get() (blocking) → Deferred.await() (suspending, non-blocking)",
      "CountDownLatch → suspendCancellableCoroutine or Channel",
      "Thread.sleep(ms) → delay(ms) (suspending, does not block thread)",
      "Callback<T> interface → suspend fun returning T directly",
      "Callback hell (nested) → sequential suspend calls (flat, readable)",
      "RxJava subscribeOn/observeOn → flowOn(Dispatchers.IO) / collect on Main",
      "Observable.create {} → flow { emit(value) } (cold Flow)",
      "BehaviorSubject → MutableStateFlow(initialValue)",
      "PublishSubject → MutableSharedFlow()",
      "Single.zip() → coroutineScope { async {} + async {} } then combine results",
      "RxJava .flatMap() → Flow .flatMapConcat { } / .flatMapMerge { }"
    ],
    versionNotes: [
      "Target Kotlin 1.5: Stable coroutines, value classes (@JvmInline), sealed interfaces",
      "Target Kotlin 1.6: Stable builder inference, suspend conversions, ksp improvements",
      "Target Kotlin 1.7: Opt-in annotations stable, min/maxOrNull, builder inference improvements",
      "Target Kotlin 1.8: JVM 1.8+ baseline, kotlin-reflect improvements, new JVM backend stable",
      "Target Kotlin 1.9: Kotlin/Wasm preview, ..<operator (rangeUntil), stable @ConsistentCopyVisibility, data object declarations, enum entries function",
      "Target Kotlin 2.0: K2 compiler (2x faster), stable smart casts in closures, new resolution algorithm, Compose compiler plugin bundled",
      "Target Kotlin 2.1: Guard conditions in when, multi-dollar string interpolation \u0024\u0024{}, non-local break/continue, improved K2 diagnostics"
    ]
  },
  // ═══ Kotlin → Java (Android reverse) ═══
  "kotlin→java": {
    title: "Kotlin → Java (Android)",
    stdlib: [
      "println(x) → System.out.println(x)",
      "string template \u0024{expr} → String.format() or concatenation",
      "s.toInt() / s.toIntOrNull() → Integer.parseInt(s) with try-catch",
      "listOf(a,b) → Collections.unmodifiableList(Arrays.asList(a,b)) or List.of(a,b) (Java 9+)",
      "mutableListOf<T>() → new ArrayList<T>()",
      "mutableMapOf<K,V>() → new HashMap<K,V>()",
      "map[k] = v → map.put(k, v)",
      "map[k] → map.get(k)",
      "k in map → map.containsKey(k)",
      "list.size (property) → list.size()",
      "str.length (property) → str.length()",
      "x is Type (smart cast) → instanceof + explicit cast",
      "x as Type / x as? Type → (Type) x with instanceof check",
      "Any / Any? → Object",
      "Unit → void",
      "val (immutable) → final modifier",
      "maxOf(a,b) / minOf(a,b) → Math.max(a,b) / Math.min(a,b)",
      "nullable T? → @Nullable T + Optional<T> or null checks",
      "value ?: default (Elvis) → value != null ? value : default",
      "x?.let { } → if (x != null) { /* use x */ }",
      "safe call a?.b?.c → nested null checks: if (a!=null && a.b!=null) a.b.c",
      ".use { } → try-with-resources: try (var r = resource) { }",
      ".map { } on collection → .stream().map(x -> ...).collect(toList())",
      ".filter { } → .stream().filter(x -> ...).collect(toList())",
      ".any { } → .stream().anyMatch(x -> ...)",
      ".firstOrNull() → .stream().findFirst().orElse(null)",
      ".associate { } → .stream().collect(Collectors.toMap(...))",
      ".groupBy { } → .stream().collect(Collectors.groupingBy(...))",
      ".joinToString(sep) → .stream().collect(Collectors.joining(sep))",
      "delay(ms) (suspend) → Thread.sleep(ms) or ScheduledExecutor"
    ],
    patterns: [
      "class Foo (public default) → public class Foo (explicit public)",
      "val name: String (property) → private final String name; + getName()",
      "var name: String → private String name; + getName() + setName()",
      "data class → class with equals/hashCode/toString/copy manually",
      "companion object { const val X } → public static final X",
      "companion object { fun x() } → public static method",
      "top-level function → static method in utility class",
      "object Singleton → singleton pattern (private constructor + static instance)",
      "named parameters → Builder pattern or method overloading",
      "default parameter values → method overloading: foo(), foo(a), foo(a,b)",
      "Foo() (no new) → new Foo()",
      "when (exhaustive) → switch-case (or if-else chain)",
      "for (x in collection) → for (Type x : collection)",
      "for (i in 0 until n) → for (int i=0; i<n; i++)",
      "if expression → ternary a ? b : c",
      "string template → String.format or + concatenation",
      "sealed class → abstract class + instanceof checks (or sealed interface Java 17+)",
      "enum class with properties → enum with fields + constructor",
      "override fun → @Override annotation",
      "vararg param → Type... param (varargs)",
      "destructuring val (a,b) = pair → pair.getFirst(); pair.getSecond()",
      "by lazy { } → lazy init with double-checked locking or Supplier",
      "extension function → static utility method with first param as receiver",
      "infix fun → regular method call: a.to(b) instead of a to b",
      "operator overload [] → explicit get()/set() methods"
    ],
    android: [
      "// ═══ Android Kotlin → Java reverse ═══",
      "ViewBinding binding.x → findViewById(R.id.x) or ViewBinding (Java supported)",
      "viewModelScope.launch { } → ExecutorService or AsyncTask (legacy) or RxJava",
      "lifecycleScope.launch { } → lifecycle observer + executor",
      "withContext(Dispatchers.IO) { } → Executors.newSingleThreadExecutor().submit()",
      "StateFlow.collectAsState() → LiveData.observe() in XML + ViewModel",
      "MutableStateFlow → MutableLiveData<T>",
      "Flow { emit() } → RxJava Observable.create() or LiveData",
      "Compose @Composable fun → XML layout + Fragment/Activity",
      "Compose Navigation → Navigation Component + Fragment destinations",
      "Compose LazyColumn → RecyclerView + Adapter + ViewHolder",
      "Hilt @Inject → Dagger @Inject or manual DI",
      "@AndroidEntryPoint → DaggerAppCompatActivity or manual component",
      "Kotlin Serialization → Gson or Jackson",
      "suspend fun apiCall() → Call<T> or Single<T> (RxJava)",
      "MockK mock → Mockito.mock(Class.class)"
    ],
    modules: [
      "import same as Java (fully compatible)",
      "build.gradle.kts → build.gradle (Groovy)",
      "plugins { id(X) } → apply plugin: X",
      "ksp(X) → annotationProcessor(X) or kapt(X)",
      "top-level functions file → public final class FileNameKt with static methods"
    ],
    async: [
      "coroutineScope { launch { } } → ExecutorService + Future",
      "async { } + await() → CompletableFuture (Java 8+) or Future.get()",
      "suspend fun → Callback<T> interface or CompletableFuture<T>",
      "flow { emit(x) } → Observable.create(emitter -> emitter.onNext(x))",
      "StateFlow → BehaviorSubject (RxJava) or MutableLiveData",
      "SharedFlow → PublishSubject (RxJava)",
      "flowOn(Dispatchers.IO) → .subscribeOn(Schedulers.io()).observeOn(AndroidSchedulers.mainThread())",
      "structured concurrency → manual cancellation with CompositeDisposable or executor shutdown",
      "Channel → BlockingQueue or RxJava Subject",
      "supervisorScope { } → independent try-catch per task with executor"
    ],
    versionNotes: [
      "Target Java 8: Lambdas, streams, CompletableFuture, Optional, method references, default methods",
      "Target Java 11: var (local), HttpClient, String methods (strip, isBlank, lines, repeat)",
      "Target Java 17: sealed classes, records, pattern matching instanceof, text blocks, switch expressions",
      "Target Java 21: Virtual threads, record patterns, sequenced collections, string templates (preview)"
    ]
  }
};

function getParadigmMap(sl, tl) {
  var key = sl + "→" + tl;
  return PARADIGM_MAPS[key] || null;
}

// ═══ Adaptive Capacity Calculator — analysis-driven processing profiles ═══
// The codebase analysis produces per-file processingHints that feed directly
// into token budgets, timeouts, and paradigm map depth.
function calcCapacity(complexity, lineCount, isCross, estimatedChanges, hints) {
  // hints = { deprecatedAPIs:N, asyncChanges:N, importChanges:N, structuralChanges:N,
  //           typeChanges:N, errorHandling:N, totalSignals:N }
  var h = hints || {};
  var tier = complexity === "complex" ? 3 : complexity === "moderate" ? 2 : 1;
  var crossMult = isCross ? 1.3 : 1.0;

  // Signal density: how many actual transformations per line of code
  var signalCount = h.totalSignals || estimatedChanges || 0;
  var signalDensity = signalCount ? Math.min(2.0, 1.0 + (signalCount / Math.max(1, lineCount))) : 1.0;

  // Async complexity: files migrating async models need significantly more processing
  var asyncMult = h.asyncChanges > 3 ? 1.35 : h.asyncChanges > 0 ? 1.15 : 1.0;

  // Structural complexity: class hierarchies, interfaces, inheritance changes
  var structMult = h.structuralChanges > 4 ? 1.25 : h.structuralChanges > 1 ? 1.1 : 1.0;

  // Deprecated API density: many API replacements = more output tokens
  var apiMult = h.deprecatedAPIs > 8 ? 1.3 : h.deprecatedAPIs > 3 ? 1.15 : 1.0;

  // Combined multiplier (capped)
  var combined = Math.min(2.5, crossMult * signalDensity * asyncMult * structMult * apiMult);

  // Plan capacity — scaled by tier and combined complexity
  var basePlanTk = [1200, 2200, 3200][tier - 1];
  var planTokens = Math.min(4500, Math.round(basePlanTk * combined));
  var planTimeout = [25000, 35000, 50000][tier - 1];

  // Migration capacity — the core budget, scales with everything
  var baseMigTk = [3000, 5500, 7500][tier - 1];
  var lineBonus = Math.min(3000, Math.floor(Math.max(0, lineCount - 15) / 8) * 200);
  var migTokens = Math.min(12000, Math.round((baseMigTk + lineBonus) * combined));
  var migTimeout = [40000, 55000, 75000][tier - 1];

  // Paradigm map depth: how many mappings to inject (more for complex files)
  var paradigmSlice = tier >= 3 ? 25 : tier >= 2 ? 18 : 10;
  if (h.deprecatedAPIs > 5) paradigmSlice = Math.min(30, paradigmSlice + 5);

  // Auto-promote tier if signals justify it (e.g. analysis said "simple" but 10+ API changes)
  var effectiveTier = tier;
  if (tier === 1 && signalCount > 8) effectiveTier = 2;
  if (tier === 2 && signalCount > 15 && (h.asyncChanges > 2 || h.structuralChanges > 3)) effectiveTier = 3;
  if (effectiveTier !== tier) {
    // Recalculate with promoted tier
    basePlanTk = [1200, 2200, 3200][effectiveTier - 1];
    planTokens = Math.min(4500, Math.round(basePlanTk * combined));
    planTimeout = [25000, 35000, 50000][effectiveTier - 1];
    baseMigTk = [3000, 5500, 7500][effectiveTier - 1];
    migTokens = Math.min(12000, Math.round((baseMigTk + lineBonus) * combined));
    migTimeout = [40000, 55000, 75000][effectiveTier - 1];
  }

  return {
    tier: effectiveTier,
    originalTier: tier,
    promoted: effectiveTier !== tier,
    planTokens: planTokens,
    planTimeout: planTimeout,
    migTokens: migTokens,
    migTimeout: migTimeout,
    paradigmSlice: paradigmSlice,
    label: ["simple", "moderate", "complex"][effectiveTier - 1],
    multipliers: { cross: crossMult, signal: signalDensity, async: asyncMult, struct: structMult, api: apiMult, combined: combined },
    signals: h
  };
}

function mapTargetFile(origName,origPath,srcLang,tgtLang) {
  if (srcLang===tgtLang) return {name:origName,path:origPath}; // version upgrade: keep same
  var base=origName.replace(/\.[^.]+$/,"");
  var srcExt=TARGET_EXT[srcLang]||"";
  var tgtExt=TARGET_EXT[tgtLang]||"";
  // Apply target naming conventions
  var newBase=base;
  if (tgtLang==="java"||tgtLang==="csharp"||tgtLang==="kotlin") {
    // PascalCase
    newBase=base.replace(/(^|[_-])([a-z])/g,function(_,p,c){return c.toUpperCase()}).replace(/[_-]/g,"");
  } else if (tgtLang==="python"||tgtLang==="ruby"||tgtLang==="go"||tgtLang==="rust") {
    // snake_case
    newBase=base.replace(/([A-Z])/g,function(m,c,i){return (i>0?"_":"")+c.toLowerCase()}).replace(/[- ]/g,"_").replace(/__+/g,"_");
  }
  // camelCase for JS/TS (keep as-is if already camelCase or use lowercase)
  var newName=newBase+tgtExt;
  var newPath=origPath?origPath.replace(origName,newName).replace(/\.[^.]+$/,tgtExt):newName;
  return {name:newName,path:newPath};
}

var MODELS = [
  {id:"claude-haiku-4-5-20251001",n:"Haiku 4.5",badge:"Rápido",bc:"#059669",spd:"~2s",q:3,pi:0.80,po:4.00},
  {id:"claude-sonnet-4-5-20250929",n:"Sonnet 4.5",badge:"Recomendado",bc:"#2563EB",spd:"~5s",q:4,pi:3.00,po:15.00},
  {id:"claude-opus-4-6",n:"Opus 4.6",badge:"Premium",bc:"#7c3aed",spd:"~15s",q:5,pi:15.00,po:75.00}
];

// Global mutable token tracker — callClaude writes here, UI reads via tick re-render
var _tks={i:0,o:0,calls:0,last:{i:0,o:0}};
var _activeController=null; // current fetch AbortController — cancel button aborts this
var _cancelled=false; // global cancel flag — checked before each API call

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
];

function detectLang(fn) {
  var ext = "." + fn.split(".").pop().toLowerCase();
  var keys = Object.keys(LANGS);
  for (var i = 0; i < keys.length; i++) {
    if (LANGS[keys[i]].x.indexOf(ext) >= 0) return keys[i];
  }
  return null;
}

function detectVer(lang, code) {
  if (!code || !lang) return {v:null,c:0,s:[]};
  var sg = [], ct = 0;
  var tests = [];
  if (lang === "python") {
    tests = [[/\bprint\s+["']/m,"print stmt"],[/\.iteritems/m,".iteritems"],[/\.has_key/m,".has_key"],[/\bimport\s+urllib2/m,"urllib2"],[/\bimport\s+ConfigParser/m,"ConfigParser"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"2.7"}); } }
    if (ct>0) return {v:"2.7",c:Math.min(95,60+ct*8),s:sg};
    return {v:"3.6",c:30,s:[]};
  }
  if (lang === "javascript") {
    tests = [[/\bvar\s+\w+/m,"var"],[/\.prototype\./m,"prototype"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"ES5"}); } }
    if (ct>0) return {v:"ES5",c:Math.min(95,60+ct*10),s:sg};
    return {v:"ES6/ES2015",c:40,s:[]};
  }
  if (lang === "java") {
    tests = [[/Collections\.sort/m,"Collections.sort"],[/new\s+SimpleDateFormat/m,"SimpleDateFormat"],[/new\s+Comparator/m,"Comparator"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"8"}); } }
    // Android-specific signals
    var andSig = [[/\bAsyncTask\b/m,"AsyncTask"],[/\bAppCompatActivity\b/m,"AppCompat"],[/\bfindViewById\b/m,"findViewById"],[/android\.support\./m,"support lib"],[/\bLocalBroadcastManager\b/m,"LocalBroadcast"],[/\bstartActivityForResult\b/m,"startActivityForResult"]];
    var andCt = 0;
    for (var i=0;i<andSig.length;i++) { if (andSig[i][0].test(code)) { andCt++; sg.push({t:andSig[i][1],i:"Android"}); } }
    return {v:"8",c:ct||andCt?Math.min(95,55+(ct+andCt)*7):40,s:sg};
  }
  if (lang === "csharp") {
    tests = [[/System\.Web/m,"System.Web"],[/ConfigurationManager/m,"ConfigMgr"],[/\blog4net\b/m,"log4net"],[/BeginInvoke/m,"BeginInvoke"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:".NET FW"}); } }
    if (ct>0) return {v:".NET Framework 4.8",c:Math.min(95,60+ct*8),s:sg};
    return {v:".NET Framework 4.8",c:35,s:[]};
  }
  if (lang === "go") {
    tests = [[/\bgo\s+func/m,"goroutine"],[/\bchan\s/m,"channel"],[/\bany\b/m,"any type"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"1.18+"}); } }
    if (/\bgo\s+1\./m.test(code)) return {v:"1.18",c:50,s:sg};
    return {v:ct>0?"1.21":"1.18",c:ct?Math.min(80,50+ct*10):30,s:sg};
  }
  if (lang === "rust") {
    tests = [[/\basync\s+fn/m,"async fn"],[/\bimpl\b/m,"impl"],[/\blet\s+mut\b/m,"mut"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"2021"}); } }
    return {v:ct>0?"2021":"2018",c:ct?Math.min(80,50+ct*10):30,s:sg};
  }
  if (lang === "php") {
    tests = [[/\bfn\s*\(/m,"arrow fn"],[/\?\->/m,"nullsafe"],[/\bmatch\s*\(/m,"match"],[/\benum\s+/m,"enum"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"8.0+"}); } }
    if (ct>0) return {v:"8.0",c:Math.min(85,55+ct*8),s:sg};
    return {v:"7.4",c:40,s:[]};
  }
  if (lang === "ruby") {
    tests = [[/\bputs\b/m,"puts"],[/\battr_accessor\b/m,"attr"],[/\bdo\s*\|/m,"block"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"2.7+"}); } }
    return {v:ct?"3.0":"2.7",c:ct?Math.min(75,45+ct*10):30,s:sg};
  }
  if (lang === "kotlin") {
    // Kotlin 2.0+ signals (K2 compiler features)
    var k2tests = [[/\bvalue\s+class/m,"value class"],[/\bContext\s*Receivers?/m,"context receivers"],[/\.\.<\b/m,"rangeUntil ..<"]];
    for (var i=0;i<k2tests.length;i++) { if (k2tests[i][0].test(code)) { ct++; sg.push({t:k2tests[i][1],i:"2.0+"}); } }
    if (ct>0) return {v:"2.0",c:Math.min(90,60+ct*10),s:sg};
    // Kotlin 1.8-1.9 signals
    var k19tests = [[/\bdata\s+object/m,"data object"],[/\.entries\b/m,"enum entries"]];
    for (var i=0;i<k19tests.length;i++) { if (k19tests[i][0].test(code)) { ct++; sg.push({t:k19tests[i][1],i:"1.9"}); } }
    if (ct>0) return {v:"1.9",c:Math.min(85,55+ct*10),s:sg};
    // Kotlin 1.5-1.7 / general signals
    tests = [[/\bdata\s+class/m,"data class"],[/\bsealed\s+(class|interface)/m,"sealed"],[/\bsuspend\s+fun/m,"suspend fun"],[/\bcompanion\s+object/m,"companion"],[/\bwhen\s*\x28/m,"when expr"],[/\bby\s+lazy/m,"lazy delegate"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"1.5+"}); } }
    // Android-specific signals
    var andTests = [[/\bAsyncTask\b/m,"AsyncTask"],[/\bLocalBroadcastManager\b/m,"LocalBroadcast"],[/\bstartActivityForResult\b/m,"startActivityForResult"],[/\bfindViewById\b/m,"findViewById"],[/android\.support\./m,"support library"]];
    for (var i=0;i<andTests.length;i++) { if (andTests[i][0].test(code)) { ct++; sg.push({t:andTests[i][1],i:"Android legacy"}); } }
    if (ct>=4) return {v:"1.5",c:Math.min(90,55+ct*7),s:sg};
    if (ct>0) return {v:"1.7",c:Math.min(80,45+ct*8),s:sg};
    return {v:"1.7",c:35,s:sg};
  }
  return {v:null,c:0,s:[]};
}

function doAnalyze(code, lang, tv) {
  var lg = [], lines = code.split("\n"), lc = lines.length;
  lines.forEach(function(l,i) {
    var n = i+1;
    if (lang==="python") {
      if (/^\s*print\s+[^\x28]/.test(l) && !/^\s*#/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": print sin paréntesis"});
      if (/\.iteritems/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": .iteritems() usar .items()"});
      if (/\.has_key/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": .has_key() usar in"});
      if (/\bimport\s+urllib2/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": urllib2 usar urllib.request"});
      if (/\bimport\s+ConfigParser/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": ConfigParser usar configparser"});
      if (/\bbasestring\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": basestring usar str"});
    }
    if (lang==="javascript") {
      if (/\bvar\s+\w+/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": var usar const/let"});
      if (/\.prototype\./.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": prototype usar class"});
    }
    if (lang==="java") {
      if (/Collections\.sort/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": Collections.sort usar list.sort()"});
      if (/new\s+SimpleDateFormat/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": SimpleDateFormat usar java.time"});
      if (/new\s+Comparator/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": Comparator usar lambda"});
    }
    if (lang==="csharp") {
      var nc = tv && (tv.indexOf(".NET 6")>=0||tv.indexOf(".NET 8")>=0||tv.indexOf("Core")>=0);
      if (/System\.Web/.test(l) && nc) lg.push({tp:"error",tx:"Ln "+n+": System.Web no existe en .NET Core"});
      if (/ConfigurationManager/.test(l) && nc) lg.push({tp:"error",tx:"Ln "+n+": ConfigManager usar IConfiguration"});
      if (/BeginInvoke/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": BeginInvoke usar async/await"});
      if (/log4net/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": log4net usar ILogger"});
    }
    if (lang==="kotlin"||lang==="java") {
      // Android deprecated APIs
      if (/\bAsyncTask\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": AsyncTask deprecated → Coroutines + viewModelScope"});
      if (/\bLocalBroadcastManager\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": LocalBroadcastManager deprecated → SharedFlow/LiveData"});
      if (/\bstartActivityForResult\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": startActivityForResult deprecated → ActivityResultContracts"});
      if (/\bonActivityResult\b/.test(l)&&!/super/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": onActivityResult deprecated → registerForActivityResult"});
      if (/\bIntentService\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": IntentService deprecated → WorkManager"});
      if (/android\.support\./.test(l)) lg.push({tp:"error",tx:"Ln "+n+": android.support.* → AndroidX (androidx.*)"});
      if (/\bfindViewById\b/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": findViewById → ViewBinding o Compose"});
      if (/\bButterKnife\b|\bBindView\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": ButterKnife deprecated → ViewBinding"});
      if (/new\s+Thread\b/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": new Thread() → Coroutines o ExecutorService"});
      if (/\bHandler\s*\x28/.test(l)&&/Looper/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": Handler+Looper → withContext(Dispatchers.Main)"});
      if (/\bArrayAdapter\b/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": ArrayAdapter/ListView → RecyclerView+ListAdapter o LazyColumn"});
      if (/\bSharedPreferences\b/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": SharedPreferences → DataStore (Jetpack)"});
      if (/\bEventBus\b/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": EventBus → SharedFlow/StateFlow"});
      // Kotlin-specific modernization
      if (lang==="kotlin") {
        if (/\.subscribe\s*\x28/.test(l)&&!/\/\//.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": RxJava .subscribe() → Flow .collect { }"});
        if (/\bGlobalScope\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": GlobalScope → viewModelScope/lifecycleScope (structured concurrency)"});
        if (/\brunBlocking\b/.test(l)&&!/test/i.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": runBlocking en producción → suspend fun"});
      }
    }
  });
  var e = lg.filter(function(x){return x.tp==="error"}).length;
  var w = lg.filter(function(x){return x.tp==="warn"}).length;
  return {ok:e===0,logs:lg,stats:{e:e,w:w,l:lc}};
}

async function doDeepAnalysis(origFiles,migratedResults,sl,sv,tl,tv,mid,lang) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var lnames={es:"Español",en:"English",pt:"Português"};
  var ln=lnames[lang]||"Español";
  var origManifest=origFiles.map(function(f){return "### "+f.name+(f.path?" ("+f.path+")":"")+"\n```\n"+f.content+"\n```"}).join("\n\n");
  var migManifest=migratedResults.map(function(r){var dn=r.targetName||r.name;return "### "+dn+(r.targetPath?" ("+r.targetPath+")":"")+"\n```\n"+r.migrated+"\n```"}).join("\n\n");
  var sys="You are a STRICT senior architect reviewing a "+sn+" "+sv+"→"+tn+" "+tv+" migration ("+migratedResults.length+" files). Respond in "+ln+".\n\nAnalyze 8 layers INDEPENDENTLY with concrete findings per file:\n1) Architecture (15%) 2) Cross-file deps (10%) 3) Async model (15%) 4) Security (20%) 5) Error handling (10%) 6) Types/contracts (10%) 7) Data flow (10%) 8) API preservation (10%)\n\n"+SCORING_RUBRIC+"\n\nScore each layer first. Final score = weighted average. Show math.\n\nRespond ONLY JSON:\n{\"score\":0-100,\"scoreBreakdown\":\"weighted math\",\"layers\":[{\"name\":\"...\",\"score\":0-100,\"status\":\"pass|warn|fail\",\"detail\":\"1-2 sentences\"}],\"critical\":[{\"files\":[\"file.ext\"],\"category\":\"security|architecture|async|types|dataflow\",\"msg\":\"...\",\"fix\":\"fix\"}],\"improvements\":[{\"files\":[\"file.ext\"],\"category\":\"...\",\"msg\":\"...\",\"suggestion\":\"...\"}],\"strengths\":[\"...\"],\"summary\":\"2-3 sentences\"}";
  var usr="ORIGINAL CODEBASE ("+sn+" "+sv+"):\n"+origManifest+"\n\n===\n\nMIGRATED CODEBASE ("+tn+" "+tv+"):\n"+migManifest+"\n\nDeep SYSTEM-LEVEL analysis. Score each layer independently, compute weighted average. Be strict — typical migration scores 65-80. ALL text in "+ln+". Respond ONLY JSON.";
  try {
    var txt=await callClaude(sys,usr,mid,3000,{timeout:60000});
    var cl=safeParseJSON(txt);
    if(!cl)throw new Error("Invalid JSON response");
    // Same JS-side recalculation as integration check
    if (cl.layers&&cl.layers.length>=6) {
      var weights={architecture:15,"cross-file deps":10,"cross-file":10,async:15,"async model":15,security:20,errors:10,"error handling":10,types:10,"types/contracts":10,dataflow:10,"data flow":10,idiomatic:10,"api preservation":10,imports:10};
      var wSum=0, wTotal=0;
      cl.layers.forEach(function(ly){
        var key=(ly.name||"").toLowerCase().replace(/[^a-z /\-]/g,"");
        var w=weights[key]||10;
        wSum+=(ly.score||0)*w;
        wTotal+=w;
      });
      var derived=wTotal>0?Math.round(wSum/wTotal):cl.score;
      if (Math.abs(derived-(cl.score||0))>8) {
        cl.scoreBreakdown=(cl.scoreBreakdown||"")+" [Recalculated: model said "+cl.score+", layers give "+derived+"]";
        cl.score=derived;
      }
    }
    return {ok:true,analysis:cl};
  } catch(e) { return {ok:false,error:e.message}; }
}


// ═══ Android Pre-Migration Report Generator ═══
async function generateAndroidReport(files, sl, sv, tl, tv, mid, lang) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var lnames={es:"Español",en:"English",pt:"Português"};
  var ln=lnames[lang]||"Español";
  var codeManifest=files.map(function(f){return "### "+f.name+(f.path?" ("+f.path+")":"")+"\n```\n"+f.content+"\n```"}).join("\n\n");
  
  var sys="You are a Senior Android Architect performing a comprehensive pre-migration analysis of an Android codebase. The migration is from "+sn+" "+sv+" to "+tn+" "+tv+". Respond in "+ln+".\n\nAnalyze the codebase across these dimensions:\n\n1. **DEPRECATED APIs**: List every deprecated Android API found, its replacement, and migration effort\n2. **ARCHITECTURE**: Current pattern (MVC/MVP/MVVM/none) and target architecture recommendation\n3. **UI FRAMEWORK**: XML Views vs Compose readiness, migration path\n4. **ASYNC MODEL**: AsyncTask/Thread/RxJava/Handler patterns → Coroutines migration\n5. **DEPENDENCY INJECTION**: Current DI approach → Hilt recommendation\n6. **DATA LAYER**: DB/SharedPrefs/Network patterns → Room/DataStore/Retrofit\n7. **SECURITY**: Hardcoded secrets, unvalidated inputs, insecure network calls\n8. **MODULARIZATION**: Current module structure, recommended module boundaries\n9. **LIBRARY UPDATES**: Dependencies that need updating with recommended versions\n10. **GRADLE/BUILD**: Build config modernization (Kotlin DSL, version catalogs)\n\nFor each finding, include:\n- File and line reference\n- Current pattern\n- Target pattern\n- Impact: critical/major/minor\n- Effort: high/medium/low\n- Priority order for migration\n\nProduce a REFACTORING PLAN with ordered phases:\n- Phase 1: Foundation (AndroidX, DI setup, base classes)\n- Phase 2: Architecture (ViewModel, Repository, UseCases)\n- Phase 3: Async (Coroutines migration)\n- Phase 4: UI (Compose migration for key screens)\n- Phase 5: Testing & Polish\n\nRespond ONLY valid JSON:\n{\"summary\":\"2-3 paragraph executive summary\",\"architecture\":{\"current\":\"...\",\"target\":\"...\",\"effort\":\"high|medium|low\"},\"breaches\":[{\"category\":\"deprecated|architecture|security|async|ui|di|data|gradle\",\"file\":\"...\",\"line\":0,\"current\":\"what exists now\",\"target\":\"what it should become\",\"impact\":\"critical|major|minor\",\"effort\":\"high|medium|low\"}],\"refactorPlan\":[{\"phase\":1,\"name\":\"...\",\"description\":\"...\",\"tasks\":[\"...\"],\"estimatedEffort\":\"...\"}],\"libraryUpdates\":[{\"current\":\"lib:version\",\"recommended\":\"lib:newversion\",\"breaking\":true|false}],\"modularization\":{\"current\":\"...\",\"recommended\":[{\"module\":\"...\",\"contents\":[\"...\"]}]},\"riskScore\":0-100,\"readinessScore\":0-100}";
  
  var usr="ANDROID CODEBASE ("+sn+" "+sv+"):\n"+codeManifest+"\n\nPerform EXHAUSTIVE pre-migration analysis. Be specific with file:line references. ALL text in "+ln+". Respond ONLY JSON.";
  
  try {
    var txt=await callClaude(sys,usr,mid,4000,{timeout:75000});
    var cl=safeParseJSON(txt);
    if(!cl)throw new Error("Invalid JSON response");
    return {ok:true,report:cl};
  } catch(e) { return {ok:false,error:e.message}; }
}

function generateReportHTML(report, files, sl, sv, tl, tv, t) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var r=report;
  var impactColor=function(imp){return imp==="critical"?"#dc2626":imp==="major"?"#d97706":"#059669"};
  var html="<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>MigraOps - "+t.andReport+"</title>";
  html+="<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a;padding:40px}";
  html+=".container{max-width:900px;margin:0 auto}.header{background:linear-gradient(135deg,#0C1E3F,#2563EB);color:#fff;padding:30px;border-radius:12px;margin-bottom:24px}";
  html+="h1{font-size:24px;margin-bottom:8px}h2{font-size:18px;color:#0C1E3F;margin:20px 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:6px}h3{font-size:14px;margin:12px 0 6px}";
  html+=".card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.04)}";
  html+=".badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700}";
  html+=".badge-critical{background:#fef2f2;color:#dc2626}.badge-major{background:#fffbeb;color:#d97706}.badge-minor{background:#f0fdf4;color:#059669}";
  html+=".grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}";
  html+=".score-circle{width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff}";
  html+=".phase{border-left:3px solid #2563EB;padding-left:12px;margin-bottom:12px}";
  html+=".breach-row{padding:8px;border-bottom:1px solid #f1f5f9;font-size:13px}";
  html+=".footer{text-align:center;margin-top:30px;font-size:11px;color:#94a3b8}";
  html+="table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f8fafc;text-align:left;padding:6px 8px;font-weight:700}td{padding:6px 8px;border-bottom:1px solid #f1f5f9}";
  html+="</style></head><body><div class=\"container\">";
  
  // Header
  html+="<div class=\"header\"><h1>\ud83d\udcf1 MigraOps — "+t.andReport+"</h1>";
  html+="<p>"+sn+" "+sv+" → "+tn+" "+tv+" | "+files.length+" archivos | "+(new Date()).toLocaleDateString()+"</p></div>";
  
  // Scores
  html+="<div class=\"grid\"><div class=\"card\"><h3>"+t.andBreach+" Risk Score</h3>";
  html+="<div class=\"score-circle\" style=\"background:"+(r.riskScore>70?"#dc2626":r.riskScore>40?"#d97706":"#059669")+"\">"+(r.riskScore||0)+"</div></div>";
  html+="<div class=\"card\"><h3>Readiness Score</h3>";
  html+="<div class=\"score-circle\" style=\"background:"+(r.readinessScore>=70?"#059669":r.readinessScore>=40?"#d97706":"#dc2626")+"\">"+(r.readinessScore||0)+"</div></div></div>";
  
  // Summary
  if(r.summary){html+="<div class=\"card\"><h2>"+t.summary+"</h2><p style=\"font-size:13px;line-height:1.6\">"+r.summary+"</p></div>";}
  
  // Architecture
  if(r.architecture){html+="<div class=\"card\"><h2>"+t.andArch+"</h2><div class=\"grid\"><div><h3>"+t.andPattern+"</h3><p>"+r.architecture.current+"</p></div><div><h3>"+t.andTarget+"</h3><p>"+r.architecture.target+"</p></div></div></div>";}
  
  // Breaches table
  if(r.breaches&&r.breaches.length){
    html+="<div class=\"card\"><h2>"+t.andBreach+" ("+r.breaches.length+")</h2><table><tr><th>"+t.andPriority+"</th><th>Archivo</th><th>"+t.andPattern+"</th><th>"+t.andTarget+"</th><th>"+t.andImpact+"</th></tr>";
    r.breaches.forEach(function(b){
      html+="<tr><td><span class=\"badge badge-"+b.impact+"\">"+b.impact+"</span></td><td style=\"font-family:monospace\">"+b.file+(b.line?":"+b.line:"")+"</td><td>"+b.current+"</td><td>"+b.target+"</td><td>"+b.effort+"</td></tr>";
    });
    html+="</table></div>";
  }
  
  // Refactor Plan
  if(r.refactorPlan&&r.refactorPlan.length){
    html+="<div class=\"card\"><h2>"+t.andRefactor+"</h2>";
    r.refactorPlan.forEach(function(p){
      html+="<div class=\"phase\"><h3>Fase "+p.phase+": "+p.name+"</h3><p style=\"font-size:12px;color:#475569\">"+p.description+"</p><ul style=\"font-size:12px;margin:6px 0 6px 16px\">";
      if(p.tasks)p.tasks.forEach(function(t2){html+="<li>"+t2+"</li>"});
      html+="</ul><p style=\"font-size:11px;color:#94a3b8\">"+t.andEffort+": "+p.estimatedEffort+"</p></div>";
    });
    html+="</div>";
  }
  
  // Library Updates
  if(r.libraryUpdates&&r.libraryUpdates.length){
    html+="<div class=\"card\"><h2>"+t.andLibs+"</h2><table><tr><th>Actual</th><th>Recomendado</th><th>Breaking</th></tr>";
    r.libraryUpdates.forEach(function(l){
      html+="<tr><td style=\"font-family:monospace\">"+l.current+"</td><td style=\"font-family:monospace\">"+l.recommended+"</td><td>"+(l.breaking?"\u26a0\ufe0f Si":"\u2705 No")+"</td></tr>";
    });
    html+="</table></div>";
  }
  
  // Modularization
  if(r.modularization){
    html+="<div class=\"card\"><h2>"+t.andModular+"</h2>";
    html+="<h3>Actual: "+r.modularization.current+"</h3>";
    if(r.modularization.recommended){
      html+="<div class=\"grid\">";
      r.modularization.recommended.forEach(function(m){
        html+="<div style=\"padding:8px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0\"><b>"+m.module+"</b><ul style=\"font-size:11px;margin:4px 0 0 12px\">";
        if(m.contents)m.contents.forEach(function(c){html+="<li>"+c+"</li>"});
        html+="</ul></div>";
      });
      html+="</div>";
    }
    html+="</div>";
  }
  
  html+="<div class=\"footer\">MigraOps v4.4 — SII Group Chile | Generado: "+(new Date()).toISOString()+"</div>";
  html+="</div></body></html>";
  return html;
}

async function callClaude(sys,usr,mid,mt,opts) {
  var o=opts||{};
  if (_cancelled) throw new Error("Migration cancelled");
  var maxRetries=o.retries!==undefined?o.retries:0;
  var timeout=o.timeout||60000; // 60s default — no call should hang
  for (var attempt=0;attempt<=maxRetries;attempt++) {
    if (_cancelled) throw new Error("Migration cancelled");
    var controller=new AbortController();
    _activeController=controller; // expose so cancel button can abort
    var timer=setTimeout(function(){controller.abort()},timeout);
    try {
      var r = await fetch("/api/migrate",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:mid||"claude-sonnet-4-20250514",max_tokens:mt||4000,system:sys,messages:[{role:"user",content:usr}]}),
        signal:controller.signal
      });
      clearTimeout(timer);
      _activeController=null;
      if (_cancelled) throw new Error("Migration cancelled");
      if (r.status===529||r.status===503) { if(attempt<maxRetries){await new Promise(function(ok){setTimeout(ok,2000)});continue;} throw new Error("API overloaded ("+r.status+")"); }
      if (!r.ok) throw new Error("API "+r.status);
      var d = await r.json();
      if (d.usage) { _tks.i+=(d.usage.input_tokens||0); _tks.o+=(d.usage.output_tokens||0); _tks.calls++; _tks.last={i:d.usage.input_tokens||0,o:d.usage.output_tokens||0}; }
      return d.content.map(function(b){return b.type==="text"?b.text:""}).filter(Boolean).join("\n");
    } catch(e) {
      clearTimeout(timer);
      _activeController=null;
      if (_cancelled) throw new Error("Migration cancelled");
      if (e.name==="AbortError") {
        if (attempt<maxRetries) continue;
        throw new Error("Timeout after "+Math.round(timeout/1000)+"s");
      }
      if (attempt<maxRetries) continue;
      throw e;
    }
  }
  throw new Error("Max retries exceeded");
}


// ═══ QA SANDBOX TESTING SYSTEM (v4.5) ═══
// Generates test cases via Claude, translates functions to JS, executes in browser sandbox

async function generateTestSuite(files, lang, ver, mid) {
  var ln=(LANGS[lang]||{}).n||lang;
  var manifest=files.map(function(f){return "### "+f.name+"\n```\n"+f.content+"\n```"}).join("\n\n");

  // Language-specific hints for better JS translations
  var langHints="";
  if(lang==="python") langHints="\nPython-specific: dict→object literal, list→array, tuple→array, None→null, True/False→true/false, string slicing→.slice(), enumerate→.forEach with index, list comprehension→.map/.filter, range()→Array.from({length:n},(_,i)=>i), isinstance→typeof/instanceof, **kwargs→object destructuring.";
  else if(lang==="java") langHints="\nJava-specific: ArrayList→array, HashMap→object literal, .get()→[key], .put()→[key]=val, .size()→.length, Optional→nullable, Stream→array methods (.map/.filter/.reduce), StringBuilder→string concat, Collections.sort→.sort(), System.out.println→console.log, static methods→regular functions.";
  else if(lang==="kotlin") langHints="\nKotlin-specific: listOf→array, mutableListOf→array, mapOf→object, data class→object literal, when→switch/if-else, ?.let{}→if(x!=null), ?:→||, companion object→static, suspend fun→async function, Flow→async generator or callback, sealed class→union types with type field.";
  else if(lang==="csharp") langHints="\nC#-specific: List<T>→array, Dictionary→object, LINQ .Where→.filter, .Select→.map, .FirstOrDefault→.find, string.Format→template literal, DateTime→new Date(), StringBuilder→string concat, ConfigurationManager→object literal mock, async Task→async function, IDisposable→try-finally.";
  else if(lang==="typescript") langHints="\nTypeScript-specific: interfaces→plain objects, generic types→dynamic, enum→object with const values, type narrowing→typeof checks, optional chaining ?. → same in JS, nullish coalescing ?? → same in JS.";

  var sys="You are a Senior QA Engineer. Analyze this "+ln+" "+ver+" codebase and generate a comprehensive test suite.\n\nFor EACH testable function/method in the codebase:\n1) Identify the function name, file, and what it does\n2) Design 3-5 test cases with concrete inputs and expected outputs\n3) Cover: happy path, edge cases (empty/null/zero/empty string), error cases, boundary values\n4) Classify each test: unit | integration | api\n5) CRITICAL: Write a JavaScript equivalent of EACH function that preserves the EXACT same logic."+langHints+"\n\nIMPORTANT RULES for JS translations:\n- Functions must be pure and self-contained (no external imports, no require, no DOM)\n- Use standard JS only — must work with new Function()\n- Wrap everything so it returns the function: 'return function(arg1, arg2){...}'\n- For classes with multiple methods: 'return function(methodName, ...args){ var state={...}; if(methodName===\"x\") return ...; }'\n- Mock ALL external calls with predictable returns:\n  * DB queries: return [{id:1,name:\"test\"}] \n  * HTTP GET: return {status:200,data:[{id:1}]}\n  * HTTP POST: return {status:201,id:\"new-1\"}\n  * Filesystem read: return \"mock file content\"\n  * Console/logging: no-op (return undefined)\n  * Current date/time: return fixed \"2024-01-15T10:00:00Z\"\n- Handle null/undefined gracefully — don't crash on bad input\n- For array/object returns, the JS output must be JSON-serializable\n\nRespond ONLY valid JSON:\n{\"tests\":[{\"id\":\"t1\",\"name\":\"descriptive test name\",\"file\":\"filename\",\"function\":\"functionName\",\"type\":\"unit|integration|api\",\"jsFunction\":\"return function(input){ ... }\",\"cases\":[{\"input\":\"JSON-serializable input\",\"expected\":\"JSON-serializable expected output\",\"label\":\"what this tests\"}]}],\"summary\":{\"totalTests\":0,\"totalCases\":0,\"coverage\":{\"files\":0,\"functions\":0},\"types\":{\"unit\":0,\"integration\":0,\"api\":0}}}";

  var usr="Analyze this "+ln+" "+ver+" codebase and generate a test suite with executable JS translations:\n\n"+manifest+"\n\nGenerate 3-5 test cases per function. JS translations MUST be executable with new Function(). Include edge cases (null, empty, zero). JSON only.";

  try {
    var txt=await callClaude(sys,usr,mid,8000,{timeout:75000});
    var parsed=safeParseJSON(txt);
    if(!parsed||!parsed.tests)throw new Error("Invalid test suite JSON");
    return {ok:true,suite:parsed};
  } catch(e) { return {ok:false,error:e.message}; }
}

function executeSandbox(jsCode, testCases) {
  // Execute a JS function translation against test cases in a safe sandbox
  var results=[];
  var fn=null;
  var MAX_TEST_MS=3000; // 3s max per test case — prevents infinite loops

  // Compile the function
  try {
    // Wrap in strict mode for safer execution
    fn=new Function('"use strict";\n'+jsCode)();
    if(typeof fn!=="function") throw new Error("JS translation did not return a function");
  } catch(compileErr) {
    testCases.forEach(function(tc){
      results.push({input:tc.input,expected:tc.expected,actual:null,pass:false,skipped:true,error:"Compile: "+compileErr.message,label:tc.label,timeMs:0});
    });
    return results;
  }

  // Execute each test case with timeout protection
  testCases.forEach(function(tc) {
    var startMs=performance.now();
    try {
      // Parse input safely
      var input;
      try { input=typeof tc.input==="string"?JSON.parse(tc.input):tc.input; }
      catch(parseErr) { input=tc.input; }

      // Execute with implicit timeout check (can't truly timeout sync JS, but we track time)
      var actual=Array.isArray(input)?fn.apply(null,input):fn(input);
      var elapsed=Math.round((performance.now()-startMs)*100)/100;

      // If it took too long, flag it
      if(elapsed>MAX_TEST_MS) {
        results.push({input:tc.input,expected:tc.expected,actual:actual,pass:false,skipped:false,error:"Slow: "+elapsed+"ms (limit "+MAX_TEST_MS+"ms)",label:tc.label,timeMs:elapsed});
        return;
      }

      // Parse expected safely
      var expected;
      try { expected=typeof tc.expected==="string"?JSON.parse(tc.expected):tc.expected; }
      catch(parseErr) { expected=tc.expected; }

      // Deep compare with tolerance for floating point
      var actualStr=JSON.stringify(actual);
      var expectedStr=JSON.stringify(expected);
      var pass=actualStr===expectedStr;

      // Fuzzy match for numbers with floating point tolerance
      if(!pass&&typeof actual==="number"&&typeof expected==="number") {
        pass=Math.abs(actual-expected)<0.0001;
      }

      // Fuzzy match for strings (trim whitespace)
      if(!pass&&typeof actual==="string"&&typeof expected==="string") {
        pass=actual.trim()===expected.trim();
      }

      results.push({input:tc.input,expected:tc.expected,actual:actual,actualStr:actualStr,expectedStr:expectedStr,pass:pass,skipped:false,error:null,label:tc.label,timeMs:elapsed});
    } catch(runErr) {
      var elapsed2=Math.round((performance.now()-startMs)*100)/100;
      results.push({input:tc.input,expected:tc.expected,actual:null,pass:false,skipped:false,error:runErr.message,label:tc.label,timeMs:elapsed2});
    }
  });
  return results;
}

function runTestSuite(suite) {
  // Run all tests in the suite and return structured results
  if(!suite||!suite.tests)return {tests:[],summary:{passed:0,failed:0,skipped:0,total:0,timeMs:0}};

  var allResults=[];
  var totalTime=0;
  var passed=0,failed=0,skipped=0;

  suite.tests.forEach(function(test) {
    var caseResults=executeSandbox(test.jsFunction,test.cases||[]);
    var testPassed=caseResults.every(function(r){return r.pass||r.skipped});
    var testSkipped=caseResults.every(function(r){return r.skipped});
    var testTime=caseResults.reduce(function(s,r){return s+r.timeMs},0);
    totalTime+=testTime;

    caseResults.forEach(function(r){
      if(r.skipped)skipped++;
      else if(r.pass)passed++;
      else failed++;
    });

    allResults.push({
      id:test.id,
      name:test.name,
      file:test.file,
      func:test.function,
      type:test.type,
      passed:testPassed,
      skipped:testSkipped,
      cases:caseResults,
      timeMs:Math.round(testTime*100)/100
    });
  });

  return {
    tests:allResults,
    summary:{passed:passed,failed:failed,skipped:skipped,total:passed+failed+skipped,timeMs:Math.round(totalTime*100)/100},
    timestamp:new Date().toISOString()
  };
}

async function generateAndRunQA(files, lang, ver, mid, phase, existingSuite) {
  // phase: "pre" or "post"
  // If pre: generate suite + run. If post: reuse existing suite + run on migrated code
  var suite=existingSuite;
  if(!suite) {
    var genResult=await generateTestSuite(files,lang,ver,mid);
    if(!genResult.ok) return {ok:false,error:genResult.error};
    suite=genResult.suite;
  }
  var results=runTestSuite(suite);
  return {ok:true,suite:suite,results:results,phase:phase};
}


async function runVirtualQA(files, lang, ver, mid, phase) {
  // Claude "mentally executes" the code — traces through each function predicting exact outputs
  var ln=(LANGS[lang]||{}).n||lang;
  var manifest=files.map(function(f){return "### "+f.name+"\n```\n"+f.content+"\n```"}).join("\n\n");

  var phaseCtx=phase==="post"?"\n\nNOTE: This is the POST-MIGRATION version of the code ("+ln+" "+ver+"). The original code was in a different language. Focus on whether the MIGRATED code produces correct outputs — trace the actual "+ln+" logic, not what you think the original did.":"";

  var sys="You are a Senior QA Engineer performing MENTAL EXECUTION of "+ln+" "+ver+" code. You must trace through each function step-by-step and predict the EXACT output for given inputs."+phaseCtx+"\n\nFor EACH public function/method in the codebase:\n1) Identify the function, its file, params, and return type\n2) Design 3-5 test scenarios covering: happy path, edge cases (null/empty/zero), error conditions, boundary values\n3) TRACE through the code line by line for each input — show your reasoning\n4) Predict the EXACT return value (not approximate — exact JSON-serializable value)\n5) Identify side effects (DB writes, HTTP calls, file I/O, console output, state mutations)\n6) Rate your confidence: high (pure logic, deterministic), medium (some external deps), low (heavy I/O, non-deterministic)\n7) Note any potential bugs, edge cases, or error conditions you find during tracing\n\nCRITICAL RULES:\n- For DB/HTTP/filesystem operations: predict based on mock scenarios (empty DB returns [], HTTP 200 returns {status:\"ok\"}, file exists with sample content)\n- For randomness/timestamps: note as non-deterministic but predict a representative value\n- Be PRECISE: string outputs include exact formatting, numbers include exact decimals, arrays include exact elements\n- Trace EVERY code path the input takes — don't skip steps\n- For error cases: predict the exact exception type and message\n- Count function arguments carefully — don't add or remove params\n\nRespond ONLY valid JSON:\n{\"functions\":[{\"name\":\"functionName\",\"file\":\"filename\",\"description\":\"what it does\",\"params\":\"param types and meaning\",\"returnType\":\"return type\",\"tests\":[{\"input\":\"JSON input\",\"trace\":\"step-by-step execution trace (3-5 key steps)\",\"predicted\":\"exact predicted output as JSON\",\"sideEffects\":[\"list of side effects\"],\"confidence\":\"high|medium|low\",\"label\":\"what this tests\",\"bugs\":\"any bugs found or null\"}]}],\"summary\":{\"totalFunctions\":0,\"totalTests\":0,\"highConfidence\":0,\"mediumConfidence\":0,\"lowConfidence\":0,\"bugsFound\":0}}";

  var usr="Mentally execute this "+ln+" "+ver+" codebase ("+phase+" migration). Trace through EVERY function with concrete inputs and predict exact outputs:\n\n"+manifest+"\n\nTrace each function step-by-step. Predict exact return values. Include edge cases. JSON only.";

  try {
    var txt=await callClaude(sys,usr,mid,8000,{timeout:75000});
    var parsed=safeParseJSON(txt);
    if(!parsed||!parsed.functions)throw new Error("Invalid virtual QA JSON");
    parsed.phase=phase;
    parsed.timestamp=new Date().toISOString();
    return {ok:true,virtual:parsed};
  } catch(e) { return {ok:false,error:e.message}; }
}

function compareVirtualQA(preV, postV) {
  // Compare virtual QA results pre vs post migration
  if(!preV||!postV||!preV.functions||!postV.functions) return null;
  var comparisons=[];
  var equivalent=0,different=0,missing=0;

  preV.functions.forEach(function(preF) {
    // Find matching function in post (by name, fuzzy)
    var postF=postV.functions.find(function(pf){return pf.name===preF.name})||
              postV.functions.find(function(pf){return preF.name.toLowerCase().indexOf(pf.name.toLowerCase())>=0||pf.name.toLowerCase().indexOf(preF.name.toLowerCase())>=0});

    if(!postF) {
      missing++;
      comparisons.push({name:preF.name,file:preF.file,status:"missing",pre:preF,post:null,cases:[]});
      return;
    }

    var caseDiffs=[];
    (preF.tests||[]).forEach(function(preT,j){
      var postT=(postF.tests||[])[j];
      if(!postT) { missing++; caseDiffs.push({label:preT.label,status:"missing",pre:preT,post:null}); return; }

      var preOut=JSON.stringify(typeof preT.predicted==="string"?preT.predicted:JSON.stringify(preT.predicted));
      var postOut=JSON.stringify(typeof postT.predicted==="string"?postT.predicted:JSON.stringify(postT.predicted));

      if(preOut===postOut) {
        equivalent++;
        caseDiffs.push({label:preT.label,status:"equivalent",pre:preT,post:postT});
      } else {
        different++;
        caseDiffs.push({label:preT.label,status:"different",pre:preT,post:postT});
      }
    });

    comparisons.push({name:preF.name,file:preF.file,status:caseDiffs.some(function(c){return c.status==="different"})?"different":"equivalent",pre:preF,post:postF,cases:caseDiffs});
  });

  var total=equivalent+different+missing;
  return {
    comparisons:comparisons,
    summary:{equivalent:equivalent,different:different,missing:missing,total:total},
    preservationRate:total>0?Math.round(equivalent/total*100):0
  };
}

function compareQAResults(preR, postR) {
  // Compare pre-migration vs post-migration test results
  if(!preR||!postR||!preR.tests||!postR.tests) return null;
  var comparisons=[];
  var identical=0,regressions=0,newPasses=0,unchanged=0;

  preR.tests.forEach(function(preTest,i){
    var postTest=postR.tests.find(function(pt){return pt.id===preTest.id})||postR.tests[i];
    if(!postTest) return;

    var preCases=preTest.cases||[];
    var postCases=postTest.cases||[];
    var caseDiffs=[];

    preCases.forEach(function(preCase,j){
      var postCase=postCases[j];
      if(!postCase){caseDiffs.push({label:preCase.label,status:"missing",pre:preCase,post:null});return;}

      if(preCase.pass&&postCase.pass&&preCase.actualStr===postCase.actualStr){
        identical++;
        caseDiffs.push({label:preCase.label,status:"identical",pre:preCase,post:postCase});
      } else if(preCase.pass&&!postCase.pass){
        regressions++;
        caseDiffs.push({label:preCase.label,status:"regression",pre:preCase,post:postCase});
      } else if(!preCase.pass&&postCase.pass){
        newPasses++;
        caseDiffs.push({label:preCase.label,status:"new_pass",pre:preCase,post:postCase});
      } else if(preCase.pass&&postCase.pass&&preCase.actualStr!==postCase.actualStr){
        regressions++;
        caseDiffs.push({label:preCase.label,status:"output_changed",pre:preCase,post:postCase});
      } else {
        unchanged++;
        caseDiffs.push({label:preCase.label,status:"both_fail",pre:preCase,post:postCase});
      }
    });

    comparisons.push({id:preTest.id,name:preTest.name,file:preTest.file,func:preTest.func,type:preTest.type,cases:caseDiffs});
  });

  return {
    comparisons:comparisons,
    summary:{identical:identical,regressions:regressions,newPasses:newPasses,unchanged:unchanged,total:identical+regressions+newPasses+unchanged},
    preservationRate:identical+regressions+newPasses+unchanged>0?Math.round(identical/(identical+regressions+newPasses+unchanged)*100):0
  };
}

function exportTestsAsCode(suite, lang, targetLang) {
  // Generate downloadable test files in the target language's test framework
  if(!suite||!suite.tests) return "";
  var tn=(LANGS[targetLang]||{}).n||targetLang;
  var safeName=function(s){return (s||"test").replace(/[^a-zA-Z0-9_]/g,"_")};
  var safeLabel=function(s){return (s||"case").replace(/[^a-zA-Z0-9]/g,"_").toLowerCase()};

  if(targetLang==="javascript"||targetLang==="typescript") {
    var ext=targetLang==="typescript"?"ts":"js";
    var code="// MigraOps v4.5 — Generated Test Suite\n// Framework: Jest"+(targetLang==="typescript"?" + ts-jest":"")+"\n// Run: npx jest tests/migraops.test."+ext+"\n// Install: npm install --save-dev jest"+(targetLang==="typescript"?" ts-jest @types/jest":"")+"\n\n";
    if(targetLang==="typescript") code+="// tsconfig.jest.json: { \"compilerOptions\": { \"module\": \"commonjs\", \"target\": \"es6\" } }\n\n";
    suite.tests.forEach(function(test){
      var fn=safeName(test.function);
      code+="// Source: "+test.file+" — "+test.name+"\n";
      code+="describe('"+test.name+"', () => {\n";
      (test.cases||[]).forEach(function(tc){
        code+="  test('"+tc.label+"', () => {\n";
        code+="    const input = "+JSON.stringify(typeof tc.input==='string'?JSON.parse(tc.input):tc.input)+";\n";
        code+="    const expected = "+JSON.stringify(typeof tc.expected==='string'?JSON.parse(tc.expected):tc.expected)+";\n";
        code+="    const result = "+fn+"(input);\n";
        code+="    expect(result).toEqual(expected);\n";
        code+="  });\n\n";
      });
      code+="  test('should not throw on undefined input', () => {\n";
      code+="    expect(() => "+fn+"(undefined)).not.toThrow();\n";
      code+="  });\n";
      code+="});\n\n";
    });
    return code;
  }

  if(targetLang==="python") {
    var code="# MigraOps v4.5 — Generated Test Suite\n# Framework: pytest\n# Run: pytest tests/test_migraops.py -v\n# Install: pip install pytest\n\nimport pytest\nimport json\n\n";
    suite.tests.forEach(function(test){
      var cls=safeName(test.function);
      cls=cls.charAt(0).toUpperCase()+cls.slice(1);
      code+="# Source: "+test.file+" — "+test.name+"\n";
      code+="class Test"+cls+":\n";
      code+="    \"\"\"Tests for "+test.function+" from "+test.file+"\"\"\"\n\n";
      (test.cases||[]).forEach(function(tc){
        var lbl=safeLabel(tc.label);
        code+="    def test_"+lbl+"(self):\n";
        code+="        \"\"\""+tc.label+"\"\"\"\n";
        code+="        input_data = "+JSON.stringify(typeof tc.input==='string'?JSON.parse(tc.input):tc.input)+"\n";
        code+="        expected = "+JSON.stringify(typeof tc.expected==='string'?JSON.parse(tc.expected):tc.expected)+"\n";
        code+="        result = "+test.function+"(input_data)\n";
        code+="        assert result == expected, f\"Expected {expected}, got {result}\"\n\n";
      });
      code+="    def test_none_input(self):\n";
      code+="        \"\"\"Should handle None input gracefully\"\"\"\n";
      code+="        try:\n";
      code+="            "+test.function+"(None)\n";
      code+="        except (TypeError, ValueError, AttributeError):\n";
      code+="            pass  # Expected for None input\n\n\n";
    });
    return code;
  }

  if(targetLang==="java") {
    var code="// MigraOps v4.5 — Generated Test Suite\n// Framework: JUnit 5\n// Run: mvn test -Dtest=MigraOpsTest\n// Dependency: org.junit.jupiter:junit-jupiter:5.10+\n\npackage com.migraops.tests;\n\nimport org.junit.jupiter.api.Test;\nimport org.junit.jupiter.api.DisplayName;\nimport org.junit.jupiter.api.Nested;\nimport static org.junit.jupiter.api.Assertions.*;\n\n";
    code+="class MigraOpsTest {\n\n";
    suite.tests.forEach(function(test){
      var fn=safeName(test.function);
      code+="    @Nested\n";
      code+="    @DisplayName(\""+test.name+" ("+test.file+")\")\n";
      code+="    class "+fn.charAt(0).toUpperCase()+fn.slice(1)+"Tests {\n\n";
      (test.cases||[]).forEach(function(tc,i){
        code+="        @Test\n";
        code+="        @DisplayName(\""+tc.label+"\")\n";
        code+="        void test_"+safeLabel(tc.label)+"() {\n";
        code+="            // Input: "+JSON.stringify(tc.input)+"\n";
        code+="            // Expected: "+JSON.stringify(tc.expected)+"\n";
        code+="            // TODO: instantiate class and call "+test.function+"()\n";
        code+="            // var result = instance."+test.function+"(input);\n";
        code+="            // assertEquals(expected, result);\n";
        code+="        }\n\n";
      });
      code+="        @Test\n";
      code+="        @DisplayName(\"Should handle null input\")\n";
      code+="        void test_null_input() {\n";
      code+="            assertDoesNotThrow(() -> {\n";
      code+="                // TODO: instance."+test.function+"(null);\n";
      code+="            });\n";
      code+="        }\n";
      code+="    }\n\n";
    });
    code+="}\n";
    return code;
  }

  if(targetLang==="kotlin") {
    var code="// MigraOps v4.5 — Generated Test Suite\n// Framework: kotlin.test + JUnit 5\n// Run: gradle test\n// Dependency: org.jetbrains.kotlin:kotlin-test-junit5\n\npackage com.migraops.tests\n\nimport kotlin.test.Test\nimport kotlin.test.assertEquals\nimport kotlin.test.assertNotNull\nimport kotlin.test.assertFailsWith\nimport org.junit.jupiter.api.DisplayName\nimport org.junit.jupiter.api.Nested\n\n";
    code+="class MigraOpsTest {\n\n";
    suite.tests.forEach(function(test){
      var fn=safeName(test.function);
      code+="    @Nested\n";
      code+="    @DisplayName(\""+test.name+" ("+test.file+")\")\n";
      code+="    inner class "+fn.charAt(0).toUpperCase()+fn.slice(1)+"Tests {\n\n";
      (test.cases||[]).forEach(function(tc){
        code+="        @Test\n";
        code+="        @DisplayName(\""+tc.label+"\")\n";
        code+="        fun `"+tc.label.replace(/`/g,"'")+"`() {\n";
        code+="            // Input: "+JSON.stringify(tc.input)+"\n";
        code+="            // Expected: "+JSON.stringify(tc.expected)+"\n";
        code+="            // TODO: val result = instance."+test.function+"(input)\n";
        code+="            // assertEquals(expected, result)\n";
        code+="        }\n\n";
      });
      code+="        @Test\n";
      code+="        @DisplayName(\"Should handle null input\")\n";
      code+="        fun `handle null gracefully`() {\n";
      code+="            // TODO: val result = instance."+test.function+"(null)\n";
      code+="            // assertNotNull(result) or assertFailsWith<IllegalArgumentException> { ... }\n";
      code+="        }\n";
      code+="    }\n\n";
    });
    code+="}\n";
    return code;
  }

  if(targetLang==="csharp") {
    var code="// MigraOps v4.5 — Generated Test Suite\n// Framework: xUnit\n// Run: dotnet test\n// Package: xunit 2.6+, xunit.runner.visualstudio\n\nusing Xunit;\nusing System;\n\nnamespace MigraOps.Tests;\n\n";
    suite.tests.forEach(function(test){
      var fn=safeName(test.function);
      var cls=fn.charAt(0).toUpperCase()+fn.slice(1);
      code+="/// <summary>Tests for "+test.function+" from "+test.file+"</summary>\n";
      code+="public class "+cls+"Tests\n{\n";
      (test.cases||[]).forEach(function(tc){
        var lbl=safeLabel(tc.label);
        var methodName=lbl.split("_").map(function(w){return w.charAt(0).toUpperCase()+w.slice(1)}).join("");
        code+="    [Fact]\n";
        code+="    public void "+methodName+"()\n";
        code+="    {\n";
        code+="        // "+tc.label+"\n";
        code+="        // Input: "+JSON.stringify(tc.input)+"\n";
        code+="        // Expected: "+JSON.stringify(tc.expected)+"\n";
        code+="        // TODO: var result = sut."+test.function+"(input);\n";
        code+="        // Assert.Equal(expected, result);\n";
        code+="    }\n\n";
      });
      code+="    [Fact]\n";
      code+="    public void HandleNullInput()\n";
      code+="    {\n";
      code+="        // Should handle null gracefully\n";
      code+="        // var ex = Record.Exception(() => sut."+test.function+"(null));\n";
      code+="        // Assert.Null(ex); // or Assert.IsType<ArgumentNullException>(ex);\n";
      code+="    }\n";
      code+="}\n\n";
    });
    return code;
  }

  // Fallback for any other language — generic pseudocode
  var code="// MigraOps v4.5 — Generated Test Suite ("+tn+")\n// Adapt to your preferred testing framework\n\n";
  suite.tests.forEach(function(test){
    code+="// Test: "+test.name+" ("+test.file+"::"+test.function+")\n";
    (test.cases||[]).forEach(function(tc){
      code+="//   Case: "+tc.label+"\n";
      code+="//     Input:    "+JSON.stringify(tc.input)+"\n";
      code+="//     Expected: "+JSON.stringify(tc.expected)+"\n";
    });
    code+="\n";
  });
  return code;
}

// ═══ PHASE A: Codebase Analysis — understand the app before touching anything ═══
async function doCodebaseAnalysis(files,sl,sv,tl,tv,mid) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;
  var manifest=files.map(function(f){return "### "+f.name+(f.path?" ("+f.path+")":"")+"\n```\n"+f.content+"\n```"}).join("\n\n");
  
  var crossBlock="";
  if (isCross) {
    var tgtMod=MODULE_CONVENTIONS[tl]||{};
    crossBlock="\n\nCROSS-LANGUAGE ("+sn+"→"+tn+"): Output uses "+tgtMod.system+", "+tgtMod.naming+". Include 'fileMapping' mapping each source file to its target name/extension.";
  }
  
  var fileMappingSchema=isCross?",\"fileMapping\":[{\"source\":\"original.py\",\"target\":\"original.js\",\"targetPath\":\"path/original.js\",\"notes\":\"module system changes\"}]":"";
  
  var sys="You are a Principal Architect performing pre-migration analysis. Analyze this "+sn+" "+sv+" codebase that will be migrated to "+tn+" "+tv+". Map the ENTIRE system before any code is changed."+crossBlock+"\n\nFor EACH file, provide DETAILED migration notes:\n- List EVERY deprecated API call with its exact modern replacement\n- List EVERY import that needs to change and what it changes to\n- Identify async patterns (callbacks, promises, sync I/O) and the target async model\n- Note error handling patterns and how they map to "+tn+"\n- Identify class/function signatures that will change\n- Flag data structures that cross file boundaries\n\nCRITICAL: For each file, count processing signals in 'processingHints'. These DIRECTLY control the AI processing budget:\n- deprecatedAPIs: count of deprecated/legacy API calls that need replacement\n- asyncChanges: count of async pattern migrations (callbacks→promises, sync→async, etc.)\n- importChanges: count of import/require statements that need to change\n- structuralChanges: count of class/interface/inheritance changes\n- typeChanges: count of type system changes (adding types, changing generics, etc.)\n- errorHandling: count of try/catch/exception pattern changes\n- totalSignals: sum of all above — this determines how much processing power each file gets\n\nBe ACCURATE with counts — overcounting wastes resources, undercounting produces incomplete migrations.\n\nRespond ONLY valid JSON:\n{\"purpose\":\"what this app/service does\",\"architecture\":\"pattern (MVC/layered/microservice/etc)\",\"files\":[{\"name\":\"...\",\"role\":\"what this file does\",\"exports\":[\"public APIs/classes/functions\"],\"imports\":[\"what it depends on\"],\"migrationNotes\":\"DETAILED: every API change, every pattern shift, every import change\",\"complexity\":\"simple|moderate|complex\",\"estimatedChanges\":0,\"processingHints\":{\"deprecatedAPIs\":0,\"asyncChanges\":0,\"importChanges\":0,\"structuralChanges\":0,\"typeChanges\":0,\"errorHandling\":0,\"totalSignals\":0}}],\"dependencies\":[{\"from\":\"file\",\"to\":\"file\",\"type\":\"import|call|inherit|config\",\"detail\":\"...\"}],\"criticalPaths\":[\"sequence of calls that must work together\"],\"risks\":[{\"area\":\"...\",\"detail\":\"...\",\"severity\":\"high|medium|low\"}],\"migrationOrder\":[\"files in optimal migration order\"],\"sharedContracts\":[\"interfaces/types/schemas that span multiple files\"]"+fileMappingSchema+"}";
  var usr="Analyze this "+sn+" "+sv+" codebase ("+files.length+" files, "+files.reduce(function(s,f){return s+f.content.split("\n").length},0)+" total lines):\n\n"+manifest+"\n\nProvide DETAILED per-file migration notes. Each file's migrationNotes should be 3-5 sentences covering every API change, import change, and pattern migration needed.";
  try {
    var txt=await callClaude(sys,usr,mid,4000,{timeout:60000});
    var cl=safeParseJSON(txt);
    if(!cl)throw new Error("Invalid JSON response");
    return {ok:true,analysis:cl,isCross:isCross};
  } catch(e) { return {ok:false,error:e.message,isCross:isCross}; }
}

// ═══ PHASE B: Per-file Migration with codebase + already-migrated context ═══
// ═══ PHASE B (pre-step): Per-file migration plan — deep analysis of ONE file ═══
async function doFilePlan(code,fn,sl,sv,tl,tv,mid,cbCtx,alreadyMigrated,targetFileName,cap) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;
  var lineCount=code.split("\n").length;

  // Context from codebase analysis
  var archCtx="";
  if (cbCtx&&cbCtx.ok) {
    var a=cbCtx.analysis;
    var fileInfo=(a.files||[]).find(function(f){return fn.indexOf(f.name)>=0});
    archCtx="\nApplication: "+a.purpose+". Architecture: "+a.architecture+".";
    if (fileInfo) archCtx+="\nFile role: "+fileInfo.role+". High-level notes: "+fileInfo.migrationNotes;
    if (a.sharedContracts&&a.sharedContracts.length) archCtx+="\nShared contracts: "+a.sharedContracts.join("; ");
  }

  // Paradigm context for cross-language — inject MORE mappings for complex files
  var paradigmCtx="";
  if (isCross) {
    var pMap=getParadigmMap(sl,tl);
    if (pMap) {
      var mapSlice=cap?cap.paradigmSlice:10;
      paradigmCtx="\n\nParadigm mappings ("+pMap.title+"):";
      paradigmCtx+="\nStdlib: "+pMap.stdlib.slice(0,mapSlice).join("; ");
      paradigmCtx+="\nPatterns: "+pMap.patterns.slice(0,mapSlice).join("; ");
      paradigmCtx+="\nModule system: "+pMap.modules.join("; ");
      if (pMap.async) paradigmCtx+="\nAsync: "+pMap.async.slice(0,Math.min(mapSlice,8)).join("; ");
      if (pMap.versionNotes) paradigmCtx+="\nVersion notes: "+pMap.versionNotes.slice(0,6).join("; ");
    }
  }

  // Already migrated sibling exports (brief)
  var siblingCtx="";
  if (alreadyMigrated&&alreadyMigrated.length) {
    siblingCtx="\n\nAlready migrated siblings:\n"+alreadyMigrated.map(function(m){
      var exports=(m.migrated.match(/^export\s+.*/gm)||m.migrated.match(/^(?:public|module\.exports).*/gm)||[]).slice(0,5);
      return "- "+(m.targetName||m.name)+": "+exports.join("; ");
    }).join("\n");
  }

  var sys="You are a migration planner. Analyze this ONE "+sn+" "+sv+" file ("+lineCount+" lines) and produce a CONCRETE migration recipe for "+tn+" "+tv+". Do NOT write any code — only the plan."+archCtx+paradigmCtx+siblingCtx+"\n\nFor EACH section of the file, list:\n1) Line ranges and what they do\n2) EXACT changes needed (old API call → new API call, old pattern → new pattern)\n3) Import changes (what to remove, what to add)\n4) Async model changes (callbacks → promises → async/await)\n5) Error handling changes\n6) Data structure changes\n7) Any cross-file dependency considerations\n\nBe SPECIFIC: 'line 5: urllib2.urlopen(url) → const resp = await fetch(url)' not 'update HTTP calls'\n\nRespond ONLY JSON:\n{\"complexity\":\"simple|moderate|complex\",\"totalChanges\":0,\"sections\":[{\"lines\":\"1-10\",\"purpose\":\"imports\",\"changes\":[\"specific change 1\",\"specific change 2\"]},{\"lines\":\"12-25\",\"purpose\":\"class definition\",\"changes\":[\"...\"]}],\"importPlan\":{\"remove\":[\"old imports\"],\"add\":[\"new imports\"]},\"asyncPlan\":\"description of async model migration\",\"riskAreas\":[\"specific risks\"],\"estimatedOutputLines\":0}";

  var usr="Plan the migration of this "+sn+" "+sv+" file to "+tn+" "+tv+":\n\nFile: "+fn+(targetFileName?" → "+targetFileName:"")+"\n```\n"+code+"\n```\n\nProduce a line-by-line migration recipe. Be specific — exact API replacements, exact import changes. JSON only.";

  try {
    // Use capacity-driven tokens/timeout, fallback to line-based
    var planTk=cap?cap.planTokens:Math.min(3000,Math.max(1500,lineCount*30));
    var planTo=cap?cap.planTimeout:45000;
    var txt=await callClaude(sys,usr,mid,planTk,{timeout:planTo,retries:0});
    var parsed=safeParseJSON(txt);
    if(!parsed)throw new Error("Invalid JSON response");
    return {ok:true,plan:parsed};
  } catch(e) { return {ok:false,error:e.message}; }
}

async function doMigrate(code,fn,sl,sv,tl,tv,mid,pr,cbCtx,alreadyMigrated,targetFileName,allFileMap,filePlan,cap) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;

  // Build context from codebase analysis — RICH context for better first-pass quality
  var ctxBlock="";
  var fileComplexity="moderate";
  if (cbCtx&&cbCtx.ok) {
    var a=cbCtx.analysis;
    var fileInfo=(a.files||[]).find(function(f){return fn.indexOf(f.name)>=0});
    ctxBlock="\n\n=== CODEBASE CONTEXT ===\nApplication: "+a.purpose+"\nArchitecture: "+a.architecture;
    if (fileInfo) {
      ctxBlock+="\nThis file's role: "+fileInfo.role;
      ctxBlock+="\nExports: "+(fileInfo.exports||[]).join(", ");
      ctxBlock+="\nDependencies: "+(fileInfo.imports||[]).join(", ");
      fileComplexity=fileInfo.complexity||"moderate";
    }
    if (a.sharedContracts&&a.sharedContracts.length) ctxBlock+="\nShared contracts to preserve: "+a.sharedContracts.join("; ");
    var deps=(a.dependencies||[]).filter(function(d){return fn.indexOf(d.from)>=0||fn.indexOf(d.to)>=0});
    if (deps.length) ctxBlock+="\nDependency connections: "+deps.map(function(d){return d.from+" depends on "+d.to+" ("+d.type+": "+d.detail+")"}).join("; ");
    if (a.criticalPaths&&a.criticalPaths.length) {
      var relevantPaths=a.criticalPaths.filter(function(cp){return cp.indexOf(fn.replace(/\.[^.]+$/,""))>=0});
      if (relevantPaths.length) ctxBlock+="\nCritical paths involving this file: "+relevantPaths.join("; ");
    }
    ctxBlock+="\n=== END CONTEXT ===";
  }

  // Inject per-file migration plan (from doFilePlan) — this is the KEY quality driver
  var planBlock="";
  if (filePlan&&filePlan.ok&&filePlan.plan) {
    var fp=filePlan.plan;
    fileComplexity=fp.complexity||fileComplexity;
    planBlock="\n\n=== MIGRATION RECIPE FOR THIS FILE ("+fp.totalChanges+" changes planned) ===";
    if (fp.importPlan) {
      planBlock+="\nIMPORTS: Remove: "+(fp.importPlan.remove||[]).join(", ")+". Add: "+(fp.importPlan.add||[]).join(", ");
    }
    if (fp.asyncPlan) planBlock+="\nASYNC MODEL: "+fp.asyncPlan;
    if (fp.sections&&fp.sections.length) {
      planBlock+="\n\nSECTION-BY-SECTION PLAN:";
      fp.sections.forEach(function(sec){
        planBlock+="\n[Lines "+sec.lines+" — "+sec.purpose+"]:";
        (sec.changes||[]).forEach(function(ch){planBlock+="\n  • "+ch});
      });
    }
    if (fp.riskAreas&&fp.riskAreas.length) planBlock+="\n\nRISK AREAS: "+fp.riskAreas.join("; ");
    planBlock+="\n=== END RECIPE ===";
    planBlock+="\n\nEXECUTE THIS RECIPE PRECISELY. Apply EVERY change listed above. Do not skip any section.";
  }

  // Cross-language: add file mapping, module system, AND paradigm mapping instructions
  var crossBlock="";
  if (isCross&&allFileMap) {
    var tgtMod=MODULE_CONVENTIONS[tl]||{};
    crossBlock="\n\nCROSS-LANGUAGE: Output file: "+targetFileName+". Files: "+allFileMap.map(function(m){return m.source+"→"+m.target}).join(", ")+". Use "+tn+" module system ("+tgtMod.system+"). Imports MUST use "+TARGET_EXT[tl]+" filenames.";
    // Add concrete paradigm mapping — scale depth by capacity profile
    var pMap=getParadigmMap(sl,tl);
    if (pMap) {
      var mapDepth=cap?cap.paradigmSlice:12;
      if (cap&&cap.tier>=3) mapDepth=999; // complex: inject ALL mappings
      crossBlock+="\n\n=== PARADIGM MAPPING ("+pMap.title+") ===";
      crossBlock+="\nSTDLIB TRANSLATIONS:\n"+pMap.stdlib.slice(0,mapDepth).map(function(s){return "\u2022 "+s}).join("\n");
      crossBlock+="\nPATTERN TRANSLATIONS:\n"+pMap.patterns.slice(0,mapDepth).map(function(s){return "\u2022 "+s}).join("\n");
      crossBlock+="\nMODULE SYSTEM:\n"+pMap.modules.map(function(s){return "\u2022 "+s}).join("\n");
      if (pMap.async) crossBlock+="\nASYNC MODEL:\n"+pMap.async.map(function(s){return "\u2022 "+s}).join("\n");
      if (pMap.types) crossBlock+="\nTYPE SYSTEM:\n"+pMap.types.map(function(s){return "\u2022 "+s}).join("\n");
      if (pMap.versionNotes) crossBlock+="\nVERSION-SPECIFIC ("+tv+"):\n"+pMap.versionNotes.map(function(s){return "\u2022 "+s}).join("\n");
      crossBlock+="\n=== END PARADIGM MAPPING ===";
      crossBlock+="\n\nAPPLY THESE MAPPINGS CONCRETELY. Do NOT leave any "+sn+" patterns \u2014 translate EVERYTHING to idiomatic "+tn+" "+tv+".";
    }
  }

  // Pass already-migrated sibling files — use TARGET filenames in cross-language
  var siblingBlock="";
  if (alreadyMigrated&&alreadyMigrated.length) {
    var summaries=alreadyMigrated.map(function(m){
      var code=m.migrated;
      var lines=code.split("\n");
      var keyLines=[];
      lines.forEach(function(ln){
        var t=ln.trim();
        if (!t||t.startsWith("//")||t.startsWith("#")||t.startsWith("*")) return;
        if (/^(import |from |require|using |package )/.test(t)) { keyLines.push(ln); return; }
        if (/^(export |module\.exports|exports\.)/.test(t)) { keyLines.push(ln); return; }
        if (/^(public |private |protected |class |def |function |async |const |let |var |interface |enum |record |sealed )/.test(t)) {
          keyLines.push(ln);
        }
      });
      var displayName=m.targetName||m.name;
      return "### "+displayName+" [ALREADY MIGRATED — key signatures]\n```\n"+keyLines.join("\n")+"\n```";
    });
    siblingBlock="\n\n=== ALREADY MIGRATED FILES — match these exports/signatures ===\n"+summaries.join("\n\n")+"\n=== END ===\n\nYour imports and calls MUST match the actual function/class names above."+(isCross?" Reference files by their TARGET names ("+TARGET_EXT[tl]+" extensions).":"");
  }

  var sys=pr.mig.sys.replace("{TARGET}",tn).replace("{TARGET_VER}",tv).replace("{SOURCE}",sn).replace("{SOURCE_VER}",sv);
  if (pr.mig.guide.length) sys+="\n\nGuidelines:\n"+pr.mig.guide.map(function(g){return "- "+g.replace(/\{TARGET\}/g,tn).replace(/\{TARGET_VER\}/g,tv).replace(/\{SOURCE\}/g,sn).replace(/\{SOURCE_VER\}/g,sv)}).join("\n");
  if (isCross) {
    sys+="\n\nCRITICAL CROSS-LANGUAGE RULES:\n- Output MUST be valid, runnable "+tn+" "+tv+" code\n- Translate EVERY construct — do not leave ANY "+sn+" syntax\n- Use "+tn+" standard library equivalents for ALL "+sn+" stdlib calls\n- Module system: use "+tn+" imports/exports (not "+sn+"'s)\n- Naming: follow "+tn+" conventions ("+((MODULE_CONVENTIONS[tl]||{}).naming||"target conventions")+")\n- Error handling: use "+tn+" try/catch patterns\n- The output must be a COMPLETE, self-contained "+tn+" file that could run as-is";
  }
  var usr="Migrate "+sn+" "+sv+" to "+tn+" "+tv+".\nSource file: "+fn+(targetFileName&&targetFileName!==fn?" Target file: "+targetFileName:"")+ctxBlock+planBlock+crossBlock+siblingBlock+"\n\nSOURCE:\n"+code;
  try {
    // Scale tokens by file complexity: larger/more complex files need more output space
    var lineCount=code.split("\n").length;
    // Token/timeout from adaptive capacity (or fallback)
    var maxMigTokens=cap?cap.migTokens:Math.min(8192,Math.round((isCross?5120:4096)*1.2));
    var migTimeout=cap?cap.migTimeout:60000;
    var txt=await callClaude(sys,usr,mid,maxMigTokens,{timeout:migTimeout});
    var m=txt.replace(/^```[\w]*\n?/gm,"").replace(/\n?```$/gm,"").trim();
    var ch=(m.match(/(?:\/\/|#)\s*MIGRATED:.*/g)||[]).map(function(c){return c.replace(/(?:\/\/|#)\s*MIGRATED:\s*/,"").trim()});
    if (!ch.length) ch.push(sn+" "+sv+" → "+tn+" "+tv);
    return {migrated:m,changes:ch,engine:"claude-ai"};
  } catch(e) {
    return {migrated:"// Error: "+e.message+"\n\n"+code,changes:["Error: "+e.message],engine:"fallback"};
  }
}

// ═══ PHASE B2a: Dependency Audit — map every cross-file connection before touching code ═══
async function doDependencyAudit(origFiles,migratedResults,sl,sv,tl,tv,mid) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;
  var migManifest=migratedResults.map(function(r){var dn=r.targetName||r.name;return "### "+dn+"\n```\n"+r.migrated+"\n```"}).join("\n\n");

  var crossCtx="";
  if (isCross) {
    crossCtx="\n\nCROSS-LANGUAGE ("+sn+" to "+tn+"): "+migratedResults.map(function(r){return r.name+" renamed to "+(r.targetName||r.name)}).join(", ")+".";
    var pMap=getParadigmMap(sl,tl);
    if (pMap) {
      crossCtx+="\nExpected module system: "+pMap.modules.join("; ");
    }
  }

  var sys="You are a dependency auditor. Analyze "+migratedResults.length+" migrated files ("+tn+" "+tv+") and map EVERY cross-file connection."+crossCtx+"\n\nFor each file, extract:\n1) What it EXPORTS (functions, classes, constants, default export)\n2) What it IMPORTS (from which file, what names)\n3) Function signatures at boundaries (params, return types)\n4) Shared data structures / contracts\n\nThen verify:\n- Every import resolves to a real export in a sibling file\n- Function call signatures match the definition\n- Data types are compatible at boundaries\n- Module system is consistent (all ESM or all CommonJS)\n- Naming conventions are consistent\n\nRespond ONLY JSON:\n{\"files\":[{\"name\":\"...\",\"exports\":[{\"name\":\"...\",\"type\":\"function|class|const|default\",\"signature\":\"params and return\"}],\"imports\":[{\"from\":\"...\",\"names\":[\"...\"],\"resolved\":true/false}]}],\"connections\":[{\"from\":\"file\",\"to\":\"file\",\"type\":\"imports|calls|extends\",\"fromSignature\":\"...\",\"toSignature\":\"...\",\"compatible\":true/false,\"issue\":\"description if incompatible\"}],\"issues\":[{\"files\":[\"...\"],\"type\":\"unresolved_import|signature_mismatch|missing_export|inconsistent_module|naming\",\"detail\":\"...\",\"fix\":\"suggested fix\"}],\"moduleSystem\":\"ESM|CommonJS|mixed\",\"summary\":\"2-3 sentences\"}";

  var usr="MIGRATED CODEBASE ("+tn+" "+tv+") — "+migratedResults.length+" files migrated independently:\n\n"+migManifest+"\n\nMap ALL cross-file connections. Find every unresolved import, signature mismatch, and naming inconsistency. JSON only.";

  try {
    var txt=await callClaude(sys,usr,mid,3000,{timeout:60000});
    var parsed=safeParseJSON(txt);
    if(!parsed)throw new Error("Invalid JSON response");
    return {ok:true,audit:parsed};
  } catch(e) { return {ok:false,error:e.message}; }
}

// ═══ PHASE B2b: Consolidation Fix — use audit results to fix all cross-file issues ═══
async function doConsolidation(origFiles,migratedResults,sl,sv,tl,tv,mid,depAudit) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;
  var origManifest=origFiles.map(function(f){return "### "+f.name+"\n```\n"+f.content+"\n```"}).join("\n\n");
  var migManifest=migratedResults.map(function(r){var dn=r.targetName||r.name;return "### "+dn+"\n```\n"+r.migrated+"\n```"}).join("\n\n");

  var crossInstr="";
  if (isCross) {
    crossInstr="\nCROSS-LANGUAGE: "+migratedResults.map(function(r){return r.name+" to "+(r.targetName||r.name)}).join(", ")+". Use "+TARGET_EXT[tl]+" filenames as JSON keys.";
    var pMap=getParadigmMap(sl,tl);
    if (pMap) {
      crossInstr+="\nModule system: "+pMap.modules.join("; ");
      crossInstr+="\nAsync model: "+pMap.async.join("; ");
    }
  }

  // Build audit context if available
  var auditCtx="";
  if (depAudit&&depAudit.ok&&depAudit.audit) {
    var a=depAudit.audit;
    if (a.issues&&a.issues.length) {
      auditCtx="\n\n=== DEPENDENCY AUDIT RESULTS ("+a.issues.length+" issues found) ===\n";
      auditCtx+=a.issues.map(function(is,i){return (i+1)+". ["+is.type+"] "+((is.files||[]).join(","))+": "+is.detail+(is.fix?" → FIX: "+is.fix:"")}).join("\n");
      auditCtx+="\n=== END AUDIT ===";
    }
    if (a.connections&&a.connections.length) {
      var broken=a.connections.filter(function(c){return !c.compatible});
      if (broken.length) {
        auditCtx+="\n\nBROKEN CONNECTIONS:\n"+broken.map(function(c){return c.from+" calls "+c.to+": "+c.fromSignature+" vs "+c.toSignature+" — "+c.issue}).join("\n");
      }
    }
    if (a.moduleSystem==="mixed") {
      auditCtx+="\n\nWARNING: Mixed module system detected. Standardize to "+tn+" default.";
    }
  }

  var sys="Consolidation engineer: "+migratedResults.length+" files migrated independently "+sn+" "+sv+" to "+tn+" "+tv+"."+crossInstr+auditCtx+"\n\nFix ALL cross-file issues found by the dependency audit:\n1) Resolve every unresolved import — match exact export names\n2) Fix signature mismatches at call boundaries\n3) Standardize module system (all ESM or all CommonJS for "+tn+")\n4) Ensure consistent naming conventions\n5) Fix data type compatibility at boundaries\n6) Ensure consistent async model (no mixing callbacks with promises)\n\nReturn ALL files (unchanged ones copied as-is). Return COMPLETE file contents.\n\nReturn JSON: {\"files\":{\"filename\":\"full source code\",...},\"fixes\":[\"description of each fix\"]}";

  var usr="ORIGINAL ("+sn+" "+sv+"):\n"+origManifest+"\n\n===\n\nMIGRATED INDEPENDENTLY ("+tn+" "+tv+"):\n"+migManifest+"\n\nFix ALL cross-file issues"+(auditCtx?" identified in the audit":"")+" . Return ALL "+migratedResults.length+" files with complete source code. JSON only.";

  try {
    var txt=await callClaude(sys,usr,mid,10000,{timeout:75000});
    var parsed=safeParseJSON(txt);
    if(!parsed)throw new Error("Invalid JSON response");
    return {ok:true,files:parsed.files||{},fixes:parsed.fixes||[]};
  } catch(e) { return {ok:false,error:e.message}; }
}

// ═══ Unified scoring rubric (shared across all evaluators) ═══
var SCORING_RUBRIC="MANDATORY SCORING PROTOCOL:\n1) Score EACH of the 8 layers independently 0-100\n2) Final score = WEIGHTED AVERAGE: imports×10 + architecture×15 + async×15 + security×20 + errors×10 + types×10 + dataflow×10 + idiomatic×10, divided by 100\n3) Show math: (layer1×weight + layer2×weight + ...) / 100 = final\n\nLAYER SCORING GUIDE — be honest, not generous OR harsh:\n- 90-100: Excellent. Production-ready. Zero critical issues, minor style issues at most.\n- 75-89: Good. Functional with some quality gaps (incomplete validation, some legacy patterns).\n- 55-74: Acceptable. Works but real problems exist (security gaps, mixed paradigms, weak error handling).\n- 30-54: Poor. Significant issues but code structure is recognizable and partially functional.\n- 10-29: Broken. Syntax errors, unresolved imports, fundamentally non-functional.\n- 0-9: Empty or completely unrelated code.\n\nCALIBRATION: Even a naive literal translation that compiles should score 30-50. A decent automated migration typically scores 60-80. 90+ requires genuinely excellent, production-quality code.";

// ═══ PHASE C: Integration Validation — comprehensive, regression-aware ═══
async function doIntegrationCheck(origFiles,migratedResults,sl,sv,tl,tv,mid,lang,prevContext) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;
  var lnames={es:"Español",en:"English",pt:"Português"}; var ln=lnames[lang]||"Español";
  var origManifest=origFiles.map(function(f){return "### "+f.name+(f.path?" ("+f.path+")":"")+"\n```\n"+f.content+"\n```"}).join("\n\n");
  var migManifest=migratedResults.map(function(r){var dn=r.targetName||r.name;var dp=r.targetPath||r.path||dn;return "### "+dn+(dp?" ("+dp+")":"")+"\n```\n"+r.migrated+"\n```"}).join("\n\n");

  var crossBlock="";
  if (isCross) {
    var tgtMod=MODULE_CONVENTIONS[tl]||{};
    crossBlock="\n\nCROSS-LANGUAGE ("+sn+"→"+tn+"): Files renamed: "+migratedResults.map(function(r){return r.name+"→"+(r.targetName||r.name)}).join(", ")+". Imports must use "+TARGET_EXT[tl]+" filenames. Use target names in issue 'files' arrays.";
  }

  var regressionBlock="";
  if (prevContext) {
    regressionBlock="\n\nREGRESSION CHECK: Previously working: "+prevContext.verified.slice(0,5).join("; ")+". Fixed last iteration: "+prevContext.fixedIssues.slice(0,5).join("; ")+". If something previously working broke → severity=critical.";
  }

  var sys="You are a senior code reviewer evaluating a "+sn+" "+sv+" → "+tn+" "+tv+" migration ("+migratedResults.length+" files). Respond in "+ln+"."+crossBlock+"\n\nBe thorough and fair. Find real issues but also acknowledge what works well.\n\nEvaluate ALL 8 layers INDEPENDENTLY. For each layer, examine every file:\n1) IMPORTS (weight 10%): All imports resolve to real exports? Correct paths and extensions?\n2) ARCHITECTURE (weight 15%): Module structure preserved? Separation of concerns maintained?\n3) ASYNC (weight 15%): Async model fully migrated? No mixed callback+promise patterns?\n4) SECURITY (weight 20%): SQL injection? XSS? Resource leaks? Input validation?\n5) ERRORS (weight 10%): All error paths covered? Proper propagation?\n6) TYPES (weight 10%): Function signatures match across files? Types correct at boundaries?\n7) DATAFLOW (weight 10%): Data transformation preserved? No silent data loss?\n8) IDIOMATIC (weight 10%): Modern "+tv+" patterns used? No legacy "+sv+" holdovers?"+(isCross?"\n\nCROSS-LANGUAGE CALIBRATION: In cross-language migrations, evaluate whether the code was translated to GENUINE "+tn+" idioms. A literal translation that works but uses "+sn+" patterns in "+tn+" syntax should score 50-65 in idiomatic. Code that is genuinely idiomatic "+tn+" scores 80+. Even imperfect cross-language migrations that compile and run correctly should get 40-60 overall.":"")+"\n\n"+SCORING_RUBRIC+regressionBlock+"\n\nScore each layer FIRST with specific justification. Then compute final = weighted average.\n\nRespond ONLY JSON:\n{\"layers\":[{\"name\":\"imports\",\"score\":0-100,\"status\":\"pass|warn|fail\",\"detail\":\"what you found\"},{\"name\":\"architecture\",\"score\":...},...all 8],\"score\":0-100,\"scoreBreakdown\":\"imports:X×10 + architecture:X×15 + ... = N/100 = final\",\"pass\":true/false,\"issues\":[{\"severity\":\"critical|major|moderate|minor\",\"files\":[\"file.ext\"],\"category\":\"imports|architecture|async|security|errors|types|dataflow|idiomatic\",\"msg\":\"specific problem\",\"fix\":\"specific code fix\"}],\"verified\":[\"what works\"],\"summary\":\"2-3 sentences\"}";
  var usr="ORIGINAL CODEBASE ("+sn+" "+sv+"):\n"+origManifest+"\n\n===\n\nMIGRATED CODEBASE ("+tn+" "+tv+"):\n"+migManifest+"\n\nThorough review. Score each layer independently (0-100), then compute weighted average. Show your math. ALL text in "+ln+". Respond ONLY JSON.";
  try {
    // Scale tokens: more files need more detailed layer analysis (8 layers × N files)
    var intCheckTokens=Math.min(6000,4000+migratedResults.length*400);
    var txt=await callClaude(sys,usr,mid,intCheckTokens);
    var parsed=safeParseJSON(txt);
    if(!parsed)throw new Error("Invalid JSON response");
    if (parsed.layers&&parsed.layers.length>=6) {
      var weights={imports:10,architecture:15,async:15,security:20,errors:10,types:10,dataflow:10,idiomatic:10};
      var wSum=0, wTotal=0;
      parsed.layers.forEach(function(ly){
        var key=(ly.name||"").toLowerCase().replace(/[^a-z]/g,"");
        // Fuzzy match layer names to weight keys
        var w=weights[key]||0;
        if(!w){Object.keys(weights).forEach(function(k){if(key.indexOf(k)>=0||k.indexOf(key)>=0)w=weights[k]})}
        if(!w)w=10; // fallback
        wSum+=(ly.score||0)*w;
        wTotal+=w;
      });
      var derived=wTotal>0?Math.round(wSum/wTotal):parsed.score;
      if (Math.abs(derived-(parsed.score||0))>8) {
        parsed.scoreBreakdown=(parsed.scoreBreakdown||"")+" [Recalculated: model said "+parsed.score+", layers give "+derived+"]";
        parsed.score=derived;
      }
      // Ensure pass reflects the recalculated score
      parsed.pass=parsed.score>=90&&(parsed.issues||[]).filter(function(is){return is.severity==="critical"||is.severity==="major"}).length===0;
    }
    // ═══ SCORING FLOOR: if there's actual migrated code, minimum score is 10 ═══
    // A score of 0 means "no code at all" — even terrible code with syntax errors gets 10-20
    if ((parsed.score||0)<10) {
      var hasCode=migratedResults.some(function(r){return r.migrated&&r.migrated.trim().length>50&&!r.migrated.startsWith("// Error:")});
      if (hasCode) {
        parsed.scoreBreakdown=(parsed.scoreBreakdown||"")+" [Floor applied: original="+parsed.score+", migrated code exists → min 10]";
        parsed.score=Math.max(parsed.score||0,10);
      }
    }
    return {ok:true,result:parsed};
  } catch(e) { return {ok:false,error:e.message}; }
}

// ═══ PHASE D: Integration Fix — holistic, escalating strategies ═══
async function doIntegrationFix(origFiles,migratedResults,issues,sl,sv,tl,tv,mid,iteration,prevIssues) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;
  var origManifest=origFiles.map(function(f){return "### "+f.name+"\n```\n"+f.content+"\n```"}).join("\n\n");
  var migManifest=migratedResults.map(function(r){var dn=r.targetName||r.name;return "### "+dn+"\n```\n"+r.migrated+"\n```"}).join("\n\n");
  // Sort issues by severity for priority fixing
  var sevOrder={critical:0,major:1,moderate:2,minor:3};
  var sortedIssues=issues.slice().sort(function(a,b){return (sevOrder[a.severity]||3)-(sevOrder[b.severity]||3)});
  var issueList=sortedIssues.map(function(is,idx){return (idx+1)+". ["+is.severity.toUpperCase()+"] "+(is.files||[]).join(" ↔ ")+" ("+is.category+"): "+is.msg+(is.fix?"\n   FIX: "+is.fix:"")}).join("\n");

  var crossInstr="";
  if (isCross) {
    var tgtMod=MODULE_CONVENTIONS[tl]||{};
    crossInstr="\n\nCROSS-LANGUAGE CONTEXT:\nFile mapping: "+migratedResults.map(function(r){return r.name+" → "+(r.targetName||r.name)}).join(", ")+"\nTarget module system: "+tgtMod.system+"\nUse TARGET filenames as keys in your response JSON.";
    var pMap=getParadigmMap(sl,tl);
    if (pMap) {
      crossInstr+="\n\nKEY API TRANSLATIONS ("+pMap.title+"):\n"+pMap.stdlib.slice(0,8).map(function(s){return "• "+s}).join("\n");
      crossInstr+="\n"+pMap.patterns.slice(0,6).map(function(s){return "• "+s}).join("\n");
    }
  }

  var escalation="";
  if (iteration>=2 && prevIssues) {
    escalation="\n\nESCALATION: Previous fix failed. Try DIFFERENT approach — rewrite affected functions/classes instead of patching. Still broken: "+prevIssues.slice(0,5).map(function(is){return (is.files||[]).join("↔")+": "+is.msg}).join("; ");
  }

  var fileListStr=migratedResults.map(function(r){return r.targetName||r.name}).join(", ");
  var sys="Fix ALL "+issues.length+" issues in "+sn+" "+sv+" to "+tn+" "+tv+" migration ("+fileListStr+")."+escalation+crossInstr+"\n\nCRITICAL ANTI-REGRESSION RULES:\n- DO NOT break anything that currently works. Fix issues ONLY — do not rewrite unrelated code.\n- If a file has no issues, return it UNCHANGED (copy it exactly as-is).\n- Preserve ALL existing imports, exports, function signatures unless an issue specifically requires changing them.\n- After fixing, mentally verify: would the fixed code compile? Do all imports still resolve?\n\nPriority: fix critical/major first, then moderate (non-idiomatic code, incomplete async migration, weak typing, missing validation). Return ALL "+migratedResults.length+" files (unchanged files copied as-is). Valid runnable "+tn+" "+tv+" with MODERN idiomatic patterns. "+SCORING_RUBRIC+"\n\nReturn ONLY JSON: {\"files\":{\"filename\":\"full source code\",...},\"fixed\":[\"fix descriptions\"]}";

  var usr="ORIGINAL ("+sn+" "+sv+"):\n"+origManifest+"\n\n===\n\nCURRENT MIGRATED ("+tn+" "+tv+") — has "+issues.length+" issues:\n"+migManifest+"\n\n===\n\nALL ISSUES ("+issues.length+") sorted by severity:\n"+issueList+"\n\nFix ALL issues including moderate quality gaps. Return ALL "+migratedResults.length+" files. JSON only.";

  try {
    var txt=await callClaude(sys,usr,mid,10000,{timeout:75000});
    var parsed=safeParseJSON(txt);
    if(!parsed)throw new Error("Invalid JSON response");
    var fixedFiles=parsed.files||parsed;
    var fixed=parsed.fixed||[];
    return {ok:true,files:fixedFiles,fixed:fixed};
  } catch(e) { return {ok:false,error:e.message}; }
}

async function doReview(origFiles,migratedResults,sl,sv,tl,tv,mid,pr,lang) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var lnames={es:"Español",en:"English",pt:"Português"};
  var ln=lnames[lang]||"Español";
  var origManifest=origFiles.map(function(f){return "### "+f.name+"\n```\n"+f.content+"\n```"}).join("\n\n");
  var migManifest=migratedResults.map(function(r){var dn=r.targetName||r.name;return "### "+dn+"\n```\n"+r.migrated+"\n```"}).join("\n\n");
  var sys="You are a STRICT QA reviewer: "+sn+" "+sv+"→"+tn+" "+tv+" ("+migratedResults.length+" files). Respond in "+ln+".\n\nScore each dimension independently FIRST, then compute weighted average:\n- Functional(25%): Does migrated code produce same outputs for same inputs? Test with empty, null, error cases.\n- Syntax(15%): Valid compilable "+tv+"? All imports resolve? All types correct?\n- Idiomatic(15%): Genuine modern "+tv+" patterns? No legacy "+sv+" holdovers? Proper stdlib usage?\n- Async(10%): Async model fully migrated and consistent? No mixed paradigms?\n- Security(15%): SQL injection, XSS, resource leaks, input validation, hardcoded secrets?\n- Errors(8%): All error paths covered? No swallowed exceptions? Resource cleanup?\n- Contracts(7%): Public API surface preserved? Function signatures compatible for callers?\n- Docs(5%): MIGRATED comments present? Clear naming? Self-documenting code?\n\n"+SCORING_RUBRIC+"\n\nFinal score = weighted average of dimensions. Verdict: aprobado(90+), con_observaciones(70-89), rechazado(<70).\n\nRespond ONLY JSON:\n{\"score\":0-100,\"scoreBreakdown\":\"func:X×25 + syn:X×15 + idi:X×15 + async:X×10 + sec:X×15 + err:X×8 + con:X×7 + doc:X×5 = N/100\",\"verdict\":\"aprobado|con_observaciones|rechazado\",\"dimensions\":{\"functional\":0-100,\"syntax\":0-100,\"idiomatic\":0-100,\"async\":0-100,\"security\":0-100,\"errors\":0-100,\"contracts\":0-100,\"docs\":0-100},\"errors\":[{\"file\":\"...\",\"line\":0,\"severity\":\"critical|major|minor\",\"dimension\":\"functional|syntax|idiomatic|async|security|errors|contracts|docs\",\"msg\":\"in "+ln+"\"}],\"warnings\":[{\"file\":\"...\",\"line\":0,\"dimension\":\"...\",\"msg\":\"in "+ln+"\"}],\"good\":[\"in "+ln+"\"],\"summary\":\"2-3 sentences in "+ln+"\"}";
  var usr="ORIGINAL CODEBASE ("+sn+" "+sv+"):\n"+origManifest+"\n\n===\n\nMIGRATED CODEBASE ("+tn+" "+tv+"):\n"+migManifest+"\n\nStrict review. Score each dimension independently. Compute weighted average. Typical migration: 65-80. ALL text in "+ln+". Respond ONLY JSON.";
  try {
    var txt=await callClaude(sys,usr,mid,4000);
    var cl=safeParseJSON(txt);
    if(!cl)throw new Error("Invalid JSON response");
    // JS-side recalculation from dimensions
    if (cl.dimensions) {
      var dw={functional:25,syntax:15,idiomatic:15,async:10,security:15,errors:8,contracts:7,docs:5};
      var dSum=0;
      Object.keys(dw).forEach(function(k){dSum+=((cl.dimensions[k]||0)*dw[k])});
      var derived=Math.round(dSum/100);
      if (Math.abs(derived-(cl.score||0))>8) {
        cl.scoreBreakdown=(cl.scoreBreakdown||"")+" [Recalc: model="+cl.score+", dims="+derived+"]";
        cl.score=derived;
      }
      cl.verdict=cl.score>=90?"aprobado":cl.score>=70?"con_observaciones":"rechazado";
    }
    // Scoring floor: valid code never gets 0
    if ((cl.score||0)<10 && cl.dimensions) {
      var anyDim=Object.values(cl.dimensions).some(function(v){return v>0});
      if (anyDim) { cl.score=Math.max(cl.score||0,10); cl.verdict=cl.score>=90?"aprobado":cl.score>=70?"con_observaciones":"rechazado"; }
    }
    return {ok:true,review:cl};
  } catch(e) { return {ok:false,error:e.message}; }
}

async function doFixPlan(origFiles,migratedResults,review,sl,sv,tl,tv,mid,lang) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var lnames={es:"Español",en:"English",pt:"Português"};
  var ln=lnames[lang]||"Español";
  var origManifest=origFiles.map(function(f){return "### "+f.name+"\n```\n"+f.content+"\n```"}).join("\n\n");
  var migManifest=migratedResults.map(function(r){return "### "+r.name+"\n```\n"+r.migrated+"\n```"}).join("\n\n");
  var errList=(review.errors||[]).map(function(e){return "["+((e.file||"?"))+"] "+(e.line?"Ln "+e.line+": ":"")+e.msg}).join("\n");
  var warnList=(review.warnings||[]).map(function(w){return "["+((w.file||"?"))+"] "+w.msg}).join("\n");
  var sys="Fix "+migratedResults.length+" files: "+sn+" "+sv+"→"+tn+" "+tv+" migration. Respond in "+ln+".\n\nFormat:\n---ACTION_PLAN---\n(numbered steps in "+ln+")\n---CORRECTED_FILES---\nJSON: {\"files\":{\"filename\":\"full source\",...}}\n---CHECKLIST---\n(verification items in "+ln+")";
  var usr="ORIGINAL CODEBASE ("+sn+" "+sv+"):\n"+origManifest+"\n\n===\n\nMIGRATED CODEBASE ("+tn+" "+tv+"):\n"+migManifest+"\n\nSCORE: "+review.score+"/100\n\nERRORS:\n"+errList+"\n\nWARNINGS:\n"+warnList+"\n\nGenerate fix plan in "+ln+". Return ALL "+migratedResults.length+" files.";
  try {
    var txt=await callClaude(sys,usr,mid,10000,{timeout:75000});
    var plan="",filesJson=null,checklist="";
    var parts=txt.split(/---(?:ACTION_PLAN|CORRECTED_FILES|CHECKLIST)---/);
    if (parts.length>=4) {
      plan=parts[1].trim();
      var codeBlock=parts[2].replace(/^```json?\n?/gm,"").replace(/\n?```$/gm,"").trim();
      try { filesJson=JSON.parse(codeBlock); filesJson=filesJson.files||filesJson; } catch(e){ filesJson=null; }
      checklist=parts[3].trim();
    } else if (parts.length>=2) {
      plan=parts[1]?parts[1].trim():"";
      checklist=parts[3]?parts[3].trim():"";
    } else { plan=txt; }
    return {ok:true,plan:plan,files:filesJson,checklist:checklist};
  } catch(e) { return {ok:false,error:e.message}; }
}

// Safe JSON parse — returns null instead of throwing
function safeParseJSON(str) {
  try { return JSON.parse(str.replace(/^```json?\n?/gm,"").replace(/\n?```$/gm,"").trim()); }
  catch(e) { return null; }
}

function mkDiff(a,b) {
  var ol=a.split("\n"),nl=b.split("\n"),d=[];
  var oi=0,ni=0;
  while(oi<ol.length||ni<nl.length) {
    if (oi<ol.length&&ni<nl.length) {
      if (ol[oi]===nl[ni]) { d.push({t:"same",o:ol[oi],n:nl[ni],oN:oi+1,nN:ni+1}); oi++; ni++; }
      else { d.push({t:"mod",o:ol[oi],n:nl[ni],oN:oi+1,nN:ni+1}); oi++; ni++; }
    } else if (oi<ol.length) { d.push({t:"del",o:ol[oi],n:"",oN:oi+1,nN:null}); oi++; }
    else { d.push({t:"add",o:"",n:nl[ni],oN:null,nN:ni+1}); ni++; }
  }
  return d;
}

function mkRisks(sl,tl) {
  var r=[];
  if (sl!==tl) r.push({lv:"high",cat:"Cross-Language",msg:"Cambios arquitectónicos"});
  if (sl==="javascript") r.push({lv:"medium",cat:"Async",msg:"Callbacks a async/await"});
  if (sl==="java") r.push({lv:"medium",cat:"APIs",msg:"APIs legacy"});
  if (sl==="csharp") r.push({lv:"high",cat:"Framework",msg:"System.Web, ConfigMgr"});
  if (sl==="python") r.push({lv:"medium",cat:"Sintaxis",msg:"print, urllib2"});
  return r;
}

// Minimal syntax highlighting — returns array of {text,color} segments
function syntaxHL(line,lang) {
  if (!line) return [{text:"",color:null}];
  var segs=[],i=0,s=line;
  // Comment detection
  var cc=lang==="python"||lang==="ruby"?"#":"//";
  var ci=s.indexOf(cc);
  // Skip if inside a string
  var inStr=false;
  if (ci>=0) {
    for(var j=0;j<ci;j++){if(s[j]==="'"||s[j]==='"')inStr=!inStr}
    if (!inStr) return [{text:s.slice(0,ci),color:null},{text:s.slice(ci),color:"#6a9955"}];
  }
  // Keywords per language group
  var kw;
  if (lang==="python"||lang==="ruby") kw=/\b(def|class|import|from|return|if|else|elif|for|while|try|except|finally|with|as|in|not|and|or|is|None|True|False|self|yield|async|await|raise|lambda|pass|break|continue|require|do|end|module|begin|rescue|puts|attr_accessor)\b/g;
  else if (lang==="java"||lang==="kotlin"||lang==="csharp") kw=/\b(public|private|protected|class|interface|enum|extends|implements|return|if|else|for|while|switch|case|break|try|catch|finally|throw|throws|new|import|package|static|final|void|int|String|boolean|double|float|long|var|val|fun|override|abstract|sealed|record|using|namespace|async|await|null|true|false|this|super|readonly|const|get|set)\b/g;
  else kw=/\b(var|let|const|function|class|return|if|else|for|while|switch|case|break|try|catch|finally|throw|new|import|export|from|require|module|async|await|yield|null|undefined|true|false|this|super|typeof|instanceof|default|extends|of|in)\b/g;
  // Tokenize: strings, keywords, numbers, rest
  var re=/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)/g;
  var parts=[],lastIdx=0,m;
  while((m=re.exec(s))!==null){
    if(m.index>lastIdx)parts.push({t:s.slice(lastIdx,m.index),k:"code"});
    if(m[1])parts.push({t:m[1],k:"str"});
    else if(m[2])parts.push({t:m[2],k:"num"});
    lastIdx=re.lastIndex;
  }
  if(lastIdx<s.length)parts.push({t:s.slice(lastIdx),k:"code"});
  // Apply keywords to "code" parts
  var result=[];
  parts.forEach(function(p){
    if(p.k==="str"){result.push({text:p.t,color:"#ce9178"});return;}
    if(p.k==="num"){result.push({text:p.t,color:"#b5cea8"});return;}
    // Split by keywords
    var last=0;kw.lastIndex=0;
    var km;
    while((km=kw.exec(p.t))!==null){
      if(km.index>last)result.push({text:p.t.slice(last,km.index),color:null});
      result.push({text:km[0],color:"#569cd6"});
      last=kw.lastIndex;
    }
    if(last<p.t.length)result.push({text:p.t.slice(last),color:null});
  });
  return result.length?result:[{text:s,color:null}];
}

var THEMES={
  light:{bg:"#F5F7FA",w:"#FFFFFF",nv:"#0C1E3F",nvL:"#1A3A6B",bl:"#2563EB",blP:"#DBEAFE",blM:"#EFF6FF",bd:"#D0D8E4",bdL:"#E4EAF1",tx:"#0F1A2A",txM:"#4A5568",txD:"#8896AB",g:"#059669",r:"#E5484D",y:"#E8A317",cBg:"#F0F3F7",f:"'Fira Code',monospace",ui:"'Outfit',system-ui,sans-serif",
    addBg:"#EEFBF5",addBd:"#99F0D0",delBg:"#FFF0F0",delBd:"#FECACA",modBg:"#FFF8EB",modBd:"#FDE68A",
    okBg:"#EEFBF5",okBd:"#99F0D0",warnBg:"#FFF8EB",warnBd:"#FDE68A",warnTx:"#92400E",errBg:"#FFF0F0",errBd:"#FECACA",
    hdrBg:"#FFFFFF",gradA:"#0C1E3F",gradB:"#2563EB",inputBg:"#FFFFFF",hoverBg:"#F0F3F7",selBg:"#EEFBF5",
    scoreLow:"#FFF0F0",scoreMed:"#FFF8EB",scoreHi:"#EEFBF5",tagBg:"#F0F3F7",
    modalBg:"rgba(10,15,25,.35)",shadowSm:"0 1px 3px rgba(0,0,0,.06),0 0 0 1px rgba(0,0,0,.03)",shadowLg:"0 24px 48px rgba(0,0,0,.12)"},
  dark:{bg:"#0A0D14",w:"#111620",nv:"#94A3B8",nvL:"#7E8FA6",bl:"#5B8DBF",blP:"#172A42",blM:"#0F1730",bd:"#1E2738",bdL:"#161D2B",tx:"#E4E9F2",txM:"#8896AB",txD:"#4F5D73",g:"#4ADE80",r:"#F87171",y:"#FBBF24",cBg:"#0E1219",f:"'Fira Code',monospace",ui:"'Outfit',system-ui,sans-serif",
    addBg:"#0B1F15",addBd:"#166534",delBg:"#1C0F11",delBd:"#991B1B",modBg:"#1A1808",modBd:"#92400E",
    okBg:"#0B1F15",okBd:"#166534",warnBg:"#1A1808",warnBd:"#92400E",warnTx:"#D4A017",errBg:"#1C0F11",errBd:"#991B1B",
    hdrBg:"#0E1219",gradA:"#3B6B9E",gradB:"#5B6BAE",inputBg:"#161D2B",hoverBg:"#131924",selBg:"#152A42",
    scoreLow:"#1C0F11",scoreMed:"#1A1808",scoreHi:"#0B1F15",tagBg:"#161D2B",
    modalBg:"rgba(0,0,0,.75)",shadowSm:"0 1px 3px rgba(0,0,0,.3),0 0 0 1px rgba(255,255,255,.03)",shadowLg:"0 24px 48px rgba(0,0,0,.5)"}
};

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

  // Auto-collapse sidebar on mobile
  useEffect(function(){if(migPhase==="done"&&res.length>0){var already=hist.some(function(h){return h._migTs===migStartTs});if(!already&&migStartTs>0){var ml2=MODELS.find(function(m){return m.id===mod});var dur=migStartTs>0?Date.now()-migStartTs:0;var aud=auditTrail&&auditTrail.phases&&auditTrail.phases.length>0?Object.assign({},auditTrail):{id:"MIG-"+migStartTs,phases:logs.filter(function(l){return l.type==="phase"}).map(function(l,i){return{id:l.subPhase?l.phase.charAt(0).toUpperCase()+l.iter:l.phase.charAt(0).toUpperCase(),name:l.phase+(l.iter?" #"+l.iter:""),phase:l.phase,durationMs:l.durationMs||0,status:l.st||"done",detail:l.detail||"",score:l.score}}),config:{source:(LANGS[sL]||{}).n+" "+sV,target:(LANGS[tL]||{}).n+" "+tV,model:ml2?ml2.n:"",fileCount:files.length}};if(!aud.totalDurationMs)aud.totalDurationMs=dur;if(!aud.startedAt)aud.startedAt=new Date(migStartTs).toISOString();if(!aud.completedAt)aud.completedAt=new Date().toISOString();if(aud.finalScore===null||aud.finalScore===undefined){var sc=null;if(intR&&intR.ok&&intR.result)sc=intR.result.score;if(sc===null&&aud.phases){aud.phases.forEach(function(ph){if(ph.score!==undefined&&ph.score!==null&&(sc===null||ph.score>sc))sc=ph.score})}aud.finalScore=sc}setAuditTrail(aud);setHist(function(p){return [{id:Date.now(),_migTs:migStartTs,date:new Date().toLocaleString(),from:(LANGS[sL]||{}).n+" "+sV,to:(LANGS[tL]||{}).n+" "+tV,ml:ml2?ml2.n:"",fc:files.length,results:res,risks:rsk,integration:intR,audit:aud}].concat(p)})}}},[migPhase]);

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

    var LANG_META={python:{desc:"Versatile high-level language",strengths:["AI/ML","Data Science","Scripting","Web"],migrateTo:["javascript","typescript","java","go","rust"],ecosystem:"470k+ packages"},javascript:{desc:"The language of the web",strengths:["Frontend","Node.js","Full Stack","Real-time"],migrateTo:["typescript","python","go","rust","java"],ecosystem:"2M+ packages"},typescript:{desc:"JavaScript with superpowers",strengths:["Type Safety","Enterprise","Angular/React","APIs"],migrateTo:["javascript","python","java","csharp","go"],ecosystem:"npm compatible"},java:{desc:"Enterprise-grade platform",strengths:["Enterprise","Android","Microservices","Spring"],migrateTo:["kotlin","python","typescript","go","csharp"],ecosystem:"500k+ artifacts"},csharp:{desc:".NET ecosystem powerhouse",strengths:[".NET/Azure","Unity","Enterprise","Desktop"],migrateTo:["java","typescript","python","go","rust"],ecosystem:"350k+ packages"},go:{desc:"Cloud-native simplicity",strengths:["Cloud/DevOps","Microservices","CLI Tools","Concurrency"],migrateTo:["rust","python","typescript","java","csharp"],ecosystem:"Growing fast"},rust:{desc:"Performance without compromise",strengths:["Systems","WebAssembly","Security","Performance"],migrateTo:["go","csharp","typescript","python","java"],ecosystem:"120k+ crates"},php:{desc:"Web development workhorse",strengths:["WordPress","Laravel","Web APIs","CMS"],migrateTo:["python","typescript","go","java","ruby"],ecosystem:"350k+ packages"},ruby:{desc:"Developer happiness first",strengths:["Rails","Prototyping","Scripting","DevOps"],migrateTo:["python","typescript","go","rust","java"],ecosystem:"175k+ gems"},kotlin:{desc:"Modern JVM language",strengths:["Android","Multiplatform","Spring","Coroutines"],migrateTo:["java","typescript","python","go","csharp"],ecosystem:"Java interop"}};

  var addToast=function(msg,type){var id=Date.now();setToasts(function(p){return p.concat([{id:id,msg:msg,type:type||"info"}])});setTimeout(function(){setToasts(function(p){return p.filter(function(t2){return t2.id!==id})})},4000)};

  var go=async function(){
    if (!files.length||!tL||!tV) return;
    setVw("migrating");setProg(0);setRes([]);setLogs([]);setTOut(null);setAiR(null);setDeepR(null);setFixR(null);setIntR(null);setCbA(null);setMigPhase("analysis");setAuditTrail(null);addToast(files.length+" archivo(s)","success");setMigStartTs(Date.now());cancelRef.current=false;
    _tks={i:0,o:0,calls:0,last:{i:0,o:0}};
    _cancelled=false;_activeController=null;
    // ═══ GLOBAL TIMEOUT: 8 minutes max — auto-cancel if pipeline hangs ═══
    var GLOBAL_TIMEOUT=Math.max(10*60*1000,(2*60*1000)+(files.length*90*1000)+(3*60*1000));
    if(globalTimerRef.current)clearTimeout(globalTimerRef.current);
    globalTimerRef.current=setTimeout(function(){
      if(cancelRef.current)return; // already cancelled
      _cancelled=true;cancelRef.current=true;
      if(_activeController)try{_activeController.abort()}catch(e){}
      setLogs(function(p){return p.concat([{type:"phase",phase:"global_timeout",st:"done",ts:Date.now(),detail:"Auto-cancelled: exceeded 8 min limit"}])});
      setMigPhase("done");
      setTimeout(function(){if(res.length)setVw("results");else setVw("upload")},1000);
    },GLOBAL_TIMEOUT);
    try { // ═══ PIPELINE TRY — catches cancellations and timeouts gracefully ═══
    var rr=mkRisks(sL,tL);setRsk(rr);
    var W={a:8,b:30,b2:12,c:35,d:15};
    var ml=MODELS.find(function(m){return m.id===mod});

    // ═══ AUDIT TRAIL — tracks every phase/sub-phase with timestamps ═══
    var migStart=Date.now();
    var audit={
      id:"MIG-"+migStart,
      startedAt:new Date(migStart).toISOString(),
      completedAt:null,
      totalDurationMs:0,
      config:{
        source:(LANGS[sL]||{}).n+" "+sV,
        target:(LANGS[tL]||{}).n+" "+tV,
        model:ml?ml.n:mod,
        modelId:mod,
        fileCount:files.length,
        fileNames:files.map(function(f){return f.name}),
        uiLanguage:uiL
      },
      phases:[],
      apiCalls:0
    };

    var phaseStart=function(id,name,meta){
      var entry={id:id,name:name,startedAt:new Date().toISOString(),startMs:Date.now(),completedAt:null,durationMs:0,status:"running"};
      if(meta)Object.keys(meta).forEach(function(k){entry[k]=meta[k]});
      audit.phases.push(entry);
      return entry;
    };
    var phaseEnd=function(entry,status,meta){
      entry.completedAt=new Date().toISOString();
      entry.durationMs=Date.now()-entry.startMs;
      entry.status=status||"done";
      if(meta)Object.keys(meta).forEach(function(k){entry[k]=meta[k]});
    };

    // ═══ PHASE A: Codebase Analysis (0-10%) ═══
    setMigPhase("analysis");
    setLogs([{type:"phase",phase:"analysis",st:"run",ts:Date.now()}]);
    setProg(2);
    var phA=phaseStart("A","Codebase Analysis");
    audit.apiCalls++;
    var cbCtx=await doCodebaseAnalysis(files,sL,sV,tL,tV,mod);
    phaseEnd(phA,cbCtx.ok?"done":"error",{detail:cbCtx.ok?(cbCtx.analysis.purpose||"OK"):"Error",ok:cbCtx.ok});
    setCbA(cbCtx);
    setLogs(function(p){return p.map(function(l){return l.phase==="analysis"?Object.assign({},l,{st:"done",detail:cbCtx.ok?(cbCtx.analysis.purpose||""):"Error",durationMs:Date.now()-l.ts}):l})});
    setProg(W.a);

    // ═══ PHASE B: Migrate files in dependency order, passing already-migrated context ═══
    setMigPhase("migration");
    var phB=phaseStart("B","File Migration",{fileCount:files.length,files:[]});
    var rs=[];
    var fc=files.length;
    var isCross=sL!==tL;

    // Sort files by dependency order from Phase A (leaves first, orchestrators last)
    var orderedFiles=files.slice();
    if (cbCtx&&cbCtx.ok&&cbCtx.analysis.migrationOrder) {
      var order=cbCtx.analysis.migrationOrder;
      orderedFiles.sort(function(a,b){
        var ai=order.findIndex(function(o){return a.name.indexOf(o)>=0||o.indexOf(a.name)>=0});
        var bi=order.findIndex(function(o){return b.name.indexOf(o)>=0||o.indexOf(b.name)>=0});
        if(ai<0)ai=999;if(bi<0)bi=999;
        return ai-bi;
      });
    }

    // ═══ Build cross-language file mapping (Phase A may also have suggested mappings) ═══
    var fileMap=[];
    if (isCross) {
      var aiMapping=(cbCtx&&cbCtx.ok&&cbCtx.analysis.fileMapping)||[];
      orderedFiles.forEach(function(f){
        // Try AI-suggested mapping first, then use automatic mapping
        var aiMap=aiMapping.find(function(m){return m.source===f.name||(f.path&&m.source===f.path)});
        if (aiMap) {
          fileMap.push({source:f.name,sourcePath:f.path||f.name,target:aiMap.target,targetPath:aiMap.targetPath||aiMap.target});
        } else {
          var mapped=mapTargetFile(f.name,f.path,sL,tL);
          fileMap.push({source:f.name,sourcePath:f.path||f.name,target:mapped.name,targetPath:mapped.path||mapped.name});
        }
      });
    }

    // Use function scope to avoid var closure bug with React batching
    // Per-file timeouts: plan 45s (0 retries) + migrate 60s (1 retry) = max ~2.75 min per file
    var migrateOneFile=async function(fileIdx){
      var f=orderedFiles[fileIdx];
      var thisName=f.name;
      // Get target filename for cross-language
      var mapping=isCross?fileMap.find(function(m){return m.source===f.name}):null;
      var targetFN=mapping?mapping.target:f.name;
      var targetPath=mapping?mapping.targetPath:(f.path||f.name);
      var lineCount=f.content.split("\n").length;

      // ═══ Adaptive Capacity: determine processing budget from codebase analysis ═══
      var fileComplexity="moderate", estChanges=0, procHints=null;
      if (cbCtx&&cbCtx.ok&&cbCtx.analysis.files) {
        var fi=cbCtx.analysis.files.find(function(af){return thisName.indexOf(af.name)>=0});
        if (fi) { fileComplexity=fi.complexity||"moderate"; estChanges=fi.estimatedChanges||0; procHints=fi.processingHints||null; }
      }
      var cap=calcCapacity(fileComplexity,lineCount,isCross,estChanges,procHints);

      var fileEntry={name:thisName,targetName:targetFN,startedAt:new Date().toISOString(),startMs:Date.now(),completedAt:null,durationMs:0,status:"running",changes:0,capacity:cap.label};
      phB.files.push(fileEntry);

      // Step 1: Plan — deep per-file analysis (timeout/tokens from capacity)
      setLogs(function(p){return p.concat([{type:"file",file:thisName,targetFile:targetFN,st:"planning",ts:Date.now(),capacity:cap}])});
      audit.apiCalls++;
      var filePlan={ok:false};
      try {
        filePlan=await doFilePlan(f.content,thisName,sL,sV,tL,tV,mod,cbCtx,rs,targetFN,cap);
      } catch(planErr) {
        filePlan={ok:false,error:planErr.message};
      }
      var planChanges=filePlan.ok&&filePlan.plan?filePlan.plan.totalChanges||0:0;
      var planComplexity=filePlan.ok&&filePlan.plan?filePlan.plan.complexity||fileComplexity:fileComplexity;

      // Recalculate capacity if plan revealed different complexity
      if (planComplexity!==fileComplexity) {
        cap=calcCapacity(planComplexity,lineCount,isCross,planChanges||estChanges,procHints);
      }

      setLogs(function(p){return p.map(function(l){
        if(l.file!==thisName||l.type!=="file")return l;
        return Object.assign({},l,{st:"migrating",planChanges:planChanges,planComplexity:planComplexity,planOk:filePlan.ok,capacity:cap});
      })});

      // Step 2: Migrate — execute the plan (tokens/timeout from capacity)
      audit.apiCalls++;
      var r=await doMigrate(f.content,thisName,sL,sV,tL,tV,mod,pr,cbCtx,rs,targetFN,isCross?fileMap:null,filePlan,cap);
      var d=mkDiff(f.content,r.migrated);
      rs.push(Object.assign({},f,r,{diff:d,targetName:targetFN,targetPath:targetPath,isCross:isCross}));
      var thisChanges=r.changes.length;
      fileEntry.completedAt=new Date().toISOString();
      fileEntry.durationMs=Date.now()-fileEntry.startMs;
      fileEntry.status=r.engine==="fallback"?"error":"done";
      fileEntry.changes=thisChanges;
      fileEntry.engine=r.engine;
      setLogs(function(p){return p.map(function(l){
        if(l.file!==thisName||l.type!=="file")return l;
        var preview=r.changes.slice(0,3);
        var linesOrig=f.content.split("\n").length;
        var linesMig=r.migrated.split("\n").length;
        return Object.assign({},l,{st:"done",ch:thisChanges,durationMs:Date.now()-l.ts,preview:preview,linesOrig:linesOrig,linesMig:linesMig,tkI:_tks.last.i,tkO:_tks.last.o,capacity:cap});
      })});
      setProg(Math.round(W.a+W.b*((fileIdx+1)/fc)));
      setRes(rs.slice());
    };
    for (var i=0;i<fc;i++) { if (cancelRef.current) break; await migrateOneFile(i); }
    // Safety: ensure ALL file logs are marked done (handles any remaining closure edge cases)
    setLogs(function(p){return p.map(function(l){return l.type==="file"&&l.st!=="done"?Object.assign({},l,{st:"done",ch:l.ch||0}):l})});
    phaseEnd(phB,"done",{fileCount:fc});

    // ═══ PHASE B2: Consolidation — 2-phase: audit dependencies then fix ═══
    if (fc>1 && !cancelRef.current) {
      setMigPhase("consolidation");
      var isCross=sL!==tL;

      // B2a: Dependency Audit — map every connection before touching code
      var phB2a=phaseStart("B2a","Dependency Audit",{fileCount:fc});
      setLogs(function(p){return p.concat([{type:"phase",phase:"consolidation",subPhase:"audit",st:"run",ts:Date.now(),label:"Auditing cross-file dependencies..."}])});
      setProg(W.a+W.b+1);
      audit.apiCalls++;
      var depAudit=await doDependencyAudit(orderedFiles,rs,sL,sV,tL,tV,mod);
      var auditIssues=depAudit.ok&&depAudit.audit?(depAudit.audit.issues||[]).length:0;
      var auditConns=depAudit.ok&&depAudit.audit?(depAudit.audit.connections||[]).length:0;
      var auditBroken=depAudit.ok&&depAudit.audit?(depAudit.audit.connections||[]).filter(function(c){return !c.compatible}).length:0;
      phaseEnd(phB2a,"done",{issues:auditIssues,connections:auditConns,broken:auditBroken});
      setLogs(function(p){return p.map(function(l){return l.subPhase==="audit"&&l.type==="phase"?Object.assign({},l,{st:"done",issues:auditIssues,connections:auditConns,broken:auditBroken,durationMs:Date.now()-l.ts}):l})});

      // B2b: Consolidation Fix — use audit results to fix all issues
      var phB2b=phaseStart("B2b","Consolidation Fix",{fileCount:fc,auditIssues:auditIssues});
      setLogs(function(p){return p.concat([{type:"phase",phase:"consolidation",subPhase:"fix",st:"run",ts:Date.now(),label:"Fixing "+auditIssues+" issues across "+fc+" files..."}])});
      setProg(W.a+W.b+3);
      audit.apiCalls++;
      var consResult=await doConsolidation(orderedFiles,rs,sL,sV,tL,tV,mod,depAudit);
      if (consResult.ok&&consResult.files) {
        var consFixed=0;
        rs=rs.map(function(r){
          var consolidated=consResult.files[r.targetName||r.name]||consResult.files[r.name];
          if (consolidated&&consolidated!==r.migrated) {
            consFixed++;
            return Object.assign({},r,{migrated:consolidated,diff:mkDiff(r.content,consolidated),changes:r.changes.concat(["Cross-file consolidation"])});
          }
          return r;
        });
        setRes(rs.slice());
        phaseEnd(phB2b,"done",{fixedFiles:consFixed,totalFixes:(consResult.fixes||[]).length});
        setLogs(function(p){return p.map(function(l){return l.subPhase==="fix"&&l.type==="phase"?Object.assign({},l,{st:"done",fixed:consFixed,fixes:(consResult.fixes||[]).length,durationMs:Date.now()-l.ts}):l})});
      } else {
        phaseEnd(phB2b,"error",{error:consResult.error||"parse error"});
        setLogs(function(p){return p.map(function(l){return l.subPhase==="fix"&&l.type==="phase"?Object.assign({},l,{st:"error"}):l})});
      }
      setProg(W.a+W.b+W.b2);
    }

    // ═══ PHASE C+D LOOP: Check → Fix → Re-check (up to 2 iterations, stall detection) ═══
    // With strict 8-layer scoring, 90+ means production-ready
    var INT_PASS=90, INT_MAX=2;
    setMigPhase("integration");
    var intCheck=null, intIter=0, prevCtx=null, prevIssues=null, lastScore=-1;
    var bestScore=-1, bestRs=null; // Track best results for rollback
    for (var ii=0;ii<INT_MAX;ii++){
      if (cancelRef.current) break;
      intIter=ii+1;

      // C: Validate integration
      var phC=phaseStart("C"+intIter,"Integration Check #"+intIter,{iteration:intIter});
      setLogs(function(p){
        var existing=p.filter(function(l){return !(l.phase==="integration"&&l.type==="phase"&&l.st==="run")});
        return existing.concat([{type:"phase",phase:"integration",st:"run",iter:intIter,ts:Date.now()}]);
      });
      var progC=W.a+W.b+W.b2+Math.round((W.c+W.d)*(ii/(INT_MAX)))+2;
      setProg(progC);
      audit.apiCalls++;
      intCheck=await doIntegrationCheck(files,rs,sL,sV,tL,tV,mod,uiL,prevCtx);
      var intScore=intCheck.ok?(intCheck.result.score||0):0;
      var intIssues=intCheck.ok?(intCheck.result.issues||[]):[];
      var intAllIssues=intIssues.length;
      var critCount=intIssues.filter(function(x){return x.severity==="critical"}).length;
      var majorCount=intIssues.filter(function(x){return x.severity==="major"}).length;
      var modCount=intIssues.filter(function(x){return x.severity==="moderate"}).length;
      phaseEnd(phC,intCheck.ok?"done":"error",{score:intScore,issueCount:intAllIssues,criticalCount:critCount,majorCount:majorCount,moderateCount:modCount});

      setLogs(function(p){return p.map(function(l){return l.phase==="integration"&&l.type==="phase"&&l.st==="run"?Object.assign({},l,{st:"checked",score:intScore,issues:intAllIssues,iter:intIter,durationMs:Date.now()-l.ts}):l})});

      // ═══ REGRESSION GUARD: if score dropped after a fix, rollback to best version ═══
      if (ii>0 && bestScore>0 && intScore<bestScore-2) {
        // Score regressed — rollback to the best version we had
        rs=bestRs.map(function(r){return Object.assign({},r)});
        setRes(rs.slice());
        // Mark the audit phase as rolled back
        phC.rolledBack=true;
        phC.rolledBackScore=intScore;
        phC.score=bestScore;
        // Mark the current check log as rolled back (so chart excludes it)
        setLogs(function(p){
          var updated=p.map(function(l){
            if(l.phase==="integration"&&l.type==="phase"&&l.iter===intIter&&l.st==="checked")
              return Object.assign({},l,{st:"rolled_back",rolledBackScore:intScore});
            return l;
          });
          return updated.concat([{type:"phase",phase:"rollback",st:"done",iter:intIter,score:bestScore,prevScore:intScore,ts:Date.now(),detail:"Score dropped "+bestScore+" → "+intScore+", rolled back to best"}]);
        });
        // Restore best score for final audit
        intCheck=Object.assign({},intCheck,{result:Object.assign({},intCheck.result,{score:bestScore})});
        intScore=bestScore;
        break;
      }

      // Track best results
      if (intScore>bestScore) {
        bestScore=intScore;
        bestRs=rs.map(function(r){return Object.assign({},r)});
      }

      // Pass if score >= 90 with no critical/major issues
      var blockingIssues=intIssues.filter(function(is){return is.severity==="critical"||is.severity==="major"});
      if (intScore>=INT_PASS && blockingIssues.length===0) {
        setLogs(function(p){return p.map(function(l){return l.phase==="integration"&&l.type==="phase"?Object.assign({},l,{st:"done",score:intScore,issues:intAllIssues,iter:intIter,pass:true,durationMs:Date.now()-(l.ts||Date.now())}):l})});
        break;
      }

      // ═══ STALL DETECTION: if score didn't improve by >=3 pts after a fix, stop ═══
      if (ii>0 && lastScore>=0 && intScore<=lastScore+2) {
        setLogs(function(p){return p.concat([{type:"phase",phase:"stall",st:"done",iter:intIter,score:intScore,prevScore:lastScore,ts:Date.now()}])});
        break;
      }
      lastScore=intScore;

      // D: Fix — iteration 1 fixes all (including quality gaps), later iterations focus critical+major
      var fixableIssues=intIter<=2?intIssues:intIssues.filter(function(is){return is.severity==="critical"||is.severity==="major"||is.severity==="moderate"});
      if (fixableIssues.length===0) fixableIssues=intIssues; // fallback to all if filter is empty
      var phD=phaseStart("D"+intIter,"Integration Fix #"+intIter,{iteration:intIter,issueCount:fixableIssues.length});
      setMigPhase("qa");
      setLogs(function(p){return p.concat([{type:"phase",phase:"qa",st:"run",iter:intIter,issues:fixableIssues.length,ts:Date.now()}])});
      setProg(progC+Math.round((W.c+W.d)/(INT_MAX*2)));
      audit.apiCalls++;
      var fixResult=await doIntegrationFix(files,rs,fixableIssues,sL,sV,tL,tV,mod,intIter,prevIssues);
      var fixedFileCount=0;
      if (fixResult.ok&&fixResult.files) {
        rs=rs.map(function(r){
          var fixedCode=fixResult.files[r.targetName||r.name]||fixResult.files[r.name];
          if (fixedCode && fixedCode!==r.migrated) {
            fixedFileCount++;
            return Object.assign({},r,{migrated:fixedCode,diff:mkDiff(r.content,fixedCode),changes:r.changes.concat(["Integration fix #"+intIter]),intFixed:true});
          }
          return r;
        });
        setRes(rs.slice());
      }
      phaseEnd(phD,fixResult.ok?"done":"error",{fixedFiles:fixedFileCount,ok:fixResult.ok});
      setLogs(function(p){return p.map(function(l){return l.phase==="qa"&&l.type==="phase"&&l.st==="run"?Object.assign({},l,{st:"done",fixed:fixResult.ok,fixedFiles:fixedFileCount,iter:intIter,durationMs:Date.now()-l.ts}):l})});

      // Save current issues for escalation on next iteration
      prevIssues=intIssues;
      prevCtx={
        verified:(intCheck.ok?(intCheck.result.verified||[]):[]),
        fixedIssues:(intIssues||[]).length,
        modifiedFiles:[],
        untouchedFiles:[]
      };
    }
    setProg(100);
    if(globalTimerRef.current){clearTimeout(globalTimerRef.current);globalTimerRef.current=null;}
    _cancelled=false;_activeController=null;
    setMigPhase("done");
    setIntR(intCheck);
    audit.completedAt=new Date().toISOString();
    audit.totalDurationMs=Date.now()-migStart;
    audit.finalScore=intCheck&&intCheck.ok?intCheck.result.score:null;
    audit.finalPass=intCheck&&intCheck.ok?intCheck.result.pass:false;
    audit.phases.forEach(function(ph){delete ph.startMs;if(ph.files)ph.files.forEach(function(f){delete f.startMs})});
    setAuditTrail(audit);
    setHist(function(p){return [{id:Date.now(),date:new Date().toLocaleString(),from:(LANGS[sL]||{}).n+" "+sV,to:(LANGS[tL]||{}).n+" "+tV,ml:ml?ml.n:"",fc:files.length,results:rs,risks:rr,integration:intCheck,codebaseAnalysis:cbCtx,audit:audit}].concat(p)});
    if(document.hidden){document.title=APP.n;setTimeout(function(){document.title=APP.n},10000);}
    } catch(pipeErr) {
      if(globalTimerRef.current){clearTimeout(globalTimerRef.current);globalTimerRef.current=null;}
      _cancelled=false;_activeController=null;
      audit.completedAt=new Date().toISOString();
      audit.totalDurationMs=Date.now()-migStart;
      audit.finalScore=(function(){var bs=null;audit.phases.forEach(function(ph){if(ph.score!==undefined&&ph.score!==null&&(bs===null||ph.score>bs))bs=ph.score});return bs})();
      audit.phases.forEach(function(ph){delete ph.startMs;if(ph.files)ph.files.forEach(function(f){delete f.startMs})});
      setAuditTrail(audit);
      setIntR(intR);
      setMigPhase("done");
      if(res.length>0){
        setHist(function(p){return [{id:Date.now(),date:new Date().toLocaleString(),from:(LANGS[sL]||{}).n+" "+sV,to:(LANGS[tL]||{}).n+" "+tV,ml:(MODELS.find(function(m){return m.id===mod})||{}).n||"",fc:files.length,results:res,risks:rsk}].concat(p)});
        setTimeout(function(){setVw("results")},1500);
      }
    }
  };
  var rst=function(){setVw("upload");setFiles([]);setSL("");setSV("");setTL("");setTV("");setRes([]);setRsk([]);setShR(false);setSelF(null);setLogs([]);setDet(null);setMan(false);setTOut(null);setDeepR(null);setDeepLd(false);setAiR(null);setFixR(null);setFixLd(false);setIntR(null);setCbA(null);setMigPhase("");setAuditTrail(null);setAudTab("pipeline");setAudExpand({});setAndReport(null);setAndReportLd(false);setShAndReport(false);setQaTests(null);setQaTestsLd(false);setQaPreR(null);setQaPostR(null);setShQaPanel(false);setQaVPreR(null);setQaVPostR(null);setQaTab("sandbox")};
  var generatePDF=async function(){
    setPdfLd(true);
    try{
      var sl2=LANGS[sL]||{};var tl2=LANGS[tL]||{};
      var ml2=MODELS.find(function(m){return m.id===mod})||{};
      var h="<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>MigraOps Report</title>";
      h+="<style>body{font-family:Segoe UI,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1e293b}";
      h+="h1{font-size:22px;border-bottom:2px solid #2563eb;padding-bottom:8px}";
      h+="h2{font-size:16px;margin-top:20px;color:#2563eb}table{width:100%;border-collapse:collapse;margin:10px 0}";
      h+="th,td{padding:6px 10px;border:1px solid #e2e8f0;text-align:left;font-size:12px}th{background:#f1f5f9;font-weight:700}";
      h+="pre{background:#f8fafc;border:1px solid #e2e8f0;padding:10px;border-radius:6px;font-size:10px;overflow-x:auto;white-space:pre-wrap}";
      h+=".badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700}";
      h+="@media print{body{padding:0}}</style></head><body>";
      h+="<h1>MigraOps v"+APP.v+" — Migration Report</h1>";
      h+="<p><strong>Date:</strong> "+new Date().toLocaleString()+"</p>";
      h+="<p><strong>Source:</strong> "+sl2.i+" "+sl2.n+" "+sV+" &rarr; <strong>Target:</strong> "+tl2.i+" "+tl2.n+" "+tV+"</p>";
      h+="<p><strong>Model:</strong> "+(ml2.n||"")+" &middot; <strong>Files:</strong> "+files.length+"</p>";
      if(auditTrail&&auditTrail.finalScore!==null){
        h+="<p><strong>Score:</strong> <span class=\"badge\" style=\"background:"+(auditTrail.finalScore>=90?"#dcfce7;color:#059669":"#fef9c3;color:#d97706")+"\">"+auditTrail.finalScore+"/100</span></p>";
      }
      h+="<h2>Files Migrated ("+res.length+")</h2><table><tr><th>Source</th><th>Target</th><th>Lines</th></tr>";
      res.forEach(function(r){
        var lines2=r.migrated?r.migrated.split("\n").length:0;
        h+="<tr><td>"+r.name+"</td><td>"+(r.targetName||r.name)+"</td><td>"+lines2+"</td></tr>";
      });
      h+="</table>";
      res.forEach(function(r,i){
        h+="<h2>"+(i+1)+". "+(r.targetName||r.name)+"</h2>";
        if(r.migrated){h+="<pre>"+r.migrated.replace(/</g,"&lt;").replace(/>/g,"&gt;").slice(0,3000)+"</pre>";}
      });
      if(rsk&&rsk.length>0){
        h+="<h2>Risks ("+rsk.length+")</h2><table><tr><th>File</th><th>Risk</th><th>Level</th></tr>";
        rsk.forEach(function(r){h+="<tr><td>"+(r.file||"")+"</td><td>"+(r.msg||r.risk||"")+"</td><td>"+(r.level||"")+"</td></tr>"});
        h+="</table>";
      }
      h+="<hr><p style=\"font-size:10px;color:#94a3b8\">Generated by MigraOps v"+APP.v+" — "+APP.co+"</p></body></html>";
      var win=window.open("","_blank");
      if(win){win.document.write(h);win.document.close();win.focus();setTimeout(function(){win.print()},500)}
    }catch(e){console.error("PDF error:",e)}
    setPdfLd(false);
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

  var ScoreTrend=function(props){
    var data=props.data||[];
    if(data.length<2)return null;
    var items=data.slice(0,12).reverse();
    return <div style={{padding:"12px 16px"}}>
      <div style={{display:"flex",alignItems:"flex-end",gap:3,height:70}}>
        {items.map(function(h,i){
          var sc=h.audit&&h.audit.finalScore?h.audit.finalScore:0;
          var clr=sc>=90?"#059669":sc>=70?"#D97706":sc>0?"#DC2626":T.bdL;
          return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <div style={{width:"100%",background:clr,borderRadius:"3px 3px 0 0",height:Math.max(4,sc*0.65),transition:"height .3s",opacity:.85}}/>
            <span style={{fontSize:7,color:T.txD,fontFamily:T.f}}>{sc||"-"}</span>
          </div>})}
      </div>
    </div>
  };

    var bR=function(lv){var m={high:{bg:T.errBg,c:T.r,l:t.hi},medium:{bg:T.warnBg,c:T.y,l:t.med},low:{bg:T.okBg,c:T.g,l:t.lo}};var x=m[lv]||m.low;return <span style={{padding:"2px 8px",borderRadius:16,fontSize:9,fontWeight:700,background:x.bg,color:x.c}}>{x.l}</span>};

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.tx,fontFamily:T.ui}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fira+Code:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style dangerouslySetInnerHTML={{__html:"@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.8}}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes float1{0%,100%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(30px,-20px) rotate(120deg)}66%{transform:translate(-20px,15px) rotate(240deg)}}@keyframes float2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-25px,20px) scale(1.1)}}@keyframes float3{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(15px,-30px) rotate(90deg)}75%{transform:translate(-10px,25px) rotate(270deg)}}@keyframes glow{0%,100%{box-shadow:0 0 5px rgba(37,99,235,.2)}50%{box-shadow:0 0 20px rgba(37,99,235,.4)}}button:hover{filter:brightness(1.1)!important}input:focus,select:focus,textarea:focus{outline:none!important;border-color:rgba(37,99,235,.5)!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important}*{scrollbar-width:thin}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{border-radius:3px}"}}/>
      <style dangerouslySetInnerHTML={{__html:".hv-glow{transition:all .15s}.hv-glow:hover{background:rgba(37,99,235,.15)!important;box-shadow:inset 3px 0 0 #3B82F6!important}.hv-lift{transition:transform .2s,box-shadow .2s}.hv-lift:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08)}.hv-grow{transition:transform .2s}.hv-grow:hover{transform:scale(1.1)}.gtl{background:linear-gradient(135deg,#4338CA,#2563EB,#1D4ED8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.gtd{background:linear-gradient(135deg,#C7D2FE,#93A3F8,#60A5FA);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}"}}/>
      <style dangerouslySetInnerHTML={{__html:".hv-glow{transition:all .15s}.hv-glow:hover{background:rgba(37,99,235,.15)!important;box-shadow:inset 3px 0 0 #3B82F6!important}.hv-lift{transition:transform .2s,box-shadow .2s}.hv-lift:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08)}.hv-grow{transition:transform .2s}.hv-grow:hover{transform:scale(1.08)}"}}/>
      {!isLoggedIn&&<div style={{position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",background:dark?"#0B1120":"#F8FAFC",overflow:"hidden"}}>
        {/* Aurora mesh - more visible */}
        <div style={{position:"absolute",inset:0,overflow:"hidden"}}>
          <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55vw",height:"55vw",borderRadius:"50%",background:dark?"radial-gradient(circle,rgba(99,102,241,.25) 0%,transparent 65%)":"radial-gradient(circle,rgba(99,102,241,.15) 0%,transparent 65%)",animation:"float2 18s ease-in-out infinite"}}/>
          <div style={{position:"absolute",bottom:"-15%",right:"-10%",width:"50vw",height:"50vw",borderRadius:"50%",background:dark?"radial-gradient(circle,rgba(37,99,235,.22) 0%,transparent 65%)":"radial-gradient(circle,rgba(37,99,235,.12) 0%,transparent 65%)",animation:"float1 22s ease-in-out infinite"}}/>
          <div style={{position:"absolute",top:"25%",right:"5%",width:"35vw",height:"35vw",borderRadius:"50%",background:dark?"radial-gradient(circle,rgba(14,165,233,.15) 0%,transparent 65%)":"radial-gradient(circle,rgba(14,165,233,.08) 0%,transparent 65%)",animation:"float3 26s ease-in-out infinite"}}/>
          <div style={{position:"absolute",bottom:"15%",left:"10%",width:"30vw",height:"30vw",borderRadius:"50%",background:dark?"radial-gradient(circle,rgba(139,92,246,.12) 0%,transparent 65%)":"radial-gradient(circle,rgba(139,92,246,.08) 0%,transparent 65%)",animation:"float1 20s ease-in-out infinite reverse"}}/>
          {/* Subtle grid */}
          <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient("+(dark?"rgba(255,255,255,.03)":"rgba(0,0,0,.03)")+" 1px,transparent 1px)",backgroundSize:"32px 32px"}}/>
          {/* Wire shapes */}
          <div style={{position:"absolute",top:"8%",left:"12%",width:120,height:120,borderRadius:24,border:"1px solid "+(dark?"rgba(255,255,255,.06)":"rgba(99,102,241,.1)"),animation:"float1 20s ease-in-out infinite"}}/>
          <div style={{position:"absolute",bottom:"12%",right:"14%",width:80,height:80,borderRadius:"50%",border:"1px solid "+(dark?"rgba(255,255,255,.04)":"rgba(37,99,235,.08)"),animation:"float3 24s ease-in-out infinite reverse"}}/>
        </div>
        {/* Content */}
        <div style={{position:"relative",zIndex:1,width:400,maxWidth:"90vw",textAlign:"center",animation:"fadeIn .6s ease"}}>
          {/* Logo mark */}
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:52,height:52,borderRadius:15,background:dark?"rgba(99,102,241,.12)":"rgba(99,102,241,.08)",border:"1px solid "+(dark?"rgba(99,102,241,.2)":"rgba(99,102,241,.15)"),marginBottom:28}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dark?"#A5B4FC":"#6366F1"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/><path d="M14 4l-4 16"/></svg></div>
          {/* Brand */}
          <h1 className={dark?"gtd":"gtl"} style={{fontSize:isMobile?38:52,fontWeight:800,letterSpacing:"-.05em",lineHeight:1.1,margin:"0 0 8px",padding:"4px 0",color:dark?"#E0E7FF":"#4338CA"}}>{APP.n}</h1>
          {/* Tagline */}
          <p style={{fontSize:15,color:dark?"rgba(255,255,255,.35)":"#64748B",fontWeight:400,margin:"0 0 36px",letterSpacing:"-.01em"}}>{"Code intelligence platform"}</p>
          {/* Login card */}
          <div style={{background:dark?"rgba(255,255,255,.04)":"#fff",borderRadius:16,padding:"28px",border:"1px solid "+(dark?"rgba(255,255,255,.07)":"rgba(0,0,0,.06)"),boxShadow:dark?"none":"0 1px 3px rgba(0,0,0,.04),0 8px 30px rgba(0,0,0,.04)",textAlign:"left"}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:dark?"rgba(255,255,255,.4)":"#64748B",marginBottom:8,textTransform:"uppercase",letterSpacing:".04em"}}>{"Name"}</label>
            <input value={loginInput} onChange={function(e){setLoginInput(e.target.value)}} onKeyDown={function(e){if(e.key==="Enter"&&loginInput.trim()){setUserName(loginInput.trim());setIsLoggedIn(true);setVw("dashboard")}}} placeholder={t.loginName} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid "+(dark?"rgba(255,255,255,.08)":"#E2E8F0"),background:dark?"rgba(255,255,255,.03)":"#F8FAFC",color:dark?"#fff":"#1E293B",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"Outfit,sans-serif"}}/>
            <button onClick={function(){if(loginInput.trim()){setUserName(loginInput.trim());setIsLoggedIn(true);setVw("dashboard")}}} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",marginTop:14,background:loginInput.trim()?(dark?"#6366F1":"#4338CA"):(dark?"rgba(255,255,255,.04)":"#F1F5F9"),color:loginInput.trim()?"#fff":(dark?"rgba(255,255,255,.15)":"#94A3B8"),fontSize:14,fontWeight:600,cursor:loginInput.trim()?"pointer":"default",fontFamily:"Outfit,sans-serif",transition:"all .25s",boxShadow:loginInput.trim()?"0 4px 14px "+(dark?"rgba(99,102,241,.3)":"rgba(67,56,202,.25)"):"none"}}>{t.loginBtn}</button>
          </div>
          {/* Tech badges */}
          <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center",marginTop:24}}>
            {["Python","JavaScript","Java","TypeScript","Go","Rust"].map(function(lang,li){return <span key={li} style={{padding:"3px 9px",borderRadius:12,fontSize:9,fontWeight:500,background:dark?"rgba(255,255,255,.04)":"rgba(0,0,0,.03)",color:dark?"rgba(255,255,255,.3)":"rgba(0,0,0,.3)",border:"1px solid "+(dark?"rgba(255,255,255,.04)":"rgba(0,0,0,.04)")}}>{lang}</span>})}
          </div>
          {/* Footer */}
          <div style={{marginTop:28,display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
            <img src={SII_LOGO_LG} style={{height:32,opacity:dark?.25:.5}} alt="SII Group Chile"/>
            <span style={{fontSize:10,color:dark?"rgba(255,255,255,.18)":"rgba(0,0,0,.2)",letterSpacing:".02em"}}>{"v"+APP.v}</span>
          </div>
        </div>
      </div>}
      {isLoggedIn&&<div style={{display:"flex",height:"100vh"}}>
        <div style={{width:sideCol?56:220,minWidth:sideCol?56:220,background:dark?"rgba(12,20,36,.75)":"rgba(255,255,255,.7)",borderRight:"1px solid "+(dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.08)"),backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",display:"flex",flexDirection:"column",transition:"width .25s,min-width .25s",overflow:"hidden",flexShrink:0}}>
          <div style={{padding:sideCol?"14px":"14px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(255,255,255,.06)",height:52,boxSizing:"border-box"}}>
            <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#2563EB,#818CF8)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"#fff",fontSize:12,fontWeight:900}}>{"M"}</span></div>
            {!sideCol&&<span style={{fontSize:14,fontWeight:800,color:dark?"#fff":"#1E293B",whiteSpace:"nowrap"}}>{"MigraOps"}</span>}{!sideCol&&<img src={SII_LOGO} style={{height:16,opacity:dark?.35:.5,marginLeft:"auto"}} alt=""/>}
          </div>
          <div style={{padding:8,flex:1}}>
            <button onClick={function(){setVw("dashboard")}} className="hv-glow" className="hv-glow" style={{width:"100%",padding:sideCol?"8px":"7px 10px",borderRadius:8,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderLeft:vw==="dashboard"?"3px solid #60A5FA":"3px solid transparent",background:vw==="dashboard"?"rgba(37,99,235,.15)":"transparent",marginBottom:2}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={vw==="dashboard"?"#60A5FA":(dark?"rgba(255,255,255,.4)":T.txD)} strokeWidth="1.8"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z"/></svg>{!sideCol&&<span style={{fontSize:12,fontWeight:vw==="dashboard"?700:500,color:vw==="dashboard"?(dark?"#fff":T.nv):(dark?"rgba(255,255,255,.55)":T.txM)}}>{t.sideDash}</span>}</button>
            <button onClick={function(){setVw("upload")}} className="hv-glow" className="hv-glow" style={{width:"100%",padding:sideCol?"8px":"7px 10px",borderRadius:8,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderLeft:vw==="upload"||vw==="configure"||vw==="migrating"?"3px solid #60A5FA":"3px solid transparent",background:vw==="upload"||vw==="configure"||vw==="migrating"?"rgba(37,99,235,.15)":"transparent",marginBottom:2}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={vw==="upload"||vw==="configure"||vw==="migrating"?"#60A5FA":(dark?"rgba(255,255,255,.4)":T.txD)} strokeWidth="1.8"><path d="M12 4v16M4 12h16"/></svg>{!sideCol&&<span style={{fontSize:12,fontWeight:vw==="upload"||vw==="configure"?700:500,color:vw==="upload"||vw==="configure"?(dark?"#fff":T.nv):(dark?"rgba(255,255,255,.55)":T.txM)}}>{t.sideNew}</span>}</button>
            <button onClick={function(){if(res.length>0)setVw("results")}} style={{width:"100%",padding:sideCol?"8px":"7px 10px",borderRadius:8,border:"none",cursor:res.length>0?"pointer":"default",display:"flex",alignItems:"center",gap:10,borderLeft:vw==="results"?"3px solid #60A5FA":"3px solid transparent",background:vw==="results"?"rgba(37,99,235,.15)":"transparent",marginBottom:2,opacity:res.length>0?1:.35}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={vw==="results"?"#60A5FA":(dark?"rgba(255,255,255,.4)":T.txD)} strokeWidth="1.8"><path d="M4 12l5 5L20 7"/></svg>{!sideCol&&<span style={{fontSize:12,fontWeight:vw==="results"?700:500,color:vw==="results"?(dark?"#fff":T.nv):(dark?"rgba(255,255,255,.55)":T.txM)}}>{t.sideResults}</span>}{!sideCol&&res.length>0&&<span style={{marginLeft:"auto",padding:"1px 6px",borderRadius:8,fontSize:8,fontWeight:700,background:T.bl,color:"#fff",minWidth:16,textAlign:"center"}}>{res.length}</span>}</button>
            <button onClick={function(){setVw("history")}} className="hv-glow" className="hv-glow" style={{width:"100%",padding:sideCol?"8px":"7px 10px",borderRadius:8,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderLeft:vw==="history"?"3px solid #60A5FA":"3px solid transparent",background:vw==="history"?"rgba(37,99,235,.15)":"transparent",marginBottom:2}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={vw==="history"?"#60A5FA":(dark?"rgba(255,255,255,.4)":T.txD)} strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>{!sideCol&&<span style={{fontSize:12,fontWeight:vw==="history"?700:500,color:vw==="history"?(dark?"#fff":T.nv):(dark?"rgba(255,255,255,.55)":T.txM)}}>{t.sideHist}</span>}</button>
            <button onClick={function(){setVw("graph")}} className="hv-glow" style={{width:"100%",padding:sideCol?"8px":"7px 10px",border:"none",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:8,background:vw==="graph"?T.selBg:"transparent",color:dark?"#fff":T.nv,fontSize:sideCol?13:11,fontWeight:vw==="graph"?700:500,fontFamily:T.ui,borderLeft:vw==="graph"?"3px solid "+T.bl:"3px solid transparent"}}><svg width={sideCol?18:14} height={sideCol?18:14} viewBox="0 0 24 24" fill="none" stroke={vw==="graph"?T.bl:(dark?"rgba(255,255,255,.4)":T.txD)} strokeWidth="1.8"><circle cx="5" cy="5" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="12" cy="19" r="3"/><line x1="7.5" y1="6.5" x2="10" y2="17"/><line x1="16.5" y1="6.5" x2="14" y2="17"/><line x1="8" y1="5" x2="16" y2="5"/></svg>{!sideCol&&<span style={{fontFamily:T.ui}}>{"Grafo"}</span>}</button>
            <div style={{borderTop:"1px solid rgba(255,255,255,.06)",margin:"8px 0"}}/>
            <button onClick={function(){setShCfg(true)}} className="hv-glow" className="hv-glow" style={{width:"100%",padding:sideCol?"8px":"7px 10px",borderRadius:8,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:"transparent"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dark?"rgba(255,255,255,.4)":"#94A3B8"} strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M4.2 4.2l2.8 2.8m10-2.8l-2.8 2.8M1 12h4m14 0h4"/></svg>{!sideCol&&<span style={{fontSize:12,color:"rgba(255,255,255,.55)"}}>{t.sideCfg}</span>}</button>
          </div>
          <div style={{borderTop:"1px solid "+(dark?"rgba(255,255,255,.06)":"rgba(0,0,0,.08)"),padding:sideCol?"10px":"12px 14px"}}>
            {!sideCol&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:28,height:28,borderRadius:8,background:"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{userName?userName[0].toUpperCase():"U"}</div><div><div style={{fontSize:11,fontWeight:700,color:dark?"#fff":"#1E293B"}}>{userName}</div><div style={{fontSize:9,color:"rgba(255,255,255,.3)"}}>{"SII Group"}</div></div></div>}
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {UILANGS.map(function(lg){return <button key={lg.code} onClick={function(){changeUiL(lg.code)}} style={{padding:"2px 5px",borderRadius:4,border:uiL===lg.code?"1px solid rgba(96,165,250,.5)":"1px solid transparent",background:uiL===lg.code?"rgba(96,165,250,.1)":"transparent",cursor:"pointer",fontSize:10}}>{lg.flag}</button>})}
              <button onClick={toggleDark} style={{padding:"2px 5px",borderRadius:4,border:"none",background:"transparent",cursor:"pointer",fontSize:10}}>{dark?"Light":"Dark"}</button>
              <button onClick={function(){setSideCol(function(v){return !v})}} style={{padding:"2px 5px",borderRadius:4,border:"none",background:"transparent",cursor:"pointer",fontSize:10,marginLeft:"auto",color:dark?"rgba(255,255,255,.3)":"#475569"}}>{sideCol?"›":"◂"}</button>
            </div>
          </div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{height:48,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",borderBottom:"1px solid "+T.bdL,background:T.hdrBg,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>{vw!=="dashboard"&&<button onClick={function(){var prev={upload:"dashboard",configure:"upload",results:"dashboard",history:"dashboard",migrating:"migrating"};setVw(prev[vw]||"dashboard")}} style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,display:"flex",alignItems:"center",color:T.txD,transition:"all .15s"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg></button>}<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.txD} strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg><span style={{fontSize:11,color:T.bdL}}>{"/"}</span><span style={{fontSize:13,fontWeight:700,color:T.nv}}>{vw==="dashboard"?t.dashTitle:vw==="upload"?t.upload:vw==="configure"?t.config:vw==="migrating"?"Migration":vw==="results"?t.results:vw==="history"?t.history:vw==="qa-running"?"QA Testing":""}</span>{sL&&tL&&(vw==="configure"||vw==="migrating"||vw==="results")&&<span style={{display:"inline-flex",alignItems:"center",gap:4,marginLeft:4}}><span style={{color:T.bdL}}>{"/"}</span><span style={{fontSize:11,fontWeight:600,color:T.bl}}>{(LANGS[sL]||{}).n+" > "+(LANGS[tL]||{}).n}</span></span>}</div>
            <span style={{fontSize:9,color:T.txD}}>{"v"+APP.v}</span>
          </div>
          <div style={{flex:1,overflow:"auto"}}>
          <div style={{maxWidth:1200,margin:"0 auto",padding:"20px 24px"}}>
            {vw==="dashboard"&&<div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeIn .4s ease"}}>
              <div style={{marginBottom:4}}><h1 style={{fontSize:28,fontWeight:800,color:T.nv,letterSpacing:"-.03em",margin:0}}>{(function(){var h=new Date().getHours();return h<12?("Buenos días, "):h<19?("Buenas tardes, "):("Buenas noches, ")})()+userName}</h1><p style={{fontSize:12,color:T.txD,margin:"4px 0 0"}}>{new Date().toLocaleDateString(uiL==="en"?"en-US":uiL==="pt"?"pt-BR":"es-CL",{weekday:"long",day:"numeric",month:"long"})+" · "+(hist.length>0?hist.length+" migrations":"")}</p></div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
                {[{l:t.dashTotalMig,v:dashS.mig,c:"#2563EB",d:"M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"},{l:t.dashAvgScore,v:dashS.score,c:"#059669",d:"M22 11.08V12a10 10 0 11-5.93-9.14"},{l:t.dashFilesProc,v:dashS.files,c:"#7C3AED",d:"M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9zM13 2v7h7"},{l:"QA",v:dashS.tests,c:"#D97706",d:"M9 2h6l3 7H6L9 2zM6 9v11a2 2 0 002 2h8a2 2 0 002-2V9"}].map(function(st2,si4){return <div key={si4} className="hv-lift" style={{borderRadius:14,border:"1px solid "+T.bdL,background:T.w,overflow:"hidden"}}><div style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:14}}><div style={{width:42,height:42,borderRadius:11,background:st2.c+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={st2.c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={st2.d}/></svg></div><div><div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>{st2.l}</div><div style={{fontSize:26,fontWeight:800,color:T.nv,lineHeight:1,fontFamily:T.f,animation:"fadeIn .6s ease"}}>{st2.v}</div></div></div><div style={{height:3,background:"linear-gradient(90deg,"+st2.c+","+st2.c+"50)"}}/></div>})}
              </div>

              {hist.length>=2&&<div style={Object.assign({},S.card,{marginBottom:8})}><div style={S.cH}><span style={{fontWeight:700,color:T.nv}}>{t.scoreTrend}</span><span style={{fontSize:9,color:T.txD}}>{hist.length+" migrations"}</span></div><ScoreTrend data={hist}/></div>}
              <button onClick={function(){setVw("upload")}} style={Object.assign({},S.btn("p"),{padding:"12px 24px",fontSize:13,alignSelf:"flex-start"})}>{t.dashNewMig}</button>
              <div style={S.card}><div style={S.cH}><span style={{fontWeight:700,color:T.nv}}>{t.dashRecent}</span></div>
                {hist.length===0?<div style={{padding:32,textAlign:"center",color:T.txD,fontSize:13}}>{t.dashNoData}</div>
                :<div style={{maxHeight:250,overflow:"auto"}}>{hist.slice(0,8).map(function(h,i){var sc=h.audit&&h.audit.finalScore?h.audit.finalScore:null;var scClr=sc>=90?T.g:sc>=70?T.y:sc!==null?T.r:T.txD;return <div key={i} onClick={function(){setVw("history")}} style={{padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid "+T.bdL,cursor:"pointer"}}><div><div style={{fontSize:12,fontWeight:700,color:T.tx}}>{h.from+" > "+h.to}</div><div style={{fontSize:10,color:T.txD}}>{h.date}</div></div>{sc!==null&&<div style={{fontSize:16,fontWeight:800,color:scClr}}>{sc}</div>}</div>})}</div>}
              </div>
            </div>}
      {(vw==="upload"||vw==="configure"||vw==="migrating"||vw==="results")&&<div style={{marginBottom:16,padding:"12px 0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
          {[{k:"upload",n:"1",l:t.step1},{k:"configure",n:"2",l:t.step2},{k:"migrating",n:"3",l:t.step3},{k:"results",n:"4",l:t.step4}].map(function(st,i){
            var steps=["upload","configure","migrating","results"];
            var curIdx=steps.indexOf(vw);
            var stIdx=i;
            var isActive=st.k===vw;
            var isDone=stIdx<curIdx;
            var isFuture=stIdx>curIdx;
            return <div key={st.k} style={{display:"flex",alignItems:"center"}}>
              <div className="hv-grow" style={{display:"flex",flexDirection:"column",alignItems:"center",opacity:isFuture?.4:1,transition:"all .3s"}}>
                <div style={{width:34,height:34,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:isDone?14:13,fontWeight:700,background:isActive?"linear-gradient(135deg,"+T.gradA+","+T.gradB+")":isDone?T.g:"transparent",color:isActive?"#fff":isDone?"#fff":T.txD,border:isActive||isDone?"2px solid transparent":"2px solid "+T.bdL,boxShadow:isActive?"0 3px 10px "+T.bl+"35":"none"}}>{isDone?"✓":st.n}</div>
                <span style={{fontSize:9,fontWeight:isActive?700:500,color:isActive?T.nv:isDone?T.g:T.txD,marginTop:5}}>{st.l}</span>
              </div>
              {i<3&&<div style={{width:isMobile?16:44,height:2,background:isDone?T.g:T.bdL,margin:"0 6px 18px 6px",borderRadius:1}}/>}
            </div>})}
        </div>
      </div>}

      {vw==="upload" && <div style={{display:"flex",flexDirection:"column",gap:16}}>

        {/* ── Hero drop zone ── */}
        <div onDragOver={function(e){e.preventDefault();setDrg(true)}} onDragLeave={function(){setDrg(false)}} onDrop={function(e){e.preventDefault();setDrg(false);if(e.dataTransfer.files.length)addF(e.dataTransfer.files)}} onClick={function(){if(fr.current)fr.current.click()}} style={{position:"relative",borderRadius:16,cursor:"pointer",overflow:"hidden",background:drg?"linear-gradient(135deg,#dbeafe,#ede9fe)":T.w,border:"1.5px dashed "+(drg?T.bl:T.bd),padding:files.length>0?"24px 24px 18px":"40px 24px 32px",textAlign:"center",transition:"all .25s ease"}}>
          <input ref={fr} type="file" multiple accept=".py,.js,.mjs,.ts,.tsx,.java,.cs,.go,.rs,.php,.rb,.kt,.kts,.zip" style={{display:"none"}} onChange={function(e){addF(e.target.files)}}/>
          {/* Animated corner accents */}
          <div style={{position:"absolute",top:0,left:0,width:32,height:32,borderTop:"3px solid "+T.bl,borderLeft:"3px solid "+T.bl,borderRadius:"16px 0 0 0",opacity:drg?1:.3,transition:"opacity .2s"}}/>
          <div style={{position:"absolute",top:0,right:0,width:32,height:32,borderTop:"3px solid "+T.bl,borderRight:"3px solid "+T.bl,borderRadius:"0 16px 0 0",opacity:drg?1:.3,transition:"opacity .2s"}}/>
          <div style={{position:"absolute",bottom:0,left:0,width:32,height:32,borderBottom:"3px solid "+T.bl,borderLeft:"3px solid "+T.bl,borderRadius:"0 0 0 16px",opacity:drg?1:.3,transition:"opacity .2s"}}/>
          <div style={{position:"absolute",bottom:0,right:0,width:32,height:32,borderBottom:"3px solid "+T.bl,borderRight:"3px solid "+T.bl,borderRadius:"0 0 16px 0",opacity:drg?1:.3,transition:"opacity .2s"}}/>

          {files.length===0 ? <div>
            <div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,"+T.gradA+","+T.gradB+")",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div style={{fontSize:18,fontWeight:800,color:T.nv,marginBottom:4,letterSpacing:"-.02em"}}>{t.dropTitle}</div>
            <div style={{fontSize:12,color:T.txM}}>{t.orBrowse}</div>
            <div style={{marginTop:14,display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap"}}>
              {Object.keys(LANGS).map(function(k){var meta=LANG_META[k];return <div key={k} style={{position:"relative",display:"inline-block"}} onMouseEnter={function(e){var r=e.currentTarget.getBoundingClientRect();setHovLangPos({x:r.left+r.width/2,y:r.bottom+8});setHovLang(k)}} onMouseLeave={function(){setHovLang(null)}}>
                  <span style={{padding:"5px 12px",borderRadius:20,fontSize:10,fontWeight:600,background:hovLang===k?LANGS[k].c+"20":LANGS[k].c+"10",color:LANGS[k].c,border:"1.5px solid "+(hovLang===k?LANGS[k].c+"50":LANGS[k].c+"20"),cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,transition:"all .2s ease",transform:hovLang===k?"translateY(-2px)":"none",boxShadow:hovLang===k?"0 4px 12px "+LANGS[k].c+"20":"none"}}>{LANGS[k].i+" "+LANGS[k].n}</span>
                  
                </div>})}
            </div>
          </div> : <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:2}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.bl} strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span style={{fontSize:11,fontWeight:600,color:T.bl}}>{t.orBrowse}</span>
            </div>
          </div>}
        </div>

        {/* ── Loaded files ── */}
        {files.length>0 && <div style={{display:"flex",flexDirection:"column",gap:12}}>

          {/* File count + stats bar */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 2px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                <span style={{fontSize:24,fontWeight:900,fontFamily:T.f,color:T.nv}}>{files.length}</span>
                <span style={{fontSize:11,fontWeight:600,color:T.txM}}>{t.filesSel}</span>
              </div>
              <span style={{width:1,height:16,background:T.bdL}}/>
              <span style={{fontSize:10,color:T.txD,fontFamily:T.f}}>{files.reduce(function(s,f){return s+f.content.split("\n").length},0)+" "+t.linesCode}</span>
            </div>
            <button onClick={function(){setFiles([]);setSL("");setDet(null);setSelF(null)}} style={Object.assign({},S.btn(),{padding:"4px 12px",fontSize:9})}>{"✕ "+t.clean}</button>
          </div>

          {/* File list — compact table */}
          <div style={Object.assign({},S.card,{overflow:"hidden"})}>
            <div style={{maxHeight:220,overflowY:"auto"}}>
              {files.map(function(f,i){
                var lc=f.content.split("\n").length;
                return <div key={i} onClick={function(){setSelF(selF===i?null:i)}} style={{padding:"8px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid "+T.bdL,cursor:"pointer",background:selF===i?T.blM:"transparent",transition:"background .15s"}}>
                  <span style={{width:8,height:8,borderRadius:2,background:f.lang?(LANGS[f.lang].c||T.txD):T.txD,flexShrink:0}}/>
                  <span style={{fontFamily:T.f,fontSize:10,fontWeight:600,color:T.tx,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.path||f.name}</span>
                  {f.project&&<span style={{fontSize:7,padding:"2px 6px",borderRadius:4,background:T.blP,color:T.bl,fontWeight:700,flexShrink:0}}>{f.project}</span>}
                  <span style={{fontSize:9,color:T.txD,fontFamily:T.f,flexShrink:0}}>{lc+" ln"}</span>
                  <span style={{fontSize:9,fontWeight:700,color:(LANGS[f.lang]||{}).c||T.txD,flexShrink:0}}>{f.langN}</span>
                </div>
              })}
            </div>
            {selF!==null&&files[selF]&&<pre style={{padding:12,margin:0,maxHeight:150,overflowY:"auto",fontFamily:T.f,fontSize:10,lineHeight:1.6,color:T.txM,background:"#0f172a",borderTop:"1px solid "+T.bdL,whiteSpace:"pre-wrap"}}><code style={{color:"#e2e8f0"}}>{files[selF].content.slice(0,2000)}</code></pre>}
          </div>

          {/* Auto-detection card */}
          {det&&sL&&<div style={{borderRadius:12,overflow:"hidden",border:"1px solid "+(det.c>=70?"#a7f3d0":"#fde68a")}}>
            <div style={{padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:det.c>=70?"#f0fdf420":"#fffbeb40"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:10,background:(LANGS[sL]||{}).c+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{(LANGS[sL]||{}).i}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:T.nv}}>{(LANGS[sL]||{}).n+" "}<span style={{color:T.bl,fontFamily:T.f}}>{sV}</span></div>
                  <div style={{fontSize:9,color:T.txM,fontWeight:500}}>{det.c>=70?"✓ "+t.detected+" ("+det.c+"%)":""+t.lowConf+" ("+det.c+"%)"}</div>
                </div>
              </div>
              <button onClick={function(){setMan(!man)}} style={Object.assign({},S.btn(),{padding:"4px 10px",fontSize:9})}>{man?t.auto:"Edit"}</button>
            </div>
            {det.s.length>0&&<div style={{padding:"5px 16px 8px",display:"flex",flexWrap:"wrap",gap:3,background:"transparent"}}>{det.s.slice(0,6).map(function(s,i){return <span key={i} style={{padding:"2px 6px",borderRadius:4,fontSize:8,background:T.cBg,color:T.txM,border:"1px solid "+T.bdL,fontFamily:T.f}}>{s.i+" "+s.t}</span>})}</div>}
            {man&&<div style={{padding:12,display:"flex",gap:10,background:T.blM,borderTop:"1px solid "+T.bdL}}>
              <select value={sL} onChange={function(e){setSL(e.target.value);setDet(null)}} style={Object.assign({},S.sel,{width:130})}>{Object.keys(LANGS).map(function(k){return <option key={k} value={k}>{LANGS[k].n}</option>})}</select>
              <select value={sV} onChange={function(e){setSV(e.target.value)}} style={Object.assign({},S.sel,{width:130})}>{(LANGS[sL]||{v:[]}).v.map(function(v){return <option key={v} value={v}>{v}</option>})}</select>
            </div>}
          </div>}

          {/* Configure button — prominent */}
          <button onClick={function(){setVw("configure")}} style={{width:"100%",padding:"14px 24px",borderRadius:12,border:"none",cursor:"pointer",fontSize:14,fontWeight:800,fontFamily:T.ui,background:"linear-gradient(135deg,"+T.nv+","+T.bl+")",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:8,letterSpacing:"-.01em",boxShadow:"0 4px 14px rgba(10,36,99,.25)"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            {t.readyCfg+" →"}
          </button>
        </div>}

        {/* ── Sample projects — collapsible, secondary ── */}
        <div style={{borderRadius:12,border:"1px solid "+T.bdL,overflow:"hidden",background:T.w}}>
          <div onClick={function(){setShTP(!shTP)}} style={{padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",background:T.cBg}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:13}}>{shTP?"▾":"›"}</span>
              <span style={{fontSize:11,fontWeight:700,color:T.txM}}>{t.samples}</span>
              <span style={{fontSize:9,color:T.txD}}>{"— "+t.samplesDesc}</span>
            </div>
            <span style={{fontSize:9,color:T.txD,fontFamily:T.f}}>{PROJECTS.length+" projects"}</span>
          </div>
          {shTP&&<div style={{padding:12,display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:8}}>
            {PROJECTS.map(function(p){
              var ld=files.some(function(f){return f.project===p.name});
              return <div key={p.id} style={{borderRadius:12,border:"1px solid "+(ld?T.okBd:prevProj===p.id?T.bl+"40":T.bdL),background:ld?T.okBg:T.w,overflow:"hidden",transition:"all .3s ease",boxShadow:prevProj===p.id?"0 4px 16px rgba(37,99,235,.08)":"none"}}>
                <div onClick={function(){if(ld)return;if(prevProj===p.id){setPrevProj(null)}else{setPrevProj(p.id)}}} style={{padding:10,display:"flex",alignItems:"center",gap:10,cursor:ld?"default":"pointer"}}>
                <span style={{fontSize:20,flexShrink:0}}>{p.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.nv,marginBottom:2}}>{p.name}</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    <span style={{padding:"1px 5px",borderRadius:4,fontSize:8,fontWeight:700,background:((LANGS[p.lang]||{}).c||"#999")+"15",color:(LANGS[p.lang]||{}).c||"#999"}}>{(LANGS[p.lang]||{}).n||p.lang}</span>
                    <span style={{fontSize:8,color:T.txD}}>{p.files.length+" files"}</span>
                    {p.suggest&&<span style={{padding:"1px 5px",borderRadius:4,fontSize:7,fontWeight:700,background:T.blP,color:T.bl}}>{"→ "+p.suggest.to}</span>}
                  </div>
                </div>
                {ld?<span style={{color:T.g,fontSize:14,flexShrink:0}}>{"✓"}</span>:<span style={{color:prevProj===p.id?T.bl:T.txD,fontSize:12,fontWeight:700,transition:"transform .25s ease",display:"inline-block",transform:prevProj===p.id?"rotate(45deg)":"none"}}>{"+"}</span>}
                </div>
                {prevProj===p.id&&!ld&&<div style={{borderTop:"1px solid "+T.bdL,padding:"10px 12px",background:T.cBg,animation:"fadeIn .25s ease"}}>
                  <div style={{marginBottom:8}}>{p.files.map(function(f,fi){return <div key={fi} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:fi<p.files.length-1?"1px solid "+T.bdL:"none"}}>
                    <span style={{width:5,height:5,borderRadius:"50%",background:(LANGS[p.lang]||{}).c||T.bl,flexShrink:0}}/>
                    <span style={{fontSize:9,fontFamily:T.f,color:T.txM,flex:1}}>{f.name}</span>
                    <span style={{fontSize:8,color:T.txD}}>{f.content?f.content.split("\n").length+" ln":""}</span>
                  </div>})}</div>
                  <button onClick={function(e){e.stopPropagation();loadProj(p);setPrevProj(null)}} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:"linear-gradient(135deg,"+T.gradA+","+T.gradB+")",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:T.ui,boxShadow:"0 2px 8px "+T.bl+"30"}}>{"Cargar "+p.files.length+" archivos"}</button>
                </div>}
              </div>})}
          </div>}
        </div>

      </div>}

      {/* CONFIGURE */}
      {vw==="configure" && <div style={{display:"flex",flexDirection:"column",gap:18}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><button onClick={function(){setVw("upload")}} style={S.btn()}>{"←"}</button><h2 style={{fontSize:18,fontWeight:800,color:T.nv}}>{t.cfg}</h2></div>
          <button onClick={function(){setShCfg(true)}} style={S.btn("ai")}>{t.aiCfg}</button>
        </div>
        <div style={S.card}><div style={S.cH}><span style={{fontWeight:700,color:T.nv}}>{t.type}</span></div>
          <div style={{padding:14,display:"flex",gap:10}}>{[{k:"version",i:"",l:t.updVer},{k:"cross",i:"⇄",l:t.chgLang}].map(function(o){return <div key={o.k} onClick={function(){setMt(o.k);setTL(o.k==="version"?sL:"");setTV("")}} style={{flex:1,padding:12,borderRadius:10,cursor:"pointer",border:"2px solid "+(mt===o.k?T.bl:T.bdL),background:mt===o.k?T.blM:T.w}}><div style={{fontSize:20,marginBottom:2}}>{o.i}</div><div style={{fontWeight:700,fontSize:12,color:T.nv}}>{o.l}</div></div>})}</div></div>

        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr auto 1fr",gap:12,alignItems:"start"}}>
          <div style={S.card}><div style={S.cH}><span style={{fontWeight:700,color:T.nv}}>{t.origin}</span></div><div style={{padding:16,textAlign:"center"}}>{sL&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10,padding:"8px 14px",borderRadius:10,background:(LANGS[sL]||{}).c+"08",border:"1px solid "+(LANGS[sL]||{}).c+"20"}}><span style={{fontSize:22}}>{(LANGS[sL]||{}).i}</span><div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:800,color:T.nv}}>{(LANGS[sL]||{}).n}</div><div style={{fontSize:9,color:T.txD}}>{sV||"Latest"}</div></div></div>}<span style={{fontSize:26}}>{(LANGS[sL]||{}).i}</span><div style={{fontSize:15,fontWeight:800,color:T.nv}}>{(LANGS[sL]||{}).n}</div><div style={{fontSize:18,fontWeight:900,color:T.bl}}>{sV}</div></div></div>
          <div style={{alignSelf:"center",marginTop:24,width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,"+T.gradA+","+T.gradB+")",boxShadow:"0 4px 16px "+T.bl+"30",animation:"arrowPulse 2s ease-in-out infinite",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff"}}>{"→"}</div>
          <div style={S.card}><div style={S.cH}><span style={{fontWeight:700,color:T.nv}}>{t.dest}</span></div>
            {tL&&<div style={{padding:"8px 14px",margin:"0 14px",borderRadius:10,background:(LANGS[tL]||{}).c+"08",border:"1px solid "+(LANGS[tL]||{}).c+"20",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:4}}><span style={{fontSize:22}}>{(LANGS[tL]||{}).i}</span><div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:800,color:T.nv}}>{(LANGS[tL]||{}).n}</div><div style={{fontSize:9,color:T.txD}}>{tV||""}</div></div></div>}
            <div style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
              {mt==="version"
                ? <select value={tV} onChange={function(e){setTL(sL);setTV(e.target.value)}} style={S.sel}><option value="">{t.selVer}</option>{(LANGS[sL]||{v:[]}).v.filter(function(v){return v!==sV}).map(function(v){return <option key={v} value={v}>{v}</option>})}</select>
                : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <select value={tL} onChange={function(e){setTL(e.target.value);var lv=(LANGS[e.target.value]||{v:[]}).v;setTV(lv.length?lv[lv.length-1]:"")}} style={S.sel}><option value="">{t.selLang}</option>{Object.keys(LANGS).filter(function(k){return k!==sL}).map(function(k){return <option key={k} value={k}>{LANGS[k].n}</option>})}</select>
                    {tL&&<select value={tV} onChange={function(e){setTV(e.target.value)}} style={S.sel}>{(LANGS[tL]||{v:[]}).v.map(function(v){return <option key={v} value={v}>{v}</option>})}</select>}
                  </div>}
            </div></div>
        </div>

        <div style={S.card}><div style={S.cH}><span style={{fontWeight:700,color:T.nv}}>{t.model}</span></div>
          <div style={{padding:14,display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:8}}>{MODELS.map(function(m){var iS=mod===m.id;return <div key={m.id} onClick={function(){setMod(m.id)}} className="hv-lift" style={{padding:12,borderRadius:12,cursor:"pointer",position:"relative",border:"2px solid "+(iS?T.bl:T.bdL),background:iS?T.blM:T.w,transition:"all .25s",boxShadow:iS?"0 4px 16px "+T.bl+"20":"none"}}>
            <span style={{padding:"1px 6px",borderRadius:8,fontSize:8,fontWeight:800,background:m.bc+"15",color:m.bc}}>{m.badge}</span>
            <div style={{fontSize:12,fontWeight:800,color:T.nv,marginTop:6,marginBottom:3}}>{m.n}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,fontSize:9}}><div><span style={{color:T.txD,fontSize:7,fontWeight:700}}>{t.qual}</span><br/><Dots n={m.q}/></div><div><span style={{color:T.txD,fontSize:7,fontWeight:700}}>{t.spd}</span><br/><b style={{color:T.nv}}>{m.spd}</b></div></div>
            {iS&&<div style={{position:"absolute",top:5,right:5,width:16,height:16,borderRadius:"50%",background:T.bl,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>{"✓"}</div>}
          </div>})}</div>
          {mod.indexOf("haiku")>=0&&(files.length>=3||mt==="cross")&&<div style={{margin:"0 14px 10px",padding:"6px 10px",borderRadius:8,background:T.warnBg,border:"1px solid #fde68a",fontSize:9,color:T.warnTx}}>{"Haiku es rápido pero puede producir resultados de menor calidad en migraciones complejas ("+(files.length>=3?files.length+" archivos":"cross-language")+"). Considera Sonnet para mejor calidad."}</div>}
        </div>

        {sL&&tL&&tV&&<div style={Object.assign({},S.card,{padding:16,background:"linear-gradient(135deg,"+T.blM+","+T.w+")"})}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><div style={{fontSize:12,fontWeight:700,color:T.nv}}>{t.summary}</div><div style={{fontSize:11,color:T.txM}}>{files.length+" arch. · "}<b style={{color:(LANGS[sL]||{}).c}}>{(LANGS[sL]||{}).n+" "+sV}</b>{" → "}<b style={{color:(LANGS[tL]||{}).c}}>{(LANGS[tL]||{}).n+" "+tV}</b></div></div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>
              {(function(){var tl3=files.reduce(function(s,f){return s+(f.content?f.content.split("\n").length:0)},0);var cx=tl3>500?"high":tl3>200?"medium":"low";var cClr=cx==="high"?"#DC2626":cx==="medium"?"#D97706":"#059669";var cLbl=cx==="high"?"Compleja":cx==="medium"?"Media":"Simple";var eMin=Math.ceil(tl3*0.08);var eMax=Math.ceil(tl3*0.15);var ml3=MODELS.find(function(m){return m.id===mod});var eCost=ml3?((tl3*20*(ml3.pi||0)+tl3*30*(ml3.po||0))/1000000):0;return [<span key="cx" style={{padding:"3px 10px",borderRadius:6,fontSize:9,fontWeight:700,background:cClr+"12",color:cClr}}>{cLbl+" ("+tl3+" líneas)"}</span>,<span key="et" style={{padding:"3px 10px",borderRadius:6,fontSize:9,fontWeight:600,background:T.blP,color:T.bl}}>{"~"+eMin+"-"+eMax+" min"}</span>,<span key="ec" style={{padding:"3px 10px",borderRadius:6,fontSize:9,fontWeight:600,background:"#F0FDF4",color:"#059669"}}>{"~$"+(eCost<0.01?"<0.01":eCost.toFixed(2))}</span>]})()}
            </div>
            <div style={{display:"flex",gap:6}}>
              {(sL==="java"||sL==="kotlin"||tL==="kotlin")&&<button disabled={andReportLd} onClick={async function(){setAndReportLd(true);setAndReport(null);var rv=await generateAndroidReport(files,sL,sV,tL,tV,mod,uiL);setAndReport(rv);setAndReportLd(false);if(rv.ok)setShAndReport(true)}} style={Object.assign({},S.btn("ai"),{padding:"12px 18px",fontSize:12,opacity:andReportLd?.6:1})}>{andReportLd?"⏳ ...":t.andGenReport}</button>}
              <button disabled={qaTestsLd} onClick={async function(){setQaTestsLd(true);setQaPreR(null);setQaPostR(null);var rv=await generateAndRunQA(files,sL,sV,mod,"pre",null);if(rv.ok){setQaTests(rv.suite);setQaPreR(rv.results);setShQaPanel(true)}else{setQaTests(null);setQaPreR(null);}var vr=await runVirtualQA(files,sL,sV,mod,"pre");if(vr.ok){setQaVPreR(vr.virtual)}setQaTestsLd(false);if(!rv.ok&&!vr.ok){alert("Error: "+(rv.error||vr.error||"Unknown"))}}} style={Object.assign({},S.btn("ai"),{padding:"12px 18px",fontSize:12,opacity:qaTestsLd?.6:1})}>{qaTestsLd?t.qaRunning:t.qaGenerate}</button>
              <button onClick={go} aria-label={t.migrate} className="mig-btn" style={Object.assign({},S.btn("p"),{padding:"14px 32px",fontSize:14,letterSpacing:"-.01em",animation:"pulseGlow 2.5s ease-in-out infinite",transition:"all .25s",borderRadius:10})}>{t.migrate}</button>
            </div>
          </div></div>}


        {/* QA Sandbox Panel */}
        {shQaPanel&&qaPreR&&(function(){
          var sr=qaPreR.summary;
          var hasPost=!!qaPostR;
          var comparison=hasPost?compareQAResults(qaPreR,qaPostR):null;
          var postSr=hasPost?qaPostR.summary:null;
          return <div style={Object.assign({},S.card,{border:"2px solid "+T.g})}>
            <div style={Object.assign({},S.cH,{background:"linear-gradient(135deg,"+T.okBg+","+T.blM+")"})}>
              <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                <span style={{fontSize:20}}>{"QA"}</span>
                <div><div style={{fontSize:14,fontWeight:800,color:"#059669"}}>{t.qaTitle}</div>
                  <div style={{fontSize:10,color:T.txM}}>{sr.total+" "+t.qaTotal+" · "+sr.timeMs+"ms"}</div></div>
              <div style={{display:"flex",gap:2,background:T.bdL,borderRadius:6,padding:2,marginLeft:12}}>
                <button onClick={function(){setQaTab("sandbox")}} style={{padding:"4px 10px",borderRadius:4,border:"none",fontSize:9,fontWeight:700,cursor:"pointer",background:qaTab==="sandbox"?"#059669":"transparent",color:qaTab==="sandbox"?"#fff":T.txM}}>{t.qaSandbox}</button>
                <button onClick={function(){setQaTab("virtual")}} style={{padding:"4px 10px",borderRadius:4,border:"none",fontSize:9,fontWeight:700,cursor:"pointer",background:qaTab==="virtual"?"#7c3aed":"transparent",color:qaTab==="virtual"?"#fff":T.txM}}>{t.qaVirtual}</button>
              </div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {res.length>0&&!qaPostR&&<button onClick={async function(){setQaTestsLd(true);var migFiles=res.map(function(r){return{name:r.targetName||r.name,content:r.migrated}});var rv=await generateAndRunQA(migFiles,tL,tV,mod,"post",qaTests);if(rv.ok){setQaPostR(rv.results)}var vr2=await runVirtualQA(migFiles,tL,tV,mod,"post");if(vr2.ok){setQaVPostR(vr2.virtual)}setQaTestsLd(false)}} disabled={qaTestsLd} style={Object.assign({},S.btn("ai"),{fontSize:10,padding:"6px 12px",opacity:qaTestsLd?.6:1})}>{qaTestsLd?"⏳":t.qaRetest}</button>}
                {qaTests&&<button onClick={function(){var tgt=tL||sL;var code=exportTestsAsCode(qaTests,sL,tgt);var extMap={javascript:"test.js",typescript:"test.ts",python:"test_migraops.py",java:"MigraOpsTest.java",kotlin:"MigraOpsTest.kt",csharp:"MigraOpsTest.cs"};var fname="optimiza_"+(extMap[tgt]||"tests.txt");var blob=new Blob([code],{type:"text/plain"});var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download=fname;a.click();URL.revokeObjectURL(url)}} style={Object.assign({},S.btn(),{fontSize:10,padding:"6px 12px"})}>{t.qaExport}</button>}
                <button onClick={function(){setShQaPanel(false)}} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:T.txM}}>{"✕"}</button>
              </div>
            </div>

            {/* Score summary bar — Sandbox */}
            {qaTab==="sandbox"&&<div>
            <div style={{display:"flex",gap:12,padding:"10px 14px",borderBottom:"1px solid "+T.bdL,flexWrap:"wrap"}}>
              <div style={{textAlign:"center",padding:"8px 16px",borderRadius:8,background:"#ecfdf5"}}><div style={{fontSize:20,fontWeight:900,color:"#059669"}}>{sr.passed}</div><div style={{fontSize:8,fontWeight:700,color:"#059669"}}>{t.qaPassed}</div></div>
              <div style={{textAlign:"center",padding:"8px 16px",borderRadius:8,background:sr.failed>0?"#fef2f2":"#f9fafb"}}><div style={{fontSize:20,fontWeight:900,color:sr.failed>0?"#dc2626":"#9ca3af"}}>{sr.failed}</div><div style={{fontSize:8,fontWeight:700,color:sr.failed>0?"#dc2626":"#9ca3af"}}>{t.qaFailed}</div></div>
              <div style={{textAlign:"center",padding:"8px 16px",borderRadius:8,background:"#f9fafb"}}><div style={{fontSize:20,fontWeight:900,color:"#6b7280"}}>{sr.skipped}</div><div style={{fontSize:8,fontWeight:700,color:"#6b7280"}}>{t.qaSkipped}</div></div>
              {hasPost&&<div style={{borderLeft:"2px solid "+T.bdL,paddingLeft:12,display:"flex",gap:12}}>
                <div style={{textAlign:"center",padding:"8px 16px",borderRadius:8,background:"#eff6ff"}}><div style={{fontSize:20,fontWeight:900,color:"#2563eb"}}>{postSr.passed}</div><div style={{fontSize:8,fontWeight:700,color:"#2563eb"}}>{t.qaPassed+" (post)"}</div></div>
                <div style={{textAlign:"center",padding:"8px 16px",borderRadius:8,background:postSr.failed>0?"#fef2f2":"#f9fafb"}}><div style={{fontSize:20,fontWeight:900,color:postSr.failed>0?"#dc2626":"#9ca3af"}}>{postSr.failed}</div><div style={{fontSize:8,fontWeight:700,color:postSr.failed>0?"#dc2626":"#9ca3af"}}>{t.qaFailed+" (post)"}</div></div>
              </div>}
              {comparison&&<div style={{borderLeft:"2px solid "+T.bdL,paddingLeft:12,textAlign:"center",padding:"8px 16px",borderRadius:8,background:comparison.summary.regressions>0?"#fef2f2":"#ecfdf5"}}><div style={{fontSize:20,fontWeight:900,color:comparison.summary.regressions>0?"#dc2626":"#059669"}}>{comparison.preservationRate+"%"}</div><div style={{fontSize:8,fontWeight:700,color:comparison.summary.regressions>0?"#dc2626":"#059669"}}>{comparison.summary.regressions>0?t.qaRegression:t.qaIdentical}</div></div>}
            </div>

            </div>}
            {/* Comparison details if post-migration ran */}
            {qaTab==="sandbox"&&comparison&&<div style={{padding:"8px 14px",borderBottom:"1px solid "+T.bdL}}>
              <div style={{fontSize:10,fontWeight:700,color:"#2563eb",marginBottom:6}}>{t.qaCompare}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:6}}>
                <span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:"#ecfdf5",color:"#059669",fontWeight:700}}>{comparison.summary.identical+" "+t.qaIdentical}</span>
                {comparison.summary.regressions>0&&<span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:"#fef2f2",color:"#dc2626",fontWeight:700}}>{comparison.summary.regressions+" "+t.qaRegression}</span>}
                {comparison.summary.newPasses>0&&<span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:"#eff6ff",color:"#2563eb",fontWeight:700}}>{comparison.summary.newPasses+" "+t.qaNewPass}</span>}
              </div>
            </div>}

            {/* Virtual QA Tab */}
            {qaTab==="virtual"&&<div style={{padding:"10px 14px"}}>
              <div style={{fontSize:9,color:"#7c3aed",fontWeight:700,marginBottom:6}}>{t.qaVirtual+" — "+t.qaVDesc}</div>
              {!qaVPreR&&<div style={{padding:20,textAlign:"center",color:T.txD,fontSize:11}}>{t.qaRunning}</div>}
              {qaVPreR&&(function(){
                var vComp=qaVPostR?compareVirtualQA(qaVPreR,qaVPostR):null;
                return <div>
                  {/* Virtual summary badges */}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                    <span style={{fontSize:9,padding:"3px 10px",borderRadius:10,background:T.blM,color:"#7c3aed",fontWeight:700}}>{qaVPreR.summary.totalFunctions+" "+t.qaFunc+"s · "+qaVPreR.summary.totalTests+" tests"}</span>
                    <span style={{fontSize:9,padding:"3px 10px",borderRadius:10,background:"#ecfdf5",color:"#059669",fontWeight:700}}>{""+qaVPreR.summary.highConfidence+" "+t.qaVHigh}</span>
                    {qaVPreR.summary.bugsFound>0&&<span style={{fontSize:9,padding:"3px 10px",borderRadius:10,background:"#fef2f2",color:"#dc2626",fontWeight:700}}>{""+qaVPreR.summary.bugsFound+" bugs"}</span>}
                    {vComp&&<span style={{fontSize:9,padding:"3px 10px",borderRadius:10,background:vComp.summary.different>0?"#fef2f2":"#ecfdf5",color:vComp.summary.different>0?"#dc2626":"#059669",fontWeight:700}}>{vComp.preservationRate+"% "+t.qaVEquivalent}</span>}
                  </div>
                  {/* Virtual function results */}
                  <div style={{maxHeight:280,overflowY:"auto"}}>
                    {qaVPreR.functions.map(function(fn,fi){
                      var postFn=qaVPostR?(qaVPostR.functions.find(function(pf){return pf.name===fn.name})||null):null;
                      var compF=vComp?vComp.comparisons.find(function(c){return c.name===fn.name}):null;
                      return <div key={fi} style={{marginBottom:8,borderRadius:8,border:"1px solid "+T.bdL,overflow:"hidden"}}>
                        <div style={{padding:"6px 10px",background:T.blM,display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:10,fontWeight:700,color:"#7c3aed",flex:1}}>{fn.name}</span>
                          <span style={{fontSize:7,padding:"1px 6px",borderRadius:6,background:T.bdL,color:T.txM,fontWeight:600,fontFamily:T.f}}>{fn.file}</span>
                          <span style={{fontSize:8,color:T.txD}}>{fn.description}</span>
                          {compF&&<span style={{fontSize:9,fontWeight:800,color:compF.status==="equivalent"?"#059669":"#dc2626"}}>{compF.status==="equivalent"?"✅":"⚠️"}</span>}
                        </div>
                        {(fn.tests||[]).map(function(tc,ci){
                          var confBg=tc.confidence==="high"?"#ecfdf5":tc.confidence==="medium"?"#fffbeb":"#fef2f2";
                          var confC=tc.confidence==="high"?"#059669":tc.confidence==="medium"?"#d97706":"#dc2626";
                          var confLabel=tc.confidence==="high"?t.qaVHigh:tc.confidence==="medium"?t.qaVMed:t.qaVLow;
                          var postTc=postFn&&postFn.tests?postFn.tests[ci]:null;
                          var caseComp=compF&&compF.cases?compF.cases[ci]:null;
                          return <div key={ci} style={{padding:"4px 10px",fontSize:9,borderTop:"1px solid "+T.bdL,background:caseComp?(caseComp.status==="equivalent"?"#f0fdf4":"#fef2f2"):"#fff"}}>
                            <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:2}}>
                              <span style={{fontWeight:700,color:T.tx}}>{tc.label}</span>
                              <span style={{fontSize:7,padding:"1px 5px",borderRadius:4,background:confBg,color:confC,fontWeight:700}}>{confLabel}</span>
                              {tc.bugs&&<span style={{fontSize:7,padding:"1px 5px",borderRadius:4,background:"#fef2f2",color:"#dc2626",fontWeight:700}}>{""+tc.bugs}</span>}
                              {caseComp&&<span style={{fontSize:8,fontWeight:800,marginLeft:"auto",color:caseComp.status==="equivalent"?"#059669":"#dc2626"}}>{caseComp.status==="equivalent"?"= "+t.qaVEquivalent:"≠ "+t.qaVDifferent}</span>}
                            </div>
                            <div style={{display:"flex",gap:8,color:T.txD,fontFamily:T.f}}>
                              <span>{t.qaInput+": "+JSON.stringify(tc.input)}</span>
                              <span style={{color:"#7c3aed"}}>{t.qaVPredicted+": "+JSON.stringify(tc.predicted)}</span>
                              {postTc&&<span style={{color:"#2563eb"}}>{"Post: "+JSON.stringify(postTc.predicted)}</span>}
                            </div>
                            {tc.trace&&<div style={{marginTop:2,padding:"2px 6px",borderRadius:4,background:T.bdL,color:T.txD,fontSize:8,fontFamily:T.f}}>{t.qaVTrace+": "+tc.trace}</div>}
                            {tc.sideEffects&&tc.sideEffects.length>0&&<div style={{marginTop:2,fontSize:8,color:T.txD}}>{"⚡ "+t.qaVSideEffects+": "+tc.sideEffects.join(", ")}</div>}
                          </div>})}
                      </div>})}
                  </div>
                </div>})()}
            </div>}

            {/* Individual test results (Sandbox tab) */}
            {qaTab==="sandbox"&&<div style={{maxHeight:300,overflowY:"auto",padding:"8px 14px"}}>
              {qaPreR.tests.map(function(test,ti){
                var postTest=qaPostR?qaPostR.tests.find(function(pt){return pt.id===test.id})||(qaPostR.tests[ti]||null):null;
                var typeBg=test.type==="unit"?"#dbeafe":test.type==="integration"?"#fef3c7":"#e0e7ff";
                var typeC=test.type==="unit"?"#2563EB":test.type==="integration"?"#92400e":"#4338ca";
                var typeLabel=test.type==="unit"?t.qaUnit:test.type==="integration"?t.qaInteg:t.qaApi;
                return <div key={test.id||ti} style={{marginBottom:8,borderRadius:8,border:"1px solid "+T.bdL,overflow:"hidden"}}>
                  <div style={{padding:"6px 10px",background:test.passed?"#f0fdf4":test.skipped?"#f9fafb":"#fef2f2",display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:12}}>{test.skipped?"⏭":test.passed?"✅":"❌"}</span>
                    <span style={{fontSize:10,fontWeight:700,color:T.tx,flex:1}}>{test.name}</span>
                    <span style={{fontSize:7,padding:"1px 6px",borderRadius:6,background:typeBg,color:typeC,fontWeight:700}}>{typeLabel}</span>
                    <span style={{fontSize:7,padding:"1px 6px",borderRadius:6,background:T.bdL,color:T.txM,fontWeight:600,fontFamily:T.f}}>{test.file}</span>
                    <span style={{fontSize:8,color:T.txD,fontFamily:T.f}}>{test.timeMs+"ms"}</span>
                    {postTest&&<span style={{fontSize:10,marginLeft:4}}>{postTest.passed?"✅":"❌"}</span>}
                  </div>
                  {test.cases.map(function(c,ci){
                    var postCase=postTest&&postTest.cases?postTest.cases[ci]:null;
                    var compItem=comparison&&comparison.comparisons[ti]?comparison.comparisons[ti].cases[ci]:null;
                    var statusBg=compItem?(compItem.status==="identical"?"#f0fdf4":compItem.status==="regression"?"#fef2f2":compItem.status==="new_pass"?"#eff6ff":"#f9fafb"):(c.pass?"#ffffff":"#fff5f5");
                    return <div key={ci} style={{padding:"4px 10px 4px 28px",fontSize:9,borderTop:"1px solid "+T.bdL,display:"flex",gap:8,alignItems:"center",background:statusBg}}>
                      <span style={{width:12,textAlign:"center"}}>{c.skipped?"⏭":c.pass?"✓":"✗"}</span>
                      <span style={{color:T.txM,flex:1}}>{c.label}</span>
                      <span style={{fontFamily:T.f,color:T.txD,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={JSON.stringify(c.input)}>{t.qaInput+": "+JSON.stringify(c.input)}</span>
                      <span style={{fontFamily:T.f,color:c.pass?"#059669":"#dc2626",maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={c.error||JSON.stringify(c.actual)}>{c.error?"Err: "+c.error:JSON.stringify(c.actual)}</span>
                      {compItem&&<span style={{fontSize:8,fontWeight:700,color:compItem.status==="identical"?"#059669":compItem.status==="regression"?"#dc2626":"#2563eb"}}>{compItem.status==="identical"?"=":compItem.status==="regression"?"≠":"+"}</span>}
                    </div>})}
                </div>})}
            </div>}
          </div>})()}

        {/* Android Pre-Migration Report Panel */}
        {andReport&&andReport.ok&&shAndReport&&(function(){
          var rp=andReport.report;
          var impBg=function(imp){return imp==="critical"?"#fef2f2":imp==="major"?"#fffbeb":"#f0fdf4"};
          var impC=function(imp){return imp==="critical"?"#dc2626":imp==="major"?"#d97706":"#059669"};
          return <div style={Object.assign({},S.card,{border:"2px solid "+T.bl})}>
            <div style={Object.assign({},S.cH,{background:"linear-gradient(135deg,"+T.blM+","+T.blP+")"})}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{"📱"}</span>
                <div><div style={{fontSize:14,fontWeight:800,color:T.bl}}>{t.andReport}</div>
                  <div style={{fontSize:10,color:T.txM}}>{(LANGS[sL]||{}).n+" "+sV+" → "+(LANGS[tL]||{}).n+" "+tV}</div></div>
              </div>
              <div style={{display:"flex",gap:4}}>
                <button onClick={function(){
                  var html=generateReportHTML(rp,files,sL,sV,tL,tV,t);
                  var blob=new Blob([html],{type:"text/html;charset=utf-8"});
                  var url=URL.createObjectURL(blob);
                  var a=document.createElement("a");a.href=url;a.download="optimiza_android_report.html";document.body.appendChild(a);a.click();
                  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url)},200);
                }} style={Object.assign({},S.btn("g"),{padding:"4px 12px",fontSize:10})}>{t.andExportHtml}</button>
                <button onClick={function(){setShAndReport(false)}} style={Object.assign({},S.btn(),{padding:"4px 8px",fontSize:12})}>{"✕"}</button>
              </div>
            </div>
            <div style={{padding:14,display:"flex",flexDirection:"column",gap:12}}>
              {/* Scores */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{padding:12,borderRadius:10,background:rp.riskScore>70?"#fef2f2":rp.riskScore>40?"#fffbeb":"#f0fdf4",textAlign:"center"}}>
                  <div style={{fontSize:9,fontWeight:700,color:T.txD}}>{"RISK SCORE"}</div>
                  <div style={{fontSize:28,fontWeight:900,color:rp.riskScore>70?"#dc2626":rp.riskScore>40?"#d97706":"#059669"}}>{rp.riskScore||0}</div>
                </div>
                <div style={{padding:12,borderRadius:10,background:rp.readinessScore>=70?"#f0fdf4":rp.readinessScore>=40?"#fffbeb":"#fef2f2",textAlign:"center"}}>
                  <div style={{fontSize:9,fontWeight:700,color:T.txD}}>{"READINESS"}</div>
                  <div style={{fontSize:28,fontWeight:900,color:rp.readinessScore>=70?"#059669":rp.readinessScore>=40?"#d97706":"#dc2626"}}>{rp.readinessScore||0}</div>
                </div>
              </div>

              {/* Summary */}
              {rp.summary&&<div style={{padding:10,borderRadius:8,background:T.blM,fontSize:11,lineHeight:1.6,color:T.txM}}>{rp.summary}</div>}

              {/* Architecture */}
              {rp.architecture&&<div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center"}}>
                <div style={{padding:10,borderRadius:8,background:"#fef2f2",textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:T.txD}}>{t.andPattern}</div><div style={{fontSize:12,fontWeight:800,color:"#dc2626"}}>{rp.architecture.current}</div></div>
                <span style={{fontSize:16}}>{"→"}</span>
                <div style={{padding:10,borderRadius:8,background:"#f0fdf4",textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:T.txD}}>{t.andTarget}</div><div style={{fontSize:12,fontWeight:800,color:"#059669"}}>{rp.architecture.target}</div></div>
              </div>}

              {/* Breaches */}
              {rp.breaches&&rp.breaches.length>0&&<div>
                <div style={{fontSize:11,fontWeight:800,color:T.nv,marginBottom:6}}>{t.andBreach+" ("+rp.breaches.length+")"}</div>
                <div style={{maxHeight:200,overflowY:"auto",border:"1px solid "+T.bdL,borderRadius:8}}>
                  {rp.breaches.map(function(b,i){return <div key={i} style={{padding:"6px 10px",borderBottom:"1px solid "+T.bdL,display:"flex",alignItems:"center",gap:6,background:i%2===0?"transparent":T.cBg}}>
                    <span style={{padding:"1px 6px",borderRadius:10,fontSize:8,fontWeight:700,background:impBg(b.impact),color:impC(b.impact)}}>{b.impact}</span>
                    <span style={{fontFamily:T.f,fontSize:9,color:T.bl}}>{b.file}{b.line?":"+b.line:""}</span>
                    <span style={{fontSize:9,color:T.txM,flex:1}}>{b.current+" → "+b.target}</span>
                    <span style={{fontSize:8,color:T.txD}}>{b.effort}</span>
                  </div>})}
                </div>
              </div>}

              {/* Refactor Plan */}
              {rp.refactorPlan&&rp.refactorPlan.length>0&&<div>
                <div style={{fontSize:11,fontWeight:800,color:T.nv,marginBottom:6}}>{t.andRefactor}</div>
                {rp.refactorPlan.map(function(p,i){return <div key={i} style={{padding:"8px 12px",borderLeft:"3px solid #7F52FF",marginBottom:6,background:T.cBg,borderRadius:"0 8px 8px 0"}}>
                  <div style={{fontSize:11,fontWeight:800,color:T.bl}}>{"Fase "+p.phase+": "+p.name}</div>
                  <div style={{fontSize:10,color:T.txM,marginTop:2}}>{p.description}</div>
                  {p.tasks&&<div style={{marginTop:4}}>{p.tasks.map(function(tk,j){return <div key={j} style={{fontSize:9,color:T.tx,padding:"1px 0"}}>{"• "+tk}</div>})}</div>}
                  <div style={{fontSize:8,color:T.txD,marginTop:3}}>{t.andEffort+": "+p.estimatedEffort}</div>
                </div>})}
              </div>}

              {/* Library Updates */}
              {rp.libraryUpdates&&rp.libraryUpdates.length>0&&<div>
                <div style={{fontSize:11,fontWeight:800,color:T.nv,marginBottom:6}}>{t.andLibs}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {rp.libraryUpdates.map(function(l,i){return <div key={i} style={{padding:"3px 8px",borderRadius:6,fontSize:9,border:"1px solid "+(l.breaking?"#fecaca":"#a7f3d0"),background:l.breaking?"#fef2f2":"#f0fdf4"}}>
                    <span style={{color:T.txD}}>{l.current}</span>{" → "}<b style={{color:l.breaking?"#dc2626":"#059669"}}>{l.recommended}</b>
                  </div>})}
                </div>
              </div>}

              {/* Modularization */}
              {rp.modularization&&rp.modularization.recommended&&<div>
                <div style={{fontSize:11,fontWeight:800,color:T.nv,marginBottom:6}}>{t.andModular}</div>
                <div style={{fontSize:9,color:T.txM,marginBottom:4}}>{"Actual: "+rp.modularization.current}</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:6}}>
                  {rp.modularization.recommended.map(function(m,i){return <div key={i} style={{padding:8,borderRadius:8,background:T.blM,border:"1px solid "+T.bdL}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.nv}}>{m.module}</div>
                    {m.contents&&<div style={{fontSize:8,color:T.txD,marginTop:2}}>{m.contents.join(", ")}</div>}
                  </div>})}
                </div>
              </div>}
            </div>
          </div>
        })()}
        {andReport&&!andReport.ok&&<div style={Object.assign({},S.card,{padding:12,background:"#fef2f2",textAlign:"center",fontSize:11,color:T.r})}>{"Error: "+(andReport.error||"?")}</div>}
      </div>}

      {/* MIGRATING — Professional Progress Dashboard */}
      {vw==="migrating" && (function(){
        void tick; // force re-render every 1s for live timers
        var now=Date.now();
        var elapsed=migStartTs>0?now-migStartTs:0;
        var elS=Math.floor(elapsed/1000);
        var elStr=(elS>=3600?Math.floor(elS/3600)+"h ":"")+String(Math.floor((elS%3600)/60)).padStart(2,"0")+"m "+String(elS%60).padStart(2,"0")+"s";
        var fc=files.length||1;
        var fileLogs=logs.filter(function(l){return l.type==="file"});
        var doneFiles=fileLogs.filter(function(l){return l.st==="done"});
        var activeFile=fileLogs.find(function(l){return l.st!=="done"});
        var pendingCount=Math.max(0,fc-doneFiles.length-(activeFile?1:0));
        var phaseLogs=logs.filter(function(l){return l.type==="phase"});
        // Throughput
        var totalDoneMs=doneFiles.reduce(function(s,l){return s+(l.durationMs||0)},0);
        var avgFileMs=doneFiles.length>0?Math.round(totalDoneMs/doneFiles.length):0;
        var fpm=elapsed>10000&&doneFiles.length>0?Math.round(doneFiles.length/(elapsed/60000)*10)/10:0;
        // Lines processed
        var linesProc=doneFiles.reduce(function(s,l){return s+(l.linesMig||l.lines||0)},0);
        if (!linesProc) linesProc=res.reduce(function(s,r){return s+(r.migrated?r.migrated.split("\n").length:0)},0);
        // ETA — smoothed
        var etaMs=0;
        if (prog>3&&prog<100) {
          var linearEta=Math.round(elapsed*((100-prog)/Math.max(prog,1)));
          etaMs=Math.min(linearEta,fc*90*1000);
          if(prog<20) etaMs=Math.min(etaMs,fc*60*1000);
        }
        var etaS=etaMs>0?Math.max(5,Math.round(etaMs/1000)):0;
        var etaStr=etaS>0?((etaS>=60?"~"+Math.ceil(etaS/60)+"m":"~"+etaS+"s")):"";
        // Phase info
        var phDefs=[
          {k:"analysis",ic:"A",l:t.gPhA,d:t.gPhAd,c:"#6366f1"},
          {k:"migration",ic:"›",l:t.gPhB,d:t.gPhBd,c:T.bl},
          {k:"consolidation",ic:"B2",l:t.gPhB2,d:t.gPhB2,c:"#0ea5e9"},
          {k:"integration",ic:"C",l:t.gPhC,d:t.gPhCd,c:"#059669"},
          {k:"qa",ic:"D",l:t.gPhD,d:t.gPhDd,c:"#d97706"}
        ];
        var curPhDef=phDefs.find(function(p){return p.k===migPhase})||phDefs[0];
        var mlObj=MODELS.find(function(m){return m.id===mod});
        // API call count
        var apiCount=phaseLogs.length+doneFiles.length+(activeFile?1:0);

        return <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:700,margin:"0 auto",paddingTop:8}}>

          {/* ═══ HEADER — Dark gradient bar with context + live clock ═══ */}
          <div style={{background:"linear-gradient(135deg,"+T.nv+","+T.nvL+")",borderRadius:14,padding:"14px 20px",color:"#fff"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:16}}>{"›"}</span>{t.mgHdr}
                </div>
                <div style={{fontSize:10,opacity:.8,marginTop:2}}>
                  <span style={{fontWeight:700}}>{(LANGS[sL]||{}).n+" "+sV}</span>
                  {" → "}
                  <span style={{fontWeight:700}}>{(LANGS[tL]||{}).n+" "+tV}</span>
                  {" · "+fc+" "+t.files+" · "+(mlObj?mlObj.n:"")}
                  {sL!==tL?<span style={{marginLeft:4,padding:"1px 6px",borderRadius:4,fontSize:7,fontWeight:800,background:"rgba(251,191,36,.25)",color:"#fbbf24"}}>{t.crossLang}</span>
                          :<span style={{marginLeft:4,padding:"1px 6px",borderRadius:4,fontSize:7,fontWeight:800,background:"rgba(96,165,250,.25)",color:T.blP}}>{t.verUpg}</span>}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                {/* Live elapsed — monospaced clock */}
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:T.f,fontSize:24,fontWeight:900,letterSpacing:1,lineHeight:1,color:elS>420?"#fca5a5":elS>360?"#fde68a":"inherit"}}>{elStr}</div>
                  <div style={{fontSize:7,opacity:.6,textTransform:"uppercase",letterSpacing:1}}>{t.mgElapsed+" · "+t.timeLimit}</div>
                </div>
                {migPhase!=="done"&&<button onClick={function(){cancelRef.current=true;_cancelled=true;if(_activeController)try{_activeController.abort()}catch(e){}_activeController=null;if(globalTimerRef.current){clearTimeout(globalTimerRef.current);globalTimerRef.current=null;}setMigPhase("done");setLogs(function(p){return p.concat([{type:"phase",phase:"cancelled",st:"done",ts:Date.now()}])});setTimeout(function(){if(res.length)setVw("results");else setVw("upload")},500)}} style={{padding:"5px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.25)",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.9)",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:T.ui}}>{"✕ "+t.cancel}</button>}
              </div>
            </div>
            {/* Sub-bar: overall progress thin line */}
            <div style={{marginTop:10,height:4,borderRadius:2,background:"rgba(255,255,255,.15)",overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:2,background:"rgba(255,255,255,.8)",width:prog+"%",transition:"width .6s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
              <span style={{fontSize:8,opacity:.6}}>{prog+"%"}</span>
              {etaStr&&<span style={{fontSize:8,opacity:.6}}>{"ETA "+etaStr}</span>}
              {prog>0&&<span style={{fontSize:8,opacity:.7,fontWeight:600}}>{prog>=90?t.encourageAlmost:prog>=70?t.encourageGreat:prog>=50?t.encourageHalf:prog>=25?t.encourageProgress:""}</span>}
            </div>
          </div>

          {/* ═══ CROSS-LANGUAGE CONTEXT — Module system mapping (only for cross-lang) ═══ */}
          {sL!==tL&&(function(){
            var srcMod=MODULE_CONVENTIONS[sL]||{};
            var tgtMod=MODULE_CONVENTIONS[tL]||{};
            return <div style={{display:"flex",gap:6,fontSize:9}}>
              <div style={{flex:1,padding:"8px 10px",borderRadius:10,background:T.w,border:"1px solid "+T.bdL}}>
                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                  <span style={{fontSize:11}}>{(LANGS[sL]||{}).i}</span>
                  <span style={{fontWeight:700,color:T.nv}}>{(LANGS[sL]||{}).n}</span>
                </div>
                <div style={{fontSize:8,color:T.txM,lineHeight:1.3}}>{srcMod.system||"—"}</div>
                <div style={{fontSize:7,color:T.txD,marginTop:2}}>{srcMod.naming||""}</div>
              </div>
              <div style={{alignSelf:"center",fontSize:14,color:T.bl}}>{"→"}</div>
              <div style={{flex:1,padding:"8px 10px",borderRadius:10,background:T.blM,border:"1px solid "+T.blP}}>
                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                  <span style={{fontSize:11}}>{(LANGS[tL]||{}).i}</span>
                  <span style={{fontWeight:700,color:T.nv}}>{(LANGS[tL]||{}).n}</span>
                </div>
                <div style={{fontSize:8,color:T.txM,lineHeight:1.3}}>{tgtMod.system||"—"}</div>
                <div style={{fontSize:7,color:T.txD,marginTop:2}}>{tgtMod.naming||""}</div>
              </div>
            </div>
          })()}

          {/* ═══ PROGRESS RING + ACTIVE PHASE CARD ═══ */}
          <div style={Object.assign({},S.card,{padding:"16px 20px"})}>
            <div style={{display:"flex",alignItems:"center",gap:20}}>
              {/* Ring */}
              <div style={{position:"relative",width:88,height:88,flexShrink:0}}>
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="38" fill="none" stroke={dark?"#2d3348":"#e8ecf0"} strokeWidth="5"/>
                  <circle cx="44" cy="44" r="38" fill="none" stroke={curPhDef.c} strokeWidth="5" strokeDasharray={prog*2.39+" 239"} strokeLinecap="round" transform="rotate(-90 44 44)" style={{transition:"stroke-dasharray .6s ease"}}/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:20,fontWeight:900,fontFamily:T.f,color:T.nv,lineHeight:1}}>{prog+"%"}</div>
                  <div style={{fontSize:7,color:T.txD,fontWeight:600}}>{doneFiles.length+"/"+fc}</div>
                </div>
              </div>
              {/* Phase info + what's happening now */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <span style={{fontSize:16}}>{curPhDef.ic}</span>
                  <span style={{fontSize:13,fontWeight:800,color:T.nv}}>{curPhDef.l}</span>
                  {migPhase==="migration"&&<span style={{fontFamily:T.f,fontSize:9,color:T.bl,fontWeight:700}}>{doneFiles.length+"/"+fc}</span>}
                </div>
                <div style={{fontSize:10,color:T.txM,marginBottom:6}}>{curPhDef.d}</div>
                {/* Active file chip — what's being processed RIGHT NOW */}
                {activeFile&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:8,background:activeFile.st==="planning"?T.blP:T.blM,border:"1px solid "+(activeFile.st==="planning"?"#c4b5fd":T.blP)}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:activeFile.st==="planning"?"#7c3aed":T.bl,animation:"pulse 1.5s infinite",flexShrink:0}}/>
                  <span style={{fontSize:8,fontWeight:700,color:activeFile.st==="planning"?"#7c3aed":T.bl,textTransform:"uppercase",letterSpacing:.5}}>{activeFile.st==="planning"?t.mgPlanning:t.mgActive}</span>
                  <span style={{fontFamily:T.f,fontSize:10,fontWeight:600,color:T.nv,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeFile.file}</span>
                  {activeFile.targetFile&&activeFile.targetFile!==activeFile.file&&<span style={{color:T.bl,fontSize:8,flexShrink:0}}>{"→ "+activeFile.targetFile}</span>}
                  {activeFile.st==="migrating"&&activeFile.planOk!==undefined&&<span style={{fontSize:7,padding:"1px 5px",borderRadius:4,background:activeFile.planOk?"#f0fdf4":"#fffbeb",color:activeFile.planOk?T.g:"#92400e",fontWeight:700}}>{activeFile.planOk?(activeFile.planChanges||0)+" changes":"⚡ sin plan"}</span>}
                  {activeFile.capacity&&<span style={{fontSize:6,padding:"1px 4px",borderRadius:3,background:activeFile.capacity.tier>=3?"#fef2f2":activeFile.capacity.tier>=2?"#fffbeb":"#f0fdf4",color:activeFile.capacity.tier>=3?T.r:activeFile.capacity.tier>=2?T.y:T.g,fontWeight:700}}>{(activeFile.capacity.promoted?"↑ ":"")+activeFile.capacity.label+" "+Math.round(activeFile.capacity.migTokens/1000)+"k tk"}</span>}
                  {activeFile.ts&&<span style={{fontFamily:T.f,fontSize:9,color:activeFile.st==="planning"?"#7c3aed":T.bl,fontWeight:700,marginLeft:"auto",flexShrink:0}}>{fmtMs(now-activeFile.ts)}</span>}
                </div>}
                {/* Phase-level activity when no file active */}
                {!activeFile&&(migPhase==="analysis"||migPhase==="consolidation"||migPhase==="integration"||migPhase==="qa")&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:8,background:curPhDef.c+"10",border:"1px solid "+curPhDef.c+"25"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:curPhDef.c,animation:"pulse 1.5s infinite",flexShrink:0}}/>
                  <span style={{fontSize:10,fontWeight:600,color:curPhDef.c}}>{curPhDef.d}</span>
                  {(function(){var phLog=phaseLogs.find(function(l){return l.phase===migPhase&&l.st==="run"});return phLog&&phLog.ts?<span style={{fontFamily:T.f,fontSize:9,color:curPhDef.c,fontWeight:700,marginLeft:"auto"}}>{fmtMs(now-phLog.ts)}</span>:null})()}
                </div>}
              </div>
            </div>
          </div>

          {/* ═══ LIVE METRICS — 5 KPI cards ═══ */}
          {(function(){
            var costUsd=mlObj?((_tks.i*(mlObj.pi||0)+_tks.o*(mlObj.po||0))/1000000):0;
            var costStr=costUsd>0?(costUsd<0.01?"<$0.01":"$"+costUsd.toFixed(3)):"--";
            var tkTotal=_tks.i+_tks.o;
            var tkStr=tkTotal>0?(tkTotal>1000?Math.round(tkTotal/1000)+"k":String(tkTotal)):"--";
            return <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
              {[
                {l:t.mgFiles,v:doneFiles.length+"/"+fc,ic:"",c:T.bl,sub:pendingCount>0?pendingCount+" "+t.mgPending.toLowerCase():""},
                {l:t.mgApiCalls,v:String(_tks.calls||apiCount),ic:"🔌",c:"#6366f1",sub:""},
                {l:t.mgThroughput,v:fpm>0?String(fpm):"--",ic:"›",c:"#059669",sub:fpm>0?t.mgFilesPerMin:""},
                {l:t.mgTokens,v:tkStr,ic:"🔤",c:"#d97706",sub:linesProc>0?linesProc.toLocaleString()+" ln":""},
                {l:t.mgCost,v:costStr,ic:"💰",c:"#dc2626",sub:mlObj?mlObj.n:""}
              ].map(function(m,i){
                return <div key={i} style={{padding:"6px 4px",borderRadius:10,background:T.w,border:"1px solid "+T.bdL,textAlign:"center"}}>
                  <div style={{fontSize:10,marginBottom:1}}>{m.ic}</div>
                  <div style={{fontSize:13,fontWeight:900,color:m.c,fontFamily:T.f,lineHeight:1}}>{m.v}</div>
                  <div style={{fontSize:6,color:T.txD,fontWeight:600,textTransform:"uppercase",marginTop:2}}>{m.l}</div>
                  {m.sub&&<div style={{fontSize:6,color:T.txM}}>{m.sub}</div>}
                </div>
              })}
            </div>
          })()}

          {/* ═══ PHASE PIPELINE — Connected stepper ═══ */}
          <div style={Object.assign({},S.card,{padding:"10px 14px"})}>
            <div style={{display:"flex",alignItems:"flex-start",gap:0}}>
              {phDefs.map(function(ph,idx){
                var allPhases=["analysis","migration","consolidation","integration","qa","done"];
                var ci=allPhases.indexOf(migPhase);
                var pi=allPhases.indexOf(ph.k);
                var isDone=ci>pi;
                var isAct=ci===pi;
                var phLog=phaseLogs.find(function(l){return l.phase===ph.k&&(l.st==="done"||l.st==="checked"||l.st==="fixed")});
                var dur=phLog&&phLog.durationMs?fmtMs(phLog.durationMs):"";
                var sc=phLog&&phLog.score!==undefined?phLog.score:null;
                return <div key={ph.k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
                  {idx>0&&<div style={{position:"absolute",top:11,right:"50%",width:"100%",height:2,background:isDone?T.g:isAct?"linear-gradient(90deg,"+T.bl+","+T.bdL+")":T.bdL,zIndex:0}}/>}
                  <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:isDone||isAct?9:8,fontWeight:800,position:"relative",zIndex:1,border:"2px solid "+(isDone?T.g:isAct?ph.c:T.bdL),background:isDone?T.g:isAct?ph.c:T.w,color:isDone||isAct?"#fff":T.txD,transition:"all .3s"}}>
                    {isDone?"✓":isAct?ph.ic.slice(0,2):(idx+1)}
                  </div>
                  <div style={{fontSize:7,fontWeight:isAct?800:600,color:isDone?T.g:isAct?T.nv:T.txD,marginTop:3,textAlign:"center",lineHeight:1.1,maxWidth:70}}>{ph.l}</div>
                  {dur&&<div style={{fontSize:7,fontFamily:T.f,color:T.g,fontWeight:700}}>{dur}</div>}
                  {sc!==null&&<div style={{fontSize:7,fontFamily:T.f,fontWeight:700,color:sc>=90?T.g:sc>=70?T.y:T.r}}>{sc+"/100"}</div>}
                </div>
              })}
            </div>
          </div>

          {/* ═══ ACTIVITY LOG — Phase events (compact, auto-scrolled) ═══ */}
          {phaseLogs.length>0&&<div style={S.card}>
            <div style={Object.assign({},S.cH,{padding:"6px 14px"})}><span style={{fontWeight:700,fontSize:10,color:T.nv}}>{t.mgActivity}</span></div>
            <div style={{maxHeight:110,overflowY:"auto"}}>
              {phaseLogs.map(function(l,i){
                var phI=phDefs.find(function(p){return p.k===l.phase})||{ic:"•",l:l.phase,c:T.txM};
                var isDone=l.st==="done"||l.st==="checked"||l.st==="fixed";
                var isErr=l.phase==="rollback"||l.phase==="stall"||l.phase==="cancelled";
                // Consolidation sub-phase labels
                var subLabel=l.subPhase==="audit"?t.gPhB2a:l.subPhase==="fix"?t.gPhB2b:null;
                var displayLabel=subLabel||phI.l;
                // Consolidation sub-phase metrics
                var subMeta="";
                if (l.subPhase==="audit"&&isDone) subMeta=l.connections+" "+t.pConns+(l.broken>0?" · "+l.broken+" "+t.pBroken:"")+(l.issues>0?" · "+l.issues+" "+t.pIssues:"");
                if (l.subPhase==="fix"&&isDone) subMeta=(l.fixed||0)+" fixed"+(l.fixes?" · "+(l.fixes||0)+" "+t.pIssues:"");
                return <div key={i} style={{padding:"4px 14px",borderBottom:"1px solid "+T.bdL,display:"flex",alignItems:"center",gap:6,fontSize:9,background:isErr?T.errBg+"80":"transparent"}}>
                  <span style={{fontSize:10}}>{isDone?"✅":isErr?"⚠️":l.subPhase?"↳":phI.ic}</span>
                  <span style={{fontWeight:600,color:isErr?T.r:l.subPhase?T.txM:T.nv,flex:1,fontSize:l.subPhase?8:9}}>{displayLabel}{l.iter?" #"+l.iter:""}</span>
                  {subMeta&&<span style={{padding:"0 5px",borderRadius:4,fontSize:7,fontWeight:600,background:T.blP,color:T.bl}}>{subMeta}</span>}
                  {l.score!==undefined&&<span style={{padding:"0 5px",borderRadius:4,fontSize:7,fontWeight:800,background:l.score>=95?T.okBg:l.score>=80?T.warnBg:T.errBg,color:l.score>=95?T.g:l.score>=80?T.y:T.r}}>{l.score+"/100"}</span>}
                  {l.detail&&<span style={{fontSize:7,color:T.txM,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.detail}</span>}
                  {isDone&&l.durationMs&&<span style={{fontFamily:T.f,fontSize:7,fontWeight:700,color:T.g}}>{fmtMs(l.durationMs)}</span>}
                  {!isDone&&!isErr&&l.ts&&<span style={{fontFamily:T.f,fontSize:8,color:T.bl,fontWeight:700}}>{fmtMs(now-l.ts)}</span>}
                  {!isDone&&!isErr&&<div style={{width:18,height:2,borderRadius:1,background:T.bdL,overflow:"hidden"}}><div style={{width:"50%",height:"100%",background:T.bl,animation:"pulse 1.5s infinite"}}/></div>}
                </div>
              })}
            </div>
          </div>}

          {/* ═══ FILE QUEUE — Detailed file status with expandable change preview ═══ */}
          <div style={S.card}>
            <div style={Object.assign({},S.cH,{padding:"8px 14px"})}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontWeight:700,fontSize:11,color:T.nv}}>{"📁 "+t.mgQueue}</span>
                {doneFiles.length>0&&<span style={{padding:"1px 7px",borderRadius:10,fontSize:8,fontWeight:700,background:T.okBg,color:T.g}}>{doneFiles.length+" ✓"}</span>}
                {activeFile&&<span style={{padding:"1px 7px",borderRadius:10,fontSize:8,fontWeight:700,background:T.blP,color:T.bl}}>{"1 ⟳"}</span>}
                {pendingCount>0&&<span style={{padding:"1px 7px",borderRadius:10,fontSize:8,fontWeight:700,background:T.cBg,color:T.txD}}>{pendingCount+" ○"}</span>}
              </div>
              <div style={{width:80,height:5,borderRadius:3,background:T.bdL,overflow:"hidden"}}>
                <div style={{width:Math.round((doneFiles.length/Math.max(fc,1))*100)+"%",height:"100%",background:T.g,borderRadius:3,transition:"width .5s"}}/>
              </div>
            </div>
            <div style={{maxHeight:280,overflowY:"auto"}}>
              {files.map(function(f,fi){
                var fLog=fileLogs.find(function(l){return l.file===f.name});
                var isDone=fLog&&fLog.st==="done";
                var isActive=fLog&&fLog.st!=="done"&&fLog;
                var isPending=!fLog;
                var dur=isDone&&fLog.durationMs?fmtMs(fLog.durationMs):"";
                var tgtName=fLog&&fLog.targetFile&&fLog.targetFile!==f.name?fLog.targetFile:null;
                var lc=f.content?f.content.split("\n").length:0;
                var langDef=f.lang?LANGS[f.lang]:null;
                var tgtLangDef=tL?LANGS[tL]:null;
                var hasPreview=isDone&&fLog.preview&&fLog.preview.length>0;
                return <div key={fi}>
                  <div style={{padding:"5px 14px",borderBottom:hasPreview?"none":"1px solid "+T.bdL,display:"flex",alignItems:"center",gap:8,background:isActive?T.blM:isDone?T.okBg+"40":"transparent",transition:"background .3s"}}>
                    {/* Status node */}
                    <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"2px solid "+(isDone?T.g:isActive?T.bl:T.bdL),background:isDone?T.g:isActive?"transparent":"transparent",fontSize:8,fontWeight:800,color:isDone?"#fff":isActive?T.bl:T.txD,transition:"all .3s"}}>
                      {isDone?"✓":isActive?"⟳":(fi+1)}
                    </div>
                    {/* File info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        {langDef&&<span style={{fontSize:9}}>{langDef.i}</span>}
                        <span style={{fontFamily:T.f,fontSize:9,fontWeight:isDone?600:isActive?700:400,color:isDone?T.nv:isActive?T.nv:T.txD,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.path||f.name}</span>
                        {tgtName&&tgtLangDef&&<span style={{fontSize:7,color:T.bl}}>{"→ "+tgtLangDef.i+" "+tgtName}</span>}
                      </div>
                      {isPending&&<div style={{fontSize:7,color:T.txD,fontStyle:"italic"}}>{t.mgPending+" · "+lc+" "+t.lines}</div>}
                    </div>
                    {/* Right metrics */}
                    <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                      {isDone&&fLog.planComplexity&&<span title={fLog.capacity?"Plan: "+fLog.capacity.planTokens+"tk, Migrate: "+fLog.capacity.migTokens+"tk"+(fLog.capacity.promoted?" (promoted from "+fLog.capacity.label.replace(fLog.capacity.label,"tier "+fLog.capacity.originalTier+"→"+fLog.capacity.tier)+")":" (tier "+fLog.capacity.tier+")")+(fLog.capacity.multipliers?", combined: x"+fLog.capacity.multipliers.combined.toFixed(2):""):""} style={{fontSize:6,padding:"1px 4px",borderRadius:3,fontWeight:700,background:fLog.planComplexity==="complex"?"#fef2f2":fLog.planComplexity==="moderate"?"#fffbeb":"#f0fdf4",color:fLog.planComplexity==="complex"?T.r:fLog.planComplexity==="moderate"?T.y:T.g}}>{(fLog.capacity&&fLog.capacity.promoted?"↑ ":"")+fLog.planComplexity+(fLog.capacity?" "+Math.round(fLog.capacity.migTokens/1000)+"k":"")}</span>}
                      {isDone&&fLog.linesOrig&&<span style={{fontSize:7,color:T.txD,fontFamily:T.f}}>{fLog.linesOrig+"→"+fLog.linesMig+" ln"}</span>}
                      {isDone&&<span style={{fontSize:8,color:T.txM}}>{(fLog.ch||0)+" "+t.changes}</span>}
                      {isDone&&dur&&<span style={{fontFamily:T.f,fontSize:8,fontWeight:700,color:T.g,padding:"1px 6px",borderRadius:4,background:T.okBg}}>{dur}</span>}
                      {isDone&&fLog.tkI&&<span style={{fontSize:6,color:T.txD,fontFamily:T.f}}>{Math.round((fLog.tkI+fLog.tkO)/1000)+"k tk"}</span>}
                      {isActive&&<span style={{fontFamily:T.f,fontSize:9,fontWeight:700,color:T.bl}}>{fmtMs(now-(isActive.ts||now))}</span>}
                      {isActive&&<div style={{width:20,height:3,borderRadius:2,background:T.bdL,overflow:"hidden"}}><div style={{width:"60%",height:"100%",background:T.bl,borderRadius:2,animation:"pulse 1.5s infinite"}}/></div>}
                    </div>
                  </div>
                  {/* ── Change Preview (inline, always visible for done files) ── */}
                  {hasPreview&&<div style={{padding:"3px 14px 5px 42px",borderBottom:"1px solid "+T.bdL,background:T.cBg}}>
                    {fLog.preview.map(function(ch,ci){
                      return <div key={ci} style={{fontSize:8,color:T.txM,fontFamily:T.f,lineHeight:1.4,display:"flex",gap:4}}>
                        <span style={{color:T.g,flexShrink:0}}>{"+"}</span>
                        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch}</span>
                      </div>
                    })}
                  </div>}
                </div>
              })}
            </div>
            {avgFileMs>0&&<div style={{padding:"4px 14px",borderTop:"1px solid "+T.bdL,background:T.cBg,display:"flex",justifyContent:"space-between",fontSize:8,color:T.txD}}>
              <span>{"⌀ "+fmtMs(avgFileMs)+" / "+t.files}</span>
              {linesProc>0&&<span>{linesProc.toLocaleString()+" "+t.mgLinesProcessed}</span>}
            </div>}
          </div>

          {/* ═══ REPORT CARD — Auto-generated when pipeline finishes (no extra API call) ═══ */}
          {migPhase==="done"&&(function(){
            var finalPhLog=phaseLogs.find(function(l){return l.phase==="integration"&&(l.st==="done"||l.st==="fixed")});
            var finalScore=finalPhLog&&finalPhLog.score!==undefined?finalPhLog.score:null;
            var totalIter=phaseLogs.filter(function(l){return l.phase==="qa"}).length;
            var fixCount=phaseLogs.filter(function(l){return l.phase==="qa"&&l.st==="done"}).length;
            var stallLog=phaseLogs.find(function(l){return l.phase==="stall"});
            var cancelLog=phaseLogs.find(function(l){return l.phase==="cancelled"});
            var costUsd=mlObj?((_tks.i*(mlObj.pi||0)+_tks.o*(mlObj.po||0))/1000000):0;
            var costStr=costUsd>0?(costUsd<0.01?"<$0.01":"$"+costUsd.toFixed(3)):"$0.00";
            // Grade: A(90+ with strict scoring ≈ old 95), B(80+), C(70+), D(50+), F(<50)
            var grade=finalScore===null?"?":(finalScore>=90?"A":finalScore>=80?"B":finalScore>=70?"C":finalScore>=50?"D":"F");
            var gradeClr=grade==="A"||grade==="B"?T.g:grade==="C"?T.y:T.r;
            var totalLines=doneFiles.reduce(function(s,l){return s+(l.linesMig||0)},0);
            return <div style={Object.assign({},S.card,{overflow:"hidden",border:"2px solid "+(finalScore>=95?T.g+"60":finalScore>=70?T.y+"60":T.r+"60")})}>
              {/* Header with grade */}
              <div style={{padding:"14px 20px",background:finalScore>=95?T.okBg:finalScore>=70?T.warnBg:T.errBg,display:"flex",alignItems:"center",gap:14,borderBottom:"1px solid "+T.bdL}}>
                <div style={{width:52,height:52,borderRadius:12,border:"3px solid "+gradeClr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:gradeClr,background:T.w}}>{grade}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:T.nv}}>{t.rcTitle}</div>
                  <div style={{fontSize:10,color:T.txM}}>
                    {(LANGS[sL]||{}).n+" "+sV+" → "+(LANGS[tL]||{}).n+" "+tV+" · "+fc+" "+t.files}
                    {sL!==tL&&<span style={{marginLeft:4,fontSize:8,fontWeight:700,color:T.y}}>{t.crossLang}</span>}
                  </div>
                </div>
                {finalScore!==null&&<div style={{textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:900,fontFamily:T.f,color:gradeClr}}>{finalScore}</div>
                  <div style={{fontSize:7,color:T.txD,fontWeight:600}}>{"/ 100"}</div>
                </div>}
              </div>
              {/* Key metrics grid */}
              <div style={{padding:"10px 20px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                <div><div style={{fontSize:7,color:T.txD,fontWeight:600,textTransform:"uppercase"}}>{t.rcTime}</div><div style={{fontSize:13,fontWeight:900,fontFamily:T.f,color:T.nv}}>{fmtMs(elapsed)}</div></div>
                <div><div style={{fontSize:7,color:T.txD,fontWeight:600,textTransform:"uppercase"}}>{t.rcIter}</div><div style={{fontSize:13,fontWeight:900,fontFamily:T.f,color:T.bl}}>{totalIter||1}</div></div>
                <div><div style={{fontSize:7,color:T.txD,fontWeight:600,textTransform:"uppercase"}}>{t.mgTokens}</div><div style={{fontSize:13,fontWeight:900,fontFamily:T.f,color:"#d97706"}}>{(_tks.i+_tks.o)>1000?Math.round((_tks.i+_tks.o)/1000)+"k":(_tks.i+_tks.o)}</div></div>
                <div><div style={{fontSize:7,color:T.txD,fontWeight:600,textTransform:"uppercase"}}>{t.mgCost}</div><div style={{fontSize:13,fontWeight:900,fontFamily:T.f,color:"#dc2626"}}>{costStr}</div></div>
              </div>
              {/* 8-layer quality breakdown (from integration check) */}
              {intR&&intR.ok&&intR.result.layers&&intR.result.layers.length>0&&<div style={{padding:"8px 20px 6px",borderTop:"1px solid "+T.bdL}}>
                <div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:6,textTransform:"uppercase"}}>{"Quality Layers"}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 12px"}}>
                  {intR.result.layers.map(function(ly,i){
                    var sc=ly.score||0;
                    var clr=sc>=90?T.g:sc>=70?T.y:T.r;
                    return <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:clr,flexShrink:0}}/>
                      <span style={{fontSize:7,fontWeight:600,color:T.tx,width:65,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ly.name}</span>
                      <div style={{flex:1,height:4,borderRadius:2,background:T.bdL,overflow:"hidden"}}><div style={{width:sc+"%",height:"100%",borderRadius:2,background:clr}}/></div>
                      <span style={{fontSize:7,fontWeight:800,fontFamily:T.f,color:clr,width:18,textAlign:"right"}}>{sc}</span>
                    </div>
                  })}
                </div>
                {intR.result.scoreBreakdown&&<div style={{marginTop:4,fontSize:7,fontFamily:T.f,color:T.txD,lineHeight:1.3}}>{"📐 "+intR.result.scoreBreakdown}</div>}
              </div>}
              {/* Pipeline summary — compact phase list */}
              <div style={{padding:"6px 20px 10px",borderTop:"1px solid "+T.bdL}}>
                <div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:4,textTransform:"uppercase"}}>{t.rcPipeline}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {phaseLogs.filter(function(l){return l.st==="done"||l.st==="checked"||l.st==="fixed"}).map(function(l,i){
                    var ph=phDefs.find(function(p){return p.k===l.phase})||{ic:"•",l:l.phase};
                    var bg=l.score!==undefined?(l.score>=95?T.okBg:l.score>=70?T.warnBg:T.errBg):T.cBg;
                    var clr=l.score!==undefined?(l.score>=95?T.g:l.score>=70?T.y:T.r):T.txM;
                    return <span key={i} style={{padding:"2px 8px",borderRadius:6,fontSize:7,fontWeight:700,background:bg,color:clr,display:"inline-flex",alignItems:"center",gap:3}}>
                      {ph.ic+" "+ph.l}{l.iter?" #"+l.iter:""}
                      {l.score!==undefined&&<span style={{fontFamily:T.f}}>{l.score}</span>}
                      {l.durationMs&&<span style={{fontFamily:T.f,opacity:.7}}>{fmtMs(l.durationMs)}</span>}
                    </span>
                  })}
                  {stallLog&&<span style={{padding:"2px 8px",borderRadius:6,fontSize:7,fontWeight:700,background:T.warnBg,color:T.y}}>{"⏸ Stall "+stallLog.score+"/100"}</span>}
                  {cancelLog&&<span style={{padding:"2px 8px",borderRadius:6,fontSize:7,fontWeight:700,background:T.errBg,color:T.r}}>{"✕ "+t.cancel}</span>}
                </div>
              </div>
              {/* File summary table */}
              <div style={{padding:"6px 20px 12px",borderTop:"1px solid "+T.bdL}}>
                <div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:4,textTransform:"uppercase"}}>{t.mgFiles+" ("+doneFiles.length+")"}</div>
                {doneFiles.map(function(fl,i){
                  var origF=files.find(function(f){return f.name===fl.file});
                  return <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"2px 0",fontSize:8}}>
                    <span style={{color:T.g,fontSize:9}}>{"✓"}</span>
                    <span style={{fontFamily:T.f,fontWeight:600,color:T.nv,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fl.file}{fl.targetFile&&fl.targetFile!==fl.file?<span style={{color:T.bl}}>{" → "+fl.targetFile}</span>:null}</span>
                    {fl.linesOrig&&<span style={{color:T.txD,fontFamily:T.f,fontSize:7}}>{fl.linesOrig+"→"+fl.linesMig}</span>}
                    <span style={{color:T.txM}}>{(fl.ch||0)+" "+t.changes}</span>
                    {fl.durationMs&&<span style={{fontFamily:T.f,color:T.g,fontWeight:700}}>{fmtMs(fl.durationMs)}</span>}
                  </div>
                })}
                {totalLines>0&&<div style={{marginTop:4,fontSize:7,color:T.txD,textAlign:"right"}}>{totalLines.toLocaleString()+" "+t.mgLinesProcessed+" · "+_tks.calls+" API calls · "+costStr}</div>}
              </div>
              {/* Action button */}
              <div style={{padding:"8px 20px 12px",textAlign:"center"}}>
                <button onClick={function(){setVw("results");setActR(0);setShR(true)}} style={Object.assign({},S.btn("p"),{padding:"10px 24px",fontSize:12})}>{"→ "+t.results}</button>
              </div>
            </div>
          })()}

        </div>
      })()}

      {/* RESULTS */}
      {vw==="results"&&res.length>0&&res[actR]&&(function(){
        var r=res[actR],d=r.diff||[];
        var ad=d.filter(function(x){return x.t==="add"}).length;
        var rm=d.filter(function(x){return x.t==="del"}).length;
        return <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
            <h2 style={{fontSize:16,fontWeight:800,color:T.nv}}>{"✅ "+t.done+" ("+res.length+")"}</h2>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              <button onClick={function(){setShR(!shR)}} style={S.btn()}>{"⚠️"}</button>
              <button disabled={pdfLd} onClick={generatePDF} style={Object.assign({},S.btn("ai"),{opacity:pdfLd?.6:1})}>{"📄 "+(pdfLd?t.pdfGen:t.pdfExport)}</button>
              <button onClick={function(){res.forEach(function(x){dlF(x.migrated,dlN(x.name,x.targetName))})}} style={S.btn("g")}>{"⬇ "+t.dlAll}</button>
                            <button onClick={rst} style={S.btn("p")}>{"🔄 "+t.newMig}</button>
            </div></div>

          {shR&&rsk.length>0&&<div style={Object.assign({},S.card,{border:"1px solid #fde68a"})}><div style={Object.assign({},S.cH,{background:T.warnBg})}><span style={{fontWeight:700,color:T.nv}}>{"⚠️ "+t.risks}</span></div><div style={{padding:8}}>{rsk.map(function(x,i){return <div key={i} style={{padding:"5px 8px",borderRadius:6,marginBottom:3,background:T.cBg,display:"flex",alignItems:"center",gap:6,fontSize:10}}>{bR(x.lv)}<b>{x.cat}</b>{" — "+x.msg}</div>})}</div></div>}

          {/* INTEGRATION REPORT */}
          {intR&&intR.ok&&<div style={Object.assign({},S.card,{border:"2px solid "+(intR.result.score>=95?T.okBd:intR.result.score>=70?T.warnBd:T.errBd)})}>
            <div style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10,background:intR.result.score>=95?T.okBg:intR.result.score>=70?T.warnBg:T.errBg,borderBottom:"1px solid "+T.bdL}}>
              <div style={{width:44,height:44,borderRadius:"50%",border:"3px solid "+(intR.result.score>=95?T.g:intR.result.score>=70?T.y:T.r),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:intR.result.score>=95?T.g:intR.result.score>=70?T.y:T.r}}>{intR.result.score}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:800,color:T.nv}}>{"🔗 "+t.intTitle}</div>
                <div style={{fontSize:10,color:T.txM}}>{intR.result.pass?"✅ "+t.intPass:"⚠️ "+t.intFail}</div>
              </div>
            </div>
            {intR.result.summary&&<div style={{padding:"8px 16px",fontSize:10,color:T.txM,background:T.blM,borderBottom:"1px solid "+T.bdL}}>{intR.result.summary}</div>}
            {intR.result.scoreBreakdown&&<div style={{padding:"4px 16px",fontSize:9,fontFamily:T.f,color:T.txD,background:T.cBg,borderBottom:"1px solid "+T.bdL}}>{"📐 "+intR.result.scoreBreakdown}</div>}
            <div style={{padding:8,maxHeight:200,overflowY:"auto"}}>
              {intR.result.issues&&intR.result.issues.length>0&&<div style={{marginBottom:6}}>
                <div style={{fontSize:10,fontWeight:700,color:T.r,marginBottom:3,padding:"0 6px"}}>{""+t.intIssues+" ("+intR.result.issues.length+")"}</div>
                {intR.result.issues.map(function(is,i){return <div key={i} style={{padding:"5px 8px",marginBottom:3,borderRadius:6,background:is.severity==="critical"?T.errBg:T.warnBg,border:"1px solid "+(is.severity==="critical"?T.errBd:T.warnBd),fontSize:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                    <span style={{fontSize:7,fontWeight:800,padding:"0 5px",borderRadius:3,background:is.severity==="critical"?T.r:is.severity==="major"?"#f97316":T.y,color:"#fff"}}>{is.severity}</span>
                    <span style={{fontSize:7,fontWeight:700,padding:"0 4px",borderRadius:3,background:T.bdL,color:T.txM}}>{is.category}</span>
                    {is.files&&<span style={{fontSize:8,color:T.txD,fontFamily:T.f}}>{is.files.join(" ↔ ")}</span>}
                  </div>
                  <div style={{color:is.severity==="critical"?T.r:T.warnTx,fontWeight:600}}>{is.msg}</div>
                  {is.fix&&<div style={{marginTop:2,padding:"2px 6px",borderRadius:4,background:T.w,fontSize:9,color:T.txM,fontFamily:T.f}}>{"→ "+is.fix}</div>}
                </div>})}
              </div>}
              {intR.result.verified&&intR.result.verified.length>0&&<div>
                <div style={{fontSize:10,fontWeight:700,color:T.g,marginBottom:3,padding:"0 6px"}}>{""+t.intVerified}</div>
                {intR.result.verified.map(function(v,i){return <div key={i} style={{padding:"2px 8px",fontSize:10,color:T.g}}>{"✓ "+v}</div>})}
              </div>}
            </div>
          </div>}

          {/* AUDIT TRAIL — Professional timing & analytics dashboard */}
          {auditTrail&&(function(){
            // ── Computed analytics ──
            var phases=auditTrail.phases||[];
            var totalMs=auditTrail.totalDurationMs||1;
            var fileTimes=phases.filter(function(p){return p.id==="B"&&p.files}).reduce(function(a,p){return a.concat(p.files||[])},[]).filter(function(f){return f.durationMs>0});
            var avgFile=fileTimes.length?Math.round(fileTimes.reduce(function(s,f){return s+f.durationMs},0)/fileTimes.length):0;
            var slowFile=fileTimes.length?Math.max.apply(null,fileTimes.map(function(f){return f.durationMs})):0;
            var fastFile=fileTimes.length?Math.min.apply(null,fileTimes.map(function(f){return f.durationMs})):0;
            var cPhases=phases.filter(function(p){return p.id&&p.id.startsWith("C")&&p.score!==undefined&&!p.rolledBack});
            var dPhases=phases.filter(function(p){return p.id&&p.id.startsWith("D")});
            var migTime=phases.filter(function(p){return p.id==="A"||p.id==="B"||p.id==="B2"||p.id==="B2a"||p.id==="B2b"}).reduce(function(s,p){return s+(p.durationMs||0)},0);
            var qaTime=phases.filter(function(p){return p.id&&(p.id.startsWith("C")||p.id.startsWith("D"))}).reduce(function(s,p){return s+p.durationMs},0);
            var migPct=Math.round((migTime/totalMs)*100);
            var qaPct=100-migPct;
            // Phase descriptions
            var phDescsAll={
              es:{A:"Análisis de arquitectura, dependencias y contratos del codebase",B:"Por archivo: planificación detallada + migración guiada por receta",B2:"Auditoría de dependencias cross-file + consolidación con corrección guiada",C1:"Validación integral: 12 dimensiones (integración + calidad)",D1:"Corrección automática de issues detectados por Claude",C2:"Re-validación post-fix con regression check",D2:"Corrección con escalation — estrategia diferente",C3:"Verificación final de integración",D3:"Corrección final con rewrite completo",C4:"Check final"},
              en:{A:"Architecture analysis: dependencies, contracts, entry points",B:"Per-file: detailed planning + recipe-guided migration",B2:"Cross-file dependency audit + guided consolidation fix",C1:"Comprehensive validation: 12 dimensions (integration + quality)",D1:"Automatic fix of issues detected by Claude",C2:"Post-fix re-validation with regression check",D2:"Fix with escalation — different strategy",C3:"Final integration verification",D3:"Final fix with full rewrite",C4:"Final check"},
              pt:{A:"Análise de arquitetura, dependências e contratos do codebase",B:"Migração sequencial por arquivo com contexto de dependências",B2:"Consolidação cross-file: imports, signatures, module system",C1:"Validação integral: 12 dimensões (integração + qualidade)",D1:"Correção automática de issues detectados por Claude",C2:"Re-validação pós-fix com regression check",D2:"Correção com escalation — estratégia diferente",C3:"Verificação final de integração",D3:"Correção final com rewrite completo",C4:"Check final"}
            };
            var phDescs=phDescsAll[uiL]||phDescsAll.es;
            var phIcons={A:"C",B:"›",B2:"B2",C1:"✅",C2:"✅",C3:"✅",C4:"✅",D1:"",D2:"",D3:""};
            var phColors={A:"#6366f1",B:"#2563EB",B2:"#0ea5e9",B2a:"#38bdf8",B2b:"#0ea5e9",C1:"#059669",C2:"#059669",C3:"#059669",C4:"#059669",D1:"#d97706",D2:"#d97706",D3:"#d97706"};
            // Category groups
            var groups=[
              {key:"mig",label:"Migración",ids:["A","B","B2"],color:"#2563EB",icon:"›"},
              {key:"qa",label:"QA / Integración",ids:phases.filter(function(p){return p.id&&(p.id.startsWith("C")||p.id.startsWith("D"))}).map(function(p){return p.id}),color:"#059669",icon:"✅"}
            ];

            return <div style={Object.assign({},S.card,{overflow:"visible"})}>
              {/* Header */}
              <div style={Object.assign({},S.cH,{background:"linear-gradient(135deg,"+T.nv+","+T.bl+")"})}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{"⏱️"}</span><div><div style={{fontWeight:800,fontSize:13,color:"#fff"}}>{t.auditTitle}</div><div style={{fontSize:9,color:"#93b4ff"}}>{t.auditDesc+" — "+phases.length+" "+t.auditPhases}</div></div></div>
                <button onClick={function(){dlF(JSON.stringify(auditTrail,null,2),"migraops_audit_"+auditTrail.id+".json")}} style={Object.assign({},S.btn("g"),{padding:"5px 12px",fontSize:9})}>{"📋 "+t.auditExport}</button>
              </div>

              {/* KPI Strip — Enhanced */}
              <div style={{padding:"14px 16px",display:"flex",gap:0,alignItems:"stretch",borderBottom:"1px solid "+T.bdL,flexWrap:"wrap"}}>
                {/* Total time with mini donut */}
                <div style={{flex:"1 1 auto",display:"flex",alignItems:"center",gap:10,padding:"0 12px",borderRight:"1px solid "+T.bdL,minWidth:140}}>
                  <div style={{position:"relative",width:44,height:44}}>
                    <svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke={T.bdL} strokeWidth="4"/><circle cx="22" cy="22" r="18" fill="none" stroke={T.bl} strokeWidth="4" strokeDasharray={migPct*1.13+" 113"} strokeLinecap="round" transform="rotate(-90 22 22)"/><circle cx="22" cy="22" r="18" fill="none" stroke={T.g} strokeWidth="4" strokeDasharray={qaPct*1.13+" 113"} strokeDashoffset={-migPct*1.13} strokeLinecap="round" transform="rotate(-90 22 22)"/></svg>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:T.nv,fontFamily:T.f}}>{phases.length}</div>
                  </div>
                  <div><div style={{fontSize:20,fontWeight:900,color:T.nv,fontFamily:T.f,lineHeight:1}}>{fmtMs(totalMs)}</div><div style={{fontSize:8,fontWeight:700,color:T.txD}}>{t.auditTotal}</div>
                    <div style={{display:"flex",gap:6,marginTop:2}}>
                      <span style={{fontSize:7,color:T.bl}}>{"● "+t.gPhB+" "+migPct+"%"}</span>
                      <span style={{fontSize:7,color:T.g}}>{"● "+t.gPhC+" "+qaPct+"%"}</span>
                    </div>
                  </div>
                </div>
                {/* API calls */}
                <div style={{flex:"0 0 auto",textAlign:"center",padding:"0 14px",borderRight:"1px solid "+T.bdL}}>
                  <div style={{fontSize:18,fontWeight:900,color:T.bl,fontFamily:T.f}}>{auditTrail.apiCalls}</div>
                  <div style={{fontSize:8,fontWeight:700,color:T.txD}}>{t.auditCalls}</div>
                </div>
                {/* Files */}
                <div style={{flex:"0 0 auto",textAlign:"center",padding:"0 14px",borderRight:"1px solid "+T.bdL}}>
                  <div style={{fontSize:18,fontWeight:900,color:T.nv,fontFamily:T.f}}>{auditTrail.config.fileCount}</div>
                  <div style={{fontSize:8,fontWeight:700,color:T.txD}}>{t.filesLbl}</div>
                </div>
                {/* Per-file stats */}
                {fileTimes.length>0&&<div style={{flex:"1 1 auto",display:"flex",gap:8,padding:"0 14px",borderRight:"1px solid "+T.bdL,alignItems:"center"}}>
                  <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:800,color:T.txM,fontFamily:T.f}}>{fmtMs(avgFile)}</div><div style={{fontSize:7,fontWeight:700,color:T.txD}}>{t.auditAvg}</div></div>
                  <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:800,color:T.r,fontFamily:T.f}}>{fmtMs(slowFile)}</div><div style={{fontSize:7,fontWeight:700,color:T.txD}}>{t.auditSlowest}</div></div>
                  <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:800,color:T.g,fontFamily:T.f}}>{fmtMs(fastFile)}</div><div style={{fontSize:7,fontWeight:700,color:T.txD}}>{t.auditFastest}</div></div>
                </div>}
                {/* Throughput */}
                {(function(){var totalLines=0;try{(res||[]).forEach(function(r){totalLines+=r.migrated?r.migrated.split("\n").length:0})}catch(e){};if(!totalLines)return null;var lps=totalMs>0?Math.round(totalLines/(totalMs/1000)):0;return <div style={{flex:"0 0 auto",textAlign:"center",padding:"0 14px",borderRight:"1px solid "+T.bdL}}>
                  <div style={{fontSize:13,fontWeight:800,color:"#6366f1",fontFamily:T.f}}>{totalLines}</div>
                  <div style={{fontSize:7,fontWeight:700,color:T.txD}}>{t.lines}</div>
                  <div style={{fontSize:7,color:T.txD}}>{lps+" "+t.lines+"/s"}</div>
                </div>})()}
                {/* Final score */}
                {auditTrail.finalScore!=null&&<div style={{flex:"0 0 auto",display:"flex",alignItems:"center",gap:6,padding:"0 14px"}}>
                  <div style={{width:40,height:40,borderRadius:"50%",border:"3px solid "+(auditTrail.finalScore>=95?T.g:auditTrail.finalScore>=80?T.y:T.r),display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:auditTrail.finalScore>=95?T.g:auditTrail.finalScore>=80?T.y:T.r,fontFamily:T.f}}>{auditTrail.finalScore}</div>
                  <div><div style={{fontSize:8,fontWeight:700,color:T.txD}}>{t.score}</div><div style={{fontSize:7,color:auditTrail.finalPass?T.g:T.y}}>{auditTrail.finalPass?"✓ PASS":""+t.obs}</div></div>
                </div>}
              </div>

              {/* Tab navigation */}
              <div style={{padding:"8px 16px",borderBottom:"1px solid "+T.bdL,display:"flex",gap:4,background:T.cBg}}>
                {[{k:"pipeline",l:"📊 "+t.auditPipeline},{k:"charts",l:"📈 "+t.auditDistrib},{k:"detail",l:"📋 "+t.auditDetail}].map(function(tb){
                  return <button key={tb.k} onClick={function(){setAudTab(tb.k)}} style={{padding:"4px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:T.ui,background:audTab===tb.k?T.nv:"transparent",color:audTab===tb.k?"#fff":T.txD,transition:"all .15s"}}>{tb.l}</button>
                })}
              </div>

              {/* ═══ TAB: Pipeline — Connected timeline with phase cards ═══ */}
              {audTab==="pipeline"&&<div style={{padding:"16px 16px 16px 28px"}}>
                {/* Expand/Collapse all */}
                <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
                  <button onClick={function(){var allExpanded=phases.every(function(ph){return audExpand[ph.id]});var n={};phases.forEach(function(ph){n[ph.id]=!allExpanded});setAudExpand(n)}} style={{fontSize:8,fontWeight:700,color:T.bl,background:"none",border:"none",cursor:"pointer",fontFamily:T.ui,padding:"2px 6px"}}>{phases.every(function(ph){return audExpand[ph.id]})?"▲ Collapse":"▼ Expand all"}</button>
                </div>
                {phases.map(function(ph,i){
                  var pct=Math.max(2,Math.round((ph.durationMs/totalMs)*100));
                  var clr=phColors[ph.id]||(ph.id.startsWith("C")?T.g:ph.id.startsWith("D")?T.y:T.bl);
                  var icon=phIcons[ph.id]||"⚙";
                  var desc=phDescs[ph.id]||(ph.name||"");
                  var stClr=ph.status==="done"?T.g:ph.status==="error"?T.r:T.y;
                  var isExpanded=audExpand[ph.id];
                  var isLast=i===phases.length-1;
                  // Group separator: detect transition from migration (A/B/B2) to QA (C/D)
                  var prevPh=i>0?phases[i-1]:null;
                  var isMigPhase=function(id){return id==="A"||id==="B"||id==="B2"};
                  var isQaPhase=function(id){return id&&(id.startsWith("C")||id.startsWith("D"))};
                  var showGroupSep=prevPh&&isMigPhase(prevPh.id)&&isQaPhase(ph.id);
                  // Detail string
                  var detailParts=[];
                  if(ph.score!==undefined)detailParts.push("Score: "+ph.score+"/100");
                  if(ph.issueCount!==undefined)detailParts.push(ph.issueCount+" issues");
                  if(ph.fixedFiles!==undefined)detailParts.push(ph.fixedFiles+" archivos corregidos");
                  if(ph.fixedFiles!==undefined&&ph.issueCount)detailParts.push(Math.round((ph.fixedFiles/(ph.issueCount||1))*100)+"% fix rate");
                  if(ph.fileCount!==undefined&&ph.id==="B")detailParts.push(ph.fileCount+" archivos migrados");
                  if(ph.detail&&!ph.score)detailParts.push(ph.detail);

                  return <div key={i}>
                    {showGroupSep&&<div style={{display:"flex",alignItems:"center",gap:8,margin:"6px 0 10px",paddingLeft:2}}>
                      <div style={{flex:1,height:1,background:"linear-gradient(90deg,"+T.g+","+T.bdL+")"}}></div>
                      <span style={{fontSize:8,fontWeight:800,color:T.g,textTransform:"uppercase",letterSpacing:1}}>{"✅ "+t.gPhC}</span>
                      <div style={{flex:1,height:1,background:"linear-gradient(90deg,"+T.bdL+","+T.g+")"}}></div>
                    </div>}
                    <div style={{position:"relative",paddingLeft:28,paddingBottom:isLast?0:16,minHeight:isLast?40:56}}>
                    {/* Vertical connector line */}
                    {!isLast&&<div style={{position:"absolute",left:11,top:20,bottom:0,width:2,background:"linear-gradient(180deg,"+clr+","+((phColors[phases[i+1]&&phases[i+1].id])||T.bdL)+")"}}></div>}
                    {/* Node circle */}
                    <div style={{position:"absolute",left:3,top:4,width:18,height:18,borderRadius:"50%",background:clr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,zIndex:2,boxShadow:"0 0 0 3px "+T.w+",0 0 0 4px "+clr+"40"}}><span style={{filter:"brightness(10)"}}>{icon}</span></div>
                    {/* Phase card */}
                    <div onClick={function(){setAudExpand(function(p){var n=Object.assign({},p);n[ph.id]=!n[ph.id];return n})}} style={{borderRadius:10,border:"1px solid "+(isExpanded?clr:T.bdL),background:isExpanded?clr+"08":T.w,cursor:"pointer",overflow:"hidden",transition:"all .2s"}}>
                      {/* Card header */}
                      <div style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontSize:8,fontWeight:900,color:clr,fontFamily:T.f,background:clr+"15",padding:"1px 5px",borderRadius:4}}>{ph.id}</span>
                            <span style={{fontSize:10,fontWeight:700,color:T.nv}}>{ph.name}</span>
                            <span style={{marginLeft:"auto",fontSize:14,fontWeight:900,color:T.nv,fontFamily:T.f}}>{fmtMs(ph.durationMs)}</span>
                          </div>
                          {/* Progress bar */}
                          <div style={{marginTop:4,display:"flex",alignItems:"center",gap:6}}>
                            <div style={{flex:1,height:6,borderRadius:3,background:T.bdL,overflow:"hidden"}}>
                              <div style={{width:pct+"%",height:"100%",borderRadius:3,background:"linear-gradient(90deg,"+clr+","+clr+"cc)",transition:"width .5s ease"}}></div>
                            </div>
                            <span style={{fontSize:7,fontWeight:700,color:T.txD,flexShrink:0}}>{pct+"%"}</span>
                            <span style={{width:7,height:7,borderRadius:"50%",background:stClr,flexShrink:0}}></span>
                          </div>
                        </div>
                      </div>
                      {/* Expanded detail */}
                      {isExpanded&&<div style={{padding:"0 12px 10px",borderTop:"1px solid "+T.bdL,marginTop:0}}>
                        <div style={{fontSize:9,color:T.txM,marginTop:8,lineHeight:1.5}}>{desc}</div>
                        {detailParts.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
                          {detailParts.map(function(dp,j){return <span key={j} style={{padding:"2px 8px",borderRadius:6,fontSize:8,fontWeight:600,background:T.cBg,color:T.txM,border:"1px solid "+T.bdL}}>{dp}</span>})}
                        </div>}
                        <div style={{display:"flex",gap:10,marginTop:6,fontSize:8,color:T.txD}}>
                          <span>{t.auditStart+": "+(ph.startedAt?ph.startedAt.slice(11,19):"—")}</span>
                          <span>{t.auditEnd+": "+(ph.completedAt?ph.completedAt.slice(11,19):"—")}</span>
                          <span style={{padding:"1px 6px",borderRadius:4,fontSize:7,fontWeight:700,background:stClr+"18",color:stClr}}>{ph.status}</span>
                        </div>
                        {/* Sub-files for Phase B */}
                        {ph.files&&ph.files.length>0&&<div style={{marginTop:8}}>
                          {ph.files.map(function(fl,j){
                            var fPct=ph.durationMs>0?Math.round((fl.durationMs/ph.durationMs)*100):0;
                            return <div key={j} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",borderBottom:j<ph.files.length-1?"1px solid "+T.bdL:"none"}}>
                              <span style={{width:8,height:8,borderRadius:2,background:fl.status==="done"?T.g:T.r,flexShrink:0}}></span>
                              <span style={{fontSize:8,fontWeight:700,color:T.nv,fontFamily:T.f,width:100,flexShrink:0}}>{fl.name}</span>
                              <div style={{flex:1,height:4,borderRadius:2,background:T.bdL,overflow:"hidden"}}><div style={{width:fPct+"%",height:"100%",borderRadius:2,background:T.bl}}></div></div>
                              <span style={{fontSize:8,fontWeight:700,color:T.txM,fontFamily:T.f,flexShrink:0}}>{fmtMs(fl.durationMs)}</span>
                              <span style={{fontSize:7,color:T.txD}}>{fl.changes+" "+t.changes}</span>
                            </div>
                          })}
                        </div>}
                      </div>}
                    </div>
                  </div>
                  </div>
                })}
              </div>}

              {/* ═══ TAB: Charts — Distribution, Score evolution, File comparison ═══ */}
              {audTab==="charts"&&<div style={{padding:16,display:"flex",flexDirection:"column",gap:14}}>
                {/* Time Distribution — Stacked horizontal bar */}
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.nv,marginBottom:8}}>{"📊 "+t.auditDistrib}</div>
                  <div style={{display:"flex",height:28,borderRadius:6,overflow:"hidden",border:"1px solid "+T.bdL}}>
                    {phases.map(function(ph,i){
                      var pct=Math.max(1,Math.round((ph.durationMs/totalMs)*100));
                      var clr=phColors[ph.id]||T.bl;
                      return <div key={i} title={ph.id+": "+fmtMs(ph.durationMs)+" ("+pct+"%)"} style={{width:pct+"%",background:clr,display:"flex",alignItems:"center",justifyContent:"center",minWidth:pct>5?0:2,transition:"width .5s"}}>
                        {pct>6&&<span style={{fontSize:7,fontWeight:800,color:"#fff"}}>{ph.id}</span>}
                      </div>
                    })}
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>
                    {phases.map(function(ph,i){
                      var clr=phColors[ph.id]||T.bl;
                      return <div key={i} style={{display:"flex",alignItems:"center",gap:3,fontSize:8,color:T.txM}}>
                        <span style={{width:8,height:8,borderRadius:2,background:clr}}></span>
                        <span style={{fontWeight:700}}>{ph.id}</span>
                        <span>{fmtMs(ph.durationMs)}</span>
                      </div>
                    })}
                  </div>
                </div>

                {/* Score Evolution — Line chart with auto-scaled Y-axis */}
                {cPhases.length>1&&(function(){
                  var scores=cPhases.map(function(cp){return cp.score||0});
                  var minScore=Math.min.apply(null,scores);
                  var maxScore=Math.max.apply(null,scores);
                  // Auto-scale: pad range by 10 pts each side, clamp 0-100
                  var yMin=Math.max(0,Math.floor((minScore-10)/5)*5);
                  var yMax=Math.min(100,Math.ceil((maxScore+10)/5)*5);
                  if (yMax-yMin<20) { yMin=Math.max(0,yMin-5); yMax=Math.min(100,yMax+5); }
                  var yRange=yMax-yMin;
                  // Generate 5 grid lines within the visible range
                  var yStep=Math.max(5,Math.round(yRange/4/5)*5);
                  var yLabels=[];
                  for (var yv=yMin;yv<=yMax;yv+=yStep) yLabels.push(yv);
                  if (yLabels[yLabels.length-1]<yMax) yLabels.push(yMax);
                  // Chart dimensions
                  var chartH=140, padT=14, padB=20, plotH=chartH-padT-padB;
                  var padL=30, padR=16;
                  var chartW=isMobile?260:420;
                  var plotW=chartW-padL-padR;
                  var yPos=function(v){return padT+((yMax-v)/yRange)*plotH};
                  var xPos=function(i){return padL+(cPhases.length>1?i*(plotW/(cPhases.length-1)):plotW/2)};
                  // Pass threshold visible?
                  var passThreshold=90; var passVisible=passThreshold>=yMin&&passThreshold<=yMax;

                  return <div>
                    <div style={{fontSize:10,fontWeight:700,color:T.nv,marginBottom:8}}>{"📈 "+t.auditScoreEvol}</div>
                    <div style={{position:"relative",width:chartW,height:chartH,border:"1px solid "+T.bdL,borderRadius:8,background:T.cBg}}>
                      {/* Y-axis labels + grid lines */}
                      {yLabels.map(function(v){
                        var y=yPos(v);
                        return <div key={v}>
                          <div style={{position:"absolute",left:2,top:y-5,fontSize:7,color:T.txD,fontFamily:T.f,width:24,textAlign:"right"}}>{v}</div>
                          <div style={{position:"absolute",left:padL,right:padR,top:y,height:1,background:T.bdL}}></div>
                        </div>
                      })}
                      {/* Pass threshold line */}
                      {passVisible&&<div>
                        <div style={{position:"absolute",left:padL,right:padR,top:yPos(passThreshold),height:1,background:T.g,opacity:.4}}></div>
                        <div style={{position:"absolute",right:padR+2,top:yPos(passThreshold)-8,fontSize:6,color:T.g,fontWeight:700}}>{passThreshold+" PASS"}</div>
                      </div>}
                      {/* Gradient fill under the line */}
                      <svg style={{position:"absolute",left:0,top:0,width:chartW,height:chartH,pointerEvents:"none"}}>
                        <defs><linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.bl} stopOpacity="0.15"/><stop offset="100%" stopColor={T.bl} stopOpacity="0.02"/></linearGradient></defs>
                        {cPhases.length>1&&<path d={
                          "M "+xPos(0)+" "+yPos(scores[0])+
                          scores.slice(1).map(function(s,i){return " L "+xPos(i+1)+" "+yPos(s)}).join("")+
                          " L "+xPos(scores.length-1)+" "+(padT+plotH)+
                          " L "+xPos(0)+" "+(padT+plotH)+" Z"
                        } fill="url(#scoreGrad)"/>}
                      </svg>
                      {/* Connecting lines */}
                      <svg style={{position:"absolute",left:0,top:0,width:chartW,height:chartH,pointerEvents:"none",zIndex:1}}>
                        {cPhases.map(function(cp,i){
                          if (i===0) return null;
                          var prev=cPhases[i-1];
                          return <line key={i} x1={xPos(i-1)} y1={yPos(prev.score||0)} x2={xPos(i)} y2={yPos(cp.score||0)} stroke={T.bl} strokeWidth="2.5" strokeLinecap="round"/>
                        })}
                      </svg>
                      {/* Data points */}
                      {cPhases.map(function(cp,i){
                        var x=xPos(i), y=yPos(cp.score||0);
                        var scoreClr=(cp.score||0)>=90?T.g:(cp.score||0)>=75?"#d97706":T.bl;
                        return <div key={i}>
                          <div style={{position:"absolute",left:x-8,top:y-8,width:16,height:16,borderRadius:"50%",background:scoreClr,border:"2.5px solid "+T.w,boxShadow:"0 1px 4px rgba(0,0,0,.15)",zIndex:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{fontSize:7,fontWeight:900,color:"#fff"}}>{cp.score}</span>
                          </div>
                          <div style={{position:"absolute",left:x-12,top:y+10,fontSize:7,fontWeight:700,color:T.txM,textAlign:"center",width:24}}>{cp.id}</div>
                          {/* Delta badge */}
                          {i>0&&<div style={{position:"absolute",left:x-6,top:y-18,fontSize:6,fontWeight:800,color:(cp.score||0)>=(cPhases[i-1].score||0)?T.g:T.r}}>{(cp.score||0)>=(cPhases[i-1].score||0)?"+"+(cp.score-cPhases[i-1].score):""+(cp.score-cPhases[i-1].score)}</div>}
                        </div>
                      })}
                    </div>
                  </div>
                })()}

                {/* Per-file time comparison — Horizontal bars */}
                {fileTimes.length>0&&<div>
                  <div style={{fontSize:10,fontWeight:700,color:T.nv,marginBottom:8}}>{"📁 "+t.auditFileComp}</div>
                  {fileTimes.map(function(fl,i){
                    var pct=slowFile>0?Math.round((fl.durationMs/slowFile)*100):0;
                    var isMax=fl.durationMs===slowFile;
                    var isMin=fl.durationMs===fastFile;
                    return <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{width:90,fontSize:8,fontWeight:700,color:T.nv,fontFamily:T.f,flexShrink:0,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fl.name}</span>
                      <div style={{flex:1,height:14,borderRadius:4,background:T.bdL,overflow:"hidden",position:"relative"}}>
                        <div style={{width:pct+"%",height:"100%",borderRadius:4,background:isMax?T.r:isMin?T.g:T.bl,transition:"width .5s"}}></div>
                        <span style={{position:"absolute",right:4,top:1,fontSize:7,fontWeight:700,color:pct>40?"#fff":T.txD}}>{fmtMs(fl.durationMs)}</span>
                      </div>
                      {isMax&&<span style={{fontSize:7,fontWeight:800,color:T.r,flexShrink:0}}>{t.auditSlowest}</span>}
                      {isMin&&fileTimes.length>1&&<span style={{fontSize:7,fontWeight:800,color:T.g,flexShrink:0}}>{t.auditFastest}</span>}
                    </div>
                  })}
                </div>}

                {/* Migration vs QA time split */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div style={{padding:12,borderRadius:8,border:"1px solid "+T.bdL,background:T.bl+"08"}}>
                    <div style={{fontSize:8,fontWeight:700,color:T.bl}}>{"⚡ Migración (A+B+B2)"}</div>
                    <div style={{fontSize:18,fontWeight:900,color:T.bl,fontFamily:T.f}}>{fmtMs(migTime)}</div>
                    <div style={{fontSize:8,color:T.txD}}>{migPct+"% "+t.auditTotal.toLowerCase()}</div>
                  </div>
                  <div style={{padding:12,borderRadius:8,border:"1px solid "+T.bdL,background:T.g+"08"}}>
                    <div style={{fontSize:8,fontWeight:700,color:T.g}}>{"✅ QA / Integración (C+D)"}</div>
                    <div style={{fontSize:18,fontWeight:900,color:T.g,fontFamily:T.f}}>{fmtMs(qaTime)}</div>
                    <div style={{fontSize:8,color:T.txD}}>{qaPct+"% · "+(cPhases.length>0?cPhases.length+" checks":"")+(dPhases.length>0?", "+dPhases.length+" fixes":"")}</div>
                  </div>
                </div>
              </div>}

              {/* ═══ TAB: Detail — Enhanced table ═══ */}
              {audTab==="detail"&&<div>
                <div style={{maxHeight:320,overflowY:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:9,fontFamily:T.f}}>
                    <thead><tr style={{background:T.cBg,position:"sticky",top:0,zIndex:3}}>
                      <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{t.auditPhase}</th>
                      <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{t.auditDetail}</th>
                      <th style={{padding:"6px 8px",textAlign:"right",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{t.auditDuration}</th>
                      <th style={{padding:"6px 8px",textAlign:"right",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{"% "+t.auditTotal}</th>
                      <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{t.auditStart}</th>
                      <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{t.auditEnd}</th>
                      <th style={{padding:"6px 8px",textAlign:"center",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{t.auditStatus}</th>
                    </tr></thead>
                    <tbody>
                      {phases.map(function(ph,i){
                        var stClr=ph.status==="done"?T.g:ph.status==="error"?T.r:T.y;
                        var pct=Math.round((ph.durationMs/totalMs)*100);
                        var clr=phColors[ph.id]||T.bl;
                        var detStr=ph.detail||(ph.score!==undefined?"Score: "+ph.score:"")+(ph.issueCount!==undefined?" · Issues: "+ph.issueCount:"")+(ph.fixedFiles!==undefined?" · Fixed: "+ph.fixedFiles:"")+(ph.criticalCount!==undefined&&ph.criticalCount>0?" · "+ph.criticalCount+" critical":"");
                        var rows=[<tr key={"ph"+i} style={{background:i%2===0?T.w:T.cBg,borderBottom:"1px solid "+T.bdL}}>
                          <td style={{padding:"5px 8px"}}><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:8,fontWeight:900,color:clr,fontFamily:T.f,background:clr+"15",padding:"1px 4px",borderRadius:3}}>{ph.id}</span><span style={{fontWeight:700,color:T.nv}}>{ph.name}</span></div></td>
                          <td style={{padding:"5px 8px",color:T.txM,fontSize:8}}>{detStr}</td>
                          <td style={{padding:"5px 8px",textAlign:"right",fontWeight:800,color:T.nv}}>{fmtMs(ph.durationMs)}</td>
                          <td style={{padding:"5px 8px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end"}}><div style={{width:40,height:4,borderRadius:2,background:T.bdL,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:clr,borderRadius:2}}></div></div><span style={{fontSize:7,fontWeight:700,color:T.txD}}>{pct+"%"}</span></div></td>
                          <td style={{padding:"5px 8px",color:T.txD,fontSize:8}}>{ph.startedAt?ph.startedAt.slice(11,19):""}</td>
                          <td style={{padding:"5px 8px",color:T.txD,fontSize:8}}>{ph.completedAt?ph.completedAt.slice(11,19):""}</td>
                          <td style={{padding:"5px 8px",textAlign:"center"}}><span style={{padding:"1px 6px",borderRadius:4,fontSize:7,fontWeight:700,background:stClr+"18",color:stClr}}>{ph.status}</span></td>
                        </tr>];
                        if(ph.files&&ph.files.length>0){
                          ph.files.forEach(function(fl,j){
                            var fClr=fl.status==="done"?T.g:T.r;
                            var fPct=Math.round((fl.durationMs/totalMs)*100);
                            rows.push(<tr key={"fl"+i+"-"+j} style={{background:T.cBg,borderBottom:"1px solid "+T.bdL}}>
                              <td style={{padding:"3px 8px 3px 28px",color:T.txM,fontSize:8}}>{"└ "+fl.name}</td>
                              <td style={{padding:"3px 8px",color:T.txD,fontSize:8}}>{fl.changes+" "+t.changes+(fl.engine?" · "+fl.engine:"")}</td>
                              <td style={{padding:"3px 8px",textAlign:"right",fontWeight:700,color:T.txM,fontSize:8}}>{fmtMs(fl.durationMs)}</td>
                              <td style={{padding:"3px 8px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end"}}><div style={{width:40,height:3,borderRadius:2,background:T.bdL,overflow:"hidden"}}><div style={{width:Math.max(1,fPct)+"%",height:"100%",background:T.bl,borderRadius:2}}></div></div><span style={{fontSize:6,color:T.txD}}>{fPct+"%"}</span></div></td>
                              <td style={{padding:"3px 8px",color:T.txD,fontSize:7}}>{fl.startedAt?fl.startedAt.slice(11,19):""}</td>
                              <td style={{padding:"3px 8px",color:T.txD,fontSize:7}}>{fl.completedAt?fl.completedAt.slice(11,19):""}</td>
                              <td style={{padding:"3px 8px",textAlign:"center"}}><span style={{padding:"1px 5px",borderRadius:4,fontSize:6,fontWeight:700,background:fClr+"18",color:fClr}}>{fl.status}</span></td>
                            </tr>);
                          });
                        }
                        return rows;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>}

              {/* Config footer */}
              <div style={{padding:"8px 16px",background:T.cBg,borderTop:"1px solid "+T.bdL,display:"flex",gap:10,flexWrap:"wrap",fontSize:8,color:T.txD,alignItems:"center"}}>
                <span style={{fontWeight:800,color:T.nv}}>{t.auditConfig}</span>
                <span style={{padding:"1px 6px",borderRadius:4,background:T.blP,color:T.bl,fontFamily:T.f,fontWeight:600}}>{"ID: "+auditTrail.id}</span>
                <span>{auditTrail.config.source+" → "+auditTrail.config.target}</span>
                <span style={{fontFamily:T.f}}>{auditTrail.config.model}</span>
                <span>{auditTrail.config.fileCount+" "+t.files}</span>
                {auditTrail.finalScore!==null&&<span style={{padding:"1px 6px",borderRadius:4,fontWeight:800,background:auditTrail.finalScore>=95?T.okBg:T.warnBg,color:auditTrail.finalScore>=95?T.g:T.y,fontFamily:T.f}}>{t.score+": "+auditTrail.finalScore+"/100"}</span>}
                <span style={{marginLeft:"auto",fontFamily:T.f}}>{auditTrail.startedAt.replace("T"," ").slice(0,19)}</span>
              </div>
            </div>
          })()}

          {/* ═══ MIGRATION ANALYTICS DASHBOARD ═══ */}
              {(function(){
                var totalLines=res.reduce(function(s,r){return s+(r.migrated?r.migrated.split("\n").length:0)},0);
                var origLines=res.reduce(function(s,r){return s+(r.original?r.original.split("\n").length:0)},0);
                var totalChanges=res.reduce(function(s,r){var c=r.changes;return s+(typeof c==="number"?c:0)},0);
                var ml2=MODELS.find(function(m){return m.id===mod});
                var costUsd=ml2?((_tks.i*(ml2.pi||0)+_tks.o*(ml2.po||0))/1000000):0;
                var costStr=costUsd>0?(costUsd<0.01?"<$0.01":"$"+costUsd.toFixed(3)):"$0.00";
                var durMs=auditTrail&&auditTrail.totalDurationMs?auditTrail.totalDurationMs:(migStartTs>0?Date.now()-migStartTs:0);
                var durStr=durMs>0?((durMs>=60000?Math.floor(durMs/60000)+"m ":"")+Math.floor((durMs%60000)/1000)+"s"):"--";
                var score=auditTrail&&auditTrail.finalScore!==null?auditTrail.finalScore:(intR&&intR.ok&&intR.result?intR.result.score:(function(){var bs=null;if(auditTrail&&auditTrail.phases)auditTrail.phases.forEach(function(ph){if(ph.score!==undefined&&ph.score!==null&&(bs===null||ph.score>bs))bs=ph.score});return bs})());
                var grade=score===null?"?":(score>=90?"A":score>=80?"B":score>=70?"C":score>=50?"D":"F");
                var gradeClr=grade==="A"||grade==="B"?"#059669":grade==="C"?"#D97706":"#DC2626";
                var phases=auditTrail&&auditTrail.phases?auditTrail.phases:[];
                var fileTimings=phases.reduce(function(acc,ph){if(ph.files)ph.files.forEach(function(f){acc.push({name:f.target||f.source||"?",ms:f.durationMs||0,phase:ph.phase})});return acc},[]);
                return <div style={{marginBottom:12}}>

                {/* Executive Summary Card */}
                <div style={Object.assign({},S.card,{overflow:"hidden",marginBottom:10})}>
                  <div style={{padding:"16px 20px",background:score>=90?"linear-gradient(135deg,#ecfdf5,#d1fae5)":score>=70?"linear-gradient(135deg,#fffbeb,#fef3c7)":"linear-gradient(135deg,#fef2f2,#fee2e2)",display:"flex",alignItems:"center",gap:16}}>
                    <div style={{width:56,height:56,borderRadius:14,border:"3px solid "+gradeClr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:gradeClr,fontFamily:T.f,background:"#fff"}}>{score!==null?score:"?"}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:800,color:T.nv}}>{"Migration Report"}</div>
                      <div style={{fontSize:11,color:T.txM}}>{(LANGS[sL]||{}).i+" "+(LANGS[sL]||{}).n+" "+sV+" → "+(LANGS[tL]||{}).i+" "+(LANGS[tL]||{}).n+" "+tV+" · "+res.length+" files"}</div>
                    </div>
                    <div style={{textAlign:"center"}}><div style={{fontSize:10,color:T.txD,fontWeight:600}}>{"GRADE"}</div><div style={{fontSize:28,fontWeight:900,color:gradeClr,fontFamily:T.f}}>{grade}</div></div>
                  </div>

                  {/* KPI Row */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat("+((isMobile)?"2":"5")+",1fr)",borderTop:"1px solid "+T.bdL}}>
                    {[{l:"Duration",v:durStr,c:"#2563EB"},{l:"Tokens",v:(_tks.i+_tks.o)>1000?Math.round((_tks.i+_tks.o)/1000)+"k":(_tks.i+_tks.o)+"",c:"#7C3AED"},{l:"Cost",v:costStr,c:"#059669"},{l:"Lines",v:totalLines+"",c:"#D97706"},{l:"Changes",v:totalChanges>0?totalChanges+"":res.length+"",c:"#DC2626"}].map(function(kpi,ki){return <div key={ki} style={{padding:"12px 16px",borderRight:ki<4?"1px solid "+T.bdL:"none",textAlign:"center"}}>
                      <div style={{fontSize:7,fontWeight:700,color:T.txD,textTransform:"uppercase",letterSpacing:".05em"}}>{kpi.l}</div>
                      <div style={{fontSize:18,fontWeight:900,color:kpi.c,fontFamily:T.f,marginTop:2}}>{kpi.v}</div>
                    </div>})}
                  </div>
                </div>

                {/* Quality Layers + Phase Timeline row */}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>

                  {/* Quality Layers */}
                  {intR&&intR.ok&&intR.result.layers&&<div style={S.card}>
                    <div style={{padding:"10px 14px",borderBottom:"1px solid "+T.bdL}}><span style={{fontSize:11,fontWeight:700,color:T.nv}}>{"Quality Breakdown"}</span></div>
                    <div style={{padding:"10px 14px"}}>
                      {intR.result.layers.map(function(ly,li){var sc=ly.score||0;var clr=sc>=90?(dark?"#3D8B6E":"#059669"):sc>=70?(dark?"#A8842E":"#D97706"):(dark?"#B85450":"#DC2626");return <div key={li} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                        <span style={{fontSize:8,fontWeight:600,color:T.txM,width:75,flexShrink:0}}>{ly.name}</span>
                        <div style={{flex:1,height:6,borderRadius:3,background:T.bdL,overflow:"hidden"}}><div style={{width:sc+"%",height:"100%",borderRadius:3,background:clr,transition:"width .5s"}}/></div>
                        <span style={{fontSize:9,fontWeight:800,color:clr,fontFamily:T.f,width:22,textAlign:"right"}}>{sc}</span>
                      </div>})}
                    </div>
                  </div>}

                  {/* Phase Timeline */}
                  {phases.length>0&&<div style={S.card}>
                    <div style={{padding:"10px 14px",borderBottom:"1px solid "+T.bdL}}><span style={{fontSize:11,fontWeight:700,color:T.nv}}>{"Pipeline Timeline"}</span></div>
                    <div style={{padding:"10px 14px"}}>
                      {phases.map(function(ph,pi){var dur=ph.durationMs||0;var pct=durMs>0?Math.round(dur/durMs*100):0;var phClr=ph.phase==="analysis"?"#6366F1":ph.phase==="migration"?"#2563EB":ph.phase==="consolidation"?"#0EA5E9":ph.phase==="integration"?"#059669":"#D97706";return <div key={pi} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                        <span style={{fontSize:8,fontWeight:600,color:T.txM,width:75,flexShrink:0}}>{ph.phase}</span>
                        <div style={{flex:1,height:6,borderRadius:3,background:T.bdL,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",borderRadius:3,background:phClr}}/></div>
                        <span style={{fontSize:8,fontFamily:T.f,color:T.txD,width:35,textAlign:"right"}}>{dur>=60000?Math.floor(dur/60000)+"m "+Math.floor((dur%60000)/1000)+"s":Math.floor(dur/1000)+"s"}</span>
                      </div>})}
                    </div>
                  </div>}
                </div>

                {/* File Performance + Token Breakdown */}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>

                  {/* Per-file timing chart */}
                  {fileTimings.length>0&&<div style={S.card}>
                    <div style={{padding:"10px 14px",borderBottom:"1px solid "+T.bdL}}><span style={{fontSize:11,fontWeight:700,color:T.nv}}>{"File Processing Time"}</span></div>
                    <div style={{padding:"10px 14px"}}>
                      {fileTimings.slice(0,10).map(function(ft,fi){var maxMs=Math.max.apply(null,fileTimings.map(function(x){return x.ms}))||1;var pct=Math.round(ft.ms/maxMs*100);return <div key={fi} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                        <span style={{fontSize:8,fontWeight:600,color:T.txM,width:80,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ft.name}</span>
                        <div style={{flex:1,height:6,borderRadius:3,background:T.bdL,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",borderRadius:3,background:"#2563EB"}}/></div>
                        <span style={{fontSize:8,fontFamily:T.f,color:T.txD,width:30,textAlign:"right"}}>{ft.ms>=1000?Math.round(ft.ms/1000)+"s":ft.ms+"ms"}</span>
                      </div>})}
                    </div>
                  </div>}

                  {/* Token breakdown */}
                  <div style={S.card}>
                    <div style={{padding:"10px 14px",borderBottom:"1px solid "+T.bdL}}><span style={{fontSize:11,fontWeight:700,color:T.nv}}>{"Token Usage"}</span></div>
                    <div style={{padding:"14px"}}>
                      <div style={{display:"flex",gap:12,marginBottom:12}}>
                        <div style={{flex:1,textAlign:"center",padding:10,borderRadius:10,background:"#EEF2FF"}}>
                          <div style={{fontSize:7,fontWeight:700,color:"#6366F1",textTransform:"uppercase"}}>{"Input"}</div>
                          <div style={{fontSize:16,fontWeight:900,color:"#6366F1",fontFamily:T.f}}>{_tks.i>1000?Math.round(_tks.i/1000)+"k":_tks.i}</div>
                        </div>
                        <div style={{flex:1,textAlign:"center",padding:10,borderRadius:10,background:"#F0FDF4"}}>
                          <div style={{fontSize:7,fontWeight:700,color:"#059669",textTransform:"uppercase"}}>{"Output"}</div>
                          <div style={{fontSize:16,fontWeight:900,color:"#059669",fontFamily:T.f}}>{_tks.o>1000?Math.round(_tks.o/1000)+"k":_tks.o}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",background:T.bdL}}>
                        <div style={{width:(_tks.i/Math.max(_tks.i+_tks.o,1)*100)+"%",background:"#6366F1",borderRadius:"4px 0 0 4px"}}/>
                        <div style={{width:(_tks.o/Math.max(_tks.i+_tks.o,1)*100)+"%",background:"#059669",borderRadius:"0 4px 4px 0"}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                        <span style={{fontSize:7,color:"#6366F1",fontWeight:600}}>{"Input "+Math.round(_tks.i/Math.max(_tks.i+_tks.o,1)*100)+"%"}</span>
                        <span style={{fontSize:7,color:"#059669",fontWeight:600}}>{"Output "+Math.round(_tks.o/Math.max(_tks.i+_tks.o,1)*100)+"%"}</span>
                      </div>
                      {ml2&&<div style={{marginTop:8,padding:"6px 10px",borderRadius:6,background:T.cBg,fontSize:8,color:T.txD,textAlign:"center"}}>
                        {"Model: "+(ml2.n||"")+" · Cost: "+costStr}
                      </div>}
                    </div>
                  </div>
                </div>

                {/* Risks summary */}
                {rsk&&rsk.length>0&&<div style={Object.assign({},S.card,{marginBottom:10})}>
                  <div style={{padding:"10px 14px",borderBottom:"1px solid "+T.bdL,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:11,fontWeight:700,color:T.nv}}>{"Risks & Warnings ("+rsk.length+")"}</span>
                    <div style={{display:"flex",gap:4}}>
                      {[{l:"High",c:"#DC2626",n:rsk.filter(function(r){return r.level==="high"}).length},{l:"Med",c:"#D97706",n:rsk.filter(function(r){return r.level==="medium"}).length},{l:"Low",c:"#059669",n:rsk.filter(function(r){return r.level==="low"||!r.level}).length}].filter(function(x){return x.n>0}).map(function(x,xi){return <span key={xi} style={{padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:700,background:x.c+"15",color:x.c}}>{x.n+" "+x.l}</span>})}
                    </div>
                  </div>
                  <div style={{padding:"8px 14px",maxHeight:120,overflowY:"auto"}}>
                    {rsk.slice(0,8).map(function(r,ri){var lc=r.level==="high"?"#DC2626":r.level==="medium"?"#D97706":"#059669";return <div key={ri} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",borderBottom:"1px solid "+T.bdL}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:lc,flexShrink:0}}/>
                      <span style={{fontSize:9,color:T.txM,flex:1}}>{r.msg||r.risk||""}</span>
                      <span style={{fontSize:8,fontFamily:T.f,color:T.txD}}>{r.file||""}</span>
                    </div>})}
                  </div>
                </div>}

                </div>})()}

              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"170px 1fr",gap:8}}>
            <div style={S.card}><div style={{padding:"8px 10px",fontSize:9,fontWeight:700,color:T.txD,background:T.blM,borderBottom:"1px solid "+T.bdL}}>{t.filesLbl}</div>
              {res.map(function(x,i){
                // Count issues per file from integration report — check both source and target names
                var fileIssues=intR&&intR.ok&&intR.result.issues?intR.result.issues.filter(function(is){return (is.files||[]).some(function(fn){return fn===x.name||fn===(x.targetName||x.name)||x.name.indexOf(fn)>=0||fn.indexOf(x.name)>=0})}):[];
                var critCount=fileIssues.filter(function(is){return is.severity==="critical"}).length;
                var majCount=fileIssues.filter(function(is){return is.severity==="major"}).length;
                var dotColor=critCount>0?T.r:majCount>0?"#f97316":fileIssues.length>0?T.y:T.g;
                var displayName=x.targetName||x.name;
                return <div key={i} onClick={function(){setActR(i);setTOut(null)}} style={{padding:"6px 10px",cursor:"pointer",borderLeft:"3px solid "+(actR===i?T.bl:"transparent"),background:actR===i?T.blM:"transparent"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:dotColor,flexShrink:0}}/>
                    <span style={{fontFamily:T.f,fontSize:9,fontWeight:600,flex:1}}>{displayName}</span>
                    {x.isCross&&<span style={{padding:"0 4px",borderRadius:3,fontSize:6,fontWeight:700,background:T.blP,color:T.bl}}>{"→"}</span>}
                    {x.intFixed&&<span style={{padding:"0 4px",borderRadius:4,fontSize:7,fontWeight:700,background:T.okBg,color:T.g}}>{"fixed"}</span>}
                  </div>
                  {x.isCross&&<div style={{fontSize:7,color:T.txD,marginLeft:10,fontFamily:T.f}}>{x.name+" → "+displayName}</div>}
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:T.txD,marginLeft:10}}>
                    <span>{x.changes.length+" "+t.changes}{fileIssues.length>0?" · "+fileIssues.length+" issues":""}</span>
                    <button onClick={function(e){e.stopPropagation();dlF(x.migrated,dlN(x.name,x.targetName))}} style={{background:"none",border:"none",cursor:"pointer",color:T.bl,fontSize:9,padding:0}}>{"⬇"}</button>
                  </div>
                </div>})}</div>

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {/* DIFF */}
              <div style={S.card}><div style={S.cH}><div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>{r.isCross&&<span style={{fontFamily:T.f,fontSize:8,color:T.txD}}>{r.path||r.name}</span>}{r.isCross&&<span style={{color:T.bl,fontSize:8}}>{"→"}</span>}<span style={{fontFamily:T.f,fontSize:10,fontWeight:700,color:T.nv}}>{r.targetName||(r.path||r.name)}</span><span style={{fontSize:8,color:T.g}}>{"+"+ad}</span><span style={{fontSize:8,color:T.r}}>{"-"+rm}</span></div>
                <div style={{display:"flex",gap:4}}><button onClick={function(){if(navigator.clipboard)navigator.clipboard.writeText(r.migrated)}} title="Copy" style={Object.assign({},S.btn(),{padding:"3px 10px",fontSize:9})}>{"📋"}</button><button onClick={function(){dlF(r.migrated,dlN(r.name,r.targetName))}} style={Object.assign({},S.btn("g"),{padding:"3px 10px",fontSize:9})}>{"⬇"}</button>
                  <div style={{display:"flex",background:T.cBg,borderRadius:6,padding:2,border:"1px solid "+T.bdL}}>{["split","unified"].map(function(m){return <button key={m} onClick={function(){setDm(m)}} style={{padding:"2px 8px",borderRadius:4,border:"none",cursor:"pointer",fontSize:8,fontWeight:600,background:dm===m?T.w:"transparent",color:dm===m?T.nv:T.txD}}>{m}</button>})}</div></div></div>
                <div style={{maxHeight:300,overflowY:"auto",overflowX:"auto"}}>
                  {dm==="split"
                    ? <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",minWidth:500}}>{[0,1].map(function(si){return <div key={si} style={si===0?{borderRight:"1px solid "+T.bdL}:{}}>
                        <div style={{padding:"4px 8px",fontSize:7,fontWeight:700,color:si?T.g:T.r,background:si?T.okBg:T.errBg,borderBottom:"1px solid "+T.bdL}}>{si?(r.targetName||t.mig)+" ("+((LANGS[tL]||{}).n||"")+")":t.orig+" ("+(r.name||"")+")"}</div>
                        {d.map(function(x,i){var bg="transparent";if(si===0&&(x.t==="del"||x.t==="mod"))bg=x.t==="del"?T.errBg:T.warnBg;if(si===1&&(x.t==="add"||x.t==="mod"))bg=x.t==="add"?T.okBg:T.warnBg;var txt=si===0?(x.t==="add"?"":x.o):(x.t==="del"?"":x.n);var ln=si===0?sL:tL;return <div key={i} style={{display:"flex",fontSize:9,fontFamily:T.f,background:bg,borderBottom:"1px solid "+T.bdL,minHeight:18}}><span style={{width:28,textAlign:"right",padding:"1px 3px",color:T.txD,fontSize:7,borderRight:"1px solid "+T.bdL}}>{si?(x.nN||""):(x.oN||"")}</span><pre style={{margin:0,padding:"1px 4px",whiteSpace:"pre-wrap",wordBreak:"break-all",flex:1}}><CodeLine text={txt} lang={ln}/></pre></div>})}
                      </div>})}</div>
                    : <div>{d.map(function(x,i){return <div key={i}>
                        {(x.t==="del"||x.t==="mod")&&<div style={{display:"flex",fontSize:9,fontFamily:T.f,background:T.errBg,borderLeft:"3px solid "+T.r,borderBottom:"1px solid "+T.bdL}}><span style={{width:28,textAlign:"right",padding:"1px 3px",color:T.txD,fontSize:7}}>{"-"+x.oN}</span><pre style={{margin:0,padding:"1px 4px",whiteSpace:"pre-wrap",flex:1,color:T.r}}><CodeLine text={x.o} lang={sL}/></pre></div>}
                        {(x.t==="add"||x.t==="mod")&&<div style={{display:"flex",fontSize:9,fontFamily:T.f,background:T.okBg,borderLeft:"3px solid "+T.g,borderBottom:"1px solid "+T.bdL}}><span style={{width:28,textAlign:"right",padding:"1px 3px",color:T.txD,fontSize:7}}>{"+"+x.nN}</span><pre style={{margin:0,padding:"1px 4px",whiteSpace:"pre-wrap",flex:1,color:T.g}}><CodeLine text={x.n} lang={tL}/></pre></div>}
                        {x.t==="same"&&<div style={{display:"flex",fontSize:9,fontFamily:T.f,borderBottom:"1px solid "+T.bdL}}><span style={{width:28,textAlign:"right",padding:"1px 3px",color:T.txD,fontSize:7}}>{x.oN}</span><pre style={{margin:0,padding:"1px 4px",whiteSpace:"pre-wrap",flex:1,color:T.txM}}><CodeLine text={x.o} lang={tL}/></pre></div>}
                      </div>})}</div>}
                </div></div>

            </div>
          </div>
        </div>
      })()}



      {/* ═══ RESULT TABS — Auditoría y Riesgos ═══ */}
      {res.length>0&&<div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px 16px"}}>
        <div style={{display:"flex",gap:2,background:T.cBg,borderRadius:10,padding:3,border:"1px solid "+T.bdL,marginBottom:10}}>
          {[{k:"code",l:"Código"},{k:"audit",l:"Auditoría"},{k:"risks",l:"Riesgos"}].map(function(tb){return <button key={tb.k} onClick={function(){setResTab(tb.k)}} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:resTab===tb.k?700:500,background:resTab===tb.k?T.w:"transparent",color:resTab===tb.k?T.nv:T.txM,boxShadow:resTab===tb.k?"0 1px 3px rgba(0,0,0,.08)":"none",fontFamily:T.ui,transition:"all .2s"}}>{tb.l}</button>})}
        </div>
        {resTab==="audit"&&auditTrail&&<div style={Object.assign({},S.card,{overflow:"hidden"})}>
          <div style={{padding:"14px 20px",background:"linear-gradient(135deg,#1E3A5F,#2D4A7A)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><div style={{fontSize:14,fontWeight:800}}>{"Registro de Auditoría"}</div><div style={{fontSize:10,opacity:.7}}>{"Trazabilidad — "+(auditTrail.phases?auditTrail.phases.length:0)+" fases"}</div></div>
            <button onClick={function(){dlF(JSON.stringify(auditTrail,null,2),"audit_"+Date.now()+".json")}} style={{padding:"6px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer"}}>{"Exportar JSON"}</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat("+(isMobile?"2":"5")+",1fr)",borderBottom:"1px solid "+T.bdL}}>
            {(function(){var dur=auditTrail.totalDurationMs||0;var tL2=res.reduce(function(s,r){return s+(r.migrated?r.migrated.split("\n").length:0)},0);return [{l:"Tiempo",v:dur>=60000?Math.floor(dur/60000)+"m "+Math.floor((dur%60000)/1000)+"s":Math.floor(dur/1000)+"s",c:"#2563EB"},{l:"Archivos",v:(auditTrail.config?auditTrail.config.fileCount:res.length)+"",c:"#059669"},{l:"Líneas",v:tL2+"",c:"#D97706"},{l:"Fases",v:(auditTrail.phases?auditTrail.phases.length:0)+"",c:"#7C3AED"},{l:"Score",v:auditTrail.finalScore!=null?auditTrail.finalScore+"":"--",c:auditTrail.finalScore>=90?"#059669":"#D97706"}].map(function(kpi,ki){return <div key={ki} style={{padding:"12px 10px",borderRight:ki<4?"1px solid "+T.bdL:"none",textAlign:"center"}}><div style={{fontSize:7,fontWeight:700,color:T.txD,textTransform:"uppercase"}}>{kpi.l}</div><div style={{fontSize:16,fontWeight:900,color:kpi.c,fontFamily:T.f,marginTop:2}}>{kpi.v}</div></div>})})()}
          </div>
          <div style={{display:"flex",gap:2,padding:"6px 14px",borderBottom:"1px solid "+T.bdL,background:T.cBg}}>
            {[{k:"pipeline",l:"Pipeline"},{k:"charts",l:"Distribución"},{k:"detail",l:"Detalle"}].map(function(tb2){return <button key={tb2.k} onClick={function(){setAudTab(tb2.k)}} style={{padding:"4px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,fontWeight:audTab===tb2.k?700:500,background:audTab===tb2.k?T.bl:"transparent",color:audTab===tb2.k?"#fff":T.txM,fontFamily:T.ui}}>{tb2.l}</button>})}
          </div>
          {audTab==="pipeline"&&auditTrail.phases&&<div style={{padding:16}}>{auditTrail.phases.map(function(ph,pi){var phC=dark?{A:"#7C7FBF",B:"#4A7AA8",C1:"#3D8B6E",C2:"#3D8B6E",C3:"#3D8B6E",B2a:"#3E7E9A",B2b:"#3E7E9A",D1:"#A8842E",D2:"#A8842E",D3:"#A8842E"}:{A:"#6366F1",B:"#2563EB",B2a:"#0EA5E9",B2b:"#0EA5E9",C1:"#059669",C2:"#059669",C3:"#059669",D1:"#D97706",D2:"#D97706",D3:"#D97706"};var clr=phC[ph.id]||T.bl;var pct=auditTrail.totalDurationMs>0?Math.round((ph.durationMs||0)/auditTrail.totalDurationMs*100):0;return <div key={pi} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+T.bdL}}><div style={{width:32,height:32,borderRadius:"50%",background:clr+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:8,fontWeight:800,color:clr}}>{ph.id}</span></div><div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:T.nv}}>{ph.name||ph.phase}</div><div style={{marginTop:4,height:6,borderRadius:3,background:T.bdL,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",borderRadius:3,background:clr}}/></div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:13,fontWeight:900,fontFamily:T.f,color:T.nv}}>{fmtMs(ph.durationMs)}</div><div style={{fontSize:8,color:T.txD}}>{pct+"%"}</div></div></div>})}</div>}
                  {audTab==="charts"&&auditTrail.phases&&<div style={{padding:16,display:"flex",flexDirection:"column",gap:16}}>
                    {/* 1. TIME DISTRIBUTION BAR */}
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:T.nv,marginBottom:8}}>{"Distribución de Tiempos"}</div>
                      <div style={{display:"flex",height:32,borderRadius:8,overflow:"hidden",marginBottom:8}}>{auditTrail.phases.map(function(ph,pi){var phC=dark?{A:"#7C7FBF",B:"#4A7AA8",C1:"#3D8B6E",C2:"#3D8B6E",C3:"#3D8B6E",B2a:"#3E7E9A",B2b:"#3E7E9A",D1:"#A8842E",D2:"#A8842E",D3:"#A8842E"}:{A:"#6366F1",B:"#2563EB",B2a:"#0EA5E9",B2b:"#0EA5E9",C1:"#059669",C2:"#059669",C3:"#059669",D1:"#D97706",D2:"#D97706",D3:"#D97706"};var clr=phC[ph.id]||T.bl;var pct=auditTrail.totalDurationMs>0?Math.max(2,Math.round((ph.durationMs||0)/auditTrail.totalDurationMs*100)):5;return <div key={pi} style={{width:pct+"%",background:clr,display:"flex",alignItems:"center",justifyContent:"center",borderRight:"1px solid rgba(255,255,255,.3)"}} title={ph.id+": "+fmtMs(ph.durationMs)+" ("+pct+"%)"}><span style={{fontSize:8,fontWeight:800,color:"#fff"}}>{ph.id}</span></div>})}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"4px 12px"}}>{auditTrail.phases.map(function(ph,pi){var phC=dark?{A:"#7C7FBF",B:"#4A7AA8",C1:"#3D8B6E",C2:"#3D8B6E",C3:"#3D8B6E",B2a:"#3E7E9A",B2b:"#3E7E9A",D1:"#A8842E",D2:"#A8842E",D3:"#A8842E"}:{A:"#6366F1",B:"#2563EB",B2a:"#0EA5E9",B2b:"#0EA5E9",C1:"#059669",C2:"#059669",C3:"#059669",D1:"#D97706",D2:"#D97706",D3:"#D97706"};return <span key={pi} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9,color:T.txM}}><span style={{width:10,height:10,borderRadius:3,background:phC[ph.id]||T.bl}}/><span style={{fontWeight:600}}>{ph.id}</span>{" "+fmtMs(ph.durationMs)}</span>})}</div>
                    </div>
                    {/* 2. SCORE EVOLUTION LINE CHART */}
                    {(function(){var checks=auditTrail.phases.filter(function(ph){return ph.score!==undefined&&ph.score!==null});if(checks.length<1)return null;var W=320;var H=140;var pad={t:20,r:30,b:30,l:35};var cW=W-pad.l-pad.r;var cH=H-pad.t-pad.b;var minS=Math.min.apply(null,checks.map(function(c){return c.score}));var maxS=Math.max.apply(null,checks.map(function(c){return c.score}));var range=Math.max(maxS-minS,10);var lo=Math.max(0,minS-5);var hi=Math.min(100,maxS+5);var rng=hi-lo||10;var pts=checks.map(function(c,i){return{x:pad.l+(checks.length>1?i*(cW/(checks.length-1)):cW/2),y:pad.t+cH-(c.score-lo)/rng*cH,s:c.score,id:c.id}});var linePath=pts.map(function(p,i){return(i===0?"M":"L")+p.x+","+p.y}).join(" ");return <div><div style={{fontSize:11,fontWeight:700,color:T.nv,marginBottom:6}}>{"Evolución del Score"}</div><svg width={W} height={H} style={{background:dark?"#0C1018":"#F8FAFC",borderRadius:8,border:"1px solid "+T.bdL}}><line x1={pad.l} y1={pad.t+cH-(90-lo)/rng*cH} x2={W-pad.r} y2={pad.t+cH-(90-lo)/rng*cH} stroke={dark?"#3D8B6E":"#059669"} strokeWidth="1" strokeDasharray="4,3" opacity=".4"/><text x={W-pad.r+3} y={pad.t+cH-(90-lo)/rng*cH+3} fill="#059669" fontSize="7" fontWeight="700">{"90"}</text><path d={linePath} fill="none" stroke={dark?"#4A7AA8":"#2563EB"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{pts.map(function(p,i){var clr=p.s>=90?(dark?"#3D8B6E":"#059669"):p.s>=70?(dark?"#A8842E":"#D97706"):(dark?"#B85450":"#DC2626");return <g key={i}><circle cx={p.x} cy={p.y} r={5} fill={clr} stroke="#fff" strokeWidth="2"/><text x={p.x} y={p.y-10} textAnchor="middle" fill={clr} fontSize="9" fontWeight="800">{p.s}</text><text x={p.x} y={H-8} textAnchor="middle" fill={dark?"#94A3B8":"#64748B"} fontSize="8">{p.id}</text></g>})}</svg></div>})()}
                    {/* 3. FILE DURATION BARS */}
                    {(function(){var ft=[];auditTrail.phases.forEach(function(ph){if(ph.files)ph.files.forEach(function(f){ft.push({name:f.target||f.source||"?",ms:f.durationMs||0})})});if(ft.length<1)return null;var mx=Math.max.apply(null,ft.map(function(x){return x.ms}))||1;var mn=Math.min.apply(null,ft.map(function(x){return x.ms}))||0;return <div><div style={{fontSize:11,fontWeight:700,color:T.nv,marginBottom:8}}>{"Tiempo por Archivo"}</div>{ft.map(function(f,fi){var pct=Math.round(f.ms/mx*100);var isSlowest=f.ms===mx;var isFastest=ft.length>1&&f.ms===mn;return <div key={fi} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><span style={{fontSize:9,fontFamily:T.f,color:T.txM,width:100,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span><div style={{flex:1,height:10,borderRadius:5,background:T.bdL,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",borderRadius:5,background:isSlowest?(dark?"#B85450":"#DC2626"):(dark?"#4A7AA8":"#2563EB"),transition:"width .5s"}}/></div><span style={{fontSize:9,fontWeight:700,fontFamily:T.f,color:isSlowest?"#DC2626":isFastest?"#059669":T.txD,width:40,textAlign:"right"}}>{fmtMs(f.ms)}</span>{isSlowest&&<span style={{fontSize:7,fontWeight:700,color:"#DC2626"}}>{"Lento"}</span>}{isFastest&&<span style={{fontSize:7,fontWeight:700,color:"#059669"}}>{"Rápido"}</span>}</div>})}</div>})()}
                    {/* 4. QUALITY LAYERS RADAR */}
                    {intR&&intR.ok&&intR.result&&intR.result.layers&&(function(){var layers=intR.result.layers;if(layers.length<3)return null;var n=layers.length;var cx=120;var cy=110;var R=80;var angles=layers.map(function(l,i){return-Math.PI/2+2*Math.PI*i/n});var pts2=layers.map(function(l,i){var r=R*(l.score||0)/100;return{x:cx+r*Math.cos(angles[i]),y:cy+r*Math.sin(angles[i])}});var poly=pts2.map(function(p){return p.x+","+p.y}).join(" ");var grid=[25,50,75,100];return <div><div style={{fontSize:11,fontWeight:700,color:T.nv,marginBottom:6}}>{"Quality Layers"}</div><svg width={240} height={220} style={{background:dark?"#0C1018":"#F8FAFC",borderRadius:8,border:"1px solid "+T.bdL}}>{grid.map(function(g,gi){var pts3=angles.map(function(a){return(cx+R*g/100*Math.cos(a))+","+(cy+R*g/100*Math.sin(a))});return <polygon key={gi} points={pts3.join(" ")} fill="none" stroke={T.bdL} strokeWidth="1"/>})}{angles.map(function(a,ai){return <line key={ai} x1={cx} y1={cy} x2={cx+R*Math.cos(a)} y2={cy+R*Math.sin(a)} stroke={T.bdL} strokeWidth="1"/>})}<polygon points={poly} fill={dark?"#4A7AA8":"#2563EB"} fillOpacity={dark?".1":".15"} stroke={dark?"#4A7AA8":"#2563EB"} strokeWidth="2"/>{pts2.map(function(p,i){var sc=layers[i].score||0;var clr=sc>=90?"#059669":sc>=70?"#D97706":"#DC2626";return <g key={i}><circle cx={p.x} cy={p.y} r={4} fill={clr} stroke="#fff" strokeWidth="1.5"/><text x={cx+(R+16)*Math.cos(angles[i])} y={cy+(R+16)*Math.sin(angles[i])} textAnchor="middle" dominantBaseline="middle" fill={dark?"#CBD5E1":"#475569"} fontSize="7" fontWeight="600">{layers[i].name}</text></g>})}<text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill={T.nv} fontSize="11" fontWeight="900">{"Q"}</text></svg></div>})()}
                  </div>}
          {audTab==="detail"&&auditTrail.phases&&<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}><thead><tr style={{background:T.cBg}}>{["Fase","Detalle","Duración","% Total","Estado"].map(function(h,hi){return <th key={hi} style={{padding:"6px 10px",textAlign:"left",fontWeight:700,color:T.txD,borderBottom:"1px solid "+T.bdL}}>{h}</th>})}</tr></thead><tbody>{auditTrail.phases.map(function(ph,pi){var pct=auditTrail.totalDurationMs>0?Math.round((ph.durationMs||0)/auditTrail.totalDurationMs*100):0;return <tr key={pi} style={{borderBottom:"1px solid "+T.bdL}}><td style={{padding:"6px 10px",fontWeight:700,color:T.nv}}><span style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:T.blP,color:T.bl,marginRight:4}}>{ph.id}</span>{ph.name||ph.phase}</td><td style={{padding:"6px 10px",color:T.txM}}>{ph.detail||(ph.files?ph.files.length+" files":"")}</td><td style={{padding:"6px 10px",fontFamily:T.f,fontWeight:700}}>{fmtMs(ph.durationMs)}</td><td style={{padding:"6px 10px"}}><div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:40,height:4,borderRadius:2,background:T.bdL,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:T.bl}}/></div><span style={{fontFamily:T.f}}>{pct+"%"}</span></div></td><td style={{padding:"6px 10px"}}><span style={{padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:700,background:T.okBg,color:T.g}}>{"done"}</span></td></tr>})}</tbody></table></div>}
        </div>}
        {resTab==="audit"&&!auditTrail&&<div style={{padding:40,textAlign:"center",color:T.txD}}>{"No hay auditoría disponible"}</div>}
        {resTab==="risks"&&<div style={S.card}><div style={{padding:"14px 20px",borderBottom:"1px solid "+T.bdL}}><div style={{fontSize:14,fontWeight:800,color:T.nv}}>{"Análisis de Riesgos"+(rsk?" ("+rsk.length+")":"")}</div></div>{rsk&&rsk.length>0?rsk.map(function(r,ri){var lc=r.level==="high"?"#DC2626":r.level==="medium"?"#D97706":"#059669";return <div key={ri} style={{padding:"10px 20px",borderBottom:"1px solid "+T.bdL,display:"flex",alignItems:"flex-start",gap:10}}><span style={{width:8,height:8,borderRadius:"50%",background:lc,flexShrink:0,marginTop:4}}/><div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,color:T.nv}}>{r.msg||r.risk||""}</div>{r.file&&<div style={{fontSize:9,color:T.txD,fontFamily:T.f,marginTop:2}}>{r.file}</div>}</div><span style={{padding:"2px 8px",borderRadius:4,fontSize:8,fontWeight:700,background:lc+"12",color:lc,flexShrink:0}}>{r.level||"low"}</span></div>}):<div style={{padding:30,textAlign:"center",color:T.txD}}>{"Sin riesgos"}</div>}</div>}
      </div>}

      {/* DEPENDENCY GRAPH */}
      {vw==="graph"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
        <h2 style={{fontSize:18,fontWeight:800,color:T.nv,letterSpacing:"-.03em"}}>{"Grafo de Dependencias"}</h2>
        {files.length===0&&res.length===0?<div style={Object.assign({},S.card,{padding:40,textAlign:"center"})}><div style={{fontSize:32,marginBottom:8}}>{"◎"}</div><div style={{color:T.txD,fontSize:13}}>{"Sube archivos o realiza una migración para visualizar el grafo"}</div></div>
        :(function(){
          var codeFiles=(res.length>0?res:[]).concat(files.filter(function(f){return !res.some(function(r){return r.name===f.name})}));
          if(codeFiles.length===0)codeFiles=files;
          var nodes=[];var links=[];var nodeMap={};
          codeFiles.forEach(function(f,i){
            var code=f.migrated||f.original||f.content||"";
            var name=f.targetName||f.name||("file_"+i);
            var lineCount=code?code.split("\n").length:0;
            var lang=f.lang||(name.endsWith(".py")?"python":name.endsWith(".js")||name.endsWith(".jsx")?"javascript":name.endsWith(".ts")||name.endsWith(".tsx")?"typescript":name.endsWith(".java")?"java":name.endsWith(".kt")?"kotlin":name.endsWith(".cs")?"csharp":name.endsWith(".go")?"go":name.endsWith(".rs")?"rust":name.endsWith(".rb")?"ruby":name.endsWith(".php")?"php":"unknown");
            var funcs=[];var classes=[];var imports=[];
            code.split("\n").forEach(function(line){
              var l=line.trim();
              if(/^import\s/.test(l)||/^from\s/.test(l)||/require\s*\(/.test(l)||/^using\s/.test(l)){imports.push(l)}
              if(/^(export\s+)?(async\s+)?function\s+(\w+)/.test(l)){var m=l.match(/function\s+(\w+)/);if(m)funcs.push(m[1])}
              if(/^(export\s+)?(default\s+)?class\s+(\w+)/.test(l)){var m2=l.match(/class\s+(\w+)/);if(m2)classes.push(m2[1])}
              if(/^\s*def\s+(\w+)/.test(l)){var m3=l.match(/def\s+(\w+)/);if(m3)funcs.push(m3[1])}
            });
            nodeMap[name]={idx:nodes.length};
            nodes.push({id:name,type:"file",lang:lang,lines:lineCount,funcs:funcs.slice(0,8),classes:classes,imports:imports,r:Math.max(22,Math.min(40,lineCount/5))});
            classes.forEach(function(cls){
              var cid=name+"."+cls;
              nodeMap[cid]={idx:nodes.length};
              nodes.push({id:cid,type:"class",lang:lang,lines:0,funcs:[],classes:[],imports:[],r:6,parent:name,label:cls});
              links.push({source:name,target:cid,type:"contains"});
            });
          });
          codeFiles.forEach(function(f){
            var name=f.targetName||f.name;
            var code=f.migrated||f.original||f.content||"";
            (code.match(/(?:import|from|require)\s*[(]?\s*['"]([^'"]+)['"]/g)||[]).forEach(function(imp){
              var m=imp.match(/['"]([^'"]+)['"]/);if(!m)return;
              var target=m[1];var resolved=null;
              Object.keys(nodeMap).forEach(function(k){if(k.indexOf(target.replace(/^\.\/|^\.\.\//,""))>=0||k.replace(/\.\w+$/,"")===target.replace(/^\.\/|^\.\.\//,""))resolved=k});
              if(resolved&&resolved!==name){links.push({source:name,target:resolved,type:"imports"})}
              else if(!resolved&&target.indexOf(".")<0){
                if(!nodeMap[target]){nodeMap[target]={idx:nodes.length};nodes.push({id:target,type:"lib",lang:"external",lines:0,funcs:[],classes:[],imports:[],r:10,label:target})}
                links.push({source:name,target:target,type:"depends"});
              }
            });
          });
          var W=Math.min(1000,typeof window!=="undefined"?window.innerWidth-280:800);
          var H=650;
          var langColors=dark?{python:"#3D8B6E",javascript:"#A8842E",typescript:"#4A7AA8",java:"#B85450",kotlin:"#7C7FBF",csharp:"#3D8B6E",go:"#3E7E9A",rust:"#B85450",ruby:"#B85450",php:"#7C7FBF",external:"#4F5D73",unknown:"#4F5D73"}:{python:"#059669",javascript:"#D97706",typescript:"#2563EB",java:"#DC2626",kotlin:"#6366F1",csharp:"#059669",go:"#0EA5E9",rust:"#DC2626",ruby:"#DC2626",php:"#6366F1",external:"#94A3B8",unknown:"#94A3B8"};
          var sim=nodes.map(function(n,i){return{x:W/2+Math.cos(i*2.1)*W*0.4,y:H/2+Math.sin(i*2.1)*H*0.4,vx:0,vy:0}});
          var alpha=0.9;
          for(var tick=0;tick<250;tick++){
            alpha*=0.97;
            sim.forEach(function(a,i){
              sim.forEach(function(b,j){
                if(i===j)return;
                var dx=a.x-b.x;var dy=a.y-b.y;var d=Math.sqrt(dx*dx+dy*dy)||1;
                var minDist=(nodes[i].type==="class"&&nodes[j].type==="class")?60:(nodes[i].type==="class"||nodes[j].type==="class")?70:150;
                var force=d<minDist?4000/(d*d):1200/(d*d);
                a.vx+=dx/d*force*alpha;a.vy+=dy/d*force*alpha;
              });
              a.vx+=(W/2-a.x)*0.004*alpha;a.vy+=(H/2-a.y)*0.004*alpha;
            });
            links.forEach(function(lk){
              var si=nodeMap[lk.source]?nodeMap[lk.source].idx:0;
              var ti=nodeMap[lk.target]?nodeMap[lk.target].idx:0;
              var s=sim[si];var t2=sim[ti];if(!s||!t2)return;
              var dx=t2.x-s.x;var dy=t2.y-s.y;var d=Math.sqrt(dx*dx+dy*dy)||1;
              var ideal=lk.type==="contains"?60:220;
              var str=lk.type==="contains"?0.03:0.003;
              var force2=(d-ideal)*str*alpha;
              s.vx+=dx/d*force2;s.vy+=dy/d*force2;
              t2.vx-=dx/d*force2;t2.vy-=dy/d*force2;
            });
            sim.forEach(function(n2){
              n2.vx*=0.82;n2.vy*=0.82;
              n2.x+=n2.vx;n2.y+=n2.vy;
              n2.x=Math.max(50,Math.min(W-50,n2.x));
              n2.y=Math.max(50,Math.min(H-50,n2.y));
            });
          }
          var selNode=graphSel;
          var selLinks=selNode?links.filter(function(lk){return lk.source===selNode||lk.target===selNode}):[];
          var selConnected=selNode?selLinks.reduce(function(acc,lk){acc[lk.source]=true;acc[lk.target]=true;return acc},{}):{};
          return <div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8,alignItems:"center"}}>
              <span style={{fontSize:9,color:T.txD}}>{nodes.length+" nodos · "+links.length+" conexiones"}</span>
              {["file","class","lib"].map(function(t3){var c2=nodes.filter(function(n){return n.type===t3}).length;if(!c2)return null;var ic=t3==="file"?"":t3==="class"?"":"";return <span key={t3} style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:600,background:T.cBg,color:T.txM}}>{ic+" "+c2+" "+(t3==="file"?"archivos":t3==="class"?"clases":"libs")}</span>})}
              {selNode&&<button onClick={function(){setGraphSel(null)}} style={{marginLeft:"auto",padding:"3px 10px",borderRadius:6,border:"1px solid "+T.bdL,background:T.w,fontSize:9,cursor:"pointer",color:T.txM}}>{"✕ Deseleccionar"}</button>}
            </div>
            <div style={Object.assign({},S.card,{overflow:"hidden",position:"relative"})}>
              <svg width={W} height={H} style={{display:"block",background:dark?"#0C1018":"#FAFBFC",cursor:"pointer"}} onClick={function(e){if(e.target.tagName==="svg")setGraphSel(null)}}>
                <defs>
                  <marker id="arwI" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="10" markerHeight="7" orient="auto"><path d={"M0,0 L10,3 L0,6 Z"} fill={dark?"#4A7AA8":"#2563EB"}/></marker>
                  <marker id="arwD" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="9" markerHeight="6" orient="auto"><path d={"M0,0 L10,3 L0,6 Z"} fill={dark?"#4F5D73":"#94A3B8"}/></marker>
                  <marker id="arwC" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="7" markerHeight="5" orient="auto"><path d={"M0,0 L10,3 L0,6 Z"} fill={dark?"#3D8B6E":"#059669"}/></marker>
                  <marker id="arwH" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="12" markerHeight="8" orient="auto"><path d={"M0,0 L10,3 L0,6 Z"} fill={dark?"#7DB5F5":"#1D4ED8"}/></marker>
                </defs>
                {links.map(function(lk,li){
                  var si2=nodeMap[lk.source]?nodeMap[lk.source].idx:0;
                  var ti2=nodeMap[lk.target]?nodeMap[lk.target].idx:0;
                  var s2=sim[si2];var t3b=sim[ti2];if(!s2||!t3b)return null;
                  var sr=nodes[si2]?nodes[si2].r:15;var tr=nodes[ti2]?nodes[ti2].r:15;
                  var dx2=t3b.x-s2.x;var dy2=t3b.y-s2.y;var d2=Math.sqrt(dx2*dx2+dy2*dy2)||1;
                  var sx=s2.x+dx2/d2*(sr+2);var sy=s2.y+dy2/d2*(sr+2);
                  var tx=t3b.x-dx2/d2*(tr+4);var ty=t3b.y-dy2/d2*(tr+4);
                  var isHi=selNode&&(lk.source===selNode||lk.target===selNode);
                  var isDim=selNode&&!isHi;
                  var clr2=isHi?(dark?"#7DB5F5":"#1D4ED8"):lk.type==="imports"?(dark?"#4A7AA8":"#2563EB"):lk.type==="depends"?(dark?"#4F5D73":"#94A3B8"):(dark?"#3D8B6E":"#059669");
                  var mkr=isHi?"url(#arwH)":lk.type==="imports"?"url(#arwI)":lk.type==="depends"?"url(#arwD)":"url(#arwC)";
                  return <line key={li} x1={sx} y1={sy} x2={tx} y2={ty} stroke={clr2} strokeWidth={isHi?2.5:lk.type==="imports"?1.8:lk.type==="contains"?.8:1.2} opacity={isDim?.1:isHi?1:lk.type==="contains"?.25:.55} markerEnd={mkr} strokeDasharray={lk.type==="contains"?"3,2":"none"}/>
                })}
                {nodes.map(function(nd,ni){
                  var pos=sim[ni];if(!pos)return null;
                  var clr3=langColors[nd.lang]||langColors.unknown;
                  var isSel=selNode===nd.id;
                  var isConn=selNode&&selConnected[nd.id];
                  var isDim2=selNode&&!isSel&&!isConn;
                  var fillOp=nd.type==="class"?.15:nd.type==="lib"?0:.12;
                  return <g key={ni} onClick={function(e){e.stopPropagation();setGraphSel(selNode===nd.id?null:nd.id)}} style={{cursor:"pointer"}}>
                    {isSel&&<circle cx={pos.x} cy={pos.y} r={nd.r+6} fill="none" stroke={dark?"#7DB5F5":"#1D4ED8"} strokeWidth="2" opacity=".5" strokeDasharray="4,2"/>}
                    <circle cx={pos.x} cy={pos.y} r={nd.r} fill={nd.type==="lib"?(dark?"#0C1018":"#FAFBFC"):clr3} fillOpacity={isDim2?.05:fillOp} stroke={isSel?(dark?"#7DB5F5":"#1D4ED8"):clr3} strokeWidth={nd.type==="file"?2.5:1.5} strokeDasharray={nd.type==="lib"?"4,2":"none"} opacity={isDim2?.25:1}/>
                    <text x={nd.type==="file"?pos.x:pos.x+nd.r+5} y={nd.type==="file"?pos.y+(nd.r+14):pos.y+3} textAnchor={nd.type==="file"?"middle":"start"} fill={isDim2?(dark?"#2A3040":"#CBD5E1"):dark?"#94A3B8":"#334155"} fontSize={nd.type==="file"?10:7} fontWeight={nd.type==="file"?700:500} fontFamily="'Fira Code',monospace" opacity={isDim2?.3:1}>{nd.label||nd.id}</text>
                    {nd.type==="file"&&<text x={pos.x} y={pos.y+3} textAnchor="middle" fill={isDim2?(dark?"#1A2030":"#E2E8F0"):clr3} fontSize="9" fontWeight="800" opacity={isDim2?.3:1}>{nd.lines+"L"}</text>}
                    {nd.type==="lib"&&<text x={pos.x} y={pos.y+3} textAnchor="middle" fill={dark?"#4F5D73":"#94A3B8"} fontSize="7" opacity={isDim2?.2:1}>{"pkg"}</text>}
                    {nd.type==="class"&&<text x={pos.x} y={pos.y+3} textAnchor="middle" fill={clr3} fontSize="6" fontWeight="700" opacity={isDim2?.2:.7}>{"C"}</text>}
                  </g>
                })}
              </svg>
              <div style={{position:"absolute",bottom:8,right:8,display:"flex",gap:10,background:(dark?"rgba(12,16,24,.85)":"rgba(255,255,255,.9)"),padding:"4px 10px",borderRadius:6,backdropFilter:"blur(4px)"}}>
                {[{l:"Archivo",c:dark?"#4A7AA8":"#2563EB",s:"solid"},{l:"Clase",c:dark?"#3D8B6E":"#059669",s:"solid"},{l:"Librería",c:dark?"#4F5D73":"#94A3B8",s:"dashed"}].map(function(lg,li){return <span key={li} style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:8,color:T.txD}}><span style={{width:8,height:8,borderRadius:"50%",border:"2px "+(lg.s==="dashed"?"dashed":"solid")+" "+lg.c,background:lg.s==="dashed"?"none":lg.c+"20"}}/>{lg.l}</span>})}
                <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:8,color:T.txD}}>{"→ import"}</span>
                <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:8,color:T.txD}}>{"⤍ contains"}</span>
              </div>
            </div>
            {selNode&&(function(){var nd3=nodes.find(function(n){return n.id===selNode});if(!nd3)return null;var out=links.filter(function(lk){return lk.source===selNode&&lk.type!=="contains"});var inc=links.filter(function(lk){return lk.target===selNode&&lk.type!=="contains"});var cls=links.filter(function(lk){return lk.source===selNode&&lk.type==="contains"});var clr5=langColors[nd3.lang]||langColors.unknown;return <div style={Object.assign({},S.card,{marginTop:8,border:"2px solid "+clr5+"40",overflow:"hidden"})}>
              <div style={{padding:"10px 16px",background:clr5+"10",borderBottom:"1px solid "+T.bdL,display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:12,height:12,borderRadius:"50%",background:clr5}}/>
                <span style={{fontSize:13,fontWeight:800,fontFamily:T.f,color:T.nv}}>{nd3.id}</span>
                <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:T.cBg,color:T.txM}}>{nd3.type}</span>
                {nd3.lines>0&&<span style={{fontSize:9,color:T.txD}}>{nd3.lines+" líneas"}</span>}
              </div>
              <div style={{padding:"10px 16px",display:"flex",gap:16,flexWrap:"wrap"}}>
                {nd3.classes.length>0&&<div><div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:3}}>{"CLASES"}</div>{nd3.classes.map(function(c3,ci){return <span key={ci} style={{display:"inline-block",marginRight:4,marginBottom:2,padding:"1px 6px",borderRadius:4,fontSize:9,background:clr5+"12",color:clr5,fontFamily:T.f}}>{c3}</span>})}</div>}
                {nd3.funcs.length>0&&<div><div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:3}}>{"FUNCIONES"}</div>{nd3.funcs.map(function(fn,fi){return <span key={fi} style={{display:"inline-block",marginRight:4,marginBottom:2,padding:"1px 6px",borderRadius:4,fontSize:9,background:T.cBg,color:T.txM,fontFamily:T.f}}>{fn+"()"}</span>})}</div>}
                {out.length>0&&<div><div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:3}}>{"IMPORTA →"}</div>{out.map(function(lk3,li3){return <span key={li3} style={{display:"inline-block",marginRight:4,marginBottom:2,padding:"1px 6px",borderRadius:4,fontSize:9,background:T.blP,color:T.bl,fontFamily:T.f}}>{lk3.target}</span>})}</div>}
                {inc.length>0&&<div><div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:3}}>{"← IMPORTADO POR"}</div>{inc.map(function(lk4,li4){return <span key={li4} style={{display:"inline-block",marginRight:4,marginBottom:2,padding:"1px 6px",borderRadius:4,fontSize:9,background:T.okBg,color:T.g,fontFamily:T.f}}>{lk4.source}</span>})}</div>}
              </div>
            </div>})()}
            {!selNode&&nodes.filter(function(n){return n.type==="file"}).length>0&&<div style={Object.assign({},S.card,{marginTop:8})}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid "+T.bdL}}><span style={{fontSize:11,fontWeight:700,color:T.nv}}>{"Detalle de Archivos"}</span></div>
              <div style={{padding:10,display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8}}>
                {nodes.filter(function(n){return n.type==="file"}).map(function(nd2,ni2){
                  var clr4=langColors[nd2.lang]||langColors.unknown;
                  var outL=links.filter(function(lk2){return lk2.source===nd2.id&&lk2.type!=="contains"});
                  var inL=links.filter(function(lk2){return lk2.target===nd2.id&&lk2.type!=="contains"});
                  return <div key={ni2} onClick={function(){setGraphSel(nd2.id)}} style={{padding:"8px 10px",borderRadius:8,border:"1px solid "+T.bdL,background:T.w,cursor:"pointer",transition:"all .2s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:clr4}}/>
                      <span style={{fontSize:10,fontWeight:700,color:T.nv,fontFamily:T.f}}>{nd2.id}</span>
                      <span style={{fontSize:8,color:T.txD,marginLeft:"auto"}}>{nd2.lines+" ln"}</span>
                    </div>
                    {nd2.classes.length>0&&<div style={{fontSize:8,color:T.txM,marginBottom:2}}>{"Clases: "+nd2.classes.join(", ")}</div>}
                    {nd2.funcs.length>0&&<div style={{fontSize:8,color:T.txM,marginBottom:2}}>{"Func: "+nd2.funcs.slice(0,4).join(", ")+(nd2.funcs.length>4?" +"+String(nd2.funcs.length-4):"")}</div>}
                    <div style={{display:"flex",gap:6,marginTop:4}}>
                      {outL.length>0&&<span style={{fontSize:7,padding:"1px 5px",borderRadius:4,background:T.blP,color:T.bl}}>{"→ "+outL.length}</span>}
                      {inL.length>0&&<span style={{fontSize:7,padding:"1px 5px",borderRadius:4,background:T.okBg,color:T.g}}>{"← "+inL.length}</span>}
                    </div>
                  </div>
                })}
              </div>
            </div>}
          </div>
        })()}
      </div>}

      {/* HISTORY */}
      {vw==="history" && <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <h2 style={{fontSize:18,fontWeight:800,color:T.nv,letterSpacing:"-.03em"}}>{t.history+" ("+hist.length+")"}</h2>
          {hist.length>0&&<div style={{display:"flex",gap:6,alignItems:"center"}}>
            <input value={histSearch} onChange={function(e){onHistSearch(e.target.value)}} placeholder={"🔍 "+t.origin+", "+t.dest+", "+t.model+"..."} aria-label="Search history" style={Object.assign({},S.input,{width:isMobile?180:260,fontSize:11})}/>
            <div style={{display:"flex",gap:2,background:T.cBg,borderRadius:8,padding:2,border:"1px solid "+T.bdL}}>
              {[{k:"date",l:"📅"},{k:"score",l:"🎯"},{k:"files",l:""}].map(function(sb){return <button key={sb.k} onClick={function(){setHistSort(sb.k)}} style={{padding:"4px 8px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,background:histSort===sb.k?T.bl:"transparent",color:histSort===sb.k?"#fff":T.txD,transition:"all .15s"}}>{sb.l}</button>})}
            </div>
          </div>}
        </div>
        {hist.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <div style={{padding:"8px 14px",borderRadius:8,background:T.blM,display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18,fontWeight:800,color:T.bl}}>{hist.length}</span><span style={{fontSize:10,color:T.txD}}>{t.dashTotalMig}</span></div>
          <div style={{padding:"8px 14px",borderRadius:8,background:T.okBg,display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18,fontWeight:800,color:T.g}}>{dashS.score}</span><span style={{fontSize:10,color:T.txD}}>{t.dashAvgScore}</span></div>
          <div style={{padding:"8px 14px",borderRadius:8,background:T.cBg,display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18,fontWeight:800,color:T.tx}}>{dashS.files}</span><span style={{fontSize:10,color:T.txD}}>{t.dashFilesProc}</span></div>
        </div>}
        {(function(){
          var filtered=hist.filter(function(h){
            if (!histQ) return true;
            var q=histQ.toLowerCase();
            return (h.from+" "+h.to+" "+h.ml+" "+h.date).toLowerCase().indexOf(q)>=0;
          });
          if (hist.length===0) return <div style={Object.assign({},S.card,{padding:30,textAlign:"center"})}><p style={{color:T.txD,fontSize:12}}>{t.noHist}</p></div>;
          if (filtered.length===0) return <div style={Object.assign({},S.card,{padding:20,textAlign:"center"})}><p style={{color:T.txD,fontSize:12}}>{"Sin resultados para \""+histSearch+"\""}</p></div>;
          var sorted=filtered.slice().sort(function(a,b){if(histSort==="score"){var sa=a.audit&&a.audit.finalScore?a.audit.finalScore:0;var sb2=b.audit&&b.audit.finalScore?b.audit.finalScore:0;return sb2-sa}if(histSort==="files")return(b.fc||0)-(a.fc||0);return 0});return sorted.map(function(h){return <div key={h.id} style={Object.assign({},S.card,{animation:"fadeIn .3s ease"})}>
              <div style={{padding:"10px 16px",display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",flexDirection:isMobile?"column":"row",gap:8}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:T.nv}}>{h.from+" → "+h.to}</div>
                  <div style={{fontSize:9,color:T.txD}}>{h.date+" · "+h.fc+" arch. · "+h.ml}</div>
                  {h.audit&&h.audit.finalScore!=null&&<div style={{display:"flex",gap:4,marginTop:3}}>
                    <span style={{padding:"1px 6px",borderRadius:6,fontSize:9,fontWeight:800,background:h.audit.finalScore>=95?T.okBg:h.audit.finalScore>=70?T.warnBg:T.errBg,color:h.audit.finalScore>=95?T.g:h.audit.finalScore>=70?T.y:T.r}}>{h.audit.finalScore+"/100"}</span>
                  </div>}
                </div>
                <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
                  {h.audit&&<span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:800,background:T.blP,color:T.bl,fontFamily:T.f}}>{"⏱ "+fmtMs(h.audit.totalDurationMs)}</span>}
                  {h.audit&&<span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:700,background:T.cBg,color:T.txM,fontFamily:T.f}}>{h.audit.apiCalls+" API"}</span>}
                  {h.audit&&<button onClick={function(){dlF(JSON.stringify(h.audit,null,2),"migraops_audit_"+h.audit.id+".json")}} style={Object.assign({},S.btn(),{padding:"3px 8px",fontSize:8})}>{"📋 JSON"}</button>}
                  <button onClick={function(){h.results.forEach(function(r,i){setTimeout(function(){dlF(r.migrated,dlN(r.name,r.targetName))},i*300)})}} style={S.btn("g")}>{"⬇"}</button>
                  <button onClick={function(){setRes(h.results);setRsk(h.risks);setActR(0);setShR(false);setIntR(h.integration||null);setAuditTrail(h.audit||null);setAudTab("pipeline");setAudExpand({});setVw("results")}} style={S.btn()}>{t.view+" →"}</button>
                </div>
              </div>
              {/* Inline audit timeline for history */}
              {h.audit&&h.audit.phases&&<div style={{padding:"6px 16px 8px",borderTop:"1px solid "+T.bdL,background:T.cBg}}>
                <div style={{display:"flex",gap:3,alignItems:"center",flexWrap:"wrap"}}>
                  {h.audit.phases.map(function(ph,i){
                    var colors={A:"#6366f1",B:"#2563EB",C1:"#059669",C2:"#059669",D1:"#d97706",D2:"#d97706"};
                    var clr=colors[ph.id]||(ph.id.startsWith("C")?T.g:ph.id.startsWith("D")?T.y:T.bl);
                    var pct=h.audit.totalDurationMs>0?Math.max(8,Math.round((ph.durationMs/h.audit.totalDurationMs)*100)):10;
                    return <div key={i} title={ph.name+": "+fmtMs(ph.durationMs)} style={{height:18,borderRadius:3,background:clr,flex:pct,display:"flex",alignItems:"center",justifyContent:"center",minWidth:28}}>
                      <span style={{fontSize:6,fontWeight:800,color:"#fff"}}>{ph.id+" "+fmtMs(ph.durationMs)}</span>
                    </div>
                  })}
                </div>
              </div>}
            </div>});
        })()}
      </div>}
          </div>
          </div>
        </div>
      </div>}
    
          {/* LANGUAGE TOOLTIP PORTAL */}
      {hovLang&&LANG_META[hovLang]&&<div style={{position:"fixed",top:hovLangPos.y,left:hovLangPos.x,transform:"translateX(-50%)",width:280,borderRadius:14,background:dark?"#1A2236":"#fff",border:"1px solid "+(dark?"rgba(255,255,255,.1)":"rgba(0,0,0,.08)"),boxShadow:"0 12px 40px rgba(0,0,0,"+(dark?".4":".15")+")",zIndex:99999,animation:"fadeIn .15s ease"}} onMouseLeave={function(){setHovLang(null)}}>
        <div style={{position:"absolute",top:-5,left:"50%",transform:"translateX(-50%) rotate(45deg)",width:10,height:10,background:dark?"#1A2236":"#fff",borderTop:"1px solid "+(dark?"rgba(255,255,255,.1)":"rgba(0,0,0,.08)"),borderLeft:"1px solid "+(dark?"rgba(255,255,255,.1)":"rgba(0,0,0,.08)")}}/>
        <div style={{padding:"12px 16px",background:(LANGS[hovLang]||{}).c+"10",borderBottom:"1px solid "+(dark?"rgba(255,255,255,.06)":"rgba(0,0,0,.05)"),borderRadius:"14px 14px 0 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>{(LANGS[hovLang]||{}).i}</span>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:dark?"#fff":T.nv}}>{(LANGS[hovLang]||{}).n}</div><div style={{fontSize:9,color:T.txD}}>{LANG_META[hovLang].desc}</div></div>
          </div>
        </div>
        <div style={{padding:"10px 16px"}}>
          <div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>{t.strengths2||"Strengths"}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>{LANG_META[hovLang].strengths.map(function(s,si){return <span key={si} style={{padding:"2px 8px",borderRadius:6,fontSize:8,fontWeight:600,background:dark?"rgba(255,255,255,.06)":"rgba(0,0,0,.04)",color:T.txM}}>{s}</span>})}</div>
          <div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>{t.migrateTo2||"Migrate to"}</div>
          <div style={{display:"flex",gap:3}}>{LANG_META[hovLang].migrateTo.slice(0,4).map(function(tgt){var tl2=LANGS[tgt];return tl2?<div key={tgt} onClick={function(){setSL(hovLang);setTL(tgt);setHovLang(null);if(files.length>0)setVw("configure")}} style={{flex:1,padding:"6px 4px",borderRadius:8,background:tl2.c+"08",border:"1px solid "+tl2.c+"15",textAlign:"center",cursor:"pointer"}}><div style={{fontSize:12}}>{tl2.i}</div><div style={{fontSize:7,fontWeight:700,color:tl2.c,marginTop:2}}>{tl2.n}</div></div>:null})}</div>
          <div style={{marginTop:8,fontSize:8,color:T.txD,textAlign:"center"}}>{LANG_META[hovLang].ecosystem}</div>
        </div>
      </div>}
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
