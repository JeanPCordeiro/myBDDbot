import React, { useState } from 'react';
import { Eye, EyeOff, TestTube, Save, RotateCcw, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useConfig } from '../contexts/ConfigContext';
import { toast } from 'sonner';

const ConfigPage = () => {
  const { 
    config, 
    loading, 
    configureOpenAI, 
    configureBotSettings, 
    testOpenAIConnection,
    resetConfig,
    exportConfig,
    importConfig
  } = useConfig();

  const [openaiForm, setOpenaiForm] = useState({
    apiKey: '',
    orgId: ''
  });
  
  const [botForm, setBotForm] = useState({
    style: config.bot.style,
    language: config.bot.language,
    detailLevel: config.bot.detailLevel
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleOpenAISubmit = async (e) => {
    e.preventDefault();
    if (!openaiForm.apiKey.trim()) {
      toast.error('La clé API est requise');
      return;
    }

    const success = await configureOpenAI(openaiForm.apiKey, openaiForm.orgId);
    if (success) {
      setOpenaiForm({ apiKey: '', orgId: '' });
    }
  };

  const handleBotSubmit = (e) => {
    e.preventDefault();
    configureBotSettings(botForm);
  };

  const handleTestConnection = async () => {
    if (!openaiForm.apiKey.trim()) {
      toast.error('Veuillez saisir une clé API pour tester');
      return;
    }

    setTesting(true);
    await testOpenAIConnection(openaiForm.apiKey, openaiForm.orgId);
    setTesting(false);
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const configData = JSON.parse(event.target.result);
        importConfig(configData);
      } catch (error) {
        toast.error('Fichier de configuration invalide');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuration</h1>
        <p className="text-muted-foreground">
          Configurez votre application BDD Bot pour une expérience optimale.
        </p>
      </div>

      <Tabs defaultValue="openai" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="openai">OpenAI</TabsTrigger>
          <TabsTrigger value="bot">Bot Assistant</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
        </TabsList>

        {/* Configuration OpenAI */}
        <TabsContent value="openai" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    Configuration OpenAI
                    {config.openai.configured && (
                      <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    Configurez votre clé API OpenAI pour activer l'assistant IA.
                  </CardDescription>
                </div>
                <Badge variant={config.openai.configured ? 'default' : 'destructive'}>
                  {config.openai.configured ? 'Configuré' : 'Non configuré'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleOpenAISubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Clé API OpenAI *</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={openaiForm.apiKey}
                      onChange={(e) => setOpenaiForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Votre clé API OpenAI. Vous pouvez l'obtenir sur{' '}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      platform.openai.com
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgId">ID Organisation (optionnel)</Label>
                  <Input
                    id="orgId"
                    placeholder="org-..."
                    value={openaiForm.orgId}
                    onChange={(e) => setOpenaiForm(prev => ({ ...prev, orgId: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    ID de votre organisation OpenAI (optionnel)
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleTestConnection}
                    disabled={testing || !openaiForm.apiKey.trim()}
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    {testing ? 'Test en cours...' : 'Tester'}
                  </Button>
                </div>
              </form>

              {config.openai.configured && (
                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>OpenAI configuré avec le modèle {config.openai.model}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Bot */}
        <TabsContent value="bot" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du Bot Assistant</CardTitle>
              <CardDescription>
                Personnalisez le comportement de votre assistant testeur.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBotSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="style">Style de Communication</Label>
                  <Select 
                    value={botForm.style} 
                    onValueChange={(value) => setBotForm(prev => ({ ...prev, style: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professionnel</SelectItem>
                      <SelectItem value="casual">Décontracté</SelectItem>
                      <SelectItem value="technical">Technique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select 
                    value={botForm.language} 
                    onValueChange={(value) => setBotForm(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detailLevel">Niveau de Détail</Label>
                  <Select 
                    value={botForm.detailLevel} 
                    onValueChange={(value) => setBotForm(prev => ({ ...prev, detailLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basique</SelectItem>
                      <SelectItem value="intermediate">Intermédiaire</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder les Paramètres
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Système */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion de la Configuration</CardTitle>
              <CardDescription>
                Sauvegardez, restaurez ou réinitialisez votre configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Sauvegarde et Restauration</h4>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={exportConfig}>
                      <Download className="mr-2 h-4 w-4" />
                      Exporter la Configuration
                    </Button>
                    <div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        className="hidden"
                        id="config-import"
                      />
                      <Button variant="outline" asChild>
                        <label htmlFor="config-import" className="cursor-pointer flex items-center">
                          <Upload className="mr-2 h-4 w-4" />
                          Importer la Configuration
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Réinitialisation</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Attention : Cette action supprimera toute votre configuration actuelle.
                  </p>
                  <Button variant="destructive" onClick={resetConfig}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Réinitialiser la Configuration
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Informations Système</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Version :</span>
                    <span className="ml-2">1.0.0</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">API Backend :</span>
                    <span className="ml-2">{config.api.baseUrl}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">OpenAI :</span>
                    <span className="ml-2">
                      {config.openai.configured ? (
                        <Badge variant="default" className="text-xs">Configuré</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Non configuré</Badge>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modèle :</span>
                    <span className="ml-2">{config.openai.model}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigPage;

