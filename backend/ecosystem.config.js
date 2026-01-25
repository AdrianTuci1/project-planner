module.exports = {
    apps: [{
        name: 'project-management-backend',
        script: './dist/server.js',
        instances: 1,
        exec_mode: 'fork',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
        },
        env_file: '.env',
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        // Asigură-te că PM2 rulează din directorul corect
        cwd: '/Users/adriantucicovenco/Proiecte/project-management/backend'
    }]
};
