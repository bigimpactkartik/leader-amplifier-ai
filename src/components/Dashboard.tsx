import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Lightbulb, FileText, Globe, BarChart3, MessageSquare, User, Settings, LogOut, Users, Calendar } from "lucide-react";
import IdeasTab from "./dashboard-tabs/IdeasTab";
import ContentTab from "./dashboard-tabs/ContentTab";
import SourcesTab from "./dashboard-tabs/SourcesTab";
import TrackingTab from "./dashboard-tabs/TrackingTab";
import PromptsTab from "./dashboard-tabs/PromptsTab";
import UsersTab from "./dashboard-tabs/UsersTab";
import ScheduledPostsTab from "./dashboard-tabs/ScheduledPostsTab";
import UserProfile from "./UserProfile";
import { useUsers } from "@/hooks/useUsers";
import { useIdeas } from "@/hooks/useIdeas";
import { useContents } from "@/hooks/useContents";
import { useSources } from "@/hooks/useSources";

interface DashboardProps {
  onBack: () => void;
}

const Dashboard = ({ onBack }: DashboardProps) => {
  const { currentUser, logout } = useUsers();
  const { ideas } = useIdeas();
  const { contents } = useContents();
  const { sources } = useSources();
  const [activeTab, setActiveTab] = useState("ideas");

  const handleSignOut = () => {
    logout();
    // Since we removed the login page, just reload the page
    window.location.reload();
  };

  // Calculate stats
  const totalIdeas = ideas.length;
  const contentGenerated = contents.length;
  const activeSources = sources.filter(source => source.key === 'Active').length;
  
  // Calculate engagement rate (mock calculation based on published content)
  const publishedContent = contents.filter(content => content.status === 'published').length;
  const engagementRate = contentGenerated > 0 ? ((publishedContent / contentGenerated) * 12.5).toFixed(1) : '0.0';

  // Calculate growth percentages (mock data)
  const getGrowthPercentage = (current: number, base: number = 20) => {
    const growth = ((current - base) / base * 100);
    return growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">LeaderAmplifierAi</h1>
          <p className="text-sm text-gray-300 mt-1">Content Automation</p>
        </div>
        
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Main
            </div>
            <Button variant="ghost" className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white">
              <LayoutDashboard className="mr-3 h-4 w-4" />
              Dashboard
            </Button>
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {currentUser?.name || "Demo User"}
              </p>
              <p className="text-xs text-gray-400">
                {currentUser?.email || "demo@example.com"}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="flex-1 text-gray-300 hover:bg-gray-700 hover:text-white">
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 text-gray-300 hover:bg-gray-700 hover:text-white" 
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-sm shadow-lg border-b border-white/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Dashboard</h2>
              <p className="text-gray-200">Manage your content automation</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-300">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Total Ideas</CardTitle>
                <Lightbulb className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalIdeas}</div>
                <p className="text-xs text-green-400">{getGrowthPercentage(totalIdeas)} from last month</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Content Generated</CardTitle>
                <FileText className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{contentGenerated}</div>
                <p className="text-xs text-green-400">{getGrowthPercentage(contentGenerated, 100)} from last month</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Active Sources</CardTitle>
                <Globe className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{activeSources}</div>
                <p className="text-xs text-green-400">+{Math.max(0, activeSources - 5)} new this week</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Engagement Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{engagementRate}%</div>
                <p className="text-xs text-green-400">+2.1% from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-8 bg-white/10 backdrop-blur-sm border-white/20">
              <TabsTrigger value="ideas" className="flex items-center space-x-2 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                <Lightbulb className="h-4 w-4" />
                <span>Ideas</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center space-x-2 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                <FileText className="h-4 w-4" />
                <span>Content</span>
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="flex items-center space-x-2 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                <Calendar className="h-4 w-4" />
                <span>Scheduled</span>
              </TabsTrigger>
              <TabsTrigger value="sources" className="flex items-center space-x-2 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                <Globe className="h-4 w-4" />
                <span>Sources</span>
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center space-x-2 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4" />
                <span>Tracking</span>
              </TabsTrigger>
              <TabsTrigger value="prompts" className="flex items-center space-x-2 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                <MessageSquare className="h-4 w-4" />
                <span>Prompts</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center space-x-2 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ideas">
              <IdeasTab />
            </TabsContent>

            <TabsContent value="content">
              <ContentTab />
            </TabsContent>

            <TabsContent value="scheduled">
              <ScheduledPostsTab />
            </TabsContent>

            <TabsContent value="sources">
              <SourcesTab />
            </TabsContent>

            <TabsContent value="tracking">
              <TrackingTab />
            </TabsContent>

            <TabsContent value="prompts">
              <PromptsTab />
            </TabsContent>

            <TabsContent value="users">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <UsersTab />
                </div>
                <div>
                  <UserProfile />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;