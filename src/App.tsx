import Header from './components/Header';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import { useOpenRouter } from './hooks/useOpenRouter';
import type { Settings } from './types';

function App() {
  const {
    apiKey,
    currentModel,
    messages,
    isLoading,
    settings,
    settingsModalOpen,
    modelsLoading,
    setApiKey,
    setCurrentModel,
    setSettings,
    setSettingsModalOpen,
    sendMessage,
    saveSettings,
    resetSettings,
    refreshModels,
    allModels
  } = useOpenRouter();

  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  const handleSaveSettings = () => {
    saveSettings();
    setSettingsModalOpen(false);
  };

  return (
    <div className="app">
      <Header
        onSettingsClick={() => setSettingsModalOpen(true)}
        models={allModels}
        apiKey={apiKey}
      />

      <div className="app-main">
        <ChatArea
          messages={messages}
          currentModel={currentModel}
          onSendMessage={sendMessage}
          onModelSelect={setCurrentModel}
          isLoading={isLoading}
          allModels={allModels}
          modelsLoading={modelsLoading}
        />
      </div>

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        onResetSettings={resetSettings}
        onSaveSettings={handleSaveSettings}
        currentModel={currentModel}
        allModels={allModels}
        modelsLoading={modelsLoading}
        onRefreshModels={refreshModels}
      />
    </div>
  );
}

export default App;
