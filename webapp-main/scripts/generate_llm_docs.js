
import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const XML_DIR = path.resolve(__dirname, '../docs/xml');
const OUTPUT_FILE = path.resolve(__dirname, '../docs/llm_context.md');

async function parseXml(filePath) {
    const xml = fs.readFileSync(filePath, 'utf-8');
    const parser = new xml2js.Parser({ explicitArray: false });
    return parser.parseStringPromise(xml);
}

async function generateDigest() {
    if (!fs.existsSync(XML_DIR)) {
        console.error(`XML directory not found at ${XML_DIR}. Run 'doxygen Doxyfile' first.`);
        return;
    }

    const files = fs.readdirSync(XML_DIR).filter(f => f.endsWith('.xml') && f !== 'index.xml');

    let output = `# Project Documentation Summary\n\n`;
    output += `> This document is auto-generated from source code comments for LLM context.\n\n`;

    for (const file of files) {
        try {
            const data = await parseXml(path.join(XML_DIR, file));
            const compound = data.doxygen?.compounddef;

            if (!compound || compound.$.kind === 'file' || compound.$.kind === 'dir') continue;

            const name = compound.compoundname;
            const brief = getDocText(compound.briefdescription);
            const detailed = getDocText(compound.detaileddescription);

            output += `## ${compound.$.kind}: ${name}\n\n`;
            if (brief) output += `**Brief**: ${brief}\n\n`;
            if (detailed) output += `**Description**: \n${detailed}\n\n`;

            const sections = Array.isArray(compound.sectiondef) ? compound.sectiondef : (compound.sectiondef ? [compound.sectiondef] : []);

            for (const section of sections) {
                const members = Array.isArray(section.memberdef) ? section.memberdef : (section.memberdef ? [section.memberdef] : []);

                if (members.length > 0) {
                    output += `### ${translateSectionKind(section.$.kind)}\n`;

                    for (const member of members) {
                        const mName = member.name;
                        const mType = member.type;
                        const mBrief = getDocText(member.briefdescription);
                        const mDetail = getDocText(member.detaileddescription);
                        const mArgs = member.argsstring || '';

                        output += `- \`${mName}${mArgs}\`\n`;
                        if (mType && typeof mType === 'string') output += `  - Type: \`${mType}\`\n`;
                        if (mBrief) output += `  - ${mBrief.replace(/\n/g, ' ')}\n`;
                        if (mDetail) output += `  - Details: ${mDetail.replace(/\n/g, ' ')}\n`;
                    }
                    output += '\n';
                }
            }
            output += '---\n\n';

        } catch (e) {
            console.warn(`Skipped ${file}: ${e.message}`);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, output);
    console.log(`Documentation digest written to ${OUTPUT_FILE}`);
}

function getDocText(node) {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (node.para) {
        if (Array.isArray(node.para)) {
            return node.para.map(p => getTextFromPara(p)).join('\n');
        }
        return getTextFromPara(node.para);
    }
    return '';
}

function getTextFromPara(para) {
    if (typeof para === 'string') return para;
    if (para._) return para._; // Sometimes text is in _
    // Handle simplified mixed content if possible, or just JSON stringify for now if complex
    // xml2js can be tricky with mixed content.
    // For now, let's try to extract text values recursively if possible or fallback.
    return JSON.stringify(para).replace(/[{}"\[\]]/g, '').slice(0, 100) + '...'; // Simplified fallback for now
}

function translateSectionKind(kind) {
    const map = {
        'public-func': 'Public Functions',
        'private-func': 'Private Functions',
        'public-attrib': 'Public Properties',
        'private-attrib': 'Private Properties',
        'property': 'Properties',
        'user-defined': 'Custom'
    };
    return map[kind] || kind;
}

generateDigest();
