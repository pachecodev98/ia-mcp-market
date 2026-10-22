const { Pool } = require('pg');

async function main() {
  const p = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const tables = await p.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY 1, 2
    `);
    console.log('TABLES:', JSON.stringify(tables.rows, null, 2));

    const produtosLike = await p.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE lower(table_name) LIKE '%produto%'
    `);
    console.log('PRODUTO-LIKE:', JSON.stringify(produtosLike.rows, null, 2));
  } finally {
    await p.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
