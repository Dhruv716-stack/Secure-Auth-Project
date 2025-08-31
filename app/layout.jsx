"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
require("./globals.css");
const AuthContext_1 = require("@/contexts/AuthContext");
const SessionBatcher_1 = require("@/components/SessionBatcher");
const TransactionEventContext_1 = require("@/contexts/TransactionEventContext");
exports.metadata = {
    title: 'v0 App',
    description: 'Created with v0',
    generator: 'v0.dev',
};
function RootLayout({ children, }) {
    return (<html lang="en">
      <body>
        <AuthContext_1.AuthProvider>
          <TransactionEventContext_1.TransactionEventProvider>
            <SessionBatcher_1.SessionBatcher />
            {children}
          </TransactionEventContext_1.TransactionEventProvider>
        </AuthContext_1.AuthProvider>
      </body>
    </html>);
}
