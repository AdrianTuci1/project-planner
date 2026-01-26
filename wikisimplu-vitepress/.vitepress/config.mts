import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "WikiSimplu",
    description: "Task Management Application Documentation",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: '🏠 Home', link: '/' },
            { text: '✨ Features', link: '/features/tasks' }
        ],

        sidebar: [
            {
                text: '🏁 Getting Started',
                items: [
                    { text: '👋 Welcome', link: '/' },
                    { text: '🚀 Getting Started', link: '/getting-started' }
                ]
            },
            {
                text: '✨ Features',
                items: [
                    { text: '✅ Tasks', link: '/features/tasks' },
                    { text: '📥 Inbox', link: '/features/inbox' },
                    { text: '📝 Lists', link: '/features/lists' },
                    { text: '📋 Kanban Board', link: '/features/kanban' },
                    { text: '⏳ Timebox', link: '/features/timebox' },
                    { text: '🔔 Notifications', link: '/features/notifications' },
                    { text: '⌨️ Keyboard Shortcuts', link: '/features/shortcuts' },
                    { text: '🌅 Daily Planning', link: '/features/planning' },
                    { text: '📊 Analytics', link: '/features/analytics' }
                ]
            },
            {
                text: '📱 Apps',
                items: [
                    { text: '🍎 iPhone & iPad', link: '/apps/mobile' },
                    { text: '💻 Mac App', link: '/apps/mac' },
                    { text: '🪟 Windows App', link: '/apps/windows' }
                ]
            },
            {
                text: '🔌 Integrations',
                items: [
                    { text: '🔌 Integrations', link: '/integrations' }
                ]
            }
        ],

        socialLinks: [
        ]
    }
})
