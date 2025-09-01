import React, { useState } from 'react';
import { Button } from './ui/button';
import { Settings, Bot, Activity } from 'lucide-react';
import ServicesStatusModal from './ServicesStatusModal';
import type { Model } from '../types';

interface HeaderProps {
    onSettingsClick: () => void;
    models: Model[];
    apiKey: string;
}

const Header: React.FC<HeaderProps> = ({
    onSettingsClick,
    models,
    apiKey
}) => {
    const [statusModalOpen, setStatusModalOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4">
                    <div className="flex h-14 items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center space-x-2">
                            <Bot className="h-6 w-6" />
                            <span className="font-bold">AIO.ai</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStatusModalOpen(true)}
                                className="h-8 w-8 p-0"
                                title="Services Status"
                            >
                                <Activity className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onSettingsClick}
                                className="h-8 w-8 p-0"
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <ServicesStatusModal
                isOpen={statusModalOpen}
                onClose={() => setStatusModalOpen(false)}
                models={models}
                apiKey={apiKey}
            />
        </>
    );
};

export default Header;
