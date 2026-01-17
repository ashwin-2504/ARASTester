import React from 'react';
import { Input } from '@/components/ui/input';
import { ARAS_DEFAULTS } from '../defaults';

const ConnectEditor = ({ params, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium leading-none">Server URL</label>
        <Input
          value={params.url || ''}
          onChange={(e) => onChange({ ...params, url: e.target.value })}
          placeholder="https://server/InnovatorServer/Server/InnovatorServer.aspx"
        />
        <p className="text-xs text-muted-foreground">
          Full URL to the Innovator server endpoint
        </p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium leading-none">Database</label>
        <Input
          value={params.database || ''}
          onChange={(e) => onChange({ ...params, database: e.target.value })}
          placeholder="InnovatorSolutions"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium leading-none">Username</label>
          <Input
            value={params.username || ARAS_DEFAULTS.username}
            onChange={(e) => onChange({ ...params, username: e.target.value })}
            placeholder="admin"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium leading-none">Password</label>
          <Input
            type="password"
            value={params.password || ARAS_DEFAULTS.password}
            onChange={(e) => onChange({ ...params, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
        <strong>Note:</strong> This action establishes a connection to ARAS Innovator
        using the IOM SDK. The connection will be used by subsequent actions in this test plan.
      </div>
    </div>
  );
};

export const ConnectAction = {
  type: 'ArasConnect',
  label: 'Connect to ARAS',
  category: 'Connection',
  Editor: ConnectEditor,
  defaultParams: {
    url: 'http://localhost/InnovatorServer/Server/InnovatorServer.aspx',
    database: 'InnovatorSolutions',
    username: ARAS_DEFAULTS.username,
    password: ARAS_DEFAULTS.password
  }
};
