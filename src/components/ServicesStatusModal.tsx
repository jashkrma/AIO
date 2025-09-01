import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { X, CheckCircle, XCircle, Loader2, Activity, AlertTriangle } from 'lucide-react';
import type { Model } from '../types';

interface StatusCheckResult {
    model: Model;
    status: 'checking' | 'success' | 'error';
    responseTime?: number;
    error?: string;
}

interface ServicesStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    models: Model[];
    apiKey: string;
}

const ServicesStatusModal: React.FC<ServicesStatusModalProps> = ({
    isOpen,
    onClose,
    models,
    apiKey
}) => {
    const [statusResults, setStatusResults] = useState<StatusCheckResult[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [overallStatus, setOverallStatus] = useState<'checking' | 'healthy' | 'degraded' | 'down'>('checking');
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    const checkModelStatus = useCallback(async (model: Model): Promise<StatusCheckResult> => {
        const startTime = Date.now();
        const timeout = 10000; // 10 second timeout

        try {
            const effectiveApiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;

            if (!effectiveApiKey) {
                return {
                    model,
                    status: 'error',
                    error: 'No API key configured'
                };
            }

            // Test the model with a simple request
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${effectiveApiKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'AIO.ai Status Check'
                },
                body: JSON.stringify({
                    model: model.model_id,
                    messages: [
                        {
                            role: 'user',
                            content: 'Hi'
                        }
                    ],
                    max_tokens: 1, // Even lighter - just 1 token
                    temperature: 0
                }),
                signal: AbortSignal.timeout(timeout)
            });

            const responseTime = Date.now() - startTime;

            if (response.ok) {
                return {
                    model,
                    status: 'success',
                    responseTime
                };
            } else if (response.status === 429) {
                throw new Error(`429: Rate limited`);
            } else if (response.status === 401) {
                throw new Error(`401: Invalid API key`);
            } else if (response.status === 403) {
                throw new Error(`403: Forbidden`);
            } else {
                return {
                    model,
                    status: 'error',
                    responseTime,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }
        } catch (error) {
            const responseTime = Date.now() - startTime;

            if (error instanceof Error) {
                if (error.message.includes('429')) {
                    throw error; // Re-throw rate limit errors for special handling
                } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
                    return {
                        model,
                        status: 'error',
                        responseTime,
                        error: 'Request timeout (10s)'
                    };
                } else if (error.name === 'AbortError') {
                    return {
                        model,
                        status: 'error',
                        responseTime,
                        error: 'Request cancelled'
                    };
                }
            }

            return {
                model,
                status: 'error',
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, [apiKey]);

    const checkAllServices = useCallback(async () => {
        const controller = new AbortController();
        setAbortController(controller);
        setIsChecking(true);
        setOverallStatus('checking');
        setStatusResults([]);

        const results: StatusCheckResult[] = [];
        const concurrencyLimit = 3; // Check 3 models simultaneously
        const delayBetweenBatches = 500; // 500ms between batches

        try {
            // Process models in batches with controlled concurrency
            for (let i = 0; i < models.length; i += concurrencyLimit) {
                if (controller.signal.aborted) break;

                const batch = models.slice(i, i + concurrencyLimit);

                // Process batch concurrently
                const batchPromises = batch.map(async (model) => {
                    if (controller.signal.aborted) return null;

                    let result: StatusCheckResult;
                    let retryCount = 0;
                    const maxRetries = 2; // Reduced from 3

                    while (retryCount <= maxRetries && !controller.signal.aborted) {
                        try {
                            result = await checkModelStatus(model);
                            break; // Success, exit retry loop
                        } catch (error) {
                            if (error instanceof Error && error.message.includes('429') && retryCount < maxRetries) {
                                // Rate limited - shorter backoff: 2s, 5s
                                const backoffTime = (retryCount + 1) * 2000;
                                console.log(`Rate limited for ${model.name}, retrying in ${backoffTime / 1000}s...`);
                                await new Promise(resolve => setTimeout(resolve, backoffTime));
                                retryCount++;
                                continue;
                            } else {
                                // Other error or max retries reached
                                result = {
                                    model,
                                    status: 'error',
                                    error: error instanceof Error ? error.message : 'Unknown error'
                                };
                                break;
                            }
                        }
                    }

                    return result!;
                });

                // Wait for all models in this batch to complete
                const batchResults = await Promise.all(batchPromises);
                const validResults = batchResults.filter(result => result !== null) as StatusCheckResult[];
                results.push(...validResults);
                setStatusResults([...results]);

                // Small delay between batches (except for the last batch)
                if (i + concurrencyLimit < models.length && !controller.signal.aborted) {
                    await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                }
            }

            if (!controller.signal.aborted) {
                // Calculate overall status
                const successCount = results.filter(r => r.status === 'success').length;
                const totalCount = results.length;

                if (successCount === totalCount) {
                    setOverallStatus('healthy');
                } else if (successCount > totalCount * 0.5) {
                    setOverallStatus('degraded');
                } else {
                    setOverallStatus('down');
                }
            }
        } catch (error) {
            console.error('Error during service checking:', error);
        } finally {
            setIsChecking(false);
            setAbortController(null);
        }
    }, [models, checkModelStatus]);

    const cancelChecking = useCallback(() => {
        if (abortController) {
            abortController.abort();
            setIsChecking(false);
            setAbortController(null);
        }
    }, [abortController]);

    useEffect(() => {
        if (isOpen && models.length > 0) {
            checkAllServices();
        }
    }, [isOpen, models, checkAllServices]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'checking':
                return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
        }
    };

    const getOverallStatusColor = () => {
        switch (overallStatus) {
            case 'healthy':
                return 'text-green-500';
            case 'degraded':
                return 'text-yellow-500';
            case 'down':
                return 'text-red-500';
            default:
                return 'text-blue-500';
        }
    };

    const getOverallStatusText = () => {
        switch (overallStatus) {
            case 'healthy':
                return 'All Systems Operational';
            case 'degraded':
                return 'Partial Service Degradation';
            case 'down':
                return 'Major Service Outage';
            default:
                return 'Checking Services...';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-lg)] max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <Activity className="h-6 w-6" />
                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)]">
                                    Services Status
                                </h3>
                                <p className={`text-sm ${getOverallStatusColor()}`}>
                                    {getOverallStatusText()}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-[var(--color-text-secondary)]">
                            {statusResults.length} of {models.length} services checked
                            {isChecking && statusResults.length > 0 && (
                                <span className="ml-2">
                                    (~{Math.ceil((models.length - statusResults.length) * 3.3)}s remaining)
                                </span>
                            )}
                        </div>
                        <Button
                            onClick={isChecking ? cancelChecking : checkAllServices}
                            disabled={!isChecking && models.length === 0}
                            size="sm"
                            variant={isChecking ? "destructive" : "default"}
                        >
                            {isChecking ? (
                                <>
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </>
                            ) : (
                                <>
                                    <Activity className="w-4 h-4 mr-2" />
                                    Refresh Status
                                </>
                            )}
                        </Button>
                    </div>

                    {isChecking && (
                        <div className="mb-4">
                            <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                                <div
                                    className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(statusResults.length / models.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {statusResults.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin mr-3" />
                                <span className="text-[var(--color-text-secondary)]">
                                    {isChecking ? 'Checking services...' : 'No services to check'}
                                </span>
                            </div>
                        ) : (
                            statusResults.map((result) => (
                                <div
                                    key={result.model.model_id}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)]/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-[var(--color-text)] truncate">
                                                    {result.model.name}
                                                </span>
                                                {getStatusIcon(result.status)}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                                <span>{result.model.provider}</span>
                                                {result.responseTime && (
                                                    <span>• {result.responseTime}ms</span>
                                                )}
                                            </div>
                                            {result.error && (
                                                <div className="text-xs text-red-500 mt-1 truncate">
                                                    {result.error}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                        <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Operational</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <span>Down</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Loader2 className="w-4 h-4 text-blue-500" />
                                    <span>Checking</span>
                                </div>
                            </div>
                            <div>
                                Last updated: {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServicesStatusModal;
