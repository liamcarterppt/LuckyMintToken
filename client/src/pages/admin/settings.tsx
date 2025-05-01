import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/components/layout/AdminLayout";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface SystemSettings {
  id: number;
  telegramAuthEnabled: boolean;
  telegramBotToken?: string;
  bnbRpcUrl: string;
  rewardsContractAddress?: string;
  tokenName: string;
  tokenSymbol: string;
  adminWalletAddress?: string;
  referralReward: number;
  updatedAt: string;
}

export default function AdminSettings() {
  const [formData, setFormData] = useState<Partial<SystemSettings>>({
    telegramAuthEnabled: true,
    telegramBotToken: "",
    bnbRpcUrl: "https://bsc-dataseed.binance.org/",
    rewardsContractAddress: "",
    tokenName: "Lucky Mint Token",
    tokenSymbol: "LKMT",
    adminWalletAddress: "",
    referralReward: 75,
  });
  
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();
  
  // Get system settings
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      return apiRequest("/api/admin/settings");
    },
  });
  
  // Update settings when data is fetched
  useEffect(() => {
    if (data?.settings) {
      setFormData(data.settings);
    }
  }, [data]);
  
  // Update settings mutation
  const { mutate: updateSettings, isPending } = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/settings", {
        method: "PATCH",
        data: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings updated successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });
  
  // Handle form field changes
  const handleChange = (field: keyof SystemSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings();
  };
  
  // Test web3 connection
  const testWeb3Connection = async () => {
    try {
      setIsTesting(true);
      const response = await apiRequest("/api/admin/settings/test-rpc", {
        method: "POST",
        data: { rpcUrl: formData.bnbRpcUrl },
      });
      
      if (response.success) {
        toast({
          title: "Connection Successful",
          description: `Connected to network: ${response.network}`,
          variant: "success",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: response.error || "Failed to connect to the RPC URL",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to the RPC URL",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <AdminLayout title="System Settings">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings and integrations
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* General Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Basic configuration for the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tokenName">Token Name</Label>
                <Input
                  id="tokenName"
                  value={formData.tokenName || ""}
                  onChange={(e) => handleChange("tokenName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenSymbol">Token Symbol</Label>
                <Input
                  id="tokenSymbol"
                  value={formData.tokenSymbol || ""}
                  onChange={(e) => handleChange("tokenSymbol", e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="referralReward">Referral Reward (LKMT)</Label>
              <Input
                id="referralReward"
                type="number"
                min="0"
                step="any"
                value={formData.referralReward || 0}
                onChange={(e) => handleChange("referralReward", parseFloat(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                Amount of LKMT tokens awarded for each successful referral
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Telegram Integration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Telegram Integration</CardTitle>
            <CardDescription>
              Settings for Telegram authentication and bot functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="telegramAuthEnabled">Enable Telegram Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to sign in with their Telegram account
                </p>
              </div>
              <Switch
                id="telegramAuthEnabled"
                checked={formData.telegramAuthEnabled}
                onCheckedChange={(value) => handleChange("telegramAuthEnabled", value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telegramBotToken">Telegram Bot Token</Label>
              <Input
                id="telegramBotToken"
                type="password"
                value={formData.telegramBotToken || ""}
                onChange={(e) => handleChange("telegramBotToken", e.target.value)}
                placeholder="Enter your Telegram bot token from BotFather"
              />
              <p className="text-sm text-muted-foreground">
                Required for secure authentication. Create a bot on Telegram via BotFather to get your token.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Blockchain Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Blockchain Settings</CardTitle>
            <CardDescription>
              Configuration for BNB Chain integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bnbRpcUrl">BNB Chain RPC URL</Label>
              <div className="flex gap-2">
                <Input
                  id="bnbRpcUrl"
                  value={formData.bnbRpcUrl || ""}
                  onChange={(e) => handleChange("bnbRpcUrl", e.target.value)}
                  placeholder="https://bsc-dataseed.binance.org/"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={testWeb3Connection}
                  disabled={isTesting || !formData.bnbRpcUrl}
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                URL for connecting to the BNB Smart Chain network
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminWalletAddress">Admin Wallet Address</Label>
              <Input
                id="adminWalletAddress"
                value={formData.adminWalletAddress || ""}
                onChange={(e) => handleChange("adminWalletAddress", e.target.value)}
                placeholder="0x..."
              />
              <p className="text-sm text-muted-foreground">
                The wallet address used to distribute tokens to users
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rewardsContractAddress">Rewards Token Contract Address</Label>
              <Input
                id="rewardsContractAddress"
                value={formData.rewardsContractAddress || ""}
                onChange={(e) => handleChange("rewardsContractAddress", e.target.value)}
                placeholder="0x..."
              />
              <p className="text-sm text-muted-foreground">
                The address of your ERC-20/BEP-20 token contract for rewards
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="gap-2" 
            size="lg"
            disabled={isPending || isLoading}
          >
            {isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}