"use strict";
"use client";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthActivity = AuthActivity;
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const scroll_area_1 = require("@/components/ui/scroll-area");
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
function AuthActivity() {
    const [activities, setActivities] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        function fetchActivities() {
            return __awaiter(this, void 0, void 0, function* () {
                setLoading(true);
                try {
                    const res = yield fetch("/api/auth-activity");
                    const data = yield res.json();
                    setActivities(data.activities || []);
                }
                catch (_a) {
                    setActivities([]);
                }
                finally {
                    setLoading(false);
                }
            });
        }
        fetchActivities();
    }, []);
    return (<card_1.Card className="h-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <card_1.CardHeader className="pb-3 md:pb-4">
        <card_1.CardTitle className="flex items-center space-x-2 md:space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
            <lucide_react_1.Shield className="h-4 w-4 md:h-5 md:w-5 text-indigo-600"/>
          </div>
          <span className="text-base md:text-lg font-semibold">Auth Activity</span>
        </card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent className="p-0">
        <scroll_area_1.ScrollArea className="h-[300px] md:h-[400px] px-4 md:px-6">
          <div className="space-y-2 md:space-y-3">
            {loading ? (<div className="text-center text-gray-400 py-8">Loading...</div>) : activities.length === 0 ? (<div className="text-center text-gray-400 py-8">No auth activity found.</div>) : (activities.map((activity) => (<div key={activity.id} className="p-3 rounded-lg border bg-white">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    {activity.device && (activity.device.includes("iPhone") || activity.device.includes("Android")) ? (<lucide_react_1.Smartphone className="h-3 w-3 md:h-4 md:w-4 text-gray-500 flex-shrink-0"/>) : (<lucide_react_1.Monitor className="h-3 w-3 md:h-4 md:w-4 text-gray-500 flex-shrink-0"/>)}
                    <span className="font-medium text-xs md:text-sm truncate">{activity.type}</span>
                  </div>
                  <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                    {activity.status === "Success" ? (<lucide_react_1.CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500"/>) : (<lucide_react_1.XCircle className="h-3 w-3 md:h-4 md:w-4 text-red-500"/>)}
                    <badge_1.Badge variant={activity.status === "Success" ? "secondary" : "destructive"} className={`text-xs ${activity.status === "Success" ? "bg-green-100 text-green-800" : ""}`}>
                      {activity.status}
                    </badge_1.Badge>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500 mt-1">
                    <p className="truncate">IP: {activity.ip || "-"}</p>
                    <p className="truncate">Device: {activity.device || "-"}</p>
                    <p className="truncate">Location: {activity.location || "-"}</p>
                    <span className="text-xs">{activity.createdAt ? new Date(activity.createdAt).toLocaleString() : "-"}</span>
                  </div>
                </div>)))}
          </div>
        </scroll_area_1.ScrollArea>
      </card_1.CardContent>
    </card_1.Card>);
}
