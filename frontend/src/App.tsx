import { useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useStore } from './store';
import { Doctors } from './components/Doctors';
import { Templates } from './components/Templates';
import { Uploads } from './components/Uploads';
import { Payouts } from './components/Payouts';

export default function App() {
  const { role, login, loadAll, error, clearError } = useStore();
  useEffect(() => { if (role) void loadAll(); }, [role, loadAll]);

  if (!role) {
    return (
      <div className="login">
        <h1>Doctor Payout Automation</h1>
        <p>Mock sign-in (no Azure MSAL). Choose a role:</p>
        <button className="primary" onClick={() => login('admin')}>Login as Admin</button>
        <button onClick={() => login('viewer')}>Continue as Viewer (read-only)</button>
      </div>
    );
  }
  return (
    <div className="app">
      <header>
        <h1>Doctor Payout Automation</h1>
        <div className="who">
          Role:
          <select value={role} onChange={(e) => login(e.target.value as 'admin' | 'viewer')}>
            <option value="admin">admin</option>
            <option value="viewer">viewer</option>
          </select>
          <button onClick={() => login(null)}>Sign out</button>
        </div>
      </header>
      {error && <div className="banner error" onClick={clearError}>{error} (click to dismiss)</div>}
      {role === 'viewer' && <div className="banner">Viewer role: changes are disabled.</div>}
      <Tabs.Root defaultValue="payouts">
        <Tabs.List className="tabs">
          {['payouts', 'collections', 'templates', 'doctors'].map((t) => (
            <Tabs.Trigger key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="payouts"><Payouts /></Tabs.Content>
        <Tabs.Content value="collections"><Uploads /></Tabs.Content>
        <Tabs.Content value="templates"><Templates /></Tabs.Content>
        <Tabs.Content value="doctors"><Doctors /></Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
