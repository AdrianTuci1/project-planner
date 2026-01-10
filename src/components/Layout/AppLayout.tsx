import React from 'react';
import { Sidebar } from './Sidebar';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { TopBar } from '../Navigation/TopBar';
import './AppLayout.css';

import { Analytics } from '../Analytics/Analytics';

export const AppLayout = observer(({ children }: { children: React.ReactNode }) => {
    return (
        <div className="app-layout">
            <Analytics />
            {!store.isAnalyticsOpen && (
                <>
                    {store.isSidebarOpen && <Sidebar />}
                    <main className="main-content">
                        {children}
                    </main>
                </>
            )}
        </div>
    );
});
