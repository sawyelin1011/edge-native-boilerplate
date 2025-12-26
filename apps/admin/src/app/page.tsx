// Foundation Page - Admin Dashboard
// No UI logic implemented in Phase 1

export default function HomePage() {
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome to the GSMFlow Admin Dashboard.</p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Phase 1 Foundation</h3>
        <p>The following features are available in Phase 1:</p>
        <ul>
          <li>✅ API health check endpoints</li>
          <li>✅ tRPC router configuration</li>
          <li>✅ Runtime adapter system (Cloudflare, Vercel Edge, Deno)</li>
          <li>✅ Plugin system foundation</li>
          <li>❌ UI features (Phase 2)</li>
          <li>❌ GSM business logic (Phase 2)</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Quick Links</h3>
        <ul>
          <li><a href="/api/health">API Health</a></li>
          <li><a href="http://localhost:8787/health">API Health (Local)</a></li>
        </ul>
      </div>
    </div>
  )
}
