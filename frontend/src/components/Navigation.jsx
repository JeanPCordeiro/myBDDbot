import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Settings, Home, Users, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from './theme-provider';
import { useConfig } from '../contexts/ConfigContext';

const Navigation = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { config } = useConfig();

  const navItems = [
    {
      path: '/',
      label: 'Accueil',
      icon: Home
    },
    {
      path: '/sessions',
      label: 'Sessions',
      icon: Users
    },
    {
      path: '/config',
      label: 'Configuration',
      icon: Settings
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">BDD Bot</span>
            </Link>
            
            {/* Indicateur de statut OpenAI */}
            <div className="flex items-center space-x-2">
              <div 
                className={`h-2 w-2 rounded-full ${
                  config.openai.configured ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {config.openai.configured ? 'OpenAI Configuré' : 'OpenAI Non Configuré'}
              </span>
            </div>
          </div>

          {/* Navigation principale */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link to={item.path} className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="sr-only">Changer le thème</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

