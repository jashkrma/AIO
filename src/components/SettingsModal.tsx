import React, { useState } from 'react';
import { Button } from './ui/button';
import { X, Eye, EyeOff } from 'lucide-react';
import type { Settings, Model } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onSettingsChange: (settings: Settings) => void;
    apiKey: string;
    onApiKeyChange: (apiKey: string) => void;
    onResetSettings: () => void;
    onSaveSettings: () => void;
    currentModel: Model | null;
    allModels: Model[];
    modelsLoading?: boolean;
    onRefreshModels?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onSettingsChange,
    apiKey,
    onApiKeyChange,
    onSaveSettings,
    currentModel,
    allModels,
    modelsLoading = false,
    onRefreshModels
}) => {
    const [showApiKey, setShowApiKey] = useState(false);
    const [localSettings] = useState(settings);
    const [localApiKey, setLocalApiKey] = useState(apiKey);

    const handleSave = () => {
        onSettingsChange(localSettings);
        onApiKeyChange(localApiKey);
        onSaveSettings();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-lg)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-[var(--color-text)]">
                            Settings
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="api-key-input" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                OpenRouter API Key
                                {!localApiKey && <span className="text-xs text-green-500 ml-2">(Using default key)</span>}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    id="api-key-input"
                                    className="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
                                    placeholder="sk-or-v1-... (leave empty to use default)"
                                    value={localApiKey}
                                    onChange={(e) => setLocalApiKey(e.target.value)}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="h-10 w-10 p-0"
                                >
                                    {showApiKey ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                {!localApiKey ? (
                                    <>
                                        Using default API key for demo.{' '}
                                        <a
                                            href="https://openrouter.ai/keys"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[var(--color-primary)] hover:underline"
                                        >
                                            Get your own key
                                        </a>{' '}
                                    </>
                                ) : (
                                    <>
                                        Get your API key:{' '}
                                        <a
                                            href="https://openrouter.ai/keys"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[var(--color-primary)] hover:underline"
                                        >
                                            Click here
                                        </a>
                                    </>
                                )}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                Current Model
                            </label>
                            <div className="flex items-center gap-3 p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg">
                                <div className="flex-1">
                                    <div className="font-medium text-[var(--color-text)]">
                                        {currentModel?.name || 'No model selected'}
                                    </div>
                                    <div className="text-sm text-[var(--color-text-secondary)]">
                                        {currentModel?.provider || ''}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-[var(--color-bg-1)] to-[var(--color-bg-2)] p-4 rounded-lg border border-[var(--color-border)]">
                            <h4 className="text-lg font-semibold text-[var(--color-text)] mb-3">
                                Platform Statistics
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-[var(--color-primary)]">{allModels.length}</div>
                                    <div className="text-sm text-[var(--color-text-secondary)]">Available Models</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-[var(--color-primary)]">{allModels.filter(m => m.isNew).length}</div>
                                    <div className="text-sm text-[var(--color-text-secondary)]">New Releases</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-[var(--color-primary)]">{Math.max(...allModels.map(m => parseInt(m.parameters.replace(/[^0-9]/g, '')) || 0)) || 0}B</div>
                                    <div className="text-sm text-[var(--color-text-secondary)]">Max Parameters</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-[var(--color-primary)]">{Math.max(...allModels.map(m => parseInt(m.context_length.replace(/[^0-9]/g, '')) || 0)) || 0}K</div>
                                    <div className="text-sm text-[var(--color-text-secondary)]">Max Context</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-semibold text-[var(--color-text)]">
                                    Available Models
                                </h4>
                                <div className="flex items-center gap-2">
                                    {modelsLoading && (
                                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                            <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                                            Loading...
                                        </div>
                                    )}
                                    {onRefreshModels && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={onRefreshModels}
                                            disabled={modelsLoading}
                                            className="h-8 px-3"
                                        >
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Refresh
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {allModels.length === 0 ? (
                                    <div className="text-center py-4 text-[var(--color-text-secondary)]">
                                        No models available
                                    </div>
                                ) : (
                                    allModels.map((model) => (
                                        <div
                                            key={model.model_id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${currentModel?.model_id === model.model_id
                                                ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]'
                                                : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-[var(--color-text)] truncate">
                                                            {model.name}
                                                        </span>
                                                        {model.isNew && (
                                                            <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                                                                NEW
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-[var(--color-text-secondary)]">
                                                        {model.provider} • {model.parameters} • {model.context_length} context
                                                    </div>
                                                    {model.description && (
                                                        <div className="text-xs text-[var(--color-text-secondary)] mt-1 truncate">
                                                            {model.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                    Models are automatically updated from Openrouter API. Last updated: {new Date().toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[var(--color-border)]">
                        <Button
                            onClick={handleSave}
                        >
                            Save Settings
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
