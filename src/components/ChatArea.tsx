import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Button } from './ui/button';
import { Send, Loader2, Brain, Bot } from 'lucide-react';
import type { Model, Message } from '../types';

interface ChatAreaProps {
    messages: Message[];
    currentModel: Model | null;
    onSendMessage: (content: string) => void;
    onModelSelect: (model: Model) => void;
    isLoading: boolean;
    allModels: Model[];
    modelsLoading?: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({
    messages,
    currentModel,
    onSendMessage,
    onModelSelect,
    isLoading,
    allModels,
    modelsLoading = false
}) => {
    const [inputValue, setInputValue] = useState('');
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [inputValue]);

    const handleModelSelect = (model: Model) => {
        onModelSelect(model);
        setShowModelDropdown(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowModelDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <main className="flex-1 flex flex-col relative w-full">
            <div className="flex-1 overflow-y-auto w-full">
                <div className="w-full max-w-none">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        {messages.length === 0 ? (
                            <div className="welcome-screen flex items-center justify-center min-h-[60vh]">
                                <div className="welcome-content text-center max-w-2xl w-full">
                                    <div className="welcome-header mb-8">
                                        <div className="welcome-logo mb-6">
                                            <div className="flex items-center space-x-2">
                                                <Bot className="h-8 w-8" />
                                            </div>
                                        </div>
                                        <h2 className="welcome-title text-white text-3xl font-bold mb-4">
                                            What can I help you with?
                                        </h2>
                                        <p className="welcome-subtitle text-muted-foreground text-lg leading-relaxed">
                                            Ask me anything or describe an image you'd like me to create. I have access to{' '}
                                            <span className="font-semibold text-primary">47 different AI models</span>{' '}
                                            from leading providers.
                                        </p>
                                    </div>

                                    <div className="suggestions">
                                        <div className="suggestions-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <button className="suggestion-card bg-card border border-border hover:bg-accent hover:text-accent-foreground transition-colors p-4 rounded-lg text-left" onClick={() => onSendMessage("Explain quantum computing in simple terms")}>
                                                <div className="suggestion-icon text-2xl font-bold text-blue-500 mb-2">?</div>
                                                <div className="suggestion-content">
                                                    <h3 className="suggestion-title text-card-foreground font-semibold mb-1">Explain quantum computing</h3>
                                                    <p className="suggestion-description text-muted-foreground text-sm">Break down complex topics simply</p>
                                                </div>
                                            </button>

                                            <button className="suggestion-card bg-card border border-border hover:bg-accent hover:text-accent-foreground transition-colors p-4 rounded-lg text-left" onClick={() => onSendMessage("Create a beautiful sunset over mountains")}>
                                                <div className="suggestion-icon text-2xl font-bold text-purple-500 mb-2">✨</div>
                                                <div className="suggestion-content">
                                                    <h3 className="suggestion-title text-card-foreground font-semibold mb-1">Generate an image</h3>
                                                    <p className="suggestion-description text-muted-foreground text-sm">Describe any scene or artwork</p>
                                                </div>
                                            </button>

                                            <button className="suggestion-card bg-card border border-border hover:bg-accent hover:text-accent-foreground transition-colors p-4 rounded-lg text-left" onClick={() => onSendMessage("Write a Python function to calculate fibonacci numbers")}>
                                                <div className="suggestion-icon text-2xl font-bold text-green-500 mb-2">&lt;/&gt;</div>
                                                <div className="suggestion-content">
                                                    <h3 className="suggestion-title text-card-foreground font-semibold mb-1">Code assistance</h3>
                                                    <p className="suggestion-description text-muted-foreground text-sm">Get help with programming</p>
                                                </div>
                                            </button>

                                            <button className="suggestion-card bg-card border border-border hover:bg-accent hover:text-accent-foreground transition-colors p-4 rounded-lg text-left" onClick={() => onSendMessage("What's the latest in AI research?")}>
                                                <div className="suggestion-icon text-2xl font-bold text-orange-500 mb-2">📊</div>
                                                <div className="suggestion-content">
                                                    <h3 className="suggestion-title text-card-foreground font-semibold mb-1">Research & analysis</h3>
                                                    <p className="suggestion-description text-muted-foreground text-sm">Stay updated on current trends</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="welcome-footer mt-8 pt-6 border-t border-border">
                                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                            <span>Built by</span>
                                            <span className="font-semibold text-primary">xAI</span>
                                            <span>•</span>
                                            <span>Powered by AIO.ai</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 pb-32 w-full">
                                {messages.map((message) => (
                                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                                        <div className={`max-w-4xl p-4 rounded-lg ${message.role === 'user'
                                            ? 'bg-primary text-primary-foreground ml-auto'
                                            : 'bg-muted'
                                            }`}>
                                            {message.role === 'user' ? (
                                                <div className="whitespace-pre-wrap text-sm leading-relaxed text-primary-foreground">
                                                    {message.content}
                                                </div>
                                            ) : (
                                                <div className="prose prose-sm max-w-none text-card-foreground">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        rehypePlugins={[rehypeHighlight]}
                                                        components={{
                                                            // Custom styling for markdown elements
                                                            h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-foreground">{children}</h1>,
                                                            h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0 text-foreground">{children}</h2>,
                                                            h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-foreground">{children}</h3>,
                                                            h4: ({ children }) => <h4 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-foreground">{children}</h4>,
                                                            p: ({ children }) => <p className="mb-3 leading-relaxed text-card-foreground">{children}</p>,
                                                            ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1 text-card-foreground">{children}</ul>,
                                                            ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1 text-card-foreground">{children}</ol>,
                                                            li: ({ children }) => <li className="leading-relaxed text-card-foreground">{children}</li>,
                                                            blockquote: ({ children }) => (
                                                                <blockquote className="border-l-4 border-primary pl-4 py-2 my-3 bg-muted rounded-r-lg italic text-card-foreground">
                                                                    {children}
                                                                </blockquote>
                                                            ),
                                                            code: ({ children, ...props }) => {
                                                                const isInline = !props.className && typeof children === 'string' && !children.includes('\n');
                                                                return isInline ? (
                                                                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-card-foreground">
                                                                        {children}
                                                                    </code>
                                                                ) : (
                                                                    <code className="block bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto text-card-foreground">
                                                                        {children}
                                                                    </code>
                                                                );
                                                            },
                                                            pre: ({ children }) => (
                                                                <pre className="bg-muted p-3 rounded-lg overflow-x-auto mb-3 text-sm text-card-foreground">
                                                                    {children}
                                                                </pre>
                                                            ),
                                                            table: ({ children }) => (
                                                                <div className="overflow-x-auto mb-3">
                                                                    <table className="min-w-full border-collapse border border-border rounded-lg">
                                                                        {children}
                                                                    </table>
                                                                </div>
                                                            ),
                                                            th: ({ children }) => (
                                                                <th className="border border-border bg-muted px-3 py-2 text-left font-semibold text-card-foreground">
                                                                    {children}
                                                                </th>
                                                            ),
                                                            td: ({ children }) => (
                                                                <td className="border border-border px-3 py-2 text-card-foreground">
                                                                    {children}
                                                                </td>
                                                            ),
                                                            strong: ({ children }) => <strong className="font-semibold text-card-foreground">{children}</strong>,
                                                            em: ({ children }) => <em className="italic text-card-foreground">{children}</em>,
                                                            hr: () => <hr className="border-border my-6" />,
                                                            img: ({ src, alt, ...props }) => (
                                                                <div className="my-4">
                                                                    <img
                                                                        src={src}
                                                                        alt={alt || 'Generated image'}
                                                                        className="max-w-full h-auto rounded-lg shadow-lg border border-border"
                                                                        style={{ maxHeight: '512px' }}
                                                                        loading="lazy"
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                        }}
                                                                        onLoad={() => {
                                                                            // Image loaded successfully
                                                                        }}
                                                                        {...props}
                                                                    />
                                                                    {alt && (
                                                                        <p className="text-sm text-muted-foreground mt-2 italic text-center">
                                                                            {alt}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ),
                                                        }}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                    {/* Display images from URLs in the message content */}
                                                    {(() => {
                                                        // Improved regex to match various image URL patterns
                                                        const imageUrls = message.content.match(
                                                            /(?:https?:\/\/)?(?:[-\w.])+(?::[0-9]+)?(?:\/[^\s]*)?\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico)(?:\?[;&a-zA-Z0-9%=._-]*)?/gi
                                                        ) || [];

                                                        // Also check for data URLs
                                                        const dataUrls = message.content.match(
                                                            /data:image\/[a-zA-Z]+;base64,[a-zA-Z0-9+/=]+/g
                                                        ) || [];

                                                        const allImageUrls = [...imageUrls, ...dataUrls];

                                                        return allImageUrls.length > 0 ? (
                                                            <div className="mt-4 space-y-3">
                                                                {allImageUrls.map((url, index) => (
                                                                    <div key={index} className="image-container my-4">
                                                                        <img
                                                                            src={url.startsWith('http') ? url : `https://${url}`}
                                                                            alt={`Generated image ${index + 1}`}
                                                                            className="max-w-full h-auto rounded-lg shadow-lg border border-border"
                                                                            style={{ maxHeight: '512px' }}
                                                                            loading="lazy"
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = 'none';
                                                                            }}
                                                                            onLoad={() => {
                                                                                // Image loaded successfully
                                                                            }}
                                                                        />
                                                                        <p className="text-xs text-muted-foreground mt-2 text-center">
                                                                            Generated image
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : null;
                                                    })()}
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center mt-3 text-xs opacity-70 text-muted-foreground">
                                                <span>{message.timestamp.toLocaleTimeString()}</span>
                                                {message.model && (
                                                    <span className="font-medium text-foreground">{message.model}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Inline Thinking Indicator */}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="max-w-4xl p-4 rounded-lg bg-muted">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-100"></div>
                                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-200"></div>
                                                </div>
                                                <span className="text-sm text-muted-foreground font-medium">
                                                    {currentModel ? `${currentModel.name} is thinking...` : 'Thinking...'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Fixed input area at bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
                <div className="w-full max-w-none">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        <div className="flex gap-3 items-end w-full">
                            {/* Input Field with Integrated Model Selector */}
                            <div className="flex-1 relative">
                                <div className="relative">
                                    <textarea
                                        ref={textareaRef}
                                        id="message-input"
                                        placeholder={messages.length === 0 ? "Ask me anything..." : "Continue the conversation..."}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        rows={1}
                                        disabled={isLoading}
                                    />

                                    {/* Model Indicator within Input */}
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-muted border border-border rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:border-ring transition-colors"
                                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                                        disabled={isLoading}
                                        title="Change model"
                                    >
                                        {currentModel ? <Brain className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                                        <span className="hidden sm:inline text-xs truncate max-w-20">
                                            {currentModel?.name || 'Select Model'}
                                        </span>
                                        <svg
                                            className={`w-3 h-3 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Model Dropdown */}
                                {showModelDropdown && (
                                    <div ref={dropdownRef} className="absolute bottom-full right-0 left-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl z-50 mb-2 max-h-60 overflow-hidden flex flex-col">
                                        <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Choose a Model</span>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {modelsLoading ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    <span className="text-sm text-muted-foreground">Loading models...</span>
                                                </div>
                                            ) : allModels.length === 0 ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <span className="text-sm text-muted-foreground">No models available</span>
                                                </div>
                                            ) : (
                                                allModels.map((model) => (
                                                    <button
                                                        key={model.model_id}
                                                        type="button"
                                                        className={`flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors ${currentModel?.model_id === model.model_id ? 'bg-accent text-accent-foreground' : ''}`}
                                                        onClick={() => handleModelSelect(model)}
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-sm font-medium block truncate">{model.name}</span>
                                                                <span className="text-xs text-muted-foreground block">{model.provider}</span>
                                                            </div>
                                                        </div>
                                                        {currentModel?.model_id === model.model_id && (
                                                            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Send Button */}
                            <Button
                                size="lg"
                                onClick={handleSubmit}
                                disabled={!inputValue.trim() || isLoading}
                                className="h-12 px-6"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ChatArea;
