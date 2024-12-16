'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

export default function AdminSettingsPage() {
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    userRegistration: true,
    maxConcurrentUsers: 100
  });

  const handleSettingChange = (key, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">System Settings</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label>Maintenance Mode</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <Button 
                    variant={systemSettings.maintenanceMode ? 'default' : 'outline'}
                    onClick={() => handleSettingChange('maintenanceMode', true)}
                  >
                    Enable
                  </Button>
                  <Button 
                    variant={!systemSettings.maintenanceMode ? 'default' : 'outline'}
                    onClick={() => handleSettingChange('maintenanceMode', false)}
                  >
                    Disable
                  </Button>
                </div>
              </div>

              <div>
                <Label>User Registration</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <Button 
                    variant={systemSettings.userRegistration ? 'default' : 'outline'}
                    onClick={() => handleSettingChange('userRegistration', true)}
                  >
                    Open
                  </Button>
                  <Button 
                    variant={!systemSettings.userRegistration ? 'default' : 'outline'}
                    onClick={() => handleSettingChange('userRegistration', false)}
                  >
                    Closed
                  </Button>
                </div>
              </div>

              <div>
                <Label>Max Concurrent Users</Label>
                <Input 
                  type="number" 
                  value={systemSettings.maxConcurrentUsers}
                  onChange={(e) => handleSettingChange('maxConcurrentUsers', Number(e.target.value))}
                  className="mt-2"
                />
              </div>

              <Button onClick={saveSettings} className="mt-4">
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
