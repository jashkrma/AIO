export interface Model {
    name: string;
    model_id: string;
    provider: string;
    context_length: string;
    isNew?: boolean;
    type?: string;
    category: string;
    parameters: string;
    description?: string;
    logo?: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    model?: string;
}

export interface Settings {
    showNewBadge: boolean;
    autoScroll: boolean;
    showTyping: boolean;
    exportFormat: 'json' | 'txt' | 'csv';
}
