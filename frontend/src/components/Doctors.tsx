import * as Select from '@radix-ui/react-select';
import { useStore } from '../store';

export function Doctors() {
  const { doctors, templates, assign, role } = useStore();
  return (
    <table>
      <thead><tr><th>ID</th><th>Name</th><th>Specialty</th><th>Payout template</th></tr></thead>
      <tbody>
        {doctors.map((d) => (
          <tr key={d.id}>
            <td>{d.id}</td><td>{d.name}</td><td>{d.specialty}</td>
            <td>
              <Select.Root value={d.templateId} disabled={role !== 'admin'} onValueChange={(v) => assign(d.id, v)}>
                <Select.Trigger className="select-trigger" aria-label={`Template for ${d.name}`}>
                  <Select.Value />
                  <Select.Icon>▾</Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="select-content" position="popper">
                    <Select.Viewport>
                      {templates.map((t) => (
                        <Select.Item key={t.id} value={t.id} className="select-item">
                          <Select.ItemText>{t.name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
