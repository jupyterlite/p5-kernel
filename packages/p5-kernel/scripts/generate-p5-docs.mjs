// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * Generate p5.js documentation from @types/p5.
 *
 * Parses global.d.ts type definitions to extract JSDoc descriptions
 * and function signatures, producing a TypeScript source file with
 * the documentation map used for Shift+Tab inspection in notebooks.
 *
 * Usage: node scripts/generate-p5-docs.mjs
 */

import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Extract the first sentence from a JSDoc comment string.
 */
function extractDescription(comment) {
  const text = comment.replace(/\s+/g, ' ').trim();
  // Match up to the first period followed by a space or end of string
  const match = text.match(/^(.+?\.)\s/);
  return match ? match[1] : text;
}

/**
 * Format a function signature from its parameter declarations.
 */
function formatSignature(name, params) {
  const parts = params.map(p => {
    const paramName = p.name.getText();
    if (p.questionToken || p.initializer) {
      return `[${paramName}]`;
    }
    return paramName;
  });
  return `${name}(${parts.join(', ')})`;
}

function generate() {
  const globalDtsPath = require.resolve('@types/p5/global.d.ts');
  const source = readFileSync(globalDtsPath, 'utf-8');

  const sourceFile = ts.createSourceFile(
    'global.d.ts',
    source,
    ts.ScriptTarget.Latest,
    true
  );

  // Collect docs: for overloaded functions, keep the overload with most params
  const docs = new Map();

  function visit(node) {
    // Handle function declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text;
      const jsDocNodes = node.jsDoc;
      const params = node.parameters;

      const existing = docs.get(name);
      const existingParamCount = existing?.signature
        ? (existing.signature.match(/,/g)?.length ?? 0) + 1
        : 0;

      // Pick the overload with the most parameters for the richest signature
      if (!existing || params.length > existingParamCount) {
        let description = '';
        if (jsDocNodes?.length) {
          const comment = jsDocNodes[0].comment;
          if (typeof comment === 'string') {
            description = extractDescription(comment);
          }
        }

        // Keep description from earlier overload if this one lacks JSDoc
        if (!description && existing?.description) {
          description = existing.description;
        }

        if (description) {
          docs.set(name, {
            name,
            description,
            signature: formatSignature(name, params)
          });
        }
      }
    }

    // Handle variable declarations (mouseX, width, frameCount, etc.)
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          const name = decl.name.text;
          const jsDocNodes = node.jsDoc;
          if (jsDocNodes?.length) {
            const comment = jsDocNodes[0].comment;
            if (typeof comment === 'string') {
              const description = extractDescription(comment);
              if (description) {
                docs.set(name, { name, description });
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Sort entries alphabetically
  const sorted = [...docs.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Generate the output file
  const entries = sorted.map(entry => {
    let value = entry.description;
    if (entry.signature) {
      value += ` Usage: ${entry.signature}`;
    }
    // Escape single quotes
    value = value.replace(/'/g, "\\'");
    return `  ${entry.name}:\n    '${value}'`;
  });

  const output = `// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// **Auto-generated from @types/p5** -- do not edit manually.
// Regenerate with: jlpm generate:docs

/**
 * p5.js documentation map for inspect requests.
 *
 * p5.js exposes its API as bound methods in global mode, so runtime
 * inspection only shows \`function bound ()\`. This map provides proper
 * descriptions and signatures for Shift+Tab inspection in notebooks.
 *
 * Generated from @types/p5 global.d.ts.
 */
export const P5_DOCS: Record<string, string> = {
${entries.join(',\n')}
};
`;

  const outPath = resolve(__dirname, '..', 'src', 'p5-docs.ts');
  writeFileSync(outPath, output);
  console.log(`Generated ${sorted.length} documentation entries in ${outPath}`);
}

generate();
