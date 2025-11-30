

import React from 'react';
import { Tab } from '../types.ts';
import { FlameIcon, DumbbellIcon, SparklesIcon, MessagesIcon, UserIcon } from './Icons.tsx';

interface FooterProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const Footer: React.FC<FooterProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { tab: Tab.Feed, icon: FlameIcon, label: 'Feed' },
    { tab: Tab.Workout, icon: DumbbellIcon, label: 'Workout' },
    { tab: Tab.AI, icon: SparklesIcon, label: 'AI' },
    { tab: Tab.Messages, icon: MessagesIcon, label: 'Messages' },
    { tab: Tab.Profile, icon: UserIcon, label: 'Profile' },
  ];

  return (
    <footer className="w-full bg-dark-surface border-t border-gray-700">
      <nav className="flex justify-around items-center h-16">
        {navItems.map(({ tab, icon: Icon, label }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`flex flex-col items-center justify-center w-1/5 transition-colors duration-200 ${isActive ? 'text-brand-primary' : 'text-dark-text-secondary hover:text-white'}`}
            >
              <Icon className="w-7 h-7" />
              <span className={`text-xs mt-1 ${isActive ? 'font-bold' : ''}`}>{label}</span>
            </button>
          );
        })}
      </nav>
    </footer>
  );
};

export default Footer;
