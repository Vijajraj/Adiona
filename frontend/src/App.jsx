import { useDeviceId } from './hooks/useDeviceId';
import { MapView } from './components/MapView';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const deviceId = useDeviceId();

  return (
    <ErrorBoundary>
      <div className="app-container">
        <MapView deviceId={deviceId} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
