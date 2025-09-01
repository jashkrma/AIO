import { useState, useEffect, useCallback } from 'react';
import type { Model, Message, Settings } from '../types';

const API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS_ENDPOINT = 'https://openrouter.ai/api/v1/models';

export const useOpenRouter = () => {
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENROUTER_API_KEY || '');
    const [currentModel, setCurrentModel] = useState<Model | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [models, setModels] = useState<Model[]>([]);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [settings, setSettings] = useState<Settings>({
        showNewBadge: true,
        autoScroll: true,
        showTyping: true,
        exportFormat: 'json'
    });
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);

    // Load settings from localStorage
    useEffect(() => {
        const savedApiKey = localStorage.getItem('openrouter_api_key');
        const savedSettings = localStorage.getItem('openrouter_settings');

        if (savedApiKey) {
            setApiKey(savedApiKey);
        }

        if (savedSettings) {
            try {
                setSettings(JSON.parse(savedSettings));
            } catch (e) {
                console.error('Failed to parse saved settings:', e);
            }
        }
    }, []);

    // Clear cached models to force refresh with only free models
    useEffect(() => {
        localStorage.removeItem('openrouter_models');
    }, []);

    // Save settings to localStorage
    const saveSettings = useCallback(() => {
        localStorage.setItem('openrouter_api_key', apiKey);
        localStorage.setItem('openrouter_settings', JSON.stringify(settings));
    }, [apiKey, settings]);

    // Send message to AIO.ai API
    const sendMessage = useCallback(async (content: string) => {
        const effectiveApiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;

        if (!effectiveApiKey || !currentModel) {
            alert('Please set your AIO.ai API key in settings and select a model.');
            return;
        }

        setIsLoading(true);

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date(),
            model: currentModel.name
        };

        setMessages(prev => [...prev, userMessage]);

        try {
            let response;
            let data;

            // Check if current model supports image generation or multimodal
            if (currentModel.type === 'image_generation' || currentModel.type === 'multimodal') {
                // Use standard chat completion endpoint with image generation prompt
                response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${effectiveApiKey}`,
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'AIO.ai Complete'
                    },
                    body: JSON.stringify({
                        model: currentModel.model_id,
                        messages: [
                            {
                                role: 'user',
                                content: `Create a highly detailed description of: ${content}. 

Please provide:
1. A vivid, detailed description of the scene
2. Color palette and lighting details
3. Atmospheric elements and mood
4. Specific visual elements and composition

Make it so detailed that someone could visualize and recreate this image from your description alone.`
                            }
                        ],
                        temperature: 0.8,
                        max_tokens: 1500
                    })
                });

                if (!response.ok) {
                    throw new Error(`Image generation failed: ${response.status}`);
                }

                data = await response.json();

                // Handle image generation response
                let assistantContent = `🎨 **Detailed Image Description:**\n\n`;
                const responseText = data.choices[0].message.content;

                // Check if response contains an image URL or base64 data
                if (responseText.includes('http') && (responseText.includes('.jpg') || responseText.includes('.png') || responseText.includes('.webp'))) {
                    // Extract image URL from response
                    const urlMatch = responseText.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|webp))/i);
                    if (urlMatch) {
                        assistantContent += `![Generated Image](${urlMatch[1]})\n\n`;
                    } else {
                        assistantContent += responseText;
                    }
                } else if (responseText.includes('data:image')) {
                    // Handle base64 encoded images
                    const base64Match = responseText.match(/data:image\/[^;]+;base64,[^\s]+/);
                    if (base64Match) {
                        assistantContent += `![Generated Image](${base64Match[0]})\n\n`;
                    } else {
                        assistantContent += responseText;
                    }
                } else {
                    // Format the detailed description nicely
                    assistantContent += responseText;
                    assistantContent += `\n\n---\n*This model provides detailed text descriptions. For actual image generation, consider using dedicated image generation services like DALL-E, Midjourney, or Stable Diffusion.*`;
                }

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: assistantContent,
                    timestamp: new Date(),
                    model: currentModel.name
                };

                setMessages(prev => [...prev, assistantMessage]);
            } else {
                // Standard chat completion
                response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${effectiveApiKey}`,
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'AIO.ai Complete'
                    },
                    body: JSON.stringify({
                        model: currentModel.model_id,
                        messages: [
                            ...messages.map(msg => ({
                                role: msg.role,
                                content: msg.content
                            })),
                            { role: 'user', content }
                        ]
                    })
                });

                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status}`);
                }

                data = await response.json();
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.choices[0].message.content,
                    timestamp: new Date(),
                    model: currentModel.name
                };

                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
                timestamp: new Date(),
                model: currentModel.name
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, currentModel, messages]);

    // Clear chat
    const clearChat = useCallback(() => {
        setMessages([]);
    }, []);

    // Export chat
    const exportChat = useCallback(() => {
        const data = {
            messages,
            model: currentModel?.name,
            timestamp: new Date().toISOString(),
            settings
        };

        let content: string;
        let filename: string;
        let mimeType: string;

        switch (settings.exportFormat) {
            case 'json':
                content = JSON.stringify(data, null, 2);
                filename = 'chat-export.json';
                mimeType = 'application/json';
                break;
            case 'txt':
                content = messages.map(msg =>
                    `[${msg.timestamp.toLocaleString()}] ${msg.role.toUpperCase()}: ${msg.content}`
                ).join('\n\n');
                filename = 'chat-export.txt';
                mimeType = 'text/plain';
                break;
            case 'csv':
                content = 'Timestamp,Role,Content,Model\n' +
                    messages.map(msg =>
                        `"${msg.timestamp.toISOString()}","${msg.role}","${msg.content.replace(/"/g, '""')}","${msg.model || ''}"`
                    ).join('\n');
                filename = 'chat-export.csv';
                mimeType = 'text/csv';
                break;
            default:
                return;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [messages, currentModel, settings]);

    // Reset settings
    const resetSettings = useCallback(() => {
        const defaultSettings: Settings = {
            showNewBadge: true,
            autoScroll: true,
            showTyping: true,
            exportFormat: 'json'
        };
        setSettings(defaultSettings);
        setApiKey('');
        localStorage.removeItem('openrouter_api_key');
        localStorage.removeItem('openrouter_settings');
    }, []);

    // Fetch models from AIO.ai API
    const fetchModelsFromAPI = useCallback(async () => {
        try {
            const response = await fetch(MODELS_ENDPOINT);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Transform API response to our Model format and filter only FREE models
            const apiModels: Model[] = data.data
                .filter((model: { id: string }) => model.id.includes(':free')) // Only include free models
                .map((model: { id: string; name?: string; provider?: string; context_length?: number; category?: string; parameters?: string; description?: string; type?: string }) => {
                    const provider = model.provider || 'Unknown';

                    return {
                        name: model.name || model.id,
                        model_id: model.id,
                        provider: provider,
                        context_length: model.context_length?.toString() || 'Unknown',
                        category: model.category || 'General',
                        parameters: model.parameters || 'Unknown',
                        description: model.description || '',
                        type: model.type || 'text',
                        isNew: false
                    };
                });

            // Cache the models in localStorage
            localStorage.setItem('openrouter_models', JSON.stringify({
                models: apiModels,
                timestamp: Date.now()
            }));

            setModels(apiModels);
        } catch (error) {
            console.error('Failed to fetch models from AIO.ai:', error);
            // Fall back to cached models
            const cached = localStorage.getItem('openrouter_models');
            if (cached) {
                try {
                    const { models: cachedModels } = JSON.parse(cached);
                    setModels(cachedModels);
                } catch {
                    setModels([]);
                }
            } else {
                setModels([]);
            }
        } finally {
            setModelsLoading(false);
        }
    }, []);

    // Load models on mount
    useEffect(() => {
        const loadModels = async () => {
            // Check for cached models first
            const cached = localStorage.getItem('openrouter_models');
            if (cached) {
                try {
                    const { models: cachedModels, timestamp } = JSON.parse(cached);
                    // Use cached models if they're less than 24 hours old
                    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                        setModels(cachedModels);
                        setModelsLoading(false);
                        return;
                    }
                } catch {
                    // If parsing fails, continue to fetch
                }
            }

            // Fetch fresh models
            await fetchModelsFromAPI();
        };

        loadModels();
    }, [fetchModelsFromAPI]);

    // Function to manually refresh models
    const refreshModels = useCallback(() => {
        setModelsLoading(true);
        fetchModelsFromAPI();
    }, [fetchModelsFromAPI]);

    return {
        // State
        apiKey,
        currentModel,
        messages,
        isLoading,
        settings,
        settingsModalOpen,
        models,
        modelsLoading,

        // Actions
        setApiKey,
        setCurrentModel,
        setSettings,
        setSettingsModalOpen,
        sendMessage,
        clearChat,
        exportChat,
        saveSettings,
        resetSettings,
        refreshModels,

        // Data
        allModels: models
    };
};
