import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';
import * as path from 'path';
import type { RelationshipModel } from '../ir/index.js';

const parser = new XMLParser({
    attributeNamePrefix: '@_',
    ignoreAttributes: false,
    isArray: (name) => ['EntityRelationship', 'Description'].includes(name)
});

function getEnglishDescription(relationshipDescription: any): string {
    const descriptions = relationshipDescription?.Descriptions?.Description ?? [];
    const english = descriptions.find((d: any) => d['@_languagecode'] === '1033');
    return english?.['@_description'] ?? '';
}

// Parses a single relationship XML file — each file is named after the related entity
function parseRelationshipFile(filePath: string): RelationshipModel[] {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = parser.parse(raw);

    const relationships = parsed?.EntityRelationships?.EntityRelationship ?? [];
    const results: RelationshipModel[] = [];

    for (const rel of relationships) {
        const name: string = rel['@_Name'] ?? '';
        const type: string = rel.EntityRelationshipType ?? 'OneToMany';
        const referencingEntity: string = rel.ReferencingEntityName ?? '';
        const referencedEntity: string = rel.ReferencedEntityName ?? '';
        const referencingAttribute: string = rel.ReferencingAttributeName ?? '';
        const description = getEnglishDescription(rel.RelationshipDescription);

        // Determine if this is a custom relationship by checking the referencing attribute
        // Custom ones have the publisher prefix on the attribute name
        const isCustom = referencingAttribute.toLowerCase().startsWith('vel_');

        results.push({
            name,
            type: type as RelationshipModel['type'],
            referencingEntity,
            referencedEntity,
            referencingAttribute,
            description,
            isCustom,
        });
    }

    return results;
}

// Reads all relationship files from Other/Relationships/ and returns a flat list
export function parseAllRelationships(unpackedPath: string): RelationshipModel[] {
    const relationshipsPath = path.join(unpackedPath, 'Other', 'Relationships');

    if (!fs.existsSync(relationshipsPath)) {
        console.warn(`No Relationships folder found at: ${relationshipsPath}`);
        return [];
    }

    const files = fs
        .readdirSync(relationshipsPath)
        .filter(f => f.endsWith('.xml'));

    console.log(`Found ${files.length} relationship files`);

    const all: RelationshipModel[] = [];

    for (const file of files) {
        const filePath = path.join(relationshipsPath, file);
        try {
            const rels = parseRelationshipFile(filePath);
            all.push(...rels);
        } catch (err) {
            console.error(`Failed to parse relationships file: ${file}`, err);
        }
    }

    return all;
}

// Filters the full relationship list down to those relevant to a specific table.
// A table is involved if it appears on either side of the relationship.
export function getRelationshipsForTable(
    allRelationships: RelationshipModel[],
    tableLogicalName: string
): RelationshipModel[] {
    const name = tableLogicalName.toLowerCase();
    return allRelationships.filter(
        r =>
            r.referencingEntity.toLowerCase() === name ||
            r.referencedEntity.toLowerCase() === name
    );
}