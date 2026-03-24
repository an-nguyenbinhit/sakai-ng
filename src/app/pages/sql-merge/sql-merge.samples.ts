import { SqlMergeSampleDefinition } from './sql-merge.models';

export const SQL_MERGE_DEFAULT_HEADER_TEMPLATE = `-- =============================================
-- File {{index}}: {{fileName}}
-- Size: {{sizeBytes}} bytes | Modified: {{lastModifiedIso}}
-- =============================================`;

export const SQL_MERGE_SAMPLES: SqlMergeSampleDefinition[] = [
    {
        label: 'Ordered schema and seed',
        description: 'Basic merge order with schema before seed data.',
        files: [
            {
                name: '001_create_table.sql',
                content: `CREATE TABLE dbo.Users (
    Id INT PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL
);`
            },
            {
                name: '002_seed.sql',
                content: `INSERT INTO dbo.Users (Id, Name)
VALUES (1, N'An');`
            }
        ]
    },
    {
        label: 'Preserve GO batches',
        description: 'Existing GO separators inside source files.',
        files: [
            {
                name: '001_schema.sql',
                content: `CREATE TABLE dbo.Products (
    Id INT PRIMARY KEY
);
GO
CREATE INDEX IX_Products_Id ON dbo.Products(Id);`
            },
            {
                name: '002_data.sql',
                content: `INSERT INTO dbo.Products (Id) VALUES (1);
GO
INSERT INTO dbo.Products (Id) VALUES (2);`
            }
        ]
    },
    {
        label: 'Warnings and mixed inputs',
        description: 'Empty SQL file plus a .txt note that still contains executable SQL.',
        files: [
            {
                name: '001_empty.sql',
                content: ''
            },
            {
                name: 'notes.txt',
                content: `-- manual note
UPDATE dbo.Users SET Name = N'Binh' WHERE Id = 1;`,
                type: 'text/plain'
            }
        ]
    },
    {
        label: 'Procedure body and trailing spaces',
        description: 'Procedure script plus BOM/trailing whitespace cleanup case.',
        files: [
            {
                name: '001_proc.sql',
                content: `CREATE OR ALTER PROCEDURE dbo.usp_Test
AS
BEGIN
    SELECT 1;
END`
            },
            {
                name: '002_bom.sql',
                content: `\uFEFFSELECT 1;    `
            }
        ]
    }
];
