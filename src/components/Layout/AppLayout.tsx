import React from 'react';
import { Sidebar } from './Sidebar';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { TopBar } from '../Navigation/TopBar';
import './AppLayout.css';

export const AppLayout = observer(({ children }: { children: React.ReactNode }) => {
    return (
        <div className="app-layout">
            {store.isSidebarOpen && <Sidebar />}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
});
