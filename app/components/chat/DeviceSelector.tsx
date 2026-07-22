import React, { useState } from 'react';
import { classNames } from '~/utils/classNames';
import { Dialog, DialogTitle, DialogDescription, DialogButton } from '~/components/ui/Dialog';

interface DeviceSelectorProps {
  className?: string;
}

export function DeviceSelector({ className }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([
    { id: 'webcontainer', name: 'WebContainer (Browser)' },
  ]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('webcontainer');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTunnelUrl, setNewTunnelUrl] = useState('');

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'add_new') {
      setIsDialogOpen(true);

      // Revert selection until added
      e.target.value = selectedDeviceId;
    } else {
      setSelectedDeviceId(e.target.value);
    }
  };

  const handleAddTunnel = () => {
    if (newTunnelUrl) {
      const newDevice = { id: `tunnel_${Date.now()}`, name: `Remote Tunnel (${newTunnelUrl})` };
      setDevices([...devices, newDevice]);
      setSelectedDeviceId(newDevice.id);
      setIsDialogOpen(false);
      setNewTunnelUrl('');
    }
  };

  return (
    <>
      <div className={classNames('flex items-center gap-2', className)}>
        <select
          value={selectedDeviceId}
          onChange={handleSelect}
          className="p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all text-xs"
        >
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              💻 {d.name}
            </option>
          ))}
          <option value="add_new">➕ Connect New VS Code Tunnel...</option>
        </select>
      </div>

      {isDialogOpen && (
        <Dialog onBackdrop={() => setIsDialogOpen(false)} onClose={() => setIsDialogOpen(false)}>
          <DialogTitle>Connect Local Device</DialogTitle>
          <DialogDescription>
            Enter the secure tunnel URL provided by your local VS Code or Bolt companion app. This will allow the AI to
            execute code and modify files directly on your Mac or Linux machine.
          </DialogDescription>
          <div className="flex flex-col gap-4 mt-4">
            <input
              type="text"
              placeholder="e.g. https://my-tunnel.loca.lt"
              value={newTunnelUrl}
              onChange={(e) => setNewTunnelUrl(e.target.value)}
              className="p-2 rounded-md border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary w-full"
            />
            <div className="flex gap-2 justify-end">
              <DialogButton type="secondary" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </DialogButton>
              <DialogButton type="primary" onClick={() => newTunnelUrl && handleAddTunnel()}>
                Connect
              </DialogButton>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
