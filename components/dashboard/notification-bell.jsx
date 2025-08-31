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
exports.NotificationBell = NotificationBell;
const react_1 = require("react");
const react_2 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const popover_1 = require("@/components/ui/popover");
const badge_1 = require("@/components/ui/badge");
function NotificationBell() {
    const [notifications, setNotifications] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const popoverOpen = (0, react_2.useRef)(false);
    (0, react_1.useEffect)(() => {
        function fetchNotifications() {
            return __awaiter(this, void 0, void 0, function* () {
                setLoading(true);
                try {
                    const res = yield fetch("/api/notifications");
                    const data = yield res.json();
                    setNotifications(data.notifications || []);
                }
                catch (_a) {
                    setNotifications([]);
                }
                finally {
                    setLoading(false);
                }
            });
        }
        fetchNotifications();
    }, []);
    const alertCount = notifications.filter((n) => n.type === "alert" && !n.read).length;
    // Mark all as read when popover opens
    const handleOpenChange = (open) => __awaiter(this, void 0, void 0, function* () {
        if (open && !popoverOpen.current) {
            popoverOpen.current = true;
            yield fetch("/api/notifications", { method: "PATCH" });
            // Refetch notifications to update state
            const res = yield fetch("/api/notifications");
            const data = yield res.json();
            setNotifications(data.notifications || []);
        }
        else if (!open) {
            popoverOpen.current = false;
        }
    });
    return (<popover_1.Popover onOpenChange={handleOpenChange}>
      <popover_1.PopoverTrigger asChild>
        <button_1.Button variant="ghost" size="sm" className="relative p-2">
          <lucide_react_1.Bell className="h-4 w-4 md:h-5 md:w-5"/>
          {alertCount > 0 ? (<badge_1.Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {alertCount}
            </badge_1.Badge>) : null}
        </button_1.Button>
      </popover_1.PopoverTrigger>
      <popover_1.PopoverContent className="w-72 md:w-80" align="end">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm md:text-base">Notifications</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {loading ? (<div className="text-center text-gray-400 py-8">Loading...</div>) : notifications.length === 0 ? (<div className="text-center text-gray-400 py-8">No notifications.</div>) : (notifications.map((notification) => (<div key={notification.id} className={`p-3 rounded-lg border bg-gray-50 ${notification.type === 'alert' ? 'border-red-300' : notification.type === 'success' ? 'border-green-300' : ''}`}>
                <p className="text-xs md:text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}</p>
              </div>)))}
          </div>
        </div>
      </popover_1.PopoverContent>
    </popover_1.Popover>);
}
