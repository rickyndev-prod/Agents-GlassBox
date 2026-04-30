require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function migrate() {
  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' || process.env.POSTGRES_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('Running migrations...');
    
    // Create the agent_events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_events (
        id SERIAL PRIMARY KEY,
        trace_id VARCHAR(255) NOT NULL,
        span_id VARCHAR(255) NOT NULL,
        parent_span_id VARCHAR(255),
        event_type VARCHAR(255) NOT NULL,
        context_payload JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create an index for faster trace lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_events_trace_id ON agent_events(trace_id);
    `);

    console.log('✅ Migrations completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
