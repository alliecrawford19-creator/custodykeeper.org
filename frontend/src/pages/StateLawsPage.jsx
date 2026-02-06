import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, API } from "@/App";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Scale, ExternalLink, Search, MapPin, BookOpen } from "lucide-react";

export default function StateLawsPage() {
  const { user, token } = useAuth();
  const [stateLaws, setStateLaws] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStateLaws();
  }, []);

  const fetchStateLaws = async () => {
    try {
      const response = await axios.get(`${API}/state-laws`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStateLaws(response.data.states);
    } catch (error) {
      console.error("Failed to fetch state laws:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStates = Object.entries(stateLaws).filter(([state]) =>
    state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Put user's state first
  const sortedStates = filteredStates.sort((a, b) => {
    if (a[0] === user?.state) return -1;
    if (b[0] === user?.state) return 1;
    return a[0].localeCompare(b[0]);
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in" data-testid="state-laws-page">
        {/* Header */}
        <div>
          <h1 className="font-['Merriweather'] text-2xl sm:text-3xl font-bold text-[#1A202C]">
            State Family Law Statutes
          </h1>
          <p className="text-[#718096] mt-1">
            Direct links to family law statutes for each state - custody, divorce, child support, and domestic relations laws
          </p>
        </div>

        {/* User's State Highlight */}
        {user?.state && stateLaws[user.state] && (
          <Card className="bg-gradient-to-r from-[#E8F6F3] to-[#FDFBF7] border-[#2C3E50]/20" data-testid="user-state-card">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#2C3E50] flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-[#718096] flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> Your State's Family Law
                    </p>
                    <h2 className="font-['Merriweather'] text-2xl font-bold text-[#1A202C]">
                      {user.state}
                    </h2>
                    <p className="text-sm text-[#718096] mt-1">
                      {stateLaws[user.state].name}
                    </p>
                  </div>
                </div>
                <a
                  href={stateLaws[user.state].statutes}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    className="bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-full btn-hover"
                    data-testid="user-state-link-btn"
                  >
                    View Family Law Statutes <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718096]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a state..."
            className="pl-12 h-12 bg-white border-[#E2E8F0]"
            data-testid="state-search-input"
          />
        </div>

        {/* States Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedStates.map(([state, data], index) => (
            <Card
              key={state}
              className={`bg-white border-[#E2E8F0] card-hover animate-fade-in ${
                state === user?.state ? "ring-2 ring-[#2C3E50]/30" : ""
              }`}
              data-testid={`state-card-${state.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#E8F6F3] flex items-center justify-center">
                        <Scale className="w-5 h-5 text-[#2C3E50]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1A202C]">{state}</h3>
                        {state === user?.state && (
                          <span className="text-xs text-[#718096]">Your state</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[#718096] line-clamp-2">{data.name}</p>
                  <a
                    href={data.statutes}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#2C3E50] hover:text-[#34495E] transition-colors"
                    data-testid={`state-link-${state.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    View Statutes <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStates.length === 0 && (
          <Card className="bg-white border-[#E2E8F0]">
            <CardContent className="py-16">
              <div className="empty-state">
                <Scale className="w-16 h-16 text-[#718096] opacity-50" />
                <h3 className="font-['Merriweather'] text-xl font-bold text-[#1A202C] mt-4">
                  No matching states
                </h3>
                <p className="text-[#718096] mt-2">
                  Try a different search term
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-[#FDFBF7] border-[#E2E8F0]">
          <CardContent className="p-6">
            <h3 className="font-['Merriweather'] font-bold text-[#1A202C] mb-2">
              About These Resources
            </h3>
            <p className="text-[#718096] text-sm">
              These links take you directly to your state's family law statutes covering custody, 
              child support, divorce, parenting plans, and domestic relations. Each state has different 
              laws, so review your specific state's statutes carefully. This is for informational 
              purposes only and does not constitute legal advice. Always consult with a licensed 
              family law attorney in your state for legal guidance.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
