// find-async-client-error.js
// Ejecutar con: node find-async-client-error.js

const fs = require('fs');
const path = require('path');

const problematicFiles = [];

// Directorios a buscar
const searchDirs = [
  './src/app',
  './src/components',
  './app',
  './components'
];

// Función para buscar archivos problemáticos
function findProblematicFiles(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // Recursivamente buscar en subdirectorios
      findProblematicFiles(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.jsx')) {
      // Leer el archivo
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Verificar si tiene "use client" Y async function
      const hasUseClient = content.includes('"use client"') || content.includes("'use client'");
      const hasAsyncExport = /export\s+default\s+async\s+function/.test(content) ||
                            /export\s+async\s+function\s+\w+\s*\(/.test(content) ||
                            /const\s+\w+\s*=\s*async\s*\(/.test(content) && /export\s+default/.test(content);
      
      if (hasUseClient && hasAsyncExport) {
        problematicFiles.push({
          file: fullPath,
          lineWithUseClient: content.split('\n').findIndex(line => 
            line.includes('"use client"') || line.includes("'use client'")) + 1,
          lineWithAsync: content.split('\n').findIndex(line => 
            line.includes('async')) + 1
        });
      }
      
      // También buscar patrones sospechosos
      if (hasUseClient) {
        // Buscar await fuera de useEffect
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Si encuentra await que no está dentro de useEffect
          if (line.includes('await') && !isInsideUseEffect(lines, i)) {
            console.log(`⚠️  Posible await problemático en ${fullPath}:${i + 1}`);
          }
        }
      }
    }
  }
}

// Helper para verificar si un await está dentro de useEffect
function isInsideUseEffect(lines, lineIndex) {
  // Buscar hacia atrás para ver si estamos dentro de useEffect
  let braceCount = 0;
  for (let i = lineIndex; i >= 0; i--) {
    if (lines[i].includes('useEffect')) {
      return true;
    }
    // Contar llaves para saber si salimos del scope
    braceCount += (lines[i].match(/\{/g) || []).length;
    braceCount -= (lines[i].match(/\}/g) || []).length;
    if (braceCount < 0) break;
  }
  return false;
}

console.log('🔍 Buscando componentes con "use client" y async...\n');

// Ejecutar búsqueda
searchDirs.forEach(dir => {
  console.log(`Buscando en: ${dir}`);
  findProblematicFiles(dir);
});

// Mostrar resultados
if (problematicFiles.length > 0) {
  console.log('\n❌ ARCHIVOS PROBLEMÁTICOS ENCONTRADOS:\n');
  problematicFiles.forEach(({ file, lineWithUseClient, lineWithAsync }) => {
    console.log(`📄 ${file}`);
    console.log(`   - "use client" en línea ${lineWithUseClient}`);
    console.log(`   - "async" en línea ${lineWithAsync}`);
    console.log('');
  });
  
  console.log('🔧 SOLUCIÓN:');
  console.log('1. Elimina "async" de la declaración del componente');
  console.log('2. Mueve la lógica async dentro de useEffect');
  console.log('3. O elimina "use client" si el componente no necesita ser cliente\n');
} else {
  console.log('\n✅ No se encontraron archivos con el patrón problemático obvio.');
  console.log('El error podría estar en:');
  console.log('- Un componente importado dinámicamente');
  console.log('- Un hook personalizado que usa async incorrectamente');
  console.log('- Un componente que recibe una función async como prop\n');
}

// Buscar componentes que podrían tener el problema de forma menos obvia
console.log('📋 Archivos con "use client" para revisar manualmente:\n');
searchDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  
  const findClientComponents = (directory) => {
    const files = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(directory, file.name);
      
      if (file.isDirectory()) {
        findClientComponents(fullPath);
      } else if (file.name.endsWith('.tsx') || file.name.endsWith('.jsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('"use client"') || content.includes("'use client'")) {
          console.log(`  - ${fullPath}`);
        }
      }
    }
  };
  
  findClientComponents(dir);
});