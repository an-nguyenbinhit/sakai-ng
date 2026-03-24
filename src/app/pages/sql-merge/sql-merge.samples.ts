import { SqlMergeSampleDefinition } from './sql-merge.models';

export const SQL_MERGE_DEFAULT_HEADER_TEMPLATE = `-- =============================================
-- File {{index}}: {{fileName}}
-- Size: {{sizeBytes}} bytes | Modified: {{lastModifiedIso}}
-- =============================================`;

export const SQL_MERGE_SAMPLES: SqlMergeSampleDefinition[] = [
    {
        label: 'Ordered seed',
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
        label: 'Preserve GO',
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
        label: 'Mixed inputs',
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
        label: 'Proc + trim',
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
    },
    {
        label: 'Duplicates',
        description: 'Two identical files to validate duplicate skip versus keep-both behavior.',
        files: [
            {
                name: '001_repeat.sql',
                content: `SELECT N'duplicate';`
            },
            {
                name: '001_repeat.sql',
                content: `SELECT N'duplicate';`
            }
        ]
    },
    {
        label: 'Force GO',
        description: 'Statements without trailing GO to test forced batch separators between files.',
        files: [
            {
                name: '001_tables.sql',
                content: `CREATE TABLE dbo.BatchA (
    Id INT PRIMARY KEY
);`
            },
            {
                name: '002_seed.sql',
                content: `INSERT INTO dbo.BatchA (Id)
VALUES (1);`
            }
        ]
    },
    {
        label: 'Strip GO',
        description: 'Files that include standalone GO lines for GO-off cleanup testing.',
        files: [
            {
                name: '001_cleanup.sql',
                content: `SELECT 1;
GO
SELECT 2;
GO`
            },
            {
                name: '002_post.sql',
                content: `SELECT 3;`
            }
        ]
    },
    {
        label: 'Large batch',
        description: 'A compact multi-file batch to stress ordering, preview blocks, and scroll navigation.',
        files: Array.from({ length: 8 }, (_, index) => ({
            name: `${String(index + 1).padStart(3, '0')}_batch_${index + 1}.sql`,
            content: `PRINT N'Batch ${index + 1}';
INSERT INTO dbo.Logs (Message)
VALUES (N'Row ${index + 1}');`
        }))
    }
];
