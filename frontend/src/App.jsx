import React from 'react';
import { useDeviceId } from './hooks/useDeviceId';
import { MapView } from './components/MapView';

function App() {
  const deviceId = useDeviceId();

  return (
    <div className="app-container">
      <MapView deviceId={deviceId} />
    </div>
  );
}

export default App;
