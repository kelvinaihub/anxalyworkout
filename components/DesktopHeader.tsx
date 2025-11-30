import React from 'react';
import { Tab, CreateView } from '../types.ts';
// FIX: Consolidated and corrected the icon imports.
import { LogoIcon, HomeIcon, DumbbellIcon, SparklesIcon, PlayCircleIcon, PlusCircleIcon, MessagesIcon, BellIcon, MagnifyingGlassIcon } from './Icons.tsx';

interface DesktopHeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onOpenCreateModal: (view: CreateView) => void;
}

const DesktopHeader: React.FC<DesktopHeaderProps> = ({ activeTab, onTabChange, onOpenCreateModal }) => {
  return (
    <header className="sticky top-0 z-30 bg-dark-card shadow-md flex items-center justify-between px-4 h-14">
        <div className="flex items-center space-x-2">
            <button onClick={() => onTabChange(Tab.Feed)} className="flex items-center space-x-2 group" aria-label="Home">
                <LogoIcon className="w-10 h-10 transition-transform group-hover:rotate-12"/>
            </button>
            <div className="hidden md:flex relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary"/>
                <input type="text" placeholder="Search KelvinFit" className="bg-dark-surface rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none w-60" aria-label="Search"/>
            </div>
        </div>
        <nav className="hidden md:flex items-center space-x-2">
            <button 
                onClick={() => onTabChange(Tab.Feed)} 
                aria-label="Feed"
                className={`h-12 w-24 flex items-center justify-center ${activeTab === Tab.Feed ? 'border-b-4 border-brand-primary text-brand-primary' : 'text-dark-text-secondary hover:bg-dark-surface rounded-lg'}`}>
                <HomeIcon className="w-7 h-7"/>
            </button>
            <button 
                onClick={() => onTabChange(Tab.Workout)} 
                aria-label="Workout"
                className={`h-12 w-24 flex items-center justify-center ${activeTab === Tab.Workout ? 'border-b-4 border-brand-primary text-brand-primary' : 'text-dark-text-secondary hover:bg-dark-surface rounded-lg'}`}>
                <DumbbellIcon className="w-7 h-7"/>
            </button>
            <button 
                onClick={() => onTabChange(Tab.AI)} 
                aria-label="AI Coach"
                className={`h-12 w-24 flex items-center justify-center ${activeTab === Tab.AI ? 'border-b-4 border-brand-primary text-brand-primary' : 'text-dark-text-secondary hover:bg-dark-surface rounded-lg'}`}>
                <SparklesIcon className="w-7 h-7"/>
            </button>
            <button 
                onClick={() => onTabChange(Tab.Videos)} 
                aria-label="Videos"
                className={`h-12 w-24 flex items-center justify-center ${activeTab === Tab.Videos ? 'border-b-4 border-brand-primary text-brand-primary' : 'text-dark-text-secondary hover:bg-dark-surface rounded-lg'}`}>
                <PlayCircleIcon className="w-7 h-7"/>
            </button>
        </nav>
        <div className="flex items-center space-x-2">
            <button onClick={() => onOpenCreateModal('menu')} className="bg-dark-surface w-10 h-10 rounded-full flex items-center justify-center text-dark-text hover:bg-gray-600" aria-label="Create"><PlusCircleIcon className="w-6 h-6"/></button>
            <button 
                onClick={() => onTabChange(Tab.Messages)} 
                aria-label="Messages"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === Tab.Messages ? 'bg-brand-primary/20 text-brand-primary' : 'bg-dark-surface text-dark-text hover:bg-gray-600'}`}>
                <MessagesIcon className="w-6 h-6"/>
            </button>
            <button onClick={() => onTabChange(Tab.Notifications)} className="bg-dark-surface w-10 h-10 rounded-full flex items-center justify-center text-dark-text hover:bg-gray-600" aria-label="Notifications"><BellIcon className="w-6 h-6"/></button>
        </div>
    </header>
  );
};

export default DesktopHeader;