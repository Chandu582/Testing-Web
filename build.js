/**
 * BookOTS Automated Compilation Pipeline
 * Minifies and Obfuscates code into production-ready `dist/` directory
 * Developed by Xevion Byte (https://xevion-byte.vercel.app / 9693776982)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

console.log('🚀 Starting BookOTS Premium Build Pipeline...\n');

// 1. Resolve Dependencies
const checkDepsAndInstall = () => {
  const nodeModulesExist = fs.existsSync(path.join(rootDir, 'node_modules'));
  if (!nodeModulesExist) {
    console.log('📦 node_modules not found. Auto-triggering dependency installer...');
    try {
      execSync('npm install', { stdio: 'inherit', cwd: rootDir });
      console.log('✅ Dependencies installed successfully.\n');
    } catch (err) {
      console.error('❌ Failed to install dependencies. Make sure Node.js and NPM are installed.', err);
      process.exit(1);
    }
  }
};

checkDepsAndInstall();

// Load modules
const CleanCSS = require('clean-css');
const Terser = require('terser');
const JavaScriptObfuscator = require('javascript-obfuscator');
const HtmlMinifier = require('html-minifier-terser');

// 2. Ensure directories exist
const makeDirs = () => {
  const dirs = [
    distDir,
    path.join(distDir, 'assets'),
    path.join(distDir, 'assets', 'css'),
    path.join(distDir, 'assets', 'js')
  ];
  dirs.forEach(d => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  });
};

makeDirs();

async function runBuild() {
  try {
    // --- BUILD CSS ---
    console.log('🎨 Compiling and Minifying Style Sheets...');
    const rawCss = fs.readFileSync(path.join(srcDir, 'assets', 'css', 'style.css'), 'utf-8');
    const cssMinified = new CleanCSS({ level: 2 }).minify(rawCss).styles;
    fs.writeFileSync(path.join(distDir, 'assets', 'css', 'style.min.css'), cssMinified);
    console.log(`✅ Style sheet minified successfully. (${rawCss.length} bytes -> ${cssMinified.length} bytes)`);

    // --- BUILD JS (DB, APP, ADMIN) ---
    const jsFiles = ['db.js', 'app.js', 'admin.js'];
    
    for (const file of jsFiles) {
      const srcPath = path.join(srcDir, 'assets', 'js', file);
      const distName = file.replace('.js', '.min.js');
      const distPath = path.join(distDir, 'assets', 'js', distName);
      
      console.log(`⚡ Processing and Obfuscating Javascript: ${file}...`);
      const rawJs = fs.readFileSync(srcPath, 'utf-8');
      
      // First pass: Minify using Terser (module: true for ES import/export support)
      const minifiedJsRes = await Terser.minify(rawJs, {
        module: true,
        compress: true,
        mangle: true
      });
      
      if (minifiedJsRes.error) {
        throw minifiedJsRes.error;
      }
      
      let processedCode = minifiedJsRes.code;

      // Fix import paths: src uses ./db.js but dist needs ./db.min.js
      processedCode = processedCode
        .replace(/from\s*["']\.\/db\.js["']/g, 'from"./db.min.js"')
        .replace(/from\s*["']\.\/app\.js["']/g, 'from"./app.min.js"')
        .replace(/from\s*["']\.\/admin\.js["']/g, 'from"./admin.min.js"');

      // Second pass: Obfuscate to prevent scraping/endpoint copying
      const obfuscatedRes = JavaScriptObfuscator.obfuscate(processedCode, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        numbersToExpressions: true,
        simplify: true,
        stringArrayThreshold: 0.75,
        splitStrings: true,
        splitStringsChunkLength: 10,
        unicodeEscapeSequence: false,
        // Preserve dynamic import() calls and Firebase CDN URLs
        reservedStrings: ['https://www\\.gstatic\\.com', 'firebase', 'import'],
        // Preserve exported names
        identifierNamesGenerator: 'hexadecimal'
      });
      
      const finalCode = obfuscatedRes.getObfuscatedCode();
      fs.writeFileSync(distPath, finalCode);
      console.log(`✅ ${file} compiled and obfuscated. (${rawJs.length} bytes -> ${finalCode.length} bytes)`);
    }

    // --- BUILD HTML (INDEX, ADMIN) ---
    const htmlFiles = ['index.html', 'admin.html'];
    
    for (const file of htmlFiles) {
      console.log(`📄 Compiling HTML and updating assets paths: ${file}...`);
      const srcPath = path.join(srcDir, file);
      const distPath = path.join(distDir, file);
      
      let rawHtml = fs.readFileSync(srcPath, 'utf-8');
      
      // Update css/js paths to minified versions
      rawHtml = rawHtml
        .replace(/assets\/css\/style\.css/g, 'assets/css/style.min.css')
        .replace(/assets\/js\/db\.js/g, 'assets/js/db.min.js')
        .replace(/assets\/js\/app\.js/g, 'assets/js/app.min.js')
        .replace(/assets\/js\/admin\.js/g, 'assets/js/admin.min.js');

      // Minify HTML
      const minifiedHtml = await HtmlMinifier.minify(rawHtml, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true
      });
      
      fs.writeFileSync(distPath, minifiedHtml);
      console.log(`✅ ${file} minified and bundled. (${rawHtml.length} bytes -> ${minifiedHtml.length} bytes)`);
    }

    console.log('\n✨ Premium Production Build Completed Successfully! ✨');
    console.log('📂 All assets compiled under `dist/` directory.');
    console.log('💼 Developed & Managed by Xevion Byte (Contact: 9693776982)');
    
  } catch (error) {
    console.error('❌ Build script crashed with an error:', error);
    process.exit(1);
  }
}

runBuild();
