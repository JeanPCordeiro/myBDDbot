import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    openai: {
      apiKey: '',
      orgId: '',
      model: 'gpt-4-turbo',
      configured: false
    },
    bot: {
      style: 'professional',
      language: 'fr',
      detailLevel: 'intermediate'
    },
    api: {
      baseUrl: 'https://3001-jeanpcordeiro-mybddbot-41t8nzs1c1e.ws-eu120.gitpod.io/api'
    }
  });

  const [loading, setLoading] = useState(false);

  // Charger la configuration depuis localStorage au démarrage
  useEffect(() => {
    const savedConfig = localStorage.getItem('bdd-bot-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsedConfig }));
      } catch (error) {
        console.error('Error parsing saved config:', error);
      }
    }
    
    // Vérifier la configuration OpenAI au démarrage
    checkOpenAIConfig();
  }, []);

  // Sauvegarder la configuration dans localStorage
  const saveConfig = (newConfig) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem('bdd-bot-config', JSON.stringify(updatedConfig));
  };

  // Tester la connexion OpenAI
  const testOpenAIConnection = async (apiKey = null, orgId = null) => {
    setLoading(true);
    try {
      const response = await fetch(`${config.api.baseUrl}/config/openai/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey || config.openai.apiKey,
          org_id: orgId || config.openai.orgId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Connexion OpenAI réussie !');
        return true;
      } else {
        toast.error(`Erreur de connexion OpenAI: ${result.error || result.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error testing OpenAI connection:', error);
      toast.error('Erreur lors du test de connexion OpenAI');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Vérifier la configuration OpenAI
  const checkOpenAIConfig = async () => {
    try {
      const response = await fetch(`${config.api.baseUrl}/config/openai`);
      const result = await response.json();
      
      if (result.success) {
        setConfig(prev => ({
          ...prev,
          openai: {
            ...prev.openai,
            configured: result.data.configured,
            model: result.data.model,
          }
        }));
      }
    } catch (error) {
      console.error('Error checking OpenAI config:', error);
    }
  };

  // Configurer OpenAI
  const configureOpenAI = async (apiKey, orgId = '') => {
    const isValid = await testOpenAIConnection(apiKey, orgId);
    
    if (isValid) {
      saveConfig({
        openai: {
          ...config.openai,
          apiKey,
          orgId,
          configured: true
        }
      });
      toast.success('Configuration OpenAI sauvegardée !');
      return true;
    }
    
    return false;
  };

  // Configurer le bot
  const configureBotSettings = (settings) => {
    saveConfig({
      bot: {
        ...config.bot,
        ...settings
      }
    });
    toast.success('Paramètres du bot mis à jour !');
  };

  // Réinitialiser la configuration
  const resetConfig = () => {
    const defaultConfig = {
      openai: {
        apiKey: '',
        orgId: '',
        model: 'gpt-4-turbo',
        configured: false
      },
      bot: {
        style: 'professional',
        language: 'fr',
        detailLevel: 'intermediate'
      },
      api: {
        baseUrl: 'https://3001-jeanpcordeiro-mybddbot-41t8nzs1c1e.ws-eu120.gitpod.io/api'
      }
    };
    
    setConfig(defaultConfig);
    localStorage.removeItem('bdd-bot-config');
    toast.success('Configuration réinitialisée !');
  };

  // Exporter la configuration
  const exportConfig = () => {
    const exportData = {
      ...config,
      openai: {
        ...config.openai,
        apiKey: '' // Ne pas exporter la clé API pour des raisons de sécurité
      },
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bdd-bot-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Configuration exportée !');
  };

  // Importer la configuration
  const importConfig = (configData) => {
    try {
      const { exportDate, version, ...importedConfig } = configData;
      saveConfig(importedConfig);
      toast.success('Configuration importée avec succès !');
      return true;
    } catch (error) {
      console.error('Error importing config:', error);
      toast.error('Erreur lors de l\'importation de la configuration');
      return false;
    }
  };

  const value = {
    config,
    loading,
    saveConfig,
    testOpenAIConnection,
    checkOpenAIConfig,
    configureOpenAI,
    configureBotSettings,
    resetConfig,
    exportConfig,
    importConfig
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

